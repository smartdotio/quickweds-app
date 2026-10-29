import "server-only";
import { env } from "./env";
import { BAND_LABEL } from "./scoring";
import { formatDateTime, formatNgn } from "./format";
import type { Band, Gap, Order } from "./types";

interface Attachment {
  filename: string;
  content: string; // base64
}

export async function sendEmail(input: { to: string; subject: string; html: string; attachments?: Attachment[] }) {
  if (!env.resendKey) {
    console.info(`[email:dev] to=${input.to} subject="${input.subject}"`);
    return;
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${env.resendKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ ...input, from: env.emailFrom, to: [input.to] }),
  });
  if (!res.ok) console.error(`[email] failed (${res.status}) to=${input.to}: ${await res.text()}`);
}

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

function layout(title: string, body: string, cta?: { href: string; label: string }) {
  return `<!doctype html><html><body style="margin:0;background:#05060b;font-family:Helvetica,Arial,sans-serif;color:#e8ebf2">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#05060b;padding:32px 16px"><tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#0c0f18;border:1px solid #1d2333;border-radius:20px;overflow:hidden">
<tr><td style="padding:28px 32px 8px;font-size:12px;letter-spacing:3px;color:#f2c46d;text-transform:uppercase">Osagie &amp; Co. · Euro-Consulting</td></tr>
<tr><td style="padding:0 32px;font-size:24px;font-weight:600;line-height:1.3;color:#ffffff">${esc(title)}</td></tr>
<tr><td style="padding:16px 32px 8px;font-size:15px;line-height:1.6;color:#b9c0d0">${body}</td></tr>
${cta ? `<tr><td style="padding:16px 32px 28px"><a href="${esc(cta.href)}" style="display:inline-block;background:#f2c46d;color:#0b0b0b;text-decoration:none;font-weight:600;padding:14px 22px;border-radius:999px">${esc(cta.label)}</a></td></tr>` : ""}
<tr><td style="padding:20px 32px;border-top:1px solid #1d2333;font-size:12px;color:#6b7387">Fees cover advice and process support and do not guarantee any visa or permit decision. <a href="${env.siteUrl}/legal/privacy" style="color:#8a93a6">Privacy</a></td></tr>
</table></td></tr></table></body></html>`;
}

export function readinessEmail(name: string, band: Band, gaps: Gap[]) {
  const list = gaps
    .slice(0, 6)
    .map((g) => `<li style="margin-bottom:8px"><strong style="color:#fff">${esc(g.title)}</strong><br>${esc(g.detail)}</li>`)
    .join("");
  return {
    subject: `Your readiness result: ${BAND_LABEL[band]}`,
    html: layout(
      `${esc(name.split(" ")[0])}, you're ${BAND_LABEL[band].toLowerCase()}`,
      `<p>Here's what to work on next:</p><ul style="padding-left:18px">${list || "<li>No gaps found.</li>"}</ul><p>This checks preparation against published requirements. It is not a prediction of a visa decision.</p>`,
      { href: `${env.siteUrl}/check`, label: "Book a strategy session" },
    ),
  };
}

export function receiptEmail(order: Order, link: string) {
  const session = order.kind === "session";
  return {
    subject: `Payment confirmed — ${order.productName}`,
    html: layout(
      "Payment confirmed",
      `<p>Thank you, ${esc(order.fullName.split(" ")[0])}. We've received <strong style="color:#fff">${formatNgn(order.amountKobo)}</strong> for <strong style="color:#fff">${esc(order.productName)}</strong>.</p>
<p style="font-family:monospace;font-size:13px;color:#8a93a6">Ref ${esc(order.reference)} · Agreement v${esc(order.agreementVersion)}</p>
<p>Your signed agreement is attached. ${session ? "Pick a time for your session, then use the same link to open your client portal." : "Your portal has been updated."}</p>`,
      { href: link, label: session ? "Book your session" : "Open your portal" },
    ),
  };
}

export function bookingEmail(name: string, startsAt: string, meetingUrl: string | null, status: "booked" | "cancelled") {
  return {
    subject: status === "booked" ? `Session confirmed — ${formatDateTime(startsAt)}` : "Session cancelled",
    html: layout(
      status === "booked" ? "Your session is booked" : "Your session was cancelled",
      status === "booked"
        ? `<p>${esc(name)}, see you on <strong style="color:#fff">${formatDateTime(startsAt)}</strong>.</p>${meetingUrl ? `<p>Join link: <a style="color:#5be7e0" href="${esc(meetingUrl)}">${esc(meetingUrl)}</a></p>` : ""}`
        : `<p>If this wasn't you, reply to this email.</p>`,
      { href: `${env.siteUrl}/portal`, label: "Open portal" },
    ),
  };
}

export function stageEmail(name: string, stageTitle: string, note: string | null) {
  return {
    subject: `Case update: ${stageTitle}`,
    html: layout(
      stageTitle,
      `<p>${esc(name.split(" ")[0])}, your case has moved to a new stage.</p>${note ? `<p style="border-left:3px solid #f2c46d;padding-left:12px;color:#e8ebf2">${esc(note)}</p>` : ""}`,
      { href: `${env.siteUrl}/portal`, label: "View timeline" },
    ),
  };
}

export function documentEmail(name: string, label: string, status: "verified" | "action_required", reason: string | null) {
  const ok = status === "verified";
  return {
    subject: ok ? `Verified: ${label}` : `Action needed: ${label}`,
    html: layout(
      ok ? `${label} verified` : `Please re-upload ${label}`,
      ok
        ? `<p>${esc(name.split(" ")[0])}, your consultant has verified this document.</p>`
        : `<p>${esc(name.split(" ")[0])}, your consultant needs a new version.</p><p style="border-left:3px solid #fb7185;padding-left:12px;color:#e8ebf2">${esc(reason ?? "")}</p>`,
      { href: `${env.siteUrl}/portal/documents`, label: ok ? "View documents" : "Upload new version" },
    ),
  };
}

export function offerEmail(name: string, title: string, priceKobo: number) {
  return {
    subject: `Your package offer: ${title}`,
    html: layout(
      title,
      `<p>${esc(name.split(" ")[0])}, following your session we've prepared a package for you at <strong style="color:#fff">${formatNgn(priceKobo)}</strong>.</p>`,
      { href: `${env.siteUrl}/portal`, label: "Review offer" },
    ),
  };
}

export function staffUploadEmail(clientName: string, label: string, caseId: string) {
  return {
    subject: `New upload: ${clientName} — ${label}`,
    html: layout("New document to review", `<p>${esc(clientName)} uploaded <strong style="color:#fff">${esc(label)}</strong>.</p>`, {
      href: `${env.siteUrl}/admin/clients/${caseId}`,
      label: "Review",
    }),
  };
}
