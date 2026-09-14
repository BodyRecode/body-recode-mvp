-- "Has where it sits changed over the last few years?" had no answer for a woman
-- whose fat has always sat evenly (Kim, 14 Sep 2026: she picked "I am not sure"
-- because nothing fitted). Adds 'always_even'. Typed exactly like 'unsure': no
-- phase is claimed, and it is not treated as always-central.
-- Run BEFORE any page offers the option: the scorecard save would otherwise be
-- refused by this constraint and the lead lost.
alter table public.leads drop constraint if exists leads_storage_direction_check;
alter table public.leads add constraint leads_storage_direction_check check (
  storage_direction is null or storage_direction = any (array['gluteofemoral', 'to_middle', 'always_central', 'always_even', 'unsure']::text[])
);
