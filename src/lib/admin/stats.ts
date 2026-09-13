import { db } from "@/db";
import { articles, collectedItems, pipelineRuns } from "@/db/schema";
import { count, desc, eq, sql } from "drizzle-orm";

export type DashboardStats = {
  todayCollected: number;
  published: number;
  pending: number;
  retryable: number;
  permanentlyFailed: number;
  lastRunAt: string | null;
  lastRunStatus: string | null;
};

export async function getDashboardStats(): Promise<DashboardStats> {
  const [todayCollected] = await db
    .select({ value: count() })
    .from(collectedItems)
    .where(sql`${collectedItems.createdAt} >= CURRENT_DATE`);

  const [published] = await db
    .select({ value: count() })
    .from(articles)
    .where(eq(articles.status, "published"));

  const [pending] = await db
    .select({ value: count() })
    .from(collectedItems)
    .where(eq(collectedItems.status, "pending"));

  const [retryable] = await db
    .select({ value: count() })
    .from(collectedItems)
    .where(eq(collectedItems.status, "failed"));

  const [permanentlyFailed] = await db
    .select({ value: count() })
    .from(collectedItems)
    .where(eq(collectedItems.status, "permanently_failed"));

  const [lastRun] = await db
    .select({ startedAt: pipelineRuns.startedAt, status: pipelineRuns.status })
    .from(pipelineRuns)
    .orderBy(desc(pipelineRuns.startedAt))
    .limit(1);

  return {
    todayCollected: todayCollected.value,
    published: published.value,
    pending: pending.value,
    retryable: retryable.value,
    permanentlyFailed: permanentlyFailed.value,
    lastRunAt: lastRun?.startedAt?.toISOString() ?? null,
    lastRunStatus: lastRun?.status ?? null,
  };
}
