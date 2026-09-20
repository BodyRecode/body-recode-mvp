-- Let a half-finished intake follow her to another device.
--
-- 20 September 2026. The form already saved every answer as she went, but it
-- saved into her browser. Start it on the phone, open the link on the laptop,
-- and the laptop was blank. With the intake now a 25 to 35 minute job, moving
-- devices part-way through is a realistic thing for somebody to do.
--
-- ON THE INVITATION, not a table of its own, because the draft has exactly the
-- invitation's lifecycle: it exists while the invitation is open and it is
-- meaningless once the invitation is complete. Nothing to tidy up separately
-- and nothing to leak once the intake is submitted.
--
-- CONSENT. She ticks the health consent on the first screen before any health
-- question is asked, so anything saved here is collected under a consent she
-- has already given. The route refuses to save until that tick is present,
-- which is enforced in code rather than trusted to the client.

alter table intake_invitations add column if not exists draft_data jsonb;
alter table intake_invitations add column if not exists draft_section integer;
alter table intake_invitations add column if not exists draft_updated_at timestamptz;

comment on column intake_invitations.draft_data is
  'Partly-completed intake answers, so she can resume on another device. Cleared on submit. Written only after the health consent tick. 20 Sep 2026.';
