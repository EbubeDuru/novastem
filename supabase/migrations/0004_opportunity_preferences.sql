-- ============================================================================
-- Opportunity Preferences — v1 (Onboarding Enhancement)
-- ============================================================================
-- Deliberately a SEPARATE table from student_profiles. This is not eligibility
-- data (citizenship, residency, education level, age) — it's a search
-- preference ("where do you want us to look"), and the two must never be
-- conflated:
--   - student_profiles.country_id / residency_country_id / citizenship_status
--     answer "where does this student legally reside, and what does that make
--     them eligible for."
--   - opportunity_preferences answers "where do they want recommendations
--     drawn from, among opportunities they're already eligible for."
-- A Canadian citizen living in Canada can still prefer to see opportunities
-- in the UK and Australia — that's this table, not a change to their
-- residency or citizenship.
-- ============================================================================

create type opportunity_region_mode as enum ('anywhere', 'single', 'multiple');

create table opportunity_preferences (
  user_id uuid primary key references users(id) on delete cascade,
  mode opportunity_region_mode not null default 'anywhere',
  updated_at timestamptz not null default now()
);

-- One row per (user, country) when mode = 'single' (one row) or 'multiple'
-- (many rows). Kept as its own join table rather than an array column so it
-- can be indexed and joined efficiently by the recommendation engine.
create table opportunity_preference_countries (
  user_id uuid not null references users(id) on delete cascade,
  country_id smallint not null references countries(id),
  primary key (user_id, country_id)
);
create index opportunity_preference_countries_country_idx
  on opportunity_preference_countries (country_id);

create trigger trg_opportunity_preferences_updated
  before update on opportunity_preferences
  for each row execute function set_updated_at();

alter table opportunity_preferences enable row level security;
alter table opportunity_preference_countries enable row level security;

create policy opportunity_preferences_owner on opportunity_preferences for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy opportunity_preference_countries_owner on opportunity_preference_countries for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
