import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarClock, Mail, Phone, ShieldCheck } from "lucide-react";
import { StageTimeline } from "@/components/stage-timeline";
import { Button, Card, Flag, Hud } from "@/components/ui";
import { requireStaff } from "@/lib/auth";
import { formatDate, formatDateTime, formatNgn, relativeTime } from "@/lib/format";
import { repo } from "@/lib/repo";
import { BAND_LABEL } from "@/lib/scoring";
import { addNote, assignConsultant, closeCase, createOffer, extendRetention, setRoute, setStage } from "../../../actions";
import { DocReview } from "./doc-review";

export const metadata: Metadata = { title: "Client" };

export default async function CasePage({ params }: PageProps<"/admin/clients/[caseId]">) {
  const staff = await requireStaff();
  const { caseId } = await params;
  const [c, staffList, routes, settings] = await Promise.all([repo.getCase(caseId), repo.listStaff(), repo.getRoutes(), repo.getSettings()]);
  if (!c) notFound();
  const wa = c.client.phone?.replace(/[^\d]/g, "");

  return (
    <div className="space-y-6">
      <Link href="/admin" className="inline-flex items-center gap-2 text-sm text-muted hover:text-text">
        <ArrowLeft size={16} /> All clients
      </Link>

      {/* Header */}
      <Card glow className="p-5 sm:p-7">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
          <div>
            <div className="flex items-center gap-3">
              {c.route && <Flag country={c.route.country} />}
              <Hud>{c.route?.name ?? "Route not set"}</Hud>
              {c.status === "closed" && <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs">Closed {c.closedAt && formatDate(c.closedAt)}</span>}
            </div>
            <h1 className="mt-2 font-display text-3xl">{c.client.fullName}</h1>
            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted">
              <a href={`mailto:${c.client.email}`} className="flex items-center gap-1.5 hover:text-text"><Mail size={14} /> {c.client.email}</a>
              {wa && <a href={`https://wa.me/${wa}`} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 hover:text-text"><Phone size={14} /> {c.client.phone}</a>}
              <span className="flex items-center gap-1.5"><ShieldCheck size={14} className={c.declarationAt ? "text-ok" : "text-dim"} /> {c.declarationAt ? `Authenticity declared ${formatDate(c.declarationAt)}` : "No declaration yet"}</span>
            </div>
          </div>
          <form action={assignConsultant} className="flex items-center gap-2">
            <input type="hidden" name="caseId" value={c.id} />
            <select name="consultantId" defaultValue={staffList.find((s) => s.fullName === c.consultantName)?.id ?? ""} className="field w-52">
              <option value="">Unassigned</option>
              {staffList.map((s) => <option key={s.id} value={s.id}>{s.fullName}</option>)}
            </select>
            <Button size="sm" variant="outline" type="submit">Assign</Button>
          </form>
        </div>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[1.35fr_1fr]">
        <div className="space-y-6">
          {/* Stage */}
          <Card className="p-5 sm:p-7">
            <h2 className="font-display text-lg">Stage</h2>
            {c.route ? (
              <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_280px]">
                <StageTimeline route={c.route} currentStageId={c.currentStageId} events={c.events} />
                <form key={c.currentStageId} action={setStage} className="h-fit space-y-3 rounded-2xl border border-line bg-white/[0.02] p-4">
                  <input type="hidden" name="caseId" value={c.id} />
                  <Hud className="text-[0.6rem]">Move case</Hud>
                  <select name="stageId" defaultValue={c.currentStageId ?? ""} className="field">
                    {c.route.stages.map((s) => <option key={s.id} value={s.id}>{s.position}. {s.title}</option>)}
                  </select>
                  <textarea name="note" rows={3} maxLength={1000} placeholder="Note for the client (optional)" className="field resize-none" />
                  <Button type="submit" size="sm" className="w-full">Update &amp; notify client</Button>
                </form>
              </div>
            ) : (
              <form action={setRoute} className="mt-4 flex flex-col gap-3 sm:flex-row">
                <input type="hidden" name="caseId" value={c.id} />
                <select name="routeId" className="field" required>
                  {routes.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
                <Button type="submit">Set route</Button>
              </form>
            )}
          </Card>

          {/* Documents */}
          <Card className="overflow-hidden p-0">
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              <h2 className="font-display text-lg">Documents</h2>
              <span className="text-xs text-dim">{c.documents.filter((d) => d.status === "verified").length}/{c.documents.length} verified</span>
            </div>
            <div className="divide-y divide-line">
              {c.documents.map((d) => <DocReview key={d.id} doc={d} quickTags={settings.quickTags} />)}
              {c.documents.length === 0 && <p className="p-6 text-sm text-dim">Set a route to create the checklist.</p>}
            </div>
          </Card>

          {/* Offer */}
          <Card className="p-5 sm:p-7">
            <h2 className="font-display text-lg">Package offers</h2>
            <ul className="mt-4 space-y-2">
              {c.offers.map((o) => (
                <li key={o.id} className="flex items-center justify-between rounded-xl border border-line px-4 py-3 text-sm">
                  <span>{o.title}</span>
                  <span className="flex items-center gap-3">
                    <span className="font-mono">{formatNgn(o.priceKobo)}</span>
                    <span className={`rounded-full px-2 py-0.5 text-xs ${o.status === "paid" ? "bg-ok/15 text-ok" : "bg-warn/15 text-warn"}`}>{o.status}</span>
                  </span>
                </li>
              ))}
            </ul>
            {!c.offers.some((o) => o.status !== "withdrawn") && (
              <form action={createOffer} className="mt-4 grid gap-3">
                <input type="hidden" name="caseId" value={c.id} />
                <input name="title" required placeholder={`${c.route?.name ?? "Route"} — Full Service`} className="field" />
                <textarea name="scope" required rows={4} placeholder={"One scope item per line\nDocument legalisation coordination\nApplication file review"} className="field resize-none" />
                <div className="flex gap-3">
                  <input name="price" required inputMode="numeric" placeholder="Price in ₦ e.g. 850000" className="field" />
                  <Button type="submit" className="shrink-0">Send offer</Button>
                </div>
              </form>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          {/* Session */}
          <Card className="p-5 sm:p-6">
            <div className="flex items-center gap-2"><CalendarClock size={16} className="text-gold" /><Hud>Session</Hud></div>
            {c.booking ? (
              <p className="mt-3">{formatDateTime(c.booking.startsAt)} <span className="text-sm text-dim">· {relativeTime(c.booking.startsAt)}</span></p>
            ) : (
              <p className="mt-3 text-sm text-muted">Not booked</p>
            )}
            {c.unmatchedBooking && <p className="mt-3 rounded-xl border border-violet/30 bg-violet/10 px-3 py-2 text-xs text-violet">A booking with this email has no paid order. Check payment before the call.</p>}
          </Card>

          {/* Readiness */}
          {c.readiness && (
            <Card className="p-5 sm:p-6">
              <Hud>Readiness check</Hud>
              <p className="mt-3 font-display text-2xl">{c.readiness.score} · {BAND_LABEL[c.readiness.band]}</p>
              <ul className="mt-3 space-y-1 text-sm text-muted">
                {c.readiness.gaps.slice(0, 6).map((g) => <li key={g.title}>· {g.title}</li>)}
              </ul>
            </Card>
          )}

          {/* Payments */}
          <Card className="p-5 sm:p-6">
            <Hud>Payments</Hud>
            <ul className="mt-3 divide-y divide-line text-sm">
              {c.orders.map((o) => (
                <li key={o.id} className="flex items-center justify-between py-2.5">
                  <span>
                    {o.productName}
                    <span className="block font-mono text-xs text-dim">{o.reference}</span>
                  </span>
                  <span className="text-right">
                    <span className="font-mono">{formatNgn(o.amountKobo)}</span>
                    <span className={`block text-xs ${o.status === "paid" ? "text-ok" : "text-dim"}`}>{o.status}</span>
                  </span>
                </li>
              ))}
            </ul>
          </Card>

          {/* Notes */}
          <Card className="p-5 sm:p-6">
            <Hud>Internal notes</Hud>
            <form action={addNote} className="mt-3 space-y-2">
              <input type="hidden" name="caseId" value={c.id} />
              <textarea name="body" rows={2} required placeholder="Visible to staff only" className="field resize-none" />
              <Button type="submit" size="sm" variant="outline">Add note</Button>
            </form>
            <ul className="mt-4 space-y-3">
              {c.notes.map((n) => (
                <li key={n.id} className="rounded-xl border border-line bg-white/[0.02] p-3 text-sm">
                  {n.body}
                  <span className="mt-1 block text-xs text-dim">{n.actorName} · {relativeTime(n.createdAt)}</span>
                </li>
              ))}
            </ul>
          </Card>

          {/* Activity */}
          <Card className="p-5 sm:p-6">
            <Hud>Activity log</Hud>
            <ol className="mt-4 space-y-3 border-l border-line pl-4">
              {c.activity.slice(0, 25).map((a) => (
                <li key={a.id} className="relative text-sm">
                  <span className="absolute -left-[21px] top-1.5 h-2 w-2 rounded-full bg-cyan/70" />
                  <span className="font-mono text-xs text-cyan">{a.action}</span> {a.detail}
                  <span className="block text-xs text-dim">{a.actorName} · {relativeTime(a.createdAt)}</span>
                </li>
              ))}
              {c.activity.length === 0 && <li className="text-sm text-dim">No activity yet.</li>}
            </ol>
          </Card>

          {/* Close / retention */}
          {c.status === "active" ? (
            <Card className="p-5 sm:p-6">
              <Hud>Close case</Hud>
              <form action={closeCase} className="mt-3 flex gap-2">
                <input type="hidden" name="caseId" value={c.id} />
                <select name="outcome" className="field">
                  {["Visa/permit granted", "Refused", "Withdrawn by client", "Session only — no package", "Other"].map((o) => <option key={o}>{o}</option>)}
                </select>
                <Button type="submit" variant="danger" size="sm" className="h-11 shrink-0">Close</Button>
              </form>
              <p className="mt-2 text-xs text-dim">Documents are deleted automatically 90 days after closing.</p>
            </Card>
          ) : (
            staff.role === "admin" && (
              <Card className="p-5 sm:p-6">
                <Hud>Extend document retention</Hud>
                <form action={extendRetention} className="mt-3 space-y-2">
                  <input type="hidden" name="caseId" value={c.id} />
                  <input type="date" name="until" required className="field" />
                  <input name="reason" required minLength={5} placeholder="Reason (logged)" className="field" />
                  <Button type="submit" size="sm" variant="outline">Extend</Button>
                </form>
              </Card>
            )
          )}
        </div>
      </div>
    </div>
  );
}
