-- =====================================================================
-- Block End Notifications — idempotency table
-- =====================================================================
-- Tracks which (client × program × event) combinations have already had a
-- block-end notification email sent, so the daily cron can be re-run safely
-- without spamming. Each program block gets at most one 7-day warning and
-- one completion notification; if the coach generates a new program (new
-- program_id), notifications fire fresh against the new block.
--
-- Run in Supabase SQL editor.
-- =====================================================================

create table if not exists public.block_end_notifications_sent (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  program_id uuid not null references public.programs(id) on delete cascade,
  event_type text not null check (event_type in ('block_end_warning_7d', 'block_complete')),
  -- When we actually sent the email (UTC). The trigger date is derived from
  -- programs.generated_at + week_duration, so we don't need to denormalise it.
  sent_at timestamptz not null default now(),
  -- Snapshot of days_until_block_end at send time (handy for the audit trail)
  days_until_block_end_at_send integer,
  unique (client_id, program_id, event_type)
);

create index if not exists block_end_notifications_sent_client_idx
  on public.block_end_notifications_sent (client_id, sent_at desc);

alter table public.block_end_notifications_sent enable row level security;
-- No portal-side reads or writes; admin client only.
