import { NextResponse } from "next/server";
import { runPipelineAndReport } from "@/lib/pipeline/runner";

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
  return respond();
}

export async function POST(request: Request): Promise<NextResponse> {
  if (!verifyAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return respond();
}

async function respond(): Promise<NextResponse> {
  const result = await runPipelineAndReport();
  return NextResponse.json(result, { status: result.ok ? 200 : (result.locked ? 409 : 500) });
}
