import { notFound } from "next/navigation";
import { CreditCard, Landmark, Smartphone } from "@/components/icons";
import { DemoBanner } from "@/components/demo-banner";
import { LogoMark } from "@/components/logo";
import { ButtonLink, Card, Hud } from "@/components/ui";
import { paystackEnabled } from "@/lib/env";
import { formatNgn } from "@/lib/format";
import { repo } from "@/lib/repo";

/** Stand-in for Paystack's hosted checkout while no Paystack key is configured. */
export default async function DemoPayPage({ searchParams }: PageProps<"/checkout/demo-pay">) {
  if (paystackEnabled) notFound();
  const { ref } = await searchParams;
  const order = typeof ref === "string" ? await repo.getOrderByReference(ref) : null;
  if (!order) notFound();

  return (
    <>
      <DemoBanner />
      <main className="grid flex-1 place-items-center px-4 py-16">
        <Card glow className="w-full max-w-md overflow-hidden p-0">
          <div className="border-b border-line px-6 py-5">
            <div className="flex items-center justify-between">
              <LogoMark size={28} />
              <Hud className="text-violet">Simulated gateway</Hud>
            </div>
            <p className="mt-5 text-sm text-muted">{order.email}</p>
            <p className="mt-1 font-display text-4xl tracking-tight">{formatNgn(order.amountKobo)}</p>
            <p className="mt-1 font-mono text-xs text-dim">{order.reference}</p>
          </div>
          <div className="space-y-2 p-6">
            {[
              { icon: CreditCard, l: "Card" },
              { icon: Landmark, l: "Bank transfer" },
              { icon: Smartphone, l: "USSD" },
            ].map(({ icon: I, l }, i) => (
              <div key={l} className={`flex items-center gap-3 rounded-2xl border px-4 py-3.5 text-sm ${i === 0 ? "border-gold/50 bg-gold/[0.06]" : "border-line"}`}>
                <I size={18} className={i === 0 ? "text-gold" : "text-muted"} /> {l}
              </div>
            ))}
            <ButtonLink href={`/checkout/callback?reference=${order.reference}`} size="lg" className="mt-4 w-full">
              Simulate successful payment
            </ButtonLink>
            <ButtonLink href="/checkout?cancelled=1" variant="ghost" className="w-full">
              Cancel
            </ButtonLink>
          </div>
        </Card>
      </main>
    </>
  );
}
