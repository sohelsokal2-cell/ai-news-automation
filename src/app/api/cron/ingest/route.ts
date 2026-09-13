import { NextResponse } from "next/server";
import { runPipelineAndReport } from "@/lib/pipeline/runner";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function verifyAuth(request: Request): boolean {
  const auth = request.headers.get("authorization");
  if (!auth) return false;
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return auth === `Bearer ${secret}`;
}

export async function GET(request: Request): Promise<NextResponse> {
  if (!verifyAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return respond(request);
}

export async function POST(request: Request): Promise<NextResponse> {
  if (!verifyAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return respond(request);
}

async function respond(request: Request): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const limitParam = searchParams.get("limit");
  const limit = limitParam === null ? undefined : Number(limitParam);
  const result = await runPipelineAndReport(limit);
  return NextResponse.json(result, { status: result.ok ? 200 : (result.locked ? 409 : 500) });
}
