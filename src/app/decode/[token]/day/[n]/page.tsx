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

  await logPortalVisit(enrollment.lead_id, enrollment.id, currentDay)

  return (
    <main style={{ maxWidth: '640px', margin: '0 auto', padding: '40px 24px 72px' }}>
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
          player rather than with a broken one. */}
      <VideoOrPlaceholder
        src={DECODE_LESSON_VIDEOS[day.day]}
        label={`Lesson ${day.day}`}
      />

      {block && (
        <section style={{ background: '#FFFFFF', border: '1px solid #E5E5E5', borderRadius: '14px', padding: '24px 26px', marginTop: '24px' }}>
          <p style={{ fontSize: '11px', fontWeight: 700, color: BLUE, letterSpacing: '0.11em', textTransform: 'uppercase', margin: '0 0 16px' }}>
            {block.heading} · from your read
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '13px' }}>
            {block.paragraphs.map((para, i) => (
              <p key={i} style={{ fontSize: '15px', color: '#3A3A3A', lineHeight: 1.72, margin: 0 }}>
                {para}
              </p>
            ))}
          </div>
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

      <p style={{ margin: '20px 0 0' }}>
        <Link href={`/decode/${token}/read`} style={{ fontSize: '14px', fontWeight: 700, color: BLUE, textDecoration: 'none' }}>
          Read the whole thing →
        </Link>
      </p>

      {isFinalDay && (
        <section style={{ marginTop: '32px' }}>
          <p style={{ fontSize: '11px', fontWeight: 700, color: BLUE, letterSpacing: '0.12em', textTransform: 'uppercase', margin: '0 0 10px' }}>
            Kade, to close
          </p>
          <VideoOrPlaceholder src={DECODE_READ_VIDEO} label="Kade, to close" />

          <div style={{ background: '#FFFFFF', border: `1.5px solid ${BLUE}`, borderRadius: '14px', padding: '24px 26px', marginTop: '22px' }}>
            <p style={{ fontSize: '18px', fontWeight: 800, color: INK, letterSpacing: '-0.015em', margin: '0 0 8px' }}>
              The report is the read. The next step is correction.
            </p>
            <p style={{ fontSize: '15px', color: '#4A4A4A', lineHeight: 1.7, margin: '0 0 20px' }}>
              Your read tells you what is happening. It does not undo it, and that is the honest part. The 6-Week Blueprint is six weeks shaped around your pattern, and it is where the correction happens.
            </p>
            <Link
              href="/blueprint"
              style={{
                display: 'block', padding: '17px', borderRadius: '12px', background: BLUE,
                color: '#FFFFFF', fontSize: '16px', fontWeight: 800, textAlign: 'center', textDecoration: 'none',
              }}
            >
              See the Blueprint
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
        </section>
      )}
    </main>
  )
}

/**
 * Renders the player when the file is there and a legible note when it is not.
 *
 * Amanda has not delivered the six Body Decode videos yet. A <video> pointing at
 * a missing object renders as a dead black box with no explanation, which reads
 * as a broken page rather than an unfinished one.
 */
function VideoOrPlaceholder({ src, label }: { src: string; label: string }) {
  return (
    <div style={{ background: '#F4F5F7', border: '1px solid #E5E5E5', borderRadius: '12px', overflow: 'hidden' }}>
      <video
        src={src}
        controls
        playsInline
        preload="metadata"
        style={{ width: '100%', display: 'block', background: '#000000' }}
      />
      <p style={{ fontSize: '12px', color: MUTED, margin: 0, padding: '10px 14px' }}>
        {label}
      </p>
    </div>
  )
}
