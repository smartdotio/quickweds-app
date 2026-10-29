"use client";

import Link from "next/link";
import { useActionState, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { clsx } from "clsx";
import { ArrowLeft, ArrowRight, Check, Compass, Info, Loader2, ShieldAlert, TriangleAlert } from "lucide-react";
import { Button, Card, Field, Flag, Hud } from "@/components/ui";
import { formatEur, formatNgnShort } from "@/lib/format";
import { BAND_LABEL, DEFAULT_ANSWERS, fundsRequiredEur, scoreReadiness } from "@/lib/scoring";
import type { DocAnswer, ReadinessAnswers, RouteSlug, RouteTemplate } from "@/lib/types";
import { submitLead, type LeadState } from "./actions";

const STEPS = ["Route", "About you", "Funds", "Documents", "Result"] as const;
const MAX_NGN = 60_000_000;

export function Wizard({
  routes,
  fx,
  fxUpdatedAt,
  initialRoute,
}: {
  routes: RouteTemplate[];
  fx: number;
  fxUpdatedAt: string;
  initialRoute?: RouteSlug;
}) {
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [a, setA] = useState<ReadinessAnswers>({ ...DEFAULT_ANSWERS, route: initialRoute ?? DEFAULT_ANSWERS.route });
  const route = routes.find((r) => r.slug === a.route) ?? null;
  const result = useMemo(() => scoreReadiness(a, route, fx), [a, route, fx]);
  const set = <K extends keyof ReadinessAnswers>(k: K, v: ReadinessAnswers[K]) => setA((p) => ({ ...p, [k]: v }));

  const go = (to: number) => {
    setDir(to > step ? 1 : -1);
    setStep(to);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const next = () => go(a.route === "unsure" && step === 0 ? 4 : step + 1);
  const back = () => go(a.route === "unsure" && step === 4 ? 0 : step - 1);

  return (
    <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[240px_1fr]">
      {/* Progress rail */}
      <aside className="lg:sticky lg:top-28 lg:h-fit">
        <Hud className="text-gold">{"// Readiness check"}</Hud>
        <h1 className="mt-2 font-display text-2xl leading-tight sm:text-3xl">Where do you stand?</h1>
        <ol className="mt-6 flex gap-1.5 lg:flex-col lg:gap-0">
          {STEPS.map((s, i) => {
            const done = i < step;
            const current = i === step;
            return (
              <li key={s} className="flex-1 lg:flex-none">
                <div className="h-1 rounded-full bg-white/10 lg:hidden">
                  <div className={clsx("h-full rounded-full transition-all duration-500", done || current ? "w-full bg-gold" : "w-0")} />
                </div>
                <div className="relative hidden items-center gap-3 py-2.5 lg:flex">
                  <span
                    className={clsx(
                      "grid h-7 w-7 place-items-center rounded-full border text-xs transition",
                      done && "border-gold bg-gold text-ink",
                      current && "border-gold text-gold shadow-[0_0_16px_rgba(242,196,109,0.5)]",
                      !done && !current && "border-line text-dim",
                    )}
                  >
                    {done ? <Check size={14} /> : i + 1}
                  </span>
                  <span className={clsx("text-sm", current ? "text-text" : done ? "text-muted" : "text-dim")}>{s}</span>
                </div>
              </li>
            );
          })}
        </ol>
        <p className="mt-3 text-xs text-dim lg:hidden">
          Step {step + 1} of {STEPS.length} · {STEPS[step]}
        </p>
        {step > 0 && step < 4 && route && (
          <div className="mt-8 hidden lg:block">
            <LiveMeter score={result.score} />
          </div>
        )}
      </aside>

      <div className="min-w-0">
        <AnimatePresence mode="wait" custom={dir} initial={false}>
          <motion.div
            key={step}
            custom={dir}
            initial={{ opacity: 0, x: dir * 40, filter: "blur(8px)" }}
            animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, x: dir * -40, filter: "blur(8px)" }}
            transition={{ duration: 0.35, ease: [0.2, 0.7, 0.2, 1] }}
          >
            {step === 0 && <StepRoute routes={routes} value={a.route} onChange={(v) => set("route", v)} />}
            {step === 1 && <StepAbout a={a} set={set} />}
            {step === 2 && route && <StepFunds a={a} set={set} route={route} fx={fx} fxUpdatedAt={fxUpdatedAt} />}
            {step === 3 && route && (
              <StepDocs route={route} docs={a.docs} onChange={(k, v) => set("docs", { ...a.docs, [k]: v })} />
            )}
            {step === 4 && <StepResult a={a} result={result} route={route} />}
          </motion.div>
        </AnimatePresence>

        {step < 4 && (
          <div className="mt-6 flex items-center justify-between gap-3">
            <Button variant="ghost" onClick={back} disabled={step === 0} className={step === 0 ? "invisible" : ""}>
              <ArrowLeft size={16} /> Back
            </Button>
            <Button onClick={next} size="lg">
              {step === 3 || a.route === "unsure" ? "See my result" : "Continue"} <ArrowRight size={18} />
            </Button>
          </div>
        )}
        {step === 4 && (
          <Button variant="ghost" onClick={back} className="mt-4">
            <ArrowLeft size={16} /> Change answers
          </Button>
        )}
      </div>
    </div>
  );
}

/* ───────────────────────── Steps ───────────────────────── */

function StepShell({ title, sub, children }: { title: string; sub?: string; children: React.ReactNode }) {
  return (
    <Card className="p-5 sm:p-8">
      <h2 className="font-display text-xl sm:text-2xl">{title}</h2>
      {sub && <p className="mt-2 text-sm text-muted">{sub}</p>}
      <div className="mt-7">{children}</div>
    </Card>
  );
}

function StepRoute({
  routes,
  value,
  onChange,
}: {
  routes: RouteTemplate[];
  value: ReadinessAnswers["route"];
  onChange: (v: ReadinessAnswers["route"]) => void;
}) {
  return (
    <StepShell title="Where are you headed?" sub="Pick the route you're aiming for. Not sure? We'll compare them with you.">
      <div className="grid gap-3 sm:grid-cols-2">
        {routes.map((r) => (
          <OptionCard key={r.slug} selected={value === r.slug} onClick={() => onChange(r.slug)}>
            <div className="flex items-center justify-between">
              <Flag country={r.country} />
              <Radio on={value === r.slug} />
            </div>
            <p className="mt-4 font-medium">{r.name}</p>
            <p className="mt-1 text-xs text-muted">{r.tagline}</p>
          </OptionCard>
        ))}
        <OptionCard selected={value === "unsure"} onClick={() => onChange("unsure")}>
          <div className="flex items-center justify-between">
            <Compass size={18} className="text-cyan" />
            <Radio on={value === "unsure"} />
          </div>
          <p className="mt-4 font-medium">Not sure yet</p>
          <p className="mt-1 text-xs text-muted">Talk it through with a consultant first.</p>
        </OptionCard>
      </div>
    </StepShell>
  );
}

function StepAbout({ a, set }: { a: ReadinessAnswers; set: <K extends keyof ReadinessAnswers>(k: K, v: ReadinessAnswers[K]) => void }) {
  const opp = a.route === "germany-opportunity";
  return (
    <StepShell title="About you" sub={opp ? "The Opportunity Card uses a points system. These answers estimate your points." : "A few basics that change the requirements."}>
      <div className="grid gap-6 sm:grid-cols-2">
        <Field label="Your age" hint={a.route === "austria-student" ? "Austria's funds rule changes at 24" : undefined}>
          <input
            type="number"
            inputMode="numeric"
            min={16}
            max={70}
            className="field"
            value={a.age}
            onChange={(e) => set("age", Math.max(16, Math.min(70, Number(e.target.value) || 16)))}
          />
        </Field>
        <Field label="Highest qualification">
          <select className="field" value={a.qualification} onChange={(e) => set("qualification", e.target.value as ReadinessAnswers["qualification"])}>
            <option value="secondary">Secondary school (WAEC/NECO)</option>
            <option value="vocational">Vocational (2+ years)</option>
            <option value="bachelor">Bachelor&apos;s / HND</option>
            <option value="master">Master&apos;s</option>
            <option value="phd">PhD</option>
          </select>
        </Field>
        {!opp && (
          <div className="sm:col-span-2">
            <Segmented
              label="University admission"
              value={a.admission}
              onChange={(v) => set("admission", v)}
              options={[
                ["yes", "Admitted"],
                ["applied", "Applied, waiting"],
                ["no", "Not yet"],
              ]}
            />
          </div>
        )}
        {opp && (
          <>
            <div className="sm:col-span-2">
              <Segmented
                label="Is your qualification recognised in Germany?"
                value={a.recognition}
                onChange={(v) => set("recognition", v)}
                options={[
                  ["full", "Fully"],
                  ["partial", "Partially"],
                  ["none", "No"],
                  ["unsure", "Don't know"],
                ]}
              />
            </div>
            <Field label="German level">
              <select className="field" value={a.germanLevel} onChange={(e) => set("germanLevel", e.target.value as ReadinessAnswers["germanLevel"])}>
                <option value="none">None</option>
                <option value="A1">A1</option>
                <option value="A2">A2</option>
                <option value="B1">B1</option>
                <option value="B2">B2 or higher</option>
              </select>
            </Field>
            <Field label="English level">
              <select className="field" value={a.englishLevel} onChange={(e) => set("englishLevel", e.target.value as ReadinessAnswers["englishLevel"])}>
                <option value="none">No certificate</option>
                <option value="B1">B1</option>
                <option value="B2">B2 (e.g. IELTS 5.5–6.5)</option>
                <option value="C1">C1 or higher (IELTS 7+)</option>
              </select>
            </Field>
            <div className="sm:col-span-2">
              <Segmented
                label="Relevant work experience"
                value={a.experience}
                onChange={(v) => set("experience", v)}
                options={[
                  ["none", "Less than 2 yrs"],
                  ["2of5", "2 of last 5 yrs"],
                  ["5of7", "5 of last 7 yrs"],
                ]}
              />
            </div>
            <div className="sm:col-span-2">
              <Segmented
                label="Is your occupation on Germany's shortage list?"
                value={a.shortage}
                onChange={(v) => set("shortage", v)}
                options={[
                  ["yes", "Yes"],
                  ["no", "No"],
                  ["unsure", "Not sure"],
                ]}
              />
            </div>
            <div className="grid gap-3 sm:col-span-2 sm:grid-cols-2">
              <Toggle label="Lived in Germany 6+ months before" on={a.priorStay} onChange={(v) => set("priorStay", v)} />
              <Toggle label="Spouse also qualifies" on={a.spouseEligible} onChange={(v) => set("spouseEligible", v)} />
            </div>
          </>
        )}
      </div>
    </StepShell>
  );
}

function StepFunds({
  a,
  set,
  route,
  fx,
  fxUpdatedAt,
}: {
  a: ReadinessAnswers;
  set: <K extends keyof ReadinessAnswers>(k: K, v: ReadinessAnswers[K]) => void;
  route: RouteTemplate;
  fx: number;
  fxUpdatedAt: string;
}) {
  const required = fundsRequiredEur(route, a.age);
  const eur = a.fundsNgn / fx;
  const pct = Math.min(1, eur / required);
  const fill = `${(Math.min(a.fundsNgn, MAX_NGN) / MAX_NGN) * 100}%`;
  return (
    <StepShell title="Funds you can show" sub="In your own name or a sponsor's, with documents showing where it came from.">
      <div className="text-center">
        <p className="font-display text-5xl tracking-tight sm:text-6xl">
          {a.fundsNgn >= MAX_NGN ? "₦60M+" : formatNgnShort(a.fundsNgn)}
        </p>
        <p className="mt-2 font-mono text-sm text-muted">≈ {formatEur(eur)}</p>
      </div>
      <input
        type="range"
        className="slider mt-8"
        min={0}
        max={MAX_NGN}
        step={500_000}
        value={a.fundsNgn}
        style={{ "--fill": fill } as React.CSSProperties}
        onChange={(e) => set("fundsNgn", Number(e.target.value))}
        aria-label="Funds in naira"
      />
      <div className="mt-2 flex justify-between font-mono text-xs text-dim">
        <span>₦0</span>
        <span>₦30M</span>
        <span>₦60M+</span>
      </div>

      <div className="mt-8 rounded-2xl border border-line bg-white/[0.02] p-5">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted">Requirement for {route.name}</span>
          <span className="font-mono">{formatEur(required)}</span>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
          <motion.div
            className={clsx("h-full rounded-full", pct >= 1 ? "bg-ok" : pct >= 0.5 ? "bg-warn" : "bg-danger")}
            animate={{ width: `${pct * 100}%` }}
            transition={{ type: "spring", stiffness: 120, damping: 20 }}
          />
        </div>
        <p className="mt-3 text-xs text-dim">
          {route.fundsNote} Converted at ₦{fx.toLocaleString()} = €1 (updated {fxUpdatedAt}).
        </p>
      </div>
      <p className="mt-4 flex gap-2 text-xs text-muted">
        <ShieldAlert size={14} className="mt-0.5 shrink-0 text-gold" />
        Only legitimately sourced, documented funds count. We never advise borrowing, moving or &ldquo;parking&rdquo; money to hit a threshold.
      </p>
    </StepShell>
  );
}

function StepDocs({
  route,
  docs,
  onChange,
}: {
  route: RouteTemplate;
  docs: Record<string, DocAnswer>;
  onChange: (key: string, v: DocAnswer) => void;
}) {
  return (
    <StepShell title="Your documents" sub="Be honest — this is only for you. Each gap becomes a next step.">
      <ul className="divide-y divide-line">
        {route.documents.map((d) => {
          const v = docs[d.key] ?? "no";
          return (
            <li key={d.key} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="font-medium">{d.label}</p>
                <p className="text-xs text-dim">{d.help}</p>
              </div>
              <div className="flex shrink-0 rounded-full border border-line bg-white/[0.02] p-1">
                {(
                  [
                    ["yes", "Have it"],
                    ["progress", "In progress"],
                    ["no", "Not yet"],
                  ] as const
                ).map(([val, label]) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => onChange(d.key, val)}
                    aria-pressed={v === val}
                    className={clsx(
                      "rounded-full px-3 py-1.5 text-xs transition",
                      v === val
                        ? val === "yes"
                          ? "bg-ok/20 text-ok"
                          : val === "progress"
                            ? "bg-warn/20 text-warn"
                            : "bg-white/10 text-text"
                        : "text-dim hover:text-muted",
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </li>
          );
        })}
      </ul>
    </StepShell>
  );
}

function StepResult({ a, result, route }: { a: ReadinessAnswers; result: ReturnType<typeof scoreReadiness>; route: RouteTemplate | null }) {
  const [state, action, pending] = useActionState<LeadState, FormData>(submitLead, undefined);
  const scored = result.band !== "unscored";
  const color = result.band === "ready" ? "#4ade80" : result.band === "nearly" ? "#f2c46d" : result.band === "not_yet" ? "#fb7185" : "#5be7e0";

  return (
    <div className="grid gap-5 xl:grid-cols-[1.1fr_1fr]">
      <Card glow className="p-5 sm:p-8">
        <Hud>{route ? route.name : "Route to be confirmed"}</Hud>
        <div className="mt-6 flex flex-col items-center gap-6 sm:flex-row sm:items-center">
          <ScoreRing value={scored ? result.score : 100} color={color} label={scored ? String(result.score) : "?"} />
          <div className="text-center sm:text-left">
            <p className="hud text-dim">Readiness band</p>
            <p className="mt-1 font-display text-3xl" style={{ color }}>
              {BAND_LABEL[result.band]}
            </p>
            {scored && (
              <div className="mt-4 grid grid-cols-3 gap-3 text-center sm:text-left">
                {(
                  [
                    ["Funds", result.breakdown.funds, route!.weights.funds],
                    ["Docs", result.breakdown.documents, route!.weights.documents],
                    [route!.slug === "germany-opportunity" ? "Points" : "Admission", result.breakdown.route, route!.weights.route],
                  ] as const
                ).map(([l, v, max]) => (
                  <div key={l}>
                    <p className="hud text-[0.55rem] text-dim">{l}</p>
                    <p className="font-mono text-sm">
                      {v}
                      <span className="text-dim">/{max}</span>
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <p className="mt-6 flex gap-2 rounded-xl border border-line bg-white/[0.02] p-3 text-xs text-muted">
          <Info size={14} className="mt-0.5 shrink-0 text-cyan" />
          This checks how prepared your documents and funds are against published requirements. It is not a prediction of a visa decision, which only the authorities make.
        </p>

        <h3 className="mt-8 font-medium">{result.gaps.length ? `Your gaps (${result.gaps.length})` : "No gaps found"}</h3>
        <ul className="mt-3 space-y-2">
          {result.gaps.map((g, i) => (
            <motion.li
              key={g.title}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * i }}
              className="flex gap-3 rounded-xl border border-line bg-white/[0.02] p-3.5"
            >
              <TriangleAlert
                size={16}
                className={clsx("mt-0.5 shrink-0", g.severity === "high" ? "text-danger" : g.severity === "medium" ? "text-warn" : "text-muted")}
              />
              <div>
                <p className="text-sm font-medium">{g.title}</p>
                <p className="mt-0.5 text-xs text-muted">{g.detail}</p>
              </div>
            </motion.li>
          ))}
        </ul>
      </Card>

      <Card className="h-fit p-5 sm:p-8 xl:sticky xl:top-28">
        <Hud className="text-gold">Next step</Hud>
        <h3 className="mt-2 font-display text-2xl leading-tight">Turn these gaps into a plan</h3>
        <p className="mt-2 text-sm text-muted">
          We&apos;ll email your result, then you can book a 1-on-1 strategy session with a written action plan.
        </p>
        <form action={action} className="mt-6 space-y-4">
          <input type="hidden" name="answers" value={JSON.stringify(a)} />
          <Field label="Full name" error={state?.errors?.fullName}>
            <input name="fullName" autoComplete="name" required className="field" placeholder="As on your passport" />
          </Field>
          <Field label="Email" error={state?.errors?.email}>
            <input name="email" type="email" autoComplete="email" required className="field" placeholder="you@example.com" />
          </Field>
          <Field label="WhatsApp number" error={state?.errors?.phone}>
            <input name="phone" type="tel" autoComplete="tel" required className="field" placeholder="0803 123 4567" />
          </Field>
          <Field label="How did you hear about us?" hint="Optional">
            <select name="source" className="field" defaultValue="">
              <option value="">Select…</option>
              <option>Instagram</option>
              <option>TikTok</option>
              <option>X (Twitter)</option>
              <option>Friend or family</option>
              <option>Google</option>
              <option>Other</option>
            </select>
          </Field>
          <label className="flex gap-3 text-sm text-muted">
            <input type="checkbox" name="consent" required className="mt-1 h-4 w-4 accent-[#f2c46d]" />
            <span>
              I agree to Osagie &amp; Co. processing my data to respond to my enquiry, as described in the{" "}
              <Link href="/legal/privacy" target="_blank" className="text-text underline">
                Privacy Policy
              </Link>
              .
            </span>
          </label>
          {state?.errors?.consent && <p className="text-xs text-danger">{state.errors.consent}</p>}
          <label className="flex gap-3 text-sm text-dim">
            <input type="checkbox" name="marketing" className="mt-1 h-4 w-4 accent-[#f2c46d]" />
            <span>Send me occasional updates on requirement changes (optional).</span>
          </label>
          {state?.message && <p className="text-sm text-danger">{state.message}</p>}
          <Button type="submit" size="lg" className="w-full" disabled={pending}>
            {pending ? <Loader2 className="animate-spin" size={18} /> : null}
            Continue to booking <ArrowRight size={18} />
          </Button>
        </form>
      </Card>
    </div>
  );
}

/* ───────────────────────── Bits ───────────────────────── */

function OptionCard({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={clsx(
        "relative rounded-2xl border p-5 text-left transition duration-300",
        selected
          ? "border-gold/60 bg-gold/[0.07] shadow-[0_0_0_4px_rgba(242,196,109,0.08),0_20px_60px_-30px_rgba(242,196,109,0.6)]"
          : "border-line bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]",
      )}
    >
      {children}
    </button>
  );
}

function Radio({ on }: { on: boolean }) {
  return (
    <span className={clsx("grid h-5 w-5 place-items-center rounded-full border transition", on ? "border-gold" : "border-line-strong")}>
      <span className={clsx("h-2.5 w-2.5 rounded-full bg-gold transition", on ? "scale-100" : "scale-0")} />
    </span>
  );
}

function Segmented<T extends string>({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: T;
  onChange: (v: T) => void;
  options: readonly (readonly [T, string])[];
}) {
  return (
    <fieldset>
      <legend className="mb-2 text-sm font-medium text-text/90">{label}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map(([v, l]) => (
          <button
            key={v}
            type="button"
            onClick={() => onChange(v)}
            aria-pressed={value === v}
            className={clsx(
              "rounded-full border px-4 py-2 text-sm transition",
              value === v ? "border-gold/60 bg-gold/10 text-gold" : "border-line text-muted hover:border-white/20 hover:text-text",
            )}
          >
            {l}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

function Toggle({ label, on, onChange }: { label: string; on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={() => onChange(!on)}
      className="flex items-center justify-between gap-4 rounded-2xl border border-line bg-white/[0.02] px-4 py-3 text-left text-sm"
    >
      {label}
      <span className={clsx("relative h-6 w-11 shrink-0 rounded-full transition", on ? "bg-gold" : "bg-white/10")}>
        <span className={clsx("absolute top-1 h-4 w-4 rounded-full bg-white transition-all", on ? "left-6" : "left-1")} />
      </span>
    </button>
  );
}

function LiveMeter({ score }: { score: number }) {
  return (
    <Card className="p-4">
      <Hud>Live readiness</Hud>
      <div className="mt-3 flex items-end gap-1">
        <motion.span key={score} initial={{ opacity: 0.4, y: 4 }} animate={{ opacity: 1, y: 0 }} className="font-display text-4xl">
          {score}
        </motion.span>
        <span className="mb-1.5 text-sm text-dim">/100</span>
      </div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
        <motion.div
          className="h-full rounded-full bg-[linear-gradient(90deg,#fb7185,#f2c46d,#4ade80)] bg-[length:300px_100%]"
          animate={{ width: `${score}%` }}
          transition={{ type: "spring", stiffness: 100, damping: 18 }}
        />
      </div>
    </Card>
  );
}

function ScoreRing({ value, color, label }: { value: number; color: string; label: string }) {
  const r = 62;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative h-44 w-44 shrink-0">
      <div className="absolute inset-4 rounded-full blur-2xl" style={{ background: `${color}33` }} />
      <svg viewBox="0 0 160 160" className="relative h-full w-full -rotate-90">
        <circle cx="80" cy="80" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="10" />
        <circle cx="80" cy="80" r={r + 12} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1" strokeDasharray="2 6" />
        <motion.circle
          cx="80"
          cy="80"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c * (1 - value / 100) }}
          transition={{ duration: 1.4, ease: [0.2, 0.7, 0.2, 1] }}
          style={{ filter: `drop-shadow(0 0 10px ${color})` }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <span className="font-display text-5xl">{label}</span>
      </div>
    </div>
  );
}
