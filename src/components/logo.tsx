import Link from "next/link";

export function LogoMark({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden>
      <defs>
        <linearGradient id="lm-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffe3a3" />
          <stop offset="0.5" stopColor="#f2c46d" />
          <stop offset="1" stopColor="#c9932e" />
        </linearGradient>
      </defs>
      <circle cx="20" cy="20" r="18.5" fill="none" stroke="url(#lm-g)" strokeWidth="1.2" opacity="0.5" />
      <path d="M20 7a11 11 0 0 0-11 11c0 8 11 15 11 15s11-7 11-15A11 11 0 0 0 20 7Z" fill="none" stroke="url(#lm-g)" strokeWidth="2.4" />
      <circle cx="20" cy="18" r="4" fill="url(#lm-g)" />
    </svg>
  );
}

export function Logo() {
  return (
    <Link href="/" className="group flex items-center gap-2.5" aria-label="Osagie & Co. home">
      <LogoMark />
      <span className="leading-none">
        <span className="block font-display text-[0.95rem] font-medium tracking-tight">Osagie &amp; Co.</span>
        <span className="hud mt-1 block text-[0.55rem] text-gold/80">Euro-Consulting</span>
      </span>
    </Link>
  );
}
