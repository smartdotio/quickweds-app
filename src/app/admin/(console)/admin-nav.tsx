"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";

export function AdminNav() {
  const path = usePathname();
  const items = [
    { href: "/admin", label: "Clients", active: path === "/admin" || path.startsWith("/admin/clients") },
    { href: "/admin/settings", label: "Settings", active: path.startsWith("/admin/settings") },
  ];
  return (
    <nav className="flex gap-1 rounded-full border border-line bg-white/[0.02] p-1" aria-label="Console">
      {items.map((i) => (
        <Link
          key={i.href}
          href={i.href}
          className={clsx("rounded-full px-4 py-1.5 text-sm transition", i.active ? "bg-white/10 text-text" : "text-muted hover:text-text")}
        >
          {i.label}
        </Link>
      ))}
    </nav>
  );
}
