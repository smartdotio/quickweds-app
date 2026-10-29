import type {
  Booking,
  CaseDetail,
  CaseDocument,
  CaseSummary,
  DocStatus,
  FundsRule,
  Lead,
  Order,
  PackageOffer,
  Product,
  Profile,
  ReadinessAnswers,
  ReadinessResult,
  RouteSlug,
  RouteTemplate,
  Settings,
} from "../types";

export interface SaveLeadInput {
  email: string;
  fullName: string;
  phone: string;
  source: string | null;
  marketingOptIn: boolean;
  consentVersion: string;
  routeSlug: RouteSlug | "unsure";
  answers: ReadinessAnswers;
  result: ReadinessResult;
  fxRate: number;
}

export interface CreateOrderInput {
  leadId: string | null;
  profileId: string | null;
  caseId: string | null;
  email: string;
  fullName: string;
  kind: "session" | "package";
  productId: string | null;
  packageOfferId: string | null;
  productName: string;
  amountKobo: number;
  agreementVersion: string;
  ip: string | null;
  ua: string | null;
}

export interface UpsertBookingInput {
  calUid: string;
  orderId: string | null;
  email: string;
  startsAt: string;
  status: "booked" | "cancelled";
  meetingUrl: string | null;
}

export interface DocumentRef {
  doc: CaseDocument;
  caseId: string;
  clientId: string;
  storagePath: string | null;
}

export interface Repo {
  // Catalogue
  getRoutes(): Promise<RouteTemplate[]>;
  getRoute(slug: string): Promise<RouteTemplate | null>;
  getSettings(): Promise<Settings>;
  getProduct(slug: string): Promise<Product | null>;
  getProducts(): Promise<Product[]>;

  // Funnel
  saveLead(input: SaveLeadInput): Promise<{ leadId: string }>;
  getLead(id: string): Promise<Lead | null>;
  createOrder(input: CreateOrderInput): Promise<Order>;
  getOrder(id: string): Promise<Order | null>;
  getOrderByReference(reference: string): Promise<Order | null>;
  /** Idempotent. Returns firstTime=false if the order was already paid. */
  markOrderPaid(reference: string): Promise<{ order: Order; firstTime: boolean } | null>;

  // Fulfilment
  /** Creates (or finds) the client account and their active case for a paid session order. */
  provisionClient(order: Order): Promise<{ profile: Profile; caseId: string }>;
  magicLinkFor(email: string, next: string): Promise<string>;
  upsertBooking(input: UpsertBookingInput): Promise<Booking>;
  getBookingForOrder(orderId: string): Promise<Booking | null>;

  // People
  getProfile(id: string): Promise<Profile | null>;
  updateProfile(id: string, patch: { fullName: string; phone: string }): Promise<void>;
  listStaff(): Promise<Profile[]>;

  // Cases
  getActiveCaseIdForClient(profileId: string): Promise<string | null>;
  listCases(): Promise<CaseSummary[]>;
  getCase(caseId: string): Promise<CaseDetail | null>;
  setRoute(caseId: string, routeId: string, actorId: string): Promise<void>;
  setStage(caseId: string, stageId: string, note: string | null, actorId: string): Promise<void>;
  assignConsultant(caseId: string, consultantId: string | null, actorId: string): Promise<void>;
  closeCase(caseId: string, outcome: string, actorId: string): Promise<void>;
  extendRetention(caseId: string, until: string, reason: string, actorId: string): Promise<void>;
  addNote(caseId: string, body: string, actorId: string): Promise<void>;
  logActivity(caseId: string, actorId: string | null, action: string, detail: string): Promise<void>;

  // Documents
  getDocument(docId: string): Promise<DocumentRef | null>;
  addClientDocument(caseId: string, label: string, actorId: string): Promise<CaseDocument>;
  recordUpload(docId: string, storagePath: string, fileName: string, actorId: string): Promise<void>;
  setDocumentStatus(docId: string, status: DocStatus, reason: string | null, actorId: string): Promise<void>;
  hasDeclaration(profileId: string): Promise<boolean>;
  recordDeclaration(profileId: string): Promise<void>;

  // Packages
  createOffer(
    caseId: string,
    offer: { title: string; scope: string[]; priceKobo: number },
    actorId: string,
  ): Promise<PackageOffer>;
  getOffer(id: string): Promise<PackageOffer | null>;
  markOfferPaid(id: string): Promise<void>;

  // Settings (admin)
  updateFx(ngnPerEur: number, actorId: string): Promise<void>;
  updateQuickTags(tags: string[], actorId: string): Promise<void>;
  updateProductPrice(productId: string, priceKobo: number, actorId: string): Promise<void>;
  updateRoute(
    routeId: string,
    patch: { funds: FundsRule; weights: RouteTemplate["weights"]; sourceUrl: string; verifiedAt: string | null },
    actorId: string,
  ): Promise<void>;

  // Privacy
  exportClientData(profileId: string): Promise<Record<string, unknown>>;
  requestDeletion(profileId: string): Promise<void>;
  listDeletionRequests(): Promise<{ id: string; profile: Profile; requestedAt: string }[]>;
  runRetention(now: Date): Promise<{ casesPurged: number; filesDeleted: number; leadsDeleted: number }>;
}
