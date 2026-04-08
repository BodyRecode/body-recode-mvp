import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { markdownToHtml } from '@/lib/markdown'
import fs from 'fs'
import path from 'path'

const STATE_LABELS: Record<string, string> = {
  depleted: 'Depleted',
  transitioning: 'Transitioning',
  ready: 'Ready',
}

const STATE_COLOURS: Record<string, { color: string; bg: string; border: string }> = {
  depleted: { color: '#ef4444', bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.25)' },
  transitioning: { color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.25)' },
  ready: { color: '#14b8a6', bg: 'rgba(20,184,166,0.08)', border: 'rgba(20,184,166,0.25)' },
}

export default async function ProgramPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const admin = createAdminClient()

  const { data: lead } = await admin
    .from('leads')
    .select('name, email, downsell_state, downsell_purchased')
    .eq('downsell_program_token', token)
    .maybeSingle()

  if (!lead || !lead.downsell_purchased) notFound()

  const state = lead.downsell_state as string
  const stateFile = STATE_LABELS[state] ? `${state}.md` : null
  if (!stateFile) notFound()

  const filePath = path.join(process.cwd(), 'src/content/programs', stateFile)
  const markdown = fs.readFileSync(filePath, 'utf-8')
  const html = markdownToHtml(markdown)

  const stateColour = STATE_COLOURS[state] ?? STATE_COLOURS.depleted
  const firstName = lead.name.split(' ')[0]
  const bookingUrl = `${process.env.NEXT_PUBLIC_APP_URL}/book?source=self_guided_downsell&state=${state}`

  return (
    <div style={{ background: '#0a0a0a', minHeight: '100vh', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      {/* Header bar */}
      <div style={{ background: '#111111', borderBottom: '1px solid #1e1e1e', padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <img src="https://bodyrecode.au/logo-teal.png" width="130" alt="Body Recode" />
        <span style={{
          fontSize: '11px',
          fontWeight: 700,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: stateColour.color,
          background: stateColour.bg,
          border: `1px solid ${stateColour.border}`,
          padding: '4px 12px',
          borderRadius: '999px',
        }}>
          {STATE_LABELS[state]} State Program
        </span>
      </div>

      {/* Welcome */}
      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '48px 24px 0' }}>
        <p style={{ color: '#888888', fontSize: '15px', lineHeight: 1.75, marginBottom: '8px' }}>
          Hi {firstName},
        </p>
        <p style={{ color: '#aaaaaa', fontSize: '15px', lineHeight: 1.75, marginBottom: '40px' }}>
          Your 12-week program is below. Bookmark this page. You can return to it any time.
        </p>
      </div>

      {/* Program content */}
      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '0 24px' }}>
        <style>{`
          .program-content h1 { display: none; }
          .program-content h2 {
            font-size: 13px;
            font-weight: 700;
            letter-spacing: 0.08em;
            text-transform: uppercase;
            color: #6b7280;
            margin: 48px 0 16px;
            padding-bottom: 8px;
            border-bottom: 1px solid #1e1e1e;
          }
          .program-content h2:first-of-type { margin-top: 0; }
          .program-content h3 {
            font-size: 15px;
            font-weight: 600;
            color: #e5e7eb;
            margin: 28px 0 10px;
          }
          .program-content h4 {
            font-size: 13px;
            font-weight: 600;
            color: #d1d5db;
            margin: 20px 0 8px;
          }
          .program-content p {
            font-size: 14px;
            color: #9ca3af;
            line-height: 1.8;
            margin: 0 0 14px;
          }
          .program-content ul {
            margin: 0 0 14px;
            padding-left: 20px;
          }
          .program-content ul li {
            font-size: 14px;
            color: #9ca3af;
            line-height: 1.8;
            margin-bottom: 4px;
          }
          .program-content ol {
            margin: 0 0 14px;
            padding-left: 20px;
          }
          .program-content ol li {
            font-size: 14px;
            color: #9ca3af;
            line-height: 1.8;
            margin-bottom: 8px;
          }
          .program-content table {
            width: 100%;
            border-collapse: collapse;
            margin: 16px 0 20px;
            font-size: 13px;
          }
          .program-content th {
            text-align: left;
            padding: 10px 14px;
            background: #161616;
            color: #6b7280;
            font-size: 11px;
            font-weight: 700;
            letter-spacing: 0.05em;
            text-transform: uppercase;
            border-bottom: 1px solid #222222;
          }
          .program-content td {
            padding: 10px 14px;
            color: #d1d5db;
            border-bottom: 1px solid #1a1a1a;
            vertical-align: top;
            line-height: 1.6;
          }
          .program-content tr:last-child td { border-bottom: none; }
          .program-content strong { color: #f3f4f6; font-weight: 600; }
          .program-content hr {
            border: none;
            border-top: 1px solid #1e1e1e;
            margin: 40px 0;
          }
          .program-content blockquote {
            background: #111111;
            border-left: 3px solid #374151;
            padding: 12px 16px;
            margin: 16px 0;
            font-size: 13px;
            color: #6b7280;
            border-radius: 0 8px 8px 0;
          }
          .program-content a { color: #10E1C2; text-decoration: none; }
          .program-content code {
            background: #1e1e1e;
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 12px;
            color: #d1d5db;
          }
        `}</style>
        <div
          className="program-content"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>

      {/* CTA */}
      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '48px 24px 80px' }}>
        <div style={{ background: '#111111', border: '1px solid #1e1e1e', borderRadius: '16px', padding: '32px' }}>
          <p style={{ fontSize: '16px', fontWeight: 700, color: '#ffffff', margin: '0 0 8px' }}>
            Want a more complete picture?
          </p>
          <p style={{ fontSize: '14px', color: '#888888', lineHeight: 1.75, margin: '0 0 24px' }}>
            This program is built for your state right now. If you want weekly interpretation of your signals, ongoing load adjustment, and a full coaching picture, the next step is a conversation.
          </p>
          <a
            href={bookingUrl}
            style={{
              display: 'inline-block',
              padding: '14px 28px',
              background: '#10E1C2',
              color: '#0a0a0a',
              fontSize: '14px',
              fontWeight: 700,
              textDecoration: 'none',
              borderRadius: '8px',
              letterSpacing: '0.02em',
            }}
          >
            Book a call with Kade
          </a>
        </div>
      </div>
    </div>
  )
}
