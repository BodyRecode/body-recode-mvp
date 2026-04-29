-- Add a `scheduled` boolean column to calendar_posts so Kade can tick off
-- posts as they're actually scheduled in LinkedIn / IG / Threads natively.
-- Default false (not yet scheduled).

alter table public.calendar_posts
  add column if not exists scheduled boolean not null default false;

-- Optional: index if we ever filter by it heavily (skip for now, calendar reads
-- a small number of rows per view).
