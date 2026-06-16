import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, AlertTriangle, CheckCircle } from 'lucide-react'
import { findLeakedTerms } from '@/lib/banned-client-terms'
import { DOCTRINE_VERSIONS, isDoctrineStale } from '@/lib/doctrine-versions'
import { PageHeader, Card, MONO_FONT } from '@/components/dashboard/ui'

/**
 * Banned-Terms Audit panel.
 *
 * Scans every active client's published Foundational Reading, Program
 * Reading, and Nutrition Reading against the shared banned-client-terms
 * list. Reports the leak rate and lists every leaked artefact with the
 * specific terms found so the coach can prioritise regenerates.
 *
 * Added 2026-06-09 (item A in the licensee-readiness plan). Driven by
 * Ruby-Cate's audit which surfaced that her FR + NR both leak internal
 * jargon banned for weekly-checkin-feedback for a month — because each
 * generator carried its own ad-hoc rules and FR/PR/NR had none.
 */

interface LeakReport {
  clientId: string
  clientName: string
  fr: { id: string; leaks: string[]; publishedAt: string | null; storedVersion: string | null; isStale: boolean } | null
  pr: { id: string; programName: string | null; leaks: string[]; publishedAt: string | null; storedVersion: string | null; isStale: boolean } | null
  nr: { id: string; planName: string | null; leaks: string[]; publishedAt: string | null; storedVersion: string | null; isStale: boolean } | null
}

export default async function BannedTermsAuditPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/dashboard/login')

  const admin = createAdminClient()

  const { data: clients } = await admin
    .from('clients')
    .select('id, name')
    .eq('active', true)
    .order('name')

  const reports: LeakReport[] = []
  let totalArtefactsChecked = 0
  let totalArtefactsLeaked = 0

  for (const client of clients ?? []) {
    const { data: cffsRows } = await admin
      .from('cffs')
      .select('id, cr_where_you_are, cr_what_your_body_is_telling_us, cr_what_were_focusing_on_first, cr_what_were_not_doing_yet, cr_coach_note, client_reading_published_at, fr_doctrine_version')
      .eq('client_id', client.id)
      .eq('is_archived', false)
      .not('client_reading_published_at', 'is', null)
      .order('client_reading_published_at', { ascending: false })
      .limit(1)
    let frReport: LeakReport['fr'] = null
    if (cffsRows?.[0]) {
      totalArtefactsChecked++
      const r = cffsRows[0]
      const leaks = unique([
        ...findLeakedTerms(r.cr_where_you_are ?? ''),
        ...findLeakedTerms(r.cr_what_your_body_is_telling_us ?? ''),
        ...findLeakedTerms(r.cr_what_were_focusing_on_first ?? ''),
        ...findLeakedTerms(r.cr_what_were_not_doing_yet ?? ''),
        ...findLeakedTerms(r.cr_coach_note ?? ''),
      ])
      if (leaks.length > 0) totalArtefactsLeaked++
      const storedVersion = r.fr_doctrine_version ?? null
      const isStale = isDoctrineStale(storedVersion, 'foundational_reading')
      if (leaks.length > 0 || isStale) frReport = { id: r.id, leaks, publishedAt: r.client_reading_published_at, storedVersion, isStale }
    }

    const { data: prog } = await admin
      .from('programs')
      .select('id, block_name, pr_why_this_block, pr_what_this_program_is_doing, pr_how_well_know_its_working, pr_what_were_not_doing_yet, pr_coach_note, program_reading_published_at, pr_doctrine_version')
      .eq('client_id', client.id)
      .eq('is_active', true)
      .not('program_reading_published_at', 'is', null)
      .maybeSingle()
    let prReport: LeakReport['pr'] = null
    if (prog) {
      totalArtefactsChecked++
      const leaks = unique([
        ...findLeakedTerms(prog.pr_why_this_block ?? ''),
        ...findLeakedTerms(prog.pr_what_this_program_is_doing ?? ''),
        ...findLeakedTerms(prog.pr_how_well_know_its_working ?? ''),
        ...findLeakedTerms(prog.pr_what_were_not_doing_yet ?? ''),
        ...findLeakedTerms(prog.pr_coach_note ?? ''),
      ])
      if (leaks.length > 0) totalArtefactsLeaked++
      const storedVersion = prog.pr_doctrine_version ?? null
      const isStale = isDoctrineStale(storedVersion, 'program_reading')
      if (leaks.length > 0 || isStale) prReport = { id: prog.id, programName: prog.block_name, leaks, publishedAt: prog.program_reading_published_at, storedVersion, isStale }
    }

    const { data: np } = await admin
      .from('nutrition_plans')
      .select('id, plan_name, nr_why_this_plan, nr_what_this_nutrition_is_doing, nr_how_well_know_its_working, nr_what_were_not_doing_yet, nr_coach_note, nutrition_reading_published_at, nutrition_reading_doctrine_version')
      .eq('client_id', client.id)
      .eq('is_active', true)
      .not('nutrition_reading_published_at', 'is', null)
      .maybeSingle()
    let nrReport: LeakReport['nr'] = null
    if (np) {
      totalArtefactsChecked++
      const leaks = unique([
        ...findLeakedTerms(np.nr_why_this_plan ?? ''),
        ...findLeakedTerms(np.nr_what_this_nutrition_is_doing ?? ''),
        ...findLeakedTerms(np.nr_how_well_know_its_working ?? ''),
        ...findLeakedTerms(np.nr_what_were_not_doing_yet ?? ''),
        ...findLeakedTerms(np.nr_coach_note ?? ''),
      ])
      if (leaks.length > 0) totalArtefactsLeaked++
      const storedVersion = np.nutrition_reading_doctrine_version ?? null
      const isStale = isDoctrineStale(storedVersion, 'nutrition_reading')
      if (leaks.length > 0 || isStale) nrReport = { id: np.id, planName: np.plan_name, leaks, publishedAt: np.nutrition_reading_published_at, storedVersion, isStale }
    }

    if (frReport || prReport || nrReport) {
      reports.push({ clientId: client.id, clientName: client.name, fr: frReport, pr: prReport, nr: nrReport })
    }
  }

  const leakRate = totalArtefactsChecked > 0 ? Math.round((totalArtefactsLeaked / totalArtefactsChecked) * 100) : 0

  // Doctrine version summary — count active artefacts on the current version
  // vs stale. Surfaces the bump impact without needing an Inngest pipeline.
  // Item (G), 2026-06-09.
  const doctrineSummary: { key: string; label: string; current: string; onCurrent: number; stale: number }[] = []
  let frOnCurrent = 0, frStale = 0
  let prOnCurrent = 0, prStale = 0
  let nrOnCurrent = 0, nrStale = 0
  for (const r of reports) {
    if (r.fr) (r.fr.isStale ? frStale++ : frOnCurrent++)
    if (r.pr) (r.pr.isStale ? prStale++ : prOnCurrent++)
    if (r.nr) (r.nr.isStale ? nrStale++ : nrOnCurrent++)
  }
  // Also count artefacts that PASSED the audit (no reports entry) — they are
  // necessarily on current version with no leaks, so all on-current.
  doctrineSummary.push({ key: 'foundational_reading', label: 'Foundational Reading', current: DOCTRINE_VERSIONS.foundational_reading, onCurrent: frOnCurrent, stale: frStale })
  doctrineSummary.push({ key: 'program_reading', label: 'Program Reading', current: DOCTRINE_VERSIONS.program_reading, onCurrent: prOnCurrent, stale: prStale })
  doctrineSummary.push({ key: 'nutrition_reading', label: 'Nutrition Reading', current: DOCTRINE_VERSIONS.nutrition_reading, onCurrent: nrOnCurrent, stale: nrStale })

  return (
    <div className="max-w-4xl">
      <Link href="/dashboard/system-health" className="inline-flex items-center gap-1 text-xs text-[#999999] hover:text-[#3A3A3A] transition-colors mb-4">
        <ChevronLeft size={13} /> System Health
      </Link>
      <PageHeader eyebrow="System Health" title="Banned-Terms Audit" subtitle={<span style={{ fontFamily: MONO_FONT, letterSpacing: '0.02em' }}>Scan every active client&apos;s published readings against the shared banned-client-terms list. Surfaces every leaked artefact so regenerates can be prioritised.</span>} />

      <div className="grid grid-cols-3 gap-3 mb-6">
        <Card padding="md">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#999999] mb-1">Active clients scanned</p>
          <p className="text-2xl font-bold text-[#1A1A1A]">{(clients ?? []).length}</p>
        </Card>
        <Card padding="md">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#999999] mb-1">Published artefacts checked</p>
          <p className="text-2xl font-bold text-[#1A1A1A]">{totalArtefactsChecked}</p>
        </Card>
        <Card padding="md">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#999999] mb-1">Leak rate</p>
          <p className={`text-2xl font-bold ${leakRate > 30 ? 'text-red-600' : leakRate > 10 ? 'text-amber-700' : 'text-green-700'}`}>{leakRate}%</p>
          <p className="text-[10px] text-[#6B6B6B] mt-1">{totalArtefactsLeaked} of {totalArtefactsChecked} artefacts</p>
        </Card>
      </div>

      <Card padding="md" className="mb-6">
        <p className="text-[10px] font-bold uppercase tracking-widest text-[#999999] mb-3">Doctrine version coverage</p>
        <div className="space-y-2">
          {doctrineSummary.map(d => {
            const total = d.onCurrent + d.stale
            const pct = total > 0 ? Math.round((d.onCurrent / total) * 100) : 100
            return (
              <div key={d.key} className="flex items-center gap-3 text-xs">
                <span className="text-[#1A1A1A] font-semibold min-w-[160px]">{d.label}</span>
                <span className="text-[#6B6B6B] font-mono text-[10px]">v{d.current}</span>
                <span className="flex-1 text-right text-[#6B6B6B]">
                  <span className={pct === 100 ? 'text-green-700 font-semibold' : 'text-amber-700 font-semibold'}>{d.onCurrent}</span>
                  <span> on current</span>
                  {d.stale > 0 && (
                    <>
                      <span className="text-[#D1D5DB] mx-2">·</span>
                      <span className="text-amber-700 font-semibold">{d.stale}</span>
                      <span> stale</span>
                    </>
                  )}
                </span>
              </div>
            )
          })}
        </div>
        <p className="text-[10px] text-[#999999] mt-3 leading-relaxed">
          A doctrine bump in <span className="font-mono">src/lib/doctrine-versions.ts</span> renders all rows on the old version stale.
          The audit panel below names the affected clients so the impact of a bump is visible before regenerate work begins.
        </p>
      </Card>

      {reports.length === 0 ? (
        <Card padding="lg" className="text-center">
          <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
          <p className="text-sm font-semibold text-[#1A1A1A]">All clean</p>
          <p className="text-xs text-[#6B6B6B] mt-1">No active client&apos;s published readings contain banned client-facing terms.</p>
        </Card>
      ) : (
        <>
          <div className="flex items-center gap-2 mb-3 text-xs text-[#6B6B6B]">
            <AlertTriangle size={14} className="text-amber-700" />
            <span>{reports.length} client{reports.length === 1 ? '' : 's'} have at least one leaked artefact. Click Regenerate on the relevant artefact to clear it.</span>
          </div>
          <div className="space-y-3">
            {reports.map(r => (
              <Card key={r.clientId} padding="md">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-bold text-[#1A1A1A]">{r.clientName}</p>
                  <Link href={`/dashboard/clients/${r.clientId}`} className="text-xs font-bold text-[#1B6DFC] hover:text-[#1057CC]">Open profile →</Link>
                </div>
                <div className="space-y-2">
                  {r.fr && <LeakRow label="Foundational Reading" terms={r.fr.leaks} clientHref={`/dashboard/clients/${r.clientId}#cffs`} publishedAt={r.fr.publishedAt} storedVersion={r.fr.storedVersion} isStale={r.fr.isStale} currentVersion={DOCTRINE_VERSIONS.foundational_reading} />}
                  {r.pr && <LeakRow label={`Program Reading${r.pr.programName ? ` (${r.pr.programName})` : ''}`} terms={r.pr.leaks} clientHref={`/dashboard/clients/${r.clientId}#training`} publishedAt={r.pr.publishedAt} storedVersion={r.pr.storedVersion} isStale={r.pr.isStale} currentVersion={DOCTRINE_VERSIONS.program_reading} />}
                  {r.nr && <LeakRow label={`Nutrition Reading${r.nr.planName ? ` (${r.nr.planName})` : ''}`} terms={r.nr.leaks} clientHref={`/dashboard/clients/${r.clientId}#nutrition`} publishedAt={r.nr.publishedAt} storedVersion={r.nr.storedVersion} isStale={r.nr.isStale} currentVersion={DOCTRINE_VERSIONS.nutrition_reading} />}
                </div>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function LeakRow({ label, terms, clientHref, publishedAt, storedVersion, isStale, currentVersion }: { label: string; terms: string[]; clientHref: string; publishedAt: string | null; storedVersion: string | null; isStale: boolean; currentVersion: string }) {
  const hasLeaks = terms.length > 0
  const flags = []
  if (hasLeaks) flags.push(`Leaked: ${terms.join(', ')}`)
  if (isStale) flags.push(`Stored v${storedVersion ?? 'unknown'} ≠ current v${currentVersion}`)
  return (
    <div className={`rounded-lg border px-3 py-2 flex items-center justify-between gap-3 flex-wrap ${hasLeaks ? 'border-amber-200 bg-amber-50/40' : 'border-blue-200 bg-blue-50/40'}`}>
      <div className="min-w-0">
        <p className={`text-xs font-bold ${hasLeaks ? 'text-amber-900' : 'text-blue-900'}`}>{label}</p>
        <p className="text-[10px] text-[#6B6B6B] mt-0.5">
          Published {publishedAt ? new Date(publishedAt).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' }) : 'unknown'}
          {flags.map((f, i) => <span key={i}> · <span className="font-mono">{f}</span></span>)}
        </p>
      </div>
      <Link href={clientHref} className={`shrink-0 text-[10px] font-bold uppercase tracking-widest ${hasLeaks ? 'text-amber-900 hover:text-amber-700' : 'text-blue-900 hover:text-blue-700'}`}>
        Open to regenerate →
      </Link>
    </div>
  )
}

function unique(arr: string[]): string[] {
  return Array.from(new Set(arr.map(t => t.toLowerCase())))
}
