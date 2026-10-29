"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { requireAdmin, requireStaff } from "@/lib/auth";
import { documentEmail, offerEmail, sendEmail, stageEmail } from "@/lib/email";
import { repo } from "@/lib/repo";
import type { FundsRule } from "@/lib/types";

const str = (f: FormData, k: string) => String(f.get(k) ?? "").trim();

async function caseOr404(caseId: string) {
  const c = await repo.getCase(caseId);
  if (!c) throw new Error("Case not found");
  return c;
}

export async function setStage(form: FormData) {
  const staff = await requireStaff();
  const c = await caseOr404(str(form, "caseId"));
  const stage = c.route?.stages.find((s) => s.id === str(form, "stageId"));
  if (!stage) throw new Error("Invalid stage");
  const note = str(form, "note").slice(0, 1000) || null;
  await repo.setStage(c.id, stage.id, note, staff.id);
  await sendEmail({ to: c.client.email, ...stageEmail(c.client.fullName, stage.title, note) });
  refresh();
}

export async function setRoute(form: FormData) {
  const staff = await requireStaff();
  const c = await caseOr404(str(form, "caseId"));
  const route = await repo.getRoute(str(form, "routeId"));
  if (!route || c.route) throw new Error("Route can't be set");
  await repo.setRoute(c.id, route.id, staff.id);
  refresh();
}

export async function assignConsultant(form: FormData) {
  const staff = await requireStaff();
  const id = str(form, "consultantId") || null;
  if (id && !(await repo.listStaff()).some((s) => s.id === id)) throw new Error("Unknown consultant");
  await repo.assignConsultant(str(form, "caseId"), id, staff.id);
  refresh();
}

export async function reviewDocument(form: FormData) {
  const staff = await requireStaff();
  const ref = await repo.getDocument(str(form, "docId"));
  if (!ref) throw new Error("Document not found");
  const status = z.enum(["verified", "action_required"]).parse(str(form, "status"));
  const reason = status === "action_required" ? str(form, "reason").slice(0, 300) || "Please upload a new version." : null;
  await repo.setDocumentStatus(ref.doc.id, status, reason, staff.id);
  const c = await caseOr404(ref.caseId);
  await sendEmail({ to: c.client.email, ...documentEmail(c.client.fullName, ref.doc.label, status, reason) });
  refresh();
}

export async function addNote(form: FormData) {
  const staff = await requireStaff();
  const body = str(form, "body").slice(0, 4000);
  if (!body) return;
  await repo.addNote(str(form, "caseId"), body, staff.id);
  refresh();
}

export async function createOffer(form: FormData) {
  const staff = await requireStaff();
  const c = await caseOr404(str(form, "caseId"));
  const parsed = z
    .object({
      title: z.string().min(3).max(120),
      scope: z.array(z.string().min(2).max(200)).min(1).max(12),
      priceNaira: z.number().int().min(1000).max(50_000_000),
    })
    .parse({
      title: str(form, "title"),
      scope: str(form, "scope").split("\n").map((s) => s.trim()).filter(Boolean),
      priceNaira: Number(str(form, "price").replace(/[^\d]/g, "")),
    });
  const offer = await repo.createOffer(c.id, { title: parsed.title, scope: parsed.scope, priceKobo: parsed.priceNaira * 100 }, staff.id);
  await sendEmail({ to: c.client.email, ...offerEmail(c.client.fullName, offer.title, offer.priceKobo) });
  refresh();
}

export async function closeCase(form: FormData) {
  const staff = await requireStaff();
  const outcome = z.enum(["Visa/permit granted", "Refused", "Withdrawn by client", "Session only — no package", "Other"]).parse(str(form, "outcome"));
  await repo.closeCase(str(form, "caseId"), outcome, staff.id);
  refresh();
}

export async function extendRetention(form: FormData) {
  const staff = await requireAdmin();
  const until = z.iso.date().parse(str(form, "until"));
  const reason = z.string().min(5).max(300).parse(str(form, "reason"));
  await repo.extendRetention(str(form, "caseId"), new Date(until).toISOString(), reason, staff.id);
  refresh();
}

/* ───────── Settings (admin only) ───────── */

export async function saveFx(form: FormData) {
  const admin = await requireAdmin();
  const rate = z.number().min(100).max(100_000).parse(Number(str(form, "rate")));
  await repo.updateFx(rate, admin.id);
  refresh();
}

export async function saveQuickTags(form: FormData) {
  const admin = await requireAdmin();
  const tags = str(form, "tags").split("\n").map((t) => t.trim()).filter(Boolean).slice(0, 30);
  await repo.updateQuickTags(tags, admin.id);
  refresh();
}

export async function saveProductPrice(form: FormData) {
  const admin = await requireAdmin();
  const naira = z.number().int().min(1000).max(10_000_000).parse(Number(str(form, "price").replace(/[^\d]/g, "")));
  await repo.updateProductPrice(str(form, "productId"), naira * 100, admin.id);
  refresh();
}

export async function saveRoute(form: FormData) {
  const admin = await requireAdmin();
  const route = await repo.getRoute(str(form, "routeId"));
  if (!route) throw new Error("Route not found");
  const num = (k: string) => z.number().min(0).max(100_000).parse(Number(str(form, k)));
  const months = z.number().int().min(1).max(36).parse(Number(str(form, "months")));
  const funds: FundsRule =
    route.funds.kind === "monthly_by_age"
      ? { kind: "monthly_by_age", under24Eur: num("under24"), from24Eur: num("from24"), months }
      : { kind: "monthly", monthlyEur: num("monthly"), months };
  const weights = { funds: num("wFunds"), documents: num("wDocs"), route: num("wRoute") };
  const verified = str(form, "verifiedAt");
  await repo.updateRoute(
    route.id,
    {
      funds,
      weights,
      sourceUrl: z.url().parse(str(form, "sourceUrl")),
      verifiedAt: verified ? new Date(z.iso.date().parse(verified)).toISOString() : null,
    },
    admin.id,
  );
  refresh();
}
