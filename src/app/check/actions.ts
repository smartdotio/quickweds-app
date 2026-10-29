"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { readinessEmail, sendEmail } from "@/lib/email";
import { PRIVACY_VERSION } from "@/lib/env";
import { repo } from "@/lib/repo";
import { scoreReadiness } from "@/lib/scoring";
import type { ReadinessAnswers } from "@/lib/types";

const answersSchema = z.object({
  route: z.enum(["austria-student", "germany-student", "germany-opportunity", "unsure"]),
  age: z.number().int().min(16).max(70),
  qualification: z.enum(["secondary", "vocational", "bachelor", "master", "phd"]),
  admission: z.enum(["yes", "applied", "no"]),
  fundsNgn: z.number().min(0).max(1_000_000_000),
  docs: z.record(z.string(), z.enum(["yes", "progress", "no"])),
  germanLevel: z.enum(["none", "A1", "A2", "B1", "B2"]),
  englishLevel: z.enum(["none", "B1", "B2", "C1"]),
  recognition: z.enum(["full", "partial", "none", "unsure"]),
  experience: z.enum(["none", "2of5", "5of7"]),
  priorStay: z.boolean(),
  spouseEligible: z.boolean(),
  shortage: z.enum(["yes", "no", "unsure"]),
});

const leadSchema = z.object({
  fullName: z.string().trim().min(2, "Enter your full name").max(120),
  email: z.email("Enter a valid email").max(200),
  phone: z
    .string()
    .trim()
    .transform((v) => v.replace(/[\s()-]/g, ""))
    .transform((v) => (v.startsWith("0") ? `+234${v.slice(1)}` : v.startsWith("+") ? v : `+${v}`))
    .pipe(z.string().regex(/^\+[1-9]\d{7,14}$/, "Enter a valid WhatsApp number")),
  source: z.string().max(60).optional(),
  consent: z.literal("on", { error: "Please accept to continue" }),
  marketing: z.string().optional(),
});

export type LeadState = { errors?: Record<string, string>; message?: string } | undefined;

export async function submitLead(_prev: LeadState, form: FormData): Promise<LeadState> {
  let answers: ReadinessAnswers;
  try {
    answers = answersSchema.parse(JSON.parse(String(form.get("answers") ?? "{}"))) as ReadinessAnswers;
  } catch {
    return { message: "Your answers couldn't be read. Please restart the check." };
  }
  const parsed = leadSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const issue of parsed.error.issues) errors[String(issue.path[0])] ??= issue.message;
    return { errors };
  }
  const lead = parsed.data;

  // Never trust a client-side score: recompute with current server config.
  const [route, settings] = await Promise.all([
    answers.route === "unsure" ? null : repo.getRoute(answers.route),
    repo.getSettings(),
  ]);
  const result = scoreReadiness(answers, route, settings.fxNgnPerEur);

  const { leadId } = await repo.saveLead({
    email: lead.email,
    fullName: lead.fullName,
    phone: lead.phone,
    source: lead.source || null,
    marketingOptIn: lead.marketing === "on",
    consentVersion: PRIVACY_VERSION,
    routeSlug: answers.route,
    answers,
    result,
    fxRate: settings.fxNgnPerEur,
  });

  await sendEmail({ to: lead.email, ...readinessEmail(lead.fullName, result.band, result.gaps) });
  redirect(`/checkout?lead=${leadId}`);
}
