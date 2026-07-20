/**
 * Daily Routine LLM prompt builder.
 *
 * Composes system + user messages for the Body Recode Daily Sequences
 * generator (Morning Reset + Evening Rhythm). Reads the client's intake,
 * body state, medications, health flags, training schedule, and returns
 * a JSON-shaped routine tailored to that person's data.
 *
 * Doctrine: routines are foundation-layer anchor practices. They are NOT
 * training, nutrition, or recovery protocols — those live on their own
 * portal surfaces. Routines are the two short daily sequences that hold
 * baseline. Supplement steps stay generic (substance + timing) until the
 * coach's tier-branded stack is wired in.
 */

export interface DailyRoutineClientData {
  name: string
  gender: 'male' | 'female' | 'other' | null
  age: number | null
  body_state: 'remediation' | 'optimisation' | 'post_optimisation' | null
  hormonal_load: 'none' | 'trt' | 'supraphysiological'
  training_days_per_week: number | null
  medications_summary: string | null
  health_flags: string[]
  intake_highlights: {
    primary_goal: string | null
    sleep_quality: string | null
    stress_level: string | null
    work_schedule: string | null
    current_morning_habits: string | null
    current_evening_habits: string | null
  }
  latest_signals: {
    energy: string | null
    mood: string | null
    sleep: string | null
    date: string | null
  } | null
}

export function buildDailyRoutineSystemPrompt(): string {
  return `You are the Body Recode Daily Sequences generator. You write two short, personal daily anchor routines for a coaching client — a Morning Reset Sequence and an Evening Rhythm Sequence — based on their data.

═══════════════════════════════════════
WHAT DAILY SEQUENCES ARE
═══════════════════════════════════════

Daily Sequences are anchor practices. Every client does them every day. They exist to:
- Regulate the nervous system at the start and end of the day
- Anchor circadian rhythm (light, temperature, movement, meals)
- Build a reliable baseline that holds everything else together

They are NOT:
- Training programs (that lives on the Training surface)
- Nutrition plans (that lives on the Nutrition surface)
- Recovery / regulation protocols like sauna, contrast, extended cold plunge, red light (that lives on Recovery)
- Supplement stacks with specific brands and doses (that lives on the Supplement surface)

Do not include steps that belong on those other surfaces.

═══════════════════════════════════════
BODY RECODE VOICE
═══════════════════════════════════════

- Plain, warm, direct. Talk to the client by their first name in the coach note.
- Never preachy. Never wellness-industry jargon ("holistic", "mindful", "intention", "manifesting").
- Contractions are fine. Short sentences are fine.
- No em dashes — use hyphens or rewrite.
- Never lecture the client. State what to do and why in one line.
- The coach (Kade Dunstone, Sport & Exercise Scientist) is on their team, not above them.

═══════════════════════════════════════
SAFETY GATES (NON-NEGOTIABLE)
═══════════════════════════════════════

**Cold exposure**
- Face immersion: only for body_state = optimisation or post_optimisation, age < 60, no cardiac flag. Cap at 20 seconds per round, 3-5 rounds.
- Cold shower: cap at 3 minutes fully cold. Skip entirely if cardiac flag, age > 60, or body_state = remediation.
- Never prescribe cold plunge in the daily sequences — that belongs to Recovery.

**Breathwork**
- Nasal breathing, slow diaphragmatic, box breathing (4-4-4-4), physiological sigh, 4-7-8 are fine.
- Never prescribe Wim Hof cycles or hyperventilation-style breathwork in the daily sequences (Recovery only, needs supervision).

**Supplements**
- Reference substances by generic name only (e.g. "electrolytes on waking", "magnesium glycinate 30 minutes before bed"). Never name a brand.
- If unsure whether a supp fits, leave it out.
- Never prescribe a Schedule 4 or Schedule 8 substance.

**Physical activity**
- Light movement / walking is fine.
- Do NOT prescribe strength training or high-intensity work — that belongs to the Training surface.

═══════════════════════════════════════
STRUCTURE
═══════════════════════════════════════

Each sequence has:
- title: short, e.g. "Morning Reset Sequence" or "Evening Rhythm Sequence" (keep these exact names — brand consistency with the Challenge product).
- tagline: one sentence, punchy. What the client gets if they do it.
- steps: 4 to 6 short imperative statements. One action per step. No sub-bullets.
- coach_note: 1-2 sentences from the coach speaking to this client by name, referencing their situation.

Additionally, at the top level of the JSON, include:
- rationale: 2-3 sentences of coach-facing reasoning. Why these specific steps for this specific client. This is not shown to the client — it is shown to the coach in the review UI. Reference their data (body state, medications, sleep quality, training load, etc).

═══════════════════════════════════════
OUTPUT FORMAT — STRICT JSON
═══════════════════════════════════════

Return ONLY a single JSON object with no prose before or after. Shape:

{
  "rationale": "Coach-facing 2-3 sentence explanation of why these steps fit this client's data.",
  "morning": {
    "title": "Morning Reset Sequence",
    "tagline": "One-line description.",
    "steps": ["Step 1", "Step 2", "Step 3", "Step 4", "Step 5"],
    "coach_note": "Personal note to the client using their first name."
  },
  "evening": {
    "title": "Evening Rhythm Sequence",
    "tagline": "One-line description.",
    "steps": ["Step 1", "Step 2", "Step 3", "Step 4", "Step 5"],
    "coach_note": "Personal note to the client using their first name."
  }
}`
}

export function buildDailyRoutineUserPrompt(data: DailyRoutineClientData): string {
  const parts: string[] = []

  parts.push(`CLIENT DATA — write the Morning Reset Sequence and Evening Rhythm Sequence for this specific person.`)
  parts.push('')
  parts.push(`Name: ${data.name}`)
  if (data.age !== null) parts.push(`Age: ${data.age}`)
  if (data.gender) parts.push(`Gender: ${data.gender}`)
  if (data.body_state) {
    const readable = { remediation: 'Depleted (remediation)', optimisation: 'Transitioning (optimisation)', post_optimisation: 'Ready (post-optimisation)' }[data.body_state]
    parts.push(`Body state: ${readable}`)
  }
  parts.push(`Hormonal load: ${data.hormonal_load}${data.hormonal_load === 'trt' ? ' (TRT — adjust context, do NOT prescribe hormones)' : ''}${data.hormonal_load === 'supraphysiological' ? ' (supraphysiological — advanced context)' : ''}`)
  if (data.training_days_per_week !== null) parts.push(`Training days per week: ${data.training_days_per_week}`)

  if (data.medications_summary) {
    parts.push('')
    parts.push(`Medications / hormonal context (verbatim from intake):`)
    parts.push(data.medications_summary)
  }

  if (data.health_flags.length > 0) {
    parts.push('')
    parts.push(`Health flags (safety-relevant): ${data.health_flags.join(', ')}`)
  }

  parts.push('')
  parts.push('Intake highlights:')
  const ih = data.intake_highlights
  if (ih.primary_goal) parts.push(`- Primary goal: ${ih.primary_goal}`)
  if (ih.sleep_quality) parts.push(`- Sleep quality: ${ih.sleep_quality}`)
  if (ih.stress_level) parts.push(`- Stress level: ${ih.stress_level}`)
  if (ih.work_schedule) parts.push(`- Work / schedule: ${ih.work_schedule}`)
  if (ih.current_morning_habits) parts.push(`- Current morning habits: ${ih.current_morning_habits}`)
  if (ih.current_evening_habits) parts.push(`- Current evening habits: ${ih.current_evening_habits}`)

  if (data.latest_signals) {
    parts.push('')
    parts.push(`Latest check-in signals (${data.latest_signals.date ?? 'recent'}):`)
    if (data.latest_signals.energy) parts.push(`- Energy: ${data.latest_signals.energy}`)
    if (data.latest_signals.mood) parts.push(`- Mood: ${data.latest_signals.mood}`)
    if (data.latest_signals.sleep) parts.push(`- Sleep: ${data.latest_signals.sleep}`)
  }

  parts.push('')
  parts.push('═══════════════════════════════════════')
  parts.push('YOUR TASK')
  parts.push('═══════════════════════════════════════')
  parts.push('')
  parts.push(`Write ${data.name}'s Morning Reset Sequence and Evening Rhythm Sequence. Reference their specific situation in the coach_note fields — do not write generic notes.`)
  parts.push('')
  parts.push('Return the JSON object only, no prose.')

  return parts.join('\n')
}
