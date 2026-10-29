import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { env } from "./env";

/** X-Cal-Signature-256 is HMAC-SHA256 (hex) of the raw body with the webhook secret. */
export function isValidCalSignature(rawBody: string, signature: string | null, secret = env.calWebhookSecret) {
  if (!signature || !secret) return false;
  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  const a = Buffer.from(expected, "hex");
  const b = Buffer.from(signature, "hex");
  return a.length === b.length && timingSafeEqual(a, b);
}

export function calEmbedUrl(input: { orderId: string; name: string; email: string }) {
  const params = new URLSearchParams({
    embed: "true",
    theme: "dark",
    name: input.name,
    email: input.email,
    "metadata[orderId]": input.orderId,
  });
  return `https://cal.com/${env.calLink}?${params}`;
}
