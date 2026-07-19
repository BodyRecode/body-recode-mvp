-- 2026-07-19: capture the scorecard-taker's situation in their own words (voice-of-customer swipe file).
alter table leads add column if not exists situation_text text;
