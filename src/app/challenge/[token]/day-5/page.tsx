import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { logoUrl } from '@/config/tenant'

const SIGNALS = [
  { name: 'Hunger', interpretation: 'If your hunger feels more predictable this week, that is your blood sugar stabilising. Your meals are arriving at consistent intervals and your body is learning to trust the rhythm.' },
  { name: 'Puffiness', interpretation: 'Less morning puffiness through the face or midsection means inflammation is lowering. Cortisol is calming. Fluid retention is releasing.' },
  { name: 'Energy', interpretation: 'Smoother energy across the day, with less of the sharp afternoon crash, means your cortisol curve is resetting. Your adrenal response is becoming less reactive.' },
  { name: 'Digestion', interpretation: 'Less bloating and less pressure after meals means your gut is responding to cleaner, simpler food and a lower overall stress load.' },
  { name: 'Mood', interpretation: 'If you feel calmer in some moments but more emotional in others, both are normal. Your nervous system is recalibrating and the process is not always linear.' },
  { name: 'Training', interpretation: 'Sessions feeling heavier, lighter, or simply more aware means your body is paying attention to the stimulus in a way it was not before.' },
  { name: 'Sleep', interpretation: 'Even slight changes in sleep are your biology starting to find its rhythm overnight.' },
  { name: 'Clothes', interpretation: 'Clothes sitting differently is not fat loss yet. It is fluid releasing and inflammation dropping. The earliest visible signal that the system is responding.' },
]

const WEEK_ONE_SHIFTS = [
  { marker: 'Morning puffiness reducing', meaning: 'Inflammation is lowering. Cortisol is stabilising overnight. Your body is releasing what it was holding.' },
  { marker: 'Hunger becoming more predictable', meaning: 'Your appetite cues are normalising. Blood sugar is steadier. You are starting to feel actual hunger rather than stress-driven craving.' },
  { marker: 'Less stomach tightness and bloating', meaning: 'Your digestion is calming. Simpler food and a lower stress load means your gut is not working as hard.' },
  { marker: 'Fewer intense cravings', meaning: 'Your nervous system is steadier. Your meals are doing their job. Your body is not searching for quick energy hits anymore.' },
  { marker: 'Smoother energy across the day', meaning: 'The afternoon crash is softening. Your cortisol curve is beginning to reset. Your output feels more even.' },
  { marker: 'A calmer mood baseline', meaning: 'Less reactive. Less internal pressure. Nervous system regulation. It happens quietly and often before people expect it.' },
  { marker: 'Slightly better sleep', meaning: 'Less stimulation going into the night. Blood sugar calmer. Your body is starting to use the overnight window for recovery.' },
  { marker: 'Training feeling cleaner', meaning: 'Your stress load is dropping. Recovery between sessions is improving. Your body is responding to the stimulus rather than just surviving it.' },
  { marker: 'Clothes sitting differently', meaning: 'Not fat loss yet. Inflammation lowering and fluid releasing. One of the clearest early signs that your body is responding.' },
  { marker: 'Feeling more present in your body', meaning: 'A sense of reconnection. Less noise. More awareness. Your biology is coming back online.' },
]

const SIX_WEEKS_PHASES = [
  {
    label: 'Weeks 1-2 · Regulation',
    body: 'Extending what you have started in the Challenge. Training is structured but conservative. Your nervous system is still settling. We continue to lower the noise and let your body trust that the rhythm is staying. Your weekly check-in data identifies your pattern.',
  },
  {
    label: 'Weeks 3-4 · Adaptation',
    body: 'Foundation is stable enough to introduce real progressive load. Training gets more demanding. Nutrition starts to differentiate by pattern. Body composition shifts that have been quiet underneath start to become visible.',
  },
  {
    label: 'Weeks 5-6 · Embed',
    body: 'Peak effort for most patterns. Deload and consolidation in the final week. The patterns of the last six weeks stop feeling like a programme and start feeling like the way your body wants to operate.',
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

export default async function Day5Page({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params

  // Preview path: /challenge/preview/day-5 renders the design with mock data
  // (no DB query, no auth, no real participant). Useful for sharing the
  // design with collaborators (Amanda) without exposing a real enrollment token.
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

  return (
    <div style={{
      minHeight: '100vh', background: '#FFFFFF', color: '#1A1A1A',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    }}>
      {/* Header */}
      <div style={{ borderBottom: '1px solid #E5E5E5', padding: '18px 24px', background: '#FFFFFF' }}>
        <div style={{ maxWidth: '720px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <img src={logoUrl()} width="160" alt="Body Recode" style={{ display: 'block' }} />
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
            Day 5 · Week One Progress Session
          </p>
          <h1 style={{
            fontSize: 'clamp(34px, 6vw, 48px)', fontWeight: 900,
            letterSpacing: '-0.035em', margin: '8px 0 18px', color: '#1A1A1A', lineHeight: 1.05,
          }}>
            Decode what your body
            <br />
            <span style={{ color: '#1B6DFC' }}>has been doing this week.</span>
          </h1>
          <div style={{ width: '48px', height: '3px', background: '#1B6DFC', borderRadius: '2px', marginBottom: '24px' }} />
          <p style={{ fontSize: '17px', color: '#4A4A4A', lineHeight: 1.75, margin: 0 }}>
            Seven focused minutes walking you through what has actually happened in your biology across the first 5 days, why the signals you have been feeling matter, and what Week 2 is building toward.
          </p>
        </div>
      </div>

      {/* Week One Progress Session video. Renders unconditionally so it is
          available whenever the page is reached; surrounding day-gated CTAs
          stay behind `locked`. */}
      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '0 24px 24px' }}>
        <div style={{
          position: 'relative', width: '100%', aspectRatio: '16 / 9',
          background: '#1A1A1A', borderRadius: '14px', overflow: 'hidden',
          border: '1px solid #2C2C2C',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
        }}>
          <video
            src="/challenge-day-5.mp4"
            controls
            playsInline
            preload="metadata"
            controlsList="nodownload noplaybackrate"
            disablePictureInPicture
            style={{ width: '100%', height: '100%', display: 'block', objectFit: 'cover' }}
          />
        </div>
      </div>

      {/* Intro bridge */}
      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '24px 24px 8px' }}>
        <p style={{ fontSize: '16px', color: '#4A4A4A', lineHeight: 1.75, margin: 0 }}>
          Below the video, the deeper detail. Read what is most useful to you, in your own time. Nothing to rush through. The information here is what makes Week 2 feel clearer.
        </p>
      </div>

      {/* CARD 1 — Decoding Your Signals */}
      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '32px 24px 0' }}>
        <div style={card}>
          <p style={cardLabel}>Card 1 of 5</p>
          <p style={cardTitle}>Decoding Your Signals</p>
          <p style={{ ...cardBody, marginBottom: '20px' }}>
            Your body has been talking this week. Here is what eight of the most common signals actually mean biologically.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {SIGNALS.map((s, i) => (
              <div key={s.name} style={{
                display: 'flex', gap: '14px', alignItems: 'flex-start',
                borderTop: i === 0 ? 'none' : '1px solid #F0F0F0', paddingTop: i === 0 ? '0' : '14px',
              }}>
                <span style={{
                  fontSize: '11px', fontWeight: 800, color: '#1B6DFC',
                  background: 'rgba(27,109,252,0.08)', padding: '4px 10px',
                  borderRadius: '6px', fontFamily: '"Courier New",Consolas,monospace',
                  letterSpacing: '0.04em', minWidth: '34px', textAlign: 'center' as const,
                  flexShrink: 0, marginTop: '2px',
                }}>
                  {String(i + 1).padStart(2, '0')}
                </span>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: '15px', fontWeight: 700, color: '#1A1A1A', margin: '0 0 4px' }}>{s.name}</p>
                  <p style={{ fontSize: '14px', color: '#4A4A4A', lineHeight: 1.65, margin: 0 }}>{s.interpretation}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CARD 2 — What You May Have Noticed This Week */}
      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '20px 24px 0' }}>
        <div style={card}>
          <p style={cardLabel}>Card 2 of 5</p>
          <p style={cardTitle}>What you may have noticed this week</p>
          <p style={{ ...cardBody, marginBottom: '20px' }}>
            Ten of the most common early shifts in the first 5 days. Some of these will resonate immediately. Others might be things you notice over the next few days.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {WEEK_ONE_SHIFTS.map((s, i) => (
              <div key={s.marker} style={{
                display: 'flex', gap: '14px', alignItems: 'flex-start',
                borderTop: i === 0 ? 'none' : '1px solid #F0F0F0', paddingTop: i === 0 ? '0' : '14px',
              }}>
                <span style={{
                  fontSize: '11px', fontWeight: 800, color: '#1B6DFC',
                  background: 'rgba(27,109,252,0.08)', padding: '4px 10px',
                  borderRadius: '6px', fontFamily: '"Courier New",Consolas,monospace',
                  letterSpacing: '0.04em', minWidth: '34px', textAlign: 'center' as const,
                  flexShrink: 0, marginTop: '2px',
                }}>
                  {String(i + 1).padStart(2, '0')}
                </span>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: '15px', fontWeight: 700, color: '#1A1A1A', margin: '0 0 4px' }}>{s.marker}</p>
                  <p style={{ fontSize: '14px', color: '#4A4A4A', lineHeight: 1.65, margin: 0 }}>{s.meaning}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CARD 3 — Reset vs Results */}
      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '20px 24px 0' }}>
        <div style={card}>
          <p style={cardLabel}>Card 3 of 5</p>
          <p style={cardTitle}>Reset versus Results</p>
          <p style={{ ...cardBody, marginBottom: '14px' }}>
            The 14-Day Body Decode is a reset. It is not designed to produce dramatic visible transformation in two weeks. That is not what a reset is for.
          </p>
          <p style={{ ...cardBody, marginBottom: '14px' }}>
            A reset stabilises your biology. It lowers the noise. It gives your hormones, your hunger, your nervous system and your digestion a chance to recalibrate. Without that foundation, any training or nutrition approach you layer on top works against a body still in a stressed, reactive state. With that foundation, everything works better.
          </p>
          <div style={{
            background: 'rgba(27, 109, 252, 0.06)',
            border: '1px solid rgba(27, 109, 252, 0.18)',
            borderRadius: '10px', padding: '16px 18px', margin: '8px 0',
          }}>
            <p style={{ fontSize: '15px', fontWeight: 700, color: '#1A1A1A', margin: 0, lineHeight: 1.5 }}>
              The reset clears the path. Results come from what you build on top of it.
            </p>
          </div>
          <p style={{ ...cardBody, marginTop: '14px', marginBottom: 0 }}>
            That is what Week 2 is for. And that is what the 6-Week Body Rewire Blueprint is for.
          </p>
        </div>
      </div>

      {/* CARD 4 — Reflection Prompt */}
      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '20px 24px 0' }}>
        <div style={card}>
          <p style={cardLabel}>Card 4 of 5</p>
          <p style={cardTitle}>Reflection prompt</p>
          <p style={{ ...cardBody, marginBottom: '14px' }}>
            Pause for a moment before moving on. Think about how you felt on Day 1. The morning you started. How your body felt when you woke up. Your energy through that first day. Your hunger. Your mood.
          </p>
          <p style={{ ...cardBody, marginBottom: '14px' }}>
            Now compare that to today.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', margin: '16px 0' }}>
            {[
              { eyebrow: 'What has shifted, even slightly?', body: 'It does not need to be dramatic. The first signs are always subtle. A slightly lighter feeling. A calmer morning. Less of that heavy, foggy start to the day.' },
              { eyebrow: 'What has gotten quieter?', body: 'The constant hum of food thoughts. The mid-afternoon energy collapse. The need to reach for something to settle yourself. The internal noise you had stopped noticing because it had become the baseline.' },
              { eyebrow: 'What has gotten clearer?', body: 'Hunger that means hunger, not stress. Tiredness that means tiredness, not flatness. A signal from your body that you can actually trust because it is no longer being scrambled by an overloaded system.' },
              { eyebrow: 'How are you relating to your body differently?', body: 'Less negotiation. Less internal argument. More of a sense that your body is on your side rather than working against you. That shift is hard to put into words but most people feel it by Day 5.' },
            ].map(p => (
              <div key={p.eyebrow} style={{
                background: '#FAFAFA', border: '1px solid #EEEEEE',
                borderLeft: '3px solid #1B6DFC', borderRadius: '10px', padding: '14px 16px',
              }}>
                <p style={{ fontSize: '13px', fontWeight: 700, color: '#1A1A1A', margin: '0 0 6px' }}>{p.eyebrow}</p>
                <p style={{ fontSize: '13px', color: '#4A4A4A', margin: 0, lineHeight: 1.6 }}>{p.body}</p>
              </div>
            ))}
          </div>
          <p style={{ ...cardBody, marginTop: '6px', marginBottom: 0, fontWeight: 700, color: '#1A1A1A' }}>
            Whatever it is for you, hold onto it. That is your evidence. That is your body telling you that what you are doing is working.
          </p>
        </div>
      </div>

      {/* CARD 5 — How the 6 Weeks Work · the first Blueprint upsell in the
          14-day arc. Treated as a conversion moment, not an educational card:
          gradient background mirroring the Day 14 ascension card so it reads
          as a product surface, not another teaching block. */}
      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '20px 24px 0' }}>
        <div style={{
          background: 'linear-gradient(135deg, #EAF2FF 0%, #B5CFFC 100%)',
          border: '1px solid rgba(27, 109, 252,0.30)',
          borderRadius: '16px',
          padding: '28px 28px',
          boxShadow: '0 6px 24px -10px rgba(27,109,252,0.35)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px', flexWrap: 'wrap' as const }}>
            <p style={{ fontSize: '11px', fontWeight: 800, color: '#0B4ABF', letterSpacing: '0.12em', textTransform: 'uppercase' as const, margin: 0 }}>
              Card 5 of 5 · What comes next
            </p>
            <span style={{
              fontSize: '10px', fontWeight: 800, color: '#0B4ABF',
              background: 'rgba(255,255,255,0.6)', border: '1px solid rgba(27,109,252,0.35)',
              borderRadius: '99px', padding: '3px 10px',
              letterSpacing: '0.1em', textTransform: 'uppercase' as const,
            }}>
              Day 14 unlock
            </span>
            <span style={{
              fontSize: '10px', fontWeight: 800, color: '#0B4ABF',
              background: 'rgba(255,255,255,0.6)', border: '1px solid rgba(27,109,252,0.35)',
              borderRadius: '99px', padding: '3px 10px',
              letterSpacing: '0.1em', textTransform: 'uppercase' as const,
            }}>
              $97 one-time
            </span>
          </div>
          <h2 style={{ fontSize: '26px', fontWeight: 900, color: '#0B1F3F', letterSpacing: '-0.025em', margin: '0 0 8px', lineHeight: 1.18 }}>
            The 6-Week Body Rewire Blueprint
          </h2>
          <p style={{ fontSize: '15px', color: '#1A1A1A', lineHeight: 1.7, margin: '0 0 20px' }}>
            What happens after Day 14 if you continue. The Blueprint is structured in three phases — two weeks each. Each phase has a specific biological job.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
            {SIX_WEEKS_PHASES.map((p, i) => (
              <div key={p.label} style={{
                background: 'rgba(255,255,255,0.7)',
                border: '1px solid rgba(27, 109, 252, 0.25)',
                borderLeft: '3px solid #1B6DFC',
                borderRadius: '10px', padding: '16px 18px',
              }}>
                <p style={{ fontSize: '11px', fontWeight: 800, color: '#1056D6', letterSpacing: '0.08em', textTransform: 'uppercase' as const, margin: '0 0 6px' }}>
                  Phase {i + 1}
                </p>
                <p style={{ fontSize: '15px', fontWeight: 700, color: '#0B1F3F', margin: '0 0 8px' }}>{p.label}</p>
                <p style={{ fontSize: '14px', color: '#3A3A3A', lineHeight: 1.65, margin: 0 }}>{p.body}</p>
              </div>
            ))}
          </div>
          <p style={{ fontSize: '14px', color: '#0B1F3F', lineHeight: 1.7, margin: '0 0 20px', fontWeight: 600 }}>
            On Day 14 your portal will show you the clear next step. You are further along than you think.
          </p>
          <a
            href="https://bodyrecode.au/blueprint?source=challenge_day5_card5"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              padding: '14px 24px', borderRadius: '10px',
              background: '#1B6DFC', color: '#FFFFFF',
              fontSize: '14px', fontWeight: 800, textDecoration: 'none',
              letterSpacing: '0.01em',
              boxShadow: '0 8px 20px -6px rgba(27,109,252,0.55)',
            }}
          >
            See the Blueprint <span aria-hidden>→</span>
          </a>
        </div>
      </div>

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
