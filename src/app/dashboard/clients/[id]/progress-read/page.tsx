import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import ClientPageNav from '../client-page-nav'
import { tierAllows } from '@/lib/product-tier'
import { productTierForScope } from '@/lib/coach-tier'
import { requireCoachScope } from '@/lib/coach-scope'
import { PageHeader } from '@/components/dashboard/ui'
import { readPatternLabel } from '@/lib/pattern-doctrine'
import { BRAND } from '@/lib/brand-tokens'
import type { LintFinding } from '@/lib/reading-lint'
import GenerateProgressReadButton from './generate-progress-read-button'
import ProgressReadActions from './progress-read-actions'

/**
 * The Progress Read, coach view (Progress Read spec v2.4). One generation, two
 * levels: "Their version" shows exactly the sections they will see; everything
 * below it is for the coach only. Publish shows their version in their portal;
 * Notify emails them; both are the coach's clicks.
 */

/**
 * The plain-language names a CLIENT sees. Depleted, Transitioning, Ready.
 *
 * 23 September 2026: this page was showing these INSTEAD of the readiness
 * names, so a coach who had learned Remediation, Optimisation and
 * Post-Optimisation on every other screen arrived here and found the same
 * three states called something else, with nothing saying they were the same
 * three states.
 *
 * They are not wrong, they are for a different reader. A coach gets the
 * doctrine name, and the client's wording second, because this page is
 * specifically about what the client receives.
 */
const PUBLIC_STATE: Record<string, string> = { Remediation: 'Depleted', Optimisation: 'Transitioning', 'Post-Optimisation': 'Ready' }

/** Readiness names carry their locked colour. Nothing else on this page does. */
function readinessColourOnDark(state: string) {
  return state === 'Remediation' ? BRAND.remediationOnDark
    : state === 'Optimisation' ? BRAND.optimisationOnDark
    : state === 'Post-Optimisation' ? BRAND.postOptimisationOnDark
    : BRAND.darkInk
}
const HER_SECTIONS: Array<[string, string]> = [
  ['headline', 'Headline'],
  ['where_you_are_now', 'Where you are now'],
  ['what_has_changed', 'What has changed'],
  ['what_has_held', 'What has held'],
  ['your_pattern', 'Your pattern'],
  ['what_the_photos_and_measurements_show', 'What the photos and measurements show'],
  ['what_is_holding_things_back', 'What is holding things back'],
  ['tensions_and_tradeoffs', 'Tensions and trade-offs'],
]
const COACH_SECTIONS: Array<[string, string]> = [
  ['what_changed_coach', 'What changed'],
  ['primary_patterns_and_signals', 'Primary patterns and signals'],
  ['capacity_constraints_and_guardrails', 'Capacity constraints and guardrails'],
  ['risk_flags_and_watch_items', 'Risk flags and watch items'],
  ['pattern_watch_for', 'Watch for'],
  ['tensions_and_tradeoffs', 'Tensions and trade-offs'],
  ['explicit_non_directives', 'Explicit non-directives'],
  ['visual_signal_summary', 'What the photos showed'],
  ['closing_interpretive_notes', 'Closing interpretive notes'],
]

function fmt(d: string | null) {
  return d ? new Date(d).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' }) : ''
}

export default async function ProgressReadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const scope = await requireCoachScope()
  const canPrescribe = tierAllows(await productTierForScope(createAdminClient(), scope), 'coach')
  const admin = createAdminClient()
  const { data: client } = await admin.from('clients').select('id, name, onboarding_token').eq('id', id).maybeSingle()
  if (!client) notFound()

  const [{ data: checks }, { data: reads }] = await Promise.all([
    admin.from('progress_checks').select('id, status, form_version, submitted_at, created_at')
      .eq('client_id', id).order('created_at', { ascending: false }).limit(10),
    admin.from('progress_reads').select('*').eq('client_id', id).eq('is_archived', false)
      .order('generated_at', { ascending: false }).limit(5),
  ])
  const latestCheck = (checks ?? []).find(c => c.form_version === 'v2' && c.status === 'complete') ?? null
  const pendingCheck = (checks ?? []).find(c => c.form_version === 'v2' && c.status !== 'complete') ?? null
  const read = reads?.[0] ?? null
  const content = (read?.content ?? {}) as Record<string, unknown>
  const her = (content.for_her ?? {}) as Record<string, string>
  const change = (content.pattern_change ?? {}) as { changed?: boolean; evidence?: string; from?: string | null }
  const rules = ((content.rationale_summary as { operating_rules?: string[] } | undefined)?.operating_rules ?? []) as string[]
  const lint = (read?.lint_findings ?? []) as LintFinding[]
  const readIsForLatestCheck = !!read && !!latestCheck && read.progress_check_id === latestCheck.id

  return (
    <div className="max-w-[980px]">
      <PageHeader
        eyebrow={<Link href={`/dashboard/clients/${id}`} className="hover:text-[#FAFAF8] transition-colors">{client.name}</Link>}
        title="Progress Read"
        subtitle="The read re-derived from their Progress Check, measurements, photos and weekly check-ins since the last read."
        cta={client.onboarding_token ? (
          /* 23 Sep 2026: there was no way from here to what the CLIENT sees.
             A coach checking what they are about to send had to know the URL
             and build it by hand, which is the kind of gap a pilot coach hits
             on day one. Both are links because the portal page and the PDF are
             two different things and a coach may want to check either. */
          <div className="flex items-center gap-2 flex-wrap">
            <Link
              href={`/portal/${client.onboarding_token}/progress-read`}
              target="_blank"
              className="text-[12.5px] font-semibold px-3.5 py-[7px] rounded-lg border border-[#2A2F39] text-[#C2C6CC] hover:text-[#FAFAF8] hover:border-[#676D76]"
            >
              What they see
            </Link>
            <Link
              href={`/api/portal/${client.onboarding_token}/progress-read/pdf`}
              target="_blank"
              className="text-[12.5px] font-semibold px-3.5 py-[7px] rounded-lg border border-[#2A2F39] text-[#C2C6CC] hover:text-[#FAFAF8] hover:border-[#676D76]"
            >
              Their PDF
            </Link>
            <Link
              href={`/dashboard/clients/${id}/proof`}
              className="text-[12.5px] font-bold px-3.5 py-[7px] rounded-lg bg-[#FAFAF8] text-[#0B0D10]"
            >
              Twelve weeks
            </Link>
          </div>
        ) : undefined}
      />
      <ClientPageNav clientId={id} canPrescribe={canPrescribe} />

      {!latestCheck && (
        <div className="br-card p-6 mb-6">
          <p className="text-[13.5px] text-[#FAFAF8] font-semibold mb-1">No new Progress Check submitted yet</p>
          <p className="text-[13.5px] text-[#8A9099] leading-relaxed">
            {pendingCheck
              ? `Their Progress Check was sent ${fmt(pendingCheck.created_at)} and is ${pendingCheck.status === 'started' ? 'in progress' : 'not started'}. The Progress Read can be generated once they submit it.`
              : 'A Progress Read is generated from the near-full Progress Check (from 14 Sep 2026). Checks from before then use the Progress Read panel on the Training page.'}
          </p>
        </div>
      )}

      {latestCheck && (
        <div className="br-card p-6 mb-6 flex items-start justify-between gap-6 flex-wrap">
          <div>
            <p className="text-[13.5px] text-[#FAFAF8] font-semibold mb-1">Progress Check submitted {fmt(latestCheck.submitted_at)}</p>
            <p className="text-[13.5px] text-[#8A9099] leading-relaxed max-w-[520px]">
              {readIsForLatestCheck ? `Draft generated ${fmt(read!.generated_at)}. Regenerating keeps this one on record.` : 'Not read yet.'}
            </p>
          </div>
          <GenerateProgressReadButton progressCheckId={latestCheck.id} hasRead={readIsForLatestCheck} />
        </div>
      )}

      {read && (
        <>
          <div className="br-card overflow-hidden mb-6">
            <div className="px-6 pt-5 pb-5 grid grid-cols-1 sm:grid-cols-3 gap-5 border-b border-[#2A2F39]">
              <div>
                <p className="text-[11px] font-medium text-[#676D76] mb-1.5">Readiness</p>
                {/* The one place on this page colour is spent, because readiness is
                    the one thing on it that the colours were locked to mean. WHERE IT
                    CAME FROM STAYS GREY: two readiness colours either side of an arrow
                    read as two facts rather than as movement toward one. */}
                <p className="text-[16px] font-bold">
                  <span style={{ color: BRAND.darkInkSoft }}>{read.previous_body_state ?? 'Unknown'}</span>
                  <span style={{ color: BRAND.darkInkFaint }}> → </span>
                  <span style={{ color: readinessColourOnDark(read.body_state_classification) }}>{read.body_state_classification}</span>
                </p>
                <p className="text-[12.5px] text-[#8A9099]">
                  <span className="capitalize">{read.state_direction}</span>{read.state_clamped ? ' · held to one step by the rules' : ''}
                </p>
                <p className="text-[11px] text-[#676D76] mt-1">
                  They read it as {PUBLIC_STATE[read.previous_body_state ?? ''] ?? read.previous_body_state ?? 'Unknown'} → {PUBLIC_STATE[read.body_state_classification] ?? read.body_state_classification}
                </p>
              </div>
              <div>
                <p className="text-[11px] font-medium text-[#676D76] mb-1.5">Pattern</p>
                <p className="text-[16px] font-bold text-[#FAFAF8]">{readPatternLabel(read.pattern_classification) ?? 'Not named'}</p>
                <p className="text-[12.5px] text-[#8A9099]">
                  {read.pattern_classification !== 'Indeterminate' && read.pattern_confidence ? `Confidence ${read.pattern_confidence}` : ''}
                  {read.pattern_changed ? ` · changed from ${change.from}` : change.from ? ' · unchanged' : ' · first pattern named'}
                </p>
              </div>
              <div>
                <p className="text-[11px] font-medium text-[#676D76] mb-1.5">Four readiness ratings</p>
                <p className="text-[13.5px] text-[#C2C6CC] leading-relaxed">
                  Capacity {read.exposure_readiness_capacity} · Schedule {read.exposure_readiness_schedule}<br />
                  Regulation {read.exposure_readiness_regulation} · Behaviour {read.exposure_readiness_behaviour}
                </p>
              </div>
            </div>
            <div className="px-6 py-3.5 flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-2 flex-wrap text-[12.5px] text-[#8A9099]">
                {read.status === 'published'
                  ? <span className="font-semibold text-[#6FA98B]">Published {fmt(read.published_at)}</span>
                  : <span className="font-semibold text-[#8A9099]">Draft</span>}
                <span>· follows the {read.previous_read_kind === 'foundational' ? 'Foundational Read' : 'last Progress Read'}</span>
                <span>· photos {read.photos_used ?? 0}/3</span>
                <span>· {read.status === 'published' ? 'their version is in their portal' : 'not visible to them'}</span>
              </div>
              <ProgressReadActions readId={read.id} status={read.status} emailSentAt={read.email_sent_at} />
            </div>
          </div>

          {read.pattern_changed && change.evidence && (
            <div className="br-card-flagged px-5 py-4 mb-6">
              <p className="text-[11px] font-medium text-[#FAFAF8] mb-1.5">Why the pattern changed</p>
              <p className="text-[13.5px] text-[#C2C6CC] leading-relaxed">{change.evidence}</p>
            </div>
          )}

          {lint.length > 0 && (
            <div className="rounded-xl border border-[#4A3A22] bg-[#1A1E26] px-5 py-4 mb-6">
              <p className="text-[12.5px] font-medium text-[#E0A254] mb-2">Pre-publish check on their version</p>
              <ul className="space-y-1.5">
                {lint.map((f, i) => (
                  <li key={i} className="text-[13.5px] text-[#C2C6CC] leading-relaxed">
                    <span className="font-semibold">{f.severity === 'block' ? 'Must fix' : 'Check'}:</span> {f.message}{f.excerpt ? ` "${f.excerpt}"` : ''}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <h2 className="text-[16px] font-semibold text-[#FAFAF8] mb-1">Their version</h2>
          <p className="text-[12.5px] text-[#8A9099] mb-3">Exactly what they will see, written to them. Nothing below this box reaches them.</p>
          <div className="br-card p-6 mb-8 space-y-5">
            {HER_SECTIONS.filter(([k]) => her[k]).map(([k, label]) => (
              <div key={k}>
                <p className="text-[11px] font-medium text-[#676D76] mb-1">{label}</p>
                <p className={`leading-relaxed ${k === 'headline' ? 'text-[16px] font-semibold text-[#FAFAF8]' : 'text-[13.5px] text-[#C2C6CC]'}`}>{her[k]}</p>
              </div>
            ))}
          </div>

          <h2 className="text-[16px] font-semibold text-[#FAFAF8] mb-3">For you only</h2>
          {rules.length > 0 && (
            <div className="br-card px-6 py-4 mb-4">
              <p className="text-[11px] font-medium text-[#676D76] mb-2">Operating rules</p>
              <ul className="list-disc list-inside space-y-1 text-[13.5px] text-[#C2C6CC]">{rules.map((r, i) => <li key={i}>{r}</li>)}</ul>
            </div>
          )}
          <div className="br-card p-6 mb-6 space-y-5">
            {typeof content.pattern_competing_read === 'string' && content.pattern_competing_read !== 'None' && (
              <div>
                <p className="text-[11px] font-medium text-[#676D76] mb-1">{read.pattern_classification === 'Indeterminate' ? 'Leaning toward' : 'Competing read'}</p>
                <p className="text-[13.5px] text-[#C2C6CC]">{content.pattern_competing_read}</p>
              </div>
            )}
            {COACH_SECTIONS.filter(([k]) => typeof content[k] === 'string' && (content[k] as string).trim()).map(([k, label]) => (
              <div key={k}>
                <p className="text-[11px] font-medium text-[#676D76] mb-1">{label}</p>
                <p className="text-[13.5px] text-[#C2C6CC] leading-relaxed whitespace-pre-line">{content[k] as string}</p>
              </div>
            ))}
          </div>

          {read.comparison_text && (
            <details className="br-card px-6 py-4 mb-10">
              <summary className="text-[13.5px] font-medium text-[#FAFAF8] cursor-pointer">The computed comparison the read was given</summary>
              <pre className="mt-3 text-[12.5px] text-[#C2C6CC] whitespace-pre-wrap leading-relaxed font-sans">{read.comparison_text}</pre>
            </details>
          )}
        </>
      )}
    </div>
  )
}
