import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import PrintButton from './print-button'

export default async function LeadReportPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { id } = await params

  const { data: lead } = await supabase
    .from('leads')
    .select('name, report_html, report_scheduled_at')
    .eq('id', id)
    .single()

  if (!lead || !lead.report_html) notFound()

  const scheduledAt = lead.report_scheduled_at
    ? new Date(lead.report_scheduled_at).toLocaleString('en-AU', {
        timeZone: 'Australia/Brisbane',
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      })
    : null

  return (
    <div style={{ minHeight: '100vh', background: '#FFFFFF' }}>
      {/* Toolbar */}
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
        background: '#111111', borderBottom: '1px solid #222222',
        padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <a href={`/dashboard/leads/${id}`} style={{ color: '#999999', fontSize: '13px', textDecoration: 'none' }}>
            ← {lead.name}
          </a>
          <span style={{ color: '#333333' }}>|</span>
          <span style={{ color: '#1B6DFC', fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            Performance Check-In Report
          </span>
          {scheduledAt && (
            <span style={{ color: '#999999', fontSize: '12px' }}>Sends {scheduledAt} Brisbane</span>
          )}
        </div>
        <PrintButton clientName={lead.name} />
      </div>

      {/* Report content */}
      <div id="report-content" style={{ paddingTop: '56px' }} dangerouslySetInnerHTML={{ __html: lead.report_html }} />

      <style>{`
        @media print {
          div[style*="position: fixed"] { display: none !important; }
          div[style*="paddingTop"] { padding-top: 0 !important; }
        }
      `}</style>
    </div>
  )
}
