import Link from 'next/link'
import { BuildoutBoard } from '@/components/dashboard/buildout-board'
import { BUILD_PHASES, BUILD_HEALTH } from '@/lib/build-sequence'

export const metadata = { title: 'Build' }

/**
 * The single build board. See src/lib/build-sequence.ts for how it is put
 * together: steps live in the read, engine and Strenn manifests, and this board
 * only arranges them into the order they are built.
 */
export default function BuildPage() {
  const health = BUILD_HEALTH
  const problems = health.unsorted.length + health.missing.length + health.duplicates.length

  return (
    <BuildoutBoard
      phases={BUILD_PHASES}
      crossPhaseDocs={[]}
      eyebrow="Product · Build"
      title="Build"
      subtitle="Everything being built, in the order it gets built. One list for the Body Recode read, the coaching engine and Strenn, with every step labelled by the products it serves."
      progressNote="Progress counts only work on the path. The parked plumbing for other coaches running the system under their own brand is excluded."
      explainer={
        <>
          {problems > 0 && (
            <div className="mb-6 p-4 rounded-xl border border-[#F5C9C9] bg-[#FDF3F3]">
              <p className="text-[13px] text-[#8A2B12] leading-relaxed">
                <strong>The build order needs attention.</strong>{' '}
                {health.unsorted.length > 0 && <>{health.unsorted.length} step{health.unsorted.length === 1 ? ' has' : 's have'} no stage yet (shown at the top). </>}
                {health.missing.length > 0 && <>{health.missing.length} placed step{health.missing.length === 1 ? ' no longer exists' : 's no longer exist'}. </>}
                {health.duplicates.length > 0 && <>{health.duplicates.length} step id{health.duplicates.length === 1 ? ' is' : 's are'} used twice: {health.duplicates.join(', ')}. </>}
              </p>
            </div>
          )}
          <details className="mb-6 p-4 rounded-xl border border-[#B5CFFC] bg-[rgba(27,109,252,0.08)]/40">
            <summary className="cursor-pointer text-[13px] font-semibold text-[#0A46B2] select-none">
              How to read this page
            </summary>
            <div className="mt-3 space-y-3 text-[13px] text-[#141821] leading-relaxed">
              <p>
                <strong>One board instead of three.</strong> Until 14 Sep 2026 the read, the coaching
                engine and Strenn each had their own board, which meant three percentages and three
                &ldquo;next up&rdquo;s for one person building one engine. This is now the only build
                order.
              </p>
              <p>
                <strong>The order is the strategy.</strong> The coach platform goes first, because it is
                closest to done and because it produces the evidence everything else is sold on. Alongside
                it the engine learns to run without Kade reviewing every plan, the inputs get better and the
                research that gates go-live gets finished. Strenn follows: name and demand first, then the
                web product women can pay for, then the voice app on top of something already earning.
                A club, or another company&apos;s software, is a later customer of the same engine. Both at
                full speed is not real, so Strenn stays design and documentation until the coach pilot runs.
              </p>
              <p>
                <strong>Strenn is a working name.</strong> Chosen 14 Sep 2026 after Rey was checked and
                dropped, and held until an attorney clearance comes back. Older documents still say Rey and
                mean the same product.
              </p>
              <p>
                <strong>The labels</strong> show which products a step serves: <strong>Strenn</strong>,
                the Body Recode <strong>Read</strong> sold on its own, and <strong>Coaching</strong>.
                A step labelled with all three is never wasted whichever product ships first.
              </p>
              <p>
                <strong>Where the steps live.</strong> Nothing is written on this board. Each step is
                recorded once, in the file for its part of the system, and this board arranges them.
                A step cannot exist twice, so it cannot be done here and open somewhere else. If a new
                step is added without being given a place in the order, it appears at the top under
                &ldquo;Unsorted&rdquo; rather than disappearing.
              </p>
              <p>
                <strong>What is parked.</strong> {health.parkedCount} steps, mostly the plumbing for
                other coaches running the coaching product under their own brand. They keep their
                history on the older{' '}
                <Link href="/dashboard/settings/platform-buildout" className="text-[#1560E0] hover:text-[#1056D6] underline">
                  Body Recode
                </Link>{' '}
                and{' '}
                <Link href="/dashboard/settings/coaching-buildout" className="text-[#1560E0] hover:text-[#1056D6] underline">
                  Performance Coaching
                </Link>{' '}
                boards, which are history now rather than plans.
              </p>
            </div>
          </details>
        </>
      }
      footer={
        <div className="mt-10 p-4 rounded-xl border border-[#E8EAEE] bg-[#FBFCFD] text-[12px] text-[#666D7A] leading-relaxed">
          <strong className="text-[#141821]">Where to change things:</strong> the order and the product
          labels live in <code className="bg-[#F4F6F9] px-1 py-0.5 rounded text-[11px]">src/lib/build-sequence.ts</code>.
          A step&apos;s status lives in its source file:{' '}
          <code className="bg-[#F4F6F9] px-1 py-0.5 rounded text-[11px]">saas-buildout-manifest.ts</code> (the read),{' '}
          <code className="bg-[#F4F6F9] px-1 py-0.5 rounded text-[11px]">performance-coaching-buildout-manifest.ts</code> (the engine), or{' '}
          <code className="bg-[#F4F6F9] px-1 py-0.5 rounded text-[11px]">rey-buildout-manifest.ts</code> (Strenn). The Strenn specification is in Dropbox under 05_REY.
          {' '}{health.placedCount} steps on the path, {health.parkedCount} parked.
        </div>
      }
    />
  )
}
