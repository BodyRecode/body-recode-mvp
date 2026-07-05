-- Program Rationale Summary (2026-07-05)
--
-- Coach-facing surfaces have accumulated too much detail over months of
-- constraint-layer additions (recovery clamp, medication awareness,
-- peptide flags, RRS clamps, per-session Why/What/How, etc.). The
-- resulting `prescription_rationale` + `weekly_pattern_summary` +
-- `progression_notes` fields are 2000+ words of dense clinical prose
-- per program. Coach doesn't read them. Client obviously never sees
-- them.
--
-- Design decision (2026-07-05, discussed with Kade): keep the verbose
-- fields untouched (downstream generators — Program Reading, next-block
-- generator — read them for signal), but ADD a parallel `rationale_summary`
-- JSONB field that the generator populates in the SAME call with:
--   - headline (2-3 line decision + reason)
--   - scan (scannable pill row: phase, RPE, frequency, load direction,
--     flags count)
--   - operating_rules (3-5 one-line bullets — the things a coach
--     actually needs to know this week)
--
-- Coach UI defaults to summary. "Open full clinical rationale" toggle
-- expands the current wall. Nothing lost, everything gained in scan speed.
--
-- Nullable so existing programs display gracefully (fall through to the
-- current prescription_rationale wall when summary is absent).

alter table programs
  add column if not exists rationale_summary jsonb;
