-- "Where are you in your cycle?" had no true answer for a woman with no periods
-- who is not past menopause (Kim, 15 Sep 2026: hysterectomy, picked "Regular
-- cycle" because nothing fitted). It also asked her to label herself
-- perimenopausal or postmenopausal, which 03_ESTROGEN_SHIFT section 10 says is a
-- clinical determination we never make.
--
-- The scorecard, Body Decode and founding forms now ask "Which best describes
-- your periods now?". The four existing codes stay valid for the leads that
-- already hold them. New codes:
--   treatment_ovaries_out   stopped after surgery or medical treatment, ovaries
--                           removed or stopped working (menopause-equivalent)
--   treatment_ovaries_kept  stopped after surgery or treatment, ovaries still working
--   treatment_unsure        stopped after surgery or treatment, not sure about ovaries
--   contraception           stopped or changed by hormonal contraception
--   pregnant_postpartum     pregnant, or had a baby in the last 12 months
--   none_other              no periods for another reason
--
-- Run BEFORE any page offers the new answers: the save would otherwise be
-- refused by this constraint and the lead lost.
alter table public.leads drop constraint if exists leads_cycle_status_check;
alter table public.leads add constraint leads_cycle_status_check check (
  cycle_status is null or cycle_status = any (array[
    'regular', 'irregular', 'perimenopausal', 'postmenopausal',
    'treatment_ovaries_out', 'treatment_ovaries_kept', 'treatment_unsure',
    'contraception', 'pregnant_postpartum', 'none_other'
  ]::text[])
);

-- The intake splits "Stopped after surgery" the same way. A hysterectomy that
-- keeps the ovaries stops periods without changing hormones; removing them, or
-- treatment that stops them working, is a surgical menopause.
alter table public.intakes add column if not exists ovaries_after_treatment text;
comment on column public.intakes.ovaries_after_treatment is 'Asked only when periods stopped after surgery or medical treatment. Removed or stopped working = menopause-equivalent (held low). NULL when hidden.';
