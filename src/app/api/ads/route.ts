import { NextResponse } from "next/server";
import { db } from "@/db";
import { ads } from "@/db/schema";
import { and, desc, eq, lte, or, isNull, gte } from "drizzle-orm";

export const dynamic = "force-dynamic";

// Public endpoint: returns active ads for a slot, honouring date windows.
// GET /api/ads?slot=sidebar
export async function GET(request: Request): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const slot = searchParams.get("slot") || "sidebar";
  const now = new Date();

  const rows = await db
    .select({
      id: ads.id,
      name: ads.name,
      imageUrl: ads.imageUrl,
      linkUrl: ads.linkUrl,
      html: ads.html,
    })
    .from(ads)
    .where(
      and(
        eq(ads.slot, slot),
        eq(ads.isActive, true),
        or(isNull(ads.startsAt), lte(ads.startsAt, now)),
        or(isNull(ads.endsAt), gte(ads.endsAt, now)),
      ),
    )
    .orderBy(desc(ads.priority), desc(ads.createdAt))
    .limit(5);

  return NextResponse.json(
    { items: rows },
    { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" } },
  );
}
