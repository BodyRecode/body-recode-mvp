// Sales copy for each bolt-on pack, keyed by digital_asset_metadata.slug.
//
// Lives next to the bolt-on store route. As more packs ship, add an entry
// per slug. When the inventory grows past ~8 packs this should move into a
// `digital_asset_ad_copy` table or a markdown registry.
//
// Image convention: covers live in the SAME bucket folder as the PDF, with
// the suffix "-cover.png". E.g. protocols/sleep-reset-v1.pdf →
// protocols/sleep-reset-v1-cover.png. The detail page server-side-signs
// the cover when it renders.

export type BoltOnAdCopy = {
  tagline: string                  // one-line index tagline (under the card title)
  hero_headline: string            // detail page hero — the promise
  hero_sub: string                 // detail page hero sub
  who_its_for: string[]            // 3-5 bullets describing the symptom set
  whats_inside: string[]           // 3-6 bullets describing the contents
  format: { label: string; value: string }[]   // bottom card: pages, format, etc
  cover_path: string               // Storage path inside library-assets bucket
}

export const BOLT_ON_AD_COPY: Record<string, BoltOnAdCopy> = {
  'sleep-reset': {
    tagline: 'A seven-day intervention to restore sleep when it has drifted.',
    hero_headline: 'Your training is only as good as the sleep underneath it.',
    hero_sub: 'When sleep degrades the rest of the protocol underperforms. Output drops, hunger gets volatile, mood baseline sags, body composition stalls. This is the seven-day reset to bring sleep architecture back online.',
    who_its_for: [
      'Sleep onset is creeping past 30 minutes most nights.',
      'You wake at 3am and cannot get back down cleanly.',
      'Mornings have gone from sharp to slow over the last few weeks.',
      'Training output has dropped without a clear training-load reason.',
      'A travel block, work-stress stretch, or alcohol uptick recently disrupted your rhythm.',
    ],
    whats_inside: [
      'The two failure modes of sleep (onset vs maintenance) and how to know which one you have.',
      'The seven-day protocol, day by day, hour by hour. Wake window, light, caffeine cutoff, training timing, last meal, screens, room, bedtime.',
      'The five drift patterns (work-stress, training-too-late, alcohol, travel, screens) and the specific fix for each.',
      'A three-number daily tracking sheet so you can see the trend across the seven days.',
      'What to keep after Day 7 (and when to re-run the reset).',
    ],
    format: [
      { label: 'Format', value: '~10-page PDF' },
      { label: 'Time to read', value: '15 minutes' },
      { label: 'Duration to run', value: '7 days' },
      { label: 'Delivery', value: 'Instant - inbox + library' },
    ],
    cover_path: 'protocols/sleep-reset-v1-cover.png',
  },
}
