import "server-only";

export const env = {
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
  supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
  paystackSecret: process.env.PAYSTACK_SECRET_KEY ?? "",
  calLink: process.env.NEXT_PUBLIC_CAL_LINK ?? "", // e.g. "osagieco/strategy-session-private"
  calWebhookSecret: process.env.CAL_WEBHOOK_SECRET ?? "",
  resendKey: process.env.RESEND_API_KEY ?? "",
  emailFrom: process.env.EMAIL_FROM ?? "Osagie & Co. <hello@example.com>",
  staffNotifyEmail: process.env.STAFF_NOTIFY_EMAIL ?? "",
  cronSecret: process.env.CRON_SECRET ?? "",
};

/** Demo mode: no Supabase configured. Data lives in memory and resets on restart. */
export const isDemo = !env.supabaseUrl || !env.supabaseServiceKey;
export const paystackEnabled = !!env.paystackSecret;
export const calEnabled = !!env.calLink;

export const AGREEMENT_VERSION = "2026-10-29";
export const PRIVACY_VERSION = "2026-10-29";
export const DOCUMENT_BUCKET = "case-documents";
