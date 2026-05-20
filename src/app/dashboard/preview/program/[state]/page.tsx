import { notFound } from 'next/navigation'
import { markdownToHtml } from '@/lib/markdown'
import fs from 'fs'
import path from 'path'

const STATE_LABELS: Record<string, string> = {
  depleted: 'Depleted',
  transitioning: 'Transitioning',
  ready: 'Ready',
}

const STATE_COLOURS: Record<string, { color: string; bg: string; border: string; ctaBg: string; ctaBorder: string; ctaText: string }> = {
  depleted: { color: '#ef4444', bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.25)', ctaBg: '#2d0d0d', ctaBorder: 'rgba(239,68,68,0.3)', ctaText: '#fca5a5' },
  transitioning: { color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.25)', ctaBg: '#2d1f0d', ctaBorder: 'rgba(245,158,11,0.3)', ctaText: '#fcd34d' },
  ready: { color: '#1B6DFC', bg: 'rgba(20,184,166,0.08)', border: 'rgba(20,184,166,0.25)', ctaBg: '#B5CFFC', ctaBorder: 'rgba(20,184,166,0.3)', ctaText: '#B5CFFC' },
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

  return (
    <div style={{ background: '#FFFFFF', minHeight: '100vh', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>

      {/* Preview banner */}
      <div style={{ background: '#1a1a00', borderBottom: '1px solid #333300', padding: '10px 24px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '20px' }}>
        <span style={{ fontSize: '11px', color: '#aaaa00', fontWeight: 600 }}>PREVIEW - client view</span>
        <span style={{ color: '#333' }}>|</span>
        {['depleted', 'transitioning', 'ready'].map(s => (
          <a key={s} href={`/dashboard/preview/program/${s}`} style={{
            fontSize: '12px', fontWeight: 600,
            color: s === state ? '#10E1C2' : '#555',
            textDecoration: 'none',
          }}>
            {STATE_LABELS[s]}
          </a>
        ))}
      </div>

      {/* Header */}
      <div style={{ background: '#FFFFFF', borderBottom: '1px solid #E5E5E5', padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <img src="https://bodyrecode.au/logo-teal.png" width="130" alt="Body Recode" />
        <span style={{
          fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em',
          textTransform: 'uppercase' as const,
          color: sc.color, background: sc.bg,
          border: `1px solid ${sc.border}`,
          padding: '5px 14px', borderRadius: '999px',
        }}>
          {stateLabel} State Program
        </span>
      </div>

      <div style={{ maxWidth: '680px', margin: '0 auto', padding: '48px 24px 80px' }}>

        {/* Welcome */}
        <div style={{ marginBottom: '40px' }}>
          <div style={{ width: '32px', height: '3px', background: sc.color, marginBottom: '20px', borderRadius: '2px' }} />
          <p style={{ fontSize: '13px', color: '#6B6B6B', marginBottom: '6px' }}>
            Sarah, your program is ready.
          </p>
          <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#1A1A1A', letterSpacing: '-0.02em', lineHeight: 1.2, marginBottom: '12px' }}>
            12-Week {stateLabel} State Program
          </h1>
          <p style={{ fontSize: '15px', color: '#6B6B6B', lineHeight: 1.6 }}>
            Bookmark this page. Everything you need is here and you can return to it any time.
          </p>
        </div>

        {/* Program content card */}
        <div style={{ background: '#FFFFFF', border: '1px solid #E5E5E5', borderRadius: '16px', padding: '32px', marginBottom: '24px' }}>
          <style>{`
            .program-content h1 { display: none; }
            .program-content h2 {
              font-size: 11px;
              font-weight: 700;
              letter-spacing: 0.12em;
              text-transform: uppercase;
              color: ${sc.color};
              margin: 48px 0 20px;
              padding-top: 48px;
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
              width: 28px;
              height: 3px;
              background: ${sc.color};
              border-radius: 2px;
              margin-bottom: 14px;
            }
            .program-content h3 {
              font-size: 16px;
              font-weight: 700;
              color: #ffffff;
              margin: 28px 0 10px;
              letter-spacing: -0.01em;
            }
            .program-content h4 {
              font-size: 13px;
              font-weight: 600;
              color: #3A3A3A;
              margin: 20px 0 8px;
            }
            .program-content p {
              font-size: 14px;
              color: #6B6B6B;
              line-height: 1.8;
              margin: 0 0 14px;
            }
            .program-content ul {
              margin: 0 0 16px;
              padding-left: 0;
              list-style: none;
            }
            .program-content ul li {
              font-size: 14px;
              color: #6B6B6B;
              line-height: 1.8;
              margin-bottom: 6px;
              padding-left: 16px;
              position: relative;
            }
            .program-content ul li::before {
              content: '';
              position: absolute;
              left: 0;
              top: 11px;
              width: 5px;
              height: 5px;
              border-radius: 50%;
              background: ${sc.color};
              opacity: 0.6;
            }
            .program-content ol {
              margin: 0 0 16px;
              padding-left: 20px;
            }
            .program-content ol li {
              font-size: 14px;
              color: #6B6B6B;
              line-height: 1.8;
              margin-bottom: 8px;
            }
            .program-content table {
              width: 100%;
              border-collapse: collapse;
              margin: 16px 0 20px;
              font-size: 13px;
              background: #FFFFFF;
              border-radius: 10px;
              overflow: hidden;
              border: 1px solid #E5E5E5;
            }
            .program-content th {
              text-align: left;
              padding: 10px 14px;
              background: #FFFFFF;
              color: #999999;
              font-size: 10px;
              font-weight: 700;
              letter-spacing: 0.1em;
              text-transform: uppercase;
              border-bottom: 1px solid #E5E5E5;
            }
            .program-content td {
              padding: 11px 14px;
              color: #3A3A3A;
              border-bottom: 1px solid #E5E5E5;
              vertical-align: top;
              line-height: 1.6;
            }
            .program-content td:first-child { color: #6B6B6B; }
            .program-content tr:last-child td { border-bottom: none; }
            .program-content strong { color: #ffffff; font-weight: 600; }
            .program-content hr { display: none; }
            .program-content blockquote {
              background: ${sc.bg};
              border-left: 3px solid ${sc.color};
              padding: 12px 16px;
              margin: 16px 0;
              font-size: 13px;
              color: #6B6B6B;
              border-radius: 0 8px 8px 0;
            }
            .program-content a { color: #1B6DFC; text-decoration: none; }
            .program-content code {
              background: #E5E5E5;
              padding: 2px 6px;
              border-radius: 4px;
              font-size: 12px;
              color: #1B6DFC;
            }
          `}</style>
          <div className="program-content" dangerouslySetInnerHTML={{ __html: html }} />
        </div>

        {/* CTA */}
        <div style={{ background: sc.ctaBg, border: `1px solid ${sc.ctaBorder}`, borderRadius: '14px', padding: '28px 28px 24px' }}>
          <p style={{ fontSize: '17px', fontWeight: 800, color: '#1A1A1A', letterSpacing: '-0.02em', marginBottom: '10px', lineHeight: 1.3 }}>
            Want the full coaching picture?
          </p>
          <p style={{ fontSize: '14px', color: sc.ctaText, lineHeight: 1.7, marginBottom: '24px' }}>
            This program covers the prescription. A coaching conversation covers why your body is in this state and what is driving it. Free. 30 minutes.
          </p>
          <a
            href="#"
            style={{
              display: 'block', width: '100%', padding: '16px', borderRadius: '10px',
              background: '#1B6DFC', color: '#1A1A1A',
              fontSize: '15px', fontWeight: 700, textAlign: 'center' as const,
              textDecoration: 'none', boxSizing: 'border-box' as const,
            }}
          >
            Book a free call with Kade
          </a>
        </div>

      </div>
    </div>
  )
}
