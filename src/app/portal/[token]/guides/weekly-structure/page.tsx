import GuideShell from '../guide-shell'

export default async function WeeklyStructureGuide({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  return (
    <GuideShell
      token={token}
      eyebrow="Practical Guide · 05"
      title="Weekly structure"
      intro="How to think about your week as a system. The work gets done across days, not in any single day. This guide is about the architecture of the week, not the contents of any one session."
      sections={[
        {
          heading: 'Anchor your training days',
          body: <>
            <p>Pick the days you train and protect them. They go in the calendar before anything else. Same days every week if possible.</p>
            <p>The variance most people experience in their results comes from inconsistent training cadence. A program that runs three sessions a week consistently for twelve weeks always beats a program that runs four sessions in good weeks and one in busy weeks.</p>
          </>,
        },
        {
          heading: 'Space recovery and demand',
          body: <>
            <p>Two hard sessions back-to-back is fine if recovery is good. Three back-to-back is a recipe for accumulated fatigue.</p>
            <p>Plan a recovery day or a low-intensity day between hard sessions where you can. Walk, mobility, easy cardio. The point of these days is not to do more. It is to absorb what you already did.</p>
          </>,
        },
        {
          heading: 'Sleep is non-negotiable',
          body: <>
            <p>Aim for 7-9 hours, anchored at the same wake time. Saturday and Sunday count.</p>
            <p>If you cannot get the hours during the week, the week is overcommitted. Something has to come out. Not your sleep.</p>
          </>,
        },
        {
          heading: 'Eating on a rhythm',
          body: <>
            <p>Three to four meals a day at roughly consistent times. Not because precise timing matters for fat loss (it does not, much), but because rhythm reduces decision load and stabilises energy.</p>
            <p>Skipping meals when busy is a signal your week is too full, not a sign you are disciplined.</p>
          </>,
        },
        {
          heading: 'Plan the friction-prone days',
          body: <>
            <p>Every week has one or two days where the system breaks. A long meeting day. A travel day. A day you pick the kids up.</p>
            <p>Do not pretend these days will go well. Plan for them. Lower-effort meals prepped in advance. A walk instead of a session. A short routine instead of a long one. Lower the bar for the day rather than miss the day entirely.</p>
          </>,
        },
        {
          heading: 'Reflect once a week',
          body: <>
            <p>Use your weekly check-in as the reflection point. Ten minutes. What worked. What did not. What you need to change next week.</p>
            <p>Without this, the patterns repeat. With it, you and your coach catch them before they accumulate.</p>
          </>,
        },
      ]}
      closing="A good week is not a perfect week. It is a week where the architecture held together even when the contents did not. Build for that."
    />
  )
}
