import { Suspense } from "react";
import { DemoBanner } from "@/components/demo-banner";
import { Logo } from "@/components/logo";
import { requireClient } from "@/lib/auth";
import { PortalNav } from "./portal-nav";

export default function PortalLayout({ children }: LayoutProps<"/portal">) {
  return (
    <>
      <DemoBanner />
      <header className="sticky top-0 z-40 px-4 pt-3 sm:px-6">
        <div className="glass-strong mx-auto flex h-16 max-w-6xl items-center justify-between rounded-2xl px-4 sm:px-5">
          <Logo />
          <PortalNav />
          <Suspense>
            <Who />
          </Suspense>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-32 pt-8 sm:px-6 md:pb-16">{children}</main>
    </>
  );
}

async function Who() {
  const viewer = await requireClient();
  const initials = viewer.fullName.split(" ").map((p) => p[0]).slice(0, 2).join("");
  return (
    <div className="flex items-center gap-3">
      <span className="hidden text-right sm:block">
        <span className="block text-sm leading-tight">{viewer.fullName}</span>
        <span className="hud text-[0.55rem] text-dim">Client</span>
      </span>
      <span className="grid h-9 w-9 place-items-center rounded-full bg-[linear-gradient(135deg,#f2c46d,#5be7e0)] text-sm font-semibold text-ink">{initials}</span>
    </div>
  );
}
