import Link from 'next/link'
import { getLaunchSnapshot } from '@/lib/saas-launch'
import { PHASES } from '@/lib/saas-buildout-manifest'
import { boardStats, phaseProgress } from '@/lib/buildout-types'
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
} from 'lucide-react'

/**
 * The SaaS launch board.
 *
 * This is NOT a second buildout board. `/dashboard/settings/platform-buildout`
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

  const build = boardStats(PHASES)
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
              href="/dashboard/settings/platform-buildout"
              className="text-[#1560E0] hover:text-[#1056D6] underline"
            >
              buildout board
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
            <p className="text-[13px] text-[#4A5160] leading-relaxed max-w-3xl">
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
            <p className="text-[11.5px] text-[#98A0AD] mt-2.5">
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
          href="/dashboard/settings/platform-buildout"
          icon={ClipboardCheck}
        />
      </div>

      <Card className="mb-8">
        <p className="text-[13px] text-[#4A5160] leading-relaxed mb-4 max-w-3xl">
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
          <p className="text-[13px] text-[#98A0AD] italic">
            No applications yet. Nothing to answer.
          </p>
        ) : (
          <div className="overflow-x-auto -mx-1">
            <table className="w-full text-[12.5px] min-w-[560px]">
              <thead>
                <tr className="text-left text-[10.5px] text-[#98A0AD] border-b border-[#E8EAEE]">
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
                        <span className="block text-[11.5px] text-[#98A0AD]">{a.businessName}</span>
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
            <p className="text-[13px] text-[#4A5160] leading-relaxed max-w-3xl">
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
              <p className="text-[11.5px] text-[#98A0AD] mt-2.5">
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
              href="/dashboard/settings/platform-buildout"
              className="text-[#1560E0] hover:text-[#1056D6] underline"
            >
              The buildout board — every phase and step, and what shipped when
            </Link>
          </li>
        </ul>
      </Card>
    </div>
  )
}
