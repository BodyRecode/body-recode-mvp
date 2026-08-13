-- Warm leads who have not decided yet need somewhere to sit.
--
-- Dee Berry finished her Zoom on 13 Aug and did not commit, because her
-- husband's work is unstable, not because she is not interested. Her record had
-- nothing to hold that. Once a lead is marked zoom_1_completed there is no date
-- that brings them back, so a warm undecided lead goes quiet and is only ever
-- remembered by accident.
--
-- next_follow_up_at is the date they should surface again.
-- follow_up_note is why, in Kade's words, so future-him knows what to open with.

alter table leads add column if not exists next_follow_up_at timestamptz;
alter table leads add column if not exists follow_up_note text;

comment on column leads.next_follow_up_at is
  'When this lead should surface for follow-up. Drives the Today dashboard. Cleared when they convert or decline.';
comment on column leads.follow_up_note is
  'Why they are being followed up and what to open with. Free text.';

-- Only unresolved leads are ever due, so the index skips the closed ones.
create index if not exists idx_leads_next_follow_up
  on leads (next_follow_up_at)
  where next_follow_up_at is not null;
