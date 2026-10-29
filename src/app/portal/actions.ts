"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { requireClient } from "@/lib/auth";
import { sendEmail, staffUploadEmail } from "@/lib/email";
import { DOCUMENT_BUCKET, env, isDemo } from "@/lib/env";
import { repo } from "@/lib/repo";
import { supabaseAdmin } from "@/lib/supabase/admin";

const MAX_BYTES = 10 * 1024 * 1024;
const ALLOWED = /\.(pdf|jpe?g|png|heic|heif)$/i;

async function ownDoc(docId: string) {
  const viewer = await requireClient();
  const ref = await repo.getDocument(docId);
  if (!ref || ref.clientId !== viewer.id) throw new Error("Not found");
  return { viewer, ref };
}

export type PrepareResult =
  | { ok: true; mode: "demo" }
  | { ok: true; mode: "signed"; path: string; token: string }
  | { ok: false; error: string; needsDeclaration?: boolean };

export async function prepareUpload(docId: string, fileName: string, size: number): Promise<PrepareResult> {
  const { viewer, ref } = await ownDoc(docId);
  if (!(await repo.hasDeclaration(viewer.id))) return { ok: false, error: "Please confirm authenticity first.", needsDeclaration: true };
  if (!ALLOWED.test(fileName)) return { ok: false, error: "Upload a PDF, JPG, PNG or HEIC file." };
  if (size > MAX_BYTES) return { ok: false, error: "Files must be 10 MB or smaller." };
  if (isDemo) return { ok: true, mode: "demo" };

  const safe = fileName.toLowerCase().replace(/[^a-z0-9.]+/g, "-").slice(-80);
  const path = `${ref.caseId}/${docId}/${ref.doc.version + 1}-${Date.now()}-${safe}`;
  const { data, error } = await supabaseAdmin().storage.from(DOCUMENT_BUCKET).createSignedUploadUrl(path);
  if (error || !data) return { ok: false, error: "Upload couldn't start. Please try again." };
  return { ok: true, mode: "signed", path: data.path, token: data.token };
}

export async function confirmUpload(docId: string, path: string | null, fileName: string) {
  const { viewer, ref } = await ownDoc(docId);
  if (!isDemo) {
    if (!path || !path.startsWith(`${ref.caseId}/${docId}/`)) throw new Error("Invalid path");
    const folder = path.slice(0, path.lastIndexOf("/"));
    const name = path.slice(path.lastIndexOf("/") + 1);
    const { data } = await supabaseAdmin().storage.from(DOCUMENT_BUCKET).list(folder, { search: name });
    if (!data?.some((o) => o.name === name)) throw new Error("Upload not found");
  }
  await repo.recordUpload(docId, path ?? `demo/${docId}`, fileName.slice(0, 120), viewer.id);
  if (env.staffNotifyEmail) await sendEmail({ to: env.staffNotifyEmail, ...staffUploadEmail(viewer.fullName, ref.doc.label, ref.caseId) });
  refresh();
}

export async function acceptDeclaration() {
  const viewer = await requireClient();
  await repo.recordDeclaration(viewer.id);
}

export async function addOtherDocument(form: FormData) {
  const viewer = await requireClient();
  const label = z.string().trim().min(2).max(80).safeParse(form.get("label"));
  if (!label.success) return;
  const caseId = await repo.getActiveCaseIdForClient(viewer.id);
  if (!caseId) return;
  await repo.addClientDocument(caseId, label.data, viewer.id);
  refresh();
}

export type ProfileState = { ok?: boolean; error?: string } | undefined;

export async function updateProfile(_prev: ProfileState, form: FormData): Promise<ProfileState> {
  const viewer = await requireClient();
  const parsed = z
    .object({ fullName: z.string().trim().min(2).max(120), phone: z.string().trim().regex(/^\+?[0-9 ]{8,18}$/) })
    .safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: "Check your name and phone number." };
  await repo.updateProfile(viewer.id, { fullName: parsed.data.fullName, phone: parsed.data.phone.replace(/\s/g, "") });
  refresh();
  return { ok: true };
}

export async function requestDeletion() {
  const viewer = await requireClient();
  await repo.requestDeletion(viewer.id);
  refresh();
}
