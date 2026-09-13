import { db } from "@/db";
import { collectedItems } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { MAX_RETRIES } from "./config";

/**
 * Unified failure semantics for collected items.
 * Atomic retry-count increment; becomes permanent at MAX_RETRIES.
 * Consistent across extraction, writer, and rule-engine failures.
 */
export async function markItemFailed(id: number): Promise<void> {
  await db
    .update(collectedItems)
    .set({
      retryCount: sql`${collectedItems.retryCount} + 1`,
      status: sql`CASE WHEN ${collectedItems.retryCount} + 1 >= ${MAX_RETRIES} THEN 'permanently_failed' ELSE 'failed' END`,
    })
    .where(eq(collectedItems.id, id));
}

/** For items that must never be retried (e.g. prompt-injection attempts). */
export async function markItemPermanentlyFailed(id: number): Promise<void> {
  await db
    .update(collectedItems)
    .set({ status: "permanently_failed" })
    .where(eq(collectedItems.id, id));
}
