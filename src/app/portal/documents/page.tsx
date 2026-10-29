import type { Metadata } from "next";
import { Eye, FilePlus2, ShieldCheck } from "lucide-react";
import { Button, Card, Hud, StatusBadge } from "@/components/ui";
import { requireClient } from "@/lib/auth";
import { formatDate } from "@/lib/format";
import { repo } from "@/lib/repo";
import { addOtherDocument } from "../actions";
import { Uploader } from "./uploader";

export const metadata: Metadata = { title: "Documents" };

export default async function DocumentsPage() {
  const viewer = await requireClient();
  const caseId = await repo.getActiveCaseIdForClient(viewer.id);
  const c = caseId ? await repo.getCase(caseId) : null;
  const declared = await repo.hasDeclaration(viewer.id);
  const docs = c?.documents ?? [];
  const order = { action_required: 0, missing: 1, pending: 2, verified: 3 } as const;
  const sorted = [...docs].sort((a, b) => order[a.status] - order[b.status]);
  const counts = {
    verified: docs.filter((d) => d.status === "verified").length,
    pending: docs.filter((d) => d.status === "pending").length,
    action: docs.filter((d) => d.status === "action_required").length,
  };

  return (
    <div className="space-y-6">
      <section className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <Hud className="text-gold">Encrypted vault</Hud>
          <h1 className="mt-2 font-display text-3xl sm:text-4xl">Your documents</h1>
          <p className="mt-2 flex items-center gap-2 text-sm text-muted">
            <ShieldCheck size={16} className="text-cyan" /> Private EU storage · opened only via 60-second links · deleted 90 days after your case closes
          </p>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          {[
            ["Verified", counts.verified, "text-ok"],
            ["Pending", counts.pending, "text-warn"],
            ["Action", counts.action, "text-danger"],
          ].map(([l, n, cls]) => (
            <div key={l as string} className="glass rounded-2xl px-4 py-3">
              <p className={`font-display text-2xl ${cls}`}>{n}</p>
              <p className="hud text-[0.55rem] text-dim">{l}</p>
            </div>
          ))}
        </div>
      </section>

      {!c || docs.length === 0 ? (
        <Card className="p-8 text-center text-muted">Your document checklist appears once your route is confirmed.</Card>
      ) : (
        <Card className="divide-y divide-line overflow-hidden p-0">
          {sorted.map((d) => (
            <div key={d.id} className={`flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between ${d.status === "action_required" ? "bg-danger/[0.04]" : ""}`}>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium">{d.label}</p>
                  <StatusBadge status={d.status} />
                </div>
                <p className="mt-1 text-xs text-dim">{d.help}</p>
                {d.status === "action_required" && d.reason && (
                  <p className="mt-2 rounded-lg border-l-2 border-danger bg-white/[0.03] px-3 py-1.5 text-sm text-text/90">{d.reason}</p>
                )}
                {d.fileName && (
                  <p className="mt-2 font-mono text-xs text-dim">
                    {d.fileName} · v{d.version}
                    {d.uploadedAt && ` · ${formatDate(d.uploadedAt)}`}
                  </p>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {d.fileName && (
                  <a
                    href={`/api/documents/${d.id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="grid h-9 w-9 place-items-center rounded-full border border-line text-muted transition hover:text-text"
                    aria-label={`View ${d.label}`}
                  >
                    <Eye size={16} />
                  </a>
                )}
                {d.status !== "verified" && <Uploader docId={d.id} label={d.label} declared={declared} replace={!!d.fileName} />}
              </div>
            </div>
          ))}
        </Card>
      )}

      {c && (
        <Card className="p-5 sm:p-6">
          <form action={addOtherDocument} className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <FilePlus2 size={18} className="hidden text-gold sm:block" />
            <input name="label" required minLength={2} maxLength={80} placeholder="Add another document (e.g. Sponsor letter)" className="field flex-1" />
            <Button type="submit" variant="outline">Add to checklist</Button>
          </form>
        </Card>
      )}
    </div>
  );
}
