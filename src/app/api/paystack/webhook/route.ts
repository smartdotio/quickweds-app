import { NextResponse, type NextRequest } from "next/server";
import { fulfilPayment } from "@/lib/fulfil";
import { isValidPaystackSignature } from "@/lib/paystack";
import { repo } from "@/lib/repo";

export async function POST(req: NextRequest) {
  const raw = await req.text();
  if (!isValidPaystackSignature(raw, req.headers.get("x-paystack-signature"))) {
    return NextResponse.json({ error: "invalid signature" }, { status: 401 });
  }
  const event = JSON.parse(raw) as { event: string; data: { reference: string; amount: number; currency: string; status: string } };
  if (event.event !== "charge.success") return NextResponse.json({ ok: true, ignored: event.event });

  const order = await repo.getOrderByReference(event.data.reference);
  if (!order) return NextResponse.json({ ok: true, unknown: true });
  if (event.data.amount !== order.amountKobo || event.data.currency !== "NGN" || event.data.status !== "success") {
    console.error("[paystack] amount/currency mismatch", event.data.reference);
    return NextResponse.json({ ok: true, mismatch: true });
  }
  // Throwing here returns 500 so Paystack retries; fulfilment is idempotent.
  await fulfilPayment(order.reference);
  return NextResponse.json({ ok: true });
}
