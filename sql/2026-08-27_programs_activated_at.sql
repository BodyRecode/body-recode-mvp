-- Programs: when the block actually STARTED
-- 2026-08-27
--
-- `generated_at` is stamped when a program DRAFT is created, and promoting a
-- draft to active stamped nothing at all. Every block-end calculation used
-- generated_at, so the block's clock started the moment the coach generated it
-- rather than when the client began running it. A draft sitting for five weeks
-- before approval (there is one, from 24 July) would have been treated as five
-- weeks old on the day it went live, and the block-end Progress Check would
-- have fired almost immediately.
--
-- Backfill sets activated_at = generated_at for existing rows. That is the best
-- available answer for history and preserves every current calculation exactly.
alter table public.programs
  add column if not exists activated_at timestamptz;

update public.programs
  set activated_at = generated_at
  where activated_at is null and generated_at is not null;

comment on column public.programs.activated_at is
  'When the program was promoted from draft to active - the true start of the block. Block-end is activated_at + week_duration weeks. Falls back to generated_at for rows predating 2026-08-27.';
