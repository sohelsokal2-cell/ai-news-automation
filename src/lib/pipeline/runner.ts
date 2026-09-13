import { db } from "@/db";
import { pipelineRuns } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import {
  DEFAULT_MAX_ITEMS_PER_RUN,
  MAX_ITEMS_PER_RUN_HARD_CAP,
} from "./config";
import { runFullPipeline } from "./index";

export type PipelineRunSummary = {
  ok: boolean;
  locked?: boolean;
  elapsed: string;
  collected: number;
  duplicates: number;
  published: number;
  held: number;
  failed: number;
  maxItems?: number;
  runId?: number;
  errors?: string[];
};

/**
 * Detects Postgres "duplicate key" (SQLSTATE 23505) no matter how the driver
 * wraps it. drizzle-orm over `pg` can nest the raw DatabaseError under a
 * `cause` property instead of exposing `code` at the top level, which used to
 * make concurrent pipeline triggers throw a 500 instead of a clean 409.
 */
function isDuplicateKeyError(err: unknown): boolean {
  let current: { code?: unknown; cause?: unknown; message?: unknown } | undefined = err as {
    code?: unknown;
    cause?: unknown;
    message?: unknown;
  };
  for (let i = 0; i < 6 && current; i++) {
    if (current.code === "23505") return true;
    if (typeof current.message === "string" && current.message.includes("23505")) return true;
    current = current.cause as { code?: unknown; cause?: unknown; message?: unknown } | undefined;
  }
  return false;
}

/**
 * Runs the full pipeline under an atomic single-run lock and records the
 * result in pipeline_runs (which also powers the dashboard "last run" stat).
 *
 * Locking strategy: a partial unique index on (1) WHERE status='running'
 * makes the claim INSERT fail with 23505 when another run is active.
 * Stale runs (older than the max expected duration) are reaped first so a
 * crashed process can't block future runs forever.
 */
export async function runPipelineAndReport(
  requestedMaxItems?: number,
): Promise<PipelineRunSummary> {
  const start = Date.now();
  const errors: string[] = [];
  const STALE_RUN_MS = 10 * 60 * 1000; // 10 min

  // Option B: default 3 items/run; caller may override via ?limit= (clamped to
  // the hard cap so a single Vercel Hobby invocation stays inside 60s).
  let maxItems = DEFAULT_MAX_ITEMS_PER_RUN;
  if (requestedMaxItems !== undefined && Number.isFinite(requestedMaxItems)) {
    maxItems = Math.min(
      Math.max(Math.floor(requestedMaxItems), 1),
      MAX_ITEMS_PER_RUN_HARD_CAP,
    );
  }

  // Reap stale runs from crashed processes.
  await db.execute(
    sql`UPDATE pipeline_runs SET status = 'failed', finished_at = now(), errors = 'reaped: stale run'
        WHERE status = 'running' AND started_at < now() - interval '${sql.raw(String(STALE_RUN_MS))} milliseconds'`,
  );

  // Atomic claim: fails when an active run exists.
  let claimed: { id: number } | undefined;
  try {
    const rows = await db
      .insert(pipelineRuns)
      .values({ status: "running" })
      .returning({ id: pipelineRuns.id });
    claimed = rows[0];
  } catch (err) {
    if (isDuplicateKeyError(err)) {
      return {
        ok: false,
        locked: true,
        elapsed: "0s",
        collected: 0,
        duplicates: 0,
        published: 0,
        held: 0,
        failed: 0,
        errors: ["Another pipeline run is already in progress"],
      };
    }
    throw err;
  }
  const runId = claimed!.id;

  try {
    const result = await runFullPipeline({ maxItems });

    const collected = result.collect.reduce((sum, r) => sum + r.inserted, 0);
    const collectErrors = result.collect
      .filter((r) => r.error)
      .map((r) => `${r.feed}: ${r.error}`);
    errors.push(...collectErrors);

    const extractErrors = result.extract
      .filter((r) => r.error)
      .map((r) => `${r.sourceLink}: ${r.error}`);
    errors.push(...extractErrors);

    const duplicates = result.deduplicate.duplicatesMarked;

    const writeFailed = result.write.reduce((sum, r) => sum + r.failed, 0);
    const writeErrors = result.write
      .filter((r) => r.rateLimited)
      .map(() => "AI rate limited");
    // Surface whole-batch failures (e.g. invalid API key) once, not per item.
    const batchError = result.write.find((r) => r.batchError)?.batchError;
    if (batchError && !result.write.some((r) => r.rateLimited)) {
      writeErrors.push(`AI writer failed: ${batchError}`);
    }
    errors.push(...writeErrors);

    const published = result.ruleEngine.published;
    const held = writeFailed + result.ruleEngine.failed;

    const elapsed = ((Date.now() - start) / 1000).toFixed(1);

    await db
      .update(pipelineRuns)
      .set({
        status: "ok",
        finishedAt: new Date(),
        collected,
        duplicates,
        published,
        held,
        failed: held,
        errors: errors.length > 0 ? errors.join("\n") : null,
      })
      .where(eq(pipelineRuns.id, runId));

    return {
      ok: true,
      elapsed: `${elapsed}s`,
      collected,
      duplicates,
      published,
      held,
      failed: held,
      maxItems,
      runId,
      errors: errors.length > 0 ? errors : undefined,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    errors.push(msg);

    try {
      await db
        .update(pipelineRuns)
        .set({
          status: "failed",
          finishedAt: new Date(),
          failed: 1,
          errors: errors.join("\n"),
        })
        .where(eq(pipelineRuns.id, runId));
    } catch {
      // best effort — the stale-run reaper will clean this up
    }

    return {
      ok: false,
      elapsed: ((Date.now() - start) / 1000).toFixed(1) + "s",
      collected: 0,
      duplicates: 0,
      published: 0,
      held: 0,
      failed: 1,
      runId,
      errors,
    };
  }
}
