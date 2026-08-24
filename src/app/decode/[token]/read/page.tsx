import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'
import { PORTAL_ACCESS_STATUSES } from '@/lib/challenge-access'
import { logPortalVisit } from '@/lib/challenge-portal-visit'
import { typeFatMapProfile } from '@/lib/fat-map-profile'
import { CHECKIN_PATTERNS } from '@/lib/checkin-patterns'
import { currentDecodeDay, patternKeyForProfile } from '@/lib/decode-days'
import { DecodeFeedbackCard } from '../decode-feedback-card'

const BLUE = '#1B6DFC'
const INK = '#1A1A1A'
const MUTED = '#6B6B6B'

const SECTION_LABELS: Record<'01' | '02' | '03' | '04' | '05', string> = {
  '01': 'Energy',
  '02': 'Sleep',
  '03': 'Stress load',
  '04': 'Training response',
  '05': 'Fat loss response',
}

/**
 * Her full read. NEVER GATED.
 *
 * This page is the whole point of option B, chosen by Kade 24 Aug 2026.
 *
 * The alternative on the table was to name her pattern the moment she finishes the questions and let
 * the five days release the explanation a part at a time. That was rejected,
 * and rightly: it is the same shape as the $37 report we had just retired for
 * selling her something she was about to be handed, only one layer in. Pacing
 * something she has already earned is still holding it back.
 *
 * So the read is complete and open from the moment she finishes the questions. The five days are Amanda
 * walking her through it, not unlocking it, because nobody absorbs a document
 * this long in one sitting. The lessons pace; the read does not.
 *
 * Practical consequence worth keeping: never add an unlock check here. If a
 * future change needs part of this hidden, that is a product decision to take
 * back to the option A / option B fork, not a condition to slip into this file.
 */
export default async function DecodeReadPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const admin = createAdminClient()

  const { data: enrollment } = await admin
    .from('challenge_enrollments')
    .select('id, lead_id, enrolled_at, status, leads(name, scorecard_profile, scorecard_body_state, scorecard_section_scores, biological_sex, age_band, fat_storage, cycle_status, storage_direction)')
    .eq('token', token)
    .in('status', PORTAL_ACCESS_STATUSES)
    .single()

  if (!enrollment) notFound()

  const lead = Array.isArray(enrollment.leads) ? enrollment.leads[0] : enrollment.leads
  const firstName = lead?.name?.split(' ')[0] ?? 'there'
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
  const pattern = patternKey ? CHECKIN_PATTERNS[patternKey] : null

  await logPortalVisit(enrollment.lead_id, enrollment.id, currentDecodeDay(enrollment.enrolled_at))

  return (
    <main style={{ maxWidth: '660px', margin: '0 auto', padding: '40px 24px 80px' }}>
      <Link href={`/decode/${token}`} style={{ fontSize: '13px', fontWeight: 700, color: BLUE, textDecoration: 'none' }}>
        ← The five days
      </Link>

      <p style={{ fontSize: '11px', fontWeight: 700, color: BLUE, letterSpacing: '0.12em', textTransform: 'uppercase', margin: '26px 0 10px' }}>
        Your read · yours to keep
      </p>
      <h1 style={{ fontSize: '31px', fontWeight: 800, color: INK, letterSpacing: '-0.025em', lineHeight: 1.14, margin: '0 0 12px' }}>
        {firstName}, this is all of it.
      </h1>
      <p style={{ fontSize: '16px', color: '#4A4A4A', lineHeight: 1.7, margin: '0 0 32px' }}>
        Nothing here is held back and nothing unlocks later. Read it once now without rushing to act, then read it again tomorrow, because the second read is usually where it clicks. The five lessons walk you through it a part at a time.
      </p>

      {/* Your scores */}
      {scores && (
        <section style={card()}>
          <p style={eyebrow()}>Your five scores</p>
          {bodyState && (
            <p style={{ fontSize: '15px', color: '#4A4A4A', lineHeight: 1.7, margin: '0 0 18px' }}>
              Your readiness came back <strong style={{ color: INK }}>{bodyState}</strong>.
            </p>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {(['01', '02', '03', '04', '05'] as const).map(k => {
              const v = scores[k]
              if (typeof v !== 'number') return null
              const colour = v === 1 ? '#DC2626' : v === 2 ? '#B7791F' : '#1056D6'
              return (
                <div key={k} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{
                    width: '30px', height: '30px', borderRadius: '50%', flexShrink: 0,
                    border: `1.5px solid ${colour}`, color: colour,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '13px', fontWeight: 900,
                  }}>{v}</span>
                  <span style={{ fontSize: '15px', fontWeight: 600, color: INK }}>{SECTION_LABELS[k]}</span>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {pattern ? (
        <>
          {/* Part 1 */}
          <section style={{ ...card(), borderLeft: `3px solid ${pattern.color}` }}>
            <p style={{ ...eyebrow(), color: pattern.color }}>Part 1 · Your pattern</p>
            <p style={{ fontSize: '22px', fontWeight: 800, color: pattern.color, letterSpacing: '-0.02em', margin: '0 0 12px' }}>
              {pattern.label}
            </p>
            <p style={{ fontSize: '15px', color: '#3A3A3A', lineHeight: 1.72, margin: 0 }}>{pattern.desc}</p>
          </section>

          <Part n={2} title="What this pattern means" paragraphs={pattern.whatItMeans} />
          <Part n={3} title="Where this shows up" paragraphs={pattern.whereItShows} />
          <Part
            n={4}
            title="What this is NOT"
            paragraphs={pattern.whatItIsNot}
            note="This is the part most people skim, and it is the one worth reading twice. The way a pattern usually gets explained is often part of the reason it has stayed unsolved."
          />
          <Part n={5} title="Your three actions" paragraphs={pattern.actions} />
        </>
      ) : (
        <section style={card()}>
          <p style={eyebrow()}>Your pattern</p>
          <p style={{ fontSize: '15px', color: '#4A4A4A', lineHeight: 1.7, margin: 0 }}>
            Your answers do not point cleanly at one of the four patterns. That is a real result rather than a missing one, and it usually means the foundations are in better shape than the four compensation patterns describe. Your five scores above are still the place to start.
          </p>
        </section>
      )}

      <section style={{ ...card(), background: '#FAFAFA' }}>
        <p style={{ fontSize: '15px', color: '#4A4A4A', lineHeight: 1.72, margin: 0 }}>
          This is a baseline, not a verdict. Patterns are states, not identities, and states respond to inputs.
        </p>
      </section>

      {/* Accuracy capture, deliberately HERE and not at the end of the five
          days: this is the moment she first meets her read, and it is the only
          place we can ask whether the diagnosis actually landed. Completion
          tells us she stayed; only this tells us we were right. */}
      <div style={{ marginTop: '10px' }}>
        <DecodeFeedbackCard
          moment="read"
          challengeEnrollmentId={enrollment.id}
          leadId={enrollment.lead_id}
          firstName={firstName}
        />
      </div>
    </main>
  )
}

function Part({ n, title, paragraphs, note }: { n: number; title: string; paragraphs: string[]; note?: string }) {
  return (
    <section style={card()}>
      <p style={eyebrow()}>Part {n} · {title}</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '13px' }}>
        {paragraphs.map((p, i) => (
          <p key={i} style={{ fontSize: '15px', color: '#3A3A3A', lineHeight: 1.72, margin: 0 }}>{p}</p>
        ))}
      </div>
      {note && (
        <p style={{ fontSize: '14px', color: MUTED, lineHeight: 1.65, margin: '16px 0 0', fontStyle: 'italic' }}>{note}</p>
      )}
    </section>
  )
}

function card(): React.CSSProperties {
  return {
    background: '#FFFFFF',
    border: '1px solid #E5E5E5',
    borderRadius: '14px',
    padding: '24px 26px',
    marginBottom: '14px',
  }
}

function eyebrow(): React.CSSProperties {
  return {
    fontSize: '11px',
    fontWeight: 700,
    color: BLUE,
    letterSpacing: '0.11em',
    textTransform: 'uppercase',
    margin: '0 0 14px',
  }
}
