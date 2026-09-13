import { NextResponse } from "next/server";
import { runPipelineAndReport } from "@/lib/pipeline/runner";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(): Promise<NextResponse> {
  const result = await runPipelineAndReport();
  return NextResponse.json(result, { status: result.ok ? 200 : (result.locked ? 409 : 500) });
}
