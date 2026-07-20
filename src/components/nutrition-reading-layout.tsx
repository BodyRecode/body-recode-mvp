import ReadingHeroShell from './reading-hero-shell'

/**
 * Nutrition Reading layout.
 *
 * Used by:
 *   - /portal/[token]/my-plan/reading  (full-screen client view)
 *
 * Migrated 2026-07-20 from a bespoke cream-narrow-column editorial layout to
 * the shared dark-hero editorial shell (ReadingHeroShell). Same visual grammar
 * as Foundational / Program / Trajectory readings.
 */

export interface NutritionReadingData {
  nr_why_this_plan: string | null
  nr_what_this_nutrition_is_doing: string | null
  nr_how_well_know_its_working: string | null
  nr_what_were_not_doing_yet: string | null
  nr_coach_note: string | null
  plan_name: string
  entry_state: string | null
  pts_phase: string | null
  generated_at: string
  nutrition_reading_published_at: string | null
}

export interface NutritionReadingClientMeta {
  name: string
}

function titleise(value: string | null): string {
  if (!value) return ''
  return value.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

export default function NutritionReadingLayout({
  reading,
  client,
}: {
  reading: NutritionReadingData
  client: NutritionReadingClientMeta
}) {
  const pill = [titleise(reading.entry_state), reading.pts_phase].filter(Boolean).join(' · ') || null

  return (
    <ReadingHeroShell
      eyebrow="Nutrition Reading"
      heroTitle={reading.plan_name}
      heroSub="Why this plan, what it is doing, and how we will read it as it unfolds. The bridge from your Foundational Reading to the meals on your plate."
      pill={pill}
      clientName={client.name}
      aboutText={
        <p>
          <b>About this reading.</b> Every plan is built from where your body currently is, not from a generic template. This reading explains what we are trying to support with food right now, what the plan will ask of your body, and what we are deliberately not chasing yet. Read it once before your first meal of the week. It frames everything that follows.
        </p>
      }
      sections={[
        { key: 'nr_why_this_plan',                label: 'Why this plan',                icon: 'target', content: reading.nr_why_this_plan },
        { key: 'nr_what_this_nutrition_is_doing', label: 'What this nutrition is doing', icon: 'meal',   content: reading.nr_what_this_nutrition_is_doing },
        { key: 'nr_how_well_know_its_working',    label: 'How we will know it is working', icon: 'compass', content: reading.nr_how_well_know_its_working },
        { key: 'nr_what_were_not_doing_yet',      label: 'What we are not doing yet',      icon: 'hold',   content: reading.nr_what_were_not_doing_yet },
      ]}
      coachNote={{ content: reading.nr_coach_note }}
    />
  )
}
