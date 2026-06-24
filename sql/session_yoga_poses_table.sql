-- ============================================================
-- Yoga sequence storage (modality pack: yoga)
-- Parallel to session_exercises. Reuses programs + program_sessions.
-- ============================================================

CREATE TABLE IF NOT EXISTS session_yoga_poses (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id        uuid REFERENCES program_sessions(id) ON DELETE CASCADE,
  yoga_movement_id  uuid REFERENCES yoga_movements(id),
  segment_key       text,                  -- arc segment: center/warm/build/peak/counter/rest
  sort_order        integer NOT NULL DEFAULT 0,
  side              text,                  -- 'left' | 'right' | 'both' | null
  hold_seconds      integer,
  breaths           integer,
  cue               text,
  created_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX session_yoga_poses_session_idx ON session_yoga_poses(session_id);

-- ============================================================================
-- GRANTS
-- ============================================================================
grant select, insert, update, delete on public.session_yoga_poses to service_role;
grant select, insert, update, delete on public.session_yoga_poses to authenticated;

-- ============================================================================
-- RLS  (mirror session_exercises: coaches manage poses for their own clients)
-- ============================================================================
alter table session_yoga_poses enable row level security;

drop policy if exists "coaches manage session yoga poses" on session_yoga_poses;
create policy "coaches manage session yoga poses" on session_yoga_poses
  for all using (
    session_id in (
      select ps.id from program_sessions ps
      join programs p on ps.program_id = p.id
      join clients c on p.client_id = c.id
      where c.coach_id = auth.uid()
    )
  );

drop policy if exists "service role manages session yoga poses" on session_yoga_poses;
create policy "service role manages session yoga poses" on session_yoga_poses
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');
