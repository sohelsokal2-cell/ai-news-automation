import { NextResponse } from "next/server";
import { db } from "@/db";
import { collectedItems } from "@/db/schema";
import { eq, desc, sql } from "drizzle-orm";

export async function GET(request: Request): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const limitParam = Number(searchParams.get("limit") ?? "50");
  const offsetParam = Number(searchParams.get("offset") ?? "0");
  const limit = Number.isFinite(limitParam) ? Math.min(Math.max(limitParam, 1), 200) : 50;
  const offset = Number.isFinite(offsetParam) ? Math.max(offsetParam, 0) : 0;

  const where = status
    ? eq(collectedItems.status, status)
    : undefined;

  const rows = await db
    .select({
      id: collectedItems.id,
      sourceName: collectedItems.sourceName,
      sourceLink: collectedItems.sourceLink,
      title: collectedItems.title,
      excerpt: collectedItems.excerpt,
      fullTextPreview: sql<string>`left(${collectedItems.fullText}, 600)`,
      hasFullText: sql<boolean>`(${collectedItems.fullText} is not null and ${collectedItems.fullText} <> '')`,
      imageUrl: collectedItems.imageUrl,
      pubDate: collectedItems.pubDate,
      categoryHint: collectedItems.categoryHint,
      status: collectedItems.status,
      duplicateOf: collectedItems.duplicateOf,
      retryCount: collectedItems.retryCount,
      createdAt: collectedItems.createdAt,
    })
    .from(collectedItems)
    .where(where)
    .orderBy(desc(collectedItems.createdAt))
    .limit(limit)
    .offset(offset);

  const [total] = await db
    .select({ value: sql<number>`count(*)::int` })
    .from(collectedItems)
    .where(where);

  return NextResponse.json({ items: rows, total: total?.value ?? rows.length, limit, offset });
}
