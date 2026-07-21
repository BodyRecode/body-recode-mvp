-- 2026-07-21: Supplement library assignments (Layer 3 coach prescription).
--
-- The substance library itself lives in code as the source of truth
-- (see src/lib/supplement-substances-seed.ts). Each substance carries
-- three tiers (Essential / Enhanced / Elite) that the client picks
-- between. The coach assigns the SUBSTANCE - the client sees all three
-- tiers and picks what fits their budget / commitment level.
--
-- Table stores per-client coach-assigned substances with optional
-- coach note.

CREATE TABLE IF NOT EXISTS public.supplement_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  substance_slug TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed')),
  coach_note TEXT NULL,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  paused_at TIMESTAMPTZ NULL,
  completed_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_supplement_assignments_client_status
  ON public.supplement_assignments (client_id, status);

CREATE INDEX IF NOT EXISTS idx_supplement_assignments_client_slug
  ON public.supplement_assignments (client_id, substance_slug);

COMMENT ON TABLE public.supplement_assignments IS
  'Coach-assigned supplement substances per client. Layer 3 prescription tool. Substance content and tier definitions live in code at src/lib/supplement-substances-seed.ts (slug FK).';

COMMENT ON COLUMN public.supplement_assignments.coach_note IS
  'Optional per-assignment personal note the client sees under the substance on their portal.';
