export function normalizeUrl(raw: string): string {
  try {
    const url = new URL(raw.trim());
    url.hash = "";
    url.hostname = url.hostname.toLowerCase();
    const tracking = [
      "utm_source",
      "utm_medium",
      "utm_campaign",
      "utm_term",
      "utm_content",
      "fbclid",
      "gclid",
      "mc_cid",
      "mc_eid",
    ];
    for (const key of tracking) url.searchParams.delete(key);
    if (url.pathname.length > 1) {
      url.pathname = url.pathname.replace(/\/+$/, "");
    }
    return url.toString();
  } catch {
    return raw.trim().toLowerCase();
  }
}

export function makeSlug(title: string, uniqueSuffix?: string | number): string {
  const base = title
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 72);
  const suffix = uniqueSuffix === undefined ? "" : `-${uniqueSuffix}`;
  return `${base || "songbad"}${suffix}`;
}
