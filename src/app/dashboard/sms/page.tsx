import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { PageHeader } from '@/components/dashboard/ui'

export const metadata = { title: 'SMS pulse · Dashboard' }
export const dynamic = 'force-dynamic'
export const revalidate = 0

type LogRow = {
  id: string
  lead_id: string | null
  direction: 'outbound' | 'inbound'
  trigger: string | null
  to_number: string
  from_number: string | null
  body: string
  status: string | null
  error: string | null
  sent_at: string | null
  created_at: string
}

export default async function SmsPulsePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/dashboard/login')

  const admin = createAdminClient()

  const now = new Date()
  const dayAgoIso = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString()
  const weekAgoIso = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()

  const [sent24hRes, delivered24hRes, failed24hRes, sent7dRes, optOuts7dRes, inbound24hRes, recentLogsRes] = await Promise.all([
    admin.from('sms_logs').select('id', { count: 'exact', head: true }).eq('direction', 'outbound').gte('created_at', dayAgoIso),
    admin.from('sms_logs').select('id', { count: 'exact', head: true }).eq('direction', 'outbound').eq('status', 'sent').gte('created_at', dayAgoIso),
    admin.from('sms_logs').select('id', { count: 'exact', head: true }).eq('direction', 'outbound').eq('status', 'failed').gte('created_at', dayAgoIso),
    admin.from('sms_logs').select('id', { count: 'exact', head: true }).eq('direction', 'outbound').gte('created_at', weekAgoIso),
    admin.from('leads').select('id', { count: 'exact', head: true }).not('sms_opted_out_at', 'is', null).gte('sms_opted_out_at', weekAgoIso),
    admin.from('sms_logs').select('id', { count: 'exact', head: true }).eq('direction', 'inbound').gte('created_at', dayAgoIso),
    admin.from('sms_logs').select('*').order('created_at', { ascending: false }).limit(30),
  ])

  const sent24h = sent24hRes.count ?? 0
  const delivered24h = delivered24hRes.count ?? 0
  const failed24h = failed24hRes.count ?? 0
  const sent7d = sent7dRes.count ?? 0
  const optOuts7d = optOuts7dRes.count ?? 0
  const inbound24h = inbound24hRes.count ?? 0
  const recentLogs = (recentLogsRes.data ?? []) as LogRow[]

  const optInLeadsRes = await admin
    .from('leads')
    .select('id', { count: 'exact', head: true })
    .not('sms_opt_in_at', 'is', null)
    .is('sms_opted_out_at', null)
  const optInLeads = optInLeadsRes.count ?? 0

  return (
    <div className="max-w-[1100px]">
      <PageHeader
        eyebrow="Dashboard · SMS pulse"
        title="Speed-to-lead SMS"
        subtitle="Contact-within-60s pipeline. Every outbound send is consent-checked, frequency-capped, and audit-logged. STOP replies hard-opt-out."
      />

      <div className="mb-6 grid grid-cols-2 md:grid-cols-4 gap-3">
        <Tile label="Sent 24h" value={sent24h} tone="default" />
        <Tile
          label="Delivered 24h"
          value={delivered24h}
          hint={sent24h > 0 ? `${Math.round((delivered24h / sent24h) * 100)}% of sent` : undefined}
          tone={sent24h === 0 ? 'stone' : delivered24h === sent24h ? 'green' : 'amber'}
        />
        <Tile label="Failed 24h" value={failed24h} tone={failed24h > 0 ? 'red' : 'green'} />
        <Tile label="Inbound 24h" value={inbound24h} hint="Non-STOP replies" tone={inbound24h > 0 ? 'blue' : 'stone'} />
        <Tile label="Sent 7d" value={sent7d} tone="default" />
        <Tile label="Opt-outs 7d" value={optOuts7d} tone={optOuts7d > 3 ? 'amber' : 'stone'} />
        <Tile label="Consented leads" value={optInLeads} hint="Opted in + not opted out" tone="default" />
        <Tile label="Cost 7d (AUD)" value={(sent7d * 0.06).toFixed(2)} hint="~$0.06 / segment" tone="stone" prefix="$" />
      </div>

      <div className="mb-8 br-card overflow-hidden">
        <div className="px-5 py-3 border-b border-[#E8EAEE] bg-[#FBFCFD] flex items-baseline justify-between">
          <h3 className="text-[13.5px] font-semibold text-[#141821] tracking-[-0.015em]">Recent log · last 30</h3>
          <span className="text-[11px] text-[#666D7A] font-mono">Newest first</span>
        </div>
        {recentLogs.length === 0 ? (
          <div className="p-8 text-center text-[13px] text-[#666D7A]">No SMS activity yet. Consented scorecard + challenge submissions will land here.</div>
        ) : (
          <ul className="divide-y divide-[#F4F6F9]">
            {recentLogs.map((row) => (
              <LogRowView key={row.id} row={row} />
            ))}
          </ul>
        )}
      </div>

      <div className="mb-8 p-4 rounded-xl border border-[#E8EAEE] bg-[#FBFCFD] text-[12px] text-[#666D7A] leading-relaxed">
        <p><strong className="text-[#141821]">How this works.</strong> Every outbound SMS routes through <code className="bg-white px-1 py-0.5 rounded border border-[#E8EAEE]">sendLeadSms()</code> which checks the lead&apos;s <code className="bg-white px-1 py-0.5 rounded border border-[#E8EAEE]">sms_opt_in_at</code>, hard-stops on <code className="bg-white px-1 py-0.5 rounded border border-[#E8EAEE]">sms_opted_out_at</code>, enforces frequency caps (1 per 24h + 3 per 7d), then logs to <code className="bg-white px-1 py-0.5 rounded border border-[#E8EAEE]">sms_logs</code>. The Inngest function respects AEST send-window rules and queues to next 08:30 if outside window.</p>
        <p className="mt-2">Compliance: <strong className="text-[#141821]">STOP / STOPALL / UNSUBSCRIBE / CANCEL / QUIT / END / REVOKE</strong> all trigger hard opt-out at <Link href="/dashboard/leads" className="text-[#1560E0] hover:text-[#1056D6] underline">the lead level</Link>. Non-STOP replies email you at your admin address so you can respond from the CRM inbox.</p>
      </div>

      <Link href="/dashboard" className="text-[12px] text-[#1560E0] hover:text-[#1056D6] underline">← Back to dashboard</Link>
    </div>
  )
}

function Tile({
  label,
  value,
  hint,
  tone = 'default',
  prefix,
}: {
  label: string
  value: number | string
  hint?: string
  tone?: 'default' | 'stone' | 'green' | 'amber' | 'red' | 'blue'
  prefix?: string
}) {
  const valueColor = {
    default: 'text-[#141821]',
    stone: 'text-[#98A0AD]',
    green: 'text-[#177245]',
    amber: 'text-[#A96A12]',
    red: 'text-[#C82626]',
    blue: 'text-[#1056D6]',
  }[tone]
  return (
    <div className="br-card p-3">
      <div className="text-[10px] font-medium text-[#666D7A] mb-1">{label}</div>
      <div className={`text-[22px] font-bold ${valueColor} font-mono`}>{prefix ?? ''}{value.toLocaleString?.() ?? value}</div>
      {hint && <div className="text-[10px] text-[#666D7A] mt-0.5">{hint}</div>}
    </div>
  )
}

function LogRowView({ row }: { row: LogRow }) {
  const isOutbound = row.direction === 'outbound'
  const statusTone =
    row.status === 'sent' ? 'text-[#177245] bg-[#D8EFE1]'
      : row.status === 'delivered' ? 'text-[#177245] bg-[#D8EFE1]'
      : row.status === 'failed' || row.status === 'undelivered' ? 'text-[#C82626] bg-[#FBDCDC]'
      : row.status === 'queued' ? 'text-[#1056D6] bg-[#DDE9FD]'
      : row.status === 'received' ? 'text-purple-700 bg-purple-100'
      : 'text-[#666D7A] bg-[#F4F6F9]'
  return (
    <li className="px-5 py-3">
      <div className="flex items-center gap-3 mb-1 flex-wrap">
        <span className={`text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded ${isOutbound ? 'bg-[#DDE9FD] text-[#1056D6]' : 'bg-purple-100 text-purple-700'}`}>
          {row.direction}
        </span>
        <span className={`text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded ${statusTone}`}>
          {row.status ?? 'unknown'}
        </span>
        {row.trigger && <span className="text-[10px] font-mono text-[#666D7A]">{row.trigger}</span>}
        <span className="text-[10px] font-mono text-[#98A0AD] ml-auto">{new Date(row.created_at).toLocaleString('en-AU', { timeZone: 'Australia/Brisbane' })} AEST</span>
      </div>
      <div className="text-[12px] font-mono text-[#141821] break-all">
        {isOutbound ? `→ ${row.to_number}` : `← ${row.from_number}`}
        {row.lead_id && (
          <>
            {' · '}
            <Link href={`/dashboard/leads/${row.lead_id}`} className="text-[#1560E0] hover:text-[#1056D6] underline">
              lead
            </Link>
          </>
        )}
      </div>
      <div className="text-[13px] text-[#141821] mt-1">{row.body}</div>
      {row.error && <div className="text-[11px] text-[#C82626] mt-1 font-mono">{row.error}</div>}
    </li>
  )
}
