import { NextResponse } from "next/server";
import { db } from "@/db";
import { ads } from "@/db/schema";
import { desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

const SLOTS = ["header", "sidebar", "in-article", "footer"] as const;

type AdBody = {
  name?: unknown;
  slot?: unknown;
  imageUrl?: unknown;
  linkUrl?: unknown;
  html?: unknown;
  isActive?: unknown;
  startsAt?: unknown;
  endsAt?: unknown;
  priority?: unknown;
};

function parseAdBody(body: Record<string, unknown>) {
  const b = body as AdBody;
  const name = typeof b.name === "string" ? b.name.trim() : "";
  const slot = typeof b.slot === "string" && (SLOTS as readonly string[]).includes(b.slot) ? b.slot : "sidebar";
  const imageUrl = typeof b.imageUrl === "string" && b.imageUrl.trim() ? b.imageUrl.trim() : null;
  const linkUrl = typeof b.linkUrl === "string" && b.linkUrl.trim() ? b.linkUrl.trim() : null;
  const html = typeof b.html === "string" && b.html.trim() ? b.html : null;
  const isActive = typeof b.isActive === "boolean" ? b.isActive : true;
  const startsAt = typeof b.startsAt === "string" && b.startsAt ? new Date(b.startsAt) : null;
  const endsAt = typeof b.endsAt === "string" && b.endsAt ? new Date(b.endsAt) : null;
  const priorityNum = Number(b.priority);
  const priority = Number.isFinite(priorityNum) ? Math.trunc(priorityNum) : 0;
  return {
    name,
    slot,
    imageUrl,
    linkUrl,
    html,
    isActive,
    startsAt: startsAt && !Number.isNaN(startsAt.getTime()) ? startsAt : null,
    endsAt: endsAt && !Number.isNaN(endsAt.getTime()) ? endsAt : null,
    priority,
  };
}

export async function GET(): Promise<NextResponse> {
  const rows = await db.select().from(ads).orderBy(desc(ads.priority), desc(ads.createdAt));
  return NextResponse.json(rows);
}

export async function POST(request: Request): Promise<NextResponse> {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const data = parseAdBody(body);
  if (!data.name) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }
  if (!data.imageUrl && !data.html) {
    return NextResponse.json({ error: "imageUrl or html is required" }, { status: 400 });
  }
  const [row] = await db.insert(ads).values(data).returning();
  return NextResponse.json(row, { status: 201 });
}
