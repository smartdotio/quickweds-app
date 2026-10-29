import "server-only";
import { randomUUID } from "node:crypto";
import { ROUTE_SEED } from "../routes-seed";
import type {
  ActivityEntry,
  Booking,
  CaseDetail,
  CaseDocument,
  CaseSummary,
  Lead,
  Order,
  PackageOffer,
  Product,
  Profile,
  RouteTemplate,
  Settings,
} from "../types";
import type { Repo } from "./types";

/**
 * In-memory implementation used when Supabase isn't configured.
 * State is per server process and resets on restart.
 */

interface DemoCase {
  id: string;
  clientId: string;
  routeId: string | null;
  consultantId: string | null;
  currentStageId: string | null;
  status: "active" | "closed";
  outcome: string | null;
  closedAt: string | null;
  retainUntil: string | null;
  createdAt: string;
  updatedAt: string;
}

interface DemoDoc extends CaseDocument {
  caseId: string;
  storagePath: string | null;
}

interface Store {
  routes: RouteTemplate[];
  settings: Settings;
  products: Product[];
  profiles: Profile[];
  leads: (Lead & { profileId: string | null; answers: unknown })[];
  orders: (Order & { caseId: string | null })[];
  bookings: Booking[];
  cases: DemoCase[];
  events: { id: string; caseId: string; stageId: string; note: string | null; actorId: string | null; createdAt: string }[];
  docs: DemoDoc[];
  notes: { id: string; caseId: string; body: string; actorId: string; createdAt: string }[];
  offers: PackageOffer[];
  declarations: { profileId: string; acceptedAt: string }[];
  deletionRequests: { id: string; profileId: string; requestedAt: string }[];
  activity: { id: string; caseId: string; actorId: string | null; action: string; detail: string; createdAt: string }[];
}

const DAY = 86_400_000;
const ago = (days: number, hours = 0) => new Date(Date.now() - days * DAY - hours * 3_600_000).toISOString();
const ahead = (days: number, hour = 14) => {
  const d = new Date(Date.now() + days * DAY);
  d.setUTCHours(hour - 1, 0, 0, 0);
  return d.toISOString();
};

export const DEMO_ADMIN_ID = "demo-admin";
export const DEMO_CLIENT_ID = "demo-client";

function seed(): Store {
  const routes = structuredClone(ROUTE_SEED);
  const profiles: Profile[] = [
    { id: DEMO_ADMIN_ID, role: "admin", fullName: "Osagie Idahosa", email: "osagie@demo.osagieco", phone: "+2348030000001" },
    { id: "demo-consultant", role: "consultant", fullName: "Funmi Adeyemi", email: "funmi@demo.osagieco", phone: "+2348030000002" },
    { id: DEMO_CLIENT_ID, role: "client", fullName: "Adaeze Okafor", email: "adaeze@example.com", phone: "+2348091234567" },
    { id: "demo-c2", role: "client", fullName: "Tunde Bakare", email: "tunde@example.com", phone: "+2348021112222" },
    { id: "demo-c3", role: "client", fullName: "Chiamaka Eze", email: "chiamaka@example.com", phone: "+2348033334444" },
    { id: "demo-c4", role: "client", fullName: "Emeka Obi", email: "emeka@example.com", phone: "+2348055556666" },
    { id: "demo-c5", role: "client", fullName: "Ifeoma Nwosu", email: "ifeoma@example.com", phone: "+2348077778888" },
  ];

  const s: Store = {
    routes,
    settings: {
      fxNgnPerEur: 1700,
      fxUpdatedAt: "2026-10-29",
      quickTags: [
        "Police clearance must be under 3 months old",
        "Translation must be by a sworn translator",
        "Page missing — please upload all pages",
        "Scan unreadable — please re-scan in colour",
        "Name doesn't match passport",
        "Document must be legalised",
      ],
    },
    products: [
      {
        id: "prod-session",
        slug: "strategy-session",
        name: "Strategy Session",
        priceKobo: 4_500_000,
        description: "45-minute 1-on-1 video session, written action plan within 48 hours, 30 days of portal access.",
        active: true,
      },
    ],
    profiles,
    leads: [],
    orders: [],
    bookings: [],
    cases: [],
    events: [],
    docs: [],
    notes: [],
    offers: [],
    declarations: [{ profileId: DEMO_CLIENT_ID, acceptedAt: ago(20) }],
    deletionRequests: [],
    activity: [],
  };

  const mkCase = (
    id: string,
    clientId: string,
    routeId: string | null,
    stagePos: number,
    docStatuses: CaseDocument["status"][],
    createdDaysAgo: number,
  ) => {
    const route = routes.find((r) => r.id === routeId) ?? null;
    s.cases.push({
      id,
      clientId,
      routeId,
      consultantId: clientId === "demo-c3" ? "demo-consultant" : DEMO_ADMIN_ID,
      currentStageId: route ? route.stages[stagePos - 1].id : null,
      status: "active",
      outcome: null,
      closedAt: null,
      retainUntil: null,
      createdAt: ago(createdDaysAgo),
      updatedAt: ago(1),
    });
    if (route) {
      route.stages.slice(0, stagePos).forEach((st, i) =>
        s.events.push({
          id: randomUUID(),
          caseId: id,
          stageId: st.id,
          note: i === stagePos - 1 && stagePos === 3 ? "Embassy appointment confirmed for Tuesday 9:00. Bring originals of everything in your vault." : null,
          actorId: DEMO_ADMIN_ID,
          createdAt: ago(createdDaysAgo - i * 6),
        }),
      );
      route.documents.forEach((d, i) => {
        const status = docStatuses[i] ?? "missing";
        s.docs.push({
          id: `${id}-doc-${d.key}`,
          caseId: id,
          routeDocumentId: d.id,
          label: d.label,
          help: d.help,
          status,
          reason: status === "action_required" ? (d.key === "police" ? "Police clearance must be under 3 months old" : "Scan unreadable — please re-scan in colour") : null,
          fileName: status === "missing" ? null : `${d.key}.pdf`,
          version: status === "missing" ? 0 : 1,
          uploadedAt: status === "missing" ? null : ago(10 - i),
          reviewedAt: status === "verified" || status === "action_required" ? ago(5 - i / 2) : null,
          storagePath: null,
        });
      });
    }
    const order: Order & { caseId: string | null } = {
      id: `${id}-order`,
      profileId: clientId,
      leadId: null,
      caseId: id,
      email: profiles.find((p) => p.id === clientId)!.email,
      fullName: profiles.find((p) => p.id === clientId)!.fullName,
      kind: "session",
      productName: "Strategy Session",
      amountKobo: 4_500_000,
      status: "paid",
      reference: `OSG-DEMO-${id.toUpperCase()}`,
      agreementVersion: "2026-10-29",
      acceptedAt: ago(createdDaysAgo),
      paidAt: ago(createdDaysAgo),
      packageOfferId: null,
    };
    s.orders.push(order);
    return order;
  };

  const o1 = mkCase("case-adaeze", DEMO_CLIENT_ID, "austria-student", 3,
    ["verified", "verified", "verified", "verified", "pending", "verified", "action_required", "verified"], 34);
  s.bookings.push({ id: "bk-1", orderId: o1.id, startsAt: ahead(2), status: "booked", meetingUrl: "https://meet.google.com/demo-osg-adz", matched: true });
  s.offers.push({
    id: "offer-adaeze",
    caseId: "case-adaeze",
    title: "Austria Student — Full Service",
    scope: [
      "Document legalisation & translation coordination",
      "Embassy application file review and mock interview",
      "Liaison until permit approval",
      "Arrival checklist: Meldezettel, bank, insurance",
    ],
    priceKobo: 85_000_000,
    status: "paid",
    createdAt: ago(28),
  });
  s.notes.push({ id: randomUUID(), caseId: "case-adaeze", body: "Strong file. Watch police clearance date — expires before embassy slot.", actorId: DEMO_ADMIN_ID, createdAt: ago(4) });

  const o2 = mkCase("case-tunde", "demo-c2", "germany-opportunity", 2,
    ["verified", "verified", "pending", "missing", "pending", "missing", "verified"], 12);
  s.bookings.push({ id: "bk-2", orderId: o2.id, startsAt: ahead(5, 11), status: "booked", meetingUrl: "https://meet.google.com/demo-osg-tnd", matched: true });
  mkCase("case-chiamaka", "demo-c3", "germany-student", 4,
    ["verified", "verified", "verified", "verified", "verified", "verified", "pending"], 52);
  mkCase("case-emeka", "demo-c4", "austria-student", 5,
    ["verified", "verified", "verified", "verified", "verified", "verified", "verified", "verified"], 80);
  const o5 = mkCase("case-ifeoma", "demo-c5", null, 1, [], 1);
  s.bookings.push({ id: "bk-5", orderId: null, startsAt: ahead(1, 16), status: "booked", meetingUrl: null, matched: false });
  void o5;

  s.activity.push(
    { id: randomUUID(), caseId: "case-adaeze", actorId: DEMO_ADMIN_ID, action: "document.action_required", detail: "Police clearance certificate: Police clearance must be under 3 months old", createdAt: ago(3) },
    { id: randomUUID(), caseId: "case-adaeze", actorId: DEMO_CLIENT_ID, action: "document.uploaded", detail: "Health insurance (v1)", createdAt: ago(2) },
    { id: randomUUID(), caseId: "case-adaeze", actorId: DEMO_ADMIN_ID, action: "stage.changed", detail: "Application lodged in Abuja", createdAt: ago(1) },
  );
  return s;
}

const g = globalThis as unknown as { __osgDemo?: Store };
function db(): Store {
  if (!g.__osgDemo) g.__osgDemo = seed();
  return g.__osgDemo;
}

const now = () => new Date().toISOString();
const nameOf = (id: string | null) => (id ? db().profiles.find((p) => p.id === id)?.fullName ?? "Unknown" : "System");

function log(caseId: string, actorId: string | null, action: string, detail: string) {
  db().activity.unshift({ id: randomUUID(), caseId, actorId, action, detail, createdAt: now() });
  const c = db().cases.find((x) => x.id === caseId);
  if (c) c.updatedAt = now();
}

function summary(c: DemoCase): CaseSummary {
  const s = db();
  const client = s.profiles.find((p) => p.id === c.clientId)!;
  const docs = s.docs.filter((d) => d.caseId === c.id);
  const orderIds = s.orders.filter((o) => o.caseId === c.id).map((o) => o.id);
  const lastAct = s.activity.find((a) => a.caseId === c.id)?.createdAt ?? c.updatedAt;
  return {
    id: c.id,
    client,
    route: s.routes.find((r) => r.id === c.routeId) ?? null,
    currentStageId: c.currentStageId,
    consultantName: c.consultantId ? nameOf(c.consultantId) : null,
    status: c.status,
    actionItems: docs.filter((d) => d.status === "action_required").length,
    pendingReview: docs.filter((d) => d.status === "pending").length,
    unmatchedBooking:
      c.clientId === "demo-c5" ||
      s.bookings.some((b) => !b.matched && b.orderId && orderIds.includes(b.orderId)),
    lastActivityAt: lastAct > c.updatedAt ? lastAct : c.updatedAt,
  };
}

function strip<T extends { caseId?: unknown; storagePath?: unknown }>(d: T): CaseDocument {
  const { caseId: _c, storagePath: _s, ...rest } = d as T & Record<string, unknown>;
  void _c;
  void _s;
  return rest as unknown as CaseDocument;
}

function seedDocsForRoute(caseId: string, route: RouteTemplate) {
  const s = db();
  for (const d of route.documents) {
    if (s.docs.some((x) => x.caseId === caseId && x.routeDocumentId === d.id)) continue;
    s.docs.push({
      id: randomUUID(),
      caseId,
      routeDocumentId: d.id,
      label: d.label,
      help: d.help,
      status: "missing",
      reason: null,
      fileName: null,
      version: 0,
      uploadedAt: null,
      reviewedAt: null,
      storagePath: null,
    });
  }
}

export const demoRepo: Repo = {
  async getRoutes() {
    return db().routes;
  },
  async getRoute(slug) {
    return db().routes.find((r) => r.slug === slug || r.id === slug) ?? null;
  },
  async getSettings() {
    return db().settings;
  },
  async getProduct(slug) {
    return db().products.find((p) => p.slug === slug && p.active) ?? null;
  },
  async getProducts() {
    return db().products;
  },

  async saveLead(input) {
    const s = db();
    const email = input.email.toLowerCase();
    let lead = s.leads.find((l) => l.email === email);
    const fields = {
      email,
      fullName: input.fullName,
      phone: input.phone,
      routeSlug: input.routeSlug,
      band: input.result.band,
      score: input.result.score,
      gaps: input.result.gaps,
      answers: input.answers,
    };
    if (lead) Object.assign(lead, fields);
    else {
      lead = { id: randomUUID(), createdAt: now(), profileId: null, ...fields };
      s.leads.push(lead);
    }
    return { leadId: lead.id };
  },
  async getLead(id) {
    return db().leads.find((l) => l.id === id) ?? null;
  },
  async createOrder(input) {
    const order: Order & { caseId: string | null } = {
      id: randomUUID(),
      profileId: input.profileId,
      leadId: input.leadId,
      caseId: input.caseId,
      email: input.email.toLowerCase(),
      fullName: input.fullName,
      kind: input.kind,
      productName: input.productName,
      amountKobo: input.amountKobo,
      status: "pending",
      reference: `OSG-${Date.now().toString(36).toUpperCase()}-${randomUUID().slice(0, 6).toUpperCase()}`,
      agreementVersion: input.agreementVersion,
      acceptedAt: now(),
      paidAt: null,
      packageOfferId: input.packageOfferId,
    };
    db().orders.push(order);
    return order;
  },
  async getOrder(id) {
    return db().orders.find((o) => o.id === id) ?? null;
  },
  async getOrderByReference(reference) {
    return db().orders.find((o) => o.reference === reference) ?? null;
  },
  async markOrderPaid(reference) {
    const o = db().orders.find((x) => x.reference === reference);
    if (!o) return null;
    if (o.status === "paid") return { order: o, firstTime: false };
    o.status = "paid";
    o.paidAt = now();
    return { order: o, firstTime: true };
  },

  async provisionClient(order) {
    const s = db();
    let profile = s.profiles.find((p) => p.email === order.email);
    if (!profile) {
      const lead = s.leads.find((l) => l.id === order.leadId);
      profile = { id: randomUUID(), role: "client", fullName: order.fullName, email: order.email, phone: lead?.phone ?? null };
      s.profiles.push(profile);
    }
    const lead = s.leads.find((l) => l.id === order.leadId);
    if (lead) lead.profileId = profile.id;
    let c = s.cases.find((x) => x.clientId === profile!.id && x.status === "active");
    if (!c) {
      const route = lead && lead.routeSlug !== "unsure" ? s.routes.find((r) => r.slug === lead.routeSlug) ?? null : null;
      c = {
        id: randomUUID(),
        clientId: profile.id,
        routeId: route?.id ?? null,
        consultantId: null,
        currentStageId: route?.stages[0].id ?? null,
        status: "active",
        outcome: null,
        closedAt: null,
        retainUntil: null,
        createdAt: now(),
        updatedAt: now(),
      };
      s.cases.push(c);
      if (route) {
        seedDocsForRoute(c.id, route);
        s.events.push({ id: randomUUID(), caseId: c.id, stageId: route.stages[0].id, note: null, actorId: null, createdAt: now() });
      }
      log(c.id, null, "case.created", "Case opened after payment");
    }
    const o = s.orders.find((x) => x.id === order.id);
    if (o) {
      o.profileId = profile.id;
      o.caseId = c.id;
    }
    return { profile, caseId: c.id };
  },
  async magicLinkFor(_email, next) {
    return next;
  },
  async upsertBooking(input) {
    const s = db();
    const matched = !!input.orderId && s.orders.some((o) => o.id === input.orderId && o.status === "paid");
    let b = s.bookings.find((x) => x.id === input.calUid);
    if (b) Object.assign(b, { startsAt: input.startsAt, status: input.status, meetingUrl: input.meetingUrl, matched });
    else {
      b = { id: input.calUid, orderId: matched ? input.orderId : null, startsAt: input.startsAt, status: input.status, meetingUrl: input.meetingUrl, matched };
      s.bookings.push(b);
    }
    const order = s.orders.find((o) => o.id === input.orderId);
    if (order?.caseId) log(order.caseId, null, `booking.${input.status}`, new Date(input.startsAt).toUTCString());
    return b;
  },
  async getBookingForOrder(orderId) {
    return db().bookings.filter((b) => b.orderId === orderId && b.status === "booked").at(-1) ?? null;
  },

  async getProfile(id) {
    return db().profiles.find((p) => p.id === id) ?? null;
  },
  async updateProfile(id, patch) {
    const p = db().profiles.find((x) => x.id === id);
    if (p) Object.assign(p, { fullName: patch.fullName, phone: patch.phone });
  },
  async listStaff() {
    return db().profiles.filter((p) => p.role !== "client");
  },

  async getActiveCaseIdForClient(profileId) {
    return db().cases.find((c) => c.clientId === profileId && c.status === "active")?.id ?? null;
  },
  async listCases() {
    return db()
      .cases.map(summary)
      .sort((a, b) => b.lastActivityAt.localeCompare(a.lastActivityAt));
  },
  async getCase(caseId) {
    const s = db();
    const c = s.cases.find((x) => x.id === caseId);
    if (!c) return null;
    const orders = s.orders.filter((o) => o.caseId === caseId);
    const booking =
      s.bookings
        .filter((b) => b.status === "booked" && b.orderId && orders.some((o) => o.id === b.orderId))
        .at(-1) ?? (c.clientId === "demo-c5" ? s.bookings.find((b) => b.id === "bk-5") ?? null : null);
    const lead = s.leads.find((l) => l.profileId === c.clientId) ?? null;
    const activity: ActivityEntry[] = s.activity
      .filter((a) => a.caseId === caseId)
      .map((a) => ({ id: a.id, actorName: nameOf(a.actorId), action: a.action, detail: a.detail, createdAt: a.createdAt }));
    const detail: CaseDetail = {
      ...summary(c),
      events: s.events
        .filter((e) => e.caseId === caseId)
        .map((e) => ({ id: e.id, stageId: e.stageId, note: e.note, actorName: nameOf(e.actorId), createdAt: e.createdAt })),
      documents: s.docs.filter((d) => d.caseId === caseId).map(strip),
      booking,
      orders,
      offers: s.offers.filter((o) => o.caseId === caseId),
      readiness: lead,
      notes: s.notes
        .filter((n) => n.caseId === caseId)
        .map((n) => ({ id: n.id, body: n.body, actorName: nameOf(n.actorId), createdAt: n.createdAt })),
      activity,
      declarationAt: s.declarations.find((d) => d.profileId === c.clientId)?.acceptedAt ?? null,
      closedAt: c.closedAt,
    };
    return detail;
  },
  async setRoute(caseId, routeId, actorId) {
    const s = db();
    const c = s.cases.find((x) => x.id === caseId);
    const route = s.routes.find((r) => r.id === routeId);
    if (!c || !route) return;
    c.routeId = route.id;
    c.currentStageId = route.stages[0].id;
    seedDocsForRoute(caseId, route);
    s.events.push({ id: randomUUID(), caseId, stageId: route.stages[0].id, note: null, actorId, createdAt: now() });
    log(caseId, actorId, "route.set", route.name);
  },
  async setStage(caseId, stageId, note, actorId) {
    const s = db();
    const c = s.cases.find((x) => x.id === caseId);
    if (!c) return;
    c.currentStageId = stageId;
    s.events.push({ id: randomUUID(), caseId, stageId, note, actorId, createdAt: now() });
    const title = s.routes.flatMap((r) => r.stages).find((st) => st.id === stageId)?.title ?? stageId;
    log(caseId, actorId, "stage.changed", title);
  },
  async assignConsultant(caseId, consultantId, actorId) {
    const c = db().cases.find((x) => x.id === caseId);
    if (!c) return;
    c.consultantId = consultantId;
    log(caseId, actorId, "case.assigned", consultantId ? nameOf(consultantId) : "Unassigned");
  },
  async closeCase(caseId, outcome, actorId) {
    const c = db().cases.find((x) => x.id === caseId);
    if (!c) return;
    c.status = "closed";
    c.outcome = outcome;
    c.closedAt = now();
    log(caseId, actorId, "case.closed", outcome);
  },
  async extendRetention(caseId, until, reason, actorId) {
    const c = db().cases.find((x) => x.id === caseId);
    if (!c) return;
    c.retainUntil = until;
    log(caseId, actorId, "case.retention_extended", `${until}: ${reason}`);
  },
  async addNote(caseId, body, actorId) {
    db().notes.unshift({ id: randomUUID(), caseId, body, actorId, createdAt: now() });
  },

  async logActivity(caseId, actorId, action, detail) {
    log(caseId, actorId, action, detail);
  },

  async getDocument(docId) {
    const s = db();
    const d = s.docs.find((x) => x.id === docId);
    if (!d) return null;
    const c = s.cases.find((x) => x.id === d.caseId)!;
    return { doc: strip(d), caseId: d.caseId, clientId: c.clientId, storagePath: d.storagePath };
  },
  async addClientDocument(caseId, label, actorId) {
    const d: DemoDoc = {
      id: randomUUID(),
      caseId,
      routeDocumentId: null,
      label,
      help: "Additional document",
      status: "missing",
      reason: null,
      fileName: null,
      version: 0,
      uploadedAt: null,
      reviewedAt: null,
      storagePath: null,
    };
    db().docs.push(d);
    log(caseId, actorId, "document.added", label);
    return strip(d);
  },
  async recordUpload(docId, storagePath, fileName, actorId) {
    const d = db().docs.find((x) => x.id === docId);
    if (!d) return;
    Object.assign(d, {
      storagePath,
      fileName,
      version: d.version + 1,
      status: "pending",
      reason: null,
      uploadedAt: now(),
      reviewedAt: null,
    });
    log(d.caseId, actorId, "document.uploaded", `${d.label} (v${d.version})`);
  },
  async setDocumentStatus(docId, status, reason, actorId) {
    const d = db().docs.find((x) => x.id === docId);
    if (!d) return;
    Object.assign(d, { status, reason, reviewedAt: now() });
    log(d.caseId, actorId, `document.${status}`, reason ? `${d.label}: ${reason}` : d.label);
  },
  async hasDeclaration(profileId) {
    return db().declarations.some((d) => d.profileId === profileId);
  },
  async recordDeclaration(profileId) {
    if (!db().declarations.some((d) => d.profileId === profileId))
      db().declarations.push({ profileId, acceptedAt: now() });
  },

  async createOffer(caseId, offer, actorId) {
    const o: PackageOffer = { id: randomUUID(), caseId, ...offer, status: "offered", createdAt: now() };
    db().offers.push(o);
    log(caseId, actorId, "offer.created", `${offer.title}`);
    return o;
  },
  async getOffer(id) {
    return db().offers.find((o) => o.id === id) ?? null;
  },
  async markOfferPaid(id) {
    const o = db().offers.find((x) => x.id === id);
    if (o) {
      o.status = "paid";
      log(o.caseId, null, "offer.paid", o.title);
    }
  },

  async updateFx(ngnPerEur) {
    db().settings.fxNgnPerEur = ngnPerEur;
    db().settings.fxUpdatedAt = now().slice(0, 10);
  },
  async updateQuickTags(tags) {
    db().settings.quickTags = tags;
  },
  async updateProductPrice(productId, priceKobo) {
    const p = db().products.find((x) => x.id === productId);
    if (p) p.priceKobo = priceKobo;
  },
  async updateRoute(routeId, patch) {
    const r = db().routes.find((x) => x.id === routeId);
    if (r) Object.assign(r, patch);
  },

  async exportClientData(profileId) {
    const s = db();
    const cases = s.cases.filter((c) => c.clientId === profileId);
    return {
      profile: s.profiles.find((p) => p.id === profileId),
      orders: s.orders.filter((o) => o.profileId === profileId),
      cases: await Promise.all(cases.map((c) => demoRepo.getCase(c.id))),
      exportedAt: now(),
    };
  },
  async requestDeletion(profileId) {
    if (!db().deletionRequests.some((d) => d.profileId === profileId))
      db().deletionRequests.push({ id: randomUUID(), profileId, requestedAt: now() });
  },
  async listDeletionRequests() {
    const s = db();
    return s.deletionRequests.map((d) => ({
      id: d.id,
      profile: s.profiles.find((p) => p.id === d.profileId)!,
      requestedAt: d.requestedAt,
    }));
  },
  async runRetention(at) {
    const s = db();
    let casesPurged = 0;
    let filesDeleted = 0;
    for (const c of s.cases) {
      if (c.status !== "closed" || !c.closedAt) continue;
      const due = new Date(c.retainUntil ?? new Date(new Date(c.closedAt).getTime() + 90 * DAY).toISOString());
      if (due > at) continue;
      for (const d of s.docs.filter((x) => x.caseId === c.id && x.storagePath)) {
        d.storagePath = null;
        filesDeleted++;
      }
      casesPurged++;
    }
    const cutoff = new Date(at.getTime() - 365 * DAY).toISOString();
    const before = s.leads.length;
    s.leads = s.leads.filter((l) => l.profileId || l.createdAt > cutoff);
    return { casesPurged, filesDeleted, leadsDeleted: before - s.leads.length };
  },
};
