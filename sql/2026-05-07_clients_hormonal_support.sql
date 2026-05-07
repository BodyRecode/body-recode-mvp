-- Adds hormonal_support to clients so prescription / nutrition prompts can
-- factor in TRT, exogenous hormones, anabolic support etc. Lives on
-- clients (not intakes) because it's a longitudinal status that changes
-- over time, not a single intake snapshot.
--
-- Free text so the coach can describe regimen + dose context. The prompts
-- pass it directly to Claude and modulate recovery / load tolerance /
-- protein synthesis accordingly.
--
-- Run in Supabase: SQL Editor → paste → Run.

alter table clients
  add column if not exists hormonal_support text;

comment on column clients.hormonal_support is
  'Free text describing current hormonal therapy / TRT / anabolic support / GLP-1 etc. Drives prescription modulation. Null = no support reported.';
