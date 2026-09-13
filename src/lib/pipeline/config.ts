export const VALID_CATEGORIES = [
  "politics",
  "sports",
  "technology",
  "business",
  "international",
  "entertainment",
  "health",
  "other",
];

export type CategorySlug = (typeof VALID_CATEGORIES)[number];

export const MAX_RETRIES = 3;

// Option B (Vercel Hobby, maxDuration=60s): cap how many items a single cron
// run processes so the whole pipeline reliably finishes inside 60s. The cron
// runs every 15 min, so leftover items are picked up by subsequent runs.
export const DEFAULT_MAX_ITEMS_PER_RUN = 3;
export const MAX_ITEMS_PER_RUN_HARD_CAP = 10;

export const BATCH_MIN = 5;
// Each batch asks the AI to rewrite every item in BOTH Bangla and English (long
// bodies), so a 10-item batch regularly exceeds the provider's 8192-token
// output cap and the JSON gets truncated (breaking parseAiResponse). 5 items
// keeps every response comfortably inside the limit.
export const BATCH_MAX = 5;

export const HEADLINE_MIN_WORDS = 3;
export const HEADLINE_MAX_WORDS = 25;
export const SUMMARY_MIN_WORDS = 15;
export const SUMMARY_MAX_WORDS = 100;

export function wordCount(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}
