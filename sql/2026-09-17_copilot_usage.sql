-- Per-coach daily co-pilot usage, so one enthusiastic pilot coach cannot run
-- up the model bill unnoticed.
--
-- A counter rather than a log: the messages themselves are already stored in
-- copilot_messages for the client bubble, and the general co-pilot keeps no
-- history server-side. All this needs to answer is "how many today".
CREATE TABLE IF NOT EXISTS public.copilot_usage_daily (
  coach_id  uuid NOT NULL,
  day       date NOT NULL DEFAULT (now() AT TIME ZONE 'Australia/Brisbane')::date,
  messages  integer NOT NULL DEFAULT 0,
  PRIMARY KEY (coach_id, day)
);

COMMENT ON TABLE public.copilot_usage_daily IS
  'One row per coach per Brisbane day. Incremented by the co-pilot routes; read to enforce the daily cap for coaches who are not the owner.';

GRANT SELECT, INSERT, UPDATE ON public.copilot_usage_daily TO service_role;
