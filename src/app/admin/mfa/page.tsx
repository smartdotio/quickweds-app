import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Card, Hud } from "@/components/ui";
import { LogoMark } from "@/components/logo";
import { getViewer } from "@/lib/auth";
import { isDemo } from "@/lib/env";
import { MfaForm } from "./mfa-form";

// Prices, thresholds and settings are editable in Admin, so always render fresh.
export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Two-factor", robots: { index: false } };

export default async function MfaPage() {
  if (isDemo) redirect("/admin");
  const viewer = await getViewer();
  if (!viewer) redirect("/login?next=/admin");
  if (viewer.role === "client") redirect("/portal");
  return (
    <main className="grid flex-1 place-items-center px-4 py-16">
      <Card glow className="w-full max-w-md p-8">
        <LogoMark size={40} />
        <Hud className="mt-6 block text-cyan">Staff security</Hud>
        <h1 className="mt-2 font-display text-2xl">Two-factor authentication</h1>
        <p className="mt-2 text-sm text-muted">Staff accounts can see client documents, so an authenticator app is required.</p>
        <div className="mt-6">
          <MfaForm />
        </div>
      </Card>
    </main>
  );
}
