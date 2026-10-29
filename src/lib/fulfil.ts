import "server-only";
import { agreementPdf } from "./agreement-pdf";
import { receiptEmail, sendEmail } from "./email";
import { env } from "./env";
import { repo } from "./repo";
import type { Order } from "./types";

/**
 * Called by both the Paystack webhook and the browser callback (after
 * server-side verification). Safe to call repeatedly: provisioning is
 * idempotent and the receipt is only sent on the first transition to paid.
 */
export async function fulfilPayment(reference: string): Promise<{ order: Order; profileId: string } | null> {
  const res = await repo.markOrderPaid(reference);
  if (!res) return null;
  const { order, firstTime } = res;

  if (order.kind === "session") {
    const { profile } = await repo.provisionClient(order);
    if (firstTime) {
      const link = await repo.magicLinkFor(order.email, `/book/${order.id}`).catch(() => `${env.siteUrl}/book/${order.id}`);
      const pdf = await agreementPdf(order, null);
      const mail = receiptEmail(order, link.startsWith("http") ? link : `${env.siteUrl}${link}`);
      await sendEmail({
        to: order.email,
        ...mail,
        attachments: [{ filename: `agreement-${order.reference}.pdf`, content: Buffer.from(pdf).toString("base64") }],
      });
    }
    return { order, profileId: profile.id };
  }

  // Package
  const offer = order.packageOfferId ? await repo.getOffer(order.packageOfferId) : null;
  if (offer && offer.status !== "paid") await repo.markOfferPaid(offer.id);
  if (firstTime) {
    const pdf = await agreementPdf(order, offer);
    await sendEmail({
      to: order.email,
      ...receiptEmail(order, `${env.siteUrl}/portal`),
      attachments: [{ filename: `agreement-${order.reference}.pdf`, content: Buffer.from(pdf).toString("base64") }],
    });
  }
  return { order, profileId: order.profileId ?? "" };
}

