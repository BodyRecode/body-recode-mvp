-- Height on the client record, so a BMR can actually run.
--
-- 2026-07-30 added baselines.height_cm and built energy-requirement.ts on top
-- of it. As of 2026-08-17 that column is still NULL for every client on the
-- books, and it cannot be filled for half of them, because:
--
--   - height is only ever captured by the client-facing baseline form, and
--   - 5 of the 10 active clients have never submitted a baseline at all.
--
-- So the coach has no way to record a height he already knows, and every
-- nutrition plan still falls back to "NOT RECORDED - an energy estimate is not
-- possible". The measurement exists in the coach's head and the system has
-- nowhere to put it.
--
-- This column is that place. It does NOT replace baselines.height_cm. The two
-- answer different questions:
--
--   baselines.height_cm  - height AS MEASURED at a capture, one row per
--                          capture, so genuine height loss over years stays
--                          visible rather than being overwritten.
--   clients.height_cm    - the standing system record. Always present once
--                          known, independent of whether a baseline exists,
--                          editable by the coach.
--
-- Readers resolve the two through resolveHeightCm() in src/lib/client-height.ts:
-- whichever was recorded most recently wins, with the baseline preferred on a
-- tie because it is a measurement rather than a recollection.
alter table public.clients
  add column if not exists height_cm numeric,
  add column if not exists height_recorded_at timestamptz,
  add column if not exists height_source text;

comment on column public.clients.height_cm is
  'Standing height in cm - the system record, independent of any baseline capture. Needed for BMR / energy requirement. Resolved against baselines.height_cm by src/lib/client-height.ts.';

comment on column public.clients.height_recorded_at is
  'When height_cm was last set. Used to decide whether the client record or the latest baseline holds the more recent measurement.';

comment on column public.clients.height_source is
  'Where height_cm came from: coach (typed on the client file), baseline (carried across from a baseline submission), or client (self-reported elsewhere).';

alter table public.clients
  drop constraint if exists clients_height_source_check;

alter table public.clients
  add constraint clients_height_source_check
  check (height_source is null or height_source in ('coach', 'baseline', 'client'));

-- A height outside this range is a unit error (feet typed into a cm field) or a
-- typo, not a person. Rejecting at the database means no downstream BMR can be
-- built on a number that was never plausible.
alter table public.clients
  drop constraint if exists clients_height_cm_range_check;

alter table public.clients
  add constraint clients_height_cm_range_check
  check (height_cm is null or (height_cm >= 120 and height_cm <= 230));

alter table public.baselines
  drop constraint if exists baselines_height_cm_range_check;

alter table public.baselines
  add constraint baselines_height_cm_range_check
  check (height_cm is null or (height_cm >= 120 and height_cm <= 230));
