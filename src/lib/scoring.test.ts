import { describe, expect, it } from "vitest";
import { ROUTE_SEED } from "./routes-seed";
import { DEFAULT_ANSWERS, fundsRequiredEur, opportunityPoints, scoreReadiness } from "./scoring";
import type { ReadinessAnswers } from "./types";

const austria = ROUTE_SEED.find((r) => r.slug === "austria-student")!;
const germany = ROUTE_SEED.find((r) => r.slug === "germany-student")!;
const opp = ROUTE_SEED.find((r) => r.slug === "germany-opportunity")!;
const FX = 1700;

const allYes = (keys: string[]) => Object.fromEntries(keys.map((k) => [k, "yes" as const]));

describe("fundsRequiredEur", () => {
  it("uses the age split for Austria", () => {
    expect(fundsRequiredEur(austria, 23)).toBeCloseTo(722.58 * 12);
    expect(fundsRequiredEur(austria, 24)).toBeCloseTo(1308.39 * 12);
  });
  it("uses the flat monthly rate for Germany", () => {
    expect(fundsRequiredEur(germany, 30)).toBe(11904);
  });
});

describe("scoreReadiness", () => {
  it("is deterministic", () => {
    const a = { ...DEFAULT_ANSWERS };
    expect(scoreReadiness(a, austria, FX)).toEqual(scoreReadiness(a, austria, FX));
  });

  it("scores a fully prepared student as ready with no gaps", () => {
    const a: ReadinessAnswers = {
      ...DEFAULT_ANSWERS,
      route: "germany-student",
      admission: "yes",
      fundsNgn: 11904 * FX,
      docs: allYes(germany.documents.map((d) => d.key)),
    };
    const r = scoreReadiness(a, germany, FX);
    expect(r.score).toBe(100);
    expect(r.band).toBe("ready");
    expect(r.gaps).toHaveLength(0);
  });

  it("gives zero funds score below half the threshold", () => {
    const a = { ...DEFAULT_ANSWERS, route: "germany-student" as const, fundsNgn: 0.4 * 11904 * FX };
    const r = scoreReadiness(a, germany, FX);
    expect(r.breakdown.funds).toBe(0);
    expect(r.gaps[0].severity).toBe("high");
  });

  it("scales funds linearly between 50% and 100%", () => {
    const a = { ...DEFAULT_ANSWERS, route: "germany-student" as const, fundsNgn: 0.75 * 11904 * FX };
    expect(scoreReadiness(a, germany, FX).breakdown.funds).toBe(20);
  });

  it("returns unscored for 'unsure'", () => {
    const r = scoreReadiness({ ...DEFAULT_ANSWERS, route: "unsure" }, null, FX);
    expect(r.band).toBe("unscored");
  });

  it("flags unmet Opportunity Card base requirements", () => {
    const a: ReadinessAnswers = {
      ...DEFAULT_ANSWERS,
      route: "germany-opportunity",
      qualification: "secondary",
    };
    const r = scoreReadiness(a, opp, FX);
    expect(r.breakdown.route).toBe(0);
    expect(r.gaps.some((g) => g.title === "Base requirements not met")).toBe(true);
  });
});

describe("opportunityPoints", () => {
  it("adds the indicative criteria", () => {
    const a: ReadinessAnswers = {
      ...DEFAULT_ANSWERS,
      recognition: "partial",
      experience: "5of7",
      germanLevel: "B1",
      englishLevel: "C1",
      age: 30,
      priorStay: true,
      spouseEligible: true,
      shortage: "yes",
    };
    expect(opportunityPoints(a)).toBe(4 + 1 + 3 + 2 + 1 + 2 + 1 + 1);
  });
});
