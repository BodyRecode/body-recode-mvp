import Link from 'next/link'
import { getLaunchSnapshot } from '@/lib/saas-launch'
import { PHASES } from '@/lib/saas-buildout-manifest'
import { boardStats, phaseProgress } from '@/lib/buildout-types'
import { BUILD_PHASES } from '@/lib/build-sequence'
import {
  PASS_MARK_GO, PASS_MARK_RETHINK, PRICE_YEAR, PRICE_REACTION_OPTIONS, START_OPTIONS, VOICE_OPTIONS,
  type Split,
} from '@/lib/rey-founding'
import {
  Card,
  PageHeader,
  SectionLabel,
  StatCard,
  Pill,
  MONO_FONT,
} from '@/components/dashboard/ui'
import {
  Rocket,
  Handshake,
  ClipboardCheck,
  FileText,
  Building2,
  AlertTriangle,
  ArrowRight,
  Tag,
} from 'lucide-react'

/**
 * The SaaS launch board.
 *
 * This is NOT a build board. `/dashboard/build`
 * already tracks what has been built, phase by phase, and stays the source of
 * truth for that. This page answers the other question, the one that has never
 * had a home: is anybody buying it, and what is actually in the way.
 *
 * Every number is read live (see `saas-launch.ts`). Three of the four failures
 * this business has had were a plan reporting its own status and being wrong.
 */

export const dynamic = 'force-dynamic'
export const revalidate = 0

export const metadata = { title: 'SaaS Launch · Body Recode' }

export default async function SaasLaunchPage() {
  const snap = await getLaunchSnapshot()

  const build = boardStats(BUILD_PHASES)
  const companyPhase = PHASES.find((p) => p.title === 'The company and the name')
  const companyProgress = companyPhase ? phaseProgress(companyPhase) : null

  // The gate, stated as a fact rather than a feeling.
  const gateOpen = snap.outsideCoaches > 0

  return (
    <div>
      <PageHeader
        eyebrow="Body Recode SaaS"
        title="Launch"
        subtitle={
          <>
            The read, sold as a product to coaches who are not you. This board tracks whether anyone
            is buying it. What has been <em>built</em> lives on the{' '}
            <Link
              href="/dashboard/build"
              className="text-[#1560E0] hover:text-[#1056D6] underline"
            >
              Build board
            </Link>
            , and stays there. Every number below is counted from real rows at the moment you opened
            this page.
          </>
        }
        accent="teal"
      />

      {snap.errors.length > 0 && (
        <Card className="mb-6" accent="red" tint>
          <p className="text-[12.5px] text-[#8A2B12] leading-relaxed">
            <strong>Some counts could not be read</strong>, so they are showing as zero rather than
            as the truth: {snap.errors.join(' · ')}
          </p>
        </Card>
      )}

      <FoundingTest founding={snap.founding} />

      {/* ============================================================
       * THE GATE. Top of the page on purpose. Nothing below it moves.
       * ============================================================ */}
      <SectionLabel>The gate</SectionLabel>
      <Card className="mb-8" accent={gateOpen ? 'teal' : 'red'} tint>
        <div className="flex items-start gap-4 flex-wrap">
          <span
            className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
            style={{
              background: gateOpen ? 'rgba(27,109,252,0.12)' : 'rgba(220,38,38,0.10)',
            }}
          >
            {gateOpen ? (
              <Rocket size={17} className="text-[#1B6DFC]" />
            ) : (
              <AlertTriangle size={17} className="text-[#DC2626]" />
            )}
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="text-[16px] font-semibold text-[#141821] leading-snug mb-1.5">
              {gateOpen
                ? `${snap.outsideCoaches} coach${snap.outsideCoaches === 1 ? '' : 'es'} who ${snap.outsideCoaches === 1 ? 'is' : 'are'} not you ${snap.outsideCoaches === 1 ? 'has' : 'have'} an account`
                : 'No coach who is not you has ever run the read'}
            </h2>
            <p className="text-[13.5px] text-[#4A5160] leading-relaxed max-w-3xl">
              {gateOpen ? (
                <>
                  The gate is open. The question stops being whether anyone will use it and becomes
                  whether they keep paying for it.
                </>
              ) : (
                <>
                  This is the only thing that matters and it has never been true. The engine works,
                  the loop works, the multi-coach plumbing shipped in July. The Collective was 86%
                  built and produced one enquiry in six weeks, because the building happened before
                  anyone was asked whether they wanted it. Building more will not move this.
                </>
              )}
            </p>
            <p className="text-[11px] text-[#98A0AD] mt-2.5">
              Measured as coach accounts on the platform other than your own: {snap.tenantsTotal}{' '}
              configured in total.
            </p>
          </div>
        </div>
      </Card>

      {/* ============================================================
       * THE UNSTAFFED FUNCTION. Commercial. Nobody holds it.
       * ============================================================ */}
      <SectionLabel>Demand · the function nobody holds</SectionLabel>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <StatCard
          label="Coach enquiries, all time"
          value={snap.applicationsTotal}
          sub="Via the Collective form. There is no Body Recode enquiry route"
          accent={snap.applicationsTotal > 0 ? 'teal' : 'red'}
          icon={Handshake}
        />
        <StatCard
          label="Never actioned"
          value={snap.applicationsUnactioned}
          sub={
            snap.oldestUnactionedDays === null
              ? 'Nothing waiting'
              : `Oldest has waited ${snap.oldestUnactionedDays} days`
          }
          accent={snap.applicationsUnactioned > 0 ? 'red' : 'teal'}
          icon={AlertTriangle}
        />
        <StatCard
          label="Coaches onboarded"
          value={snap.outsideCoaches}
          sub="Not counting your own account"
          accent={snap.outsideCoaches > 0 ? 'teal' : 'red'}
          icon={Rocket}
        />
        <StatCard
          label="Build complete"
          value={`${build.pct}%`}
          sub={`${build.shipped} of ${build.shipped + build.inProgress + build.planned + build.blocked + build.deferred} steps shipped`}
          accent="neutral"
          href="/dashboard/build"
          icon={ClipboardCheck}
        />
      </div>

      <Card className="mb-8">
        <p className="text-[13.5px] text-[#4A5160] leading-relaxed mb-4 max-w-3xl">
          Six functions run this business. You hold four of them, your accountant takes finance and
          structure, your lawyer takes legal. <strong className="text-[#141821]">Commercial has
          never been staffed</strong> and it is the one the gate is waiting on.
          <br /><br />
          <strong className="text-[#141821]">Read this list carefully.</strong> These people applied
          through the Collective form, which is the Performance Coaching product white-labelled, not
          the read. <strong className="text-[#141821]">There is no way at all for a coach to enquire
          about Body Recode</strong> — no page, no form, no price. That is not a small gap. It means
          the read has never been offered to anyone, so it has never been refused either.
        </p>

        {snap.applications.length === 0 ? (
          <p className="text-[13.5px] text-[#98A0AD] italic">
            No applications yet. Nothing to answer.
          </p>
        ) : (
          <div className="overflow-x-auto -mx-1">
            <table className="w-full text-[12.5px] min-w-[560px]">
              <thead>
                <tr className="text-left text-[10px] text-[#98A0AD] border-b border-[#E8EAEE]">
                  <th className="py-2 pr-3 font-semibold">Who</th>
                  <th className="py-2 pr-3 font-semibold">Focus</th>
                  <th className="py-2 pr-3 font-semibold">Self-scored</th>
                  <th className="py-2 pr-3 font-semibold">Waiting</th>
                  <th className="py-2 font-semibold">State</th>
                </tr>
              </thead>
              <tbody>
                {snap.applications.map((a) => (
                  <tr key={a.id} className="border-b border-[#F2F3F6] last:border-0 align-top">
                    <td className="py-2.5 pr-3">
                      <span className="text-[#141821] font-medium">{a.name ?? 'Unnamed'}</span>
                      {a.businessName && (
                        <span className="block text-[11px] text-[#98A0AD]">{a.businessName}</span>
                      )}
                    </td>
                    <td className="py-2.5 pr-3 text-[#4A5160]">{a.modality ?? '—'}</td>
                    <td className="py-2.5 pr-3 text-[#4A5160]">{a.tier ?? '—'}</td>
                    <td
                      className="py-2.5 pr-3 text-[#4A5160]"
                      style={{ fontFamily: MONO_FONT, fontVariantNumeric: 'tabular-nums' }}
                    >
                      {a.ageDays}d
                    </td>
                    <td className="py-2.5">
                      {a.unactioned ? (
                        <Pill accent="red">Never actioned</Pill>
                      ) : (
                        <Pill accent="teal">{a.status}</Pill>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {snap.applicationsUnactioned > 0 && (
          <p className="text-[12.5px] text-[#8A2B12] leading-relaxed mt-4 pt-4 border-t border-[#F2F3F6]">
            <strong>The next action on this whole board is a conversation, not a commit.</strong>{' '}
            Answering one of these costs nothing and is the only thing that can open the gate.
          </p>
        )}
      </Card>

      {/* ============================================================
       * WHAT THE ENGINE HAS ACTUALLY DONE. The evidence, for the
       * briefs and for anyone who asks whether it runs.
       * ============================================================ */}
      <SectionLabel>Evidence the engine runs</SectionLabel>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
        <StatCard label="Assessments completed" value={snap.assessments} icon={ClipboardCheck} />
        <StatCard label="Plans generated" value={snap.plansGenerated} sub="Training and nutrition" />
        <StatCard label="Weekly check-ins processed" value={snap.checkins} />
        <StatCard label="Clients on the platform" value={snap.clients} sub="The development cohort" />
      </div>
      <Card className="mb-8" padding="md">
        <p className="text-[12.5px] text-[#666D7A] leading-relaxed">
          These are the figures that go in anything shown to an outsider, because they describe what
          the system does without describing how big the business is. Client counts and revenue stay
          off investor-facing documents deliberately: the cohort exists to develop and validate the
          engine against real longitudinal data, not to be a revenue business.
        </p>
      </Card>

      {/* ============================================================
       * THE BUSINESS LAYER. Not a build problem. James and Oliver.
       * ============================================================ */}
      <SectionLabel>The company · what has to exist before anyone can buy in</SectionLabel>
      <Card className="mb-8">
        <div className="flex items-start gap-4 flex-wrap mb-4">
          <span
            className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: 'rgba(183,121,31,0.12)' }}
          >
            <Building2 size={17} className="text-[#B7791F]" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[13.5px] text-[#4A5160] leading-relaxed max-w-3xl">
              Body Recode trades as a sole trader with the engine owned personally and no registered
              name. No software company signs a health-data agreement with an unincorporated sole
              trader, and there is nothing an investor could buy into.{' '}
              <strong className="text-[#141821]">
                This is the first stage, not a later one
              </strong>
              , and it is not development work. It runs alongside everything else and it has lead
              time that cannot be compressed.
            </p>
            {companyProgress && (
              <p className="text-[11px] text-[#98A0AD] mt-2.5">
                {companyProgress.shipped} of {companyProgress.total} steps shipped on this phase.
              </p>
            )}
          </div>
        </div>

        {companyPhase && (
          <ul className="space-y-2">
            {companyPhase.steps.map((s) => (
              <li key={s.id} className="flex items-start gap-2.5">
                <span
                  className="mt-[6px] w-1.5 h-1.5 rounded-full shrink-0"
                  style={{
                    background:
                      s.status === 'shipped'
                        ? '#1B6DFC'
                        : s.status === 'blocked'
                          ? '#DC2626'
                          : '#C9CFD9',
                  }}
                />
                <div className="min-w-0">
                  <span className="text-[12.5px] text-[#141821]">{s.title}</span>
                  <span className="text-[12.5px] text-[#98A0AD]"> — {s.description}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {/* ============================================================
       * WHERE THE WRITING LIVES.
       * ============================================================ */}
      <SectionLabel>The documents</SectionLabel>
      <Card padding="md">
        <ul className="space-y-2.5 text-[12.5px]">
          <li className="flex items-start gap-2.5">
            <FileText size={14} className="text-[#98A0AD] mt-[3px] shrink-0" />
            <span className="text-[#4A5160]">
              <strong className="text-[#141821]">Information brief</strong> — the three-page document
              for anyone deciding whether to back this. No client counts, no revenue.{' '}
              <code className="bg-[#F4F6F9] px-1 py-0.5 rounded text-[11px]">
                10_INVESTOR/2026-09-12_Body_Recode_Information_Brief.pdf
              </code>
            </span>
          </li>
          <li className="flex items-start gap-2.5">
            <FileText size={14} className="text-[#98A0AD] mt-[3px] shrink-0" />
            <span className="text-[#4A5160]">
              <strong className="text-[#141821]">Read as a Product roadmap</strong> — the strategy
              this board operationalises.{' '}
              <code className="bg-[#F4F6F9] px-1 py-0.5 rounded text-[11px]">
                06_SAAS_PLATFORM_BUILD/2026-09-01_Read_As_A_Product_Roadmap.md
              </code>
            </span>
          </li>
          <li className="flex items-start gap-2.5">
            <FileText size={14} className="text-[#98A0AD] mt-[3px] shrink-0" />
            <span className="text-[#4A5160]">
              <strong className="text-[#141821]">Explained Twice</strong> — the same product in plain
              words and in investor language. Your own prep, not a handout.{' '}
              <code className="bg-[#F4F6F9] px-1 py-0.5 rounded text-[11px]">
                10_INVESTOR/2026-09-05_Explained_Twice.pdf
              </code>
            </span>
          </li>
          <li className="flex items-start gap-2.5">
            <ArrowRight size={14} className="text-[#98A0AD] mt-[3px] shrink-0" />
            <Link
              href="/dashboard/build"
              className="text-[#1560E0] hover:text-[#1056D6] underline"
            >
              The Build board, everything being built in the order it gets built
            </Link>
          </li>
        </ul>
      </Card>
    </div>
  )
}

/* ============================================================
 * THE REY PRICE TEST. Added 14 Sep 2026.
 *
 * The pass mark was agreed before the page went live, and it is printed here
 * so it cannot be quietly moved once results arrive. Women only: the test is
 * for her, and men are shown separately so they cannot flatter or sink it.
 * ============================================================ */
const pct = (s: Split) => (s.saw ? Math.round((s.joined / s.saw) * 100) : 0)
const oneIn = (r: number) => `1 in ${Math.round(1 / r)}`

function Tally({ counts, options }: { counts: Record<string, number>; options: readonly { value: string; label: string }[] }) {
  const total = Object.values(counts).reduce((a, b) => a + b, 0)
  if (total === 0) return <p className="text-[12.5px] text-[#98A0AD] italic">No answers yet.</p>
  return (
    <div className="space-y-1.5">
      {options.map((o) => {
        const n = counts[o.value] ?? 0
        return (
          <div key={o.value} className="flex items-center gap-2 text-[12.5px]">
            <span className="w-40 shrink-0 text-[#4A5160] truncate">{o.label}</span>
            <span className="flex-1 h-2 rounded-full bg-[#EEF0F3] overflow-hidden">
              <span className="block h-full bg-[#1B6DFC]" style={{ width: `${(n / total) * 100}%` }} />
            </span>
            <span className="w-8 text-right text-[#141821] font-semibold" style={{ fontVariantNumeric: 'tabular-nums' }}>{n}</span>
          </div>
        )
      })}
    </div>
  )
}

function FoundingTest({ founding: f }: { founding: import('@/lib/rey-founding').FoundingSummary }) {
  const verdict = {
    too_early: { text: `Too early to read. ${f.minimumSample - f.women.saw > 0 ? `${f.minimumSample - f.women.saw} more women need to see the price` : 'Nearly there'} before the rate means anything.`, accent: 'neutral' as const },
    go: { text: `Above the pass mark. At least ${oneIn(PASS_MARK_GO)} women who saw $${PRICE_YEAR} joined. That is the go signal you set.`, accent: 'teal' as const },
    rethink: { text: `Below ${oneIn(PASS_MARK_RETHINK)}. That is the rethink line you set: the price or the offer needs to change before building on it.`, accent: 'red' as const },
    keep_testing: { text: `Between the two lines. Not a yes and not a no: keep sending people to it.`, accent: 'neutral' as const },
  }[f.verdict]

  return (
    <>
      <SectionLabel>Strenn price test · bodyrecode.au/founding</SectionLabel>
      <Card className="mb-4" accent={verdict.accent} tint={verdict.accent !== 'neutral'}>
        <div className="flex items-start gap-4 flex-wrap">
          <span className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'rgba(27,109,252,0.12)' }}>
            <Tag size={17} className="text-[#1B6DFC]" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="text-[16px] font-semibold text-[#141821] leading-snug mb-1.5">{verdict.text}</h2>
            <p className="text-[13.5px] text-[#4A5160] leading-relaxed max-w-3xl">
              Pass mark agreed 14 Sep 2026, before any results: of the women who see ${PRICE_YEAR} a year,{' '}
              <strong className="text-[#141821]">{oneIn(PASS_MARK_GO)} or more join = go ahead</strong>,{' '}
              <strong className="text-[#141821]">fewer than {oneIn(PASS_MARK_RETHINK)} = rethink the price or the offer</strong>.
              Do not move these lines after the results come in. Share the page with <code className="text-[12.5px]">?source=</code> on the end so you can see where each woman came from.
            </p>
          </div>
        </div>
      </Card>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <StatCard label="Women who saw the price" value={f.women.saw} sub={`Men, kept out of the pass mark: ${f.men.saw}`} accent="neutral" icon={Tag} />
        <StatCard label="Joined the founding list" value={`${f.women.joined} · ${pct(f.women)}%`} sub={`Go line ${Math.round(PASS_MARK_GO * 100)}%, rethink below ${Math.round(PASS_MARK_RETHINK * 100)}%`} accent={f.verdict === 'go' ? 'teal' : f.verdict === 'rethink' ? 'red' : 'neutral'} icon={ClipboardCheck} />
        <StatCard label="Training now" value={`${f.training.joined} of ${f.training.saw} · ${pct(f.training)}%`} sub="Regularly, or on and off" accent="neutral" />
        <StatCard label="Not training" value={`${f.notTraining.joined} of ${f.notTraining.saw} · ${pct(f.notTraining)}%`} sub="Which woman the first ads should speak to" accent="neutral" />
      </div>
      <Card className="mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <p className="text-[11px] font-semibold text-[#98A0AD] mb-2">At ${PRICE_YEAR} a year, is this</p>
            <Tally counts={f.reactions} options={PRICE_REACTION_OPTIONS} />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-[#98A0AD] mb-2">How soon she wants to start</p>
            <Tally counts={f.startTiming} options={START_OPTIONS} />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-[#98A0AD] mb-2">A coach in her ear</p>
            <Tally counts={f.voice} options={VOICE_OPTIONS} />
          </div>
        </div>
        <p className="text-[11px] text-[#98A0AD] mt-4">
          Women only. Counted live from every result shown, including women who left without joining.
        </p>
      </Card>
    </>
  )
}
