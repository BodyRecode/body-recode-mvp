-- ============================================================
-- Migration: Training Plan (Macro Arc) tables
-- Run in Supabase SQL Editor
-- ============================================================

-- Macro plan — one active plan per client
CREATE TABLE training_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  plan_name text NOT NULL,
  macro_objective text,           -- e.g. "12-week strength foundation into performance expression"
  notes text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX training_plans_client_idx ON training_plans(client_id);

-- Planned meso blocks within a macro plan
CREATE TABLE plan_blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id uuid NOT NULL REFERENCES training_plans(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  position integer NOT NULL,                -- order in sequence (1-based)
  block_name text NOT NULL,
  progression_phase text NOT NULL CHECK (progression_phase IN ('accumulation', 'intensification', 'realization', 'restoration')),
  phase_category text,                      -- Layer A: Accumulation-Oriented, Intensification-Oriented, etc.
  execution_arc text CHECK (execution_arc IN ('short', 'mid', 'long')),  -- Layer C
  phase_objective text,                     -- Layer D: Capacity Building, Performance Expression, etc.
  training_goal text NOT NULL CHECK (training_goal IN ('strength', 'hypertrophy', 'capacity')),
  week_duration integer NOT NULL CHECK (week_duration IN (4, 6, 8)),
  status text NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'in_progress', 'complete', 'skipped')),
  program_id uuid REFERENCES programs(id) ON DELETE SET NULL,  -- linked when program is generated
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (plan_id, position)
);

CREATE INDEX plan_blocks_plan_idx ON plan_blocks(plan_id);
CREATE INDEX plan_blocks_client_idx ON plan_blocks(client_id);
CREATE INDEX plan_blocks_program_idx ON plan_blocks(program_id);
