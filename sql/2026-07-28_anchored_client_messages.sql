-- Anchored messages: attach a message to the artefact it is about.
--
-- Phase 1 gave coach and client one floating conversation. That is what every
-- coaching app has. The differentiator is tying the question to the thing it
-- is about: a client reading "your ceiling is capped by your feet" should be
-- able to ask about THAT, right there, and have the exchange stay attached to
-- it forever.
--
--   anchor_kind   which artefact type ('program', 'nutrition', ...). Null for
--                 a general message, which is the Phase 1 behaviour.
--   anchor_id     the artefact row id where one exists. Nullable because some
--                 anchors are a page, not a row (e.g. supplements).
--   anchor_label  human label snapshotted at send time ("Block 2 - Rebuild").
--                 Denormalised on purpose: the block gets renamed or archived
--                 and the message should still read correctly a year later.

alter table public.client_messages
  add column if not exists anchor_kind text,
  add column if not exists anchor_id uuid,
  add column if not exists anchor_label text;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'client_messages_anchor_kind_check'
  ) then
    alter table public.client_messages
      add constraint client_messages_anchor_kind_check check (
        anchor_kind is null or anchor_kind in (
          'foundational_reading',
          'program',
          'nutrition',
          'checkin',
          'bloods',
          'supplements',
          'recovery',
          'routine'
        )
      );
  end if;
end $$;

-- "Show me everything asked about this client's nutrition" and the per-artefact
-- thread lookup on the portal.
create index if not exists client_messages_anchor_idx
  on public.client_messages (client_id, anchor_kind, created_at desc)
  where anchor_kind is not null;
