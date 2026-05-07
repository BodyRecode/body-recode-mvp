-- Tracks when hormonal_support was last edited so the client profile can flag
-- when the active program / nutrition plan was generated before the most
-- recent change to the regimen. Without this column we can't distinguish
-- 'just-edited last week' from 'set six months ago and unchanged'.
--
-- Run in Supabase: SQL Editor → paste → Run.

alter table clients
  add column if not exists hormonal_support_updated_at timestamptz;

-- Backfill: rows that already have hormonal_support get now() as the
-- timestamp. clients has no updated_at column so we can't use a real edit
-- time, and using created_at would falsely make new entries look ancient.
-- now() is correct here: it stamps the moment the field became known to
-- the staleness system, so any active program / nutrition plan generated
-- before this migration ran will correctly trigger the banner.
update clients
set hormonal_support_updated_at = now()
where hormonal_support is not null
  and hormonal_support_updated_at is null;
