// Shared helper for Option B (per-run item cap): clamps an optional caller
// limit to [1, hardCap], falling back to `fallback` when absent/invalid.
export function normalizeItemLimit(
  requested: number | undefined,
  fallback: number,
  hardCap = 10,
): number {
  if (requested === undefined || !Number.isFinite(requested)) return fallback;
  const n = Math.floor(requested);
  if (n < 1) return fallback;
  return Math.min(n, hardCap);
}