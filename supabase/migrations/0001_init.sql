-- ============================================================================
-- NovaSTEM Core Schema — v1 (MVP scope)
-- ============================================================================
-- Design principles:
-- 1. Eligibility rules live in structured JSONB, not application code, so a
--    future AI eligibility agent can read/write the same column the v1
--    rule-based evaluator uses — no migration needed to upgrade the logic.
-- 2. Every AI-touched table has a `source` + `review_status` pair so nothing
--    written by an agent goes live without passing through admin review.
-- 3. Lookup tables (countries, provinces, categories, skills) are seeded data,
--    not free text — this is what makes filtering/matching actually work.
-- ============================================================================

create extension if not exists "uuid-ossp";
create extension if not exists "pg_trgm"; -- fuzzy search on titles/orgs

-- ----------------------------------------------------------------------------
-- Enums
-- ----------------------------------------------------------------------------
create type user_role as enum ('student', 'organization', 'admin');
create type opportunity_type as enum (
  'scholarship', 'internship', 'research', 'competition',
  'fellowship', 'event', 'volunteer', 'certification', 'mentorship'
);
create type opportunity_status as enum ('draft', 'pending_review', 'published', 'expired', 'rejected');
create type review_status as enum ('pending', 'approved', 'rejected', 'needs_changes');
create type funding_type as enum ('paid', 'unpaid', 'stipend', 'scholarship_award', 'reimbursed');
create type difficulty as enum ('beginner', 'intermediate', 'advanced', 'competitive');
create type source_type as enum ('manual', 'ai_discovery', 'organization_submitted', 'import');
create type application_status as enum ('interested', 'in_progress', 'submitted', 'accepted', 'rejected', 'withdrawn');

-- ----------------------------------------------------------------------------
-- Geography (lookup tables — filtering depends on these being structured)
-- ----------------------------------------------------------------------------
create table countries (
  id smallint primary key generated always as identity,
  iso_code char(2) not null unique,
  name text not null
);

create table provinces (
  id serial primary key,
  country_id smallint not null references countries(id),
  name text not null,
  code text,
  unique (country_id, name)
);

create table schools (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  country_id smallint references countries(id),
  province_id integer references provinces(id),
  school_type text, -- 'high_school' | 'university' | 'college'
  created_at timestamptz not null default now()
);
create index schools_name_trgm on schools using gin (name gin_trgm_ops);

-- ----------------------------------------------------------------------------
-- Users & Profiles
-- ----------------------------------------------------------------------------
-- auth.users is managed by Supabase Auth; this extends it 1:1.
create table users (
  id uuid primary key references auth.users(id) on delete cascade,
  role user_role not null default 'student',
  email text not null unique,
  full_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table student_profiles (
  user_id uuid primary key references users(id) on delete cascade,
  school_id uuid references schools(id),
  country_id smallint references countries(id),
  province_id integer references provinces(id),
  grade text, -- '9','10','11','12','freshman'... kept as text: intl grade systems vary
  date_of_birth date,
  citizenship_status text, -- 'citizen' | 'permanent_resident' | 'visa_holder' | 'international'
  residency_country_id smallint references countries(id),
  career_goals text[],
  interests text[],
  languages text[],
  bio text,
  updated_at timestamptz not null default now()
);

create table organization_profiles (
  user_id uuid primary key references users(id) on delete cascade,
  org_name text not null,
  website text,
  logo_url text,
  description text,
  verified boolean not null default false,
  verified_at timestamptz,
  updated_at timestamptz not null default now()
);

create table skills (
  id serial primary key,
  name text not null unique,
  category text
);

create table student_skills (
  user_id uuid not null references users(id) on delete cascade,
  skill_id integer not null references skills(id),
  proficiency smallint check (proficiency between 1 and 5),
  primary key (user_id, skill_id)
);

-- ----------------------------------------------------------------------------
-- Categories, Tags, Career Pathways
-- ----------------------------------------------------------------------------
create table categories (
  id serial primary key,
  name text not null unique,
  slug text not null unique
);

create table tags (
  id serial primary key,
  name text not null unique,
  slug text not null unique
);

create table career_pathways (
  id serial primary key,
  name text not null unique,
  slug text not null unique,
  description text,
  icon text
);

create table pathway_stages (
  id serial primary key,
  pathway_id integer not null references career_pathways(id) on delete cascade,
  "order" smallint not null,
  title text not null,
  description text,
  unique (pathway_id, "order")
);

-- ----------------------------------------------------------------------------
-- Opportunities — the core entity
-- ----------------------------------------------------------------------------
create table opportunities (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid references users(id), -- null if AI-discovered, unclaimed
  title text not null,
  description text not null,
  type opportunity_type not null,
  category_id integer references categories(id),
  pathway_id integer references career_pathways(id),

  -- logistics
  is_remote boolean not null default false,
  country_id smallint references countries(id),
  province_id integer references provinces(id),
  application_url text not null,
  official_website text,

  -- funding & difficulty
  funding_type funding_type,
  funding_amount_cents integer,
  funding_currency char(3) default 'USD',
  difficulty difficulty,

  -- dates
  application_opens_at date,
  application_deadline date,
  starts_at date,
  ends_at date,

  -- eligibility rules as structured data — evaluated by lib/eligibility.ts
  -- shape: { min_grade, max_grade, min_age, max_age, citizenship: [...],
  --          countries: [...], requires_financial_need, gpa_min, other: [...] }
  eligibility_rules jsonb not null default '{}'::jsonb,

  -- AI pipeline metadata
  source source_type not null default 'manual',
  source_url text, -- where the discovery agent found it
  review_status review_status not null default 'pending',
  reviewed_by uuid references users(id),
  reviewed_at timestamptz,
  extraction_confidence numeric(3,2), -- 0.00–1.00, set by discovery agent
  last_verified_at timestamptz, -- last time verification agent confirmed link/deadline validity

  status opportunity_status not null default 'draft',
  view_count integer not null default 0,
  save_count integer not null default 0,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index opportunities_status_idx on opportunities (status) where status = 'published';
create index opportunities_deadline_idx on opportunities (application_deadline);
create index opportunities_type_idx on opportunities (type);
create index opportunities_country_idx on opportunities (country_id);
create index opportunities_title_trgm on opportunities using gin (title gin_trgm_ops);
create index opportunities_eligibility_gin on opportunities using gin (eligibility_rules);

create table opportunity_tags (
  opportunity_id uuid not null references opportunities(id) on delete cascade,
  tag_id integer not null references tags(id),
  primary key (opportunity_id, tag_id)
);

-- ----------------------------------------------------------------------------
-- Saved / Applications / Recommendations
-- ----------------------------------------------------------------------------
create table saved_opportunities (
  user_id uuid not null references users(id) on delete cascade,
  opportunity_id uuid not null references opportunities(id) on delete cascade,
  saved_at timestamptz not null default now(),
  primary key (user_id, opportunity_id)
);

create table applications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references users(id) on delete cascade,
  opportunity_id uuid not null references opportunities(id) on delete cascade,
  status application_status not null default 'interested',
  notes text,
  applied_at timestamptz,
  updated_at timestamptz not null default now(),
  unique (user_id, opportunity_id)
);

create table recommendations (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references users(id) on delete cascade,
  opportunity_id uuid not null references opportunities(id) on delete cascade,
  match_score numeric(5,2) not null, -- 0–100
  reasons jsonb not null default '[]'::jsonb, -- explainability: [{factor, weight, detail}]
  generated_at timestamptz not null default now(),
  unique (user_id, opportunity_id)
);
create index recommendations_user_score_idx on recommendations (user_id, match_score desc);

-- ----------------------------------------------------------------------------
-- Reviews, Verification, Notifications, Analytics
-- ----------------------------------------------------------------------------
create table reviews (
  id uuid primary key default uuid_generate_v4(),
  opportunity_id uuid not null references opportunities(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  rating smallint check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now(),
  unique (opportunity_id, user_id)
);

create table verification_log (
  id uuid primary key default uuid_generate_v4(),
  opportunity_id uuid not null references opportunities(id) on delete cascade,
  checked_at timestamptz not null default now(),
  link_status smallint, -- HTTP status of application_url
  deadline_still_valid boolean,
  notes text
);

create table notifications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references users(id) on delete cascade,
  type text not null, -- 'deadline_reminder' | 'new_match' | 'application_update' ...
  title text not null,
  body text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index notifications_user_unread_idx on notifications (user_id) where read_at is null;

create table analytics_events (
  id bigint primary key generated always as identity,
  user_id uuid references users(id),
  opportunity_id uuid references opportunities(id),
  event_type text not null, -- 'view' | 'save' | 'apply_click' | 'signup' ...
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index analytics_events_type_time_idx on analytics_events (event_type, created_at);

-- ----------------------------------------------------------------------------
-- updated_at trigger (applied to mutable tables)
-- ----------------------------------------------------------------------------
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_users_updated before update on users
  for each row execute function set_updated_at();
create trigger trg_opportunities_updated before update on opportunities
  for each row execute function set_updated_at();
create trigger trg_applications_updated before update on applications
  for each row execute function set_updated_at();
create trigger trg_student_profiles_updated before update on student_profiles
  for each row execute function set_updated_at();
create trigger trg_org_profiles_updated before update on organization_profiles
  for each row execute function set_updated_at();

-- ----------------------------------------------------------------------------
-- Row Level Security
-- ----------------------------------------------------------------------------
alter table users enable row level security;
alter table student_profiles enable row level security;
alter table organization_profiles enable row level security;
alter table opportunities enable row level security;
alter table saved_opportunities enable row level security;
alter table applications enable row level security;
alter table recommendations enable row level security;
alter table notifications enable row level security;

-- Users can read/update their own row; admins can read all.
create policy users_self_select on users for select using (auth.uid() = id);
create policy users_self_update on users for update using (auth.uid() = id);

create policy student_profile_owner on student_profiles for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy org_profile_owner on organization_profiles for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Opportunities: published rows are public; orgs manage their own; admins manage all.
create policy opportunities_public_read on opportunities for select
  using (status = 'published' or organization_id = auth.uid());

create policy opportunities_org_write on opportunities for insert
  with check (organization_id = auth.uid());
create policy opportunities_org_update on opportunities for update
  using (organization_id = auth.uid());

create policy saved_owner on saved_opportunities for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy applications_owner on applications for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy recommendations_owner_read on recommendations for select
  using (auth.uid() = user_id);

create policy notifications_owner on notifications for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Note: admin bypass is handled via a `service_role` key on the server
-- (used by the discovery agent, cron jobs, and admin dashboard API routes),
-- not via a client-side RLS policy — never grant broad admin access through RLS.
