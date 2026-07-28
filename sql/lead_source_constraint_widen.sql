-- Widen leads_source_check to accept 'meta' and 'funnel' (2026-07-28).
--
-- Two routes were writing source values the constraint rejected. A rejected
-- INSERT is not a soft failure: the whole signup dies and the visitor sees
-- "Failed to create lead." Nothing is retried and nothing reaches the
-- dashboard, so the lead is simply lost.
--
--   /api/challenge/enroll   wrote 'meta' for visitors arriving with
--                           utm_source=meta -> paid Meta traffic could not
--                           enrol at all, while organic traffic (falling
--                           through to 'other') worked fine. Surfaced when
--                           someone hit it from a paid ad and messaged Kade
--                           on Instagram.
--   /api/funnels/[id]/submit wrote 'funnel' -> failed every time.
--
-- Both call sites now go through normaliseLeadSource() in
-- src/lib/lead-source.ts, which degrades an unknown value to 'other' so a new
-- utm value can never kill a signup again. This widening is so the two real
-- sources are labelled accurately rather than all landing in 'other'.
--
-- Keep ALLOWED_LEAD_SOURCES in src/lib/lead-source.ts in step with this list.

alter table leads drop constraint if exists leads_source_check;
alter table leads add constraint leads_source_check
  check (source = any (array[
    'quiz','instagram','facebook','linkedin','google',
    'gym_floor','referral','direct','other','meta','funnel'
  ]));
