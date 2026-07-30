-- Daily meal logging becomes opt-in per client.
--
-- It was on for every client. Across the system's entire history it had been
-- used ONCE: one client (Amanda), one day, three entries, on 2026-07-23.
--
-- Two reasons to gate it rather than leave it visible and ignored:
--
-- 1. The weekly check-in already asks the adherence question. Its nutrition
--    section covers whether the plan was followed, what the client noticed, the
--    overall direction and free-text notes, and submit-weekly-checkin writes the
--    nutrition_reviews rows the coach reads. A daily log adds nothing the coach
--    is currently acting on.
--
-- 2. It works against the prescription it sits inside. A stabilisation plan's
--    own what_not_to_change says repetition and low decision burden ARE the
--    mechanism, and that the plan must not become a source of rigidity or
--    moralising about food. A daily food log is the most surveillance-shaped
--    surface in the portal and it contradicts that directly.
--
-- Kept rather than deleted, because there is one case the weekly check-in cannot
-- cover: a failing plan where the coach needs to know WHICH meal fails and when.
-- "She struggled this week" is a summary; "meal 3 gets skipped on office days"
-- is actionable. Switch it on for that, then switch it off again.
alter table public.clients
  add column if not exists meal_logging_enabled boolean not null default false;

comment on column public.clients.meal_logging_enabled is
  'Opt-in daily meal-adherence logging in the portal. Default false. Turn on only to diagnose which meal a failing plan fails at; the weekly check-in covers general adherence.';
