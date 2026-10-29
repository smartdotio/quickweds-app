import type { Metadata } from "next";
import Link from "next/link";
import { CalendarX2, CircleAlert, Clock3, Search, Trash2, Users } from "lucide-react";
import { clsx } from "clsx";
import { Card, Flag, Hud } from "@/components/ui";
import { requireStaff } from "@/lib/auth";
import { relativeTime } from "@/lib/format";
import { repo } from "@/lib/repo";

export const metadata: Metadata = { title: "Clients" };

const FILTERS = [
  ["all", "All active"],
  ["action", "Has action items"],
  ["review", "Needs review"],
  ["unmatched", "Unmatched booking"],
  ["closed", "Closed"],
] as const;

export default async function ClientsPage({ searchParams }: PageProps<"/admin">) {
  await requireStaff();
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.toLowerCase() : "";
  const filter = typeof sp.f === "string" ? sp.f : "all";
  const routeFilter = typeof sp.route === "string" ? sp.route : "";
  const [cases, routes, deletions] = await Promise.all([repo.listCases(), repo.getRoutes(), repo.listDeletionRequests()]);

  const active = cases.filter((c) => c.status === "active");
  const shown = cases
    .filter((c) => (filter === "closed" ? c.status === "closed" : c.status === "active"))
    .filter((c) => filter !== "action" || c.actionItems > 0)
    .filter((c) => filter !== "review" || c.pendingReview > 0)
    .filter((c) => filter !== "unmatched" || c.unmatchedBooking)
    .filter((c) => !routeFilter || c.route?.id === routeFilter)
    .filter((c) => !q || `${c.client.fullName} ${c.client.email} ${c.client.phone}`.toLowerCase().includes(q));

  const stats = [
    { label: "Active cases", value: active.length, icon: Users, cls: "text-gold" },
    { label: "Awaiting review", value: active.reduce((s, c) => s + c.pendingReview, 0), icon: Clock3, cls: "text-warn" },
    { label: "Action items", value: active.reduce((s, c) => s + c.actionItems, 0), icon: CircleAlert, cls: "text-danger" },
    { label: "Unmatched bookings", value: active.filter((c) => c.unmatchedBooking).length, icon: CalendarX2, cls: "text-violet" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <Hud className="text-cyan">{"// Pipeline"}</Hud>
          <h1 className="mt-2 font-display text-3xl">Clients</h1>
        </div>
        {deletions.length > 0 && (
          <Link href="/admin/settings#deletions" className="flex items-center gap-2 rounded-full border border-danger/30 bg-danger/10 px-4 py-2 text-sm text-danger">
            <Trash2 size={14} /> {deletions.length} deletion request{deletions.length > 1 ? "s" : ""}
          </Link>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label} className="p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <Hud className="text-[0.6rem]">{s.label}</Hud>
              <s.icon size={16} className={s.cls} />
            </div>
            <p className="mt-3 font-display text-3xl">{s.value}</p>
          </Card>
        ))}
      </div>

      <Card className="overflow-hidden p-0">
        <form className="flex flex-col gap-3 border-b border-line p-4 lg:flex-row lg:items-center">
          <label className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-dim" />
            <input name="q" defaultValue={q} placeholder="Search name, email, phone" className="field pl-10" />
          </label>
          <select name="route" defaultValue={routeFilter} className="field lg:w-64">
            <option value="">All routes</option>
            {routes.map((r) => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
          <input type="hidden" name="f" value={filter} />
          <button className="h-11 rounded-xl border border-line px-5 text-sm hover:bg-white/5">Apply</button>
        </form>
        <div className="flex gap-2 overflow-x-auto border-b border-line px-4 py-3 [scrollbar-width:none]">
          {FILTERS.map(([k, l]) => {
            const params = new URLSearchParams({ ...(q && { q }), ...(routeFilter && { route: routeFilter }), f: k });
            return (
              <Link
                key={k}
                href={`/admin?${params}`}
                className={clsx(
                  "shrink-0 rounded-full border px-3 py-1.5 text-xs transition",
                  filter === k ? "border-cyan/50 bg-cyan/10 text-cyan" : "border-line text-muted hover:text-text",
                )}
              >
                {l}
              </Link>
            );
          })}
        </div>

        {/* Table (desktop) / cards (mobile) */}
        <div className="hidden md:block">
          <table className="w-full text-sm">
            <thead>
              <tr className="hud text-left text-[0.6rem] text-dim">
                <th className="px-5 py-3 font-normal">Client</th>
                <th className="px-5 py-3 font-normal">Route · stage</th>
                <th className="px-5 py-3 font-normal">Documents</th>
                <th className="px-5 py-3 font-normal">Consultant</th>
                <th className="px-5 py-3 text-right font-normal">Activity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {shown.map((c) => {
                const stage = c.route?.stages.find((s) => s.id === c.currentStageId);
                return (
                  <tr key={c.id} className="group transition hover:bg-white/[0.03]">
                    <td className="px-5 py-4">
                      <Link href={`/admin/clients/${c.id}`} className="block">
                        <span className="font-medium group-hover:text-gold">{c.client.fullName}</span>
                        <span className="block text-xs text-dim">{c.client.email}</span>
                      </Link>
                    </td>
                    <td className="px-5 py-4">
                      {c.route && stage ? (
                        <div className="flex items-center gap-3">
                          <Flag country={c.route.country} />
                          <div>
                            <p className="text-xs text-muted">{c.route.name}</p>
                            <div className="mt-1 flex items-center gap-2">
                              <span className="flex gap-0.5">
                                {c.route.stages.map((s) => (
                                  <span key={s.id} className={clsx("h-1 w-3 rounded-full", s.position < stage.position ? "bg-gold" : s.position === stage.position ? "bg-cyan" : "bg-white/10")} />
                                ))}
                              </span>
                              <span className="text-xs">{stage.title}</span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <span className="rounded-full border border-violet/30 bg-violet/10 px-2 py-0.5 text-xs text-violet">Route not set</span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-1.5">
                        {c.actionItems > 0 && <span className="rounded-full bg-danger/15 px-2 py-0.5 text-xs text-danger">{c.actionItems} action</span>}
                        {c.pendingReview > 0 && <span className="rounded-full bg-warn/15 px-2 py-0.5 text-xs text-warn">{c.pendingReview} to review</span>}
                        {c.unmatchedBooking && <span className="rounded-full bg-violet/15 px-2 py-0.5 text-xs text-violet">unmatched booking</span>}
                        {!c.actionItems && !c.pendingReview && !c.unmatchedBooking && <span className="text-xs text-dim">—</span>}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-xs text-muted">{c.consultantName ?? <span className="text-dim">Unassigned</span>}</td>
                    <td className="px-5 py-4 text-right text-xs text-dim">{relativeTime(c.lastActivityAt)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <ul className="divide-y divide-line md:hidden">
          {shown.map((c) => {
            const stage = c.route?.stages.find((s) => s.id === c.currentStageId);
            return (
              <li key={c.id}>
                <Link href={`/admin/clients/${c.id}`} className="block p-4">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{c.client.fullName}</span>
                    {c.route && <Flag country={c.route.country} />}
                  </div>
                  <p className="mt-1 text-xs text-muted">{stage?.title ?? "Route not set"}</p>
                  <div className="mt-2 flex gap-1.5">
                    {c.actionItems > 0 && <span className="rounded-full bg-danger/15 px-2 py-0.5 text-xs text-danger">{c.actionItems} action</span>}
                    {c.pendingReview > 0 && <span className="rounded-full bg-warn/15 px-2 py-0.5 text-xs text-warn">{c.pendingReview} to review</span>}
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
        {shown.length === 0 && <p className="p-10 text-center text-sm text-dim">No clients match these filters.</p>}
      </Card>
    </div>
  );
}
