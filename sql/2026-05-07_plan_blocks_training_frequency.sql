-- Adds training_frequency to plan_blocks so the macro plan can carry a
-- structured weekly-session count from the suggestion screen all the way
-- through to the prescription suggestion.
--
-- Previously the value lived only inside notes as 'Implied Nx/week...' text,
-- which suggest-prescription never read — so coach edits to the frequency
-- got silently ignored downstream.
--
-- Run in Supabase: SQL Editor → paste → Run.

alter table plan_blocks
  add column if not exists training_frequency integer;

-- Backfill from notes when the previous "Implied Nx/week" string is parseable
update plan_blocks
set training_frequency = (regexp_match(notes, 'Implied (\d+)x/week'))[1]::integer
where training_frequency is null
  and notes ~ 'Implied \d+x/week';
