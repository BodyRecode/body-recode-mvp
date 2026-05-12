-- One-shot suppression of reading auto-emails ahead of the 2026-05-12
-- platform-update broadcast.
--
-- Context: FR / PR / NR generation routes each fire an automated email the
-- first time they publish on a row (gated by *_email_sent_at columns). For
-- the 2026-05-12 broadcast we want a single client touch, so we stamp those
-- columns on every currently-active row to short-circuit the auto-email
-- path. New blocks / plans / CFFS rows generated after today still auto-
-- email normally.
--
-- Run BEFORE clicking Generate & Publish anywhere on the coach dashboard
-- today. Idempotent: COALESCE preserves any timestamp that was already set.

UPDATE cffs
   SET client_reading_email_sent_at = COALESCE(client_reading_email_sent_at, NOW())
 WHERE is_archived = false;

UPDATE programs
   SET program_reading_email_sent_at = COALESCE(program_reading_email_sent_at, NOW())
 WHERE is_active = true;

UPDATE nutrition_plans
   SET nutrition_reading_email_sent_at = COALESCE(nutrition_reading_email_sent_at, NOW())
 WHERE is_active = true;
