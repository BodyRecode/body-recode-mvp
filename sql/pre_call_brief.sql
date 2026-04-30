-- Pre-Call Read - lead-specific coach brief shown on the lead detail page
-- below the Zoom Companion card. Persists the pattern read, what to listen for,
-- and lead-specific lines for the unified Zoom call.

alter table leads
  add column if not exists pre_call_brief text;
