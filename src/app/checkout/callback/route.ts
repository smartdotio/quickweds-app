import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { DEMO_AS_COOKIE } from "@/lib/auth";
import { isDemo, paystackEnabled } from "@/lib/env";
import { fulfilPayment } from "@/lib/fulfil";
import { verifyTransaction } from "@/lib/paystack";
import { repo } from "@/lib/repo";

/** Paystack redirects here after checkout. Never trust the redirect alone — verify server-side. */
export async function GET(req: NextRequest) {
  const reference = req.nextUrl.searchParams.get("reference") ?? req.nextUrl.searchParams.get("trxref");
  const fail = NextResponse.redirect(new URL("/checkout?cancelled=1", req.url));
  if (!reference) return fail;

  const order = await repo.getOrderByReference(reference);
  if (!order) return fail;

  if (paystackEnabled) {
    try {
      const tx = await verifyTransaction(reference);
      if (tx.status !== "success" || tx.amount !== order.amountKobo || tx.currency !== "NGN") return fail;
    } catch (e) {
      console.error("[paystack] verify failed", e);
      return fail;
    }
  }

  const result = await fulfilPayment(reference);
  if (!result) return fail;

  if (isDemo) {
    (await cookies()).set(DEMO_AS_COOKIE, result.profileId, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 });
  }
  const to = result.order.kind === "session" ? `/book/${result.order.id}` : "/portal?paid=1";
  return NextResponse.redirect(new URL(to, req.url));
}
