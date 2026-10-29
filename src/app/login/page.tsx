import type { Metadata } from "next";
import Link from "next/link";
import { DemoBanner } from "@/components/demo-banner";
import { LogoMark } from "@/components/logo";
import { ButtonLink, Card, Hud } from "@/components/ui";
import { isDemo } from "@/lib/env";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { next, error } = await searchParams;
  const dest = typeof next === "string" && next.startsWith("/") && !next.startsWith("//") ? next : "/portal";
  return (
    <>
      <DemoBanner />
      <main className="grid flex-1 place-items-center px-4 py-16">
        <Card glow className="w-full max-w-md p-8">
          <Link href="/" className="inline-block">
            <LogoMark size={40} />
          </Link>
          <Hud className="mt-6 block text-gold">Client portal</Hud>
          <h1 className="mt-2 font-display text-2xl">Sign in</h1>
          <p className="mt-2 text-sm text-muted">No password needed — we&apos;ll email you a secure link.</p>
          {error && <p className="mt-4 rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">That link has expired or was already used. Request a new one.</p>}
          <div className="mt-6">
            {isDemo ? (
              <div className="grid gap-2">
                <ButtonLink href="/portal" size="lg">Enter demo client portal</ButtonLink>
                <ButtonLink href="/admin" size="lg" variant="outline">Enter demo admin console</ButtonLink>
              </div>
            ) : (
              <LoginForm next={dest} />
            )}
          </div>
          <p className="mt-8 text-center text-xs text-dim">
            New here? Accounts are created when you book a session. <Link href="/check" className="text-muted underline">Start with the free check</Link>.
          </p>
        </Card>
      </main>
    </>
  );
}
