import type { RouteTemplate } from "./types";

/**
 * Seed route templates. Thresholds are secondary-source values as of
 * October 2026 and MUST be verified against the official source before
 * launch (set verifiedAt in Admin → Settings once checked).
 * supabase/seed.sql mirrors this file.
 */
export const ROUTE_SEED: RouteTemplate[] = [
  {
    id: "austria-student",
    slug: "austria-student",
    name: "Austria Student Residence Permit",
    country: "AT",
    tagline: "Aufenthaltsbewilligung Studierender — Vienna, Linz, Graz, Innsbruck",
    funds: { kind: "monthly_by_age", under24Eur: 722.58, from24Eur: 1308.39, months: 12 },
    fundsNote: "Extra funds are required if rent exceeds €386.43/month.",
    weights: { funds: 40, documents: 40, route: 20 },
    sourceUrl: "https://www.oesterreich.gv.at/en/themen/leben_in_oesterreich/aufenthalt",
    verifiedAt: null,
    stages: [
      { id: "austria-student:1", position: 1, title: "Admission letter received", description: "Zulassungsbescheid from your Austrian university." },
      { id: "austria-student:2", position: 2, title: "Documents legalised & translated", description: "Apostille/legalisation chain and certified translations complete." },
      { id: "austria-student:3", position: 3, title: "Application lodged in Abuja", description: "Residence permit application filed in person at the Austrian Embassy." },
      { id: "austria-student:4", position: 4, title: "Under review in Austria", description: "Decided by the local authority (e.g. MA 35 Vienna, Magistrat Linz)." },
      { id: "austria-student:5", position: 5, title: "Approved — entry visa D", description: "Approval confirmed and entry visa D issued for travel." },
      { id: "austria-student:6", position: 6, title: "Arrived & permit collected", description: "Card collected in Austria and registration (Meldezettel) done." },
    ],
    documents: [
      { id: "austria-student:passport", key: "passport", label: "International passport", weight: 3, help: "Valid for the full stay, with two blank pages." },
      { id: "austria-student:birth", key: "birth", label: "Birth certificate (legalised)", weight: 2, help: "Legalised for use in Austria, with certified translation if needed." },
      { id: "austria-student:admission", key: "admission", label: "University admission letter", weight: 3, help: "Zulassungsbescheid or conditional admission." },
      { id: "austria-student:funds", key: "funds", label: "Proof of funds", weight: 3, help: "Account accessible from Austria, sponsor guarantee or scholarship letter." },
      { id: "austria-student:insurance", key: "insurance", label: "Health insurance", weight: 2, help: "Full cover valid in Austria for the permit period." },
      { id: "austria-student:accommodation", key: "accommodation", label: "Accommodation proof", weight: 1, help: "Rental contract or dormitory confirmation." },
      { id: "austria-student:police", key: "police", label: "Police clearance certificate", weight: 2, help: "Must be recent — usually under 3 months old at submission." },
      { id: "austria-student:degree", key: "degree", label: "Degree & transcripts", weight: 2, help: "Legalised and translated where required." },
    ],
  },
  {
    id: "germany-student",
    slug: "germany-student",
    name: "Germany Student Visa",
    country: "DE",
    tagline: "National visa for degree study — tuition-free public universities",
    funds: { kind: "monthly", monthlyEur: 992, months: 12 },
    fundsNote: "Usually shown via a blocked account (Sperrkonto) of €11,904 for one year.",
    weights: { funds: 40, documents: 40, route: 20 },
    sourceUrl: "https://www.auswaertiges-amt.de/en/visa-service",
    verifiedAt: null,
    stages: [
      { id: "germany-student:1", position: 1, title: "Admission received", description: "Admission (Zulassung) from a German university." },
      { id: "germany-student:2", position: 2, title: "Blocked account & insurance", description: "Sperrkonto funded and travel/health insurance in place." },
      { id: "germany-student:3", position: 3, title: "Visa application submitted", description: "Filed via the Consular Services Portal / German mission." },
      { id: "germany-student:4", position: 4, title: "Appointment attended", description: "Biometrics and interview at the mission in Abuja or Lagos." },
      { id: "germany-student:5", position: 5, title: "Decision received", description: "Visa issued and passport returned." },
      { id: "germany-student:6", position: 6, title: "Arrived & registered", description: "Anmeldung done and residence permit appointment booked." },
    ],
    documents: [
      { id: "germany-student:passport", key: "passport", label: "International passport", weight: 3, help: "Valid for the full stay." },
      { id: "germany-student:admission", key: "admission", label: "University admission letter", weight: 3, help: "Zulassungsbescheid from the university." },
      { id: "germany-student:blocked", key: "blocked", label: "Blocked account confirmation", weight: 3, help: "Confirmation of the funded Sperrkonto." },
      { id: "germany-student:insurance", key: "insurance", label: "Health insurance", weight: 2, help: "Travel cover until enrolment, then statutory or recognised private." },
      { id: "germany-student:degree", key: "degree", label: "Degree & transcripts", weight: 2, help: "Certified copies as requested by the mission." },
      { id: "germany-student:language", key: "language", label: "Language certificate", weight: 2, help: "IELTS/TOEFL or German certificate as required by the course." },
      { id: "germany-student:cv", key: "cv", label: "CV & motivation letter", weight: 1, help: "Signed and dated." },
    ],
  },
  {
    id: "germany-opportunity",
    slug: "germany-opportunity",
    name: "Germany Opportunity Card",
    country: "DE",
    tagline: "Chancenkarte — up to 12 months to find skilled work in Germany",
    funds: { kind: "monthly", monthlyEur: 1091, months: 12 },
    fundsNote: "Proof of self-sufficiency for the stay, e.g. blocked account or declaration of commitment.",
    weights: { funds: 35, documents: 30, route: 35 },
    sourceUrl: "https://www.make-it-in-germany.com/en/visa-residence/types/job-search-opportunity-card",
    verifiedAt: null,
    stages: [
      { id: "germany-opportunity:1", position: 1, title: "Qualification check", description: "Recognition status checked (anabin / ZAB / recognition notice)." },
      { id: "germany-opportunity:2", position: 2, title: "Language proof obtained", description: "German A1+ or English B2+ certificate in hand." },
      { id: "germany-opportunity:3", position: 3, title: "Funds & insurance arranged", description: "Self-sufficiency proof and health insurance in place." },
      { id: "germany-opportunity:4", position: 4, title: "Application submitted", description: "Filed via the Consular Services Portal / German mission." },
      { id: "germany-opportunity:5", position: 5, title: "Decision received", description: "Opportunity Card visa issued." },
      { id: "germany-opportunity:6", position: 6, title: "Arrived in Germany", description: "Registered and job search under way." },
    ],
    documents: [
      { id: "germany-opportunity:passport", key: "passport", label: "International passport", weight: 3, help: "Valid for the full stay." },
      { id: "germany-opportunity:degree", key: "degree", label: "Degree or vocational certificate", weight: 3, help: "Plus transcripts." },
      { id: "germany-opportunity:recognition", key: "recognition", label: "Recognition evidence", weight: 2, help: "anabin printout, ZAB statement or recognition notice." },
      { id: "germany-opportunity:language", key: "language", label: "Language certificate", weight: 3, help: "German A1+ or English B2+ from a recognised provider." },
      { id: "germany-opportunity:experience", key: "experience", label: "Work references", weight: 2, help: "Letters confirming role, dates and duties." },
      { id: "germany-opportunity:funds", key: "funds", label: "Proof of funds", weight: 2, help: "Blocked account or formal declaration of commitment." },
      { id: "germany-opportunity:cv", key: "cv", label: "CV", weight: 1, help: "Europass or German-style CV." },
    ],
  },
];

export const ROUTE_ACCENT: Record<string, { from: string; to: string; flag: string }> = {
  "austria-student": { from: "#ef4444", to: "#f2c46d", flag: "AT" },
  "germany-student": { from: "#f2c46d", to: "#5be7e0", flag: "DE" },
  "germany-opportunity": { from: "#9b8cff", to: "#5be7e0", flag: "DE" },
};
