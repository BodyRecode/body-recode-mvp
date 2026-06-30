import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { CoachingAscensionCTA } from '@/components/coaching-ascension-cta'

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

const REPORT_PARTS = [
  {
    eyebrow: 'Part 1',
    title: 'Pattern Hero',
    body: 'Your dominant biological pattern, named and defined. One of four: Stress-Stored, Insulin-Drift, Estrogen-Shift, or Androgen-Decline. This is the read.',
  },
  {
    eyebrow: 'Part 2',
    title: 'What this pattern means',
    body: 'Three paragraphs explaining the mechanism, not just the symptoms. Why your body has held what it has held. Regulation framing, not metabolism framing.',
  },
  {
    eyebrow: 'Part 3',
    title: 'Where this shows up',
    body: 'The specific lived and physical signals of this pattern in everyday life. The way the pattern actually feels in the body.',
  },
  {
    eyebrow: 'Part 4',
    title: 'What this is NOT',
    body: 'Anti-shame misreads. What this pattern is commonly mistaken for: laziness, willpower failure, just ageing, too many carbs. Read this carefully. The way the pattern is usually framed is part of the reason it stays unsolved.',
  },
  {
    eyebrow: 'Part 5',
    title: 'Your three pattern-specific actions',
    body: 'The work for the next stage. Specific to your pattern, not generic. The three actions that move this pattern from where it is to where it needs to go.',
  },
]

const POST_REPORT_FLOW = [
  { eyebrow: 'Right now', body: 'Open the Report and read it once. Do not race to act. The first read is for understanding.' },
  { eyebrow: 'Tomorrow morning', body: 'Open the Report again. The second read is where it clicks. The mechanism makes more sense once the first read has settled overnight.' },
  { eyebrow: 'Within 48 hours', body: 'Most participants who read the Report start the 6-Week Body Rewire Blueprint within 48 hours. The momentum of the Challenge carries straight in - same login, same token, same pattern, six weeks of focused pattern-specific corrective work.' },
  { eyebrow: 'By Week 6 of the Blueprint', body: 'The pattern is corrected. Your body comes out of compensation. The baseline you set in these 14 days becomes the floor, not the ceiling.' },
]

export default async function Day14Page({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params

  // Preview path: /challenge/preview/day-14 renders with mocked Day 14 data
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

    if (!enrollment || enrollment.status !== 'active') notFound()

    const enrolledAt = new Date(enrollment.enrolled_at as string)
    const msPerDay = 1000 * 60 * 60 * 24
    currentDay = Math.min(
      Math.floor((Date.now() - enrolledAt.getTime()) / msPerDay) + 1,
      14
    )
  }

  const locked = currentDay < 14

  return (
    <div style={{
      minHeight: '100vh', background: '#FFFFFF', color: '#1A1A1A',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    }}>
      {/* Header */}
      <div style={{ borderBottom: '1px solid #E5E5E5', padding: '18px 24px', background: '#FFFFFF' }}>
        <div style={{ maxWidth: '720px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <img src="https://bodyrecode.au/logo-black.png" width="160" alt="Body Recode" style={{ display: 'block' }} />
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
            Day 14 · Body Decode Report
          </p>
          <h1 style={{
            fontSize: 'clamp(34px, 6vw, 48px)', fontWeight: 900,
            letterSpacing: '-0.035em', margin: '8px 0 18px', color: '#1A1A1A', lineHeight: 1.05,
          }}>
            Fourteen days, settled
            <br />
            <span style={{ color: '#1B6DFC' }}>into a clear biological read.</span>
          </h1>
          <div style={{ width: '48px', height: '3px', background: '#1B6DFC', borderRadius: '2px', marginBottom: '24px' }} />
          <p style={{ fontSize: '17px', color: '#4A4A4A', lineHeight: 1.75, margin: 0 }}>
            Today is the read. Your Body Decode Report takes the seven-day Check-In signal you submitted and the seven days of consolidation that followed and presents the pattern your biology has been working through, what it actually means, what it is not, and the three actions specific to it. Open the Report when you are ready.
          </p>
        </div>
      </div>

      {/* Day 14 Read video. Renders unconditionally; day-gated CTAs below
          stay behind `locked`. */}
      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '0 24px 24px' }}>
        <div style={{
          position: 'relative', width: '100%', aspectRatio: '16 / 9',
          background: '#1A1A1A', borderRadius: '14px', overflow: 'hidden',
          border: '1px solid #2C2C2C',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
        }}>
          <video
            src="/challenge-day-14.mp4"
            controls
            playsInline
            preload="metadata"
            controlsList="nodownload noplaybackrate"
            disablePictureInPicture
            style={{ width: '100%', height: '100%', display: 'block', objectFit: 'cover' }}
          />
        </div>
      </div>

      {/* Primary CTA - Open Report */}
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
            Open your Body Decode Report →
          </Link>
          <p style={{ fontSize: '13px', color: '#6B6B6B', textAlign: 'center', marginTop: '12px', lineHeight: 1.6 }}>
            The Report is also in your inbox. Either is the same read.
          </p>
        </div>
      )}

      {/* Intro bridge */}
      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '32px 24px 8px' }}>
        <p style={{ fontSize: '16px', color: '#4A4A4A', lineHeight: 1.75, margin: 0 }}>
          Below, what fourteen days has done in your body, how to read the Report, what to do with it, and what comes next. Read what is most useful to you, then open the Report.
        </p>
      </div>

      {/* CARD 1 — What 14 days has done */}
      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '32px 24px 0' }}>
        <div style={card}>
          <p style={cardLabel}>Card 1 of 4</p>
          <p style={cardTitle}>What fourteen days has done in your body</p>
          <p style={{ ...cardBody, marginBottom: '14px' }}>
            The first seven days were about lowering signal noise. Inflammation softened. Your cortisol curve started to settle. Energy and appetite became more predictable.
          </p>
          <p style={{ ...cardBody, marginBottom: '14px' }}>
            The second seven days were about consolidation. The rhythm you held for twelve consecutive days became the baseline your body now expects. The reset is no longer something you are doing. It is something your body has settled into.
          </p>
          <div style={{
            background: 'rgba(27, 109, 252, 0.06)',
            border: '1px solid rgba(27, 109, 252, 0.18)',
            borderRadius: '10px', padding: '16px 18px', margin: '8px 0',
          }}>
            <p style={{ fontSize: '15px', fontWeight: 700, color: '#1A1A1A', margin: 0, lineHeight: 1.5 }}>
              The pattern you are about to read could not have been read on Day 1. It needed fourteen days of clean signal to surface clearly. That is what you have given your body.
            </p>
          </div>
        </div>
      </div>

      {/* CARD 2 — How to read your Report */}
      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '20px 24px 0' }}>
        <div style={card}>
          <p style={cardLabel}>Card 2 of 4</p>
          <p style={cardTitle}>How to read your Report</p>
          <p style={{ ...cardBody, marginBottom: '18px' }}>
            The Report has five parts. Read them in order. Part 4 is the most important. Read it twice if you need to.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {REPORT_PARTS.map(p => (
              <div key={p.eyebrow} style={{
                background: '#FAFAFA', border: '1px solid #EEEEEE',
                borderLeft: '3px solid #1B6DFC', borderRadius: '10px', padding: '14px 16px',
              }}>
                <p style={{ fontSize: '11px', fontWeight: 800, color: '#1056D6', letterSpacing: '0.08em', textTransform: 'uppercase' as const, margin: '0 0 6px' }}>
                  {p.eyebrow}
                </p>
                <p style={{ fontSize: '15px', fontWeight: 700, color: '#1A1A1A', margin: '0 0 6px' }}>{p.title}</p>
                <p style={{ fontSize: '13px', color: '#4A4A4A', margin: 0, lineHeight: 1.65 }}>{p.body}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CARD 3 — What to do with the Report */}
      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '20px 24px 0' }}>
        <div style={card}>
          <p style={cardLabel}>Card 3 of 4</p>
          <p style={cardTitle}>What to do with the Report</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {POST_REPORT_FLOW.map(p => (
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
            The Report is the read. The Blueprint is the correction. They are designed to work together.
          </p>
        </div>
      </div>

      {/* CARD 4 — Take it slowly */}
      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '20px 24px 0' }}>
        <div style={card}>
          <p style={cardLabel}>Card 4 of 4</p>
          <p style={cardTitle}>Take it slowly</p>
          <p style={{ ...cardBody, marginBottom: '14px' }}>
            The Report is not a verdict. It is a read of where your biology has settled. Patterns are states, not identities. States respond to inputs.
          </p>
          <p style={{ ...cardBody, marginBottom: '14px' }}>
            Read once today. Close the tab. Come back to it tomorrow morning. Saying the name of your pattern out loud helps make it real. When you are ready, the next step is on the other side of the Blueprint CTA.
          </p>
          <div style={{
            background: 'rgba(27, 109, 252, 0.06)',
            border: '1px solid rgba(27, 109, 252, 0.18)',
            borderRadius: '10px', padding: '16px 18px', marginTop: '8px',
          }}>
            <p style={{ fontSize: '14px', color: '#1A1A1A', margin: 0, lineHeight: 1.6, fontWeight: 600 }}>
              You have done something most people will not do. You held fourteen consecutive days of clean structure. The read is the reward.
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
            Open your Body Decode Report →
          </Link>
        </div>
      )}

      {/* Stage 4 ascension: skip ahead to 1:1 coaching from the Challenge */}
      {!locked && (
        <div style={{ maxWidth: '720px', margin: '0 auto', padding: '8px 24px 0' }}>
          <CoachingAscensionCTA source="challenge_day14" variant="secondary" />
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
