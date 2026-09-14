-- Direction of change in where fat is stored, on the foundational intake.
--
-- Estrogen-Shift is decided by cycle status AND the direction of travel
-- (Fat_Map_Definitions_LOCKED v2.2, "The discriminator"). The intake asked the
-- first and never the second. The scorecard asked it, but the read received only
-- the scorecard's pattern name, never the answer, and as at 14 Sep 2026 one of
-- thirteen clients had answered it at all. It is history over years, so no photo,
-- tape measure or later Progress Check can supply it.
--
-- Text, nullable, same shape as the other hormonal status columns: stored as the
-- answer text, NULL when hidden (sex_at_birth = Male).

alter table intakes
  add column if not exists storage_direction text;

comment on column intakes.storage_direction is 'Direction of change in where fat is stored over the last few years. Women only; NULL when hidden. Carried from the lead scorecard answer when she gave one there (answered before any pattern was shown). Half of the Estrogen-Shift discriminator.';
