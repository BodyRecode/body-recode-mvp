-- ============================================================
-- Body Recode™ Programs Table
-- Run in Supabase SQL Editor after exercises_table.sql
-- ============================================================

CREATE TYPE progression_phase AS ENUM (
  'accumulation', 'intensification', 'realization', 'restoration'
);

CREATE TYPE training_goal AS ENUM (
  'strength', 'hypertrophy', 'capacity'
);

CREATE TYPE training_age_level AS ENUM (
  'beginner', 'intermediate', 'advanced'
);

CREATE TABLE programs (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id             uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  intake_id             uuid REFERENCES intakes(id),
  cffs_id               uuid REFERENCES cffs(id),
  block_name            text NOT NULL,
  progression_phase     progression_phase NOT NULL,
  training_goal         training_goal NOT NULL,
  training_frequency    integer NOT NULL CHECK (training_frequency BETWEEN 2 AND 6),
  training_age          training_age_level NOT NULL,
  week_duration         integer NOT NULL CHECK (week_duration IN (4, 6, 8)),
  equipment_access      text[] NOT NULL DEFAULT '{}',
  sessions              jsonb NOT NULL DEFAULT '[]',
  weekly_pattern_summary text,
  progression_notes     text,
  generated_at          timestamptz NOT NULL DEFAULT now(),
  is_active             boolean NOT NULL DEFAULT true
);

-- Indexes
CREATE INDEX programs_client_id_idx ON programs(client_id);
CREATE INDEX programs_client_active_idx ON programs(client_id, is_active);

-- ============================================================
-- NOTE: The sessions JSONB column stores the full program structure:
-- [
--   {
--     "day_label": "Day 1 — Lower Body",
--     "skeleton": "Multi Block",
--     "blocks": [
--       {
--         "block_label": "Block A — Primary",
--         "exercises": [
--           {
--             "exercise_name": "Barbell Back Squat",
--             "sets": 4,
--             "reps": "5",
--             "rpe": 7,
--             "rest": "2-3 min",
--             "notes": ""
--           }
--         ]
--       }
--     ]
--   }
-- ]
-- ============================================================
