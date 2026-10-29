import Link from "next/link";
import { LogoMark } from "./logo";

export function SiteFooter() {
  return (
    <footer className="mt-auto px-4 pb-10 pt-24 sm:px-6">
      <div className="mx-auto max-w-6xl border-t border-line pt-10">
        <div className="flex flex-col justify-between gap-8 md:flex-row">
          <div className="max-w-sm">
            <div className="flex items-center gap-3">
              <LogoMark size={28} />
              <span className="font-display text-sm">Osagie &amp; Co. Euro-Consulting</span>
            </div>
            <p className="mt-4 text-sm text-muted">
              Advice and process support for study and work routes from Nigeria to Austria and Germany. We are not lawyers and
              no consultant can guarantee a visa decision.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-x-12 gap-y-3 text-sm sm:grid-cols-3">
            <Link className="text-muted hover:text-text" href="/check">Readiness check</Link>
            <Link className="text-muted hover:text-text" href="/portal">Client portal</Link>
            <Link className="text-muted hover:text-text" href="/legal/advisory-agreement">Advisory agreement</Link>
            <Link className="text-muted hover:text-text" href="/legal/refund-policy">Refund policy</Link>
            <Link className="text-muted hover:text-text" href="/legal/privacy">Privacy</Link>
            <Link className="text-muted hover:text-text" href="/legal/terms">Terms</Link>
          </div>
        </div>
        <div className="hud mt-10 flex flex-col justify-between gap-2 text-dim sm:flex-row">
          <span>© {new Date().getFullYear()} Osagie &amp; Co. · Lagos ⟶ Vienna · Berlin</span>
          <span>NDPA 2023 compliant · Data hosted in the EU</span>
        </div>
      </div>
    </footer>
  );
}
