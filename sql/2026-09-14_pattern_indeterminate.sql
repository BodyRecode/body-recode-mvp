-- The read may say no single pattern fits (Fat Map LOCKED v2.2, "Indeterminate").
--
-- Until now both checks allowed only the four patterns, so a read that honestly
-- found nothing clean would have failed to SAVE. The competing read stays four
-- patterns or 'None': "no clear pattern" is never a competitor, and when the
-- read is Indeterminate that column names the pattern the evidence leans toward.

alter table public.cffs drop constraint if exists cffs_pattern_classification_check;
alter table public.cffs add constraint cffs_pattern_classification_check check (
  pattern_classification is null or pattern_classification = any (array[
    'Stress-Stored', 'Insulin-Drift', 'Estrogen-Shift', 'Androgen-Decline', 'Indeterminate'
  ]::text[])
);

alter table public.clients drop constraint if exists clients_pattern_check;
alter table public.clients add constraint clients_pattern_check check (
  pattern is null or pattern = any (array[
    'Stress-Stored', 'Insulin-Drift', 'Estrogen-Shift', 'Androgen-Decline', 'Indeterminate'
  ]::text[])
);
