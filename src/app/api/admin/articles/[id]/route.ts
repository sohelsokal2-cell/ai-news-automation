import { NextResponse } from "next/server";
import { db } from "@/db";
import { articles, categories } from "@/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id } = await params;

  const [row] = await db
    .select({
      id: articles.id,
      collectedItemId: articles.collectedItemId,
      categoryId: articles.categoryId,
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
      status: articles.status,
      createdAt: articles.createdAt,
      updatedAt: articles.updatedAt,
      categorySlug: categories.slug,
      categoryName: categories.nameBn,
    })
    .from(articles)
    .leftJoin(categories, eq(articles.categoryId, categories.id))
    .where(eq(articles.id, Number(id)))
    .limit(1);

  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(row);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id } = await params;
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const updates: Record<string, unknown> = {};

  if (typeof body.bnHeadline === "string") updates.bnHeadline = body.bnHeadline.trim();
  if (typeof body.bnSummary === "string") updates.bnSummary = body.bnSummary.trim();
  if (typeof body.bnBody === "string") updates.bnBody = body.bnBody.trim();
  if (typeof body.enHeadline === "string") updates.enHeadline = body.enHeadline.trim();
  if (typeof body.enSummary === "string") updates.enSummary = body.enSummary.trim();
  if (typeof body.enBody === "string") updates.enBody = body.enBody.trim();
  if (typeof body.imageUrl === "string") updates.imageUrl = body.imageUrl.trim() || null;
  if (typeof body.seoTitle === "string") updates.seoTitle = body.seoTitle.trim() || null;
  if (typeof body.metaDescription === "string") updates.metaDescription = body.metaDescription.trim() || null;

  if (typeof body.categoryId === "number") {
    updates.categoryId = body.categoryId;
  } else if (typeof body.categorySlug === "string") {
    const [cat] = await db
      .select({ id: categories.id })
      .from(categories)
      .where(eq(categories.slug, body.categorySlug))
      .limit(1);
    if (cat) updates.categoryId = cat.id;
  }

  if (body.status === "published" || body.status === "held") {
    updates.status = body.status;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }

  updates.updatedAt = new Date();

  try {
    const [row] = await db
      .update(articles)
      .set(updates)
      .where(eq(articles.id, Number(id)))
      .returning();

    if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Public pages are force-dynamic, so no cache invalidation is needed.

    return NextResponse.json(row);
  } catch {
    return NextResponse.json({ error: "Failed to update article" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id } = await params;

  try {
    const [row] = await db
      .delete(articles)
      .where(eq(articles.id, Number(id)))
      .returning();

    if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete article" }, { status: 500 });
  }
}
