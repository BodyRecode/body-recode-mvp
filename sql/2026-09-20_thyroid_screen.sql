-- Storage for the thyroid screen, research pass T1, 20 September 2026.
--
-- Four questions: the case-finding list Australian guidelines already use, the
-- medication question, what has CHANGED in the last year, and the products
-- that either contain real thyroid hormone or falsify the blood test.
--
-- One JSON column for the same reason training_context is one: these are read
-- together as a screen, and a column per question would mean a migration every
-- time the guidance moves.
--
-- THEY DO NOT PRODUCE A SCORE. A thirteen-symptom score separates underactive
-- thyroid function from normal function at 0.64 in older women, close to a coin
-- toss. These answers may TRIGGER a referral and hold the eating plan. They may
-- never produce a likelihood, a percentage or a pattern.

alter table intakes add column if not exists thyroid_screen jsonb;

comment on column intakes.thyroid_screen is
  'Thyroid case-finding screen (tq_ prefixed). Triggers a referral and the nutrition hold. NEVER a score or a likelihood. Research pass T1, 20 Sep 2026.';
