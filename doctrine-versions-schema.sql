-- Doctrine version stamps across every AI-generated artefact (2026-06-09).
-- nutrition_plans.doctrine_version already exists (2026-05-26.4 series).
-- This migration adds the same pattern to all other generated artefacts so
-- stale-doctrine pills can be surfaced on the dashboard.
-- Run in Supabase SQL editor.

-- ── Foundational Reading (lives on cffs row) ───────────────────────────
alter table cffs
  add column if not exists fr_doctrine_version text,
  add column if not exists cffs_doctrine_version text;

-- ── Program Reading + Trajectory Reading (both on programs) ─────────────
alter table programs
  add column if not exists pr_doctrine_version text,
  add column if not exists tr_doctrine_version text,
  add column if not exists program_doctrine_version text;

-- ── Weekly Check-In Coach Feedback ─────────────────────────────────────
alter table weekly_checkin_feedback
  add column if not exists doctrine_version text;

-- ── Medications Analysis + Reading (on clients) ────────────────────────
alter table clients
  add column if not exists medications_analysis_doctrine_version text,
  add column if not exists medications_reading_doctrine_version text;

-- ── Blood Panel reading + analysis ─────────────────────────────────────
alter table blood_panels
  add column if not exists reading_doctrine_version text,
  add column if not exists analysis_doctrine_version text;

-- ── Indexes for "stale doctrine" dashboard queries ─────────────────────
create index if not exists cffs_doctrine_idx on cffs (cffs_doctrine_version) where is_archived = false;
create index if not exists nutrition_plans_doctrine_idx on nutrition_plans (doctrine_version) where is_active = true;
