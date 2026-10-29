-- Osagie & Co. client platform — initial schema
-- Money is stored in kobo (integer). All tables have RLS enabled.
-- The app server uses the service role and authorises in code; RLS is
-- defence in depth for any client-side (anon/authenticated) access.

create extension if not exists pgcrypto;

-- ───────────────────────── Profiles & roles ─────────────────────────
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role text not null default 'client' check (role in ('client', 'consultant', 'admin')),
  full_name text not null default '',
  email text not null unique,
  phone text,
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name, phone)
  values (
    new.id,
    lower(new.email),
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    new.raw_user_meta_data ->> 'phone'
  )
  on conflict (id) do nothing;
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.is_staff() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and role in ('consultant', 'admin'));
$$;

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'admin');
$$;

-- Clients can edit their own name/phone but never their role.
create or replace function public.guard_profile_role() returns trigger
language plpgsql as $$
begin
  if new.role is distinct from old.role and auth.uid() is not null and not public.is_admin() then
    raise exception 'Only admins can change roles';
  end if;
  return new;
end $$;

create trigger profiles_guard_role before update on public.profiles
  for each row execute function public.guard_profile_role();

-- ───────────────────────── Catalogue ─────────────────────────
create table public.routes (
  id text primary key,
  slug text not null unique,
  name text not null,
  country text not null check (country in ('AT', 'DE', 'CH')),
  tagline text not null default '',
  funds jsonb not null,
  funds_note text not null default '',
  weights jsonb not null,
  source_url text not null default '',
  verified_at timestamptz,
  position int not null default 0,
  active boolean not null default true
);

create table public.route_stages (
  id text primary key,
  route_id text not null references public.routes (id) on delete cascade,
  position int not null,
  title text not null,
  description text not null default '',
  unique (route_id, position)
);

create table public.route_documents (
  id text primary key,
  route_id text not null references public.routes (id) on delete cascade,
  key text not null,
  label text not null,
  weight int not null default 1 check (weight between 0 and 10),
  help text not null default '',
  position int not null default 0,
  unique (route_id, key)
);

create table public.settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text not null default '',
  price_kobo int not null check (price_kobo > 0),
  active boolean not null default true
);

-- ───────────────────────── Funnel ─────────────────────────
create table public.leads (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  full_name text not null,
  phone text not null,
  source text,
  consent_at timestamptz not null,
  consent_version text not null,
  marketing_opt_in boolean not null default false,
  profile_id uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.readiness_results (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads (id) on delete cascade,
  route_id text references public.routes (id),
  answers jsonb not null,
  score int not null,
  band text not null check (band in ('ready', 'nearly', 'not_yet', 'unscored')),
  gaps jsonb not null default '[]',
  fx_rate numeric not null,
  created_at timestamptz not null default now()
);
create index readiness_results_lead_idx on public.readiness_results (lead_id, created_at desc);

-- ───────────────────────── Cases ─────────────────────────
create table public.cases (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.profiles (id) on delete cascade,
  route_id text references public.routes (id),
  consultant_id uuid references public.profiles (id) on delete set null,
  current_stage_id text references public.route_stages (id),
  status text not null default 'active' check (status in ('active', 'closed')),
  outcome text,
  closed_at timestamptz,
  retain_until timestamptz,
  retain_reason text,
  documents_purged_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index cases_one_active_per_client on public.cases (client_id) where status = 'active';

create table public.case_stage_events (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases (id) on delete cascade,
  stage_id text not null references public.route_stages (id),
  note text,
  actor_id uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.case_documents (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases (id) on delete cascade,
  route_document_id text references public.route_documents (id),
  label text not null,
  help text not null default '',
  position int not null default 0,
  status text not null default 'missing'
    check (status in ('missing', 'pending', 'verified', 'action_required')),
  reason text,
  storage_path text,
  file_name text,
  version int not null default 0,
  uploaded_at timestamptz,
  reviewed_by uuid references public.profiles (id) on delete set null,
  reviewed_at timestamptz
);
create index case_documents_case_idx on public.case_documents (case_id);

create table public.case_document_versions (
  id uuid primary key default gen_random_uuid(),
  case_document_id uuid not null references public.case_documents (id) on delete cascade,
  version int not null,
  storage_path text not null,
  file_name text not null,
  uploaded_at timestamptz not null default now()
);

create table public.case_notes (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases (id) on delete cascade,
  body text not null,
  actor_id uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.package_offers (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases (id) on delete cascade,
  title text not null,
  scope jsonb not null default '[]',
  price_kobo int not null check (price_kobo > 0),
  instalments int not null default 1 check (instalments between 1 and 2),
  status text not null default 'offered' check (status in ('offered', 'paid', 'withdrawn')),
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

-- ───────────────────────── Payments & bookings ─────────────────────────
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles (id) on delete set null,
  lead_id uuid references public.leads (id) on delete set null,
  case_id uuid references public.cases (id) on delete set null,
  email text not null,
  full_name text not null,
  kind text not null check (kind in ('session', 'package')),
  product_id uuid references public.products (id),
  package_offer_id uuid references public.package_offers (id),
  product_name text not null,
  amount_kobo int not null check (amount_kobo > 0),
  status text not null default 'pending' check (status in ('pending', 'paid', 'refunded', 'failed')),
  reference text not null unique,
  agreement_version text not null,
  accepted_at timestamptz not null,
  accepted_ip text,
  accepted_ua text,
  paid_at timestamptz,
  created_at timestamptz not null default now()
);
create index orders_profile_idx on public.orders (profile_id);

create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.orders (id) on delete set null,
  cal_uid text not null unique,
  email text not null,
  starts_at timestamptz not null,
  status text not null default 'booked' check (status in ('booked', 'cancelled')),
  meeting_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index bookings_order_idx on public.bookings (order_id);

-- ───────────────────────── Consent, privacy, audit ─────────────────────────
create table public.declarations (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  kind text not null check (kind in ('authenticity')),
  accepted_at timestamptz not null default now(),
  unique (profile_id, kind)
);

create table public.deletion_requests (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  requested_at timestamptz not null default now(),
  completed_at timestamptz
);

create table public.activity_log (
  id bigint generated always as identity primary key,
  actor_id uuid references public.profiles (id) on delete set null,
  entity text not null,
  entity_id text not null,
  action text not null,
  data jsonb not null default '{}',
  created_at timestamptz not null default now()
);
create index activity_log_entity_idx on public.activity_log (entity, entity_id, created_at desc);

-- ───────────────────────── Row-level security ─────────────────────────
alter table public.profiles enable row level security;
alter table public.routes enable row level security;
alter table public.route_stages enable row level security;
alter table public.route_documents enable row level security;
alter table public.settings enable row level security;
alter table public.products enable row level security;
alter table public.leads enable row level security;
alter table public.readiness_results enable row level security;
alter table public.cases enable row level security;
alter table public.case_stage_events enable row level security;
alter table public.case_documents enable row level security;
alter table public.case_document_versions enable row level security;
alter table public.case_notes enable row level security;
alter table public.package_offers enable row level security;
alter table public.orders enable row level security;
alter table public.bookings enable row level security;
alter table public.declarations enable row level security;
alter table public.deletion_requests enable row level security;
alter table public.activity_log enable row level security;

create or replace function public.owns_case(cid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from cases where id = cid and client_id = auth.uid());
$$;

-- Public catalogue
create policy "catalogue readable" on public.routes for select using (active or public.is_staff());
create policy "stages readable" on public.route_stages for select using (true);
create policy "route docs readable" on public.route_documents for select using (true);
create policy "products readable" on public.products for select using (active or public.is_staff());
create policy "settings readable" on public.settings for select using (true);
create policy "admin writes routes" on public.routes for all using (public.is_admin()) with check (public.is_admin());
create policy "admin writes stages" on public.route_stages for all using (public.is_admin()) with check (public.is_admin());
create policy "admin writes route docs" on public.route_documents for all using (public.is_admin()) with check (public.is_admin());
create policy "admin writes products" on public.products for all using (public.is_admin()) with check (public.is_admin());
create policy "admin writes settings" on public.settings for all using (public.is_admin()) with check (public.is_admin());

-- Profiles
create policy "own profile or staff" on public.profiles for select using (id = auth.uid() or public.is_staff());
create policy "update own profile" on public.profiles for update using (id = auth.uid() or public.is_admin());

-- Funnel data: staff only (inserted server-side)
create policy "staff read leads" on public.leads for select using (public.is_staff());
create policy "staff read readiness" on public.readiness_results for select using (public.is_staff());

-- Cases & children: owner reads, staff reads/writes
create policy "client or staff read case" on public.cases for select using (client_id = auth.uid() or public.is_staff());
create policy "staff write case" on public.cases for update using (public.is_staff());
create policy "read stage events" on public.case_stage_events for select using (public.owns_case(case_id) or public.is_staff());
create policy "staff write stage events" on public.case_stage_events for insert with check (public.is_staff());
create policy "read case documents" on public.case_documents for select using (public.owns_case(case_id) or public.is_staff());
create policy "staff write case documents" on public.case_documents for update using (public.is_staff());
create policy "read doc versions" on public.case_document_versions for select using (
  public.is_staff() or exists (
    select 1 from case_documents d where d.id = case_document_id and public.owns_case(d.case_id)
  )
);
create policy "staff notes" on public.case_notes for all using (public.is_staff()) with check (public.is_staff());
create policy "read offers" on public.package_offers for select using (public.owns_case(case_id) or public.is_staff());
create policy "staff write offers" on public.package_offers for all using (public.is_staff()) with check (public.is_staff());

-- Orders & bookings
create policy "own orders" on public.orders for select using (profile_id = auth.uid() or public.is_staff());
create policy "own bookings" on public.bookings for select using (
  public.is_staff() or exists (select 1 from orders o where o.id = order_id and o.profile_id = auth.uid())
);

-- Consent & privacy
create policy "own declarations" on public.declarations for select using (profile_id = auth.uid() or public.is_staff());
create policy "own deletion requests" on public.deletion_requests for select using (profile_id = auth.uid() or public.is_staff());
create policy "staff activity" on public.activity_log for select using (public.is_staff());

-- ───────────────────────── Storage ─────────────────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'case-documents', 'case-documents', false, 10485760,
  array['application/pdf', 'image/jpeg', 'image/png', 'image/heic', 'image/heif']
)
on conflict (id) do nothing;

-- Paths are {case_id}/{document_id}/{version}-{filename}
create policy "case files readable by owner or staff" on storage.objects for select using (
  bucket_id = 'case-documents'
  and (public.is_staff() or public.owns_case(((storage.foldername(name))[1])::uuid))
);
