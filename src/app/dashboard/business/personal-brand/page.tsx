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
    <div className={`bg-[#FFFFFF] border border-stone-200 rounded-xl p-5 ${className}`}>
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
    teal:   'bg-blue-500/10 text-blue-500 border-blue-500/20',
    violet: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
    amber:  'bg-amber-500/10 text-amber-400 border-amber-500/20',
    orange: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    stone:  'bg-stone-500/10 text-stone-600 border-stone-500/20',
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
        <p className="text-stone-700 text-sm leading-relaxed">
          A performance coach, systems thinker, and software builder who has rebuilt his identity, career, and direction multiple times - and built frameworks out of every rebuild.
        </p>
        <div className="mt-4 space-y-2">
          {[
            'Not a fitness influencer',
            'Not a motivational speaker',
            'Not a generic founder content creator',
          ].map(s => (
            <div key={s} className="flex items-center gap-2 text-sm text-stone-600">
              <span className="text-red-400">-</span> {s}
            </div>
          ))}
          <div className="flex items-start gap-2 text-sm text-stone-800 mt-3">
            <span className="text-blue-500 mt-0.5">+</span>
            <span>Someone who learned to interpret before acting - and built systems around that principle across the body, business, and software.</span>
          </div>
        </div>
        <div className="mt-4 p-3 bg-blue-500/5 border border-blue-500/20 rounded-lg">
          <p className="text-xs text-blue-300">The platform is the proof. Most coaches rent software. Kade built his own - a full coaching and CRM platform - using the same AI co-founder principles he teaches.</p>
        </div>
      </Card>

      <Card>
        <SectionLabel>Core Philosophy</SectionLabel>
        <p className="text-2xl font-semibold text-[#1A1A1A] mb-3">Interpret before you act.</p>
        <p className="text-stone-600 text-sm leading-relaxed">
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
        <div className="bg-stone-100 rounded-lg p-4 text-sm text-stone-800 leading-relaxed font-mono">
          Three rebuilds. One constant. I never stopped building.<br />
          Performance coach. Father. Builder.<br />
          bodyrecode.au/kade
        </div>
      </Card>

      <Card>
        <SectionLabel>Platform Spec</SectionLabel>
        <div className="space-y-3">
          {[
            { platform: 'Instagram', handle: '@kade_dunstone_', link: 'bodyrecode.au/scorecard?source=instagram_kade' },
          ].map(r => (
            <div key={r.platform} className="flex items-center justify-between py-2 border-b border-stone-200 last:border-0">
              <div>
                <p className="text-sm font-medium text-[#1A1A1A]">{r.platform}</p>
                <p className="text-xs text-stone-600">{r.handle}</p>
              </div>
              <code className="text-xs text-blue-500 bg-blue-500/10 px-2 py-1 rounded">{r.link}</code>
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
            <div key={i} className="flex items-start gap-3 py-2 border-b border-stone-200/60 last:border-0">
              <span className="text-xs text-stone-400 font-mono mt-0.5 w-4 shrink-0">{i + 1}</span>
              <p className="text-sm text-stone-700">{p}</p>
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
        <p className="text-sm text-stone-600 mb-4">
          Three identity rebuilds. Each one produced a framework. Every piece of content connects back to one of these.
        </p>
        <div className="space-y-4">
          {rebuilds.map(r => (
            <div key={r.title} className="border border-stone-200 rounded-lg overflow-hidden">
              <div className={`px-4 py-2.5 border-b border-stone-200 ${
                r.color === 'teal' ? 'bg-blue-500/5' :
                r.color === 'violet' ? 'bg-violet-500/5' : 'bg-amber-500/5'
              }`}>
                <p className="text-sm font-semibold text-[#1A1A1A]">{r.title}</p>
              </div>
              <div className="px-4 py-3 space-y-2">
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-stone-400 mb-1">Context</p>
                  <p className="text-sm text-stone-600">{r.context}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-stone-400 mb-1">What it produced</p>
                  <p className="text-sm text-stone-800">{r.lesson}</p>
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
              p.color === 'teal' ? 'text-blue-500/40' :
              p.color === 'violet' ? 'text-violet-500/40' :
              p.color === 'amber' ? 'text-amber-500/40' : 'text-orange-500/40'
            }`}>{p.num}</span>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <p className="text-base font-semibold text-[#1A1A1A]">Pillar {p.num} - {p.title}</p>
                <Tag color={p.color}>{p.color === 'teal' ? 'Body' : p.color === 'violet' ? 'Mind' : p.color === 'amber' ? 'AI' : 'Story'}</Tag>
              </div>
              <p className="text-sm text-stone-600 mb-3">{p.description}</p>
              <div className="space-y-1">
                {p.topics.map(t => (
                  <div key={t} className="flex items-start gap-2 text-sm text-stone-700">
                    <span className="text-stone-400 mt-1 shrink-0">-</span>
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
  const [scriptTab, setScriptTab] = useState<'launch' | 'pillar1' | 'pillar2' | 'pillar3' | 'pillar4' | 'video'>('launch')

  type PillarColor = 'teal' | 'violet' | 'amber' | 'orange' | 'stone'

  interface Script {
    id: string
    type: string
    pillar: string
    pillarColor: PillarColor
    platform: string
    hook: string
    body?: string
    copy?: string
  }

  const launchScripts: Script[] = [
    {
      id: 'l1', type: 'Arrival', pillar: 'Positioning', pillarColor: 'teal', platform: 'Instagram',
      hook: "I've spent 20 years helping people understand their body. Most of the work was never in the gym.",
    },
    {
      id: 'l2', type: 'Contrarian', pillar: 'Thinking', pillarColor: 'violet', platform: 'Instagram',
      hook: 'The problem is not effort. Effort is everywhere.',
      body: "The problem is that nobody reads the situation before prescribing to it. That's true in coaching. And in most areas of life.",
    },
    {
      id: 'l3', type: 'Rebuild', pillar: 'Identity', pillarColor: 'amber', platform: 'Instagram',
      hook: "I've rebuilt my identity three times.",
      body: 'Each time I thought I was starting over. Each time I was actually going deeper.',
    },
    {
      id: 'l4', type: 'System', pillar: 'Thinking', pillarColor: 'violet', platform: 'Instagram',
      hook: 'I stopped writing programs and started building systems.',
      body: "When I realised that programs solve yesterday's problem. Systems solve the pattern underneath it.",
    },
    {
      id: 'l5', type: 'Connection', pillar: 'Body Recode', pillarColor: 'teal', platform: 'Instagram',
      hook: 'Body Recode is the result of every rebuild.',
      body: "An interpretive system - read the body before prescribing to it. That principle started with my own body and became a framework for everyone else's.",
    },
  ]

  const pillar1Scripts: Script[] = [
    {
      id: 'p1a', type: 'Contrarian', pillar: 'Body', pillarColor: 'teal', platform: 'Instagram',
      hook: 'The body is not broken. It is being misread.',
      body: "20 years in this industry. The bodies that weren't responding weren't failing - they were communicating. Most coaches don't know how to listen.",
    },
    {
      id: 'p1b', type: 'Observation', pillar: 'Body', pillarColor: 'teal', platform: 'Instagram',
      hook: "You can't out-train a nervous system in protection mode.",
      body: "More sessions. More restriction. More discipline. All of it makes a depleted body worse. The body interprets load as threat when it's already overwhelmed. The answer is never more - it's different.",
    },
    {
      id: 'p1c', type: 'Framework', pillar: 'Body', pillarColor: 'teal', platform: 'Instagram',
      hook: 'Three states. One body. Completely different responses to the same training.',
      copy: "Depleted - protection mode. Adding load makes it worse.\n\nTransitioning - mixed signals. Something is blocking response.\n\nReady - biology is set up to respond.\n\nSame program. Three completely different outcomes depending on which state the person is in.\n\nMost coaches write the program first. I read the state first.",
    },
    {
      id: 'p1d', type: 'Story', pillar: 'Body', pillarColor: 'teal', platform: 'Instagram',
      hook: 'I was medically discharged from the military at 19.',
      body: "Structural issues in both legs. Years of building toward soldier - gone in a single assessment. That forced me to understand the body in a way no training qualification ever taught me. The setback became the foundation.",
    },
    {
      id: 'p1e', type: 'Contrarian', pillar: 'Body', pillarColor: 'teal', platform: 'Instagram',
      hook: "What 20 years in the industry taught me that no qualification covers.",
      body: "Qualifications teach you what to prescribe. They don't teach you how to read the person in front of you before you prescribe anything. That's the gap. That's where most coaches fail.",
    },
  ]

  const pillar2Scripts: Script[] = [
    {
      id: 'p2a', type: 'Contrarian', pillar: 'Thinking', pillarColor: 'violet', platform: 'Instagram',
      hook: "Most people don't have a discipline problem. They have a clarity problem.",
      body: "Discipline applied to the wrong direction is just effort wasted. Before you build the system, you need to know what you're actually solving for.",
    },
    {
      id: 'p2b', type: 'Framework', pillar: 'Thinking', pillarColor: 'violet', platform: 'Instagram',
      hook: 'Interpretation vs prescription. The difference matters more than most people realise.',
      copy: "Prescription: here's the plan, follow it.\n\nInterpretation: here's what I see, here's what it means, here's what we do about it.\n\nOne of these adapts. One of these doesn't.\n\nEvery failed coaching relationship I've seen came down to prescription without interpretation.",
    },
    {
      id: 'p2c', type: 'Observation', pillar: 'Thinking', pillarColor: 'violet', platform: 'Instagram',
      hook: 'Clarity is upstream of everything.',
      body: "Performance. Decisions. Relationships. Business. When these break down, most people go looking for a better strategy. The actual problem is almost always upstream - in how the situation was read.",
    },
    {
      id: 'p2d', type: 'Framework', pillar: 'Thinking', pillarColor: 'violet', platform: 'Instagram',
      hook: 'Pause. Reflect. Document.',
      body: "Three steps that separate reactive decisions from structured ones. Most people skip all three. They act on instinct, forget what they observed, and wonder why they keep solving the same problems.",
    },
    {
      id: 'p2e', type: 'Contrarian', pillar: 'Thinking', pillarColor: 'violet', platform: 'Instagram',
      hook: 'Pattern recognition is the skill nobody teaches.',
      body: "It's not intelligence. It's not experience alone. It's the habit of observing before acting - long enough that you start seeing what repeats. Most people are too fast. They act before the pattern is clear.",
    },
  ]

  const pillar3Scripts: Script[] = [
    {
      id: 'p3a', type: 'Contrarian', pillar: 'AI', pillarColor: 'amber', platform: 'Instagram',
      hook: "AI doesn't make you smarter. It makes your current thinking louder.",
      body: "If your thinking is structured, AI amplifies structure. If it isn't, AI amplifies noise. The tool is neutral. The input determines the output.",
    },
    {
      id: 'p3b', type: 'Story', pillar: 'AI', pillarColor: 'amber', platform: 'Instagram',
      hook: 'Most coaches rent software. I built mine.',
      copy: "A full coaching and CRM platform. Client assessment. Program generation. Automations. Business dashboard.\n\nBuilt using AI as a co-founder - not a tool.\n\nI didn't write the code. I knew what I was building and why. AI handled the rest.\n\nThe platform is the proof of concept for everything I teach about structured thinking.",
    },
    {
      id: 'p3c', type: 'Framework', pillar: 'AI', pillarColor: 'amber', platform: 'Instagram',
      hook: 'The difference between using AI as a tool and using it as a co-founder.',
      body: "A tool does what you tell it. A co-founder thinks alongside you. The second one requires you to have structured thinking first - but when you do, the output is completely different.",
    },
    {
      id: 'p3d', type: 'Contrarian', pillar: 'AI', pillarColor: 'amber', platform: 'Instagram',
      hook: "You don't need to know how to code. You need to know what you're building and why.",
      body: "AI handles the execution. Your job is the thinking, the structure, the direction. Most people get this backwards - they learn the tool before they know the problem.",
    },
    {
      id: 'p3e', type: 'Observation', pillar: 'AI', pillarColor: 'amber', platform: 'Instagram',
      hook: 'Building in public changes how you think.',
      body: "When you have to explain what you're building, you realise how much of it you haven't fully thought through yet. The documentation is not the output - it's the process.",
    },
  ]

  const pillar4Scripts: Script[] = [
    {
      id: 'p4a', type: 'Story', pillar: 'Identity', pillarColor: 'orange', platform: 'Instagram',
      hook: "I've rebuilt my identity three times. Each time I thought I was losing. Each time I was building.",
      body: "Military discharge at 19. Fitness industry exit at 30. End of a 20-year relationship. Each one felt like failure. Each one produced the framework I now teach.",
    },
    {
      id: 'p4b', type: 'Contrarian', pillar: 'Identity', pillarColor: 'orange', platform: 'Instagram',
      hook: 'Rebuilding is not failure. It is the process of building better structure.',
      body: "The people who never rebuild are the ones who stay attached to a version of themselves that no longer fits. The rebuild is not the problem. The resistance to it is.",
    },
    {
      id: 'p4c', type: 'Observation', pillar: 'Identity', pillarColor: 'orange', platform: 'Instagram',
      hook: 'Identity determines direction. Get the identity wrong and the strategy never lands.',
      body: "You can have the right method, the right plan, the right resources - and still get nowhere. If the identity underneath doesn't match the direction, the whole thing works against itself.",
    },
    {
      id: 'p4d', type: 'Story', pillar: 'Identity', pillarColor: 'orange', platform: 'Instagram',
      hook: "I walked away from a 20-year relationship and had to rebuild self-trust from scratch.",
      copy: "Not because the relationship was bad. Because I had built my identity so completely around it that when it ended, I didn't know who I was without it.\n\nThat's when I understood performance loss at its deepest level.\n\nPeople don't lose fitness. They lose clarity. They lose direction. They lose the identity that made effort feel worth it.\n\nClarity is upstream of everything.",
    },
    {
      id: 'p4e', type: 'Contrarian', pillar: 'Identity', pillarColor: 'orange', platform: 'Instagram',
      hook: 'Most people try to perform their way out of an identity problem.',
      body: "More training. More output. More discipline. All applied on top of a foundation that hasn't been examined. The performance doesn't fix the problem. It masks it - until it can't anymore.",
    },
  ]

  const videoScripts: Script[] = [
    {
      id: 'v1', type: 'Video - 60s', pillar: 'Body', pillarColor: 'teal', platform: 'Instagram Reel',
      hook: "Here's why your body stopped responding - and it's not what most coaches will tell you.",
      copy: "Most coaches see a body that's not responding and they add more.\n\nMore training. More restriction. More discipline.\n\nBut here's what's actually happening.\n\nWhen a body is in a depleted state - cortisol elevated, nervous system overloaded, recovery absent - it interprets load as threat.\n\nAnd when the body interprets load as threat, it holds on. It protects.\n\nAdding more makes it worse.\n\nThe answer is interpretation before prescription.\n\nRead the state the body is actually in before deciding what to give it.\n\nThat's what Body Recode is built on. Link in bio to find out which state you're in.",
    },
    {
      id: 'v2', type: 'Video - 60s', pillar: 'Thinking', pillarColor: 'violet', platform: 'Instagram Reel',
      hook: "The reason most people stay stuck isn't discipline. It's this.",
      copy: "I've worked with high-functioning people for over 20 years.\n\nMost of them are not unmotivated. Most of them are not lazy.\n\nThey're misdirected.\n\nThey're applying enormous effort to the wrong thing because nobody ever helped them interpret the situation before acting on it.\n\nMost coaching is prescription without interpretation.\n\nHere's the plan. Follow it.\n\nBut if the plan is built on a wrong read of the person in front of you - it doesn't matter how good the plan is.\n\nInterpret first. Prescribe second.\n\nThat's the principle behind everything I build.",
    },
    {
      id: 'v3', type: 'Video - 90s', pillar: 'AI', pillarColor: 'amber', platform: 'Instagram Reel',
      hook: "I built my own coaching software. No coding background. Here's how.",
      copy: "I'm a performance coach. Not a developer.\n\nBut I built a full coaching platform - client assessments, program generation, CRM, automations, business dashboard - from scratch.\n\nHow?\n\nI stopped using AI as a tool and started using it as a co-founder.\n\nA tool does what you tell it.\n\nA co-founder thinks alongside you.\n\nThe difference is in how you show up to the conversation.\n\nI didn't say 'write me some code.'\n\nI said - here's the problem, here's the system, here's what it needs to do. Build it with me.\n\nThe result is a platform that runs my entire business.\n\nThat's what the AI Co-Founder Method teaches. Link in bio.",
    },
    {
      id: 'v4', type: 'Video - 60s', pillar: 'Identity', pillarColor: 'orange', platform: 'Instagram Reel',
      hook: "I've rebuilt my identity three times. Each one produced a framework.",
      copy: "At 19 I was medically discharged from the military.\n\nI had built my entire identity around becoming a soldier. It was gone overnight.\n\nThat forced me to understand the body differently. The setback became the system.\n\nAt 30 I walked away from the commercial fitness industry.\n\nScale without systems creates noise. I learned that by being inside it.\n\nAnd then I walked away from a 20-year relationship.\n\nAnd had to rebuild self-trust from nothing.\n\nThat's when I understood - people don't lose performance. They lose clarity.\n\nEvery rebuild produced a framework.\n\nBody Recode is all three of them combined.",
    },
  ]

  const scriptSections: Record<typeof scriptTab, { label: string; scripts: Script[] }> = {
    launch:  { label: 'Launch - First 5 Posts', scripts: launchScripts },
    pillar1: { label: 'Pillar 1 - Body', scripts: pillar1Scripts },
    pillar2: { label: 'Pillar 2 - Thinking', scripts: pillar2Scripts },
    pillar3: { label: 'Pillar 3 - AI', scripts: pillar3Scripts },
    pillar4: { label: 'Pillar 4 - Identity', scripts: pillar4Scripts },
    video:   { label: 'HeyGen Video Scripts', scripts: videoScripts },
  }

  const current = scriptSections[scriptTab]

  return (
    <div className="space-y-4">
      {/* Section tabs */}
      <div className="flex gap-1.5 flex-wrap">
        {(Object.entries(scriptSections) as [typeof scriptTab, { label: string }][]).map(([k, v]) => (
          <button
            key={k}
            onClick={() => setScriptTab(k)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              scriptTab === k
                ? 'bg-blue-500/10 text-blue-500 border-blue-500/30'
                : 'text-stone-500 border-stone-200 hover:text-stone-700'
            }`}
          >{v.label}</button>
        ))}
      </div>

      <Card>
        <SectionLabel>{current.label}</SectionLabel>
        {scriptTab === 'launch' && <p className="text-xs text-stone-500 mb-4">Post these in order before any outreach or promotion begins.</p>}
        {scriptTab === 'video' && <p className="text-xs text-stone-500 mb-4">Record using HeyGen avatar. Calm delivery, clean background. 60-90 seconds.</p>}
        <div className="space-y-2">
          {current.scripts.map((s, i) => (
            <div key={s.id} className="border border-stone-200 rounded-lg overflow-hidden">
              <button
                onClick={() => setExpanded(expanded === s.id ? null : s.id)}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-stone-100/50 transition-colors text-left"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-xs text-stone-400 font-mono shrink-0">{String(i + 1).padStart(2, '0')}</span>
                  <span className="text-sm font-medium text-[#1A1A1A] truncate">{s.hook}</span>
                  <Tag color={s.pillarColor}>{s.type}</Tag>
                </div>
                <span className="text-stone-400 text-xs shrink-0 ml-2">{expanded === s.id ? 'hide' : 'view'}</span>
              </button>
              {expanded === s.id && (
                <div className="px-4 pb-4 space-y-3 border-t border-stone-200">
                  <div className="flex items-center gap-3 mt-3">
                    <Tag color={s.pillarColor}>{s.pillar}</Tag>
                    <span className="text-xs text-stone-500">{s.platform}</span>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-[10px] uppercase tracking-widest text-stone-400">Copy</p>
                      <button
                        onClick={() => navigator.clipboard.writeText(s.copy ?? [s.hook, s.body].filter(Boolean).join('\n\n'))}
                        className="text-xs text-blue-500 hover:text-blue-300 transition-colors"
                      >Copy</button>
                    </div>
                    <div className="bg-stone-100 rounded-lg p-3 text-sm text-stone-800 leading-relaxed whitespace-pre-line">
                      {s.copy ?? [s.hook, s.body].filter(Boolean).join('\n\n')}
                    </div>
                  </div>
                </div>
              )}
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
        <SectionLabel>Instagram - Primary Platform</SectionLabel>
        <div className="flex items-center gap-2 mb-4">
          <Tag color="violet">3-4x per week</Tag>
        </div>
        <div className="space-y-3">
          {[
            { type: 'Carousels', desc: 'Frameworks and systems' },
            { type: 'Reels',     desc: 'Personal story moments via HeyGen' },
            { type: 'Quote cards', desc: 'Contrarian positions' },
          ].map(r => (
            <div key={r.type} className="flex items-center gap-3 py-2 border-b border-stone-200/60 last:border-0">
              <p className="text-sm font-medium text-[#1A1A1A] w-28 shrink-0">{r.type}</p>
              <p className="text-sm text-stone-600">{r.desc}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <SectionLabel>LinkedIn - Secondary Platform</SectionLabel>
        <div className="flex items-center gap-2 mb-4">
          <Tag color="amber">1 personal-brand post per week</Tag>
        </div>
        <p className="text-sm text-stone-600 leading-relaxed mb-3">
          Personal brand content (the four pillars) also goes on LinkedIn alongside Studio of Ten posts and Body Recode executive reframe posts. Total LinkedIn feed: 4-6 posts/week across all three channels, posted from the same personal profile.
        </p>
        <div className="space-y-2">
          {[
            { channel: 'Studio of Ten', freq: '2-3 posts/wk' },
            { channel: 'Personal Brand', freq: '1 post/wk' },
            { channel: 'Body Recode (NEW May 2026)', freq: '1-2 posts/wk' },
          ].map(r => (
            <div key={r.channel} className="flex items-center gap-3 text-xs py-1.5 border-b border-stone-200/60 last:border-0">
              <p className="text-[#1A1A1A] w-52 shrink-0">{r.channel}</p>
              <p className="text-stone-600">{r.freq}</p>
            </div>
          ))}
        </div>
        <p className="text-xs text-stone-400 mt-3">See <strong className="text-stone-600">Marketing Strategy → LinkedIn tab</strong> for the Body Recode LinkedIn pillars, tone rules, and 12-week pipeline.</p>
      </Card>

      <Card>
        <SectionLabel>Tone</SectionLabel>
        <p className="text-sm text-stone-700 mb-4">Direct. Structured. No filler. Reads like someone who has thought about this for years and is now documenting it.</p>
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
            <p className="text-[10px] uppercase tracking-widest text-blue-500/60 mb-2">Always</p>
            <div className="space-y-1">
              {['A specific observation', 'A named pattern', 'A reframe', 'A real moment from the journey'].map(t => (
                <div key={t} className="flex items-center gap-2 text-xs text-stone-700">
                  <span className="text-blue-500/60">+</span> {t}
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <SectionLabel>How Personal Brand Feeds Body Recode</SectionLabel>
        <p className="text-sm text-stone-600 mb-4">The personal brand does not sell Body Recode directly. It builds the trust that makes Body Recode the obvious next step.</p>
        <div className="space-y-2">
          {[
            'Person follows @kade_dunstone_ because the thinking resonates',
            'They begin to understand the framework behind his work',
            'They encounter Body Recode naturally through content references',
            'They take the scorecard because they already trust the thinking',
          ].map((s, i) => (
            <div key={i} className="flex items-start gap-3 text-sm text-stone-700">
              <span className="text-stone-400 font-mono text-xs mt-0.5 w-4 shrink-0">{i + 1}</span>
              {s}
            </div>
          ))}
        </div>
        <div className="mt-4 p-3 bg-stone-100 rounded-lg border border-stone-200">
          <p className="text-xs text-stone-600">Never pitch Body Recode directly from the personal account. Reference it. Link it occasionally. Let the trust do the selling.</p>
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
    { done: false, step: 'Regular cadence begins - 3-4x Instagram' },
    { done: false, step: 'HeyGen avatar finalised - 1 video per week minimum' },
  ]

  return (
    <div className="space-y-5">
      <Card>
        <SectionLabel>Launch Checklist</SectionLabel>
        <div className="space-y-2">
          {steps.map((s, i) => (
            <div key={i} className="flex items-center gap-3 py-2 border-b border-stone-200/60 last:border-0">
              <div className="w-4 h-4 rounded border border-stone-300 shrink-0" />
              <p className="text-sm text-stone-700">{s.step}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <SectionLabel>Source Tracking</SectionLabel>
        <div className="space-y-2">
          {[
            { platform: 'Instagram bio',     url: 'bodyrecode.au/scorecard?source=instagram_kade' },
            { platform: 'Instagram story',   url: 'bodyrecode.au/scorecard?source=instagram_kade_story' },
          ].map(r => (
            <div key={r.platform} className="flex items-center justify-between py-2 border-b border-stone-200/60 last:border-0">
              <p className="text-sm text-stone-600 w-36 shrink-0">{r.platform}</p>
              <code className="text-xs text-blue-500 bg-blue-500/10 px-2 py-1 rounded">{r.url}</code>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <SectionLabel>Ecosystem Role</SectionLabel>
        <div className="space-y-3 text-sm text-stone-600">
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
                <span className="text-stone-400 font-mono text-xs mt-0.5 shrink-0">{i + 1}</span>
                <span className="text-stone-700">{s}</span>
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
      <div className="px-6 pt-6 pb-0 border-b border-stone-200">
        <div className="flex items-center gap-3 mb-1">
          <h1 className="text-xl font-semibold text-[#1A1A1A]">Personal Brand</h1>
          <span className="text-xs text-stone-500 bg-stone-200 px-2 py-0.5 rounded font-mono">@kade_dunstone_</span>
        </div>
        <p className="text-sm text-stone-500 mb-4">Instagram - the thinking, the journey, the builder</p>

        <div className="flex gap-1 overflow-x-auto pb-px">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-3.5 py-2 text-sm font-medium rounded-t-lg whitespace-nowrap transition-colors ${
                tab === t.id
                  ? 'bg-[#FFFFFF] text-[#1A1A1A] border-t border-l border-r border-stone-200'
                  : 'text-stone-500 hover:text-stone-700'
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
