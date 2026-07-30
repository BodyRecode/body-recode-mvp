-- Height on the baseline.
--
-- Found 2026-07-30 while writing Vicki S's calorie derivation: height was
-- recorded NOWHERE in the system. Not on baselines, not on intakes, not on
-- clients. Every BMR equation needs it, so no energy requirement could be
-- estimated for any client, ever.
--
-- That is why the nutrition engine derives estimated_calorie_band FROM the
-- meals (Σkcal ± 100) rather than the other way round, and why the validator
-- says "the coach reviews the daily totals and decides whether the resulting
-- band is appropriate". The engine was never able to make that judgement,
-- because it did not hold the one measurement the judgement requires.
--
-- Lives on baselines rather than clients so it travels with the measurement
-- set, the same as bodyweight, and so genuine height loss over years is
-- visible rather than overwritten. It is asked ONCE: the capture form hides
-- the field when a previous value exists and carries that value forward, since
-- re-asking at every check-in is friction for no information.
alter table public.baselines
  add column if not exists height_cm numeric;

comment on column public.baselines.height_cm is
  'Height in cm. Captured once at first baseline and carried forward on re-captures. Needed for any BMR or energy-requirement estimate.';
