# Osagie & Co. — Client Platform

Readiness check → paid strategy session → live client portal → consultant console, for Nigeria → Austria/Germany study and work routes. Built from PRD v2.

**Stack:** Next.js 16 (App Router) · Tailwind CSS v4 · Supabase (Postgres, Auth, Storage, RLS) · Paystack · Cal.com · Resend · Vercel.

## Run it

```bash
npm install
npm run dev
```

With no environment variables the app runs in **demo mode**: in-memory sample clients, a simulated payment sheet, an in-app slot picker, and open access to `/portal` and `/admin`. Data resets when the server restarts.

```bash
npm test          # scoring engine + webhook signature tests
npm run lint
npx tsc --noEmit
```

## What's where

| Path | What it does |
|---|---|
| `/` | Landing page |
| `/check` | 4-step readiness check, live scoring, lead capture |
| `/checkout` | Agreement consent + Paystack (or demo payment sheet) |
| `/checkout/callback`, `/api/paystack/webhook` | Server-side verification → `fulfilPayment()` (idempotent) |
| `/book/[orderId]` | Cal.com embed (or demo slot picker), paid orders only |
| `/portal` | Client dashboard, stage timeline, document vault, profile, data export/deletion |
| `/admin` | Clients table, case detail (stage, document review, offers, notes, activity), settings |
| `/admin/mfa` | TOTP enrolment/verification — staff need `aal2` |
| `/api/cron/retention` | Daily: deletes documents 90 days after case closure, unconverted leads after 12 months |
| `src/lib/scoring.ts` | Deterministic readiness scoring (tested) |
| `src/lib/routes-seed.ts` | Route templates — source of `supabase/seed.sql` (`node scripts/gen-seed.ts`) |
| `src/lib/repo/` | Data layer: `supabase.ts` (live) and `demo.ts` (in-memory), same interface |
| `src/lib/legal.ts` | **Draft** agreement, refund, privacy and terms copy — needs a lawyer's review |

## Go live

1. **Supabase** — create a project (EU/Frankfurt). Run `supabase/migrations/*.sql`, then `supabase/seed.sql`.
   - Auth → Providers: email only; disable sign-ups (accounts are created on payment).
   - Auth → MFA: enable TOTP. Auth → Sessions: inactivity timeout 7 days.
   - Auth → Email templates → Magic link: link to `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email&next=/portal`.
   - Auth → URL configuration: set Site URL and add `{SITE}/auth/confirm` to redirect URLs.
   - Sign in once, then promote yourself: `update profiles set role = 'admin' where email = '…';`
2. **Paystack** — add the secret key and set the webhook URL to `{SITE}/api/paystack/webhook`.
3. **Cal.com** — create a *hidden* 45-minute event with Google Meet/Zoom, add a webhook (`BOOKING_CREATED`, `RESCHEDULED`, `CANCELLED`) to `{SITE}/api/cal/webhook` with a secret. Turn on Cal.com's reminder workflow for the 24-hour reminder.
4. **Resend** — verify the sending domain (SPF/DKIM/DMARC).
5. **Vercel** — add env vars from `.env.example`; `vercel.json` schedules the retention cron.
6. **Before launch** — in Admin → Settings, check each route's thresholds against the official source and set the *verified* date; confirm the ₦/€ rate and session price; have a lawyer review `src/lib/legal.ts`.

## Known gaps vs PRD v2

- Route stages and document checklists are edited through `routes-seed.ts` + seed SQL, not yet in the admin UI (thresholds, weights, prices, FX and quick tags are editable).
- Document-status emails are sent per action, not batched every 15 min; the consultant "new upload" email is per upload, not a daily digest.
- Package instalments (2-part payments) aren't implemented; packages are paid in full.
- Deletion requests are listed for admins but completed manually.
