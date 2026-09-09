import Link from 'next/link'
import { BuildoutBoard } from '@/components/dashboard/buildout-board'
import { PHASES, CROSS_PHASE_DOCS } from '@/lib/performance-coaching-buildout-manifest'

export const metadata = { title: 'Performance Coaching Buildout · Settings' }

export default function CoachingBuildoutPage() {
  return (
    <BuildoutBoard
      phases={PHASES}
      crossPhaseDocs={CROSS_PHASE_DOCS}
      eyebrow="Settings · Performance Coaching buildout"
      title="Performance Coaching SaaS buildout"
      subtitle="The application that consumes the read. Programs, nutrition, the portal, the coaching loop. src/lib/performance-coaching-buildout-manifest.ts is the source of truth."
      progressNote="This board is a first pass — most of Layer 2 has not been audited into phases yet, so treat the percentage as covering only what is listed."
      explainer={
        <details className="mb-6 p-4 rounded-xl border border-[#B5CFFC] bg-[rgba(27,109,252,0.08)]/40">
          <summary className="cursor-pointer text-[13px] font-bold text-[#0A46B2] uppercase tracking-widest select-none">
            How to read this page
          </summary>
          <div className="mt-3 space-y-3 text-[13px] text-[#141821] leading-relaxed">
            <p><strong>What this is.</strong> Layer 2 — the coaching application that consumes the read. Programs, nutrition, the client portal, the weekly coaching loop, and the tooling Kade runs his own practice on.</p>
            <p><strong>The Collective lives here</strong> (moved 9 Sep 2026). It was designed for coaches running the whole Performance Coaching product — their programs, their nutrition, their portal — under their own brand on BR doctrine. That is this product white-labelled, not the read, so every Collective phase came across: decide, pilot zero, tenancy, billing and doctrine mode B.</p>
            <p><strong>One thing that is genuinely shared.</strong> The multi-coach plumbing built for the Collective — tenant_config, the resolver, per-tenant branding, Stripe Connect — is what door 2 on the Body Recode board runs on too. It is tracked here because this is what it was built for, rather than duplicated on both boards.</p>
            <p><strong>Why it is separate.</strong> Split from the Body Recode board on 9 September 2026, along the same line the whole go-to-market rests on. Body Recode is the read, sold on its own and licensable. Performance Coaching is the thing built on top of it, and the proof it works. Keeping one board for both hid which work was which.</p>
            <p><strong>Where this sits in the plan.</strong> Neither the coaching application nor the Collective is being waited for. The read goes to market first. This becomes the second tier sold to coaches already paying for the read — which is also how it finally gets finished on real coaches&apos; feedback rather than guesses.</p>
            <p><strong>One tension to hold.</strong> Selling a full coaching application competes with door 1 on the{' '}
              <Link href="/dashboard/settings/platform-buildout" className="text-[#1560E0] hover:text-[#1056D6] underline">Body Recode board</Link>. A coaching platform embeds the read because Body Recode is a neutral supplier; it will not embed a read from a company selling a competing coaching platform. Both can run for a while. Eventually one costs the other.</p>
            <p><strong>⚠ This board is incomplete on purpose.</strong> The Collective phases and the capability layer carry real, verified history. The rest of Layer 2 has not been audited into steps yet, and it is left empty rather than filled with guesses — an invented status makes the percentage at the top start lying and nobody notices.</p>
          </div>
        </details>
      }
      footer={
        <div className="mt-10 p-4 rounded-xl border border-[#E8EAEE] bg-[#FBFCFD] text-[12px] text-[#666D7A] leading-relaxed">
          <strong className="text-[#141821]">Source of truth:</strong> <code className="bg-[#F4F6F9] px-1 py-0.5 rounded text-[11px]">src/lib/performance-coaching-buildout-manifest.ts</code>. Every commit that moves a Layer 2 step MUST update its entry in the same commit (see <code className="bg-[#F4F6F9] px-1 py-0.5 rounded text-[11px]">feedback_ship_checklist</code>). Sibling board:{' '}
          <Link href="/dashboard/settings/platform-buildout" className="text-[#1560E0] hover:text-[#1056D6] underline">
            Body Recode buildout
          </Link>.
        </div>
      }
    />
  )
}
