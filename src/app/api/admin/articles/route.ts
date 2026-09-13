import { NextResponse } from "next/server";
import { db } from "@/db";
import { articles, categories } from "@/db/schema";
import { and, eq, ilike, desc, sql } from "drizzle-orm";

export async function GET(request: Request): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");
  const status = searchParams.get("status");
  const q = searchParams.get("q");
  const limitParam = Number(searchParams.get("limit") ?? "50");
  const offsetParam = Number(searchParams.get("offset") ?? "0");
  const limit = Number.isFinite(limitParam) ? Math.min(Math.max(limitParam, 1), 200) : 50;
  const offset = Number.isFinite(offsetParam) ? Math.max(offsetParam, 0) : 0;

  const conditions = [];

  if (category) {
    const [cat] = await db
      .select({ id: categories.id })
      .from(categories)
      .where(eq(categories.slug, category))
      .limit(1);
    if (cat) {
      conditions.push(eq(articles.categoryId, cat.id));
    }
  }

  if (status === "published" || status === "held") {
    conditions.push(eq(articles.status, status));
  }

  if (q) {
    conditions.push(ilike(articles.bnHeadline, `%${q}%`));
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const rows = await db
    .select({
      id: articles.id,
      bnHeadline: articles.bnHeadline,
      status: articles.status,
      pubDate: articles.pubDate,
      sourceName: articles.sourceName,
      slug: articles.slug,
      categoryId: articles.categoryId,
      categorySlug: categories.slug,
      categoryName: categories.nameBn,
    })
    .from(articles)
    .leftJoin(categories, eq(articles.categoryId, categories.id))
    .where(where)
    .orderBy(desc(articles.pubDate), desc(articles.createdAt))
    .limit(limit)
    .offset(offset);

  const [total] = await db
    .select({ value: sql<number>`count(*)::int` })
    .from(articles)
    .leftJoin(categories, eq(articles.categoryId, categories.id))
    .where(where);

  return NextResponse.json({ items: rows, total: total?.value ?? rows.length, limit, offset });
}
