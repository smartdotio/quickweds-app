import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { BadgeCheck, ShieldCheck } from "lucide-react";
import { DemoBanner } from "@/components/demo-banner";
import { SiteHeader } from "@/components/site-header";
import { ButtonLink, Card, Hud } from "@/components/ui";
import { getViewer } from "@/lib/auth";
import { paystackEnabled } from "@/lib/env";
import { formatNgn } from "@/lib/format";
import { getLegal } from "@/lib/legal";
import { repo } from "@/lib/repo";
import { BAND_LABEL } from "@/lib/scoring";
import { CheckoutForm } from "./checkout-form";

export const metadata: Metadata = { title: "Checkout", robots: { index: false } };

export default async function CheckoutPage({ searchParams }: PageProps<"/checkout">) {
  const sp = await searchParams;
  const docs = [getLegal("advisory-agreement")!, getLegal("refund-policy")!];

  let content: React.ReactNode;
  if (typeof sp.offer === "string") {
    const viewer = await getViewer();
    if (!viewer) redirect(`/login?next=/checkout?offer=${sp.offer}`);
    const offer = await repo.getOffer(sp.offer);
    const caseId = await repo.getActiveCaseIdForClient(viewer.id);
    if (!offer || offer.caseId !== caseId || offer.status !== "offered") redirect("/portal");
    content = (
      <Summary
        eyebrow="Full-service package"
        title={offer.title}
        price={formatNgn(offer.priceKobo)}
        items={offer.scope}
        form={<CheckoutForm kind="package" id={offer.id} amountLabel={formatNgn(offer.priceKobo)} docs={docs} scope={offer.scope} demo={!paystackEnabled} />}
      />
    );
  } else {
    const lead = typeof sp.lead === "string" ? await repo.getLead(sp.lead) : null;
    const product = await repo.getProduct("strategy-session");
    if (!lead || !product) {
      content = (
        <Card className="mx-auto max-w-lg p-8 text-center">
          <h1 className="font-display text-2xl">Start with the readiness check</h1>
          <p className="mt-3 text-muted">Booking a session starts from your free readiness result.</p>
          <ButtonLink href="/check" className="mt-6">
            Take the check
          </ButtonLink>
        </Card>
      );
    } else {
      content = (
        <Summary
          eyebrow={`For ${lead.fullName} · ${BAND_LABEL[lead.band]}`}
          title={product.name}
          price={formatNgn(product.priceKobo)}
          items={[
            "45-minute 1-on-1 video session",
            `Your ${lead.gaps.length} gaps turned into a written action plan within 48 hours`,
            "Personal document checklist in your client portal",
            "30 days of portal access",
          ]}
          note={sp.cancelled ? "Payment was cancelled — you haven't been charged." : undefined}
          form={<CheckoutForm kind="session" id={lead.id} amountLabel={formatNgn(product.priceKobo)} docs={docs} demo={!paystackEnabled} />}
        />
      );
    }
  }

  return (
    <>
      <DemoBanner />
      <SiteHeader />
      <main className="flex-1 px-4 pb-24 pt-8 sm:px-6">{content}</main>
    </>
  );
}

function Summary({
  eyebrow,
  title,
  price,
  items,
  form,
  note,
}: {
  eyebrow: string;
  title: string;
  price: string;
  items: string[];
  form: React.ReactNode;
  note?: string;
}) {
  return (
    <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[1fr_1.05fr]">
      <div className="lg:pt-6">
        <Hud className="text-gold">{"// Checkout"}</Hud>
        <h1 className="mt-2 font-display text-3xl leading-tight sm:text-4xl">{title}</h1>
        <p className="mt-2 text-sm text-muted">{eyebrow}</p>
        <ul className="mt-8 space-y-3">
          {items.map((x) => (
            <li key={x} className="flex gap-3 text-sm">
              <BadgeCheck size={18} className="shrink-0 text-gold" /> {x}
            </li>
          ))}
        </ul>
        <div className="mt-8 flex items-center gap-3 text-xs text-dim">
          <ShieldCheck size={16} className="text-cyan" />
          Payment confirmed server-side with Paystack before anything unlocks.
        </div>
      </div>
      <Card glow className="p-6 sm:p-8">
        {note && <p className="mb-4 rounded-xl border border-warn/30 bg-warn/10 px-4 py-3 text-sm text-warn">{note}</p>}
        <div className="flex items-baseline justify-between border-b border-line pb-5">
          <span className="text-muted">Total</span>
          <span className="font-display text-4xl tracking-tight">{price}</span>
        </div>
        <div className="mt-6">{form}</div>
      </Card>
    </div>
  );
}
