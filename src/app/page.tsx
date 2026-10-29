import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  CalendarClock,
  FileLock2,
  Fingerprint,
  Radar,
  ScanLine,
  ShieldCheck,
  Sparkles,
  XCircle,
} from "lucide-react";
import { DemoBanner } from "@/components/demo-banner";
import { RouteOrbit } from "@/components/route-orbit";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { ButtonLink, Card, Eyebrow, Flag, Hud, SectionTitle } from "@/components/ui";
import { formatDate, formatEur, formatNgn } from "@/lib/format";
import { repo } from "@/lib/repo";
import { fundsRequiredEur } from "@/lib/scoring";

// Prices, thresholds and settings are editable in Admin, so always render fresh.
export const dynamic = "force-dynamic";

export default async function Home() {
  const [routes, product] = await Promise.all([repo.getRoutes(), repo.getProduct("strategy-session")]);

  return (
    <>
      <DemoBanner />
      <SiteHeader />
      <main>
        {/* ───────── Hero ───────── */}
        <section className="relative overflow-hidden px-4 pt-10 pb-20 sm:px-6 lg:pt-16">
          <div className="grid-floor absolute inset-x-0 top-0 h-[700px] [transform:perspective(900px)_rotateX(55deg)_translateY(-120px)] opacity-60" />
          <div className="relative mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[1.05fr_1fr]">
            <div className="animate-rise">
              <Eyebrow>Austria · Germany · Study &amp; Work</Eyebrow>
              <h1 className="mt-6 font-display text-[2.6rem] leading-[1.02] font-medium tracking-[-0.03em] sm:text-6xl lg:text-[4.4rem]">
                Your route to Europe, <span className="text-holo">engineered.</span>
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted">
                Visa agencies run on WhatsApp and guesswork. We run on a live portal: a free readiness check against official
                requirements, a 1-on-1 strategy session, and a real-time view of your case through to the stamp.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <ButtonLink href="/check" size="lg">
                  Check your readiness — free <ArrowRight size={18} />
                </ButtonLink>
                <ButtonLink href="#how" size="lg" variant="outline">
                  How it works
                </ButtonLink>
              </div>
              <p className="mt-4 text-sm text-dim">3 minutes · no sign-up · results instantly</p>

              <dl className="mt-10 grid max-w-lg grid-cols-3 gap-px overflow-hidden rounded-2xl border border-line bg-line">
                {[
                  ["03", "Routes covered"],
                  ["48h", "Action plan"],
                  ["0", "PDF forms"],
                ].map(([v, l]) => (
                  <div key={l} className="bg-ink/80 px-4 py-4">
                    <dt className="hud text-[0.6rem] text-dim">{l}</dt>
                    <dd className="mt-1 font-display text-2xl">{v}</dd>
                  </div>
                ))}
              </dl>
            </div>
            <div className="animate-rise [animation-delay:0.15s]">
              <RouteOrbit />
            </div>
          </div>
        </section>

        {/* ───────── Routes ───────── */}
        <section id="routes" className="scroll-mt-28 px-4 py-20 sm:px-6">
          <SectionTitle
            eyebrow="// Routes"
            title="Three routes. Mapped in detail."
            sub="Each route has its own stages, document checklist and funds threshold — taken from published requirements and re-checked by a consultant."
          />
          <div className="mx-auto mt-14 grid max-w-6xl gap-5 md:grid-cols-3">
            {routes.map((r, i) => {
              const req = fundsRequiredEur(r, 25);
              return (
                <Card key={r.id} glow={i === 0} className="group relative flex flex-col overflow-hidden p-6 transition duration-500 hover:-translate-y-1">
                  <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-gold/10 blur-3xl transition group-hover:bg-gold/20" />
                  <div className="flex items-center justify-between">
                    <Flag country={r.country} />
                    <Hud>R-0{i + 1}</Hud>
                  </div>
                  <h3 className="mt-6 font-display text-xl leading-tight">{r.name}</h3>
                  <p className="mt-2 text-sm text-muted">{r.tagline}</p>
                  <div className="mt-6 space-y-3 border-t border-line pt-5 text-sm">
                    <div className="flex justify-between gap-4">
                      <span className="text-muted">Funds to show (age 25)</span>
                      <span className="font-mono">{formatEur(req)}/yr</span>
                    </div>
                    <div className="flex justify-between gap-4">
                      <span className="text-muted">Stages tracked</span>
                      <span className="font-mono">{r.stages.length}</span>
                    </div>
                    <div className="flex justify-between gap-4">
                      <span className="text-muted">Documents in checklist</span>
                      <span className="font-mono">{r.documents.length}</span>
                    </div>
                  </div>
                  <p className="mt-5 text-xs text-dim">
                    {r.verifiedAt ? `Requirements verified ${formatDate(r.verifiedAt)}` : "Requirements pending consultant verification"} ·{" "}
                    <a href={r.sourceUrl} className="underline decoration-dim underline-offset-2 hover:text-muted" target="_blank" rel="noreferrer">
                      official source
                    </a>
                  </p>
                  <ButtonLink href={`/check?route=${r.slug}`} variant="outline" size="sm" className="mt-6 self-start">
                    Check this route <ArrowRight size={14} />
                  </ButtonLink>
                </Card>
              );
            })}
          </div>
        </section>

        {/* ───────── How it works ───────── */}
        <section id="how" className="scroll-mt-28 px-4 py-20 sm:px-6">
          <SectionTitle eyebrow="// Protocol" title="From first click to stamped passport" />
          <div className="relative mx-auto mt-14 max-w-6xl">
            <div className="absolute left-0 right-0 top-[38px] hidden h-px bg-[linear-gradient(90deg,transparent,rgba(242,196,109,0.5),rgba(91,231,224,0.5),transparent)] lg:block" />
            <ol className="grid gap-5 lg:grid-cols-4">
              {[
                { icon: Radar, t: "Readiness check", d: "Answer 4 quick steps. See your band and every gap against published requirements — free." },
                { icon: CalendarClock, t: "Strategy session", d: "45 minutes 1-on-1 with a consultant. Written action plan in your inbox within 48 hours." },
                { icon: FileLock2, t: "Encrypted vault", d: "Upload documents from your phone. Each one is reviewed and marked verified or sent back with a reason." },
                { icon: ScanLine, t: "Live tracker", d: "Watch your case move stage by stage — legalisation, embassy, decision, arrival." },
              ].map((s, i) => (
                <li key={s.t} className="relative">
                  <div className="relative z-10 mx-auto grid h-[76px] w-[76px] place-items-center rounded-2xl glass-strong lg:mx-0">
                    <s.icon className="text-gold" size={26} strokeWidth={1.5} />
                    <span className="hud absolute -right-2 -top-2 rounded-full border border-line bg-ink px-1.5 py-0.5 text-[0.55rem] text-cyan">0{i + 1}</span>
                  </div>
                  <h3 className="mt-5 text-center font-display text-lg lg:text-left">{s.t}</h3>
                  <p className="mt-2 text-center text-sm leading-relaxed text-muted lg:text-left">{s.d}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* ───────── Portal preview ───────── */}
        <section className="px-4 py-20 sm:px-6">
          <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2">
            <div>
              <Hud className="text-gold">{"// Client portal"}</Hud>
              <h2 className="mt-3 font-display text-3xl leading-[1.1] font-medium tracking-tight sm:text-4xl">
                No more &ldquo;any update?&rdquo; messages.
              </h2>
              <p className="mt-4 text-lg text-muted">
                Your case lives in one place. Every stage change and document review lands on your phone the moment it happens.
              </p>
              <ul className="mt-8 space-y-4">
                {[
                  { icon: Fingerprint, t: "Magic-link login", d: "No passwords to forget. Staff accounts use two-factor." },
                  { icon: ShieldCheck, t: "Private by design", d: "Files in an encrypted EU vault, opened only through 60-second links." },
                  { icon: BadgeCheck, t: "Deleted on schedule", d: "Documents removed 90 days after your case closes." },
                ].map((f) => (
                  <li key={f.t} className="flex gap-4">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-line bg-white/[0.03]">
                      <f.icon size={18} className="text-cyan" />
                    </span>
                    <span>
                      <span className="block font-medium">{f.t}</span>
                      <span className="text-sm text-muted">{f.d}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <PortalPreview />
          </div>
        </section>

        {/* ───────── Pricing ───────── */}
        <section id="pricing" className="scroll-mt-28 px-4 py-20 sm:px-6">
          <SectionTitle eyebrow="// Pricing" title="Pay for clarity first." sub="Start with a session. Upgrade to full service only if it makes sense for you." />
          <div className="mx-auto mt-14 grid max-w-4xl gap-5 md:grid-cols-2">
            <Card glow className="relative p-7">
              <div className="flex items-center justify-between">
                <Hud className="text-gold">Most clients start here</Hud>
                <Sparkles size={16} className="text-gold" />
              </div>
              <h3 className="mt-4 font-display text-2xl">{product?.name ?? "Strategy Session"}</h3>
              <p className="mt-6 font-display text-5xl tracking-tight">{product ? formatNgn(product.priceKobo) : "—"}</p>
              <p className="mt-1 text-sm text-dim">one-off · pay by card, transfer or USSD</p>
              <ul className="mt-6 space-y-3 text-sm">
                {["45-minute 1-on-1 video session", "Written action plan within 48 hours", "Personal document checklist in your portal", "30 days of portal access"].map((x) => (
                  <li key={x} className="flex gap-3">
                    <BadgeCheck size={18} className="shrink-0 text-gold" /> {x}
                  </li>
                ))}
              </ul>
              <ButtonLink href="/check" className="mt-8 w-full">
                Start with the free check
              </ButtonLink>
            </Card>
            <Card className="p-7">
              <Hud>After your session</Hud>
              <h3 className="mt-4 font-display text-2xl">Full-Service Package</h3>
              <p className="mt-6 font-display text-5xl tracking-tight text-text/80">Quoted</p>
              <p className="mt-1 text-sm text-dim">fixed scope · up to 2 instalments</p>
              <ul className="mt-6 space-y-3 text-sm text-muted">
                {["Document legalisation & translation coordination", "Application file review & mock interview", "Liaison until decision", "Arrival checklist"].map((x) => (
                  <li key={x} className="flex gap-3">
                    <BadgeCheck size={18} className="shrink-0 text-cyan" /> {x}
                  </li>
                ))}
              </ul>
              <p className="mt-8 text-xs text-dim">Scope and price are written into your agreement before you pay. See our <Link className="underline" href="/legal/refund-policy">refund policy</Link>.</p>
            </Card>
          </div>
        </section>

        {/* ───────── Principles ───────── */}
        <section className="px-4 py-20 sm:px-6">
          <Card className="mx-auto max-w-6xl overflow-hidden p-8 sm:p-12">
            <div className="grid gap-10 lg:grid-cols-[1fr_1.4fr]">
              <div>
                <Hud className="text-danger">{"// Hard limits"}</Hud>
                <h2 className="mt-3 font-display text-3xl leading-tight">What we will never do.</h2>
                <p className="mt-4 text-muted">Honest advice is the product. These lines don&apos;t move — for any client, at any price.</p>
              </div>
              <ul className="grid gap-4 sm:grid-cols-2">
                {[
                  ["Guarantee a visa", "Only the authorities decide. Anyone who promises otherwise is selling you something."],
                  ["Touch fake documents", "No edited statements, no borrowed funds, no 'arrangements'. We'll end the engagement."],
                  ["Hide our fees", "The price you see is the price you pay. Scope is written down before payment."],
                  ["Keep your data forever", "Documents are deleted 90 days after your case closes."],
                ].map(([t, d]) => (
                  <li key={t} className="rounded-2xl border border-line bg-white/[0.02] p-5">
                    <div className="flex items-center gap-2 font-medium">
                      <XCircle size={18} className="text-danger" /> {t}
                    </div>
                    <p className="mt-2 text-sm text-muted">{d}</p>
                  </li>
                ))}
              </ul>
            </div>
          </Card>
        </section>

        {/* ───────── FAQ ───────── */}
        <section id="faq" className="scroll-mt-28 px-4 py-20 sm:px-6">
          <SectionTitle eyebrow="// FAQ" title="Questions, answered." />
          <div className="mx-auto mt-12 max-w-3xl space-y-3">
            {FAQ.map(([q, a]) => (
              <details key={q} className="group glass rounded-2xl px-6 py-5 open:border-white/15">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium [&::-webkit-details-marker]:hidden">
                  {q}
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-line text-gold transition group-open:rotate-45">+</span>
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-muted">{a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* ───────── Final CTA ───────── */}
        <section className="px-4 py-16 sm:px-6">
          <div className="edge-glow relative mx-auto max-w-6xl overflow-hidden rounded-[2rem] px-6 py-16 text-center sm:px-12">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(242,196,109,0.18),transparent_60%),radial-gradient(ellipse_at_bottom,rgba(91,231,224,0.12),transparent_60%)]" />
            <div className="relative">
              <h2 className="mx-auto max-w-2xl font-display text-3xl leading-tight sm:text-5xl">Know exactly where you stand — in 3 minutes.</h2>
              <p className="mx-auto mt-4 max-w-lg text-muted">Free. No sign-up. Your gaps, ranked, against published requirements.</p>
              <ButtonLink href="/check" size="lg" className="mt-8">
                Start the readiness check <ArrowRight size={18} />
              </ButtonLink>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

const FAQ: [string, string][] = [
  ["Is the readiness score my chance of getting a visa?", "No. It measures how prepared your documents and funds are against published requirements. Only the authorities decide on visas and permits, and no one can predict that for you."],
  ["Which routes do you cover?", "Austria Student Residence Permit, Germany Student Visa and the Germany Opportunity Card (Chancenkarte). If you're not sure which fits, pick 'Not sure' in the check and we'll compare them in your session."],
  ["How much money do I need to show?", "It depends on the route and, for Austria, your age. The check converts your naira amount and compares it to the current threshold. Only funds you can document legitimately count — we won't help you 'arrange' them."],
  ["How do I pay?", "Through Paystack — card, bank transfer or USSD in naira. You'll get a receipt and a copy of your signed agreement by email immediately."],
  ["Can I get a refund?", "Yes: full refund if you cancel 48 hours or more before your session, 50% (or a free reschedule) inside 48 hours. Packages are refunded pro rata for undelivered work."],
  ["Where are my documents stored?", "In an encrypted, private storage vault in the EU. Only you and your consultant can open them, through links that expire after 60 seconds. They're deleted 90 days after your case closes."],
];

function PortalPreview() {
  const stages = ["Admission", "Legalised", "Lodged · Abuja", "Review · Linz", "Visa D", "Arrived"];
  return (
    <div className="relative">
      <div className="absolute -inset-6 rounded-[2.5rem] bg-[radial-gradient(circle_at_30%_20%,rgba(91,231,224,0.15),transparent_60%)] blur-2xl" />
      <Card glow className="relative overflow-hidden p-5 sm:p-6">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-24 animate-scan bg-[linear-gradient(180deg,transparent,rgba(91,231,224,0.06),transparent)]" />
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Flag country="AT" />
            <div>
              <p className="text-sm font-medium">Austria Student RP</p>
              <Hud className="text-[0.55rem]">Case OSG-2041 · Linz</Hud>
            </div>
          </div>
          <span className="rounded-full border border-cyan/30 bg-cyan/10 px-2.5 py-1 text-[0.65rem] text-cyan">LIVE</span>
        </div>
        <div className="mt-6 grid grid-cols-6 gap-1.5">
          {stages.map((s, i) => (
            <div key={s}>
              <div className={`h-1.5 rounded-full ${i < 3 ? "bg-gold shadow-[0_0_10px_#f2c46d]" : i === 3 ? "bg-cyan shadow-[0_0_10px_#5be7e0]" : "bg-white/10"}`} />
              <p className={`mt-2 text-[0.6rem] leading-tight ${i <= 3 ? "text-text/80" : "text-dim"}`}>{s}</p>
            </div>
          ))}
        </div>
        <div className="mt-6 grid gap-2">
          {[
            ["International passport", "verified"],
            ["Proof of funds", "verified"],
            ["Health insurance", "pending"],
            ["Police clearance", "action"],
          ].map(([l, s]) => (
            <div key={l} className="flex items-center justify-between rounded-xl border border-line bg-white/[0.02] px-3.5 py-2.5 text-sm">
              <span>{l}</span>
              <span
                className={`rounded-full px-2 py-0.5 text-[0.65rem] ${
                  s === "verified" ? "bg-ok/15 text-ok" : s === "pending" ? "bg-warn/15 text-warn" : "bg-danger/15 text-danger"
                }`}
              >
                {s === "verified" ? "Verified" : s === "pending" ? "Pending review" : "Re-upload"}
              </span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
