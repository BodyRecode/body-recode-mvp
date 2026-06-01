import { notFound } from 'next/navigation'
import Link from 'next/link'
import { markdownToHtml } from '@/lib/markdown'
import fs from 'fs'
import path from 'path'

const STATE_LABELS: Record<string, string> = {
  depleted: 'Depleted',
  transitioning: 'Transitioning',
  ready: 'Ready',
}

const STATE_COLOURS: Record<string, { accent: string; accentSoftBg: string; accentSoftBorder: string }> = {
  depleted:      { accent: '#DC2626', accentSoftBg: 'rgba(220, 38, 38, 0.08)',  accentSoftBorder: 'rgba(220, 38, 38, 0.25)' },
  transitioning: { accent: '#B7791F', accentSoftBg: 'rgba(183, 121, 31, 0.08)', accentSoftBorder: 'rgba(183, 121, 31, 0.25)' },
  ready:         { accent: '#1B6DFC', accentSoftBg: 'rgba(27, 109, 252, 0.08)', accentSoftBorder: 'rgba(27, 109, 252, 0.25)' },
}

const STATE_STRAPLINES: Record<string, string> = {
  depleted: 'Your body is in protection mode. This program is the structured reset that lowers the load enough for your biology to respond.',
  transitioning: 'Your body is responding but a specific pattern is still holding the result back. This program runs twelve weeks of pattern-specific corrective work.',
  ready: 'Your biology is ready. This program is twelve weeks of calibrated continuation - the next dose of effort, applied with the right structure.',
}

export default async function PreviewProgramPage({
  params,
}: {
  params: Promise<{ state: string }>
}) {
  const { state } = await params
  const stateLabel = STATE_LABELS[state]
  if (!stateLabel) notFound()

  const filePath = path.join(process.cwd(), 'src/content/programs', `${state}.md`)
  const markdown = fs.readFileSync(filePath, 'utf-8')
  const html = markdownToHtml(markdown)
  const sc = STATE_COLOURS[state]
  const strapline = STATE_STRAPLINES[state]
  const firstName = 'Sarah'  // Preview sample lead

  return (
    <div style={{
      background: '#FFFFFF', minHeight: '100vh', color: '#1A1A1A',
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    }}>

      {/* Preview banner with state switcher tabs */}
      <div style={{
        background: '#FAFAFA', borderBottom: '1px solid #E5E5E5',
        padding: '10px 24px', display: 'flex', alignItems: 'center',
        justifyContent: 'center', gap: '14px', flexWrap: 'wrap',
      }}>
        <span style={{
          fontSize: '10px', fontWeight: 800, color: '#1056D6',
          letterSpacing: '0.14em', textTransform: 'uppercase',
          background: 'rgba(27, 109, 252, 0.08)', border: '1px solid rgba(27, 109, 252, 0.2)',
          padding: '4px 10px', borderRadius: '6px',
        }}>
          Coach Preview · client view
        </span>
        <span style={{ color: '#D4D4D4', fontSize: '11px' }}>|</span>
        {(['depleted', 'transitioning', 'ready'] as const).map(s => {
          const isActive = s === state
          const stateColor = STATE_COLOURS[s].accent
          return (
            <Link
              key={s}
              href={`/dashboard/preview/program/${s}`}
              style={{
                fontSize: '12px', fontWeight: 700,
                color: isActive ? stateColor : '#6B6B6B',
                textDecoration: 'none', letterSpacing: '0.04em',
                background: isActive ? `${stateColor}18` : 'transparent',
                border: isActive ? `1px solid ${stateColor}40` : '1px solid transparent',
                padding: '4px 10px', borderRadius: '6px',
              }}
            >
              {STATE_LABELS[s]}
            </Link>
          )
        })}
      </div>

      {/* Header */}
      <div style={{ background: '#FFFFFF', borderBottom: '1px solid #E5E5E5', padding: '18px 24px' }}>
        <div style={{ maxWidth: '720px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
          <img src="https://bodyrecode.au/logo-black.png" width="160" alt="Body Recode" style={{ display: 'block' }} />
          <span style={{
            fontSize: '11px', fontWeight: 800, letterSpacing: '0.12em',
            textTransform: 'uppercase' as const,
            color: sc.accent, background: sc.accentSoftBg,
            border: `1px solid ${sc.accentSoftBorder}`,
            padding: '6px 14px', borderRadius: '99px',
          }}>
            {stateLabel} State · 12-Week Program
          </span>
        </div>
      </div>

      {/* Hero with state-coloured radial glow */}
      <div style={{ position: 'relative', overflow: 'hidden' }}>
        <div style={{
          position: 'absolute', top: '-140px', right: '-140px',
          width: '480px', height: '480px', borderRadius: '50%',
          background: `radial-gradient(circle, ${sc.accentSoftBg} 0%, transparent 65%)`,
          pointerEvents: 'none',
        }} />

        <div style={{ maxWidth: '720px', margin: '0 auto', padding: '52px 24px 24px', position: 'relative' }}>
          <p style={{ fontSize: '11px', fontWeight: 700, color: sc.accent, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '14px' }}>
            {firstName}, your program is ready
          </p>
          <h1 style={{
            fontSize: 'clamp(30px, 5vw, 44px)', fontWeight: 900,
            letterSpacing: '-0.035em', margin: '8px 0 16px', color: '#1A1A1A', lineHeight: 1.05,
          }}>
            Your 12-Week
            <br />
            <span style={{ color: sc.accent }}>{stateLabel} State Program.</span>
          </h1>
          <div style={{ width: '48px', height: '3px', background: sc.accent, borderRadius: '2px', marginBottom: '20px' }} />
          <p style={{ fontSize: '17px', color: '#4A4A4A', lineHeight: 1.75, margin: '0 0 14px' }}>
            {strapline}
          </p>
          <p style={{ fontSize: '14px', color: '#6B6B6B', lineHeight: 1.7, margin: 0 }}>
            Bookmark this page. Everything you need is here and you can return to it any time.
          </p>
        </div>
      </div>

      {/* Program content card */}
      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '24px 24px 0' }}>
        <div style={{
          background: '#FFFFFF', border: '1px solid #E5E5E5', borderRadius: '14px',
          padding: '32px', boxShadow: '0 1px 4px rgba(27, 109, 252, 0.04)',
        }}>
          <style>{`
            .program-content h1 { display: none; }
            .program-content h2 {
              font-size: 11px;
              font-weight: 800;
              letter-spacing: 0.12em;
              text-transform: uppercase;
              color: ${sc.accent};
              margin: 44px 0 18px;
              padding-top: 36px;
              border-top: 1px solid #E5E5E5;
            }
            .program-content h2:first-of-type {
              margin-top: 0;
              padding-top: 0;
              border-top: none;
            }
            .program-content h2::before {
              content: '';
              display: block;
              width: 32px;
              height: 3px;
              background: ${sc.accent};
              border-radius: 2px;
              margin-bottom: 14px;
            }
            .program-content h3 {
              font-size: 18px;
              font-weight: 800;
              color: #1A1A1A;
              letter-spacing: -0.02em;
              margin: 28px 0 10px;
              line-height: 1.3;
            }
            .program-content h4 {
              font-size: 13px;
              font-weight: 700;
              color: #1A1A1A;
              margin: 22px 0 8px;
              letter-spacing: -0.01em;
            }
            .program-content p {
              font-size: 15px;
              color: #4A4A4A;
              line-height: 1.75;
              margin: 0 0 14px;
            }
            .program-content ul {
              margin: 0 0 16px;
              padding-left: 0;
              list-style: none;
            }
            .program-content ul li {
              font-size: 15px;
              color: #4A4A4A;
              line-height: 1.75;
              margin-bottom: 8px;
              padding-left: 18px;
              position: relative;
            }
            .program-content ul li::before {
              content: '';
              position: absolute;
              left: 0;
              top: 11px;
              width: 6px;
              height: 6px;
              border-radius: 50%;
              background: ${sc.accent};
            }
            .program-content ol {
              margin: 0 0 16px;
              padding-left: 22px;
            }
            .program-content ol li {
              font-size: 15px;
              color: #4A4A4A;
              line-height: 1.75;
              margin-bottom: 8px;
            }
            .program-content table {
              width: 100%;
              border-collapse: collapse;
              margin: 16px 0 22px;
              font-size: 13px;
              background: #FAFAFA;
              border-radius: 10px;
              overflow: hidden;
              border: 1px solid #E5E5E5;
            }
            .program-content th {
              text-align: left;
              padding: 11px 14px;
              background: #F5F5F5;
              color: #1056D6;
              font-size: 10px;
              font-weight: 800;
              letter-spacing: 0.12em;
              text-transform: uppercase;
              border-bottom: 1px solid #E5E5E5;
            }
            .program-content td {
              padding: 12px 14px;
              color: #4A4A4A;
              border-bottom: 1px solid #E5E5E5;
              vertical-align: top;
              line-height: 1.65;
            }
            .program-content td:first-child { color: #1A1A1A; font-weight: 600; }
            .program-content tr:last-child td { border-bottom: none; }
            .program-content strong { color: #1A1A1A; font-weight: 700; }
            .program-content hr { display: none; }
            .program-content blockquote {
              background: ${sc.accentSoftBg};
              border-left: 3px solid ${sc.accent};
              padding: 14px 18px;
              margin: 18px 0;
              font-size: 14px;
              color: #4A4A4A;
              border-radius: 0 10px 10px 0;
            }
            .program-content a { color: #1B6DFC; text-decoration: underline; font-weight: 600; }
            .program-content code {
              background: #F5F5F5;
              padding: 2px 6px;
              border-radius: 4px;
              font-size: 12px;
              color: #1056D6;
              font-family: ui-monospace, SFMono-Regular, monospace;
            }
          `}</style>
          <div className="program-content" dangerouslySetInnerHTML={{ __html: html }} />
        </div>
      </div>

      {/* Ascension CTA · dark Blueprint-style card */}
      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '24px 24px 0' }}>
        <div style={{
          background: '#1A1A1A', borderRadius: '14px', padding: '28px',
          border: '1px solid rgba(27, 109, 252, 0.3)',
        }}>
          <p style={{ fontSize: '11px', fontWeight: 700, color: '#B5CFFC', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: '10px' }}>
            Want the full coaching picture?
          </p>
          <p style={{ fontSize: '18px', fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.02em', marginBottom: '12px', lineHeight: 1.3 }}>
            This program covers the prescription. A coaching conversation covers the diagnosis.
          </p>
          <p style={{ fontSize: '14px', color: '#B5CFFC', lineHeight: 1.7, marginBottom: '20px' }}>
            The program tells you what to do. A free 30-minute call walks through why your body is in {stateLabel} State, what is driving it, and what would unstick it fastest. No pitch.
          </p>
          <a
            href="https://bodyrecode.au/book?source=self_guided_downsell_preview"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              padding: '14px 26px', borderRadius: '10px',
              background: '#1B6DFC', color: '#FFFFFF',
              fontSize: '14px', fontWeight: 800, textDecoration: 'none',
              letterSpacing: '0.01em',
            }}
          >
            Book a free call with Kade →
          </a>
        </div>
      </div>

      {/* Founder byline */}
      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '24px 24px 0' }}>
        <div style={{
          background: '#FAFAFA', border: '1px solid #EEEEEE',
          borderRadius: '14px', padding: '18px 22px',
          display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap',
        }}>
          <img
            src="https://bodyrecode.au/kade.jpg"
            alt="Kade Dunstone"
            style={{
              width: '44px', height: '44px', borderRadius: '50%',
              objectFit: 'cover', objectPosition: 'top center',
              border: '1px solid #E5E5E5', flexShrink: 0,
            }}
          />
          <div style={{ flex: 1, minWidth: '200px' }}>
            <p style={{ fontSize: '13px', fontWeight: 800, color: '#1A1A1A', margin: 0, lineHeight: 1.3 }}>
              Written by Kade Dunstone
            </p>
            <p style={{ fontSize: '11px', color: '#6B6B6B', margin: 0, lineHeight: 1.45 }}>
              Human Movement Scientist · Business Entrepreneur · Body Recode Founder
            </p>
          </div>
        </div>
      </div>

      {/* Footer · support fallback */}
      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '32px 24px 80px' }}>
        <p style={{ fontSize: '13px', color: '#6B6B6B', textAlign: 'center', lineHeight: 1.65, margin: 0 }}>
          Question about the program?{' '}
          <a href="mailto:kade@bodyrecode.au?subject=12-Week%20Program%20question" style={{ color: '#1B6DFC', textDecoration: 'underline', fontWeight: 700 }}>
            Email kade@bodyrecode.au
          </a>
        </p>
      </div>

    </div>
  )
}
