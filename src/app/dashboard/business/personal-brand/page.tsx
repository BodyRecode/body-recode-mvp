'use client'

import { useState } from 'react'

type Tab = 'positioning' | 'story' | 'pillars' | 'scripts' | 'cadence' | 'launch'

const TABS: { id: Tab; label: string }[] = [
  { id: 'positioning', label: 'Positioning' },
  { id: 'story', label: 'Story Library' },
  { id: 'pillars', label: 'Content Pillars' },
  { id: 'scripts', label: 'Script Library' },
  { id: 'cadence', label: 'Posting Cadence' },
  { id: 'launch', label: 'Launch Sequence' },
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

function Tag({ children, color = 'teal' }: { children: React.ReactNode; color?: 'teal' | 'violet' | 'amber' | 'orange' | 'stone' }) {
  const styles: Record<string, string> = {
    teal:   'bg-teal-500/10 text-teal-400 border-teal-500/20',
    violet: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
    amber:  'bg-amber-500/10 text-amber-400 border-amber-500/20',
    orange: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    stone:  'bg-stone-500/10 text-stone-400 border-stone-500/20',
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
        <SectionLabel>Who Kade Dunstone Is</SectionLabel>
        <p className="text-stone-300 text-sm leading-relaxed">
          A performance coach, systems thinker, and software builder who has rebuilt his identity, career, and direction multiple times - and built frameworks out of every rebuild.
        </p>
        <div className="mt-4 space-y-2">
          {[
            'Not a fitness influencer',
            'Not a motivational speaker',
            'Not a generic founder content creator',
          ].map(s => (
            <div key={s} className="flex items-center gap-2 text-sm text-stone-400">
              <span className="text-red-400">-</span> {s}
            </div>
          ))}
          <div className="flex items-start gap-2 text-sm text-stone-200 mt-3">
            <span className="text-teal-400 mt-0.5">+</span>
            <span>Someone who learned to interpret before acting - and built systems around that principle across the body, business, and software.</span>
          </div>
        </div>
        <div className="mt-4 p-3 bg-teal-500/5 border border-teal-500/20 rounded-lg">
          <p className="text-xs text-teal-300">The platform is the proof. Most coaches rent software. Kade built his own - a full coaching and CRM platform - using the same AI co-founder principles he teaches.</p>
        </div>
      </Card>

      <Card>
        <SectionLabel>Core Philosophy</SectionLabel>
        <p className="text-2xl font-semibold text-white mb-3">Interpret before you act.</p>
        <p className="text-stone-400 text-sm leading-relaxed">
          Without correct interpretation - effort is misdirected, progress stalls, burnout increases.<br />
          With correct interpretation - decisions become clear, execution becomes effective, results become repeatable.
        </p>
        <div className="mt-4 flex gap-2 flex-wrap">
          <Tag color="teal">The Body</Tag>
          <Tag color="violet">Business</Tag>
          <Tag color="amber">Identity</Tag>
        </div>
      </Card>

      <Card>
        <SectionLabel>Confirmed Bio</SectionLabel>
        <div className="bg-stone-900 rounded-lg p-4 text-sm text-stone-200 leading-relaxed font-mono">
          I stopped writing programs and started building systems.<br />
          Performance coach. Founder. Systems thinker.<br />
          Body Recode™ + AI Co-Founder Method
        </div>
      </Card>

      <Card>
        <SectionLabel>Platform Spec</SectionLabel>
        <div className="space-y-3">
          {[
            { platform: 'Instagram', handle: '@kade_dunstone_', link: 'bodyrecode.au/scorecard?source=instagram_kade' },
            { platform: 'Threads',   handle: '@kade_dunstone_', link: 'bodyrecode.au/scorecard?source=threads_kade' },
          ].map(r => (
            <div key={r.platform} className="flex items-center justify-between py-2 border-b border-stone-800 last:border-0">
              <div>
                <p className="text-sm font-medium text-white">{r.platform}</p>
                <p className="text-xs text-stone-400">{r.handle}</p>
              </div>
              <code className="text-xs text-teal-400 bg-teal-500/10 px-2 py-1 rounded">{r.link}</code>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-stone-500">Profile photo: clean headshot, dark background, on-brand</p>
      </Card>

      <Card>
        <SectionLabel>Contrarian Positions (Content Foundation)</SectionLabel>
        <div className="space-y-2">
          {[
            'Most coaches prescribe without interpreting first',
            'Effort is not the problem. Misdirected effort is.',
            'You cannot out-train a nervous system in protection mode',
            'Most people don\'t have a discipline problem. They have a clarity problem.',
            'Systems scale. Hustle doesn\'t.',
            'Rebuilding is not failure. It is the process of building better structure.',
            'The body is not broken. It is being misread.',
            'AI does not create value. It distributes structured value. If your thinking isn\'t structured, AI amplifies noise.',
            'Most coaching businesses deliver sessions. They should be delivering systems.',
            'Identity determines direction. Get the identity wrong and the strategy never lands.',
            'Most coaches rent software built by someone else. Building your own forces you to understand your business at a different level.',
            'You don\'t need to know how to code. You need to know what you\'re building and why. AI handles the rest.',
          ].map((p, i) => (
            <div key={i} className="flex items-start gap-3 py-2 border-b border-stone-800/60 last:border-0">
              <span className="text-xs text-stone-600 font-mono mt-0.5 w-4 shrink-0">{i + 1}</span>
              <p className="text-sm text-stone-300">{p}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

function StoryTab() {
  const rebuilds = [
    {
      title: 'Rebuild 1 - Military Discharge',
      color: 'teal' as const,
      context: 'Built toward soldier from childhood. Medically discharged due to structural leg issues. Lost the identity he had constructed for years.',
      lesson: 'A deep understanding of the body, physical limitation, and how structure creates stability when direction is lost.',
    },
    {
      title: 'Rebuild 2 - Commercial Fitness Exit',
      color: 'violet' as const,
      context: 'Helped build and operate high-performing gym environments across Australia. Chose to step away due to misalignment - not lack of capability.',
      lesson: 'Scale without systems creates noise. Systems create leverage. Sessions are not a business.',
    },
    {
      title: 'Rebuild 3 - 20-Year Relationship End',
      color: 'amber' as const,
      context: 'Walked away from a shared life and business. Rebuilt self-trust and clarity from scratch.',
      lesson: 'People don\'t lose performance - they lose clarity. Clarity is upstream of everything.',
    },
    {
      title: 'The Build - Body Recode Platform',
      color: 'teal' as const,
      context: 'After three rebuilds, stopped renting other people\'s software and built his own. A full coaching and CRM platform built using AI as a co-founder.',
      lesson: 'If the principles are real, you should be able to build with them. The platform is the proof of concept.',
    },
  ]

  return (
    <div className="space-y-5">
      <Card>
        <SectionLabel>The Core Story</SectionLabel>
        <p className="text-sm text-stone-400 mb-4">
          Three identity rebuilds. Each one produced a framework. Every piece of content connects back to one of these.
        </p>
        <div className="space-y-4">
          {rebuilds.map(r => (
            <div key={r.title} className="border border-stone-800 rounded-lg overflow-hidden">
              <div className={`px-4 py-2.5 border-b border-stone-800 ${
                r.color === 'teal' ? 'bg-teal-500/5' :
                r.color === 'violet' ? 'bg-violet-500/5' : 'bg-amber-500/5'
              }`}>
                <p className="text-sm font-semibold text-white">{r.title}</p>
              </div>
              <div className="px-4 py-3 space-y-2">
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-stone-600 mb-1">Context</p>
                  <p className="text-sm text-stone-400">{r.context}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-stone-600 mb-1">What it produced</p>
                  <p className="text-sm text-stone-200">{r.lesson}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

function PillarsTab() {
  const pillars = [
    {
      num: '01',
      title: 'Performance and Body Systems',
      color: 'teal' as const,
      description: 'What happens when the body is interpreted correctly before anything is prescribed. Personal angle - more raw and experiential than @body_recode_.',
      topics: [
        'What 20+ years in the industry taught that no qualification covers',
        'Nervous system and performance',
        'Why effort without interpretation fails',
        'The body state framework explained through personal experience',
      ],
    },
    {
      num: '02',
      title: 'Thinking and Interpretation',
      color: 'violet' as const,
      description: 'The meta-skill behind all of Kade\'s frameworks.',
      topics: [
        'Interpretation vs prescription',
        'Pattern recognition',
        'Decision-making under clarity vs confusion',
        'Systems thinking applied to real problems',
        'The Pause-Reflect-Document model in practice',
      ],
    },
    {
      num: '03',
      title: 'AI and Leverage',
      color: 'amber' as const,
      description: 'The AI Co-Founder Method. Building structured IP. Using AI as a thinking partner.',
      topics: [
        'How AI amplifies clarity (and noise if clarity doesn\'t exist)',
        'Building in public - the software build documented in real time',
        'IP extraction and structuring',
        'What happens when you treat AI as a co-founder, not a tool',
        'Most coaches rent software. I built mine.',
        'What you learn about your own business when you design the software for it',
        'The Body Recode platform as a live case study',
      ],
    },
    {
      num: '04',
      title: 'Rebuild and Identity',
      color: 'orange' as const,
      description: 'The personal story. The three rebuilds. What was lost and what was built.',
      topics: [
        'Military discharge',
        'Industry exit',
        'Relationship end and restart',
        'What identity fragmentation feels like and how structure repairs it',
      ],
    },
  ]

  return (
    <div className="space-y-4">
      {pillars.map(p => (
        <Card key={p.num}>
          <div className="flex items-start gap-4">
            <span className={`text-2xl font-bold font-mono ${
              p.color === 'teal' ? 'text-teal-500/40' :
              p.color === 'violet' ? 'text-violet-500/40' :
              p.color === 'amber' ? 'text-amber-500/40' : 'text-orange-500/40'
            }`}>{p.num}</span>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <p className="text-base font-semibold text-white">Pillar {p.num} - {p.title}</p>
                <Tag color={p.color}>{p.color === 'teal' ? 'Body' : p.color === 'violet' ? 'Mind' : p.color === 'amber' ? 'AI' : 'Story'}</Tag>
              </div>
              <p className="text-sm text-stone-400 mb-3">{p.description}</p>
              <div className="space-y-1">
                {p.topics.map(t => (
                  <div key={t} className="flex items-start gap-2 text-sm text-stone-300">
                    <span className="text-stone-600 mt-1 shrink-0">-</span>
                    {t}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}

function ScriptsTab() {
  const [expanded, setExpanded] = useState<string | null>(null)

  const scripts = [
    {
      id: 'post1',
      type: 'Launch Post',
      pillar: 'Positioning',
      hook: 'I\'ve spent 20 years helping people understand their body. Most of the work was never in the gym.',
      body: null,
      platform: 'Threads + Instagram',
    },
    {
      id: 'post2',
      type: 'Contrarian',
      pillar: 'Thinking',
      hook: 'The problem is not effort. Effort is everywhere.',
      body: 'The problem is that nobody reads the situation before prescribing to it. That\'s true in coaching. And in most areas of life.',
      platform: 'Threads + Instagram',
    },
    {
      id: 'post3',
      type: 'Rebuild',
      pillar: 'Identity',
      hook: 'I\'ve rebuilt my identity three times.',
      body: 'Each time I thought I was starting over. Each time I was actually going deeper.',
      platform: 'Threads + Instagram',
    },
    {
      id: 'post4',
      type: 'System',
      pillar: 'Thinking',
      hook: 'I stopped writing programs and started building systems.',
      body: 'When I realised that programs solve yesterday\'s problem. Systems solve the pattern underneath it.',
      platform: 'Threads + Instagram',
    },
    {
      id: 'post5',
      type: 'Connection',
      pillar: 'Body Recode',
      hook: 'Body Recode is the result of every rebuild.',
      body: 'An interpretive system - read the body before prescribing to it. That principle started with my own body and became a framework for everyone else\'s.',
      platform: 'Threads + Instagram',
    },
  ]

  const pillarColors: Record<string, string> = {
    Positioning: 'teal',
    Thinking:    'violet',
    Identity:    'amber',
    'Body Recode': 'orange',
  }

  return (
    <div className="space-y-5">
      <Card>
        <SectionLabel>First 5 Posts - Launch Sequence</SectionLabel>
        <p className="text-xs text-stone-500 mb-4">Post these in order before any outreach or promotion begins.</p>
        <div className="space-y-3">
          {scripts.map((s, i) => (
            <div key={s.id} className="border border-stone-800 rounded-lg overflow-hidden">
              <button
                onClick={() => setExpanded(expanded === s.id ? null : s.id)}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-stone-900/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xs text-stone-600 font-mono w-4">0{i + 1}</span>
                  <span className="text-sm font-medium text-white">{s.type}</span>
                  <Tag color={pillarColors[s.pillar] as 'teal' | 'violet' | 'amber' | 'orange'}>{s.pillar}</Tag>
                </div>
                <span className="text-stone-600 text-xs">{expanded === s.id ? 'hide' : 'view'}</span>
              </button>
              {expanded === s.id && (
                <div className="px-4 pb-4 space-y-3 border-t border-stone-800">
                  <div className="mt-3">
                    <p className="text-[10px] uppercase tracking-widest text-stone-600 mb-1">Platform</p>
                    <p className="text-xs text-stone-400">{s.platform}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-stone-600 mb-1">Caption</p>
                    <div className="bg-stone-900 rounded-lg p-3 text-sm text-stone-200 leading-relaxed">
                      {s.body ? (
                        <>
                          <p className="font-medium">{s.hook}</p>
                          <p className="mt-2 text-stone-400">{s.body}</p>
                        </>
                      ) : (
                        <p className="font-medium">{s.hook}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <SectionLabel>HeyGen Video Strategy</SectionLabel>
        <div className="space-y-3">
          {[
            { label: 'Format',       value: 'Talking head, calm delivery, gym or clean background' },
            { label: 'Length',       value: '60-90 seconds for Reels' },
            { label: 'Frequency',    value: '1 video per week minimum' },
            { label: 'Distribution', value: 'Post to @kade_dunstone_, cross-reference relevant Body Recode content' },
            { label: 'Scripts',      value: 'Written in advance, mapped to content pillars' },
          ].map(r => (
            <div key={r.label} className="flex items-start gap-3 py-2 border-b border-stone-800/60 last:border-0">
              <p className="text-xs text-stone-500 w-28 shrink-0 pt-0.5">{r.label}</p>
              <p className="text-sm text-stone-300">{r.value}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

function CadenceTab() {
  return (
    <div className="space-y-5">
      <Card>
        <SectionLabel>Threads - Primary Thinking Platform</SectionLabel>
        <div className="flex items-center gap-2 mb-4">
          <Tag color="teal">Daily or near-daily</Tag>
          <Tag color="stone">No graphics needed</Tag>
        </div>
        <div className="space-y-2">
          {[
            'Short observations and contrarian takes',
            'Thread format for deeper breakdowns',
            'Pure text - reads like someone who has thought about this for years',
            'No motivational fluff, no gym selfies, no vague inspiration',
          ].map(t => (
            <div key={t} className="flex items-start gap-2 text-sm text-stone-300">
              <span className="text-teal-500 mt-1 shrink-0">-</span>
              {t}
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <SectionLabel>Instagram - Secondary, More Polished</SectionLabel>
        <div className="flex items-center gap-2 mb-4">
          <Tag color="violet">3-4x per week</Tag>
        </div>
        <div className="space-y-3">
          {[
            { type: 'Carousels', desc: 'Frameworks and systems' },
            { type: 'Reels',     desc: 'Personal story moments via HeyGen' },
            { type: 'Quote cards', desc: 'Contrarian positions' },
          ].map(r => (
            <div key={r.type} className="flex items-center gap-3 py-2 border-b border-stone-800/60 last:border-0">
              <p className="text-sm font-medium text-white w-28 shrink-0">{r.type}</p>
              <p className="text-sm text-stone-400">{r.desc}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <SectionLabel>Tone</SectionLabel>
        <p className="text-sm text-stone-300 mb-4">Direct. Structured. No filler. Reads like someone who has thought about this for years and is now documenting it.</p>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-red-500/60 mb-2">Never</p>
            <div className="space-y-1">
              {['Motivational fluff', '"Here\'s my morning routine"', 'Gym selfies', 'Vague inspiration', 'Hype'].map(t => (
                <div key={t} className="flex items-center gap-2 text-xs text-stone-500">
                  <span className="text-red-500/60">-</span> {t}
                </div>
              ))}
            </div>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-widest text-teal-500/60 mb-2">Always</p>
            <div className="space-y-1">
              {['A specific observation', 'A named pattern', 'A reframe', 'A real moment from the journey'].map(t => (
                <div key={t} className="flex items-center gap-2 text-xs text-stone-300">
                  <span className="text-teal-500/60">+</span> {t}
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <SectionLabel>How Personal Brand Feeds Body Recode</SectionLabel>
        <p className="text-sm text-stone-400 mb-4">The personal brand does not sell Body Recode directly. It builds the trust that makes Body Recode the obvious next step.</p>
        <div className="space-y-2">
          {[
            'Person follows @kade_dunstone_ because the thinking resonates',
            'They begin to understand the framework behind his work',
            'They encounter Body Recode naturally through content references',
            'They take the scorecard because they already trust the thinking',
          ].map((s, i) => (
            <div key={i} className="flex items-start gap-3 text-sm text-stone-300">
              <span className="text-stone-600 font-mono text-xs mt-0.5 w-4 shrink-0">{i + 1}</span>
              {s}
            </div>
          ))}
        </div>
        <div className="mt-4 p-3 bg-stone-900 rounded-lg border border-stone-800">
          <p className="text-xs text-stone-400">Never pitch Body Recode directly from the personal account. Reference it. Link it occasionally. Let the trust do the selling.</p>
        </div>
      </Card>
    </div>
  )
}

function LaunchTab() {
  const steps = [
    { done: false, step: 'Bio set, profile photo on-brand, link set' },
    { done: false, step: 'First 5 posts live before any outreach' },
    { done: false, step: 'Warm outreach to 20-30 people' },
    { done: false, step: 'Build to 50 followers before any promotion' },
    { done: false, step: 'Regular cadence begins - daily Threads, 3-4x Instagram' },
    { done: false, step: 'HeyGen avatar finalised - 1 video per week minimum' },
  ]

  return (
    <div className="space-y-5">
      <Card>
        <SectionLabel>Launch Checklist</SectionLabel>
        <div className="space-y-2">
          {steps.map((s, i) => (
            <div key={i} className="flex items-center gap-3 py-2 border-b border-stone-800/60 last:border-0">
              <div className="w-4 h-4 rounded border border-stone-700 shrink-0" />
              <p className="text-sm text-stone-300">{s.step}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <SectionLabel>Source Tracking</SectionLabel>
        <div className="space-y-2">
          {[
            { platform: 'Threads bio',       url: 'bodyrecode.au/scorecard?source=threads_kade' },
            { platform: 'Instagram bio',     url: 'bodyrecode.au/scorecard?source=instagram_kade' },
            { platform: 'Instagram story',   url: 'bodyrecode.au/scorecard?source=instagram_kade_story' },
          ].map(r => (
            <div key={r.platform} className="flex items-center justify-between py-2 border-b border-stone-800/60 last:border-0">
              <p className="text-sm text-stone-400 w-36 shrink-0">{r.platform}</p>
              <code className="text-xs text-teal-400 bg-teal-500/10 px-2 py-1 rounded">{r.url}</code>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <SectionLabel>Ecosystem Role</SectionLabel>
        <div className="space-y-3 text-sm text-stone-400">
          <p>The personal brand is the bridge. It does not sell either product directly.</p>
          <p>It builds the trust that makes both products the obvious next step.</p>
          <div className="mt-4 space-y-2">
            {[
              'Discovers @kade_dunstone_ through performance, identity, or AI content',
              'Follows because the thinking resonates',
              'Encounters Body Recode through performance content',
              'Or encounters AI Co-Founder Method through AI content',
              'Buys or applies based on which problem is most relevant right now',
              'One person can buy both products at different points',
            ].map((s, i) => (
              <div key={i} className="flex items-start gap-3">
                <span className="text-stone-600 font-mono text-xs mt-0.5 shrink-0">{i + 1}</span>
                <span className="text-stone-300">{s}</span>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  )
}

export default function PersonalBrandPage() {
  const [tab, setTab] = useState<Tab>('positioning')

  const tabContent: Record<Tab, React.ReactNode> = {
    positioning: <PositioningTab />,
    story:       <StoryTab />,
    pillars:     <PillarsTab />,
    scripts:     <ScriptsTab />,
    cadence:     <CadenceTab />,
    launch:      <LaunchTab />,
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-6 pt-6 pb-0 border-b border-stone-800">
        <div className="flex items-center gap-3 mb-1">
          <h1 className="text-xl font-semibold text-white">Personal Brand</h1>
          <span className="text-xs text-stone-500 bg-stone-800 px-2 py-0.5 rounded font-mono">@kade_dunstone_</span>
        </div>
        <p className="text-sm text-stone-500 mb-4">Threads + Instagram - the thinking, the journey, the builder</p>

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
