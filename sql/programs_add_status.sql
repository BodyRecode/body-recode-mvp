-- ============================================================
-- Migration: Add status column to programs table
-- Run in Supabase SQL Editor
-- ============================================================

ALTER TABLE programs
ADD COLUMN status text NOT NULL DEFAULT 'active'
CHECK (status IN ('draft', 'active'));

-- Backfill existing rows: active programs stay active
UPDATE programs SET status = 'active' WHERE is_active = true;
UPDATE programs SET status = 'draft' WHERE is_active = false;

CREATE INDEX programs_status_idx ON programs(client_id, status);
