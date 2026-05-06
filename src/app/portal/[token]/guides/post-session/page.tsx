import GuideShell from '../guide-shell'

export default async function PostSessionGuide({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  return (
    <GuideShell
      token={token}
      eyebrow="Practical Guide · 04"
      title="Post-session recovery"
      intro="The hour after training matters more than most clients realise. This is when adaptation begins or fails. Treat it as part of the session, not a thing you do once you are home."
      sections={[
        {
          heading: 'Cool down on purpose',
          body: <>
            <p>Five to ten minutes of low-intensity walking or cycling immediately after the working sets. Easy enough to hold a conversation.</p>
            <p>This brings your heart rate down, clears metabolic by-products, and signals to your nervous system that the work is over. Going from full-intensity to standing still keeps you in a sympathetic state for far longer.</p>
          </>,
        },
        {
          heading: 'Eat within 60-90 minutes',
          body: <>
            <p>A meal containing protein and carbohydrates within an hour or so of finishing. Does not have to be a shake. A normal meal works.</p>
            <p>The exact macros matter less than people are told. What matters is that the meal is real food, eaten in the recovery window, not skipped because you are busy.</p>
          </>,
        },
        {
          heading: 'Hydrate',
          body: <>
            <p>Replace fluid losses. Most people undershoot. A glass or two of water with electrolytes within 30 minutes of finishing, then keep drinking through the day.</p>
            <p>If your urine is darker than pale straw the next morning, you under-hydrated yesterday. Adjust upward.</p>
          </>,
        },
        {
          heading: 'Down-regulate before re-engaging',
          body: <>
            <p>Do not go straight from training back into work or stressful tasks. Even five minutes of slow breathing or sitting still in the changeroom helps.</p>
            <p>Skipping this keeps your nervous system in performance mode all day. Then sleep that night is shallower because you never came down.</p>
          </>,
        },
        {
          heading: 'Soreness vs damage',
          body: <>
            <p>Mild to moderate soreness for 24-48 hours after a hard session is normal. Sharp pain, joint pain, or pain that gets worse rather than better is signal worth flagging.</p>
            <p>Note it in your check-in. We do not push through structural pain. We adjust.</p>
          </>,
        },
        {
          heading: 'Sleep hygiene matters more after hard sessions',
          body: <>
            <p>The biggest drivers of recovery happen during deep sleep. Hard training sessions raise core body temperature and cortisol, both of which make sleep harder. Cool room. Dim lights. No screens for the last 30 minutes.</p>
            <p>If you trained hard and slept badly, your body did not recover. Two of those in a row and the next session needs to come down a notch.</p>
          </>,
        },
      ]}
      closing="The session ends when recovery starts, not when you walk out of the gym. Treat the hour after as part of the work."
    />
  )
}
