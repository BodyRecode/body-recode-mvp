'use client'

import { useState } from 'react'

type Tab = 'overview' | 'offer' | 'funnel' | 'pillars' | 'cadence' | 'pipeline'

const TABS: { id: Tab; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'offer', label: 'Offer & Terms' },
  { id: 'funnel', label: 'Funnel' },
  { id: 'pillars', label: 'Content Pillars' },
  { id: 'cadence', label: 'Cadence' },
  { id: 'pipeline', label: 'Pipeline' },
]

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`bg-white border border-stone-200 rounded-xl p-5 ${className}`}>{children}</div>
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-[10px] font-semibold uppercase tracking-widest text-stone-500 mb-3">{children}</p>
}

function Tag({ children, color = 'sky' }: { children: React.ReactNode; color?: 'sky' | 'amber' | 'violet' | 'stone' | 'green' | 'red' }) {
  const styles: Record<string, string> = {
    sky:    'bg-sky-50 text-sky-700 border-sky-500/20',
    amber:  'bg-amber-50 text-amber-700 border-amber-500/20',
    violet: 'bg-violet-500/10 text-violet-700 border-violet-500/20',
    stone:  'bg-stone-500/10 text-stone-600 border-stone-500/20',
    green:  'bg-green-50 text-green-700 border-green-500/20',
    red:    'bg-red-50 text-red-700 border-red-500/20',
  }
  return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium border ${styles[color]}`}>{children}</span>
}

function Bullets({ items, tone = 'stone' }: { items: string[]; tone?: 'stone' | 'plus' | 'minus' }) {
  const mark = tone === 'plus' ? '+' : tone === 'minus' ? '-' : '·'
  const cls = tone === 'plus' ? 'text-sky-600' : tone === 'minus' ? 'text-red-600' : 'text-stone-400'
  return (
    <div className="space-y-1.5">
      {items.map(s => (
        <div key={s} className="flex items-start gap-2 text-sm text-stone-700 leading-relaxed">
          <span className={`${cls} mt-0.5 shrink-0`}>{mark}</span><span>{s}</span>
        </div>
      ))}
    </div>
  )
}

function OverviewTab() {
  return (
    <div className="space-y-5">
      <Card>
        <SectionLabel>What the Collective is</SectionLabel>
        <p className="text-lg font-semibold text-[#1A1A1A] leading-snug mb-2">A collective of coaches practising to one standard.</p>
        <p className="text-sm text-stone-600 leading-relaxed">
          Coaches run their own branded coaching business on the Body Recode engine - "Powered by Body Recode." The glue is the shared method (Doctrine Mode A, interpretation before prescription), not just software. A standard you join, not a tool you rent.
        </p>
        <div className="mt-4">
          <a href="/docs/strategy/collective/collective-gtm-content-strategy-v1.pdf" target="_blank" rel="noopener noreferrer"
            className="text-[11px] font-bold uppercase tracking-widest px-2 py-1 rounded bg-sky-600 text-white hover:bg-sky-700">View full strategy .pdf</a>
        </div>
      </Card>

      <Card>
        <SectionLabel>Who it is for</SectionLabel>
        <Bullets tone="plus" items={[
          'Established movement / health coaches with a defined method and an engaged audience',
          'Modalities today: strength / performance and yoga (Pilates + conditioning next)',
          'Want to own a business, not rent a tool',
        ]} />
        <p className="text-xs font-semibold text-stone-500 uppercase tracking-widest mt-4 mb-2">Not for</p>
        <Bullets tone="minus" items={[
          'Cheap-tool shoppers or template-swappers',
          'Beginners with no method or audience yet (they go to the Emerging Coach lane, not the founding offer)',
        ]} />
      </Card>

      <Card>
        <SectionLabel>Where it sits</SectionLabel>
        <Bullets items={[
          'Body Recode = the engine / platform (what coaches license; "Powered by Body Recode")',
          'Performance Coaching = the consumer coaching arm (BR does not compete with partner coaches for their clients)',
          'The Collective = the B2B arm - coaches run their own brand on the engine',
        ]} />
      </Card>

      <Card>
        <SectionLabel>Posture right now</SectionLabel>
        <div className="flex items-center gap-2 mb-3"><Tag color="amber">Demand-gen + curated waitlist</Tag><Tag color="stone">Not hard-sell yet</Tag></div>
        <p className="text-sm text-stone-600 leading-relaxed">
          We cannot sign or bill partners at full price yet (no lawyer, contracts stale at $20 not 15%, partner billing unbuilt, API-vs-15% economics unconfirmed). So we drive the right coaches into the Fit Scorecard and a curated waitlist now, and flip to "founding seats open" the moment legal + billing land. The 10-seat founding cohort is real - scarcity is honest, not manufactured.
        </p>
      </Card>
    </div>
  )
}

function OfferTab() {
  return (
    <div className="space-y-5">
      <Card>
        <SectionLabel>Founding commercial terms (internal - keep off public content)</SectionLabel>
        <div className="space-y-3">
          {[
            { k: 'Setup (one-time)', v: '$2,500 · 3 parts: $1,000 signing / $750 build / $750 go-live' },
            { k: 'Platform membership', v: 'Months 1-3 free → 4-6 $200 → 7+ $400 (locked for life)' },
            { k: 'Per active client', v: '15% of what each active client pays the coach / month' },
            { k: '"Active client"', v: 'a client with a live paying subscription that month (via Stripe Connect - verifiable)' },
            { k: 'Founding cap', v: '10 founding members; exclusivity via curation ("apply to join")' },
          ].map(r => (
            <div key={r.k} className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-3 py-2 border-b border-stone-200/60 last:border-0">
              <p className="text-sm font-medium text-[#1A1A1A] w-44 shrink-0">{r.k}</p>
              <p className="text-sm text-stone-600">{r.v}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <SectionLabel>Add-ons (post-activation, priced separately)</SectionLabel>
        <Bullets items={[
          'Conversion funnel build + Challenge funnel build (re-skin BR Funnel A / Funnel B)',
          'Done-for-you Meta ads + creative, ongoing social content',
          'Extra email sequences, additional modality pack, bespoke build work, 1:1 business mentoring',
        ]} />
        <p className="text-xs text-stone-400 mt-3">Sold after a coach is live, never at the front. Exact figures stay a verbal + term-sheet conversation - the public site shows an ROI illustration, not a rate card.</p>
      </Card>
    </div>
  )
}

function FunnelTab() {
  return (
    <div className="space-y-5">
      <Card>
        <SectionLabel>The funnel (live today)</SectionLabel>
        <p className="text-sm text-stone-600 leading-relaxed mb-4">
          Content → <code className="text-xs bg-stone-100 px-1 rounded">/collective</code> → <code className="text-xs bg-stone-100 px-1 rounded">/collective/apply</code> (Fit Scorecard, ~9 questions) → scored across method / audience / modality / readiness → one of three tiers. Every CTA points to the Fit Scorecard, never a checkout.
        </p>
        <div className="space-y-3">
          <div className="p-3 rounded-lg border border-green-500/20 bg-green-50/40">
            <div className="flex items-center gap-2 mb-1"><Tag color="green">Ready</Tag><span className="text-sm font-semibold text-stone-800">Book a call + instant SMS to Kade</span></div>
            <p className="text-xs text-stone-600">Defined method + audience, supported modality. Goes on the founding waitlist.</p>
          </div>
          <div className="p-3 rounded-lg border border-amber-500/20 bg-amber-50/40">
            <div className="flex items-center gap-2 mb-1"><Tag color="amber">Building</Tag><span className="text-sm font-semibold text-stone-800">Tailored "fix this first" + nurture</span></div>
            <p className="text-xs text-stone-600">Method or audience but not both. This tier is also the Emerging Coach farm system - nurtured toward a future cohort.</p>
          </div>
          <div className="p-3 rounded-lg border border-red-500/20 bg-red-50/40">
            <div className="flex items-center gap-2 mb-1"><Tag color="red">Not yet</Tag><span className="text-sm font-semibold text-stone-800">Gentle decline + a resource</span></div>
            <p className="text-xs text-stone-600">Unsupported modality, cheap-tool mindset, or too many reds.</p>
          </div>
        </div>
      </Card>

      <Card>
        <SectionLabel>Emerging Coach lane (farm system)</SectionLabel>
        <p className="text-sm text-stone-600 leading-relaxed">
          New / beginner coaches are not the founding buyer (offer too heavy, 15% of few clients is nothing) but they are the largest market and the purest adopters of one standard. Now: an educational content lane that routes them into the "building" tier as a nurtured waitlist. Later (Phase 2, after the founding 10 sign): a paid ladder - education → lighter platform tier → full Collective. Keeps green coaches in their own lane, protecting founding scarcity.
        </p>
      </Card>
    </div>
  )
}

function PillarsTab() {
  const pillars = [
    { n: '01', t: 'The Broken Middle', d: 'The pain: great coach, business held together with tape - tool sprawl, admin tax, the ceiling you hit when you are the whole system.' },
    { n: '02', t: "Own, Don't Rent", d: 'The model: your brand, your clients, your business - powered by a proven engine. The opposite of a faceless affiliate or a rented app. "It still answers to you."' },
    { n: '03', t: 'One Standard', d: 'The method as the glue. Interpretation before prescription. Why a collective (shared standard, quality) beats a franchise mill. Not a strength template with the words swapped.' },
    { n: '04', t: 'Built in Public', d: 'The engine as living proof - what it does (scorecard → reading → state → plan), the platform build, the Melisa pilot. Overlaps Kade\'s personal Pillar 3 (AI & Leverage).' },
    { n: '05', t: 'The Founding Table', d: 'Scarcity + curation. Applications open, 10 seats, founding terms for life, "we only win when you win." Every one of these ends at the Fit Scorecard.' },
  ]
  return (
    <div className="space-y-4">
      {pillars.map(p => (
        <Card key={p.n}>
          <div className="flex items-start gap-4">
            <span className="text-2xl font-bold font-mono text-sky-500/40">{p.n}</span>
            <div>
              <p className="text-base font-semibold text-[#1A1A1A] mb-1">{p.t}</p>
              <p className="text-sm text-stone-600 leading-relaxed">{p.d}</p>
            </div>
          </div>
        </Card>
      ))}
      <Card>
        <SectionLabel>Messaging split (critical)</SectionLabel>
        <p className="text-sm text-stone-600 leading-relaxed">
          Established coaches hear <em className="text-sky-700 not-italic font-medium">"own a business, not rent a tool"</em> (they already have a business). Emerging coaches hear <em className="text-sky-700 not-italic font-medium">"learn to practise to one standard, and grow into the platform"</em> (aspirational / educational). Never mix the two in one post - different audience, different stage.
        </p>
      </Card>
    </div>
  )
}

function CadenceTab() {
  return (
    <div className="space-y-5">
      <Card>
        <SectionLabel>LinkedIn - primary B2B channel</SectionLabel>
        <div className="mb-3"><Tag color="sky">2-3x per week</Tag></div>
        <p className="text-sm text-stone-600 leading-relaxed">Where coaches, studio owners and founders are. The Collective is a business offer; LinkedIn is the business feed. Posted from Kade's profile alongside the Body Recode executive and personal-brand posts (total LinkedIn feed ~4-6/week).</p>
      </Card>
      <Card>
        <SectionLabel>Personal brand - Pillar 3 (AI & Leverage)</SectionLabel>
        <div className="mb-3"><Tag color="violet">~1x per week</Tag></div>
        <p className="text-sm text-stone-600 leading-relaxed">The building-in-public story on @kade_dunstone_ - "I built the engine to run my own coaching; now other coaches run their practice on it." Seeds interest and feeds the Fit Scorecard. Does not replace the LinkedIn track.</p>
      </Card>
      <Card>
        <SectionLabel>Email</SectionLabel>
        <p className="text-sm text-stone-600 leading-relaxed">Founding-story email on application; a 3-4 email nurture sequence for "building" applicants (the warmest future pipeline). Consumer Instagram (@body_recode_) is not a coach-recruitment channel - wrong audience.</p>
      </Card>
    </div>
  )
}

function PipelineTab() {
  return (
    <div className="space-y-5">
      <Card>
        <SectionLabel>Founding Members</SectionLabel>
        <div className="p-3 rounded-lg border border-stone-200 bg-stone-50/60">
          <div className="flex items-center gap-2 mb-1"><span className="text-sm font-semibold text-stone-800">Melisa - Harmony Yoga</span><Tag color="amber">Verbal yes, not signed</Tag></div>
          <p className="text-xs text-stone-600 leading-relaxed">Founding Partner #1. Yoga modality, Brisbane. Terms locked with her 2026-07-15. Preview mocks built (/dashboard/preview/melisa + /harmony). Blocked on: signed agreement (lawyer), her brand pack + domain, $2,500 setup cleared, yoga branch merge.</p>
        </div>
        <p className="text-xs text-stone-400 mt-3">9 remaining founding seats fed by the Fit Scorecard waitlist.</p>
      </Card>
      <Card>
        <SectionLabel>Dependencies - unblock "sell"</SectionLabel>
        <Bullets tone="minus" items={[
          'New AU commercial/IP lawyer sourced; contracts updated to 15% + reviewed (Ange is out)',
          'Entity / liability structure decided (sole trader → company question)',
          'Partner billing built (setup + membership + per-active-client metering via Stripe Connect)',
          'API cost-per-client vs 15% margin confirmed',
          'Melisa signed + onboarded (first live proof); yoga branch merged',
        ]} />
        <p className="text-xs text-stone-400 mt-3">When these land, the content posture flips from "apply to the waitlist" to "founding seats open" - same funnel, harder CTA.</p>
      </Card>
    </div>
  )
}

export default function CollectivePage() {
  const [tab, setTab] = useState<Tab>('overview')

  const tabContent: Record<Tab, React.ReactNode> = {
    overview: <OverviewTab />,
    offer:    <OfferTab />,
    funnel:   <FunnelTab />,
    pillars:  <PillarsTab />,
    cadence:  <CadenceTab />,
    pipeline: <PipelineTab />,
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-6 pt-6 pb-0 border-b border-stone-200">
        <div className="flex items-center gap-3 mb-1">
          <h1 className="text-xl font-semibold text-[#1A1A1A]">The Body Recode Collective</h1>
          <span className="text-xs text-stone-500 bg-stone-200 px-2 py-0.5 rounded font-mono">bodyrecode.au/collective</span>
        </div>
        <p className="text-sm text-stone-500 mb-4">The B2B licensing arm - a collective of coaches practising to one standard</p>

        <div className="flex gap-1 overflow-x-auto pb-px">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`px-3.5 py-2 text-sm font-medium rounded-t-lg whitespace-nowrap transition-colors ${
                tab === t.id ? 'bg-white text-[#1A1A1A] border-t border-l border-r border-stone-200' : 'text-stone-500 hover:text-stone-700'
              }`}>{t.label}</button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-3xl">{tabContent[tab]}</div>
      </div>
    </div>
  )
}
