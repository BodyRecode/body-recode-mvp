-- 2026-07-21: Recovery Protocol assignments (Layer 3 coach-side tooling).
--
-- The 20-protocol library itself lives in code as the source of truth
-- (see src/lib/recovery-protocols-seed.ts). The DB only stores:
--   1. What equipment each client has access to (home + gym)
--   2. Which protocols each client currently has assigned
--
-- This is Layer 3 per the RRS anti-pattern guardrail: RRS (Layer 2)
-- emits constraint envelopes only. Protocol prescription lives here,
-- coach-assigned, per client.

ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS recovery_equipment_access JSONB NULL;

COMMENT ON COLUMN public.clients.recovery_equipment_access IS
  'Equipment tags this client has access to (home + gym). Shape: string[] matching EquipmentTag in src/lib/recovery-protocols-seed.ts. NULL means not yet tagged by coach.';

CREATE TABLE IF NOT EXISTS public.recovery_protocol_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  protocol_slug TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed')),
  coach_note TEXT NULL,
  custom_dosing JSONB NULL,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  paused_at TIMESTAMPTZ NULL,
  completed_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_recovery_protocol_assignments_client_status
  ON public.recovery_protocol_assignments (client_id, status);

CREATE INDEX IF NOT EXISTS idx_recovery_protocol_assignments_client_slug
  ON public.recovery_protocol_assignments (client_id, protocol_slug);

COMMENT ON TABLE public.recovery_protocol_assignments IS
  'Coach-assigned recovery protocols per client. Layer 3 prescription tool. Protocol content lives in code at src/lib/recovery-protocols-seed.ts (slug FK).';

COMMENT ON COLUMN public.recovery_protocol_assignments.custom_dosing IS
  'Optional per-assignment override of the protocol default dosing. Shape: { frequency, duration, intensity_notes, timing } matching ProtocolDosing in the seed lib.';

COMMENT ON COLUMN public.recovery_protocol_assignments.coach_note IS
  'Per-assignment personal note the client sees on their portal under this protocol.';
