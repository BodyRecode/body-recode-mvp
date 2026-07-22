-- 2026-07-22: RRS -> Recovery suggestion log.
--
-- Records every suggestion surfaced to the coach + what action they took.
-- Used to measure coach acceptance rate over time so we can refine the
-- state -> protocol mapping.
--
-- shown_at:            when the suggestion banner was rendered (server render)
-- action_taken:        'assigned' | 'dismissed' | null (no action yet)
-- assigned_protocol_slug: populated if the coach clicked assign on one
-- dismissed_reason:    optional coach note when dismissing

CREATE TABLE IF NOT EXISTS public.recovery_protocol_suggestions_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  rrs_playbook_id TEXT NOT NULL,
  suggested_protocol_slugs JSONB NOT NULL,
  sbst_action TEXT NULL,
  coach_email TEXT NULL,
  shown_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  action_taken TEXT NULL CHECK (action_taken IN ('assigned', 'dismissed', 'sbst_removed')),
  assigned_protocol_slug TEXT NULL,
  dismissed_reason TEXT NULL,
  actioned_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_recovery_suggestions_log_client
  ON public.recovery_protocol_suggestions_log (client_id, shown_at DESC);

CREATE INDEX IF NOT EXISTS idx_recovery_suggestions_log_state
  ON public.recovery_protocol_suggestions_log (rrs_playbook_id, action_taken);

COMMENT ON TABLE public.recovery_protocol_suggestions_log IS
  'Every RRS-driven Recovery Protocol suggestion surfaced to the coach + what action they took. Used to measure coach acceptance rate and refine SUGGESTED_PROTOCOLS_BY_RRS_STATE mapping in src/lib/rrs-protocol-suggestions.ts.';
