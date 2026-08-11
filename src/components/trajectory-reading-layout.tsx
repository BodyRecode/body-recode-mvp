import ReadingHeroShell from './reading-hero-shell'

/**
 * Block-end Trajectory Reading layout.
 *
 * Used by:
 *   - /portal/[token]/program/trajectory-reading
 *
 * Migrated 2026-07-20 from a bespoke cream-narrow-column editorial layout to
 * the shared dark-hero editorial shell (ReadingHeroShell). Same visual grammar
 * as Foundational / Program / Nutrition readings.
 */

export interface TrajectoryReadingData {
  tr_where_this_block_started: string | null
  tr_how_your_signal_moved: string | null
  tr_what_held_steady: string | null
  tr_what_this_sets_up_next: string | null
  tr_coach_note: string | null
  block_name: string
  progression_phase: string | null
  training_goal: string | null
  generated_at: string
  trajectory_reading_published_at: string | null
  // Progress Read state re-score (null unless a Progress Check drove this read).
  tr_new_body_state?: string | null
  tr_previous_body_state?: string | null
  tr_state_direction?: string | null
  tr_state_rationale?: string | null
  tr_pattern_confidence_note?: string | null
}

export interface TrajectoryReadingClientMeta {
  name: string
}

export default function TrajectoryReadingLayout({
  reading,
  client,
}: {
  reading: TrajectoryReadingData
  client: TrajectoryReadingClientMeta
}) {
  const pill = [reading.progression_phase, reading.training_goal].filter(Boolean).join(' · ') || null

  // A Progress Read is a Block-End Reading that also re-scored the client's body
  // state from a Progress Check. When that re-score is present, lead with the
  // then-vs-now state shift and title the document accordingly.
  const hasReScore = !!reading.tr_new_body_state
  const prev = reading.tr_previous_body_state
  const next = reading.tr_new_body_state
  const moved = !!prev && !!next && prev.toLowerCase() !== next.toLowerCase()

  const whereYouAreNow = hasReScore
    ? [
        prev
          ? `At the start of this block, your body read as ${prev}. Reading you again now, you land at ${next}.`
          : `Reading you again now, your body reads as ${next}.`,
        !prev ? '' : moved
          ? 'That is real movement, and it is the whole point of a block: not one good week, but a direction that holds.'
          : 'Holding where you are is not standing still. It means the ground you gained is now the ground you keep.',
        reading.tr_state_rationale ?? '',
      ].filter(Boolean).join('\n\n')
    : null

  const sections = [
    ...(whereYouAreNow
      ? [{ key: 'tr_where_you_are_now', label: 'Where you are now', icon: 'target' as const, content: whereYouAreNow }]
      : []),
    { key: 'tr_where_this_block_started', label: 'Where this block started', icon: 'pin' as const,     content: reading.tr_where_this_block_started },
    { key: 'tr_how_your_signal_moved',    label: 'How your signal moved',    icon: 'path' as const,    content: reading.tr_how_your_signal_moved },
    { key: 'tr_what_held_steady',         label: 'What held steady',         icon: 'hold' as const,    content: reading.tr_what_held_steady },
    { key: 'tr_what_this_sets_up_next',   label: 'What this sets up next',   icon: 'compass' as const, content: reading.tr_what_this_sets_up_next },
    ...(hasReScore && reading.tr_pattern_confidence_note
      ? [{ key: 'tr_pattern_note', label: 'What your pattern is still telling us', icon: 'hold' as const, content: reading.tr_pattern_confidence_note }]
      : []),
  ]

  return (
    <ReadingHeroShell
      eyebrow={hasReScore ? 'Progress Read' : 'Block-End Reading'}
      heroTitle={reading.block_name}
      heroSub={hasReScore
        ? 'A fresh read of where your body sits now, set against where this block started. Direction held across weeks is the signal, not any single week on its own.'
        : 'How your body moved across this block, read as one arc. Direction held across weeks is the signal, not any single week on its own.'}
      pill={pill}
      clientName={client.name}
      aboutText={
        <p>
          <b>About this reading.</b> A single week is never the verdict. Direction held across weeks is the signal. This reading is here so you can see the shape of where you have been travelling, trust that the work compounded even on the flat weeks, and carry that into what comes next.
        </p>
      }
      sections={sections}
      coachNote={{ content: reading.tr_coach_note }}
    />
  )
}
