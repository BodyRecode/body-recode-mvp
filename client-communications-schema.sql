-- Unified log of every email/link sent to a client.
-- Drives the "Communications" panel on the client dashboard so we always
-- know what was sent, when, and by whom. Run once in Supabase SQL editor.

create table if not exists public.client_communications (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  kind text not null,
  -- Examples for `kind`:
  --   subscription_link, portal_access, intake_invite, portal_login_code,
  --   medical_clearance_approved, coaching_start_reminder, onboarding_reminder,
  --   session_reminder, checkin_window_open, checkin_window_closing
  channel text not null default 'email',
  subject text,
  to_address text,
  meta jsonb not null default '{}'::jsonb,
  sent_by uuid references auth.users(id) on delete set null,
  sent_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists client_communications_client_id_sent_at_idx
  on public.client_communications (client_id, sent_at desc);

create index if not exists client_communications_kind_idx
  on public.client_communications (kind);

-- RLS: locked down by default. Service-role inserts/reads bypass RLS.
alter table public.client_communications enable row level security;

-- Allow authenticated coaches/admin to read (server components use the
-- admin client, but this lets the dashboard work even if it switches to
-- the user-scoped client).
drop policy if exists "Authenticated read client_communications" on public.client_communications;
create policy "Authenticated read client_communications"
  on public.client_communications
  for select
  to authenticated
  using (true);

-- Best-effort backfill: seed log rows from existing per-event timestamps
-- so the panel isn't empty for current clients.
insert into public.client_communications (client_id, kind, channel, subject, to_address, meta, sent_at)
select
  c.id,
  'subscription_link',
  'email',
  null,
  c.email,
  jsonb_build_object('package', c.package, 'trigger', 'backfill'),
  c.subscription_link_sent_at
from public.clients c
where c.subscription_link_sent_at is not null
  and not exists (
    select 1 from public.client_communications cc
    where cc.client_id = c.id and cc.kind = 'subscription_link'
  );

-- Backfill portal-access sends if the column exists.
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'clients' and column_name = 'portal_email_sent_at'
  ) then
    execute $sql$
      insert into public.client_communications (client_id, kind, channel, subject, to_address, meta, sent_at)
      select
        c.id,
        'portal_access',
        'email',
        null,
        c.email,
        jsonb_build_object('trigger', 'backfill'),
        c.portal_email_sent_at
      from public.clients c
      where c.portal_email_sent_at is not null
        and not exists (
          select 1 from public.client_communications cc
          where cc.client_id = c.id and cc.kind = 'portal_access'
        );
    $sql$;
  end if;
end $$;
