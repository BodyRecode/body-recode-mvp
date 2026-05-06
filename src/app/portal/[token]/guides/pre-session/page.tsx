import GuideShell from '../guide-shell'

export default async function PreSessionGuide({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  return (
    <GuideShell
      token={token}
      eyebrow="Practical Guide · 03"
      title="Pre-session prep"
      intro="What to do in the 30-60 minutes before training so you walk in ready, not scattered. The session you do is shaped by what you bring to it."
      sections={[
        {
          heading: 'Eat enough, not too much',
          body: <>
            <p>If you have not eaten in 4+ hours before the session, you will be running on fumes. A small carb-and-protein snack 60-90 minutes out is usually enough. Banana and a handful of nuts. A piece of toast with eggs. A protein shake with a piece of fruit.</p>
            <p>Avoid anything heavy or high-fat in the hour before. Slows digestion, makes you sluggish.</p>
          </>,
        },
        {
          heading: 'Hydrate intentionally',
          body: <>
            <p>500ml of water in the hour before. Add a pinch of salt or an electrolyte tab if you sweat heavily or train fasted in the morning.</p>
            <p>Dehydration before training drops performance more than people realise. You feel flat, your loads feel heavier, your output is lower.</p>
          </>,
        },
        {
          heading: 'Move before you train',
          body: <>
            <p>Do not arrive cold. Walk for five minutes. Take the stairs. Cycle in.</p>
            <p>Joints and tissue need to be warm before you ask them to perform. The warm-up at the start of the session is not the warm-up. Your warm-up starts at the door.</p>
          </>,
        },
        {
          heading: 'Mental shift',
          body: <>
            <p>The 10 minutes before walking in is when most people throw the session away. Last work email. Final scroll. Phone call from your partner.</p>
            <p>Treat the doorway as a transition. Phone away. Headphones in if it helps. The next hour is yours.</p>
          </>,
        },
        {
          heading: 'Honest readiness check',
          body: <>
            <p>Quick scan as you walk in. Sleep last night? Stress today? Food in the system? Any niggles?</p>
            <p>This is not so you can decide whether to skip. It is so your coach (and you) calibrate intensity. Some sessions are meant to be 8/10. Some are meant to be 5/10. The check matters more than the score.</p>
          </>,
        },
        {
          heading: 'Caffeine, used not abused',
          body: <>
            <p>If you use caffeine before training, 100-200mg in the 30-45 minutes before is enough. More just makes you wired without being more useful.</p>
            <p>If you train within four hours of bedtime, drop caffeine for that session. Sleep loss costs you more than the caffeine helps.</p>
          </>,
        },
      ]}
      closing="The fastest way to improve your sessions is to fix what happens in the hour before them. The work in the gym builds on the prep before it."
    />
  )
}
