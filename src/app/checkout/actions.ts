"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getViewer } from "@/lib/auth";
import { AGREEMENT_VERSION, env, paystackEnabled } from "@/lib/env";
import { initializeTransaction } from "@/lib/paystack";
import { repo } from "@/lib/repo";
import type { Order } from "@/lib/types";

export type CheckoutState = { error?: string } | undefined;

async function requestMeta() {
  const h = await headers();
  return {
    ip: h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? h.get("x-real-ip"),
    ua: h.get("user-agent")?.slice(0, 400) ?? null,
  };
}

async function toPayment(order: Order): Promise<never> {
  if (!paystackEnabled) redirect(`/checkout/demo-pay?ref=${order.reference}`);
  const tx = await initializeTransaction({
    email: order.email,
    amountKobo: order.amountKobo,
    reference: order.reference,
    callbackUrl: `${env.siteUrl}/checkout/callback`,
    metadata: { orderId: order.id, kind: order.kind, cancel_action: `${env.siteUrl}/checkout?cancelled=1` },
  });
  redirect(tx.authorization_url);
}

export async function startSessionCheckout(_prev: CheckoutState, form: FormData): Promise<CheckoutState> {
  if (form.get("agree") !== "on") return { error: "Please accept the Advisory Agreement and Refund Policy." };
  const lead = await repo.getLead(String(form.get("leadId") ?? ""));
  const product = await repo.getProduct("strategy-session");
  if (!lead || !product) return { error: "This checkout link has expired. Please retake the readiness check." };
  const meta = await requestMeta();
  const order = await repo.createOrder({
    leadId: lead.id,
    profileId: null,
    caseId: null,
    email: lead.email,
    fullName: lead.fullName,
    kind: "session",
    productId: product.id,
    packageOfferId: null,
    productName: product.name,
    amountKobo: product.priceKobo,
    agreementVersion: AGREEMENT_VERSION,
    ...meta,
  });
  return toPayment(order);
}

export async function startPackageCheckout(_prev: CheckoutState, form: FormData): Promise<CheckoutState> {
  if (form.get("agree") !== "on") return { error: "Please accept the package agreement and Refund Policy." };
  const viewer = await getViewer();
  if (!viewer) redirect("/login?next=/portal");
  const offer = await repo.getOffer(String(form.get("offerId") ?? ""));
  const caseId = await repo.getActiveCaseIdForClient(viewer.id);
  if (!offer || offer.caseId !== caseId || offer.status !== "offered") return { error: "This offer is no longer available." };
  const meta = await requestMeta();
  const order = await repo.createOrder({
    leadId: null,
    profileId: viewer.id,
    caseId: offer.caseId,
    email: viewer.email,
    fullName: viewer.fullName,
    kind: "package",
    productId: null,
    packageOfferId: offer.id,
    productName: offer.title,
    amountKobo: offer.priceKobo,
    agreementVersion: AGREEMENT_VERSION,
    ...meta,
  });
  return toPayment(order);
}
