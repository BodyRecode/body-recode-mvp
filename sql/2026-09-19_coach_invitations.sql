-- Coach invitations: a coach can be set up without Kade doing it by hand.
--
-- 19 September 2026. Today a coach exists only because Kade signs in and fills
-- in a provisioning form, which means he types someone else's password and that
-- person never sets one of their own. That is survivable for the first two or
-- three and impossible for a pilot of ten to twenty.
--
-- The shape mirrors intake_invitations, which has worked for clients for
-- months: a row with a token, an email, an expiry and a status, and a page that
-- accepts the token. Nothing here creates an account on its own; the invitation
-- is a permission to create one, and it is spent when it is used.

create table if not exists coach_invitations (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  full_name text not null,
  business_name text not null,
  -- What they get when they accept. Fail-closed: the lowest tier unless the
  -- invitation says otherwise, so a mistake grants less rather than more.
  product_tier text not null default 'interpret',
  token text not null unique,
  status text not null default 'pending',        -- pending | accepted | revoked | expired
  invited_by uuid references auth.users(id),
  coach_id uuid references auth.users(id),       -- filled in on acceptance
  tenant_id text,                                -- filled in on acceptance
  note text,                                     -- why they were invited, for the record
  expires_at timestamptz not null default (now() + interval '14 days'),
  accepted_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists coach_invitations_token_idx on coach_invitations (token);
create index if not exists coach_invitations_email_idx on coach_invitations (lower(email));

-- Server only. The acceptance page reads the invitation through a server route
-- with the service role, never from the browser, because the row carries the
-- token that is the permission itself.
alter table coach_invitations enable row level security;

drop policy if exists "service role only" on coach_invitations;
create policy "service role only" on coach_invitations
  for all to service_role using (true) with check (true);

revoke all on coach_invitations from anon, authenticated;

comment on table coach_invitations is
  'One invitation to become a coach on the platform. Created by an existing coach, accepted once by the person invited, who sets their own password. 19 Sep 2026.';

-- The server must be granted access explicitly. A new table does not inherit
-- it, which is the same trap that left coach_preferences unwritable for
-- months: the policy was right and the grant was missing, so it failed
-- silently. Caught here by the test rather than by a coach.
grant select, insert, update, delete on coach_invitations to service_role;
