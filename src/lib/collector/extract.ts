import { extract } from "@extractus/article-extractor";
import { db } from "@/db";
import { collectedItems } from "@/db/schema";
import { and, eq, inArray, isNull, lte, or } from "drizzle-orm";
import { MAX_RETRIES, wordCount } from "@/lib/pipeline/config";
import { normalizeItemLimit } from "@/lib/pipeline/limits";
import { markItemFailed } from "@/lib/pipeline/item-status";

const EXTRACTION_TIMEOUT_MS = 10_000;
const MIN_WORD_COUNT = 50;
const MIN_LINE_WORD_COUNT = 6;
// Sized so a full batch finishes well inside maxDuration=60s: worst case is
// BATCH_LIMIT / CONCURRENCY waves x EXTRACTION_TIMEOUT_MS.
const BATCH_LIMIT = 48;
const CONCURRENCY = 10;

const AD_KEYWORDS = [
  "advertisement",
  "বিজ্ঞাপন",
  "আরও পড়ুন",
  "related:",
  "share this",
  "share this article",
  "read more",
  "click here",
  "subscribe now",
  "newsletter",
];

function blockToNewline(input: string): string {
  return input
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<\/div>/gi, "\n")
    .replace(/<\/li>/gi, "\n")
    .replace(/<\/h[1-6]>/gi, "\n")
    .replace(/<\/tr>/gi, "\n");
}

function plainText(html: string): string {
  return String(html || "")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/[^\S\n]+/g, " ")
    .trim();
}

function isAdLine(line: string): boolean {
  const lower = line.toLowerCase();
  return AD_KEYWORDS.some((kw) => lower.includes(kw));
}

function hasMultipleLinks(line: string): boolean {
  const linkCount = (line.match(/https?:\/\//g) || []).length;
  return linkCount >= 2;
}

function cleanupText(raw: string): string {
  const withBreaks = blockToNewline(raw);
  const text = plainText(withBreaks);

  const lines = text
    .split(/\n/)
    .map((l) => l.trim())
    .filter((line) => {
      if (!line) return false;
      if (wordCount(line) < MIN_LINE_WORD_COUNT) return false;
      if (isAdLine(line)) return false;
      if (hasMultipleLinks(line)) return false;
      return true;
    });

  return lines.join("\n\n");
}

function timeoutPromise(ms: number): { promise: Promise<never>; clear: () => void } {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const promise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`Extraction timed out after ${ms}ms`)), ms);
  });
  return {
    promise,
    clear: () => {
      if (timer !== undefined) clearTimeout(timer);
    },
  };
}

async function extractWithTimeout(url: string, timeoutMs: number): Promise<string | null> {
  const timeout = timeoutPromise(EXTRACTION_TIMEOUT_MS);
  try {
    const article = await Promise.race([
      extract(url, { contentLengthThreshold: 100 }),
      timeout.promise,
    ]);

    if (!article?.content) return null;

    const cleaned = cleanupText(article.content);

    if (wordCount(cleaned) < MIN_WORD_COUNT) {
      return null;
    }

    return cleaned;
  } catch {
    return null;
  } finally {
    // Release the timer promptly; otherwise one pending timer per item keeps
    // the event loop alive up to 10s after the last extraction finishes.
    timeout.clear();
  }
}

export type ExtractResult = {
  id: number;
  sourceLink: string;
  success: boolean;
  wordCount: number;
  error: string | null;
};

async function processItem(item: { id: number; sourceLink: string }): Promise<ExtractResult> {
  const result: ExtractResult = {
    id: item.id,
    sourceLink: item.sourceLink,
    success: false,
    wordCount: 0,
    error: null,
  };

  try {
    const fullText = await extractWithTimeout(item.sourceLink, EXTRACTION_TIMEOUT_MS);

    if (fullText) {
      // Explicitly reset to "pending" so retried ("failed") items re-enter the writer phase.
      await db
        .update(collectedItems)
        .set({ fullText, status: "pending" })
        .where(eq(collectedItems.id, item.id));
      result.success = true;
      result.wordCount = wordCount(fullText);
    } else {
      // Extraction failed or text too short: escalate retry count instead of
      // leaving the item stuck in "pending" forever.
      result.error = "extraction_failed_or_too_short";
      await markItemFailed(item.id);
    }
  } catch (err) {
    result.error = err instanceof Error ? err.message : String(err);
    try {
      await markItemFailed(item.id);
    } catch {
      // best effort — the next run will retry this item
    }
  }

  return result;
}

export async function extractPendingItems(maxItems?: number): Promise<ExtractResult[]> {
  // Both fresh ("pending") and retriable ("failed") items are eligible; items
  // that already have full text are skipped.
  const limit = normalizeItemLimit(maxItems, BATCH_LIMIT);
  const pendingItems = await db
    .select({
      id: collectedItems.id,
      sourceLink: collectedItems.sourceLink,
    })
    .from(collectedItems)
    .where(
      and(
        inArray(collectedItems.status, ["pending", "failed"]),
        lte(collectedItems.retryCount, MAX_RETRIES),
        or(isNull(collectedItems.fullText), eq(collectedItems.fullText, "")),
      ),
    )
    .limit(limit);

  const results: ExtractResult[] = new Array(pendingItems.length);
  let cursor = 0;

  async function worker(): Promise<void> {
    while (cursor < pendingItems.length) {
      const index = cursor++;
      results[index] = await processItem(pendingItems[index]);
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(CONCURRENCY, pendingItems.length) }, () => worker()),
  );

  return results;
}
