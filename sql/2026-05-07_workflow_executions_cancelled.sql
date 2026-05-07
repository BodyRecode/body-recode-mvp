-- Adds 'cancelled' to be_workflow_executions.status so the workflow runner
-- can mark an execution as halted when the lead has converted to a client
-- (or been declined) mid-sequence. Without this, the runner is stuck with
-- only 'completed' / 'failed' which both misrepresent the state.
--
-- Run in Supabase: SQL Editor → paste → Run.

alter table be_workflow_executions
  drop constraint if exists be_workflow_executions_status_check;

alter table be_workflow_executions
  add constraint be_workflow_executions_status_check
  check (status in ('running', 'completed', 'failed', 'paused', 'cancelled'));
