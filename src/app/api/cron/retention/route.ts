import { NextResponse, type NextRequest } from "next/server";
import { env } from "@/lib/env";
import { repo } from "@/lib/repo";

/** Daily (vercel.json). Deletes documents 90 days after case closure and stale leads after 12 months. */
export async function GET(req: NextRequest) {
  if (!env.cronSecret || req.headers.get("authorization") !== `Bearer ${env.cronSecret}`) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }
  const result = await repo.runRetention(new Date());
  console.info("[retention]", result);
  return NextResponse.json(result);
}
