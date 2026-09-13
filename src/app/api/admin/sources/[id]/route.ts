import { NextResponse } from "next/server";
import { db } from "@/db";
import { sources } from "@/db/schema";
import { eq } from "drizzle-orm";

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

  if (typeof body.sourceName === "string" && body.sourceName.trim()) {
    updates.sourceName = body.sourceName.trim();
  }
  if (typeof body.feedUrl === "string" && body.feedUrl.trim()) {
    updates.feedUrl = body.feedUrl.trim();
  }
  if (body.region === "bangladesh" || body.region === "international") {
    updates.region = body.region;
  }
  if (typeof body.websiteUrl === "string") {
    updates.websiteUrl = body.websiteUrl.trim() || null;
  }
  if (typeof body.categoryHint === "string") {
    updates.categoryHint = body.categoryHint.trim() || null;
  }
  if (typeof body.isActive === "boolean") {
    updates.isActive = body.isActive;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }

  updates.updatedAt = new Date();

  try {
    const [row] = await db
      .update(sources)
      .set(updates)
      .where(eq(sources.id, Number(id)))
      .returning();

    if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(row);
  } catch (err: unknown) {
    if (err && typeof err === "object" && "code" in err && err.code === "23505") {
      return NextResponse.json({ error: "A source with this feed URL already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: "Failed to update source" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id } = await params;
  try {
    const [row] = await db
      .delete(sources)
      .where(eq(sources.id, Number(id)))
      .returning();

    if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete source" }, { status: 500 });
  }
}
