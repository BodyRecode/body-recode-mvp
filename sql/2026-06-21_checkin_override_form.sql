-- Smart Reopen: per-client check-in form override (2026-06-21)
--
-- When a client misses a weekend window and the coach clicks Reopen on
-- Monday, the global rotation has already ticked to the next form. Pre-
-- 2026-06-21 they'd see the wrong form on catch-up (Amanda W6: missed
-- system week 12 = B, caught up in system week 13 = A → submitted A
-- instead of B, breaking her A-B alternation for the coach view).
--
-- The Reopen API now computes which form the client should actually do
-- (the one they missed: opposite of their last submitted, when the
-- global rotation no longer matches) and stamps it here. The portal
-- check-in page uses this when the override window is active. Cleared
-- automatically the next time the coach Reopens (recomputed) or when
-- the window closes via close action.
alter table clients
  add column if not exists checkin_window_override_form text
    check (checkin_window_override_form in ('A', 'B'));
