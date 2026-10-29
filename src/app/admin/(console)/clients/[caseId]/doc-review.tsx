"use client";

import { useState } from "react";
import { Check, Eye, RotateCcw } from "@/components/icons";
import { StatusBadge } from "@/components/ui";
import { formatDate } from "@/lib/format";
import type { CaseDocument } from "@/lib/types";
import { reviewDocument } from "../../../actions";

export function DocReview({ doc, quickTags }: { doc: CaseDocument; quickTags: string[] }) {
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");
  return (
    <div className="p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium">{doc.label}</span>
            <StatusBadge status={doc.status} />
          </div>
          {doc.fileName ? (
            <p className="mt-1 font-mono text-xs text-dim">
              {doc.fileName} · v{doc.version}
              {doc.uploadedAt && ` · uploaded ${formatDate(doc.uploadedAt)}`}
            </p>
          ) : (
            <p className="mt-1 text-xs text-dim">Not uploaded yet</p>
          )}
          {doc.reason && doc.status === "action_required" && <p className="mt-1 text-xs text-danger">{doc.reason}</p>}
        </div>
        {doc.fileName && (
          <div className="flex shrink-0 gap-2">
            <a href={`/api/documents/${doc.id}`} target="_blank" rel="noreferrer" className="grid h-9 w-9 place-items-center rounded-full border border-line text-muted hover:text-text" aria-label="View">
              <Eye size={15} />
            </a>
            {doc.status !== "verified" && (
              <form action={reviewDocument}>
                <input type="hidden" name="docId" value={doc.id} />
                <input type="hidden" name="status" value="verified" />
                <button className="flex h-9 items-center gap-1.5 rounded-full bg-ok/15 px-3 text-xs text-ok hover:bg-ok/25">
                  <Check size={14} /> Verify
                </button>
              </form>
            )}
            <button
              onClick={() => setRejecting((v) => !v)}
              className="flex h-9 items-center gap-1.5 rounded-full bg-danger/10 px-3 text-xs text-danger hover:bg-danger/20"
            >
              <RotateCcw size={14} /> Send back
            </button>
          </div>
        )}
      </div>
      {rejecting && (
        <form action={reviewDocument} onSubmit={() => setRejecting(false)} className="mt-4 space-y-3 rounded-2xl border border-danger/20 bg-danger/[0.04] p-4">
          <input type="hidden" name="docId" value={doc.id} />
          <input type="hidden" name="status" value="action_required" />
          <div className="flex flex-wrap gap-1.5">
            {quickTags.map((t) => (
              <button
                type="button"
                key={t}
                onClick={() => setReason(t)}
                className={`rounded-full border px-2.5 py-1 text-xs transition ${reason === t ? "border-danger/50 bg-danger/15 text-danger" : "border-line text-muted hover:text-text"}`}
              >
                {t}
              </button>
            ))}
          </div>
          <input name="reason" value={reason} onChange={(e) => setReason(e.target.value)} required maxLength={300} placeholder="Reason shown to the client" className="field" />
          <button className="h-9 rounded-full bg-danger px-4 text-xs font-medium text-ink">Send back to client</button>
        </form>
      )}
    </div>
  );
}
