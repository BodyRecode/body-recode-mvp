import GuideShell from '../guide-shell'

export default async function StressGuide({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  return (
    <GuideShell
      token={token}
      eyebrow="Practical Guide · 02"
      title="Stress regulation"
      intro="Short practices to bring your nervous system back into a workable state. None of these are about fixing the source of stress. They are about giving your body a moment to reset so the rest of your day or your training is not run from a sympathetic state."
      sections={[
        {
          heading: 'Box breathing (4-4-4-4)',
          body: <>
            <p>Inhale for four. Hold for four. Exhale for four. Hold for four. Repeat for four to six rounds.</p>
            <p>The hold after the exhale is what matters most. It teaches your body that it is safe to slow down. Use this before any high-pressure situation: a difficult conversation, a hard set, a check-in you have been avoiding.</p>
          </>,
        },
        {
          heading: 'Physiological sigh',
          body: <>
            <p>Two short inhales through the nose (the second smaller than the first), then a long slow exhale through the mouth. Repeat three to five times.</p>
            <p>This is the fastest evidence-based way to drop sympathetic activation. Useful in the moment, especially mid-day when you can feel the load stacking.</p>
          </>,
        },
        {
          heading: 'Walks without inputs',
          body: <>
            <p>Twenty minutes outside, no phone, no podcast. Just walking. Boring on purpose.</p>
            <p>Most stress regulation work fails because it is another input. Walking without inputs is the rare time your brain has space to process. It is not optional. It is recovery.</p>
          </>,
        },
        {
          heading: 'Cold exposure (used carefully)',
          body: <>
            <p>Two to three minutes in a cool shower at the end of your normal shower. Not ice baths. Not for stress regulation, but for recovery from the regulation work itself.</p>
            <p>Caveat: if your stress is already chronic and your foundations are shaky, leave cold exposure alone. It is another stressor. Add it back when your sleep and energy are sitting at 3/3.</p>
          </>,
        },
        {
          heading: 'Vagal practices',
          body: <>
            <p>Humming, gargling, slow exhalations. Anything that engages the vagus nerve helps reset autonomic tone.</p>
            <p>Sounds odd. Works.</p>
          </>,
        },
        {
          heading: 'When stress is structural',
          body: <>
            <p>If your stress is structural (work, family, finances), no breathing protocol fixes it. The protocol is for managing the body while the structure gets addressed.</p>
            <p>Flag this in your check-in. We adjust your training and nutrition to match what your body can actually absorb during the period rather than push against it.</p>
          </>,
        },
      ]}
      closing="Pick one practice and do it daily for two weeks before adding another. Consistency on one beats inconsistency across five."
    />
  )
}
