-- Booking Agent — outreach approval queue.
--
-- Every touch the agent writes lands here as a DRAFT (Option A: a human
-- approves each one before it sends). One row = one email (or IG DM) to one
-- lead at one step of the sequence. Additive + idempotent — safe to re-run.

create table if not exists outreach_touches (
  id            uuid primary key default gen_random_uuid(),
  lead_id       uuid not null references leads(id) on delete cascade,
  coach_id      uuid,
  channel       text not null default 'email',   -- 'email' | 'ig_dm'
  step_key      text not null,                    -- e.g. 'touch_1_intro'
  step_index    int  not null default 0,
  status        text not null default 'drafted',  -- 'drafted'|'approved'|'sent'|'skipped'|'failed'
  subject       text,
  body_text     text,                             -- editable plain paragraphs (blank-line separated)
  body_html     text,                             -- rendered branded email
  booking_url   text,
  ai_model      text,
  resend_email_id text,
  edited        boolean not null default false,
  meta          jsonb not null default '{}'::jsonb,
  scheduled_for timestamptz,
  sent_at       timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists outreach_touches_lead_idx    on outreach_touches (lead_id);
create index if not exists outreach_touches_status_idx  on outreach_touches (status);
-- Guard against double-drafting the same step for the same lead.
create unique index if not exists outreach_touches_lead_step_uq
  on outreach_touches (lead_id, step_key)
  where status <> 'skipped';

-- Booking-agent lifecycle flag on the lead: null = not enrolled,
-- 'active' = agent working them, 'paused' = Kade took over, 'done' = finished.
alter table leads add column if not exists booking_agent_state text;

create index if not exists leads_booking_agent_state_idx on leads (booking_agent_state);
