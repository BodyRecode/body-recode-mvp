/**
 * Dormant lead reactivation.
 *
 * Built 2026-08-12. 84 of 136 leads were sitting at "new check-in" having never
 * moved. They completed a scorecard, gave their details, and nothing was ever
 * sent to them. That is the largest pool in the business by a factor of ten and
 * it needs no new traffic to work.
 *
 * Three touches over ten days, then they go dormant and are left alone:
 *   1. Their read, written out properly. One reply-based CTA, nothing else.
 *   2. SMS four days later asking whether the pattern sounded right.
 *   3. The state-matched next step as a self-serve link, six days after that.
 *
 * The copy uses the APPROVED lead-facing language from the doctrine, not new
 * wording invented for this sequence: `BODY_STATE_LANGUAGE[state].interpretation`
 * and `leadDescriptor(profile, signals)`. If those change, this changes with
 * them, which is the point.
 */
import {
  darkEmailShell, emailLogo, emailEyebrow, emailHeading, emailDivider,
  emailBody, emailStatusCard, emailCta, emailUrlFallback,
} from '@/lib/email-shell'
import { darkEmailSignature } from '@/lib/email-signature'
import { leadDescriptor, type Profile, type StorageDirection } from '@/lib/fat-map-profile'
import { BODY_STATE_LANGUAGE } from '@/lib/companion-content'
import { brand } from '@/config/tenant'

export interface DormantLeadContext {
  firstName: string
  bodyState: string
  score: number | null
  /** Null or 'Indeterminate' means no pattern was named. */
  profile: string | null
  /** True when the scorecard read was low confidence. */
  provisional: boolean
  /** True if they have already been through the 14-Day Challenge. */
  didChallenge: boolean
  /**
   * Sets the Estrogen-Shift phase. Null for every one of the 84, because the
   * question did not exist when they answered, so they correctly get the
   * version that names no location.
   */
  storageDirection?: StorageDirection | null
}

function namedProfile(p: string | null): Profile | null {
  if (!p || p === 'Indeterminate') return null
  return p as Profile
}

/**
 * Touch 1. Their read, in full.
 *
 * Deliberately has no button. The only call to action is a line asking them to
 * reply, because a reply is a lower bar than a booking and it starts a
 * conversation rather than a funnel step.
 */
export function buildDormantReadEmail(ctx: DormantLeadContext): { subject: string; html: string } {
  const subject = `Your Body Recode read, ${ctx.firstName}`
  const state = BODY_STATE_LANGUAGE[ctx.bodyState] ?? BODY_STATE_LANGUAGE['Transitioning State']
  const profile = namedProfile(ctx.profile)
  const shortState = ctx.bodyState.replace(' State', '')

  const patternPara = profile
    ? `${ctx.provisional ? 'It also points toward' : 'It also puts you in'} what we call ${profile}. ${leadDescriptor(profile, { storageDirection: ctx.storageDirection ?? null })}${ctx.provisional ? ' I want to be straight that this part is provisional. A scorecard narrows it down, the full intake is what confirms it.' : ''}`
    : `Your answers did not point cleanly at one pattern, which happens and is useful information on its own. It usually means more than one thing is going on at once.`

  const html = darkEmailShell(`
${emailLogo()}
${emailEyebrow('Your readiness read')}
${emailHeading(`Here's what your scorecard actually said, ${ctx.firstName}.`)}
${emailDivider()}
${emailBody(`You did the Readiness Scorecard a while back and I never walked you through what it meant. That's on me, so here it is properly.`)}
${emailStatusCard({
    eyebrow: 'Your result',
    headline: ctx.score != null ? `${shortState} · ${ctx.score}/15` : shortState,
    body: profile
      ? `${profile}${ctx.provisional ? ' (provisional)' : ''}`
      : 'No single pattern stood out yet',
  })}
${emailBody(state.interpretation)}
${emailBody(patternPara)}
${emailBody(`The reason any of that matters is simple. The same training and the same food do opposite things to two different bodies. If the read is wrong, the plan is wrong, and no amount of effort fixes it. That's usually what's happened when someone has tried a lot of things and none of them stuck.`)}
${emailDivider()}
${emailBody(`If you want me to go through this properly with you, just reply to this email and I'll send you a time. No pitch, and nothing to prepare.`, { size: 15 })}
${darkEmailSignature()}
`, { previewText: `${shortState}${ctx.score != null ? ` · ${ctx.score}/15` : ''}${profile ? ` · ${profile}` : ''}` })

  return { subject, html }
}

/**
 * Touch 2, SMS four days later.
 *
 * One question, answerable in three words, asking for nothing. That is why it
 * gets replies. Falls back to the state when no pattern was named.
 */
export function buildDormantSms(ctx: DormantLeadContext): string {
  const profile = namedProfile(ctx.profile)
  const opener = `Hey ${ctx.firstName}, Kade from Body Recode.`

  // Only name the pattern if they were actually given one. Roughly half of them
  // were not, and "did the Transitioning bit sound right" asks about a word they
  // have never used about themselves. Ask about the read as a whole instead.
  const question = profile
    ? `Sent your read through the other day. Did the ${profile} bit sound right to you or not really?`
    : `Sent your scorecard read through the other day. Did it sound like you, or was it off?`

  return `${opener} ${question} Genuinely curious either way.`
}

/**
 * Touch 3. The state-matched next step, self-serve.
 *
 * Depleted goes to the free Challenge because a Depleted body has no capacity
 * for a heavier prescription yet, unless they have already done it, in which
 * case they go to the Blueprint. Transitioning goes to the Blueprint,
 * Ready goes to the Membership. Mapping per project_bodystate_stage_recommendation_mapping.
 */
export function buildDormantOfferEmail(ctx: DormantLeadContext): { subject: string; html: string } {
  const marketing = brand().marketingDomain
  const shortState = ctx.bodyState.replace(' State', '')

  let label: string, price: string, url: string, why: string, subject: string

  if (ctx.bodyState === 'Ready State') {
    label = 'the Membership'; price = '$49 a week'; url = `${marketing}/membership?from=dormant_reactivation`
    why = `Your foundations are in place. When results aren't happening from there it's the prescription, not the biology, and that's exactly what the Membership is for.`
    subject = `${ctx.firstName}, the next step from a Ready read`
  } else if (ctx.bodyState === 'Depleted State' && !ctx.didChallenge) {
    label = 'the 14-Day Body Decode Challenge'; price = 'free'; url = `${marketing}/challenge?from=dormant_reactivation`
    why = `A Depleted body doesn't need a heavier plan, it needs the load taken off first. Fourteen days, nothing to buy, and you'll know which pattern is running you at the end of it.`
    subject = `${ctx.firstName}, start here rather than pushing harder`
  } else {
    label = 'the 6-Week Blueprint'; price = '$97'; url = `${marketing}/blueprint?from=dormant_reactivation`
    why = `You've got capacity, it's just not showing up consistently. The Blueprint is the six weeks of structure that gets the bottleneck out of the way.`
    subject = `${ctx.firstName}, the six-week version`
  }

  const html = darkEmailShell(`
${emailLogo()}
${emailEyebrow('Where to go from here')}
${emailHeading(`Last one from me, ${ctx.firstName}.`)}
${emailDivider()}
${emailBody(`I sent your ${shortState} read through a couple of weeks ago. If it landed and you want to do something about it, this is the step I'd point you at.`)}
${emailStatusCard({ eyebrow: 'Recommended for a ' + shortState + ' read', headline: label, body: price })}
${emailBody(why)}
${emailCta({ href: url, label: `Take a look →` })}
${emailUrlFallback(url)}
${emailBody(`If it's not the right time, that's genuinely fine and I'll leave you be. The read is yours either way, and you can reply to any of these if you ever want to pick it up.`, { size: 14 })}
${darkEmailSignature()}
`, { previewText: `${label}, ${price}` })

  return { subject, html }
}
