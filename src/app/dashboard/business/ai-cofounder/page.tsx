'use client'

import { useState } from 'react'

type Tab = 'positioning' | 'funnel' | 'content' | 'ads' | 'tracking'

const TABS: { id: Tab; label: string }[] = [
  { id: 'positioning', label: 'Positioning' },
  { id: 'funnel',      label: 'Funnel' },
  { id: 'content',     label: 'Content Angles' },
  { id: 'ads',         label: 'Ad Strategy' },
  { id: 'tracking',    label: 'Sales Tracking' },
]

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-[#111110] border border-stone-800 rounded-xl p-5 ${className}`}>
      {children}
    </div>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-semibold uppercase tracking-widest text-stone-500 mb-3">
      {children}
    </p>
  )
}

function Tag({ children, color = 'teal' }: { children: React.ReactNode; color?: 'teal' | 'violet' | 'amber' | 'orange' | 'stone' | 'blue' }) {
  const styles: Record<string, string> = {
    teal:   'bg-teal-500/10 text-teal-400 border-teal-500/20',
    violet: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
    amber:  'bg-amber-500/10 text-amber-400 border-amber-500/20',
    orange: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    stone:  'bg-stone-500/10 text-stone-400 border-stone-500/20',
    blue:   'bg-blue-500/10 text-blue-400 border-blue-500/20',
  }
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium border ${styles[color]}`}>
      {children}
    </span>
  )
}

function PositioningTab() {
  return (
    <div className="space-y-5">
      <Card>
        <SectionLabel>What It Is</SectionLabel>
        <p className="text-stone-300 text-sm leading-relaxed">
          A structured framework for founders and business leaders who want to use AI strategically - not randomly.
        </p>
        <div className="mt-4 space-y-2">
          {[
            { no: 'Not a prompt guide' },
            { no: 'Not a tool tutorial' },
          ].map(s => (
            <div key={s.no} className="flex items-center gap-2 text-sm text-stone-400">
              <span className="text-red-400">-</span> {s.no}
            </div>
          ))}
          <div className="flex items-start gap-2 text-sm text-stone-200 mt-3">
            <span className="text-teal-400 mt-0.5">+</span>
            <span>A system for integrating AI as a thinking partner across the entire business.</span>
          </div>
        </div>
      </Card>

      <Card>
        <SectionLabel>Product</SectionLabel>
        <div className="space-y-3">
          {[
            { name: 'Ebook',              price: '$37 AUD',  type: 'One-time', delivery: 'Instant digital via Stripe' },
            { name: 'Ebook + Bundle',     price: '$47 AUD',  type: 'One-time', delivery: 'Templates + prompt vault included' },
          ].map(p => (
            <div key={p.name} className="flex items-center justify-between py-3 border-b border-stone-800 last:border-0">
              <div>
                <p className="text-sm font-medium text-white">{p.name}</p>
                <p className="text-xs text-stone-500 mt-0.5">{p.delivery}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-teal-400">{p.price}</p>
                <p className="text-xs text-stone-500">{p.type}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-3 pt-3 border-t border-stone-800">
          <div className="flex items-center justify-between">
            <p className="text-xs text-stone-500">Website</p>
            <code className="text-xs text-teal-400 bg-teal-500/10 px-2 py-1 rounded">aicofoundermethod.com</code>
          </div>
        </div>
      </Card>

      <Card>
        <SectionLabel>Target Audience</SectionLabel>
        <p className="text-sm text-stone-300 mb-4">Founders, solopreneurs, and business leaders who know AI is important but are using it reactively.</p>
        <div className="space-y-2">
          {[
            'Broader than Body Recode - crosses industries',
            'Entry point: anyone building something who wants structured leverage',
            'Uses AI as a tool today, wants to use it as a co-founder',
          ].map(t => (
            <div key={t} className="flex items-start gap-2 text-sm text-stone-400">
              <span className="text-stone-600 mt-1 shrink-0">-</span>
              {t}
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <SectionLabel>Platform</SectionLabel>
        <p className="text-sm text-stone-400 mb-3">
          Shared with personal brand initially. @kade_dunstone_ feeds into this product. No separate social account needed at this stage.
        </p>
        <div className="flex gap-2">
          <Tag color="violet">@kade_dunstone_</Tag>
          <Tag color="stone">Threads</Tag>
          <Tag color="stone">Instagram</Tag>
        </div>
      </Card>
    </div>
  )
}

function FunnelTab() {
  const steps = [
    { step: '01', label: 'Personal brand content',   desc: 'Threads and Instagram Pillar 3 - AI and leverage content', color: 'violet' },
    { step: '02', label: 'aicofoundermethod.com',    desc: 'Landing page with direct purchase option', color: 'teal' },
    { step: '03', label: '$37-47 purchase',           desc: 'No discovery call. No application. Straight to checkout.', color: 'amber' },
  ]

  return (
    <div className="space-y-5">
      <Card>
        <SectionLabel>Funnel Flow</SectionLabel>
        <p className="text-xs text-stone-500 mb-5">Low friction. Price point allows direct purchase without a sales call.</p>
        <div className="space-y-4">
          {steps.map((s, i) => (
            <div key={s.step} className="flex items-start gap-4">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                s.color === 'violet' ? 'bg-violet-500/20 text-violet-400' :
                s.color === 'teal'   ? 'bg-teal-500/20 text-teal-400' :
                'bg-amber-500/20 text-amber-400'
              }`}>{s.step}</div>
              <div className="flex-1 pt-1">
                <p className="text-sm font-medium text-white">{s.label}</p>
                <p className="text-xs text-stone-400 mt-0.5">{s.desc}</p>
              </div>
              {i < steps.length - 1 && (
                <div className="absolute ml-4 mt-10 w-px h-4 bg-stone-700" />
              )}
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <SectionLabel>Distinction from Body Recode</SectionLabel>
        <div className="space-y-3">
          {[
            { label: 'Body Recode',          value: 'Ad or content → scorecard → consultation → client ($195-295/week)' },
            { label: 'AI Co-Founder Method', value: 'Content → landing page → direct purchase ($37-47)' },
          ].map(r => (
            <div key={r.label} className="py-2 border-b border-stone-800 last:border-0">
              <p className="text-xs text-stone-500 mb-1">{r.label}</p>
              <p className="text-sm text-stone-300">{r.value}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <SectionLabel>Ecosystem Cross-Pollination Rules</SectionLabel>
        <div className="space-y-2">
          {[
            { rule: 'Body Recode content never references AI Co-Founder Method', allow: false },
            { rule: 'AI Co-Founder content can reference Body Recode as a case study', allow: true },
            { rule: 'Personal brand references both naturally as work Kade is building', allow: true },
            { rule: 'HeyGen videos can serve all three channels with different scripts', allow: true },
          ].map(r => (
            <div key={r.rule} className="flex items-start gap-2 py-1.5 border-b border-stone-800/60 last:border-0">
              <span className={`text-sm mt-0.5 shrink-0 ${r.allow ? 'text-teal-400' : 'text-red-400'}`}>
                {r.allow ? '+' : '-'}
              </span>
              <p className="text-sm text-stone-300">{r.rule}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

function ContentTab() {
  const angles = [
    {
      hook: 'AI doesn\'t make you smarter. It makes your current thinking louder.',
      pillar: 'Framing',
      type: 'Contrarian',
      color: 'orange' as const,
    },
    {
      hook: 'The difference between using AI as a tool vs a co-founder',
      pillar: 'Framework',
      type: 'Educational',
      color: 'teal' as const,
    },
    {
      hook: 'What happens when you give AI a role instead of a question',
      pillar: 'Framework',
      type: 'Practical',
      color: 'teal' as const,
    },
    {
      hook: 'Building repeatable workflows vs one-off prompts',
      pillar: 'Systems',
      type: 'Practical',
      color: 'violet' as const,
    },
    {
      hook: 'The IP extraction process - Pause, Reflect, Document',
      pillar: 'Framework',
      type: 'Educational',
      color: 'amber' as const,
    },
    {
      hook: 'How Kade uses AI to build Body Recode',
      pillar: 'Case Study',
      type: 'Story',
      color: 'stone' as const,
    },
  ]

  return (
    <div className="space-y-5">
      <Card>
        <SectionLabel>Content Angles</SectionLabel>
        <p className="text-xs text-stone-500 mb-4">Post these through @kade_dunstone_ (Pillar 3 - AI and Leverage). Each angle is a standalone post or thread.</p>
        <div className="space-y-3">
          {angles.map((a, i) => (
            <div key={i} className="border border-stone-800 rounded-lg px-4 py-3">
              <div className="flex items-center gap-2 mb-2">
                <Tag color={a.color}>{a.type}</Tag>
                <span className="text-xs text-stone-600">{a.pillar}</span>
              </div>
              <p className="text-sm text-stone-200 font-medium">{a.hook}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <SectionLabel>The Core Idea Behind All Content</SectionLabel>
        <blockquote className="border-l-2 border-teal-500/40 pl-4 text-stone-300 text-sm leading-relaxed">
          AI does not create value. It distributes structured value. If your thinking isn't structured, AI amplifies noise.
        </blockquote>
        <p className="mt-4 text-xs text-stone-500">
          Every content angle should circle back to this: structure first, AI second.
        </p>
      </Card>
    </div>
  )
}

function AdsTab() {
  return (
    <div className="space-y-5">
      <Card>
        <SectionLabel>Ads Strategy - Phase 2</SectionLabel>
        <div className="p-3 bg-amber-500/5 border border-amber-500/20 rounded-lg mb-4">
          <p className="text-xs text-amber-400">Once Body Recode ads are optimised, run a separate Meta campaign for AI Co-Founder Method.</p>
        </div>
        <div className="space-y-3">
          {[
            { label: 'Traffic source', value: 'Cold traffic via Meta' },
            { label: 'Destination',    value: 'aicofoundermethod.com landing page' },
            { label: 'Goal',           value: 'Direct purchase' },
            { label: 'Why it works',   value: 'Price point ($37-47) allows direct purchase without a funnel or call' },
          ].map(r => (
            <div key={r.label} className="flex items-start gap-3 py-2 border-b border-stone-800/60 last:border-0">
              <p className="text-xs text-stone-500 w-32 shrink-0 pt-0.5">{r.label}</p>
              <p className="text-sm text-stone-300">{r.value}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <SectionLabel>Prerequisites Before Running Ads</SectionLabel>
        <div className="space-y-2">
          {[
            'Body Recode ads running and optimised (3+ ad sets stable)',
            'aicofoundermethod.com landing page live with Stripe checkout',
            'At least 10 organic sales to validate the offer',
            'Meta Pixel installed on aicofoundermethod.com',
          ].map((t, i) => (
            <div key={i} className="flex items-center gap-3 py-2 border-b border-stone-800/60 last:border-0">
              <div className="w-4 h-4 rounded border border-stone-700 shrink-0" />
              <p className="text-sm text-stone-300">{t}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

function TrackingTab() {
  return (
    <div className="space-y-5">
      <Card>
        <SectionLabel>Revenue Snapshot</SectionLabel>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-stone-800">
              <th className="text-left text-[10px] uppercase tracking-widest text-stone-600 py-2 font-medium">Product</th>
              <th className="text-right text-[10px] uppercase tracking-widest text-stone-600 py-2 font-medium">Price</th>
              <th className="text-right text-[10px] uppercase tracking-widest text-stone-600 py-2 font-medium">Type</th>
            </tr>
          </thead>
          <tbody>
            {[
              { product: 'AI Co-Founder Method (ebook)',      price: '$37 AUD',  type: 'One-time' },
              { product: 'AI Co-Founder Method (bundle)',     price: '$47 AUD',  type: 'One-time' },
              { product: 'Body Recode Scorecard',             price: 'Free',     type: 'Lead gen' },
              { product: 'Body Recode Coaching (online)',     price: '$195-295/wk', type: 'Recurring' },
              { product: 'Body Recode Coaching (in-person)', price: '$299-409/wk', type: 'Recurring' },
            ].map(r => (
              <tr key={r.product} className="border-b border-stone-800/60 last:border-0">
                <td className="py-3 text-stone-300">{r.product}</td>
                <td className="py-3 text-right text-teal-400 font-medium">{r.price}</td>
                <td className="py-3 text-right text-stone-500 text-xs">{r.type}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Card>
        <SectionLabel>Sales Log</SectionLabel>
        <p className="text-xs text-stone-600 mt-1">No sales recorded yet. Sales will be logged here once the product is live.</p>
        <div className="mt-4 p-8 border border-dashed border-stone-800 rounded-lg text-center">
          <p className="text-sm text-stone-600">No sales yet</p>
          <p className="text-xs text-stone-700 mt-1">Launch aicofoundermethod.com to start tracking</p>
        </div>
      </Card>
    </div>
  )
}

export default function AiCoFounderPage() {
  const [tab, setTab] = useState<Tab>('positioning')

  const tabContent: Record<Tab, React.ReactNode> = {
    positioning: <PositioningTab />,
    funnel:      <FunnelTab />,
    content:     <ContentTab />,
    ads:         <AdsTab />,
    tracking:    <TrackingTab />,
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-6 pt-6 pb-0 border-b border-stone-800">
        <div className="flex items-center gap-3 mb-1">
          <h1 className="text-xl font-semibold text-white">AI Co-Founder Method</h1>
          <span className="text-xs text-stone-500 bg-stone-800 px-2 py-0.5 rounded font-mono">aicofoundermethod.com</span>
        </div>
        <p className="text-sm text-stone-500 mb-4">Founder AI framework - ebook $37-47 AUD</p>

        <div className="flex gap-1 overflow-x-auto pb-px">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-3.5 py-2 text-sm font-medium rounded-t-lg whitespace-nowrap transition-colors ${
                tab === t.id
                  ? 'bg-[#111110] text-white border-t border-l border-r border-stone-800'
                  : 'text-stone-500 hover:text-stone-300'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-3xl">
          {tabContent[tab]}
        </div>
      </div>
    </div>
  )
}
