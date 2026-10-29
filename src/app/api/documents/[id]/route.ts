import { NextResponse, type NextRequest } from "next/server";
import { getViewer } from "@/lib/auth";
import { DOCUMENT_BUCKET, isDemo } from "@/lib/env";
import { repo } from "@/lib/repo";
import { supabaseAdmin } from "@/lib/supabase/admin";

/** Authorises the viewer, logs staff access, then redirects to a 60-second signed URL. */
export async function GET(_req: NextRequest, { params }: RouteContext<"/api/documents/[id]">) {
  const { id } = await params;
  const viewer = await getViewer();
  const ref = await repo.getDocument(id);
  const staff = viewer && viewer.role !== "client";
  if (!viewer || !ref || (!staff && ref.clientId !== viewer.id)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (isDemo || !ref.storagePath) {
    return new NextResponse(
      `<!doctype html><meta charset="utf-8"><title>${ref.doc.label}</title><body style="font-family:system-ui;background:#05060b;color:#e8ebf2;display:grid;place-items:center;height:100vh;margin:0"><p>${isDemo ? "Demo mode: no real file is stored." : "This file has been deleted under the retention policy."}</p></body>`,
      { headers: { "Content-Type": "text/html; charset=utf-8" } },
    );
  }
  if (staff) await repo.logActivity(ref.caseId, viewer.id, "document.viewed", `${ref.doc.label} v${ref.doc.version}`);
  const { data, error } = await supabaseAdmin().storage.from(DOCUMENT_BUCKET).createSignedUrl(ref.storagePath, 60);
  if (error || !data) return NextResponse.json({ error: "Unavailable" }, { status: 500 });
  return NextResponse.redirect(data.signedUrl);
}
