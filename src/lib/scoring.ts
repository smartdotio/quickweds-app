import type {
  Band,
  Gap,
  ReadinessAnswers,
  ReadinessResult,
  RouteTemplate,
} from "./types";

export const BAND_LABEL: Record<Band, string> = {
  ready: "Ready",
  nearly: "Nearly ready",
  not_yet: "Not yet",
  unscored: "Let's talk",
};

export function fundsRequiredEur(route: RouteTemplate, age: number): number {
  const f = route.funds;
  const monthly = f.kind === "monthly" ? f.monthlyEur : age < 24 ? f.under24Eur : f.from24Eur;
  return Math.round(monthly * f.months * 100) / 100;
}

/** Indicative Chancenkarte points. Seed values — verify before launch. */
export function opportunityPoints(a: ReadinessAnswers): number {
  let p = 0;
  if (a.recognition === "partial") p += 4;
  if (a.shortage === "yes") p += 1;
  if (a.experience === "5of7") p += 3;
  else if (a.experience === "2of5") p += 2;
  p += { none: 0, A1: 0, A2: 1, B1: 2, B2: 3 }[a.germanLevel];
  if (a.englishLevel === "C1") p += 1;
  if (a.age < 35) p += 2;
  else if (a.age < 40) p += 1;
  if (a.priorStay) p += 1;
  if (a.spouseEligible) p += 1;
  return p;
}

export function opportunityBaseMet(a: ReadinessAnswers): boolean {
  const qualified = a.qualification !== "secondary";
  const language = a.germanLevel !== "none" || a.englishLevel === "B2" || a.englishLevel === "C1";
  return qualified && language;
}

const eur = (n: number) => `€${Math.round(n).toLocaleString("en-GB")}`;
const ngn = (n: number) => `₦${(Math.round(n / 100_000) / 10).toLocaleString("en-GB")}M`;

export function bandFor(score: number): Band {
  if (score >= 80) return "ready";
  if (score >= 50) return "nearly";
  return "not_yet";
}

export function scoreReadiness(
  a: ReadinessAnswers,
  route: RouteTemplate | null,
  fxNgnPerEur: number,
): ReadinessResult {
  const fundsEur = a.fundsNgn / fxNgnPerEur;
  if (!route || a.route === "unsure") {
    return {
      score: 0,
      band: "unscored",
      fundsRequiredEur: 0,
      fundsEur,
      points: null,
      breakdown: { funds: 0, documents: 0, route: 0 },
      gaps: [
        {
          title: "Pick the right route first",
          detail: "A consultant will compare Austria and Germany routes against your profile.",
          severity: "medium",
        },
      ],
    };
  }

  const w = route.weights;
  const gaps: Gap[] = [];

  // Funds
  const required = fundsRequiredEur(route, a.age);
  const ratio = required > 0 ? fundsEur / required : 1;
  const fundsScore = ratio >= 1 ? w.funds : ratio < 0.5 ? 0 : (w.funds * (ratio - 0.5)) / 0.5;
  if (ratio < 1) {
    const short = required - fundsEur;
    gaps.push({
      title: "Funds below the published threshold",
      detail: `Requirement is about ${eur(required)} for ${route.funds.months} months. You're short by roughly ${eur(short)} (${ngn(short * fxNgnPerEur)}). Only funds you can document legitimately count.`,
      severity: ratio < 0.5 ? "high" : "medium",
    });
  }

  // Documents
  const totalWeight = route.documents.reduce((s, d) => s + d.weight, 0) || 1;
  let earned = 0;
  for (const d of route.documents) {
    const ans = a.docs[d.key] ?? "no";
    if (ans === "yes") earned += d.weight;
    else if (ans === "progress") earned += d.weight / 2;
    if (ans !== "yes") {
      gaps.push({
        title: ans === "progress" ? `Finish: ${d.label}` : `Missing: ${d.label}`,
        detail: d.help,
        severity: d.weight >= 3 && ans === "no" ? "high" : "low",
      });
    }
  }
  const docsScore = (earned / totalWeight) * w.documents;

  // Route-specific
  let routeFactor = 0;
  let points: number | null = null;
  if (route.slug === "germany-opportunity") {
    points = opportunityPoints(a);
    if (!opportunityBaseMet(a)) {
      gaps.push({
        title: "Base requirements not met",
        detail: "You need a degree or 2-year vocational qualification recognised in Nigeria, plus German A1 or English B2.",
        severity: "high",
      });
    } else if (a.recognition === "full") {
      routeFactor = 1;
    } else if (points >= 6) {
      routeFactor = 1;
    } else {
      routeFactor = points >= 4 ? 0.5 : 0;
      gaps.push({
        title: `Indicative points: ${points} of 6`,
        detail: "Language level, recognition of your qualification and relevant experience add the most points.",
        severity: points >= 4 ? "medium" : "high",
      });
    }
  } else {
    routeFactor = a.admission === "yes" ? 1 : a.admission === "applied" ? 0.5 : 0;
    if (a.admission !== "yes") {
      gaps.push({
        title: a.admission === "applied" ? "Admission pending" : "No admission yet",
        detail: "The permit/visa application starts from a university admission letter.",
        severity: a.admission === "applied" ? "medium" : "high",
      });
    }
  }
  const routeScore = routeFactor * w.route;

  const total = w.funds + w.documents + w.route || 1;
  const score = Math.round(((fundsScore + docsScore + routeScore) / total) * 100);
  const order = { high: 0, medium: 1, low: 2 };
  gaps.sort((x, y) => order[x.severity] - order[y.severity]);

  return {
    score,
    band: bandFor(score),
    fundsRequiredEur: required,
    fundsEur,
    points,
    breakdown: {
      funds: Math.round(fundsScore),
      documents: Math.round(docsScore),
      route: Math.round(routeScore),
    },
    gaps,
  };
}

export const DEFAULT_ANSWERS: ReadinessAnswers = {
  route: "austria-student",
  age: 25,
  qualification: "bachelor",
  admission: "no",
  fundsNgn: 15_000_000,
  docs: {},
  germanLevel: "none",
  englishLevel: "B2",
  recognition: "unsure",
  experience: "none",
  priorStay: false,
  spouseEligible: false,
  shortage: "unsure",
};
