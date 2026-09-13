-- Hormonal status on the foundational intake.
--
-- The intake asked nothing about hormonal status, for men or women: no cycle,
-- no menopause stage, no hormone therapy, nothing on the male side. The read
-- typed the pattern on the "Gender" answer, which is the right question to ask
-- a person and the wrong one for choosing between Estrogen-Shift and
-- Androgen-Decline. Cycle status only ever reached anything via the LEAD record
-- (scorecard, Body Decode), so for a licensed coach's client — who never came
-- through that funnel — it was always empty.
--
-- Spec: 06_SAAS_PLATFORM_BUILD/02_FEATURE_SPECS/2026-09-13_Progress_Check_Spec.md §4.
--
-- All text, all nullable. Conditional questions (the period set is hidden when
-- sex_at_birth is Male) are stored NULL when hidden, never as a stale answer
-- left over from before she changed an earlier choice.

alter table intakes
  add column if not exists sex_at_birth text,
  add column if not exists hormone_therapy text,
  add column if not exists hormone_therapy_detail text,
  add column if not exists period_pattern text,
  add column if not exists hormonal_contraception text,
  add column if not exists pregnant_or_postpartum text,
  add column if not exists androgen_use text,
  add column if not exists vitality_energy text,
  add column if not exists vitality_drive text,
  add column if not exists vitality_libido text,
  add column if not exists vitality_recovery text;

comment on column intakes.sex_at_birth is 'Asked separately from gender, which stays. The read uses it to decide which sex-specific patterns are possible. Not re-asked in the Progress Check.';
comment on column intakes.hormone_therapy is 'Can matter MORE than sex at birth for interpretation: fat distribution follows the hormones a body is running on now.';
comment on column intakes.period_pattern is 'Basis of menopause staging; maps onto the typing engine cycle status input. NULL when hidden (sex_at_birth = Male).';
comment on column intakes.androgen_use is 'Exogenous testosterone or anabolics change the whole interpretation.';
comment on column intakes.vitality_energy is 'Vitality set (energy/drive/libido/recovery) vs a year ago at intake. MONITORING signal only, never a typing input or a cause: fat lowers testosterone, not the reverse (Androgen-Decline evidence A6).';
