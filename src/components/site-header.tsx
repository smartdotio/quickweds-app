"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { clsx } from "clsx";
import { Menu, X } from "lucide-react";
import { Logo } from "./logo";
import { ButtonLink } from "./ui";

const NAV = [
  { href: "/#routes", label: "Routes" },
  { href: "/#how", label: "How it works" },
  { href: "/#pricing", label: "Pricing" },
  { href: "/#faq", label: "FAQ" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className="sticky top-0 z-50 px-4 pt-3 sm:px-6">
      <div
        className={clsx(
          "mx-auto flex h-16 max-w-6xl items-center justify-between rounded-2xl px-4 transition-all duration-500 sm:px-5",
          scrolled || open ? "glass-strong" : "border border-transparent",
        )}
      >
        <Logo />
        <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="rounded-full px-4 py-2 text-sm text-text/70 transition hover:bg-white/5 hover:text-text">
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="hidden items-center gap-2 md:flex">
          <ButtonLink href="/portal" variant="ghost" size="sm">
            Client login
          </ButtonLink>
          <ButtonLink href="/check" size="sm">
            Free readiness check
          </ButtonLink>
        </div>
        <button
          className="grid h-10 w-10 place-items-center rounded-xl text-text/80 hover:bg-white/5 md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>
      {open && (
        <div className="glass-strong mx-auto mt-2 max-w-6xl animate-rise rounded-2xl p-3 md:hidden">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} onClick={() => setOpen(false)} className="block rounded-xl px-4 py-3 text-text/80 hover:bg-white/5">
              {n.label}
            </Link>
          ))}
          <div className="mt-2 grid gap-2 border-t border-line pt-3">
            <ButtonLink href="/portal" variant="outline" onClick={() => setOpen(false)}>
              Client login
            </ButtonLink>
            <ButtonLink href="/check" onClick={() => setOpen(false)}>
              Free readiness check
            </ButtonLink>
          </div>
        </div>
      )}
    </header>
  );
}
