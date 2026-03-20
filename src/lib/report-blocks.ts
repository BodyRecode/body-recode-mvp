// Canonical verbatim blocks from Body_Recode_Initial_Report_Pattern_Blocks_v1.0_CANONICAL_FORMATTED
// These must not be edited, shortened, or combined.

export const SLS_BLOCKS: Record<1 | 2 | 3, { title: string; text: string }> = {
  1: {
    title: 'Balanced Load State',
    text: `Your responses suggest that current training load and day-to-day demands are relatively well balanced at the moment.

This does not mean progress is guaranteed, or that no adjustments will ever be needed. It indicates that load does not appear to be the dominant constraint right now.

Inside Body Recode™, balance is assessed across time. This snapshot simply suggests that load accumulation is not currently standing out as the primary stress signal.`,
  },
  2: {
    title: 'Moderate Cumulative Load State',
    text: `Your responses suggest a moderate level of cumulative load at the moment.

This often occurs when training demands overlap with work, schedule pressure, or recovery variability. Progress may still be occurring, but the body may be working harder to maintain it.

This snapshot does not imply overload. It highlights that multiple demands may currently be influencing how your system responds.`,
  },
  3: {
    title: 'Elevated Cumulative Load State',
    text: `Your responses indicate elevated cumulative load right now.

In Body Recode™, load includes more than workouts. When training, recovery demands, and life stress overlap, the total cost to the system increases, even if training itself has not changed.

At this stage, the body often prioritises protection over visible change. This reflects load accumulation, not lack of effort or discipline.`,
  },
}

export const RPS_BLOCKS: Record<1 | 2 | 3, { title: string; text: string }> = {
  1: {
    title: 'Stable Recovery Predictability',
    text: `Your responses suggest that recovery currently feels relatively stable and predictable.

This does not mean recovery is perfect or unlimited. It suggests that, at this moment, recovery variability is not standing out as a primary constraint.

Recovery patterns are best understood across time. This snapshot simply reflects how recovery is presenting right now.`,
  },
  2: {
    title: 'Variable Recovery Predictability',
    text: `Your responses suggest that recovery may feel variable at the moment.

This can look like some days feeling fine, while others feel unexpectedly flat, heavy, or slow to bounce back from.

Variability does not mean recovery is failing. It indicates that recovery may currently be influenced by factors beyond training alone.`,
  },
  3: {
    title: 'Reduced Recovery Predictability',
    text: `Your responses suggest reduced recovery predictability right now.

When recovery becomes less reliable, the body may temporarily prioritise stability over change. This can slow visible progress without stopping adaptation entirely.

This snapshot observes recovery in context. It does not assess quality in isolation or imply a need for immediate action.`,
  },
}

export const RILS_BLOCKS: Record<1 | 2 | 3, { title: string; text: string }> = {
  1: {
    title: 'Low Regulation Demand',
    text: `Your responses suggest that regulation demands are not currently standing out as a primary stress signal.

This does not mean stress is absent. It indicates that mental and emotional load may not be significantly constraining capacity right now.`,
  },
  2: {
    title: 'Moderate Regulation Demand',
    text: `Your responses suggest moderate regulation demand at the moment.

This can include mental load, expectations, or the ongoing effort of managing multiple priorities.

Inside Body Recode™, these are treated as real stress variables, even when they are not obvious or dramatic.`,
  },
  3: {
    title: 'Elevated Regulation Demand',
    text: `Your responses suggest elevated regulation demand right now.

Regulation includes mental load, emotional pressure, and the cost of trying to get it right.

These demands consume capacity even when training effort remains consistent.

This snapshot exists to reduce self-blame. Elevated regulation demand reflects system load, not personal weakness.`,
  },
}

// Fixed report sections — identical for all reports
export const FIXED_SECTIONS = {
  openingFrame: `This report reflects patterns observed from your completed Performance Check-In.

Rather than measuring effort, discipline, or willpower, it looks at how your system is currently organising itself. How it distributes load, how reliably it recovers, and how consistent things feel across different parts of your life.

Most people are surprised by how accurately these patterns reflect what they have been experiencing beneath the surface. Not in a dramatic way, but in a quiet way that brings clarity.

This is not about judgement. It is about visibility.`,

  howToRead: `This report is not a diagnosis, and it is not a performance score.

It describes tendencies, not traits. Patterns, not labels. It reflects how things are organising right now, not who you are or what you are capable of.

Patterns shift. They respond to context, demand, recovery, stress, identity pressure, and environment. What you see here is a snapshot of alignment at a particular moment in time.

Read it with curiosity, not criticism.`,

  stabilityNote: `Patterns reflect tendencies over time, not permanent states.

They emerge when certain demands are repeated and certain forms of recovery are inconsistent. When those inputs change, patterns change.

For many people, simply seeing their pattern clearly reduces confusion and provides language for experiences that previously felt vague or frustrating.

Clarity often precedes change, even when no action is taken immediately.`,

  agencyReminder: `You are not required to act on this information.

Some people read their report and feel satisfied simply understanding what has been happening beneath the surface. Others use it as a starting point for deeper exploration.

There is no expectation built into this report. It is yours to interpret, reflect on, or set aside.`,

  exploringFurther: `For some people, the report brings enough clarity on its own.

For others, the real value emerges in conversation.

Patterns described on paper are informative. Patterns discussed in context become practical. They connect to your training decisions, recovery rhythms, expectations, and long-term direction.

If you choose to explore this further, the conversation is where these patterns are translated into something specific to you. It does not commit you to anything. It deepens understanding.

If that feels useful, you can request a conversation.`,

  structuralClarification: `This report reflects a structured interpretation of self-reported patterns at a single point in time.

It is not medical advice, diagnosis, or treatment, and it is not a substitute for consultation with a qualified health professional where appropriate.

Its purpose is to provide clarity around training load, recovery rhythm, and stress tendencies within the context of performance coaching.`,
}

// Deterministic block selection from quiz answers
// Questions scored 0 (lowest load) to 3 (highest load)
export function selectBlocks(answers: Record<string, number>): {
  slsLevel: 1 | 2 | 3
  rpsLevel: 1 | 2 | 3
  rilsLevel: 1 | 2 | 3
} {
  const get = (k: string) => answers[k] ?? 0

  // SLS: overall training and external load signals
  const slsAvg =
    (get('effort_vs_result') +
      get('training_response') +
      get('body_signals') +
      get('external_load') +
      get('consistency') +
      get('planning_vs_reality') +
      get('week_variability')) /
    7

  // RPS: recovery predictability signals
  const rpsAvg = (get('recovery_predictability') + get('training_response') + get('body_signals')) / 3

  // RILS: regulation and identity load signals
  const rilsAvg = (get('adjustments') + get('support') + get('external_load')) / 3

  const level = (avg: number): 1 | 2 | 3 => (avg < 1 ? 1 : avg < 2 ? 2 : 3)

  return {
    slsLevel: level(slsAvg),
    rpsLevel: level(rpsAvg),
    rilsLevel: level(rilsAvg),
  }
}

// Determine overall signal pattern label for coaching use
export function getSignalPattern(totalScore: number, max: number): string {
  const pct = totalScore / max
  if (pct >= 0.55) return 'Remediation'
  if (pct >= 0.25) return 'Optimisation'
  return 'Post-Optimisation'
}
