-- 2026-09-14: is the scorecard-taker training right now? The site now speaks to women who are not
-- training but whose body feels off, and sections 04/05 are worded for her life when she is not.
-- The scores stay on the same 1-3 scale; this column says which wording she answered.
alter table leads add column if not exists training_status text
  check (training_status in ('regular', 'on_off', 'none'));
