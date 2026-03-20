-- Add report columns to leads table
alter table leads
  add column if not exists report_html text,
  add column if not exists report_scheduled_at timestamptz;
