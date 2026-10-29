import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CalendarClock, CircleAlert, Compass, PackageCheck, Sparkles, Video } from "@/components/icons";
import { StageTimeline } from "@/components/stage-timeline";
import { ButtonLink, Card, Flag, Hud } from "@/components/ui";
import { requireClient } from "@/lib/auth";
import { formatDateTime, formatNgn, relativeTime } from "@/lib/format";
import { repo } from "@/lib/repo";

export const metadata: Metadata = { title: "Dashboard" };

export default async function PortalHome({ searchParams }: PageProps<"/portal">) {
  const { paid } = await searchParams;
  const viewer = await requireClient();
  const caseId = await repo.getActiveCaseIdForClient(viewer.id);
  const c = caseId ? await repo.getCase(caseId) : null;

  if (!c) {
    return (
      <Card className="mx-auto max-w-lg p-8 text-center">
        <h1 className="font-display text-2xl">No active case</h1>
        <p className="mt-3 text-muted">Your case opens when you book a strategy session.</p>
        <ButtonLink href="/check" className="mt-6">Start the readiness check</ButtonLink>
      </Card>
    );
  }

  const docs = c.documents;
  const verified = docs.filter((d) => d.status === "verified").length;
  const actions = docs.filter((d) => d.status === "action_required");
  const offer = c.offers.find((o) => o.status === "offered");
  const stagePos = c.route?.stages.find((s) => s.id === c.currentStageId)?.position ?? 0;
  const total = c.route?.stages.length ?? 0;
  const first = viewer.fullName.split(" ")[0];

  return (
    <div className="space-y-6">
      {paid && (
        <div className="animate-rise rounded-2xl border border-ok/30 bg-ok/10 px-5 py-4 text-sm text-ok">
          Payment received — your package is active. A receipt and agreement copy are in your inbox.
        </div>
      )}

      {/* Header */}
      <section className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <div className="animate-rise">
          <Hud className="text-gold">Case {c.id.slice(0, 8).toUpperCase()}</Hud>
          <h1 className="mt-2 font-display text-3xl leading-tight sm:text-4xl">Welcome back, {first}.</h1>
          <div className="mt-3 flex items-center gap-3 text-muted">
            {c.route ? (
              <>
                <Flag country={c.route.country} /> {c.route.name}
              </>
            ) : (
              <>
                <Compass size={16} className="text-cyan" /> Route to be confirmed in your session
              </>
            )}
          </div>
        </div>
        {c.route && (
          <div className="glass flex items-center gap-5 rounded-2xl px-5 py-4">
            <div>
              <Hud className="text-[0.55rem]">Progress</Hud>
              <p className="font-display text-2xl">
                {stagePos}
                <span className="text-dim">/{total}</span>
              </p>
            </div>
            <div className="flex gap-1">
              {c.route.stages.map((s) => (
                <span
                  key={s.id}
                  className={`h-8 w-2 rounded-full ${
                    s.position < stagePos ? "bg-gold" : s.position === stagePos ? "bg-cyan shadow-[0_0_12px_#5be7e0]" : "bg-white/10"
                  }`}
                />
              ))}
            </div>
          </div>
        )}
      </section>

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        {/* Timeline */}
        <Card className="p-5 sm:p-7">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="font-display text-lg">Application timeline</h2>
            <span className="flex items-center gap-2 rounded-full border border-cyan/30 bg-cyan/10 px-2.5 py-1 text-[0.65rem] text-cyan">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyan" /> LIVE
            </span>
          </div>
          {c.route ? (
            <StageTimeline route={c.route} currentStageId={c.currentStageId} events={c.events} />
          ) : (
            <p className="text-sm text-muted">
              Your consultant will confirm the best route with you in your strategy session. Your timeline and document checklist appear here right after.
            </p>
          )}
        </Card>

        <div className="space-y-6">
          {/* Session */}
          <Card className="p-5 sm:p-6">
            <div className="flex items-center gap-2">
              <CalendarClock size={16} className="text-gold" />
              <Hud>Strategy session</Hud>
            </div>
            {c.booking ? (
              <>
                <p className="mt-3 font-display text-xl">{formatDateTime(c.booking.startsAt)}</p>
                <p className="text-sm text-muted">{relativeTime(c.booking.startsAt)}</p>
                {c.booking.meetingUrl && (
                  <ButtonLink href={c.booking.meetingUrl} target="_blank" variant="outline" size="sm" className="mt-4">
                    <Video size={14} /> Join link
                  </ButtonLink>
                )}
              </>
            ) : (
              <>
                <p className="mt-3 text-sm text-muted">No session booked yet.</p>
                {c.orders.find((o) => o.kind === "session" && o.status === "paid") && (
                  <ButtonLink href={`/book/${c.orders.find((o) => o.kind === "session" && o.status === "paid")!.id}`} size="sm" className="mt-4">
                    Book now
                  </ButtonLink>
                )}
              </>
            )}
          </Card>

          {/* Documents */}
          {docs.length > 0 && (
            <Card className="p-5 sm:p-6">
              <div className="flex items-center justify-between">
                <Hud>Document vault</Hud>
                <Link href="/portal/documents" className="flex items-center gap-1 text-xs text-gold hover:underline">
                  Open <ArrowRight size={12} />
                </Link>
              </div>
              <div className="mt-4 flex items-center gap-5">
                <Ring value={verified / docs.length} />
                <div>
                  <p className="font-display text-3xl">
                    {verified}
                    <span className="text-dim">/{docs.length}</span>
                  </p>
                  <p className="text-sm text-muted">documents verified</p>
                </div>
              </div>
              {actions.length > 0 && (
                <div className="mt-5 space-y-2">
                  {actions.map((d) => (
                    <Link
                      key={d.id}
                      href="/portal/documents"
                      className="flex gap-3 rounded-xl border border-danger/30 bg-danger/[0.07] p-3 text-sm transition hover:bg-danger/10"
                    >
                      <CircleAlert size={16} className="mt-0.5 shrink-0 text-danger" />
                      <span>
                        <span className="block font-medium">{d.label}</span>
                        <span className="text-xs text-muted">{d.reason}</span>
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </Card>
          )}

          {/* Offer */}
          {offer && (
            <Card glow className="p-5 sm:p-6">
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-gold" />
                <Hud className="text-gold">Package offer</Hud>
              </div>
              <p className="mt-3 font-display text-xl">{offer.title}</p>
              <ul className="mt-3 space-y-1.5 text-sm text-muted">
                {offer.scope.map((s) => (
                  <li key={s}>· {s}</li>
                ))}
              </ul>
              <div className="mt-5 flex items-center justify-between">
                <span className="font-display text-2xl">{formatNgn(offer.priceKobo)}</span>
                <ButtonLink href={`/checkout?offer=${offer.id}`} size="sm">
                  Review &amp; accept
                </ButtonLink>
              </div>
            </Card>
          )}
          {c.offers.some((o) => o.status === "paid") && (
            <div className="flex items-center gap-3 rounded-2xl border border-ok/25 bg-ok/[0.06] px-5 py-4 text-sm">
              <PackageCheck size={18} className="text-ok" />
              Full-service package active
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Ring({ value }: { value: number }) {
  const r = 26;
  const c = 2 * Math.PI * r;
  return (
    <svg viewBox="0 0 64 64" className="h-16 w-16 -rotate-90">
      <circle cx="32" cy="32" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="6" />
      <circle
        cx="32"
        cy="32"
        r={r}
        fill="none"
        stroke="#4ade80"
        strokeWidth="6"
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={c * (1 - value)}
        style={{ filter: "drop-shadow(0 0 6px #4ade80)" }}
      />
    </svg>
  );
}
