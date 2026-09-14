-- When her Progress Read email was last sent (coach-gated, separate from publishing).
alter table public.progress_reads add column if not exists email_sent_at timestamptz;
