"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";
import { FolderLock, LayoutDashboard, UserRound } from "lucide-react";

const ITEMS = [
  { href: "/portal", label: "Dashboard", icon: LayoutDashboard },
  { href: "/portal/documents", label: "Documents", icon: FolderLock },
  { href: "/portal/profile", label: "Profile", icon: UserRound },
];

export function PortalNav() {
  const path = usePathname();
  const active = (href: string) => (href === "/portal" ? path === href : path.startsWith(href));
  return (
    <>
      <nav className="hidden items-center gap-1 md:flex" aria-label="Portal">
        {ITEMS.map((i) => (
          <Link
            key={i.href}
            href={i.href}
            className={clsx(
              "flex items-center gap-2 rounded-full px-4 py-2 text-sm transition",
              active(i.href) ? "bg-white/10 text-text" : "text-muted hover:text-text",
            )}
          >
            <i.icon size={16} /> {i.label}
          </Link>
        ))}
      </nav>
      {/* Mobile dock */}
      <nav className="glass-strong fixed inset-x-4 bottom-4 z-50 flex justify-around rounded-2xl p-2 md:hidden" aria-label="Portal">
        {ITEMS.map((i) => (
          <Link
            key={i.href}
            href={i.href}
            className={clsx(
              "flex flex-1 flex-col items-center gap-1 rounded-xl py-2 text-[0.65rem] transition",
              active(i.href) ? "bg-white/10 text-gold" : "text-muted",
            )}
          >
            <i.icon size={20} /> {i.label}
          </Link>
        ))}
      </nav>
    </>
  );
}
