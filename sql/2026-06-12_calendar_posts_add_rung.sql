-- Beliefs Ladder rung tagging for calendar_posts.
-- Layers the belief-sequence spine onto the existing archetype × topic calendar
-- WITHOUT replacing any captions or graphics. One new nullable column + a
-- topic->rung backfill for the June 2026 Body Recode IG cycle.
--
-- Ladder (see 06_SAAS_PLATFORM_BUILD/2026-06-10_Beliefs_Ladder_v1.md):
--   R1 Body State        (Topic 1)  — "not broken, in a state"
--   R2 Effort            (Topic 2)  — "effort isn't the missing variable"
--   R3 Cortisol cause    (Topic 3)  — "biological reason, not my fault"
--   R4 Interpretation    (Topic 4)  — "interpretation before prescription"
--   R5 Identity          (Topic 5)  — "intelligent model, I belong here"
--   Action               (diagnostic) — "know my state first -> scorecard"
--
-- Safe to re-run.

begin;

alter table calendar_posts add column if not exists rung text;

comment on column calendar_posts.rung is
  'Beliefs Ladder rung this post installs: R1 (Body State), R2 (Effort), R3 (Cortisol cause), R4 (Interpretation), R5 (Identity), Action (scorecard). See 06_SAAS_PLATFORM_BUILD/2026-06-10_Beliefs_Ladder_v1.md';

-- Scope all updates to the June 2026 Body Recode IG cycle.
-- NB platform='instagram' is REQUIRED: the body_recode brand also carries a
-- LinkedIn post stream whose coach/contrarian types would otherwise be caught.
-- Uniform-rung slots: diagnostic=Action, coach=R4, contrarian=R5.
update calendar_posts set rung = 'Action'
  where date between '2026-06-03' and '2026-06-30'
    and coalesce(brand,'body_recode')='body_recode'
    and coalesce(platform,'instagram')='instagram' and type='diagnostic';

update calendar_posts set rung = 'R4'
  where date between '2026-06-03' and '2026-06-30'
    and coalesce(brand,'body_recode')='body_recode'
    and coalesce(platform,'instagram')='instagram' and type='coach';

update calendar_posts set rung = 'R5'
  where date between '2026-06-03' and '2026-06-30'
    and coalesce(brand,'body_recode')='body_recode'
    and coalesce(platform,'instagram')='instagram' and type='contrarian';

-- Mixed slots: authority + pattern carry the foundation rungs per topic.
update calendar_posts set rung = 'R1' where date='2026-06-03' and type='pattern';   -- Body State
update calendar_posts set rung = 'R3' where date='2026-06-10' and type='pattern';   -- Cortisol
update calendar_posts set rung = 'R3' where date='2026-06-17' and type='pattern';   -- Cortisol
update calendar_posts set rung = 'R1' where date='2026-06-24' and type='pattern';   -- Body State

update calendar_posts set rung = 'R3' where date='2026-06-08' and type='authority'; -- Cortisol
update calendar_posts set rung = 'R2' where date='2026-06-15' and type='authority'; -- Effort
update calendar_posts set rung = 'R1' where date='2026-06-22' and type='authority'; -- Body State
update calendar_posts set rung = 'R2' where date='2026-06-29' and type='authority'; -- Effort

commit;

-- Verify:
-- select date, type, rung, title from calendar_posts
-- where date between '2026-06-03' and '2026-06-30'
--   and coalesce(brand,'body_recode')='body_recode' order by date;
