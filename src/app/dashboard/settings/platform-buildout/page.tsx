import Link from 'next/link'
import { BuildoutBoard } from '@/components/dashboard/buildout-board'
import { PHASES, CROSS_PHASE_DOCS } from '@/lib/saas-buildout-manifest'

export const metadata = { title: 'Body Recode Buildout · Settings' }

export default function PlatformBuildoutPage() {
  return (
    <BuildoutBoard
      phases={PHASES}
      crossPhaseDocs={CROSS_PHASE_DOCS}
      eyebrow="Settings · Body Recode buildout"
      title="Body Recode SaaS buildout"
      subtitle="The read as a sellable product. Every phase, every step, current status. src/lib/saas-buildout-manifest.ts is the source of truth — the ship checklist requires updating it on every commit that moves a step."
      progressNote="100% means the read can be sold and run by a coach who is not Kade. The realistic near-term target is all of the read, the loop and door 2."
      explainer={
        <details className="mb-6 p-4 rounded-xl border border-[#B5CFFC] bg-[rgba(27,109,252,0.08)]/40">
          <summary className="cursor-pointer text-[13px] font-bold text-[#0A46B2] uppercase tracking-widest select-none">
            How to read this page
          </summary>
          <div className="mt-3 space-y-3 text-[13px] text-[#141821] leading-relaxed">
            <p><strong>What this is.</strong> The plan to take the read — the part that works out what is going on with someone — and sell it separately from the coaching. Decided 29 August 2026. The strategic doc is <code className="bg-white px-1 py-0.5 rounded border border-[#B5CFFC] text-[11px]">2026-09-01_Read_As_A_Product_Roadmap.md</code> in Dropbox; this board is its operational counterpart.</p>
            <p><strong>The product is four steps.</strong> Initial intake, initial read, weekly check-in, and a re-read every 12 weeks. The re-read trigger is <strong>time, never block-end</strong> — a block is Performance Coaching vocabulary, and other coaches write 4, 8 or 12 week blocks or none at all.</p>
            <p><strong>Two front doors.</strong> Door 2 is a coach with no software of their own, running clients on Body Recode screens. Door 1 is a company that already has coaching software, embedding the read in the product they already sell. <strong>Door 2 first.</strong> A gym is not a third door — it is door 2 with an owner layer on top.</p>
            <p><strong>Scope.</strong> This board tracks Layer 1: the engine, the loop, the re-read, and everything that lets somebody who is not Kade run it. The coaching application that consumes the read — programs, nutrition, the portal — is tracked separately on the{' '}
              <Link href="/dashboard/settings/coaching-buildout" className="text-[#1560E0] hover:text-[#1056D6] underline">Performance Coaching board</Link>.</p>
            <p><strong>The one thing blocking everything.</strong> Phase 3 ends with a real coach who is not Kade using it. Nothing past that moves until there is a name. Every previous attempt failed the same way: the Collective was 86% built and got one enquiry in six weeks, because the building happened before anyone had been asked.</p>
            <p><strong>What the statuses mean.</strong> Every status on this board was verified against the code on 9 September 2026, not taken from a design note. That matters — a note claiming a 12-week re-read backstop already existed turned out to be wrong, and it had been wrong for weeks.</p>
          </div>
        </details>
      }
      footer={
        <div className="mt-10 p-4 rounded-xl border border-[#E8EAEE] bg-[#FBFCFD] text-[12px] text-[#666D7A] leading-relaxed">
          <strong className="text-[#141821]">Source of truth:</strong> <code className="bg-[#F4F6F9] px-1 py-0.5 rounded text-[11px]">src/lib/saas-buildout-manifest.ts</code>. Every commit that moves a step MUST update its entry in the same commit (see <code className="bg-[#F4F6F9] px-1 py-0.5 rounded text-[11px]">feedback_ship_checklist</code>). Strategic doc: <code className="bg-[#F4F6F9] px-1 py-0.5 rounded text-[11px]">06_SAAS_PLATFORM_BUILD/2026-09-01_Read_As_A_Product_Roadmap.md</code>. Sibling board:{' '}
          <Link href="/dashboard/settings/coaching-buildout" className="text-[#1560E0] hover:text-[#1056D6] underline">
            Performance Coaching buildout
          </Link>.
        </div>
      }
    />
  )
}
