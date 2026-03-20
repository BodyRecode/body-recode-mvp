-- Add checkin_token to clients table
-- Run this in Supabase SQL editor

alter table clients
  add column if not exists checkin_token uuid default uuid_generate_v4() unique not null;

-- Update existing clients that may have null tokens
update clients set checkin_token = uuid_generate_v4() where checkin_token is null;

-- Add coaching_started_at to clients (used for week number calculation)
alter table clients
  add column if not exists coaching_started_at timestamptz default now();

-- Set existing clients coaching_started_at to their created_at
update clients set coaching_started_at = created_at where coaching_started_at is null;

-- Add is_archived to cfws table (for version control when re-generating)
alter table cfws
  add column if not exists is_archived boolean default false;

-- Allow public (unauthenticated) to look up a client by checkin_token (read only, token field only)
-- We'll use the admin client in the server component so no policy needed for that
-- But we do need a policy to allow the checkin form to submit
create policy if not exists "public submit weekly checkin" on weekly_checkins
  for insert with check (true);
