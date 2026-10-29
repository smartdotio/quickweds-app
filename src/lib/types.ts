export type RouteSlug = "austria-student" | "germany-student" | "germany-opportunity";

export type DocAnswer = "yes" | "progress" | "no";

export type FundsRule =
  | { kind: "monthly"; monthlyEur: number; months: number }
  | { kind: "monthly_by_age"; under24Eur: number; from24Eur: number; months: number };

export interface RouteStage {
  id: string;
  position: number;
  title: string;
  description: string;
}

export interface RouteDocument {
  id: string;
  key: string;
  label: string;
  weight: number;
  help: string;
}

export interface RouteTemplate {
  id: string;
  slug: RouteSlug;
  name: string;
  country: "AT" | "DE";
  tagline: string;
  funds: FundsRule;
  fundsNote: string;
  weights: { funds: number; documents: number; route: number };
  sourceUrl: string;
  verifiedAt: string | null;
  stages: RouteStage[];
  documents: RouteDocument[];
}

export type Qualification = "secondary" | "vocational" | "bachelor" | "master" | "phd";
export type GermanLevel = "none" | "A1" | "A2" | "B1" | "B2";
export type EnglishLevel = "none" | "B1" | "B2" | "C1";

export interface ReadinessAnswers {
  route: RouteSlug | "unsure";
  age: number;
  qualification: Qualification;
  admission: "yes" | "applied" | "no";
  fundsNgn: number;
  docs: Record<string, DocAnswer>;
  // Opportunity Card only
  germanLevel: GermanLevel;
  englishLevel: EnglishLevel;
  recognition: "full" | "partial" | "none" | "unsure";
  experience: "none" | "2of5" | "5of7";
  priorStay: boolean;
  spouseEligible: boolean;
  shortage: "yes" | "no" | "unsure";
}

export type Band = "ready" | "nearly" | "not_yet" | "unscored";

export interface Gap {
  title: string;
  detail: string;
  severity: "high" | "medium" | "low";
}

export interface ReadinessResult {
  score: number;
  band: Band;
  fundsRequiredEur: number;
  fundsEur: number;
  points: number | null;
  breakdown: { funds: number; documents: number; route: number };
  gaps: Gap[];
}

export type OrderStatus = "pending" | "paid" | "refunded" | "failed";
export type DocStatus = "missing" | "pending" | "verified" | "action_required";
export type Role = "client" | "consultant" | "admin";

export interface Product {
  id: string;
  slug: string;
  name: string;
  priceKobo: number;
  description: string;
  active: boolean;
}

export interface Profile {
  id: string;
  role: Role;
  fullName: string;
  email: string;
  phone: string | null;
}

export interface Lead {
  id: string;
  email: string;
  fullName: string;
  phone: string;
  routeSlug: RouteSlug | "unsure";
  band: Band;
  score: number;
  gaps: Gap[];
  createdAt: string;
}

export interface Order {
  id: string;
  profileId: string | null;
  leadId: string | null;
  email: string;
  fullName: string;
  kind: "session" | "package";
  productName: string;
  amountKobo: number;
  status: OrderStatus;
  reference: string;
  agreementVersion: string;
  acceptedAt: string;
  paidAt: string | null;
  packageOfferId: string | null;
}

export interface Booking {
  id: string;
  orderId: string | null;
  startsAt: string;
  status: "booked" | "cancelled";
  meetingUrl: string | null;
  matched: boolean;
}

export interface StageEvent {
  id: string;
  stageId: string;
  note: string | null;
  actorName: string;
  createdAt: string;
}

export interface CaseDocument {
  id: string;
  routeDocumentId: string | null;
  label: string;
  help: string;
  status: DocStatus;
  reason: string | null;
  fileName: string | null;
  version: number;
  uploadedAt: string | null;
  reviewedAt: string | null;
}

export interface PackageOffer {
  id: string;
  caseId: string;
  title: string;
  scope: string[];
  priceKobo: number;
  status: "offered" | "paid" | "withdrawn";
  createdAt: string;
}

export interface ActivityEntry {
  id: string;
  actorName: string;
  action: string;
  detail: string;
  createdAt: string;
}

export interface CaseSummary {
  id: string;
  client: Profile;
  route: RouteTemplate | null;
  currentStageId: string | null;
  consultantName: string | null;
  status: "active" | "closed";
  actionItems: number;
  pendingReview: number;
  unmatchedBooking: boolean;
  lastActivityAt: string;
}

export interface CaseDetail extends CaseSummary {
  events: StageEvent[];
  documents: CaseDocument[];
  booking: Booking | null;
  orders: Order[];
  offers: PackageOffer[];
  readiness: Lead | null;
  notes: { id: string; body: string; actorName: string; createdAt: string }[];
  activity: ActivityEntry[];
  declarationAt: string | null;
  closedAt: string | null;
}

export interface Settings {
  fxNgnPerEur: number;
  fxUpdatedAt: string;
  quickTags: string[];
}
