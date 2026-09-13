import { db } from "@/db";
import { collectedItems, sources } from "@/db/schema";
import { eq } from "drizzle-orm";
import { decodeEntities, stripHtml } from "@/lib/sanitize";
import { normalizeUrl } from "@/lib/urls";

type RssItem = {
  title: string;
  link: string;
  description: string;
  pubDate: Date | null;
  imageUrl: string | null;
};

function parseRssXml(xmlText: string): RssItem[] {
  const items: RssItem[] = [];
  // Support both RSS (<item>) and Atom (<entry>) feeds.
  const isAtom = /<feed[\s>][\s\S]*xmlns[^>]*atom/i.test(xmlText.slice(0, 2000));
  const itemMatches = xmlText.match(isAtom ? /<entry[\s>][\s\S]*?<\/entry>/gi : /<item[\s>][\s\S]*?<\/item>/gi) || [];

  for (const itemXml of itemMatches) {
    const title = extractTag(itemXml, "title");
    // RSS uses <link>text</link>; Atom uses <link href="..." ... />.
    const link = isAtom ? extractAtomLink(itemXml) : extractTag(itemXml, "link");
    const description =
      extractTag(itemXml, "description") ||
      extractTag(itemXml, "content:encoded") ||
      extractTag(itemXml, "summary") ||
      extractTag(itemXml, "content") ||
      "";

    if (!title || !link) continue;

    const pubDateStr =
      extractTag(itemXml, "pubDate") ||
      extractTag(itemXml, "dc:date") ||
      extractTag(itemXml, "updated") ||
      extractTag(itemXml, "published");
    const pubDate = pubDateStr ? safeParseDate(pubDateStr) : null;

    const imageUrl = extractImageUrl(itemXml);

    items.push({
      title: decodeEntities(title),
      // Feed XML escapes "&" as "&amp;" inside links/attributes; decode before
      // normalizing or the URL gets permanently mangled (&amp%3B...).
      link: normalizeUrl(decodeEntities(link)),
      description: decodeEntities(stripHtml(description)).slice(0, 2000),
      pubDate,
      imageUrl: imageUrl ? decodeEntities(imageUrl) : null,
    });
  }

  return items;
}

function extractAtomLink(itemXml: string): string | null {
  // Prefer rel="alternate" (or absent rel), fall back to the first link.
  const links = itemXml.match(/<link[^>]*>/gi) || [];
  for (const tag of links) {
    const rel = tag.match(/rel\s*=\s*["']([^"']*)["']/i);
    const href = tag.match(/href\s*=\s*["']([^"']*)["']/i);
    if (href && (!rel || rel[1] === "alternate")) return href[1].trim();
  }
  const anyHref = links[0]?.match(/href\s*=\s*["']([^"']*)["']/i);
  return anyHref ? anyHref[1].trim() : null;
}

function extractTag(xml: string, tag: string): string | null {
  const cdataMatch = xml.match(new RegExp(`<${tag}[^>]*>\\s*<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>\\s*</${tag}>`, "i"));
  if (cdataMatch) return cdataMatch[1].trim();

  const match = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i"));
  if (match) return match[1].trim();

  const selfClose = xml.match(new RegExp(`<${tag}[^>]*/>`, "i"));
  if (selfClose) {
    const valMatch = selfClose[0].match(/content\s*=\s*["']([^"']*)["']/i);
    return valMatch ? valMatch[1].trim() : null;
  }

  return null;
}

function extractImageUrl(itemXml: string): string | null {
  const mediaContent = itemXml.match(/<media:content[^>]*url\s*=\s*["']([^"']*)["']/i);
  if (mediaContent) return mediaContent[1];

  const mediaThumbnail = itemXml.match(/<media:thumbnail[^>]*url\s*=\s*["']([^"']*)["']/i);
  if (mediaThumbnail) return mediaThumbnail[1];

  const enclosure = itemXml.match(/<enclosure[^>]*url\s*=\s*["']([^"']*)["']/i);
  if (enclosure && /image/i.test(enclosure[0])) return enclosure[1];

  const imgInDesc = itemXml.match(/<description[^>]*>[\s\S]*?<img[^>]*src\s*=\s*["']([^"']*)["']/i);
  if (imgInDesc) return imgInDesc[1];

  return null;
}

function safeParseDate(str: string): Date | null {
  try {
    const d = new Date(str);
    return isNaN(d.getTime()) ? null : d;
  } catch {
    return null;
  }
}

async function fetchWithTimeout(url: string, timeoutMs = 15000): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; SongbadChakraBot/1.0; +https://songbadchakra.com)",
        Accept: "application/rss+xml, application/xml, text/xml, */*",
      },
    });
  } finally {
    clearTimeout(timer);
  }
}

export type CollectResult = {
  feed: string;
  inserted: number;
  skipped: number;
  error: string | null;
  /** true when the feed was skipped because pollInterval has not elapsed */
  notDue?: boolean;
};

type FeedSource = {
  id: number;
  sourceName: string;
  feedUrl: string;
  categoryHint: string | null;
  pollInterval: number;
  lastFetchedAt: Date | null;
};

async function collectFeed(feed: FeedSource): Promise<CollectResult> {
  const result: CollectResult = { feed: feed.sourceName, inserted: 0, skipped: 0, error: null };

  // Respect per-source pollInterval: skip feeds fetched recently. Flagged via
  // notDue (not error) so callers don't surface it as a failure.
  if (feed.lastFetchedAt) {
    const dueAt = feed.lastFetchedAt.getTime() + feed.pollInterval * 1000;
    if (Date.now() < dueAt) {
      result.notDue = true;
      return result;
    }
  }

  try {
    const response = await fetchWithTimeout(feed.feedUrl);
    if (!response.ok) {
      result.error = `HTTP ${response.status}`;
      return result;
    }

    const xml = await response.text();
    const items = parseRssXml(xml);

    if (items.length === 0) return result;

    const rows = items.map((item) => ({
      sourceName: feed.sourceName,
      sourceLink: item.link,
      title: item.title,
      excerpt: item.description,
      imageUrl: item.imageUrl,
      pubDate: item.pubDate,
      categoryHint: feed.categoryHint,
      status: "pending" as const,
    }));

    const inserted = await db
      .insert(collectedItems)
      .values(rows)
      .onConflictDoNothing({ target: collectedItems.sourceLink });

    result.inserted = inserted.rowCount ?? 0;
    result.skipped = items.length - result.inserted;

    await db
      .update(sources)
      .set({ lastFetchedAt: new Date() })
      .where(eq(sources.id, feed.id));
  } catch (err) {
    result.error = err instanceof Error ? err.message : String(err);
  }

  return result;
}

export async function collectAllFeeds(): Promise<CollectResult[]> {
  const activeSources = await db
    .select({
      id: sources.id,
      sourceName: sources.sourceName,
      feedUrl: sources.feedUrl,
      categoryHint: sources.categoryHint,
      pollInterval: sources.pollInterval,
      lastFetchedAt: sources.lastFetchedAt,
    })
    .from(sources)
    .where(eq(sources.isActive, true));

  // Parallel fetches with a bounded pool so one slow feed can't stall the run
  // (sequential fetching could exceed maxDuration with 10+ sources).
  const results: CollectResult[] = new Array(activeSources.length);
  let cursor = 0;

  async function worker(): Promise<void> {
    while (cursor < activeSources.length) {
      const index = cursor++;
      results[index] = await collectFeed(activeSources[index]);
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(5, activeSources.length) }, () => worker()),
  );

  // Not-due feeds are intentionally excluded from the report: they were not
  // polled and hold no result data.
  return results.filter((r) => !r.notDue);
}
