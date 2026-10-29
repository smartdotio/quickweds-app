import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { clsx } from "clsx";
import type { DocStatus } from "@/lib/types";

type Variant = "primary" | "ghost" | "outline" | "danger";

const variants: Record<Variant, string> = {
  primary:
    "bg-[linear-gradient(135deg,#ffe3a3,#f2c46d_45%,#c9932e)] text-[#120d03] shadow-[0_0_0_1px_rgba(255,255,255,0.25)_inset,0_10px_40px_-10px_rgba(242,196,109,0.7)] hover:shadow-[0_0_0_1px_rgba(255,255,255,0.4)_inset,0_14px_50px_-8px_rgba(242,196,109,0.9)] hover:-translate-y-0.5",
  ghost: "text-text/80 hover:text-text hover:bg-white/5",
  outline: "glass text-text hover:border-white/25 hover:bg-white/[0.06]",
  danger: "bg-danger/15 text-danger border border-danger/30 hover:bg-danger/25",
};

const base =
  "inline-flex items-center justify-center gap-2 rounded-full font-medium transition-all duration-300 disabled:pointer-events-none disabled:opacity-50 select-none";
const sizes = { sm: "h-9 px-4 text-sm", md: "h-11 px-6 text-[0.95rem]", lg: "h-14 px-8 text-base" };

export function Button({
  variant = "primary",
  size = "md",
  className,
  ...props
}: ComponentProps<"button"> & { variant?: Variant; size?: keyof typeof sizes }) {
  return <button className={clsx(base, sizes[size], variants[variant], className)} {...props} />;
}

export function ButtonLink({
  variant = "primary",
  size = "md",
  className,
  ...props
}: ComponentProps<typeof Link> & { variant?: Variant; size?: keyof typeof sizes }) {
  return <Link className={clsx(base, sizes[size], variants[variant], className)} {...props} />;
}

export function Card({ className, glow, children, ...props }: ComponentProps<"div"> & { glow?: boolean }) {
  return (
    <div className={clsx("glass rounded-3xl", glow && "edge-glow", className)} {...props}>
      {children}
    </div>
  );
}

export function Hud({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={clsx("hud text-muted", className)}>{children}</span>;
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <div className="hud inline-flex items-center gap-2 rounded-full border border-gold/25 bg-gold/[0.06] px-3 py-1.5 text-gold">
      <span className="relative flex h-1.5 w-1.5">
        <span className="absolute inline-flex h-full w-full animate-pulse-ring rounded-full bg-gold" />
        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-gold" />
      </span>
      {children}
    </div>
  );
}

const statusStyle: Record<DocStatus, { label: string; cls: string; dot: string }> = {
  missing: { label: "Not uploaded", cls: "text-muted border-white/10 bg-white/[0.03]", dot: "bg-dim" },
  pending: { label: "Pending review", cls: "text-warn border-warn/30 bg-warn/10", dot: "bg-warn" },
  verified: { label: "Verified", cls: "text-ok border-ok/30 bg-ok/10", dot: "bg-ok" },
  action_required: { label: "Action required", cls: "text-danger border-danger/30 bg-danger/10", dot: "bg-danger" },
};

export function StatusBadge({ status }: { status: DocStatus }) {
  const s = statusStyle[status];
  return (
    <span className={clsx("inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium", s.cls)}>
      <span className={clsx("h-1.5 w-1.5 rounded-full", s.dot, status !== "missing" && "shadow-[0_0_8px_currentColor]")} />
      {s.label}
    </span>
  );
}

export function Flag({ country, className }: { country: "AT" | "DE" | "CH"; className?: string }) {
  const stripes =
    country === "AT"
      ? ["#ed2939", "#ffffff", "#ed2939"]
      : country === "DE"
        ? ["#000000", "#dd0000", "#ffce00"]
        : ["#d52b1e", "#d52b1e", "#d52b1e"];
  return (
    <span
      aria-label={country === "AT" ? "Austria" : country === "DE" ? "Germany" : "Switzerland"}
      className={clsx("inline-flex h-4 w-6 flex-col overflow-hidden rounded-[3px] ring-1 ring-white/20", className)}
    >
      {stripes.map((c, i) => (
        <span key={i} className="flex-1" style={{ background: c }} />
      ))}
    </span>
  );
}

export function Field({ label, hint, children, error }: { label: string; hint?: string; error?: string; children: ReactNode }) {
  return (
    <label className="block space-y-2">
      <span className="flex items-baseline justify-between gap-3">
        <span className="text-sm font-medium text-text/90">{label}</span>
        {hint && <span className="text-xs text-dim">{hint}</span>}
      </span>
      {children}
      {error && <span className="block text-xs text-danger">{error}</span>}
    </label>
  );
}

export function SectionTitle({ eyebrow, title, sub }: { eyebrow?: string; title: ReactNode; sub?: ReactNode }) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      {eyebrow && <Hud className="text-gold">{eyebrow}</Hud>}
      <h2 className="mt-3 font-display text-3xl leading-[1.1] font-medium tracking-tight sm:text-4xl">{title}</h2>
      {sub && <p className="mt-4 text-base text-muted sm:text-lg">{sub}</p>}
    </div>
  );
}
