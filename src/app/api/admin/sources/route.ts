import { NextResponse } from "next/server";
import { db } from "@/db";
import { sources } from "@/db/schema";

export const dynamic = "force-dynamic";

export async function GET(): Promise<NextResponse> {
  const all = await db.select().from(sources);
  return NextResponse.json(all);
}

export async function POST(request: Request): Promise<NextResponse> {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const sourceName = typeof body.sourceName === "string" ? body.sourceName.trim() : "";
  const feedUrl = typeof body.feedUrl === "string" ? body.feedUrl.trim() : "";
  const region = body.region === "international" ? "international" : "bangladesh";

  if (!sourceName || !feedUrl) {
    return NextResponse.json({ error: "sourceName and feedUrl required" }, { status: 400 });
  }

  // Validate RSS/XML feed URL
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);
    const feedRes = await fetch(feedUrl, {
      signal: controller.signal,
      headers: { "User-Agent": "Mozilla/5.0 (compatible; sindbadmin/1.0)" },
    });
    clearTimeout(timeout);

    if (!feedRes.ok) {
      return NextResponse.json(
        { error: `Feed URL returned HTTP ${feedRes.status}` },
        { status: 400 },
      );
    }

    const contentType = feedRes.headers.get("content-type") || "";
    const feedText = await feedRes.text();

    // Check for RSS/XML markers in response body or content type
    const isXml = contentType.includes("xml") || contentType.includes("rss") ||
      feedText.includes("<rss") || feedText.includes("<feed") || feedText.includes("<?xml");

    if (!isXml) {
      return NextResponse.json(
        { error: "URL does not appear to be a valid RSS/Atom feed (no XML content found)" },
        { status: 400 },
      );
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: `Failed to fetch feed URL: ${msg}` },
      { status: 400 },
    );
  }

  try {
    const [row] = await db
      .insert(sources)
      .values({
        sourceName,
        feedUrl,
        region,
        websiteUrl: typeof body.websiteUrl === "string" && body.websiteUrl.trim() ? body.websiteUrl.trim() : null,
        categoryHint: typeof body.categoryHint === "string" && body.categoryHint.trim() ? body.categoryHint.trim() : null,
      })
      .returning();

    return NextResponse.json(row, { status: 201 });
  } catch (err: unknown) {
    if (err && typeof err === "object" && "code" in err && err.code === "23505") {
      return NextResponse.json({ error: "A source with this feed URL already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: "Failed to create source" }, { status: 500 });
  }
}
