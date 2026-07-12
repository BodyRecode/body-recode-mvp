-- Coach Co-Pilot — Phase 1 message store (2026-07-12)
--
-- Per-client conversation log for the read-only doctrine tutor. Coach-scoped
-- (coach_id copied from the client row) so the white-label version is a
-- filter, not a rebuild. `flagged` powers the thumbs-down "flag for review"
-- loop (reviewer = Kade for now). RLS enabled with no policies: only the
-- service-role admin client (used by the auth-gated API routes) can read/write.

create table if not exists copilot_messages (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,
  coach_id uuid,
  role text not null check (role in ('user','assistant')),
  content text not null,
  sources jsonb,
  flagged boolean not null default false,
  flagged_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists copilot_messages_client_idx on copilot_messages (client_id, created_at);
create index if not exists copilot_messages_flagged_idx on copilot_messages (flagged) where flagged = true;
alter table copilot_messages enable row level security;
