-- Service-role grant backfill (2026-07-28)
--
-- Found while diagnosing why the Booking Agent had never produced a single
-- draft: `outreach_touches` was created with RLS enabled and NO table grants,
-- so every write from createAdminClient() failed with a permission error. The
-- Inngest sequence enrolled the lead, slept its 1-day delay, then died on
-- "draft insert failed" and retried itself to death. Silent from the app side.
--
-- A sweep for other tables where service_role lacks INSERT turned up five more,
-- all written server-side through the admin client, all sitting at zero rows:
--
--   artefact_version_archive           (artefact version archive)
--   copilot_messages                   (coach co-pilot conversation log)
--   recovery_protocol_assignments      (Recovery Protocols, shipped 21 Jul)
--   recovery_protocol_suggestions_log  (RRS suggestion audit trail)
--   supplement_assignments             (Supplement Stack, shipped 21 Jul)
--
-- service_role bypasses RLS but still needs the underlying table privilege.
-- anon/authenticated are deliberately left ungranted — these are all read and
-- written server-side only, and portal clients authenticate as `authenticated`.
-- See [[feedback-supabase-explicit-grants]] and [[reference-rls-policy-audit]].

grant select, insert, update, delete on table artefact_version_archive          to service_role;
grant select, insert, update, delete on table copilot_messages                  to service_role;
grant select, insert, update, delete on table recovery_protocol_assignments     to service_role;
grant select, insert, update, delete on table recovery_protocol_suggestions_log to service_role;
grant select, insert, update, delete on table supplement_assignments            to service_role;
