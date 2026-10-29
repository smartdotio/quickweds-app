import Link from "next/link";
import { Suspense } from "react";
import { DemoBanner } from "@/components/demo-banner";
import { LogoMark } from "@/components/logo";
import { requireStaff } from "@/lib/auth";
import { AdminNav } from "./admin-nav";

// Prices, thresholds and settings are editable in Admin, so always render fresh.
export const dynamic = "force-dynamic";

export default function ConsoleLayout({ children }: LayoutProps<"/admin">) {
  return (
    <>
      <DemoBanner />
      <header className="sticky top-0 z-40 border-b border-line bg-void/70 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link href="/admin" className="flex items-center gap-3">
            <LogoMark size={28} />
            <span className="hidden leading-none sm:block">
              <span className="block font-display text-sm">Osagie &amp; Co.</span>
              <span className="hud text-[0.55rem] text-cyan">Consultant console</span>
            </span>
          </Link>
          <AdminNav />
          <Suspense>
            <Staff />
          </Suspense>
        </div>
      </header>
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 pb-20 pt-8 sm:px-6">{children}</main>
    </>
  );
}

async function Staff() {
  const s = await requireStaff();
  return (
    <div className="flex items-center gap-3">
      <span className="hidden text-right text-sm leading-tight sm:block">
        {s.fullName}
        <span className="hud block text-[0.55rem] text-dim">{s.role}</span>
      </span>
      <form action="/auth/signout" method="post">
        <button className="grid h-9 w-9 place-items-center rounded-full bg-[linear-gradient(135deg,#5be7e0,#9b8cff)] text-sm font-semibold text-ink" title="Sign out">
          {s.fullName.split(" ").map((p) => p[0]).slice(0, 2).join("")}
        </button>
      </form>
    </div>
  );
}
