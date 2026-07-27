-- Two-way coach <-> client messaging.
--
-- client_messages was client-to-coach only: the client posted from the portal,
-- Kade got a notification email, and he replied by email. There was no thread,
-- nothing in the portal came back, and no dashboard screen ever read the table.
-- It was used zero times.
--
-- This makes the same table carry both sides of the conversation:
--   sender          who wrote it ('client' | 'coach')
--   sent_by         the auth user who sent it, for coach messages
--   client_read_at  when the CLIENT read a coach message
--
-- Existing columns keep their meaning:
--   read_at         when the COACH read a client message
--   responded_at    when the coach replied to a client message
--
-- Every existing row predates coach replies, so 'client' is the correct
-- default and the backfill is a no-op (the table is empty today anyway).

alter table public.client_messages
  add column if not exists sender text not null default 'client',
  add column if not exists sent_by uuid references auth.users(id) on delete set null,
  add column if not exists client_read_at timestamptz;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'client_messages_sender_check'
  ) then
    alter table public.client_messages
      add constraint client_messages_sender_check check (sender in ('client', 'coach'));
  end if;
end $$;

-- Coach inbox: unread client messages, newest first.
create index if not exists client_messages_unread_for_coach_idx
  on public.client_messages (created_at desc)
  where sender = 'client' and read_at is null;

-- Portal badge: unread coach replies for one client.
create index if not exists client_messages_unread_for_client_idx
  on public.client_messages (client_id, created_at desc)
  where sender = 'coach' and client_read_at is null;

grant select, insert, update on public.client_messages to service_role;

-- RLS stays as it was: authenticated read, all writes go through the service
-- role in the API routes, which is where the ownership checks live.
