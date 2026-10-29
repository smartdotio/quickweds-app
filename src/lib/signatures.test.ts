import { createHmac } from "node:crypto";
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const { isValidPaystackSignature } = await import("./paystack");
const { isValidCalSignature } = await import("./cal");

describe("webhook signatures", () => {
  const body = JSON.stringify({ event: "charge.success", data: { reference: "OSG-1" } });

  it("accepts a valid Paystack signature and rejects tampering", () => {
    const sig = createHmac("sha512", "sk_test").update(body).digest("hex");
    expect(isValidPaystackSignature(body, sig, "sk_test")).toBe(true);
    expect(isValidPaystackSignature(body + " ", sig, "sk_test")).toBe(false);
    expect(isValidPaystackSignature(body, null, "sk_test")).toBe(false);
    expect(isValidPaystackSignature(body, "abc", "sk_test")).toBe(false);
  });

  it("accepts a valid Cal.com signature and rejects a wrong secret", () => {
    const sig = createHmac("sha256", "whsec").update(body).digest("hex");
    expect(isValidCalSignature(body, sig, "whsec")).toBe(true);
    expect(isValidCalSignature(body, sig, "other")).toBe(false);
  });
});
