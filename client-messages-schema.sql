-- Client-initiated messages from the portal "Message your coach" form.
-- Separate from client_communications which is outbound (coach -> client).
-- Run once in Supabase SQL editor.

create table if not exists public.client_messages (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  body text not null,
  read_at timestamptz,
  responded_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists client_messages_client_id_created_at_idx
  on public.client_messages (client_id, created_at desc);

create index if not exists client_messages_unread_idx
  on public.client_messages (created_at desc)
  where read_at is null;

alter table public.client_messages enable row level security;

drop policy if exists "Authenticated read client_messages" on public.client_messages;
create policy "Authenticated read client_messages"
  on public.client_messages
  for select
  to authenticated
  using (true);
