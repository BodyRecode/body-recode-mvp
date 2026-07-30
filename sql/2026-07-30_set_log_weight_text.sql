-- Non-numeric load entries on a set log.
--
-- weight_kg is numeric and the input was type="number", so a bodyweight
-- exercise had nowhere to record what the load actually was. A client doing
-- Bodyweight Squat either left the field blank, which reads back as "not
-- logged", or typed nothing at all. Vicki's Restoration block is almost entirely
-- bodyweight and machine work, so most of her sets would have logged no load
-- information whatsoever.
--
-- weight_text holds what the client actually entered: "BW", "BW+5", "red band",
-- "plate 4". weight_kg keeps any numeric part so progression maths, prefill and
-- the RPE creep monitor carry on working unchanged. Neither replaces the other.
alter table public.exercise_set_logs
  add column if not exists weight_text text;

comment on column public.exercise_set_logs.weight_text is
  'Raw load as the client typed it, for non-numeric entries like BW, BW+5 or a band colour. weight_kg holds the numeric part when there is one.';
