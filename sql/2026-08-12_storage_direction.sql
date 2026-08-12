-- Direction of travel: the actual Estrogen-Shift discriminator.
--
-- Why this exists. `03_ESTROGEN_SHIFT.md` §4 names one question as the
-- discriminator for this profile:
--
--   "has where it sits changed in the last few years, and which way did it move?
--    Movement from the lower body toward the middle, in a woman in the right age
--    band, is the phase-2 read."
--
-- Nothing in the funnel asked it before the pattern was named. Phase was being
-- inferred from cycle_status and age_band, so a woman could be told her fat had
-- moved from her hips to her middle when she had never said anything of the
-- kind. That is the exact misread the lock warns about, and it is worse than
-- saying nothing because she knows immediately that it is wrong about her.
--
-- Now she is asked directly, and the answer sets the phase.
--
--   gluteofemoral  - stayed on hips, thighs, glutes        -> phase 1
--   to_middle      - was hips and thighs, now the middle   -> phase 2
--   always_central - always been the middle                -> argues AGAINST this profile
--   unsure         - do not claim a phase
--
-- Female-only question. Null for men and for every lead who answered before
-- 2026-08-12.

alter table public.leads
  add column if not exists storage_direction text;

alter table public.leads
  drop constraint if exists leads_storage_direction_check;

alter table public.leads
  add constraint leads_storage_direction_check
  check (storage_direction is null or storage_direction in
    ('gluteofemoral', 'to_middle', 'always_central', 'unsure'));

comment on column public.leads.storage_direction is
  'Estrogen-Shift phase discriminator, women only. Where fat has MOVED over recent years, which the doctrine names as the real tell rather than where it currently sits. Sets phase 1 vs phase 2 for the lead-facing descriptor. Null = never asked.';
