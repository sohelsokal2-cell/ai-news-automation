import { NextResponse } from "next/server";
import { db } from "@/db";
import { collectedItems } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id } = await params;

  try {
    const [row] = await db
      .update(collectedItems)
      .set({ status: "pending", retryCount: 0 })
      .where(eq(collectedItems.id, Number(id)))
      .returning();

    if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(row);
  } catch {
    return NextResponse.json({ error: "Failed to retry item" }, { status: 500 });
  }
}
