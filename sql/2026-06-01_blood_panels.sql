-- Blood Panels (client-uploaded blood test results).
--
-- A client can upload a copy of their blood test results (PDF or photo) into
-- their portal at any time. The system reads the file multimodally, transcribes
-- each marker against the LAB'S OWN printed reference range, and flags anything
-- the lab marked out of range as "worth raising with your GP" (never a
-- diagnosis). The coach then reviews, generates a coach analysis + client
-- reading, and explicitly Approves the panel for plan influence. Only an
-- APPROVED panel's markers inject into CFFS regeneration.
--
-- This is the third file-upload + interpretation feature, after baseline photos
-- (CFFS Visual Signal Integration) and medical clearance docs. It mirrors the
-- Medications Analysis -> Medications Reading coach/client split.
--
-- Longitudinal by design: one row per uploaded panel. A client may upload
-- several over the course of coaching; the latest APPROVED panel is the one
-- that feeds the plan.
--
-- ───────────────────────────────────────────────────────────────────────────
-- STORAGE BUCKET (manual, one-time — do this before the feature goes live):
--   Supabase Dashboard -> Storage -> New bucket
--     Name:   blood-test-docs
--     Public: OFF (private — coach views via short-lived signed URL only)
--   Health data must never sit in a public bucket. Mirrors clearance-docs.
-- ───────────────────────────────────────────────────────────────────────────

-- ============================================================================
-- 1. TABLE
-- ============================================================================

create table if not exists blood_panels (
  id uuid primary key default uuid_generate_v4(),
  client_id uuid not null references clients(id) on delete cascade,

  -- Upload
  file_path text not null,             -- storage path in blood-test-docs (NOT a URL; signed on demand)
  file_type text,                      -- mime type as uploaded
  original_filename text,
  lab_name text,                       -- optional, client-entered
  collected_on date,                   -- optional, client-entered date of draw
  client_note text,                    -- optional, client-entered context

  -- Lifecycle
  status text not null default 'uploaded'
    check (status in ('uploaded', 'extracted', 'analyzed', 'approved', 'failed')),
  approved_for_plan boolean not null default false,

  -- Extraction (multimodal read of the file)
  panel_summary text,                  -- 1-2 sentence plain description of what the panel covers
  markers jsonb,                       -- [{ name, value, unit, reference_range, flag }]
  gp_flags jsonb,                      -- ["plain-language note about a markedly out-of-range value"]
  extraction_meta jsonb,               -- { model, unreadable, notes }
  extracted_at timestamptz,

  -- Coach-facing structured analysis
  analysis jsonb,                      -- { groups: [...], combined_picture }
  analyzed_at timestamptz,

  -- Client-facing reading (4 sections, gated behind Publish)
  reading jsonb,                       -- { bp_what_we_saw, bp_why_it_matters, bp_how_we_account_for_it, bp_what_to_watch }
  reading_generated_at timestamptz,
  reading_published_at timestamptz,

  approved_at timestamptz,
  submitted_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================================
-- 2. GRANTS  (REQUIRED — without these the admin client returns 42501)
-- ============================================================================
-- All reads/writes go through the admin client (service_role) in both the
-- coach dashboard and the client portal, matching every other generate-* and
-- portal page in this codebase. No authenticated/anon access needed.

grant select, insert, update, delete on public.blood_panels to service_role;

-- ============================================================================
-- 3. RLS + POLICIES
-- ============================================================================

alter table blood_panels enable row level security;

drop policy if exists "service role manages blood_panels" on blood_panels;
create policy "service role manages blood_panels"
  on blood_panels
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

-- ============================================================================
-- 4. INDEXES + TRIGGERS
-- ============================================================================

create index if not exists blood_panels_client_idx
  on blood_panels (client_id, submitted_at desc);

-- Partial index for the CFFS injection lookup: latest approved panel per client.
create index if not exists blood_panels_approved_idx
  on blood_panels (client_id, approved_at desc)
  where approved_for_plan = true;

create or replace function bump_blood_panels_updated_at()
returns trigger as $$
begin
  new.updated_at := now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_blood_panels_updated_at on blood_panels;
create trigger trg_blood_panels_updated_at
  before update on blood_panels
  for each row
  execute function bump_blood_panels_updated_at();
