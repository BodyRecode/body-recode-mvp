-- Pattern classification on the coaching side.
--
-- The funnel typed a pattern rigorously (leads.scorecard_profile, carried into
-- Blueprint / Membership / Extension by resolveBuyerPattern) while the CFFS,
-- which performs the deepest read in the system, named none of the four
-- canonical patterns in its prompt and emitted its interpretation as prose.
-- A client sold on a named pattern through three products lost the label at
-- the exact moment they became a 1:1 client and started paying the most.
--
-- Doctrine (see src/lib/pattern-doctrine.ts): pattern is a READ, not a
-- permanent attribute. It may change as evidence improves, because 25
-- self-reported scorecard answers and 221 intake points plus photos plus blood
-- markers are not comparable evidence. Reads are versioned rather than
-- overwritten, a change must be justified, and the label moves at block
-- boundaries rather than mid-block.

-- The CFFS's own read, kept per generation so history survives regeneration.
alter table public.cffs
  add column if not exists pattern_classification text,
  add column if not exists pattern_confidence text,
  add column if not exists pattern_rationale text;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'cffs_pattern_classification_check') then
    alter table public.cffs add constraint cffs_pattern_classification_check
      check (pattern_classification is null or pattern_classification in
        ('Stress-Stored','Insulin-Drift','Estrogen-Shift','Androgen-Decline'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'cffs_pattern_confidence_check') then
    alter table public.cffs add constraint cffs_pattern_confidence_check
      check (pattern_confidence is null or pattern_confidence in ('low','moderate','high'));
  end if;
end $$;

-- The resolved current answer for the person. `pattern_source` records which
-- evidence won ('scorecard' | 'challenge' | 'cffs'), so a coach can always see
-- how strong the current read is without opening the CFFS.
alter table public.clients
  add column if not exists pattern text,
  add column if not exists pattern_source text,
  add column if not exists pattern_set_at timestamptz;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'clients_pattern_check') then
    alter table public.clients add constraint clients_pattern_check
      check (pattern is null or pattern in
        ('Stress-Stored','Insulin-Drift','Estrogen-Shift','Androgen-Decline'));
  end if;
end $$;
