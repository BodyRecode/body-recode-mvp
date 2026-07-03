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

      <div className="mb-8 bg-white border border-stone-200 rounded-2xl overflow-hidden">
        <div className="px-5 py-3 border-b border-stone-200 bg-stone-50 flex items-baseline justify-between">
          <h3 className="text-[13px] font-bold text-stone-900 uppercase tracking-widest">Recent log · last 30</h3>
          <span className="text-[11px] text-stone-500 font-mono">Newest first</span>
        </div>
        {recentLogs.length === 0 ? (
          <div className="p-8 text-center text-[13px] text-stone-500">No SMS activity yet. Consented scorecard + challenge submissions will land here.</div>
        ) : (
          <ul className="divide-y divide-stone-100">
            {recentLogs.map((row) => (
              <LogRowView key={row.id} row={row} />
            ))}
          </ul>
        )}
      </div>

      <div className="mb-8 p-4 rounded-xl border border-stone-200 bg-stone-50 text-[12px] text-stone-600 leading-relaxed">
        <p><strong className="text-stone-900">How this works.</strong> Every outbound SMS routes through <code className="bg-white px-1 py-0.5 rounded border border-stone-200">sendLeadSms()</code> which checks the lead&apos;s <code className="bg-white px-1 py-0.5 rounded border border-stone-200">sms_opt_in_at</code>, hard-stops on <code className="bg-white px-1 py-0.5 rounded border border-stone-200">sms_opted_out_at</code>, enforces frequency caps (1 per 24h + 3 per 7d), then logs to <code className="bg-white px-1 py-0.5 rounded border border-stone-200">sms_logs</code>. The Inngest function respects AEST send-window rules and queues to next 08:30 if outside window.</p>
        <p className="mt-2">Compliance: <strong className="text-stone-900">STOP / STOPALL / UNSUBSCRIBE / CANCEL / QUIT / END / REVOKE</strong> all trigger hard opt-out at <Link href="/dashboard/leads" className="text-blue-600 hover:text-blue-700 underline">the lead level</Link>. Non-STOP replies email you at your admin address so you can respond from the CRM inbox.</p>
      </div>

      <Link href="/dashboard" className="text-[12px] text-blue-600 hover:text-blue-700 underline">← Back to dashboard</Link>
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
    default: 'text-stone-900',
    stone: 'text-stone-400',
    green: 'text-green-700',
    amber: 'text-amber-700',
    red: 'text-red-700',
    blue: 'text-blue-700',
  }[tone]
  return (
    <div className="bg-white border border-stone-200 rounded-xl p-3">
      <div className="text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-1">{label}</div>
      <div className={`text-[22px] font-bold ${valueColor} font-mono`}>{prefix ?? ''}{value.toLocaleString?.() ?? value}</div>
      {hint && <div className="text-[10px] text-stone-500 mt-0.5">{hint}</div>}
    </div>
  )
}

function LogRowView({ row }: { row: LogRow }) {
  const isOutbound = row.direction === 'outbound'
  const statusTone =
    row.status === 'sent' ? 'text-green-700 bg-green-100'
      : row.status === 'delivered' ? 'text-green-700 bg-green-100'
      : row.status === 'failed' || row.status === 'undelivered' ? 'text-red-700 bg-red-100'
      : row.status === 'queued' ? 'text-blue-700 bg-blue-100'
      : row.status === 'received' ? 'text-purple-700 bg-purple-100'
      : 'text-stone-600 bg-stone-100'
  return (
    <li className="px-5 py-3">
      <div className="flex items-center gap-3 mb-1 flex-wrap">
        <span className={`text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded ${isOutbound ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
          {row.direction}
        </span>
        <span className={`text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded ${statusTone}`}>
          {row.status ?? 'unknown'}
        </span>
        {row.trigger && <span className="text-[10px] font-mono text-stone-500">{row.trigger}</span>}
        <span className="text-[10px] font-mono text-stone-400 ml-auto">{new Date(row.created_at).toLocaleString('en-AU', { timeZone: 'Australia/Brisbane' })} AEST</span>
      </div>
      <div className="text-[12px] font-mono text-stone-700 break-all">
        {isOutbound ? `→ ${row.to_number}` : `← ${row.from_number}`}
        {row.lead_id && (
          <>
            {' · '}
            <Link href={`/dashboard/leads/${row.lead_id}`} className="text-blue-600 hover:text-blue-700 underline">
              lead
            </Link>
          </>
        )}
      </div>
      <div className="text-[13px] text-stone-800 mt-1">{row.body}</div>
      {row.error && <div className="text-[11px] text-red-700 mt-1 font-mono">{row.error}</div>}
    </li>
  )
}
