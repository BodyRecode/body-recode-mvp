import GuideShell from '../guide-shell'

export default async function SleepGuide({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  return (
    <GuideShell
      token={token}
      eyebrow="Practical Guide · 01"
      title="Sleep hygiene"
      intro="The single biggest lever on recovery. Most clients underestimate how much variance in their results comes from how well they slept this week."
      sections={[
        {
          heading: 'Anchor wake time, not bedtime',
          body: <>
            <p>Pick a wake time you can hold seven days a week and stay within 30 minutes of it. Bedtime drifts. Wake time is the anchor your circadian rhythm needs.</p>
            <p>Yes, including weekends.</p>
          </>,
        },
        {
          heading: 'Light first thing',
          body: <>
            <p>Get outside within 20 minutes of waking, even on cloudy days. Five to ten minutes is enough. Outdoor light is 10-100x brighter than indoor light, even when it does not feel like it.</p>
            <p>This sets the cortisol curve for the rest of the day. High in the morning, low at night, which is what we want.</p>
          </>,
        },
        {
          heading: 'Cap caffeine at 2pm',
          body: <>
            <p>Caffeine has a half-life of around six hours. A 3pm coffee means a quarter of it is still in your system at 9pm. You may fall asleep, but the sleep is not as deep.</p>
            <p>If you train late afternoon and use caffeine for it, drop the dose. Half the caffeine, same protocol.</p>
          </>,
        },
        {
          heading: 'Cool, dark, quiet',
          body: <>
            <p>Aim for the room to feel slightly cool when you get in. Around 18°C is ideal for most people. Blackout curtains or an eye mask. White noise or earplugs if your environment is loud.</p>
            <p>If the room is too warm, your body cannot drop core temperature, which is what triggers deeper sleep stages.</p>
          </>,
        },
        {
          heading: 'Wind down',
          body: <>
            <p>The last 60 minutes before bed should feel different from the rest of the day. Lower the lights. Slower pace. No work email, no doom scrolling.</p>
            <p>You are signalling to your nervous system that it is safe to switch off. If the input is still high-stimulation, your body does not get the message.</p>
          </>,
        },
        {
          heading: 'When sleep is broken',
          body: <>
            <p>If you wake up in the night and cannot get back to sleep within 20 minutes, get out of bed and go somewhere dim. Read something physical (not a screen) until you feel sleepy, then return. This breaks the bed/awake association that worsens insomnia.</p>
            <p>One bad night is information, not a problem. Three in a row is signal worth flagging in your check-in.</p>
          </>,
        },
      ]}
      closing="Start with the wake time anchor and the morning light. Those two alone shift the whole picture for most people. Layer the rest in once those are stable."
    />
  )
}
