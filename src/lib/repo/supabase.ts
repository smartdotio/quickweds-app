import "server-only";
import { randomUUID } from "node:crypto";
import { DOCUMENT_BUCKET, env } from "../env";
import { supabaseAdmin } from "../supabase/admin";
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

/* eslint-disable @typescript-eslint/no-explicit-any */
type Row = Record<string, any>;

const sb = () => supabaseAdmin();

/** For queries that always return data on success (lists, .single()). */
function must<T>(res: { data: T; error: { message: string } | null }): NonNullable<T> {
  if (res.error) throw new Error(res.error.message);
  return res.data as NonNullable<T>;
}

/** For .maybeSingle() queries. */
function maybe<T>(res: { data: T; error: { message: string } | null }): T {
  if (res.error) throw new Error(res.error.message);
  return res.data;
}

const toProfile = (r: Row): Profile => ({
  id: r.id,
  role: r.role,
  fullName: r.full_name,
  email: r.email,
  phone: r.phone,
});

const toRoute = (r: Row): RouteTemplate => ({
  id: r.id,
  slug: r.slug,
  name: r.name,
  country: r.country,
  tagline: r.tagline,
  funds: r.funds,
  fundsNote: r.funds_note,
  weights: r.weights,
  sourceUrl: r.source_url,
  verifiedAt: r.verified_at,
  stages: [...(r.route_stages ?? [])]
    .sort((a: Row, b: Row) => a.position - b.position)
    .map((s: Row) => ({ id: s.id, position: s.position, title: s.title, description: s.description })),
  documents: [...(r.route_documents ?? [])]
    .sort((a: Row, b: Row) => a.position - b.position)
    .map((d: Row) => ({ id: d.id, key: d.key, label: d.label, weight: d.weight, help: d.help })),
});

const toOrder = (r: Row): Order => ({
  id: r.id,
  profileId: r.profile_id,
  leadId: r.lead_id,
  email: r.email,
  fullName: r.full_name,
  kind: r.kind,
  productName: r.product_name,
  amountKobo: r.amount_kobo,
  status: r.status,
  reference: r.reference,
  agreementVersion: r.agreement_version,
  acceptedAt: r.accepted_at,
  paidAt: r.paid_at,
  packageOfferId: r.package_offer_id,
});

const toBooking = (r: Row): Booking => ({
  id: r.id,
  orderId: r.order_id,
  startsAt: r.starts_at,
  status: r.status,
  meetingUrl: r.meeting_url,
  matched: !!r.order_id,
});

const toDoc = (r: Row): CaseDocument => ({
  id: r.id,
  routeDocumentId: r.route_document_id,
  label: r.label,
  help: r.help,
  status: r.status,
  reason: r.reason,
  fileName: r.file_name,
  version: r.version,
  uploadedAt: r.uploaded_at,
  reviewedAt: r.reviewed_at,
});

const toOffer = (r: Row): PackageOffer => ({
  id: r.id,
  caseId: r.case_id,
  title: r.title,
  scope: r.scope,
  priceKobo: r.price_kobo,
  status: r.status,
  createdAt: r.created_at,
});

const ROUTE_SELECT = "*, route_stages(*), route_documents(*)";

async function log(caseId: string, actorId: string | null, action: string, detail: string) {
  await sb()
    .from("activity_log")
    .insert({ actor_id: actorId, entity: "case", entity_id: caseId, action, data: { detail } });
  await sb().from("cases").update({ updated_at: new Date().toISOString() }).eq("id", caseId);
}

async function seedDocsForRoute(caseId: string, routeId: string) {
  const docs = must(await sb().from("route_documents").select("*").eq("route_id", routeId).order("position"));
  const existing = must(await sb().from("case_documents").select("route_document_id").eq("case_id", caseId));
  const have = new Set(existing.map((e: Row) => e.route_document_id));
  const rows = docs
    .filter((d: Row) => !have.has(d.id))
    .map((d: Row) => ({
      case_id: caseId,
      route_document_id: d.id,
      label: d.label,
      help: d.help,
      position: d.position,
    }));
  if (rows.length) must(await sb().from("case_documents").insert(rows));
}

async function firstStageId(routeId: string): Promise<string | null> {
  const r = must(
    await sb().from("route_stages").select("id").eq("route_id", routeId).order("position").limit(1),
  );
  return r[0]?.id ?? null;
}

async function profileByEmail(email: string): Promise<Profile | null> {
  const r = maybe(await sb().from("profiles").select("*").eq("email", email.toLowerCase()).maybeSingle());
  return r ? toProfile(r) : null;
}

function summarise(c: Row, ctx: { docs: Row[]; unmatchedEmails: Set<string>; routes: RouteTemplate[]; lastAct: Map<string, string> }): CaseSummary {
  const docs = ctx.docs.filter((d) => d.case_id === c.id);
  const client = toProfile(c.client);
  const last = ctx.lastAct.get(c.id);
  return {
    id: c.id,
    client,
    route: ctx.routes.find((r) => r.id === c.route_id) ?? null,
    currentStageId: c.current_stage_id,
    consultantName: c.consultant?.full_name ?? null,
    status: c.status,
    actionItems: docs.filter((d) => d.status === "action_required").length,
    pendingReview: docs.filter((d) => d.status === "pending").length,
    unmatchedBooking: ctx.unmatchedEmails.has(client.email),
    lastActivityAt: last && last > c.updated_at ? last : c.updated_at,
  };
}

const CASE_SELECT = "*, client:profiles!cases_client_id_fkey(*), consultant:profiles!cases_consultant_id_fkey(full_name)";

export const supabaseRepo: Repo = {
  async getRoutes() {
    const rows = must(await sb().from("routes").select(ROUTE_SELECT).eq("active", true).order("position"));
    return rows.map(toRoute);
  },
  async getRoute(slug) {
    const r = maybe(await sb().from("routes").select(ROUTE_SELECT).eq("slug", slug).maybeSingle());
    return r ? toRoute(r) : null;
  },
  async getSettings(): Promise<Settings> {
    const rows = must(await sb().from("settings").select("key, value"));
    const get = (k: string) => rows.find((r: Row) => r.key === k)?.value;
    const fx = get("fx") ?? { ngnPerEur: 1700, updatedAt: "" };
    return { fxNgnPerEur: Number(fx.ngnPerEur), fxUpdatedAt: fx.updatedAt, quickTags: get("quick_tags") ?? [] };
  },
  async getProduct(slug) {
    const r = maybe(await sb().from("products").select("*").eq("slug", slug).eq("active", true).maybeSingle());
    return r ? ({ id: r.id, slug: r.slug, name: r.name, priceKobo: r.price_kobo, description: r.description, active: r.active } as Product) : null;
  },
  async getProducts() {
    const rows = must(await sb().from("products").select("*").order("name"));
    return rows.map((r: Row) => ({ id: r.id, slug: r.slug, name: r.name, priceKobo: r.price_kobo, description: r.description, active: r.active }));
  },

  async saveLead(input) {
    const lead = must(
      await sb()
        .from("leads")
        .upsert(
          {
            email: input.email.toLowerCase(),
            full_name: input.fullName,
            phone: input.phone,
            source: input.source,
            consent_at: new Date().toISOString(),
            consent_version: input.consentVersion,
            marketing_opt_in: input.marketingOptIn,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "email" },
        )
        .select("id")
        .single(),
    );
    must(
      await sb().from("readiness_results").insert({
        lead_id: lead.id,
        route_id: input.routeSlug === "unsure" ? null : input.routeSlug,
        answers: input.answers,
        score: input.result.score,
        band: input.result.band,
        gaps: input.result.gaps,
        fx_rate: input.fxRate,
      }),
    );
    return { leadId: lead.id };
  },
  async getLead(id) {
    const l = maybe(await sb().from("leads").select("*").eq("id", id).maybeSingle());
    if (!l) return null;
    const rr = must(
      await sb().from("readiness_results").select("*").eq("lead_id", id).order("created_at", { ascending: false }).limit(1),
    )[0];
    return {
      id: l.id,
      email: l.email,
      fullName: l.full_name,
      phone: l.phone,
      routeSlug: rr?.route_id ?? "unsure",
      band: rr?.band ?? "unscored",
      score: rr?.score ?? 0,
      gaps: rr?.gaps ?? [],
      createdAt: l.created_at,
    } satisfies Lead;
  },
  async createOrder(input) {
    const r = must(
      await sb()
        .from("orders")
        .insert({
          profile_id: input.profileId,
          lead_id: input.leadId,
          case_id: input.caseId,
          email: input.email.toLowerCase(),
          full_name: input.fullName,
          kind: input.kind,
          product_id: input.productId,
          package_offer_id: input.packageOfferId,
          product_name: input.productName,
          amount_kobo: input.amountKobo,
          reference: `OSG-${Date.now().toString(36).toUpperCase()}-${randomUUID().slice(0, 6).toUpperCase()}`,
          agreement_version: input.agreementVersion,
          accepted_at: new Date().toISOString(),
          accepted_ip: input.ip,
          accepted_ua: input.ua,
        })
        .select("*")
        .single(),
    );
    return toOrder(r);
  },
  async getOrder(id) {
    const r = maybe(await sb().from("orders").select("*").eq("id", id).maybeSingle());
    return r ? toOrder(r) : null;
  },
  async getOrderByReference(reference) {
    const r = maybe(await sb().from("orders").select("*").eq("reference", reference).maybeSingle());
    return r ? toOrder(r) : null;
  },
  async markOrderPaid(reference) {
    const updated = must(
      await sb()
        .from("orders")
        .update({ status: "paid", paid_at: new Date().toISOString() })
        .eq("reference", reference)
        .eq("status", "pending")
        .select("*"),
    );
    if (updated.length) return { order: toOrder(updated[0]), firstTime: true };
    const existing = await supabaseRepo.getOrderByReference(reference);
    if (!existing || existing.status !== "paid") return null;
    return { order: existing, firstTime: false };
  },

  async provisionClient(order) {
    let profile = await profileByEmail(order.email);
    if (!profile) {
      const lead = order.leadId ? await supabaseRepo.getLead(order.leadId) : null;
      const created = await sb().auth.admin.createUser({
        email: order.email,
        email_confirm: true,
        user_metadata: { full_name: order.fullName, phone: lead?.phone ?? null },
      });
      if (created.error && !/already/i.test(created.error.message)) throw new Error(created.error.message);
      profile = await profileByEmail(order.email);
      if (!profile) throw new Error("Profile was not created for new user");
    }
    if (order.leadId) await sb().from("leads").update({ profile_id: profile.id }).eq("id", order.leadId);

    let caseId = await supabaseRepo.getActiveCaseIdForClient(profile.id);
    if (!caseId) {
      let routeId: string | null = null;
      if (order.leadId) {
        const rr = must(
          await sb().from("readiness_results").select("route_id").eq("lead_id", order.leadId).order("created_at", { ascending: false }).limit(1),
        )[0];
        routeId = rr?.route_id ?? null;
      }
      const stageId = routeId ? await firstStageId(routeId) : null;
      const c = must(
        await sb()
          .from("cases")
          .insert({ client_id: profile.id, route_id: routeId, current_stage_id: stageId })
          .select("id")
          .single(),
      );
      caseId = c.id as string;
      if (routeId && stageId) {
        await seedDocsForRoute(caseId, routeId);
        await sb().from("case_stage_events").insert({ case_id: caseId, stage_id: stageId });
      }
      await log(caseId, null, "case.created", "Case opened after payment");
    }
    await sb().from("orders").update({ profile_id: profile.id, case_id: caseId }).eq("id", order.id);
    return { profile, caseId };
  },
  async magicLinkFor(email, next) {
    const res = await sb().auth.admin.generateLink({ type: "magiclink", email });
    if (res.error) throw new Error(res.error.message);
    const hash = res.data.properties.hashed_token;
    return `${env.siteUrl}/auth/confirm?token_hash=${encodeURIComponent(hash)}&type=magiclink&next=${encodeURIComponent(next)}`;
  },
  async upsertBooking(input) {
    let orderId = input.orderId;
    if (orderId) {
      const o = await supabaseRepo.getOrder(orderId);
      if (!o || o.status !== "paid") orderId = null;
    }
    const r = must(
      await sb()
        .from("bookings")
        .upsert(
          {
            cal_uid: input.calUid,
            order_id: orderId,
            email: input.email.toLowerCase(),
            starts_at: input.startsAt,
            status: input.status,
            meeting_url: input.meetingUrl,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "cal_uid" },
        )
        .select("*")
        .single(),
    );
    if (orderId) {
      const caseRow = must(await sb().from("orders").select("case_id").eq("id", orderId).single());
      if (caseRow.case_id) await log(caseRow.case_id, null, `booking.${input.status}`, new Date(input.startsAt).toUTCString());
    }
    return toBooking(r);
  },
  async getBookingForOrder(orderId) {
    const r = must(
      await sb().from("bookings").select("*").eq("order_id", orderId).eq("status", "booked").order("starts_at", { ascending: false }).limit(1),
    );
    return r[0] ? toBooking(r[0]) : null;
  },

  async getProfile(id) {
    const r = maybe(await sb().from("profiles").select("*").eq("id", id).maybeSingle());
    return r ? toProfile(r) : null;
  },
  async updateProfile(id, patch) {
    must(await sb().from("profiles").update({ full_name: patch.fullName, phone: patch.phone }).eq("id", id));
  },
  async listStaff() {
    const rows = must(await sb().from("profiles").select("*").in("role", ["consultant", "admin"]).order("full_name"));
    return rows.map(toProfile);
  },

  async getActiveCaseIdForClient(profileId) {
    const r = maybe(
      await sb().from("cases").select("id").eq("client_id", profileId).eq("status", "active").maybeSingle(),
    );
    return r?.id ?? null;
  },
  async listCases() {
    const [cases, routes, unmatched] = await Promise.all([
      sb().from("cases").select(CASE_SELECT).order("updated_at", { ascending: false }).limit(500).then(must),
      supabaseRepo.getRoutes(),
      sb().from("bookings").select("email").is("order_id", null).eq("status", "booked").then(must),
    ]);
    const ids = cases.map((c: Row) => c.id);
    const docs = ids.length ? must(await sb().from("case_documents").select("case_id, status").in("case_id", ids)) : [];
    return cases.map((c: Row) =>
      summarise(c, {
        docs,
        routes,
        unmatchedEmails: new Set(unmatched.map((u: Row) => u.email)),
        lastAct: new Map(),
      }),
    );
  },
  async getCase(caseId) {
    const c = maybe(await sb().from("cases").select(CASE_SELECT).eq("id", caseId).maybeSingle());
    if (!c) return null;
    const [routes, events, docs, orders, offers, notes, activity, decl, leadRow] = await Promise.all([
      supabaseRepo.getRoutes(),
      sb().from("case_stage_events").select("*, actor:profiles(full_name)").eq("case_id", caseId).order("created_at").then(must),
      sb().from("case_documents").select("*").eq("case_id", caseId).order("position").then(must),
      sb().from("orders").select("*").eq("case_id", caseId).order("created_at").then(must),
      sb().from("package_offers").select("*").eq("case_id", caseId).order("created_at").then(must),
      sb().from("case_notes").select("*, actor:profiles(full_name)").eq("case_id", caseId).order("created_at", { ascending: false }).then(must),
      sb().from("activity_log").select("*, actor:profiles(full_name)").eq("entity", "case").eq("entity_id", caseId).order("created_at", { ascending: false }).limit(100).then(must),
      sb().from("declarations").select("accepted_at").eq("profile_id", c.client_id).eq("kind", "authenticity").maybeSingle().then(maybe),
      sb().from("leads").select("id").eq("profile_id", c.client_id).maybeSingle().then(maybe),
    ]);
    const orderIds = orders.map((o: Row) => o.id);
    const bookings = orderIds.length
      ? must(await sb().from("bookings").select("*").in("order_id", orderIds).eq("status", "booked").order("starts_at"))
      : [];
    const unmatched = must(
      await sb().from("bookings").select("email").is("order_id", null).eq("status", "booked").eq("email", c.client.email),
    );
    const base = summarise(c, {
      docs,
      routes,
      unmatchedEmails: new Set(unmatched.map((u: Row) => u.email)),
      lastAct: new Map(activity[0] ? [[caseId, activity[0].created_at]] : []),
    });
    const detail: CaseDetail = {
      ...base,
      events: events.map((e: Row) => ({ id: e.id, stageId: e.stage_id, note: e.note, actorName: e.actor?.full_name ?? "System", createdAt: e.created_at })),
      documents: docs.map(toDoc),
      booking: bookings.length ? toBooking(bookings[bookings.length - 1]) : null,
      orders: orders.map(toOrder),
      offers: offers.map(toOffer),
      readiness: leadRow ? await supabaseRepo.getLead(leadRow.id) : null,
      notes: notes.map((n: Row) => ({ id: n.id, body: n.body, actorName: n.actor?.full_name ?? "Unknown", createdAt: n.created_at })),
      activity: activity.map(
        (a: Row): ActivityEntry => ({ id: String(a.id), actorName: a.actor?.full_name ?? "System", action: a.action, detail: a.data?.detail ?? "", createdAt: a.created_at }),
      ),
      declarationAt: decl?.accepted_at ?? null,
      closedAt: c.closed_at,
    };
    return detail;
  },
  async setRoute(caseId, routeId, actorId) {
    const stageId = await firstStageId(routeId);
    must(await sb().from("cases").update({ route_id: routeId, current_stage_id: stageId }).eq("id", caseId));
    await seedDocsForRoute(caseId, routeId);
    if (stageId) await sb().from("case_stage_events").insert({ case_id: caseId, stage_id: stageId, actor_id: actorId });
    await log(caseId, actorId, "route.set", routeId);
  },
  async setStage(caseId, stageId, note, actorId) {
    must(await sb().from("cases").update({ current_stage_id: stageId }).eq("id", caseId));
    must(await sb().from("case_stage_events").insert({ case_id: caseId, stage_id: stageId, note, actor_id: actorId }));
    const st = must(await sb().from("route_stages").select("title").eq("id", stageId).single());
    await log(caseId, actorId, "stage.changed", st.title);
  },
  async assignConsultant(caseId, consultantId, actorId) {
    must(await sb().from("cases").update({ consultant_id: consultantId }).eq("id", caseId));
    const p = consultantId ? await supabaseRepo.getProfile(consultantId) : null;
    await log(caseId, actorId, "case.assigned", p?.fullName ?? "Unassigned");
  },
  async closeCase(caseId, outcome, actorId) {
    must(await sb().from("cases").update({ status: "closed", outcome, closed_at: new Date().toISOString() }).eq("id", caseId));
    await log(caseId, actorId, "case.closed", outcome);
  },
  async extendRetention(caseId, until, reason, actorId) {
    must(await sb().from("cases").update({ retain_until: until, retain_reason: reason }).eq("id", caseId));
    await log(caseId, actorId, "case.retention_extended", `${until}: ${reason}`);
  },
  async addNote(caseId, body, actorId) {
    must(await sb().from("case_notes").insert({ case_id: caseId, body, actor_id: actorId }));
  },

  async logActivity(caseId, actorId, action, detail) {
    await sb().from("activity_log").insert({ actor_id: actorId, entity: "case", entity_id: caseId, action, data: { detail } });
  },

  async getDocument(docId) {
    const d = maybe(await sb().from("case_documents").select("*, case:cases(client_id)").eq("id", docId).maybeSingle());
    if (!d) return null;
    return { doc: toDoc(d), caseId: d.case_id, clientId: d.case.client_id, storagePath: d.storage_path };
  },
  async addClientDocument(caseId, label, actorId) {
    const d = must(
      await sb().from("case_documents").insert({ case_id: caseId, label, help: "Additional document", position: 100 }).select("*").single(),
    );
    await log(caseId, actorId, "document.added", label);
    return toDoc(d);
  },
  async recordUpload(docId, storagePath, fileName, actorId) {
    const d = must(await sb().from("case_documents").select("*").eq("id", docId).single());
    const version = d.version + 1;
    must(
      await sb()
        .from("case_documents")
        .update({ storage_path: storagePath, file_name: fileName, version, status: "pending", reason: null, uploaded_at: new Date().toISOString(), reviewed_at: null, reviewed_by: null })
        .eq("id", docId),
    );
    must(await sb().from("case_document_versions").insert({ case_document_id: docId, version, storage_path: storagePath, file_name: fileName }));
    await log(d.case_id, actorId, "document.uploaded", `${d.label} (v${version})`);
  },
  async setDocumentStatus(docId, status, reason, actorId) {
    const d = must(
      await sb()
        .from("case_documents")
        .update({ status, reason, reviewed_by: actorId, reviewed_at: new Date().toISOString() })
        .eq("id", docId)
        .select("case_id, label")
        .single(),
    );
    await log(d.case_id, actorId, `document.${status}`, reason ? `${d.label}: ${reason}` : d.label);
  },
  async hasDeclaration(profileId) {
    const r = maybe(await sb().from("declarations").select("id").eq("profile_id", profileId).eq("kind", "authenticity").maybeSingle());
    return !!r;
  },
  async recordDeclaration(profileId) {
    must(await sb().from("declarations").upsert({ profile_id: profileId, kind: "authenticity" }, { onConflict: "profile_id,kind", ignoreDuplicates: true }));
  },

  async createOffer(caseId, offer, actorId) {
    const r = must(
      await sb()
        .from("package_offers")
        .insert({ case_id: caseId, title: offer.title, scope: offer.scope, price_kobo: offer.priceKobo, created_by: actorId })
        .select("*")
        .single(),
    );
    await log(caseId, actorId, "offer.created", offer.title);
    return toOffer(r);
  },
  async getOffer(id) {
    const r = maybe(await sb().from("package_offers").select("*").eq("id", id).maybeSingle());
    return r ? toOffer(r) : null;
  },
  async markOfferPaid(id) {
    const r = must(await sb().from("package_offers").update({ status: "paid" }).eq("id", id).select("case_id, title").single());
    await log(r.case_id, null, "offer.paid", r.title);
  },

  async updateFx(ngnPerEur) {
    must(
      await sb().from("settings").upsert({ key: "fx", value: { ngnPerEur, updatedAt: new Date().toISOString().slice(0, 10) }, updated_at: new Date().toISOString() }),
    );
  },
  async updateQuickTags(tags) {
    must(await sb().from("settings").upsert({ key: "quick_tags", value: tags, updated_at: new Date().toISOString() }));
  },
  async updateProductPrice(productId, priceKobo) {
    must(await sb().from("products").update({ price_kobo: priceKobo }).eq("id", productId));
  },
  async updateRoute(routeId, patch) {
    must(
      await sb()
        .from("routes")
        .update({ funds: patch.funds, weights: patch.weights, source_url: patch.sourceUrl, verified_at: patch.verifiedAt })
        .eq("id", routeId),
    );
  },

  async exportClientData(profileId) {
    const profile = await supabaseRepo.getProfile(profileId);
    const orders = must(await sb().from("orders").select("*").eq("profile_id", profileId));
    const caseIds = must(await sb().from("cases").select("id").eq("client_id", profileId)).map((c: Row) => c.id);
    const cases = await Promise.all(caseIds.map((id: string) => supabaseRepo.getCase(id)));
    // Internal notes are staff working papers; activity is included.
    return {
      profile,
      orders: orders.map(toOrder),
      cases: cases.map((c) => (c ? { ...c, notes: undefined } : c)),
      exportedAt: new Date().toISOString(),
    };
  },
  async requestDeletion(profileId) {
    const open = must(await sb().from("deletion_requests").select("id").eq("profile_id", profileId).is("completed_at", null));
    if (!open.length) must(await sb().from("deletion_requests").insert({ profile_id: profileId }));
  },
  async listDeletionRequests() {
    const rows = must(
      await sb().from("deletion_requests").select("*, profile:profiles(*)").is("completed_at", null).order("requested_at"),
    );
    return rows.map((r: Row) => ({ id: r.id, profile: toProfile(r.profile), requestedAt: r.requested_at }));
  },
  async runRetention(at) {
    const DAY = 86_400_000;
    const closed = must(
      await sb().from("cases").select("id, closed_at, retain_until").eq("status", "closed").is("documents_purged_at", null),
    );
    let casesPurged = 0;
    let filesDeleted = 0;
    for (const c of closed) {
      const due = c.retain_until ? new Date(c.retain_until) : new Date(new Date(c.closed_at).getTime() + 90 * DAY);
      if (due > at) continue;
      const docs = must(await sb().from("case_documents").select("id").eq("case_id", c.id));
      const docIds = docs.map((d: Row) => d.id);
      const versions = docIds.length
        ? must(await sb().from("case_document_versions").select("storage_path").in("case_document_id", docIds))
        : [];
      const paths = versions.map((v: Row) => v.storage_path);
      for (let i = 0; i < paths.length; i += 100) {
        const res = await sb().storage.from(DOCUMENT_BUCKET).remove(paths.slice(i, i + 100));
        if (res.error) throw new Error(res.error.message);
      }
      filesDeleted += paths.length;
      if (docIds.length) {
        await sb().from("case_document_versions").delete().in("case_document_id", docIds);
        await sb().from("case_documents").update({ storage_path: null }).eq("case_id", c.id);
      }
      await sb().from("cases").update({ documents_purged_at: at.toISOString() }).eq("id", c.id);
      await log(c.id, null, "case.documents_purged", `${paths.length} files deleted under retention policy`);
      casesPurged++;
    }
    const cutoff = new Date(at.getTime() - 365 * DAY).toISOString();
    const deleted = must(await sb().from("leads").delete().is("profile_id", null).lt("created_at", cutoff).select("id"));
    return { casesPurged, filesDeleted, leadsDeleted: deleted.length };
  },
};
