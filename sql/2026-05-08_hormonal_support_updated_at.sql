-- Tracks when hormonal_support was last edited so the client profile can flag
-- when the active program / nutrition plan was generated before the most
-- recent change to the regimen. Without this column we can't distinguish
-- 'just-edited last week' from 'set six months ago and unchanged'.
--
-- Run in Supabase: SQL Editor → paste → Run.

alter table clients
  add column if not exists hormonal_support_updated_at timestamptz;

-- Backfill: rows that already have hormonal_support get a timestamp matching
-- their updated_at so the staleness check has a reasonable starting point.
update clients
set hormonal_support_updated_at = updated_at
where hormonal_support is not null
  and hormonal_support_updated_at is null;
