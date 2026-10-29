import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { DEMO_AS_COOKIE } from "@/lib/auth";
import { isDemo } from "@/lib/env";
import { supabaseServer } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  if (isDemo) (await cookies()).delete(DEMO_AS_COOKIE);
  else await (await supabaseServer()).auth.signOut();
  return NextResponse.redirect(new URL("/", req.url), { status: 303 });
}
