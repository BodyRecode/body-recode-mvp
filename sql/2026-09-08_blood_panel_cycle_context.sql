-- Cycle context on a blood panel, so phase-dependent hormone ranges can be read.
--
-- Labs print four reference ranges for LH, FSH, oestradiol and progesterone,
-- one per cycle phase. Razia's 25 Aug 2026 panel printed all four and stated no
-- cycle day, so those four markers came back unreadable.
--
-- The extractor cannot resolve this and must not: its prompt requires the
-- reference range exactly as printed and forbids substituting its own idea of
-- normal. Proven 8 Sep 2026 by handing it the dates and getting no change.
-- Band selection happens in src/lib/cycle-phase-bands.ts instead: a plain
-- calculation, no model, written to a separate field, never overwriting the
-- lab's printed range or the lab's own flag.
--
-- last_period_start is the raw client-reported input. cycle_day is derived from
-- it and collected_on, stored so it is visible and auditable rather than
-- recomputed silently. cycle_note carries the client's own words, including any
-- caveat such as "my cycles are sometimes irregular", which is the thing that
-- stops an approximate day being treated as established fact.

alter table blood_panels
  add column if not exists last_period_start date,
  add column if not exists cycle_day integer,
  add column if not exists cycle_note text;

comment on column blood_panels.last_period_start is
  'Client-reported first day of the period before this draw. Approximate by nature.';
comment on column blood_panels.cycle_day is
  'Derived: collected_on - last_period_start + 1. Day 1 is the first day of bleeding.';
comment on column blood_panels.cycle_note is
  'Client''s own words about their cycle, including irregularity caveats.';
