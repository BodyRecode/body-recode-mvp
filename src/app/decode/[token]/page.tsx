import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { PORTAL_ACCESS_STATUSES } from '@/lib/challenge-access'
import { logPortalVisit } from '@/lib/challenge-portal-visit'
import { typeFatMapProfile, leadDescriptor, type Profile } from '@/lib/fat-map-profile'
import { currentDecodeDay, patternKeyForProfile, DECODE_DAYS, isDayUnlocked, decodeDayOpensAt } from '@/lib/decode-days'
import DecodePortalClient from './decode-portal-client'

/**
 * The Body Decode portal hub.
 *
 * Deliberately a NEW route rather than a rewrite of /challenge/[token]. The
 * Challenge is live and has people mid-flight; cutting over is a routing
 * change once this is proven, not a big-bang edit to a running product.
 *
 * It reads the SAME `challenge_enrollments` rows. The enrolment shape (lead +
 * enrollment + token + wave) is identical for both products, so there is no new
 * table and no migration — only a different portal over the same record.
 */
export default async function DecodePortalPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const admin = createAdminClient()

  const { data: enrollment } = await admin
    .from('challenge_enrollments')
    .select('id, lead_id, enrolled_at, status, ascension_intent, leads(name, gender, scorecard_profile, scorecard_body_state, scorecard_section_scores, approach_response, biological_sex, age_band, fat_storage, cycle_status, storage_direction)')
    .eq('token', token)
    .in('status', PORTAL_ACCESS_STATUSES)
    .single()

  if (!enrollment) notFound()

  const lead = Array.isArray(enrollment.leads) ? enrollment.leads[0] : enrollment.leads
  const firstName = lead?.name?.split(' ')[0] ?? 'there'

  const scores = (lead?.scorecard_section_scores ?? null) as Record<string, number> | null
  const bodyState = lead?.scorecard_body_state ?? null

  // Has she actually been read yet? The five days are the explanation of a
  // result, so without one there is nothing to explain and the hub sends her to
  // the scorecard instead of showing her five locked cards about nothing.
  const hasRead =
    !!bodyState &&
    !!scores &&
    (['01', '02', '03', '04', '05'] as const).every(k => typeof scores[k] === 'number')

  // Prefer the stored profile, fall back to typing live.
  //
  // `scorecard_profile` is written at scorecard submit, but 61 leads have a body
  // state from before Fat Map typing existed and carry no profile at all. Typing
  // live from the signals we do hold recovers those rather than showing them a
  // pattern-less five days.
  let profile: string | null = lead?.scorecard_profile ?? null
  if (!profile && hasRead) {
    const typed = typeFatMapProfile(
      scores as Record<'01' | '02' | '03' | '04' | '05', number>,
      bodyState as 'Depleted State' | 'Transitioning State' | 'Ready State',
      {
        sex: lead?.biological_sex ?? undefined,
        ageBand: lead?.age_band ?? undefined,
        fatStorage: lead?.fat_storage ?? undefined,
        cycleStatus: lead?.cycle_status ?? undefined,
        storageDirection: lead?.storage_direction ?? undefined,
      },
    )
    profile = typed.profile
  }

  // 'Indeterminate' is a real outcome, not a failure: Ready State, no section at
  // the floor, or "I am not sure" on direction of travel all land here. Those
  // people still get all five days, just without the pattern block.
  const patternKey = patternKeyForProfile(profile === 'Indeterminate' ? null : profile)

  // What she has already answered, so the intake asks only what is missing.
  //
  // This replaced a link out to the public scorecard, which was a real leak:
  // she had just typed her name, email and phone into the signup form, and the
  // scorecard would have asked for all three again inside sixty seconds. It
  // takes no prefill params, so there was no way to carry them across. The
  // in-portal intake asks the same questions, already knows who she is from the
  // token, and skips anything on file.
  // The signup form asks biological sex and the enrol route writes it to
  // `leads.gender` as 'female' / 'male'. Everything downstream reads
  // `leads.biological_sex` as 'F' / 'M'. The two never met, so a fresh signup
  // arrived with known.sex = false and the intake asked her biological sex
  // AGAIN, about thirty seconds after she picked it on the form. Same class of
  // friction as the scorecard hop.
  //
  // 'prefer_not_to_say' maps to null on purpose: it is a real answer, but it
  // cannot key the two sex-gated patterns, so it must not masquerade as known.
  const sexFromGender = lead?.gender === 'female' ? 'F' : lead?.gender === 'male' ? 'M' : null
  const sex = (lead?.biological_sex ?? sexFromGender) as 'M' | 'F' | null
  const known = {
    scores: hasRead,
    sex: !!sex,
    age: !!lead?.age_band,
    storage: !!lead?.fat_storage,
    // Cycle and direction are female-only, so they are "known" for men by
    // definition rather than by having been answered.
    cycle: sex === 'M' || !!lead?.cycle_status,
    direction: sex === 'M' || !!lead?.storage_direction,
    approach: !!lead?.approach_response,
    // Asked nowhere else on the platform. Never assume it.
    ascensionIntent: !!enrollment.ascension_intent,
  }

  // Lead-facing wording, phase-aware for Estrogen-Shift. pattern.desc is the
  // coach-facing version and reads like a clinic letter.
  const plainDesc = profile && profile !== 'Indeterminate'
    ? leadDescriptor(profile as Profile, {
        sex: sex ?? undefined,
        ageBand: lead?.age_band ?? undefined,
        fatStorage: lead?.fat_storage ?? undefined,
        cycleStatus: lead?.cycle_status ?? undefined,
        storageDirection: lead?.storage_direction ?? undefined,
      })
    : null

  const currentDay = currentDecodeDay(enrollment.enrolled_at)

  // WHEN each locked day opens, computed HERE on the server rather than in the
  // client component. DecodePortalClient is still server-rendered first, so
  // doing this date maths there would render one label on the server and a
  // different one after hydration whenever the two straddle a boundary.
  //
  // "Not yet" was the whole label before this. The Challenge died because
  // people did not come back - 14 of the 15 who cleared every form were gone by
  // Day 14 - and a locked card that will not say WHEN gives her nothing to come
  // back for. Day N opens exactly (N-1) x 24h after she enrolled, per
  // currentDecodeDay, so these are the real times and not a guess.
  const startOfToday = new Date()
  startOfToday.setHours(0, 0, 0, 0)
  const unlockLabels: Record<number, string> = {}
  for (const d of DECODE_DAYS) {
    if (isDayUnlocked(d.day, currentDay)) continue
    // decodeDayOpensAt, NOT the arithmetic inlined here. The whole reason this
    // page and the emails drifted was two places each deciding for themselves
    // when a day begins.
    const opensAt = decodeDayOpensAt(enrollment.enrolled_at, d.day)
    const daysOut = Math.round((new Date(opensAt).setHours(0, 0, 0, 0) - startOfToday.getTime()) / 86_400_000)
    unlockLabels[d.day] =
      daysOut <= 0 ? 'Opens later today'
      : daysOut === 1 ? 'Opens tomorrow morning'
      : `Opens ${opensAt.toLocaleDateString('en-AU', { weekday: 'long', timeZone: 'Australia/Brisbane' })} morning`
  }

  // One row per enrolment per day. Without it "she ignored the lesson" and "she
  // never opened the portal" are indistinguishable, which is exactly what made
  // the Challenge's Day 1 to Day 14 leak invisible for two months.
  await logPortalVisit(enrollment.lead_id, enrollment.id, currentDay)

  return (
    <DecodePortalClient
      token={token}
      firstName={firstName}
      hasRead={hasRead}
      known={known}
      knownSex={sex === 'M' || sex === 'F' ? sex : null}
      bodyState={bodyState}
      sectionScores={scores}
      profile={profile}
      patternKey={patternKey}
      plainDesc={plainDesc}
      currentDay={currentDay}
      unlockLabels={unlockLabels}
    />
  )
}
