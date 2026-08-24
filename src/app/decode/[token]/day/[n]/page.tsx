import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'
import { PORTAL_ACCESS_STATUSES } from '@/lib/challenge-access'
import { logPortalVisit } from '@/lib/challenge-portal-visit'
import { typeFatMapProfile } from '@/lib/fat-map-profile'
import {
  DECODE_DAYS,
  currentDecodeDay,
  isDayUnlocked,
  patternBlockFor,
  patternKeyForProfile,
  type DecodeDayNumber,
} from '@/lib/decode-days'
import { DECODE_LESSON_VIDEOS, DECODE_READ_VIDEO } from '@/lib/video-urls'
import DecodeExplainer from '../../../decode-explainer'
import { Nav } from '@/components/landing/kit'
import { logoUrl, brand, coach } from '@/config/tenant'
import { DecodeFeedbackCard } from '../../decode-feedback-card'

const BLUE = '#1B6DFC'
const INK = '#1A1A1A'
const MUTED = '#6B6B6B'

/**
 * One day of The Body Decode.
 *
 * Amanda's lesson on top, then the part of her read it covers, drawn from
 * CHECKIN_PATTERNS. The video is universal and the text is hers, which is why
 * this is five videos rather than twenty.
 *
 * Under option B (Kade, 24 Aug 2026) this page shows nothing she cannot already
 * read in full at /decode/[token]/read. The day gate paces the LESSONS, never
 * the read. Repeating the section here is deliberate: she should not have to
 * hold the document in her head while watching someone talk about it.
 */
export default async function DecodeDayPage({
  params,
}: {
  params: Promise<{ token: string; n: string }>
}) {
  const { token, n } = await params
  const dayNumber = Number(n)
  const day = DECODE_DAYS.find(d => d.day === dayNumber)
  if (!day) notFound()

  const admin = createAdminClient()
  const { data: enrollment } = await admin
    .from('challenge_enrollments')
    .select('id, lead_id, enrolled_at, status, leads(name, scorecard_profile, scorecard_body_state, scorecard_section_scores, biological_sex, age_band, fat_storage, cycle_status, storage_direction)')
    .eq('token', token)
    .in('status', PORTAL_ACCESS_STATUSES)
    .single()

  if (!enrollment) notFound()

  const currentDay = currentDecodeDay(enrollment.enrolled_at)

  // Paces the LESSONS, not the read. Her full read is open at
  // /decode/[token]/read from the moment she finishes the questions and this gate must never be extended to
  // cover it - see the header comment on that page for why.
  //
  // Kept server-side because a day URL is guessable and the hub only renders
  // links for days that have arrived, so hiding the link is not a control.
  if (!isDayUnlocked(day.day as DecodeDayNumber, currentDay)) {
    redirect(`/decode/${token}`)
  }

  const lead = Array.isArray(enrollment.leads) ? enrollment.leads[0] : enrollment.leads
  const scores = (lead?.scorecard_section_scores ?? null) as Record<string, number> | null
  const bodyState = lead?.scorecard_body_state ?? null

  let profile: string | null = lead?.scorecard_profile ?? null
  if (!profile && bodyState && scores) {
    profile = typeFatMapProfile(
      scores as Record<'01' | '02' | '03' | '04' | '05', number>,
      bodyState as 'Depleted State' | 'Transitioning State' | 'Ready State',
      {
        sex: lead?.biological_sex ?? undefined,
        ageBand: lead?.age_band ?? undefined,
        fatStorage: lead?.fat_storage ?? undefined,
        cycleStatus: lead?.cycle_status ?? undefined,
        storageDirection: lead?.storage_direction ?? undefined,
      },
    ).profile
  }

  const patternKey = patternKeyForProfile(profile === 'Indeterminate' ? null : profile)
  const block = patternBlockFor(day, patternKey)
  const isFinalDay = day.day === DECODE_DAYS.length

  // Day 1 is the only day with no pattern block, because it reads her SCORES
  // rather than her pattern. Without this it was the thinnest page in the whole
  // product - a title, one line and a video - and it is the first lesson she
  // opens. Her own scores are the content, worst first.
  const SECTION_LABELS: Record<string, string> = {
    '01': 'Energy', '02': 'Sleep', '03': 'Stress load',
    '04': 'Training response', '05': 'Fat loss response',
  }
  const ordered = scores
    ? (['03', '02', '01', '05', '04'] as const)
        .filter(k => typeof scores[k] === 'number')
        .sort((a, b) => scores[a] - scores[b])
    : []
  const showScores = day.day === 1 && ordered.length > 0

  await logPortalVisit(enrollment.lead_id, enrollment.id, currentDay)

  return (
    <>
    <Nav logo={logoUrl()} brandName={brand().name} />
    <main style={{ maxWidth: '640px', margin: '0 auto', padding: '8px 24px 72px' }}>
      <Link href={`/decode/${token}`} style={{ fontSize: '13px', fontWeight: 700, color: BLUE, textDecoration: 'none' }}>
        ← All five days
      </Link>

      <p style={{ fontSize: '11px', fontWeight: 700, color: BLUE, letterSpacing: '0.12em', textTransform: 'uppercase', margin: '26px 0 10px' }}>
        {day.eyebrow}
      </p>
      <h1 style={{ fontSize: '30px', fontWeight: 800, color: INK, letterSpacing: '-0.025em', lineHeight: 1.15, margin: '0 0 12px' }}>
        {day.title}
      </h1>
      <p style={{ fontSize: '16px', color: '#4A4A4A', lineHeight: 1.7, margin: '0 0 28px' }}>
        {day.premise}
      </p>

      {/* Amanda's lesson. Not yet delivered, so the page renders without a
          player rather than with a broken one.

          The byline is the only thing that tells her who Amanda is. She met
          Kade on the landing page and has never seen this face before, so
          without it a stranger starts talking to her about her own report. */}
      <DecodeExplainer
        src={DECODE_LESSON_VIDEOS[day.day]}
        eyebrow={`Day ${day.day} · a few minutes`}
        title={day.title}
        byline={{ name: 'Amanda', role: 'Walking you through your report, one part a day' }}
      />

      {showScores && (
        <section style={{ background: '#FFFFFF', border: '1px solid #E5E5E5', borderRadius: '14px', padding: '24px 26px', marginTop: '24px' }}>
          <p style={{ fontSize: '11px', fontWeight: 700, color: BLUE, letterSpacing: '0.11em', textTransform: 'uppercase', margin: '0 0 16px' }}>
            Your five, worst first
          </p>
          <div style={{ display: 'grid', gap: '14px' }}>
            {ordered.map((k, i) => {
              const v = scores![k]
              const colour = v === 1 ? '#DC2626' : v === 2 ? '#B7791F' : '#1056D6'
              return (
                <div key={k}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '6px', gap: '10px' }}>
                    <span style={{ fontSize: '15px', fontWeight: 700, color: i < 2 ? colour : INK }}>
                      {SECTION_LABELS[k]}{i < 2 ? ' · one of your two lowest' : ''}
                    </span>
                    <span style={{ fontSize: '14px', fontWeight: 800, color: colour, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
                      {v} out of 3
                    </span>
                  </div>
                  <div style={{ height: '9px', background: '#ECEDEF', borderRadius: '99px', overflow: 'hidden' }}>
                    <div style={{ width: `${(v / 3) * 100}%`, height: '100%', background: colour, borderRadius: '99px' }} />
                  </div>
                </div>
              )
            })}
          </div>
          <p style={{ fontSize: '15px', color: '#4A4A4A', lineHeight: 1.72, margin: '22px 0 0' }}>
            Look at the bottom two. Those are the ones deciding whether anything you do turns into a result, and they are almost always the two nobody has ever measured.
          </p>
          <p style={{ fontSize: '15px', color: '#4A4A4A', lineHeight: 1.72, margin: '14px 0 0' }}>
            Now look at the top one. If it is training response, that is not good news. It means the thing you have been working hardest at is the thing that was least wrong, which is exactly why doing more of it has not paid off.
          </p>
        </section>
      )}

      {block && (
        <section style={{ background: '#FFFFFF', border: '1px solid #E5E5E5', borderRadius: '14px', padding: '24px 26px', marginTop: '24px' }}>
          <p style={{ fontSize: '11px', fontWeight: 700, color: BLUE, letterSpacing: '0.11em', textTransform: 'uppercase', margin: '0 0 16px' }}>
            {block.heading} · from your read
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: isFinalDay ? '16px' : '13px' }}>
            {block.paragraphs.map((para, i) => (
              isFinalDay ? (
                // Day 5 is the only numbered one. Its premise promises an order
                // ("start with the regulation ones, not the training one") and a
                // plain list showed none.
                <div key={i} style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                  <span style={{
                    width: '26px', height: '26px', borderRadius: '50%', flexShrink: 0, marginTop: '1px',
                    background: BLUE, color: '#FFFFFF', display: 'inline-flex',
                    alignItems: 'center', justifyContent: 'center',
                    fontSize: '12px', fontWeight: 900, fontVariantNumeric: 'tabular-nums',
                  }}>{i + 1}</span>
                  <p style={{ fontSize: '15px', color: '#3A3A3A', lineHeight: 1.72, margin: 0 }}>{para}</p>
                </div>
              ) : (
                <p key={i} style={{ fontSize: '15px', color: '#3A3A3A', lineHeight: 1.72, margin: 0 }}>
                  {para}
                </p>
              )
            ))}
          </div>
          {isFinalDay && (
            <p style={{ fontSize: '14px', color: MUTED, lineHeight: 1.65, margin: '18px 0 0', fontStyle: 'italic' }}>
              In that order. The first two look least like progress and they are what make the third one work.
            </p>
          )}
        </section>
      )}

      {!block && day.patternField && (
        // Pattern-keyed day, no pattern. Ready State, no section at the floor,
        // or "I am not sure" on direction of travel all land here.
        <section style={{ background: '#FAFAFA', border: '1px solid #E5E5E5', borderRadius: '14px', padding: '22px 24px', marginTop: '24px' }}>
          <p style={{ fontSize: '15px', color: '#4A4A4A', lineHeight: 1.7, margin: 0 }}>
            Your answers do not point cleanly at one of the four patterns, so there is no pattern-specific section here. That is a real result rather than a missing one, and it usually means the foundations are in better shape than the four compensation patterns describe.
          </p>
        </section>
      )}

      {!isFinalDay && (
        <p style={{ margin: '20px 0 0' }}>
          <Link href={`/decode/${token}/read`} style={{ fontSize: '14px', fontWeight: 700, color: BLUE, textDecoration: 'none' }}>
            Read all five parts →
          </Link>
        </p>
      )}

      {isFinalDay && (
        <section style={{ marginTop: '32px' }}>
          <p style={{ fontSize: '11px', fontWeight: 700, color: BLUE, letterSpacing: '0.12em', textTransform: 'uppercase', margin: '0 0 10px' }}>
            Kade, to close
          </p>
          <DecodeExplainer
            src={DECODE_READ_VIDEO}
            eyebrow="Kade, to close"
            title="Where this leaves you"
            byline={{ name: coach().fullName, role: coach().credentials }}
          />

          <div style={{ background: '#FFFFFF', border: `1.5px solid ${BLUE}`, borderRadius: '14px', padding: '24px 26px', marginTop: '22px' }}>
            <p style={{ fontSize: '11px', fontWeight: 800, color: BLUE, letterSpacing: '0.12em', textTransform: 'uppercase', margin: '0 0 10px' }}>
              If you want to do something about it
            </p>
            <p style={{ fontSize: '19px', fontWeight: 800, color: INK, letterSpacing: '-0.015em', margin: '0 0 10px' }}>
              Knowing your pattern and correcting it are two different jobs.
            </p>
            <p style={{ fontSize: '15px', color: '#4A4A4A', lineHeight: 1.7, margin: '0 0 16px' }}>
              Your read tells you what is happening. It does not undo it, and that is the honest part. The 6-Week Blueprint is the other job: six weeks built around your pattern rather than the average, with the training and the eating set to it, a coaching note each week, and a check-in at week three to adjust.
            </p>
            <p style={{ fontSize: '15px', color: '#4A4A4A', lineHeight: 1.7, margin: '0 0 20px' }}>
              <strong style={{ color: INK }}>$97 AUD, one time.</strong> Not a subscription. Your portal opens the day you start.
            </p>
            <Link
              href="/blueprint"
              style={{
                display: 'block', padding: '17px', borderRadius: '12px', background: BLUE,
                color: '#FFFFFF', fontSize: '16px', fontWeight: 800, textAlign: 'center', textDecoration: 'none',
              }}
            >
              See the Blueprint · $97
            </Link>
          </div>

          {/* Satisfaction capture, AFTER the Blueprint card rather than before
              it. Asking her to rate us while the offer is still on screen reads
              as a condition of the offer, and it would depress the ask that
              actually matters commercially. */}
          <div style={{ marginTop: '22px' }}>
            <DecodeFeedbackCard
              moment="day5"
              challengeEnrollmentId={enrollment.id}
              leadId={enrollment.lead_id}
              firstName={lead?.name?.split(' ')[0] ?? null}
            />
          </div>

          <p style={{ margin: '26px 0 0', textAlign: 'center' }}>
            <Link href={`/decode/${token}/read`} style={{ fontSize: '14px', fontWeight: 700, color: BLUE, textDecoration: 'none' }}>
              Your read is still here, any time →
            </Link>
          </p>
        </section>
      )}
    </main>
    </>
  )
}
