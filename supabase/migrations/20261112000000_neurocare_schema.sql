-- ============================================================================
-- NeuroCare Database Schema & Row-Level Security (RLS) Migration
-- Project: erzovljmydcictajfprb
-- Safe, idempotent migration following Supabase & Postgres best practices:
--   * Strict RLS on every public schema table (TO authenticated + auth.uid())
--   * Explicit FK constraints & composite (user_id, date) query indexes
--   * SECURITY INVOKER updated_at trigger with locked search_path
--   * Never uses deprecated auth.role() or mutable user_metadata in RLS
-- ============================================================================

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- 1. User Profiles
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  email text not null,
  phone_number text,
  phone_verified boolean not null default false,
  emergency_contact_name text,
  emergency_contact_phone text,
  age_range text not null default '45-54',
  preferred_language text not null default 'en',
  city text not null default '',
  primary_goals jsonb not null default '[]'::jsonb,
  sleep_habit_target_hours numeric(3,1) not null default 7.5,
  activity_level text not null default 'Moderate',
  mental_wellness_baseline text not null default '',
  medical_conditions jsonb not null default '[]'::jsonb,
  wearable_connected boolean not null default false,
  wearable_provider text not null default 'None',
  onboarding_completed boolean not null default false,
  consents jsonb not null default '{}'::jsonb,
  notification_prefs jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;

drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile"
  on public.profiles for select
  to authenticated
  using ((select auth.uid()) = id);

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile"
  on public.profiles for insert
  to authenticated
  with check ((select auth.uid()) = id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

drop policy if exists "Users can delete own profile" on public.profiles;
create policy "Users can delete own profile"
  on public.profiles for delete
  to authenticated
  using ((select auth.uid()) = id);

-- 2. Full App State Snapshots (atomic client <-> cloud sync + goals/AI chat/ML)
create table if not exists public.neurocare_snapshots (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text,
  state jsonb not null,
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_neurocare_snapshots_updated_at on public.neurocare_snapshots;
create trigger trg_neurocare_snapshots_updated_at
  before update on public.neurocare_snapshots
  for each row execute function public.set_updated_at();

alter table public.neurocare_snapshots enable row level security;

drop policy if exists "Users can read own snapshot" on public.neurocare_snapshots;
create policy "Users can read own snapshot"
  on public.neurocare_snapshots for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can insert own snapshot" on public.neurocare_snapshots;
create policy "Users can insert own snapshot"
  on public.neurocare_snapshots for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update own snapshot" on public.neurocare_snapshots;
create policy "Users can update own snapshot"
  on public.neurocare_snapshots for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete own snapshot" on public.neurocare_snapshots;
create policy "Users can delete own snapshot"
  on public.neurocare_snapshots for delete
  to authenticated
  using ((select auth.uid()) = user_id);

-- 3. Sleep Logs
create table if not exists public.sleep_logs (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  duration_hours numeric(4,2) not null,
  quality_rating smallint not null check (quality_rating between 1 and 5),
  bedtime text not null,
  wake_time text not null,
  awakenings integer not null default 0,
  refreshed_rating text not null,
  screen_before_bed boolean not null default false,
  notes text,
  is_sample boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_sleep_logs_user_date
  on public.sleep_logs (user_id, date desc);

alter table public.sleep_logs enable row level security;

drop policy if exists "Users manage own sleep logs" on public.sleep_logs;
create policy "Users manage own sleep logs"
  on public.sleep_logs for all
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- 4. Lifestyle Logs
create table if not exists public.lifestyle_logs (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  exercise_minutes integer not null default 0,
  walking_steps integer not null default 0,
  hydration_glasses integer not null default 0,
  food_quality_rating smallint not null check (food_quality_rating between 1 and 5),
  food_tags jsonb not null default '[]'::jsonb,
  social_minutes integer not null default 0,
  stress_level smallint not null check (stress_level between 1 and 5),
  mood_level smallint not null check (mood_level between 1 and 5),
  relaxation_minutes integer not null default 0,
  notes text,
  is_sample boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_lifestyle_logs_user_date
  on public.lifestyle_logs (user_id, date desc);

alter table public.lifestyle_logs enable row level security;

drop policy if exists "Users manage own lifestyle logs" on public.lifestyle_logs;
create policy "Users manage own lifestyle logs"
  on public.lifestyle_logs for all
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- 5. Cognitive Assessment Sessions
create table if not exists public.cognitive_assessments (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  completed_at timestamptz not null,
  total_duration_seconds integer not null,
  task_performance_pct numeric(5,2) not null,
  functional_questionnaire_pct numeric(5,2) not null,
  categories jsonb not null default '[]'::jsonb,
  context_note text,
  is_sample boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_cognitive_assessments_user_date
  on public.cognitive_assessments (user_id, date desc);

alter table public.cognitive_assessments enable row level security;

drop policy if exists "Users manage own assessments" on public.cognitive_assessments;
create policy "Users manage own assessments"
  on public.cognitive_assessments for all
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- 6. Memory & Cognitive Game Results
create table if not exists public.game_results (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  game_type text not null,
  game_name text not null,
  date date not null,
  completed_at timestamptz not null,
  score numeric(5,2) not null,
  metric_label text not null,
  metric_value text not null,
  accuracy_pct numeric(5,2) not null,
  duration_seconds integer not null,
  level_reached integer not null default 1,
  is_sample boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_game_results_user_date
  on public.game_results (user_id, date desc);

alter table public.game_results enable row level security;

drop policy if exists "Users manage own game results" on public.game_results;
create policy "Users manage own game results"
  on public.game_results for all
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- 7. Family History Entries
create table if not exists public.family_history_entries (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  condition text not null,
  relative text not null,
  approximate_age_of_onset text,
  notes text,
  added_at date not null,
  is_sample boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_family_history_user_id
  on public.family_history_entries (user_id);

alter table public.family_history_entries enable row level security;

drop policy if exists "Users manage own family history" on public.family_history_entries;
create policy "Users manage own family history"
  on public.family_history_entries for all
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- 8. Doctor Consultations
create table if not exists public.consultations (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  booking_code text,
  doctor_id text not null,
  doctor_name text not null,
  specialty text not null,
  date date not null,
  time_slot text not null,
  mode text not null,
  status text not null,
  shared_assessment_report boolean not null default false,
  reason text,
  patient_name text,
  patient_city text,
  clinic_city text,
  clinic_locality text,
  hospital_or_clinic text,
  is_sample boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_consultations_user_date
  on public.consultations (user_id, date desc);

alter table public.consultations enable row level security;

drop policy if exists "Users manage own consultations" on public.consultations;
create policy "Users manage own consultations"
  on public.consultations for all
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- 9. Specialist Directory (readable across platform, updates scoped to creator)
create table if not exists public.doctors (
  id text primary key,
  name text not null,
  specialty text not null,
  credentials text not null,
  hospital_or_clinic text not null,
  city text not null,
  locality text,
  languages jsonb not null default '[]'::jsonb,
  experience_years integer not null default 0,
  consultation_fee_inr integer not null default 0,
  next_available_slot text,
  bio text,
  consultation_modes jsonb not null default '["online","offline"]'::jsonb,
  available_slots jsonb not null default '[]'::jsonb,
  accepting_bookings boolean not null default true,
  added_by_admin boolean not null default false,
  is_sample_provider boolean not null default true,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.doctors enable row level security;

drop policy if exists "Anyone can view doctors directory" on public.doctors;
create policy "Anyone can view doctors directory"
  on public.doctors for select
  to anon, authenticated
  using (true);

drop policy if exists "Authenticated users can add own doctors" on public.doctors;
create policy "Authenticated users can add own doctors"
  on public.doctors for insert
  to authenticated
  with check ((select auth.uid()) = created_by);

drop policy if exists "Authenticated users can update own doctors" on public.doctors;
create policy "Authenticated users can update own doctors"
  on public.doctors for update
  to authenticated
  using ((select auth.uid()) = created_by)
  with check ((select auth.uid()) = created_by);

-- 10. Explicit Data API Privileges (Supabase Data API exposure)
grant usage on schema public to anon, authenticated;
grant select on public.doctors to anon, authenticated;
grant insert, update on public.doctors to authenticated;
grant select, insert, update, delete on
  public.profiles,
  public.neurocare_snapshots,
  public.sleep_logs,
  public.lifestyle_logs,
  public.cognitive_assessments,
  public.game_results,
  public.family_history_entries,
  public.consultations
to authenticated;

