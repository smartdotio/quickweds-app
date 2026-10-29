"use client";

import { useActionState } from "react";
import { Loader2, Lock } from "@/components/icons";
import { AgreementConsent } from "@/components/agreement-consent";
import { Button } from "@/components/ui";
import type { LegalDoc } from "@/lib/legal";
import { startPackageCheckout, startSessionCheckout, type CheckoutState } from "./actions";

export function CheckoutForm({
  kind,
  id,
  amountLabel,
  docs,
  scope,
  demo,
}: {
  kind: "session" | "package";
  id: string;
  amountLabel: string;
  docs: LegalDoc[];
  scope?: string[];
  demo: boolean;
}) {
  const [state, action, pending] = useActionState<CheckoutState, FormData>(
    kind === "session" ? startSessionCheckout : startPackageCheckout,
    undefined,
  );
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name={kind === "session" ? "leadId" : "offerId"} value={id} />
      <AgreementConsent docs={docs} scope={scope} />
      {state?.error && <p className="text-sm text-danger">{state.error}</p>}
      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? <Loader2 size={18} className="animate-spin" /> : <Lock size={16} />}
        Pay {amountLabel} securely
      </Button>
      <p className="text-center text-xs text-dim">
        {demo ? "Demo mode — payment is simulated." : "Card, bank transfer or USSD via Paystack. We never see your card details."}
      </p>
    </form>
  );
}
