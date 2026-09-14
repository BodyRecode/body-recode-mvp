-- Run ONLY after the v2 Progress Check code is live. See 2026-09-14_progress_check_v2.sql.
alter table public.progress_checks alter column form_version set default 'v2';
