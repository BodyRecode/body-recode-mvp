-- UTM attribution columns on leads table
-- Captures utm_source / utm_medium / utm_campaign / utm_content from ad URLs at Challenge enrolment.
-- Run: supabase db query --linked < sql/2026-07-22_leads_utm_columns.sql
-- Applied: 2026-07-22 via supabase db query --linked (direct execution)

ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS utm_source   text,
  ADD COLUMN IF NOT EXISTS utm_medium   text,
  ADD COLUMN IF NOT EXISTS utm_campaign text,
  ADD COLUMN IF NOT EXISTS utm_content  text;
