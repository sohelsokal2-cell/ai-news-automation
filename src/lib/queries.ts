import { db } from "@/db";
import { articles, categories } from "@/db/schema";
import { and, desc, eq, ne } from "drizzle-orm";
import type { PublicArticle } from "@/lib/types";

export type { PublicArticle };
export { formatBnDate } from "@/lib/types";

function rowToArticle(row: {
  id: number;
  bnHeadline: string;
  bnSummary: string;
  bnBody: string;
  enHeadline: string;
  enSummary: string;
  enBody: string;
  slug: string;
  seoTitle: string | null;
  metaDescription: string | null;
  imageUrl: string | null;
  sourceName: string | null;
  sourceUrl: string | null;
  pubDate: Date | null;
  categoryId: number | null;
  categorySlug: string | null;
  categoryName: string | null;
}): PublicArticle {
  return {
    id: row.id,
    bn: { headline: row.bnHeadline, summary: row.bnSummary, body: row.bnBody },
    en: { headline: row.enHeadline, summary: row.enSummary, body: row.enBody },
    slug: row.slug,
    seoTitle: row.seoTitle,
    metaDescription: row.metaDescription,
    imageUrl: row.imageUrl,
    sourceName: row.sourceName,
    sourceUrl: row.sourceUrl,
    pubDate: row.pubDate,
    categoryId: row.categoryId,
    categorySlug: row.categorySlug,
    categoryName: row.categoryName,
  };
}

const selectFields = {
  id: articles.id,
  bnHeadline: articles.bnHeadline,
  bnSummary: articles.bnSummary,
  bnBody: articles.bnBody,
  enHeadline: articles.enHeadline,
  enSummary: articles.enSummary,
  enBody: articles.enBody,
  slug: articles.slug,
  seoTitle: articles.seoTitle,
  metaDescription: articles.metaDescription,
  imageUrl: articles.imageUrl,
  sourceName: articles.sourceName,
  sourceUrl: articles.sourceUrl,
  pubDate: articles.pubDate,
  categoryId: articles.categoryId,
  categorySlug: categories.slug,
  categoryName: categories.nameBn,
};

export async function loadPublished(limit = 24): Promise<PublicArticle[]> {
  const rows = await db
    .select(selectFields)
    .from(articles)
    .leftJoin(categories, eq(articles.categoryId, categories.id))
    .where(eq(articles.status, "published"))
    .orderBy(desc(articles.pubDate), desc(articles.createdAt))
    .limit(limit);
  return rows.map(rowToArticle);
}

export async function loadBySlug(slug: string): Promise<PublicArticle | null> {
  const [row] = await db
    .select(selectFields)
    .from(articles)
    .leftJoin(categories, eq(articles.categoryId, categories.id))
    .where(and(eq(articles.slug, slug), eq(articles.status, "published")))
    .limit(1);
  return row ? rowToArticle(row) : null;
}

export async function loadByCategory(slug: string, limit = 24): Promise<{ name: string; articles: PublicArticle[] } | null> {
  const [cat] = await db.select().from(categories).where(eq(categories.slug, slug)).limit(1);
  if (!cat) return null;
  const rows = await db
    .select(selectFields)
    .from(articles)
    .leftJoin(categories, eq(articles.categoryId, categories.id))
    .where(and(eq(articles.status, "published"), eq(articles.categoryId, cat.id)))
    .orderBy(desc(articles.pubDate))
    .limit(limit);
  return { name: cat.nameBn, articles: rows.map(rowToArticle) };
}

export async function loadRelated(article: PublicArticle, limit = 4): Promise<PublicArticle[]> {
  const conditions = [
    eq(articles.status, "published"),
    ne(articles.slug, article.slug),
    article.categoryId != null ? eq(articles.categoryId, article.categoryId) : undefined,
  ].filter((c): c is NonNullable<typeof c> => c !== undefined);

  const rows = await db
    .select(selectFields)
    .from(articles)
    .leftJoin(categories, eq(articles.categoryId, categories.id))
    .where(and(...conditions))
    .orderBy(desc(articles.pubDate))
    .limit(limit);
  return rows.map(rowToArticle);
}

export async function loadNav() {
  return db.select().from(categories);
}
