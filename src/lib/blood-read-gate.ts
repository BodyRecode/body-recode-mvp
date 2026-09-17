/**
 * Client-facing Blood Panel Read: paused 17 September 2026.
 *
 * WHY: regulatory desk research (BR Regulatory chat G1a, 16 Sep) found that
 * explaining what a client's blood results mean is the clearest way to fall
 * outside item 14C of the Therapeutic Goods (Excluded Goods) Determination
 * 2018, the only medical-device exclusion Body Recode plausibly sits in. The
 * exclusion is lost where software provides "information to the consumer that
 * would generally be accepted to require the interpretation of a health
 * professional", and the TGA's own illustration of that is a consumer being
 * unable to "interpret the implications of having certain levels of
 * inflammatory markers in their blood". Verified against the Determination and
 * the TGA guidance on 16 Sep; see
 * 00_PLAYBOOK/research_briefs/2026-09-16_G1a_VERIFICATION_note.md.
 *
 * WHAT IS PAUSED: generating a new client-facing Blood Panel Read, and
 * publishing one to the portal. Nothing else.
 *
 * WHAT STILL RUNS: marker extraction against the lab's own reference ranges,
 * the neutral "raise this with your GP" flags, the coach-facing analysis and
 * research lens, and the panel feeding the CFFS, readings and plans once the
 * coach approves it.
 *
 * ALREADY PUBLISHED reads are untouched, and unpublishing still works.
 *
 * TO SWITCH BACK ON: set NEXT_PUBLIC_ENABLE_CLIENT_BLOOD_READ=true (Vercel env
 * + .env.local). One line, no code change. Do that once the lawyer has ruled on
 * device status.
 */
export const CLIENT_BLOOD_READ_ENABLED =
  process.env.NEXT_PUBLIC_ENABLE_CLIENT_BLOOD_READ === 'true'

export const CLIENT_BLOOD_READ_PAUSED_MESSAGE =
  'The client-facing blood read is paused pending legal advice on medical device status. The coach analysis, the GP flags and the panel feeding her plan all still work.'
