-- Seed the July 2026 IG cycle (Wed 1 Jul - Tue 28 Jul) into calendar_posts,
-- designed LADDER-FIRST. See 06_SAAS_PLATFORM_BUILD/2026-06-12_July_Cycle_Ladder_First_v1.md
--
-- Each row carries date/type/rung/persona/format + a working-title hook.
-- CAPTIONS ARE LEFT NULL on purpose: Kade writes those in his own voice
-- (no AI-drafted long-form captions). Graphics TBD.
--
-- Slot->topic map (the July fix vs June's slot lock):
--   Mon Authority   -> R1 Body State / R3 Cortisol
--   Tue Contrarian  -> R2 Effort / R4 Interpretation   (fixes June R2 starvation)
--   Wed Pattern     -> R1 / R2 / R3 recognition
--   Fri Coach       -> R5 Identity / R4 Interpretation
--   Sun Diagnostic  -> Action
--
-- Phase: 'scale' (July sits in the 24 May - 31 Dec scale range).
-- Safe to re-run: clears the July 2026 BR IG rows first.

begin;

delete from calendar_posts
where date between '2026-07-01' and '2026-07-31'
  and coalesce(brand,'body_recode') = 'body_recode'
  and coalesce(platform,'instagram') = 'instagram';

insert into calendar_posts (date, time, brand, platform, type, phase, rung, title, notes, caption, graphic) values
('2026-07-01','12:00','body_recode','instagram','pattern','scale','R1',
 'Stuck isn''t a discipline problem. It''s a state.',
 'CAROUSEL · Arch 01 Stressed Executive Woman · Topic 1 Body State · Rung R1', null, null),
('2026-07-03','18:00','body_recode','instagram','coach','scale','R4',
 'Why I won''t write your perimenopause plan until I''ve read your state.',
 'STATIC · Arch 02 Perimenopausal Performer · Topic 4 Prescription Without Interpretation · Rung R4', null, null),
('2026-07-05','08:00','body_recode','instagram','diagnostic','scale','Action',
 'Three years postnatal and nothing moves? Find out why.',
 'STATIC · Arch 03 Postnatal Athlete · Topic 1 Body State · Hard CTA -> Scorecard · Rung Action', null, null),
('2026-07-06','07:00','body_recode','instagram','authority','scale','R1',
 'At 45 your body runs a different operating system. Most men never read it.',
 'STATIC · Arch 04 Slipping High Performer · Topic 1 Body State · Rung R1', null, null),
('2026-07-07','07:00','body_recode','instagram','contrarian','scale','R2',
 'You''re the most disciplined person in the room. That''s why it isn''t working.',
 'CAROUSEL · Arch 01 Stressed Executive Woman · Topic 2 Why Effort Isn''t Working · Rung R2', null, null),
('2026-07-08','12:00','body_recode','instagram','pattern','scale','R3',
 'Wired, tired, holding weight at the middle? That''s a cortisol signature.',
 'CAROUSEL · Arch 02 Perimenopausal Performer · Topic 3 Cortisol and Fat Storage · Rung R3', null, null),
('2026-07-10','18:00','body_recode','instagram','coach','scale','R5',
 'The mums I coach aren''t behind. They were never read properly.',
 'STATIC · Arch 03 Postnatal Athlete · Topic 5 Intelligent Approach · Rung R5', null, null),
('2026-07-12','08:00','body_recode','instagram','diagnostic','scale','Action',
 'Tried every protocol and nothing held? Read the state first.',
 'STATIC · Arch 04 Slipping High Performer · Topic 1 Body State · Hard CTA -> Scorecard · Rung Action', null, null),
('2026-07-13','07:00','body_recode','instagram','authority','scale','R3',
 'Cortisol decides where you store fat. Discipline doesn''t override it.',
 'STATIC · Arch 01 Stressed Executive Woman · Topic 3 Cortisol and Fat Storage · Rung R3', null, null),
('2026-07-14','07:00','body_recode','instagram','contrarian','scale','R2',
 'More cardio in perimenopause is the fastest way to hold the weight.',
 'CAROUSEL · Arch 02 Perimenopausal Performer · Topic 2 Why Effort Isn''t Working · Rung R2', null, null),
('2026-07-15','12:00','body_recode','instagram','pattern','scale','R2',
 'More training, less food, and you got softer. Here''s what that means.',
 'CAROUSEL · Arch 03 Postnatal Athlete · Topic 2 Why Effort Isn''t Working · Rung R2', null, null),
('2026-07-17','18:00','body_recode','instagram','coach','scale','R5',
 'Smart men don''t need more discipline. They need a better model.',
 'REEL · Arch 04 Slipping High Performer · Topic 5 Intelligent Approach · Rung R5', null, null),
('2026-07-19','08:00','body_recode','instagram','diagnostic','scale','Action',
 'Depleted, Transitioning, or Ready? Two minutes tells you.',
 'STATIC · Arch 01 Stressed Executive Woman · Topic 1 Body State · Hard CTA -> Scorecard · Rung Action', null, null),
('2026-07-20','07:00','body_recode','instagram','authority','scale','R1',
 'Perimenopause isn''t the end of your body responding. It''s a state shift.',
 'STATIC · Arch 02 Perimenopausal Performer · Topic 1 Body State · Rung R1', null, null),
('2026-07-21','07:00','body_recode','instagram','contrarian','scale','R4',
 'You''re not behind a timeline. You were handed the wrong map.',
 'REEL · Arch 03 Postnatal Athlete · Topic 4 Prescription Without Interpretation · Rung R4', null, null),
('2026-07-22','12:00','body_recode','instagram','pattern','scale','R3',
 'Belly fat at 45 isn''t ageing. It''s a stress readout.',
 'CAROUSEL · Arch 04 Slipping High Performer · Topic 3 Cortisol and Fat Storage · Rung R3', null, null),
('2026-07-24','18:00','body_recode','instagram','coach','scale','R5',
 'Built for the woman who is excellent everywhere except where she was misinformed.',
 'REEL · Arch 01 Stressed Executive Woman · Topic 5 Intelligent Approach · Rung R5', null, null),
('2026-07-26','08:00','body_recode','instagram','diagnostic','scale','Action',
 'Stop guessing which plan fits. Read the state behind the symptoms.',
 'STATIC · Arch 02 Perimenopausal Performer · Topic 1 Body State · Hard CTA -> Scorecard · Rung Action', null, null),
('2026-07-27','07:00','body_recode','instagram','authority','scale','R3',
 'Five years of broken sleep rewired your stress system. The weight is downstream.',
 'STATIC · Arch 03 Postnatal Athlete · Topic 3 Cortisol and Fat Storage · Rung R3', null, null),
('2026-07-28','07:00','body_recode','instagram','contrarian','scale','R4',
 'TRT isn''t first. Reading the state is.',
 'REEL · Arch 04 Slipping High Performer · Topic 4 Prescription Without Interpretation · Rung R4', null, null);

commit;

-- Verify:
-- select date, type, rung, title from calendar_posts
-- where date between '2026-07-01' and '2026-07-31'
--   and coalesce(brand,'body_recode')='body_recode'
--   and coalesce(platform,'instagram')='instagram' order by date;
