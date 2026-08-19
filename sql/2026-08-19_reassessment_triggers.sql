-- Reassessment triggers: turn a computed drift signal into a record with a lifecycle.
--
-- Before this, evaluateReadiness() computed the Signal Monitoring v1.0 thresholds
-- and rendered them. Nothing persisted and nothing escalated, so acting on a
-- regression depended entirely on a coach happening to look at the dashboard.
--
-- A row here stays `open` until someone resolves it. Dismissing requires a reason.
--
-- trigger_class encodes the deterministic/interpretive split:
--   deterministic  block_end, twelve_week_cap. No judgement involved, safe to automate.
--   interpretive   signal-derived. A human decides whether to act.
--
-- Service-role only (server routes use the admin client, which bypasses RLS).

CREATE TABLE IF NOT EXISTS reassessment_triggers (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id         uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,

  -- ReassessmentReason from src/lib/readiness-monitor.ts. Kept as free text
  -- rather than an enum so a doctrine change does not require a migration.
  reason            text NOT NULL,
  trigger_class     text NOT NULL CHECK (trigger_class IN ('deterministic', 'interpretive')),
  recommended_depth text NOT NULL CHECK (recommended_depth IN ('lightweight', 'delta', 'full')),
  message           text NOT NULL,

  -- Dedupe anchor. evaluateReadiness runs on every dashboard render, so without
  -- this a page view would create rows. Signal-derived reasons anchor to the CFWS
  -- that produced them, block_end to the program block, twelve_week_cap to the CFFS.
  anchor            text NOT NULL,

  status            text NOT NULL DEFAULT 'open'
                      CHECK (status IN ('open', 'actioned', 'dismissed')),
  fired_at          timestamptz NOT NULL DEFAULT now(),

  resolved_at       timestamptz,
  resolved_by       uuid,
  -- Required when status = 'dismissed'. Enforced in the API, not here, so that
  -- a backfill or admin correction is not blocked by the constraint.
  resolution_note   text,
  -- Set when resolved by issuing a Progress Check.
  progress_check_id uuid REFERENCES progress_checks(id) ON DELETE SET NULL,

  -- Set once the coach has been told about it, so the digest does not repeat.
  notified_at       timestamptz,

  CONSTRAINT reassessment_triggers_dedupe UNIQUE (client_id, reason, anchor)
);

ALTER TABLE reassessment_triggers ENABLE ROW LEVEL SECURITY;
GRANT ALL ON reassessment_triggers TO service_role;

CREATE INDEX IF NOT EXISTS reassessment_triggers_client_idx
  ON reassessment_triggers(client_id);

-- The two hot paths: the open queue, and the digest's "open and not yet notified".
CREATE INDEX IF NOT EXISTS reassessment_triggers_open_idx
  ON reassessment_triggers(status, fired_at DESC) WHERE status = 'open';

CREATE INDEX IF NOT EXISTS reassessment_triggers_unnotified_idx
  ON reassessment_triggers(notified_at) WHERE status = 'open' AND notified_at IS NULL;
