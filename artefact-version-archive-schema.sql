-- Artefact Version Archive (2026-06-09)
-- Item (I) in the licensee-readiness sweep. Every regenerate of a client-
-- facing artefact (FR, PR, NR, MR, Trajectory, WCCF) writes the OLD version
-- to this archive table before the new version overwrites the live row.
-- The dashboard shows a "change log" per client + per artefact with the
-- ability to diff one version against another.
--
-- The live row stays the single source of truth (no model change to cffs,
-- programs, nutrition_plans, etc.). This table is read-only history.
--
-- Run in Supabase SQL editor.

create table if not exists artefact_version_archive (
  id uuid primary key default uuid_generate_v4(),
  client_id uuid not null references clients(id) on delete cascade,
  artefact_type text not null check (artefact_type in ('fr', 'pr', 'nr', 'tr', 'mr', 'wccf')),
  -- The source row id (cffs.id for FR, programs.id for PR/Trajectory,
  -- nutrition_plans.id for NR, etc.) so we can link back from the archive
  -- to the artefact's current row.
  source_row_id uuid not null,
  -- The doctrine version this archived snapshot was generated under.
  -- Null only for pre-2026-06-09 backfill rows where the version wasn't
  -- stamped at generation time.
  doctrine_version text,
  -- The full content of the artefact at the moment it was archived. JSON
  -- because each artefact has different field names; the dashboard renders
  -- per-type. Schema for each:
  --   fr  : { cr_where_you_are, cr_what_your_body_is_telling_us, cr_what_were_focusing_on_first, cr_what_were_not_doing_yet, cr_coach_note }
  --   pr  : { pr_why_this_block, pr_what_this_program_is_doing, pr_how_well_know_its_working, pr_what_were_not_doing_yet, pr_coach_note }
  --   nr  : { nr_why_this_plan, nr_what_this_nutrition_is_doing, nr_how_well_know_its_working, nr_what_were_not_doing_yet, nr_coach_note }
  --   tr  : { tr_where_this_block_started, tr_how_your_signal_moved, tr_what_held_steady, tr_what_this_sets_up_next, tr_coach_note }
  --   mr  : { mr_why_this_protocol, mr_what_this_is_doing, mr_how_well_know_its_working, mr_what_were_not_doing_yet, mr_coach_note }
  --   wccf: { interpretation, reframe, next_focus }
  content jsonb not null,
  -- When the previous version was originally generated.
  generated_at timestamptz,
  -- When the previous version was archived (i.e. when the new regenerate
  -- ran). This is what the dashboard sorts by.
  archived_at timestamptz not null default now(),
  -- Who triggered the regenerate that archived this row. Null for system-
  -- driven regenerates (none today, but reserved for future auto-bumps).
  archived_by uuid,
  -- Optional coach note explaining WHY this regenerate happened. Filled by
  -- the regenerate UI when the coach types a reason (e.g. "doctrine bump
  -- 2026-06-09" or "client medications changed"). Null when no reason given.
  archive_reason text
);

create index if not exists artefact_version_archive_client_idx
  on artefact_version_archive (client_id, artefact_type, archived_at desc);

create index if not exists artefact_version_archive_source_row_idx
  on artefact_version_archive (source_row_id, archived_at desc);

alter table artefact_version_archive enable row level security;

-- Service-role-only writes; coach reads via admin client in server routes.
drop policy if exists "service role manages artefact_version_archive" on artefact_version_archive;
create policy "service role manages artefact_version_archive"
  on artefact_version_archive
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');
