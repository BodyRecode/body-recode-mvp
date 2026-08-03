import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { logoUrl, brand } from '@/config/tenant'
import { hasPortalAccess } from '@/lib/challenge-access'

const FOUR_PATTERNS = [
  {
    name: 'Stress-Stored',
    gender: 'Universal (men and women)',
    driver: 'Cortisol and adrenaline',
    where: 'Front of the midsection and waist, while the arms and legs stay lean',
    signal: 'Wired but tired. The middle fills while the limbs do not. Wakes puffy. Late-night alertness despite fatigue.',
    colour: '#DC2626',
  },
  {
    name: 'Insulin-Drift',
    gender: 'Male-dominant (also female)',
    driver: 'Insulin and blood sugar timing',
    where: 'Mid-back, lower back and love handles, with the front relatively spared',
    signal: 'Energy crashes mid-morning or afternoon. Cravings hit hardest in the evening. Training feels heavier than it should.',
    colour: '#B7791F',
  },
  {
    name: 'Estrogen-Shift',
    gender: 'Female only',
    driver: 'Oestrogen and reproductive hormone signalling',
    where: 'Hips, glutes and outer thighs at first, then moving toward the middle as oestrogen falls',
    signal: 'Body shifting underneath you. Cycle unpredictability. Bloating without obvious reason. Restriction makes it worse, not better.',
    colour: '#8B5CF6',
  },
  {
    name: 'Androgen-Decline',
    gender: 'Male only, typically 40-55',
    driver: 'Testosterone signalling drop',
    where: 'Not one location. Fat rising through the middle while muscle and tone fall, and the chest filling',
    signal: 'Capability slipping, not just appearance. Strength sessions feel heavier than they used to. Drive and recovery both down.',
    colour: '#1B6DFC',
  },
]

const card: React.CSSProperties = {
  background: '#FFFFFF', border: '1px solid #E5E5E5', borderRadius: '14px',
  padding: '24px 26px', boxShadow: '0 1px 4px rgba(27, 109, 252, 0.04)',
}

const cardLabel: React.CSSProperties = {
  fontSize: '11px', fontWeight: 700, color: '#1B6DFC',
  letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '10px',
}

const cardTitle: React.CSSProperties = {
  fontSize: '22px', fontWeight: 800, color: '#1A1A1A',
  letterSpacing: '-0.02em', margin: '0 0 14px', lineHeight: 1.25,
}

const cardBody: React.CSSProperties = {
  fontSize: '15px', color: '#4A4A4A', lineHeight: 1.7, margin: 0,
}

export default async function Day7Page({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params

  // Preview path: /challenge/preview/day-7 renders with mocked Day 14 data
  // for design review without requiring an active enrollment token.
  let currentDay: number
  if (token === 'preview') {
    currentDay = 14
  } else {
    const admin = createAdminClient()
    const { data: enrollment } = await admin
      .from('challenge_enrollments')
      .select('id, enrolled_at, status')
      .eq('token', token)
      .single()

    if (!enrollment || !hasPortalAccess(enrollment.status)) notFound()

    const enrolledAt = new Date(enrollment.enrolled_at as string)
    const msPerDay = 1000 * 60 * 60 * 24
    currentDay = Math.min(
      Math.floor((Date.now() - enrolledAt.getTime()) / msPerDay) + 1,
      14
    )
  }

  const locked = currentDay < 7

  return (
    <div style={{
      minHeight: '100vh', background: '#FFFFFF', color: '#1A1A1A',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    }}>
      {/* Header */}
      <div style={{ borderBottom: '1px solid #E5E5E5', padding: '18px 24px', background: '#FFFFFF' }}>
        <div style={{ maxWidth: '720px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <img src={logoUrl()} width="160" alt={brand().name} style={{ display: 'block' }} />
          <Link href={`/challenge/${token}`} style={{ fontSize: '13px', color: '#1B6DFC', textDecoration: 'none', fontWeight: 500 }}>
            Back to portal
          </Link>
        </div>
      </div>

      {/* Hero with Signal Blue radial glow */}
      <div style={{ position: 'relative', overflow: 'hidden' }}>
        <div style={{
          position: 'absolute', top: '-140px', right: '-140px',
          width: '480px', height: '480px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(27, 109, 252, 0.12) 0%, transparent 65%)',
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', bottom: '0', left: '-100px',
          width: '320px', height: '320px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(27, 109, 252, 0.06) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <div style={{ maxWidth: '720px', margin: '0 auto', padding: '56px 24px 32px', position: 'relative' }}>
          <p style={{ fontSize: '11px', fontWeight: 700, color: '#1B6DFC', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '14px' }}>
            Day 7 · Body Decode Check-In
          </p>
          <h1 style={{
            fontSize: 'clamp(34px, 6vw, 48px)', fontWeight: 900,
            letterSpacing: '-0.035em', margin: '8px 0 18px', color: '#1A1A1A', lineHeight: 1.05,
          }}>
            Read the pattern
            <br />
            <span style={{ color: '#1B6DFC' }}>your biology has settled into.</span>
          </h1>
          <div style={{ width: '48px', height: '3px', background: '#1B6DFC', borderRadius: '2px', marginBottom: '24px' }} />
          <p style={{ fontSize: '17px', color: '#4A4A4A', lineHeight: 1.75, margin: 0 }}>
            It reads how your body has shifted this week to identify your specific pattern. The pattern is what makes the rest of the Challenge make sense.
          </p>
        </div>
      </div>

      {/* Pre-Check-In intro reel. Renders unconditionally; day-gated CTAs
          below stay behind `locked`. */}
      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '0 24px 24px' }}>
        <div style={{
          position: 'relative', width: '100%', aspectRatio: '16 / 9',
          background: '#1A1A1A', borderRadius: '14px', overflow: 'hidden',
          border: '1px solid #2C2C2C',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
        }}>
          <video
            src="/challenge-day-7.mp4"
            controls
            playsInline
            preload="metadata"
            controlsList="nodownload noplaybackrate"
            disablePictureInPicture
            style={{ width: '100%', height: '100%', display: 'block', objectFit: 'cover' }}
          />
        </div>
      </div>

      {/* Primary CTA - Take the Check-In */}
      {!locked && (
        <div style={{ maxWidth: '720px', margin: '0 auto', padding: '24px 24px 8px' }}>
          <Link href={`/challenge/${token}/check-in`} style={{
            display: 'block', width: '100%', padding: '18px', borderRadius: '12px',
            background: '#1B6DFC', color: '#FFFFFF',
            fontSize: '17px', fontWeight: 800, textAlign: 'center',
            textDecoration: 'none', letterSpacing: '0.01em',
            boxShadow: '0 4px 16px rgba(27, 109, 252, 0.3)',
            boxSizing: 'border-box',
          }}>
            Take the Body Decode Check-In →
          </Link>
          <p style={{ fontSize: '13px', color: '#6B6B6B', textAlign: 'center', marginTop: '12px', lineHeight: 1.6 }}>
            Takes 5-10 minutes. Your result is yours to keep.
          </p>
        </div>
      )}

      {/* Intro bridge */}
      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '32px 24px 8px' }}>
        <p style={{ fontSize: '16px', color: '#4A4A4A', lineHeight: 1.75, margin: 0 }}>
          Below, the four patterns you may be identified as, why pattern identification matters, what happens after Day 7, and how the Check-In works. Read what is most useful to you before you take the audit.
        </p>
      </div>

      {/* CARD 1 — The Four Biological Patterns */}
      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '32px 24px 0' }}>
        <div style={card}>
          <p style={cardLabel}>Card 1 of 4</p>
          <p style={cardTitle}>The four biological patterns</p>
          <p style={{ ...cardBody, marginBottom: '20px' }}>
            Your body is working through one of four patterns. The Check-In identifies which one. Each pattern is held by a different biological driver and responds to a different specific approach. Knowing your pattern is what makes everything that comes after the Challenge make sense.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {FOUR_PATTERNS.map((p, i) => (
              <div key={p.name} style={{
                background: '#FAFAFA', border: '1px solid #EEEEEE',
                borderLeft: `3px solid ${p.colour}`,
                borderRadius: '10px', padding: '16px 18px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', flexWrap: 'wrap' as const, gap: '8px' }}>
                  <p style={{ fontSize: '17px', fontWeight: 800, color: '#1A1A1A', margin: 0, letterSpacing: '-0.01em' }}>{p.name}</p>
                  <span style={{
                    fontSize: '10px', fontWeight: 700, color: p.colour,
                    background: `${p.colour}15`, padding: '4px 10px', borderRadius: '6px',
                    letterSpacing: '0.08em', textTransform: 'uppercase' as const,
                  }}>
                    {String(i + 1).padStart(2, '0')}
                  </span>
                </div>
                <p style={{ fontSize: '12px', fontWeight: 700, color: '#6B6B6B', margin: '0 0 8px', letterSpacing: '0.04em', textTransform: 'uppercase' as const }}>
                  {p.gender} · Driver: {p.driver}
                </p>
                <p style={{ fontSize: '14px', color: '#1A1A1A', margin: '0 0 6px', fontWeight: 600, lineHeight: 1.5 }}>
                  {p.where}
                </p>
                <p style={{ fontSize: '13px', color: '#4A4A4A', margin: 0, lineHeight: 1.65 }}>
                  {p.signal}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CARD 2 — Why pattern identification matters */}
      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '20px 24px 0' }}>
        <div style={card}>
          <p style={cardLabel}>Card 2 of 4</p>
          <p style={cardTitle}>Why pattern identification matters</p>
          <p style={{ ...cardBody, marginBottom: '14px' }}>
            A pattern is HOW your biology is holding. Not WHAT it is holding. Two people with the same goal can have completely different patterns underneath, which means they need completely different prescriptions to release the hold.
          </p>
          <p style={{ ...cardBody, marginBottom: '14px' }}>
            Without knowing your pattern, training is generic. Nutrition is generic. The same plan that works for someone in Stress-Stored mode makes someone in Estrogen-Shift worse. Generic prescription is a guess. Pattern-specific prescription is a read.
          </p>
          <div style={{
            background: 'rgba(27, 109, 252, 0.06)',
            border: '1px solid rgba(27, 109, 252, 0.18)',
            borderRadius: '10px', padding: '16px 18px', margin: '8px 0',
          }}>
            <p style={{ fontSize: '15px', fontWeight: 700, color: '#1A1A1A', margin: 0, lineHeight: 1.5 }}>
              The Check-In reads your pattern using seven days of real biological data. Not a personality quiz. Not a guess. The signals your body has actually been sending this week.
            </p>
          </div>
          <p style={{ ...cardBody, marginTop: '14px', marginBottom: 0 }}>
            That is why Day 7 is the most important moment in the Challenge. Once your pattern is read, everything that comes after has direction.
          </p>
        </div>
      </div>

      {/* CARD 3 — What happens after Day 7 */}
      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '20px 24px 0' }}>
        <div style={card}>
          <p style={cardLabel}>Card 3 of 4</p>
          <p style={cardTitle}>What happens after Day 7</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[
              { eyebrow: 'Days 8 to 11', body: 'The shifts that started this week become more visible. Sleep deepens. The energy curve stops feeling like a fight. Appetite becomes the most predictable it has been in months.' },
              { eyebrow: 'Days 12 to 14', body: 'Consolidation. The rhythm you have built over twelve consecutive days becomes the baseline your body now expects. The reset is complete.' },
              { eyebrow: 'Day 14 onward', body: 'Your pattern (read today) carries straight into the 6-Week Body Rewire Blueprint. Same login. Same token. The Blueprint takes the pattern you have just identified and runs six weeks of focused, pattern-specific corrective work. Training calibrated to your pattern. Nutrition timed to your pattern. Weekly coaching written for your pattern.' },
              { eyebrow: 'By Week 6 of the Blueprint', body: 'The pattern is corrected. Your body comes out of compensation. The foundation is laid for everything that follows.' },
            ].map(p => (
              <div key={p.eyebrow} style={{
                background: '#FAFAFA', border: '1px solid #EEEEEE',
                borderLeft: '3px solid #1B6DFC', borderRadius: '10px', padding: '14px 16px',
              }}>
                <p style={{ fontSize: '11px', fontWeight: 800, color: '#1056D6', letterSpacing: '0.08em', textTransform: 'uppercase' as const, margin: '0 0 6px' }}>
                  {p.eyebrow}
                </p>
                <p style={{ fontSize: '14px', color: '#4A4A4A', margin: 0, lineHeight: 1.65 }}>{p.body}</p>
              </div>
            ))}
          </div>
          <p style={{ ...cardBody, marginTop: '16px', marginBottom: 0, fontWeight: 700, color: '#1A1A1A' }}>
            You do not need to think about any of that yet. Right now, your only job is to take the Check-In and read the pattern.
          </p>
        </div>
      </div>

      {/* CARD 4 — How the Check-In works */}
      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '20px 24px 0' }}>
        <div style={card}>
          <p style={cardLabel}>Card 4 of 4</p>
          <p style={cardTitle}>How the Check-In works</p>
          <p style={{ ...cardBody, marginBottom: '20px' }}>
            Two short parts. Takes 5 to 10 minutes total. Answer honestly. The result is shown immediately and emailed to you for your records.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{
              background: '#FAFAFA', border: '1px solid #EEEEEE',
              borderLeft: '3px solid #1B6DFC', borderRadius: '10px', padding: '16px 18px',
            }}>
              <p style={{ fontSize: '11px', fontWeight: 800, color: '#1056D6', letterSpacing: '0.08em', textTransform: 'uppercase' as const, margin: '0 0 6px' }}>
                Part 1 · Progress scan
              </p>
              <p style={{ fontSize: '15px', fontWeight: 700, color: '#1A1A1A', margin: '0 0 8px' }}>
                Rate 8 biological markers
              </p>
              <p style={{ fontSize: '13px', color: '#4A4A4A', margin: '0 0 10px', lineHeight: 1.65 }}>
                For each marker, choose: Improving, About the same, or Still a challenge. This gives you a progress score (0 to 8 improving) for Week 1.
              </p>
              <p style={{ fontSize: '12px', color: '#6B6B6B', margin: 0, lineHeight: 1.55 }}>
                Markers: morning energy, afternoon energy, puffiness, sleep quality, cravings, mental clarity, mood stability, digestion.
              </p>
            </div>
            <div style={{
              background: '#FAFAFA', border: '1px solid #EEEEEE',
              borderLeft: '3px solid #1B6DFC', borderRadius: '10px', padding: '16px 18px',
            }}>
              <p style={{ fontSize: '11px', fontWeight: 800, color: '#1056D6', letterSpacing: '0.08em', textTransform: 'uppercase' as const, margin: '0 0 6px' }}>
                Part 2 · Signal pattern
              </p>
              <p style={{ fontSize: '15px', fontWeight: 700, color: '#1A1A1A', margin: '0 0 8px' }}>
                Two questions identify your pattern
              </p>
              <p style={{ fontSize: '13px', color: '#4A4A4A', margin: 0, lineHeight: 1.65 }}>
                Two multiple-choice questions about where you most notice fat storage and what your lived experience has been this week. The combination determines your dominant pattern.
              </p>
            </div>
          </div>
          <div style={{
            background: 'rgba(27, 109, 252, 0.06)',
            border: '1px solid rgba(27, 109, 252, 0.18)',
            borderRadius: '10px', padding: '16px 18px', marginTop: '20px',
          }}>
            <p style={{ fontSize: '14px', color: '#1A1A1A', margin: 0, lineHeight: 1.6, fontWeight: 600 }}>
              Take it slowly. Answer honestly. There is no wrong answer. The result is yours to keep.
            </p>
          </div>
        </div>
      </div>

      {/* Secondary CTA at bottom (if unlocked) */}
      {!locked && (
        <div style={{ maxWidth: '720px', margin: '0 auto', padding: '32px 24px 8px' }}>
          <Link href={`/challenge/${token}/check-in`} style={{
            display: 'block', width: '100%', padding: '18px', borderRadius: '12px',
            background: '#1B6DFC', color: '#FFFFFF',
            fontSize: '17px', fontWeight: 800, textAlign: 'center',
            textDecoration: 'none', letterSpacing: '0.01em',
            boxShadow: '0 4px 16px rgba(27, 109, 252, 0.3)',
            boxSizing: 'border-box',
          }}>
            Take the Body Decode Check-In →
          </Link>
        </div>
      )}

      {/* Footer */}
      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '40px 24px 80px' }}>
        <Link href={`/challenge/${token}`} style={{
          display: 'inline-flex', alignItems: 'center', gap: '8px',
          padding: '14px 24px', borderRadius: '10px',
          background: '#FFFFFF', border: '1px solid #E5E5E5', color: '#1A1A1A',
          fontSize: '14px', fontWeight: 700, textDecoration: 'none',
        }}>
          ← Back to your portal
        </Link>
      </div>

    </div>
  )
}
