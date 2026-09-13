type Bucket = { hits: number[]; };

const buckets = new Map<string, Bucket>();
const WINDOW_MS = 10 * 60 * 1000; // 10 min
const MAX_ATTEMPTS = 10;

export function checkRateLimit(key: string): { allowed: boolean; retryAfterSec: number } {
  const now = Date.now();
  const bucket = buckets.get(key) ?? { hits: [] };
  bucket.hits = bucket.hits.filter((t) => now - t < WINDOW_MS);

  if (bucket.hits.length >= MAX_ATTEMPTS) {
    const oldest = bucket.hits[0];
    buckets.set(key, bucket);
    return { allowed: false, retryAfterSec: Math.ceil((WINDOW_MS - (now - oldest)) / 1000) };
  }

  bucket.hits.push(now);
  buckets.set(key, bucket);

  // Opportunistic cleanup so the map doesn't grow unbounded.
  if (buckets.size > 1000) {
    for (const [k, b] of buckets) {
      if (b.hits.every((t) => now - t >= WINDOW_MS)) buckets.delete(k);
    }
  }

  return { allowed: true, retryAfterSec: 0 };
}

export function clientKey(request: Request): string {
  const fwd =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";
  return fwd;
}
