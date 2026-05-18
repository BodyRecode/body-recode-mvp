-- Medications Analysis + Client Reading
-- 2026-05-18 — coach-facing structured per-medication analysis + client-facing
-- prose reading, both generated from the free-text `clients.medications` field.
-- Mirrors the CFFS / Foundational Reading pattern.
-- Run in Supabase SQL editor.

alter table clients
  add column if not exists medications_analysis jsonb,
  add column if not exists medications_analyzed_at timestamptz,
  add column if not exists medications_reading jsonb,
  add column if not exists medications_reading_generated_at timestamptz,
  add column if not exists medications_reading_published_at timestamptz;

-- Audit trail / cache invalidation. When `medications` text changes, the
-- existing `medications_updated_at` already bumps via the API; the analysis
-- and reading columns above are stale until the coach clicks Regenerate.
-- The UI compares medications_updated_at > medications_analyzed_at to show
-- a "rebuild recommended" pill.

-- No new RLS policy needed — these columns live on `clients`, which already
-- has the right RLS shape (coach reads via admin client, portal reads gated
-- by onboarding_token).
