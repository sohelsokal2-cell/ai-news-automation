import { NextResponse } from "next/server";
import { db } from "@/db";
import { ads } from "@/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

function toDate(value: unknown): Date | null {
  if (typeof value !== "string" || !value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }): Promise<NextResponse> {
  const { id } = await params;
  const adId = Number(id);
  if (!Number.isInteger(adId)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const patch: Record<string, unknown> = { updatedAt: new Date() };
  if (typeof body.name === "string" && body.name.trim()) patch.name = body.name.trim();
  if (typeof body.slot === "string" && ["header", "sidebar", "in-article", "footer"].includes(body.slot)) {
    patch.slot = body.slot;
  }
  if (typeof body.imageUrl === "string") patch.imageUrl = body.imageUrl.trim() || null;
  if (typeof body.linkUrl === "string") patch.linkUrl = body.linkUrl.trim() || null;
  if (typeof body.html === "string") patch.html = body.html.trim() || null;
  if (typeof body.isActive === "boolean") patch.isActive = body.isActive;
  if (body.startsAt !== undefined) patch.startsAt = toDate(body.startsAt);
  if (body.endsAt !== undefined) patch.endsAt = toDate(body.endsAt);
  if (body.priority !== undefined && Number.isFinite(Number(body.priority))) {
    patch.priority = Math.trunc(Number(body.priority));
  }

  const [row] = await db.update(ads).set(patch).where(eq(ads.id, adId)).returning();
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(row);
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }): Promise<NextResponse> {
  const { id } = await params;
  const adId = Number(id);
  if (!Number.isInteger(adId)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }
  await db.delete(ads).where(eq(ads.id, adId));
  return NextResponse.json({ ok: true });
}
