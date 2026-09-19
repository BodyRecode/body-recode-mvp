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
            {/* Rewritten 17 Sep 2026, research pass E1a (A4, A5). The old
                copy told everyone to add salt or an electrolyte tab, which has
                no support and works against the two in three Australian adults
                already over the sodium target, and it claimed dehydration costs
                more performance than people realise. The measured threshold is
                around 3 per cent of body mass (Savoie 2015), which an ordinary
                session does not reach if you drink when thirsty. */}
            <p>A glass or two of water in the hour or two before, so you start the session already topped up rather than catching up during it. Drink when you are thirsty, not to a number.</p>
            <p>You do not need salt or an electrolyte tab for a normal session. They start to matter when you are out for well over an hour, or sweating hard in heat, and even then food covers most of it.</p>
            <p>Arriving properly dehydrated does cost you, but it takes a lot more than a busy morning to get there. If you are thirsty, drink. If your urine is pale, you are fine.</p>
            {/* Heat and long-session block added 19 Sep 2026, research pass E1b
                section 5. Brisbane is hot or humid for most of the year and a
                lot of gyms here are not air-conditioned, so this is the case
                where fluid and sodium genuinely start to matter. */}
            <p className="mt-4"><strong>Hot or humid days, a gym without air conditioning, or a session over about 90 minutes.</strong> This is the one case where it changes:</p>
            <ul>
              <li>Have a drink with your pre-training meal so you start topped up.</li>
              <li>Drink to thirst through the session. Aim to finish no more than about 2 per cent lighter than you started, which is about 1.6 kg for an 80 kg person, and never heavier than you started.</li>
              <li>For more than an hour in the heat, a drink with roughly 500 to 700 mg of sodium per litre is worth it. Most sports drinks and a half-strength pharmacy rehydration sachet land in that range. Check the label.</li>
              <li>Afterwards, a meal with some salt in it plus fluids does the rest.</li>
              <li>In your first week or two of hot weather, pull the volume back a little while your body adapts. Your sweat gets less salty as it does.</li>
              <li>If you want your own numbers rather than a rule of thumb, weigh yourself before and after two or three similar sessions and tell your coach, or ask us about a sweat test with an accredited sports dietitian.</li>
            </ul>
            <p>If a doctor has set you a fluid or salt limit, theirs overrides all of this.</p>
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
