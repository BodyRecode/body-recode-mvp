-- Cycle context on a CLIENT, so the WEEKLY read knows where in her cycle a
-- check-in week sits.
--
-- Until now the only cycle data anywhere was on blood_panels (see
-- 2026-09-08_blood_panel_cycle_context.sql), and src/lib/cycle-phase-bands.ts
-- was referenced only by the blood-panel path. So the weekly read had no idea
-- whether it was looking at day 3 or day 24, while one of the four Fat Map
-- profiles (Estrogen-Shift) is entirely hormonal.
--
-- That matters because the same week means different things at different points
-- in a cycle. Water retention, mood, sleep quality, cravings and training
-- performance all move with phase. A luteal week read without that context
-- looks like regression; a follicular week looks like a breakthrough. Neither
-- reading is true.
--
-- last_period_start is the raw client-reported date, refreshed from the weekly
-- check-in (one optional question) rather than asked once and left to rot. The
-- cycle day is DERIVED at read time by cycleContextFor(), not stored, because
-- unlike a blood panel there is no single fixed draw date to pin it to — the
-- answer depends on which week is being read.
--
-- Deliberately NOT gated on a sex field. The question is optional and
-- self-gating: a client it does not apply to leaves it blank, the date stays
-- null, and the read says nothing about her cycle. cycleContextFor() also
-- returns null for a stale date (>60 days) or a day beyond a plausible luteal
-- phase, so a forgotten answer degrades to silence rather than to a confident
-- phase that is two weeks wrong.

alter table clients
  add column if not exists last_period_start date;

comment on column clients.last_period_start is
  'Client-reported first day of her most recent period, refreshed from the weekly check-in. Day 1 is the first day of bleeding, the convention every lab range is written against. Cycle day is derived at read time by cycleContextFor() in src/lib/cycle-phase-bands.ts, never stored. Null means the weekly read says nothing about her cycle, which is the honest answer.';
