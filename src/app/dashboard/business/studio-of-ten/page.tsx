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
        <SectionLabel>What Studio of Ten Is</SectionLabel>
        <p className="text-stone-300 text-sm leading-relaxed">
          A small build studio. We integrate AI into solo coaching and allied health practices - lead capture, client platforms, AI reports, automations - all custom-built and properly engineered. Capped at ten clients.
        </p>
        <div className="mt-4 space-y-2">
          {[
            'Not a SaaS product',
            'Not a generic agency',
            'Not Kajabi / Wix / Mindbody',
            'Not for tradies, consultants, or course creators',
          ].map(s => (
            <div key={s} className="flex items-center gap-2 text-sm text-stone-400">
              <span className="text-red-400">-</span> {s}
            </div>
          ))}
          <div className="flex items-start gap-2 text-sm text-stone-200 mt-3">
            <span className="text-blue-400 mt-0.5">+</span>
            <span>A studio that integrates AI properly into coaching and allied health practices - so the operator stops doing busywork and gets back to clients.</span>
          </div>
        </div>
        <div className="mt-4 p-3 bg-blue-500/5 border border-blue-500/20 rounded-lg">
          <p className="text-xs text-blue-300">Body Recode is the case study. We built and run a full custom platform for it - lead capture, AI reports, client portal, automations. Now we ship the same level of work for clients in the same niche.</p>
        </div>
      </Card>

      <Card>
        <SectionLabel>Core Philosophy</SectionLabel>
        <p className="text-2xl font-semibold text-white mb-3">AI integrated, properly. Capped at 10.</p>
        <p className="text-stone-400 text-sm leading-relaxed">
          AI integration done properly is complicated - we&apos;ve done the learning so coaches don&apos;t have to.<br />
          Ten clients is the upper bound of what we can deliver well.<br />
          When the cap is reached, the door closes and prospects join a waitlist.
        </p>
        <div className="mt-4 flex gap-2 flex-wrap">
          <Tag color="blue">Capped capacity</Tag>
          <Tag color="violet">No lock-in</Tag>
          <Tag color="amber">Owner-operator</Tag>
        </div>
      </Card>

      <Card>
        <SectionLabel>Confirmed Bio (Instagram)</SectionLabel>
        <div className="bg-stone-900 rounded-lg p-4 text-sm text-stone-200 leading-relaxed font-mono whitespace-pre-line">
{`Custom websites, platforms, and software for serious operators.
Capped at 10 clients. Yours never gets second priority.
↓`}
        </div>
        <p className="text-xs text-stone-500 mt-3">Link: studiooften.com</p>
      </Card>

      <Card>
        <SectionLabel>Platform Spec</SectionLabel>
        <div className="space-y-3">
          {[
            { platform: 'Instagram', handle: '@studiooften', link: 'studiooften.com' },
            { platform: 'LinkedIn',  handle: 'Studio of Ten / Kade Dunstone', link: 'studiooften.com' },
            { platform: 'Threads',   handle: '@studiooften (optional)', link: 'studiooften.com' },
          ].map(r => (
            <div key={r.platform} className="flex items-center justify-between py-2 border-b border-stone-800 last:border-0">
              <div>
                <p className="text-sm font-medium text-white">{r.platform}</p>
                <p className="text-xs text-stone-400">{r.handle}</p>
              </div>
              <code className="text-xs text-blue-400 bg-blue-500/10 px-2 py-1 rounded">{r.link}</code>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-stone-500">Profile mark: the &quot;10&quot; on near-black, mono bold. Vector at 03_STUDIO_OF_TEN/01_BRAND/assets/instagram-profile.png.</p>
      </Card>

      <Card>
        <SectionLabel>Voice</SectionLabel>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-blue-500/60 mb-2">Always</p>
            <div className="space-y-1">
              {['Direct', 'Confident, not cocky', 'Specific - name tools, name outcomes', 'Honest about limits and trade-offs', 'Studio voice (we, the studio) - not solo I'].map(t => (
                <div key={t} className="flex items-center gap-2 text-xs text-stone-300">
                  <span className="text-blue-500/60">+</span> {t}
                </div>
              ))}
            </div>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-widest text-red-500/60 mb-2">Never</p>
            <div className="space-y-1">
              {['Synergy / leverage / solutions', '"We\'re passionate about..."', 'Award-winning (no awards)', '"Just one person" - studio voice instead', 'Em dashes - use hyphens', 'Emojis in client-facing copy', 'Engineering jargon coaches don\'t recognise (Postmark, OAuth, Inngest)'].map(t => (
                <div key={t} className="flex items-center gap-2 text-xs text-stone-500">
                  <span className="text-red-500/60">-</span> {t}
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <SectionLabel>Contrarian Positions (Content Foundation)</SectionLabel>
        <div className="space-y-2">
          {[
            'Most coaches don\'t have time to learn AI. We do that for them.',
            'AI for coaches isn\'t ChatGPT prompts. It\'s integrated systems that run quietly in the background.',
            'Kajabi, Wix, and Mindbody hit a ceiling fast. Custom AI-integrated software is cheaper than you think.',
            'A 6-figure coaching practice deserves better than $39/mo Mailchimp templates.',
            'AI integration done properly takes years to learn. Most coaches shouldn\'t learn it - they should hire someone who has.',
            'The studio integrates AI where it actually matters: client intake, reports, follow-ups, content - not gimmicks.',
            'You don\'t need a 30-person agency. You need a small studio that understands coaching businesses.',
            'Scarcity is not a marketing trick when it\'s the actual constraint. Ten clients is the limit of what we can deliver well.',
            'The platform is the proof. Body Recode runs on what we build. If it works for a real coaching practice, it works for yours.',
            'Most coaches rent software that wasn\'t built for them. Yours should be tuned to how you actually work.',
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
  const stories = [
    {
      title: 'Origin - The Body Recode Build',
      color: 'blue' as const,
      context: 'Started as a performance coach. Couldn\'t afford an agency to build the platform Body Recode needed. Off-the-shelf tools weren\'t fit for purpose. So learned to build it properly, end-to-end.',
      lesson: 'Body Recode is the proof. Coaching platform, CRM, automations, payments - all custom. Studio of Ten exists because that capability has capacity for 10 clients alongside the main game.',
    },
    {
      title: 'Why the Cap Exists',
      color: 'violet' as const,
      context: 'Ten is the actual upper bound of what one operator can deliver well alongside Body Recode. Not a marketing trick. The math: ~$15K/mo recurring at capacity, sustainable, and Body Recode stays the priority.',
      lesson: 'When the cap is reached, the door closes. The cap is what makes the offer credible - clients know they\'re not one of fifty.',
    },
    {
      title: 'Why It Exists Alongside Body Recode',
      color: 'amber' as const,
      context: 'Three reasons: side revenue while Performance Coaching builds its base, productive use of the platform-building capability, and the same tools and patterns reinforce both.',
      lesson: 'Studio of Ten and Body Recode share a stack. Building for clients makes Body Recode\'s platform sharper. They are not competing for attention - they\'re compounding.',
    },
    {
      title: 'The Filter',
      color: 'orange' as const,
      context: 'Some clients are wrong: those who want $500 sites, who micromanage every pixel, who\'ve been through five developers in two years, who don\'t have revenue yet.',
      lesson: 'The filter question: "Would I be happy telling Body Recode clients this is who I work with?" If no, walk away. The cap means walking away is fine.',
    },
  ]

  return (
    <div className="space-y-5">
      <Card>
        <SectionLabel>The Core Story</SectionLabel>
        <p className="text-sm text-stone-400 mb-4">
          Studio of Ten is the productive use of a real capability. Every piece of content connects back to one of these threads.
        </p>
        <div className="space-y-4">
          {stories.map(s => (
            <div key={s.title} className="border border-stone-800 rounded-lg overflow-hidden">
              <div className={`px-4 py-2.5 border-b border-stone-800 ${
                s.color === 'blue' ? 'bg-blue-500/5' :
                s.color === 'violet' ? 'bg-violet-500/5' :
                s.color === 'amber' ? 'bg-amber-500/5' : 'bg-orange-500/5'
              }`}>
                <p className="text-sm font-semibold text-white">{s.title}</p>
              </div>
              <div className="px-4 py-3 space-y-2">
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-stone-600 mb-1">Context</p>
                  <p className="text-sm text-stone-400">{s.context}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-stone-600 mb-1">What it produced</p>
                  <p className="text-sm text-stone-200">{s.lesson}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <SectionLabel>Relationship to Body Recode</SectionLabel>
        <p className="text-sm text-stone-400 mb-3">Fully separate brand, audience, and offer. But the bridge is always the same.</p>
        <div className="space-y-2">
          {[
            'Body Recode is the long-term play - performance coaching, the main game.',
            'Studio of Ten is the side revenue stream - capped, deliberately small.',
            'Body Recode is the case study Studio of Ten uses to win clients.',
            'If a client engagement ever compromises Body Recode, the engagement loses.',
          ].map((s, i) => (
            <div key={i} className="flex items-start gap-3 text-sm text-stone-300">
              <span className="text-stone-600 font-mono text-xs mt-0.5 w-4 shrink-0">{i + 1}</span>
              {s}
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
      title: 'AI in Practice',
      color: 'blue' as const,
      tagLabel: 'AI',
      description: 'Real AI use cases for coaching and allied health practices. What we built, what it does, what it saved. No theory, no demos - actual production AI doing actual work.',
      topics: [
        'AI-personalised intake reports replacing 2-hour writing sessions',
        'Weekly check-in synthesis that runs while clients sleep',
        'Custom AI for content briefs, follow-ups, and client comms',
        'Why "AI for coaches" isn\'t ChatGPT prompts',
        'What integrating AI actually looks like in week 1, week 4, month 3',
      ],
    },
    {
      num: '02',
      title: 'The 10-Client Cap',
      color: 'violet' as const,
      tagLabel: 'Cap',
      description: 'Why scarcity is the offer. Why most agencies oversell scale. Why a real cap changes the relationship between studio and client.',
      topics: [
        'The math behind the cap (capacity, revenue, sustainability)',
        'Why "yours never gets second priority" is only true at small scale',
        'How the cap filters out wrong-fit clients before discovery',
        'What it feels like to be one of ten vs one of fifty',
        'When a slot opens - waitlist mechanics',
      ],
    },
    {
      num: '03',
      title: 'Stack & Tools',
      color: 'amber' as const,
      tagLabel: 'Stack',
      description: 'Tools coaches and allied health practitioners actually use - what works, what hits a ceiling, what costs more than people realise. Concrete comparisons, not vendor pitches.',
      topics: [
        'Why I dropped Calendly (and what replaced it)',
        'The 5-year cost of Kajabi vs custom',
        'Squarespace ceiling: when to leave',
        'Mindbody for allied health: where it works, where it breaks',
        'Practice Better, Healthie, ClinicMaster - what they all miss',
        'Stripe vs the platforms that take a cut on every payment',
      ],
    },
    {
      num: '04',
      title: 'Operator-Builder',
      color: 'orange' as const,
      tagLabel: 'Operator',
      description: 'The cross-pollination of running a coaching practice and building the software for it. Lessons that only come from being on both sides at once.',
      topics: [
        'What we learned about coaching businesses by designing software for them',
        'Why operators make better builders than developers do',
        'How a real client problem becomes a feature in the next build',
        'When to build, when to buy, when to leave it manual',
        'Why every sales call is research input for the next iteration',
      ],
    },
  ]

  return (
    <div className="space-y-4">
      {pillars.map(p => (
        <Card key={p.num}>
          <div className="flex items-start gap-4">
            <span className={`text-2xl font-bold font-mono ${
              p.color === 'blue' ? 'text-blue-500/40' :
              p.color === 'violet' ? 'text-violet-500/40' :
              p.color === 'amber' ? 'text-amber-500/40' : 'text-orange-500/40'
            }`}>{p.num}</span>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <p className="text-base font-semibold text-white">Pillar {p.num} - {p.title}</p>
                <Tag color={p.color}>{p.tagLabel}</Tag>
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
  const [scriptTab, setScriptTab] = useState<'launch' | 'pillar1' | 'pillar2' | 'pillar3' | 'pillar4'>('launch')

  type PillarColor = 'teal' | 'violet' | 'amber' | 'orange' | 'stone' | 'blue'

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
      id: 'l1', type: 'Arrival', pillar: 'Positioning', pillarColor: 'blue', platform: 'LinkedIn + Instagram',
      hook: 'Studio of Ten is taking on ten clients. That\'s the whole company.',
      body: 'A small build studio that integrates AI into solo coaching and allied health practices. Custom systems built around how your business already runs - lead capture, client platforms, AI reports, automations. Capped at ten clients, ever.',
    },
    {
      id: 'l2', type: 'Contrarian', pillar: 'AI', pillarColor: 'blue', platform: 'LinkedIn + Instagram',
      hook: 'Most coaches don\'t have time to figure out AI.',
      body: 'The tools change every month. The integrations are fragile. Most operators end up doing nothing because the learning curve isn\'t worth it. We spent two years figuring it out so coaches don\'t have to. Get back to clients - we\'ll handle the AI.',
    },
    {
      id: 'l3', type: 'Build', pillar: 'AI', pillarColor: 'blue', platform: 'LinkedIn + Instagram',
      hook: 'AI for coaches isn\'t ChatGPT prompts.',
      body: 'It\'s integrated systems running quietly in the background. AI reading the intake and writing the assessment. AI synthesising weekly check-ins and drafting the response. Real production AI doing real coaching admin. That\'s what we build.',
    },
    {
      id: 'l4', type: 'Stack', pillar: 'Stack', pillarColor: 'amber', platform: 'LinkedIn + Instagram',
      hook: 'Kajabi, Wix, and Mindbody hit a ceiling faster than most coaches think.',
      body: 'You start with templates because they\'re fast. Two years in, you\'re fighting the platform. Custom AI-integrated software is cheaper than you think when you stop renting software that wasn\'t built for your business.',
    },
    {
      id: 'l5', type: 'Filter', pillar: 'Cap', pillarColor: 'violet', platform: 'LinkedIn + Instagram',
      hook: 'The cap means walking away is fine.',
      body: 'When the studio only has ten slots, we stop chasing. The wrong client at the right price still costs a slot. The brand does the filtering before discovery starts.',
    },
  ]

  const pillar1Scripts: Script[] = [
    {
      id: 'p1a', type: 'Use Case', pillar: 'AI', pillarColor: 'blue', platform: 'LinkedIn',
      hook: 'AI now writes the intake reports I used to spend two hours on.',
      body: 'Client fills out a 200-question intake. AI synthesises it into a structured assessment - body state, blockers, priorities, recommended approach. I review and adjust in 15 minutes. The reports are better than what I wrote manually because the AI doesn\'t skip questions.',
    },
    {
      id: 'p1b', type: 'Use Case', pillar: 'AI', pillarColor: 'blue', platform: 'LinkedIn',
      hook: 'Weekly check-ins now interpret themselves.',
      body: 'Client fills out their weekly form. AI reads it against the last 4 weeks, flags pattern shifts, drafts the response. I edit and send. The check-in that used to take 30 minutes now takes 5 - and it\'s more consistent because the AI never forgets the context.',
    },
    {
      id: 'p1c', type: 'Case Study', pillar: 'AI', pillarColor: 'blue', platform: 'LinkedIn + Instagram',
      hook: '"AI for coaches" isn\'t ChatGPT prompts.',
      copy: 'It\'s a system that:\n\nReads the client\'s intake and writes their assessment.\nReads weekly check-ins and drafts the response.\nReads program performance and flags what to change.\nReads sales calls and pulls the next content topic.\n\nAll integrated. All tuned to one practice. All running while you sleep.\n\nThat\'s what we mean by AI integration.',
    },
    {
      id: 'p1d', type: 'Reframe', pillar: 'AI', pillarColor: 'blue', platform: 'LinkedIn',
      hook: 'Most coaches don\'t need to learn AI.',
      body: 'They need to hire someone who already has. The tools change every month. The integrations are fragile. Learning AI as a side quest steals from the work that actually pays. We\'ve done two years of learning so coaches don\'t have to.',
    },
  ]

  const pillar2Scripts: Script[] = [
    {
      id: 'p2a', type: 'Contrarian', pillar: 'Cap', pillarColor: 'violet', platform: 'LinkedIn',
      hook: 'Scarcity is not a marketing trick when it\'s the actual constraint.',
      body: 'Ten clients is the math. Twenty would mean compromising the work I\'m already doing. The cap is honest. That\'s why the cap is the brand.',
    },
    {
      id: 'p2b', type: 'Framework', pillar: 'Cap', pillarColor: 'violet', platform: 'LinkedIn + Instagram',
      hook: 'One of ten vs one of fifty changes everything.',
      copy: 'One of fifty: you\'re a ticket in a queue.\n\nOne of ten: you have a phone number that gets answered.\n\nThe second one is impossible at scale. That\'s why most agencies can\'t deliver it - they can\'t take the math.',
    },
    {
      id: 'p2c', type: 'Observation', pillar: 'Cap', pillarColor: 'violet', platform: 'LinkedIn',
      hook: 'The cap does the filtering before the discovery call.',
      body: 'People who want $500 sites don\'t enquire. People who want unlimited revisions don\'t enquire. The brand sets the price and the constraint - the wrong fits self-disqualify.',
    },
    {
      id: 'p2d', type: 'Math', pillar: 'Cap', pillarColor: 'violet', platform: 'LinkedIn',
      hook: 'Here\'s the actual capacity math.',
      body: 'Ten clients at $1,500/mo = $15K/mo recurring. ~15-20 hrs/week sustained. The numbers only work because the cap is real. Stretch past ten and the whole model breaks.',
    },
  ]

  const pillar3Scripts: Script[] = [
    {
      id: 'p3a', type: 'Tool Review', pillar: 'Stack', pillarColor: 'amber', platform: 'LinkedIn',
      hook: 'Why I dropped Calendly for my coaching business.',
      body: 'It works, it\'s polished, it costs $192/yr per user. But it owns the booking experience and the data. We built native scheduling in 4 hours. Same UX, my brand, my data. The $192 was the smallest part of the cost.',
    },
    {
      id: 'p3b', type: 'Cost Math', pillar: 'Stack', pillarColor: 'amber', platform: 'LinkedIn + Instagram',
      hook: 'The 5-year cost of Kajabi vs custom.',
      copy: 'Kajabi at $199/mo over 5 years = $11,940.\n\nA custom equivalent: ~30 hours to build, ~$30/mo to run.\n\nTotal 5-year cost: ~$3K plus 30 hours.\n\nThe build is cheaper than three years of Kajabi. Most coaches never run the math.',
    },
    {
      id: 'p3c', type: 'Comparison', pillar: 'Stack', pillarColor: 'amber', platform: 'LinkedIn',
      hook: 'Mindbody works for class-based studios. Not for solo allied health.',
      body: 'Built for a 1990s gym scheduling problem. Try fitting a complex client intake, AI assessments, or branded reports into it. Not impossible - just constantly fighting the platform. Allied health practitioners deserve software built for them, not for Pure Barre.',
    },
    {
      id: 'p3d', type: 'Reframe', pillar: 'Stack', pillarColor: 'amber', platform: 'LinkedIn',
      hook: 'Practice Better, Healthie, ClinicMaster - they all miss the same thing.',
      body: 'They\'re thin layers over the same booking + form + invoice template. Good enough to start. Frustrating once your practice has its own way of doing things. The moment you want a custom intake flow or AI-driven reports, you hit the ceiling. Custom isn\'t scary - it\'s the only way past it.',
    },
  ]

  const pillar4Scripts: Script[] = [
    {
      id: 'p4a', type: 'Story', pillar: 'Operator', pillarColor: 'orange' as const, platform: 'LinkedIn',
      hook: 'I learned more about my coaching business in 6 months of building software for it than I did in 15 years of running it.',
      body: 'When you have to model the client journey in code, every assumption surfaces. Every implicit step becomes explicit. The build is the audit you never scheduled. That\'s the angle the studio takes for every client.',
    },
    {
      id: 'p4b', type: 'Contrarian', pillar: 'Operator', pillarColor: 'orange', platform: 'LinkedIn',
      hook: 'Coaches make better software clients than tech founders do.',
      body: 'Coaches know exactly what their clients need. They feel the pain at 11pm on Sundays. Specs are downstream of pain - and they have the pain. Tell us your problem and we\'ll build the system. Don\'t bring us specs - bring us the friction.',
    },
    {
      id: 'p4c', type: 'Pattern', pillar: 'Operator', pillarColor: 'orange', platform: 'LinkedIn + Instagram',
      hook: 'The sales call is research input for the platform.',
      copy: 'Every objection is a hint about what the platform should make obvious.\n\nEvery confused question is a hint about UX.\n\nEvery "can it do X" is a hint about what to build next.\n\nMost agencies don\'t have this loop. They just take the brief and execute. Operators build with the loop running.',
    },
    {
      id: 'p4d', type: 'Decision', pillar: 'Operator', pillarColor: 'orange', platform: 'LinkedIn',
      hook: 'When to build, when to buy, when to leave it manual.',
      body: 'Build: when it\'s your moat or it costs more to rent than to own. Buy: when it\'s commodity (auth, email infrastructure, payments). Manual: when you\'re running it less than once a week. Most teams build and buy in the wrong order.',
    },
  ]

  const scriptSections: Record<typeof scriptTab, { label: string; scripts: Script[] }> = {
    launch:  { label: 'Launch - First 5 Posts', scripts: launchScripts },
    pillar1: { label: 'Pillar 1 - Build', scripts: pillar1Scripts },
    pillar2: { label: 'Pillar 2 - Cap', scripts: pillar2Scripts },
    pillar3: { label: 'Pillar 3 - Stack', scripts: pillar3Scripts },
    pillar4: { label: 'Pillar 4 - Operator', scripts: pillar4Scripts },
  }

  const current = scriptSections[scriptTab]

  return (
    <div className="space-y-4">
      <div className="flex gap-1.5 flex-wrap">
        {(Object.entries(scriptSections) as [typeof scriptTab, { label: string }][]).map(([k, v]) => (
          <button
            key={k}
            onClick={() => setScriptTab(k)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              scriptTab === k
                ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                : 'text-stone-500 border-stone-800 hover:text-stone-300'
            }`}
          >{v.label}</button>
        ))}
      </div>

      <Card>
        <SectionLabel>{current.label}</SectionLabel>
        {scriptTab === 'launch' && <p className="text-xs text-stone-500 mb-4">Post these in order before any outreach or promotion begins.</p>}
        <div className="space-y-2">
          {current.scripts.map((s, i) => (
            <div key={s.id} className="border border-stone-800 rounded-lg overflow-hidden">
              <button
                onClick={() => setExpanded(expanded === s.id ? null : s.id)}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-stone-900/50 transition-colors text-left"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-xs text-stone-600 font-mono shrink-0">{String(i + 1).padStart(2, '0')}</span>
                  <span className="text-sm font-medium text-white truncate">{s.hook}</span>
                  <Tag color={s.pillarColor}>{s.type}</Tag>
                </div>
                <span className="text-stone-600 text-xs shrink-0 ml-2">{expanded === s.id ? 'hide' : 'view'}</span>
              </button>
              {expanded === s.id && (
                <div className="px-4 pb-4 space-y-3 border-t border-stone-800">
                  <div className="flex items-center gap-3 mt-3">
                    <Tag color={s.pillarColor}>{s.pillar}</Tag>
                    <span className="text-xs text-stone-500">{s.platform}</span>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-[10px] uppercase tracking-widest text-stone-600">Copy</p>
                      <button
                        onClick={() => navigator.clipboard.writeText(s.copy ?? [s.hook, s.body].filter(Boolean).join('\n\n'))}
                        className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                      >Copy</button>
                    </div>
                    <div className="bg-stone-900 rounded-lg p-3 text-sm text-stone-200 leading-relaxed whitespace-pre-line">
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
        <SectionLabel>LinkedIn - Primary Channel</SectionLabel>
        <div className="flex items-center gap-2 mb-4">
          <Tag color="blue">2-3x per week</Tag>
          <Tag color="stone">Operator-builder voice</Tag>
        </div>
        <div className="space-y-2">
          {[
            'Build logs: what shipped this week, specific feature, specific trade-off',
            'Tool write-ups: real cost math, real comparisons, no vendor pitches',
            'The cap explained: scarcity math, capacity, why ten is the number',
            'Operator-builder takes: what running the business teaches the build',
            'Pure text or single image - no carousels for LinkedIn',
          ].map(t => (
            <div key={t} className="flex items-start gap-2 text-sm text-stone-300">
              <span className="text-blue-500 mt-1 shrink-0">-</span>
              {t}
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <SectionLabel>Instagram - Secondary, More Polished</SectionLabel>
        <div className="flex items-center gap-2 mb-4">
          <Tag color="violet">1-2x per week</Tag>
        </div>
        <div className="space-y-3">
          {[
            { type: 'Carousels',   desc: 'Build breakdowns, frameworks, before/after platform shots' },
            { type: 'Quote cards', desc: 'Contrarian positions on the cap and lock-in' },
            { type: 'Stack badges', desc: 'Tools used in a specific build (mono labels, brand-aligned)' },
          ].map(r => (
            <div key={r.type} className="flex items-center gap-3 py-2 border-b border-stone-800/60 last:border-0">
              <p className="text-sm font-medium text-white w-28 shrink-0">{r.type}</p>
              <p className="text-sm text-stone-400">{r.desc}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <SectionLabel>Threads - Optional, Build-in-Public</SectionLabel>
        <div className="flex items-center gap-2 mb-4">
          <Tag color="stone">Optional - opportunistic</Tag>
        </div>
        <p className="text-sm text-stone-400">
          Cross-post operator-builder takes from LinkedIn when relevant. Threads is not a priority channel for Studio of Ten - LinkedIn is where the prospects are.
        </p>
      </Card>

      <Card>
        <SectionLabel>Tone</SectionLabel>
        <p className="text-sm text-stone-300 mb-4">Direct. Specific. Tech-forward. Reads like an operator who has built real systems and is now showing the work.</p>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-red-500/60 mb-2">Never</p>
            <div className="space-y-1">
              {['Agency-speak', 'Stock screenshots', 'Generic startup advice', 'Hustle / grind energy', 'Vague capability statements'].map(t => (
                <div key={t} className="flex items-center gap-2 text-xs text-stone-500">
                  <span className="text-red-500/60">-</span> {t}
                </div>
              ))}
            </div>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-widest text-blue-500/60 mb-2">Always</p>
            <div className="space-y-1">
              {['Specific tool, specific cost, specific time', 'A real decision and the reasoning', 'A trade-off named honestly', 'Receipts (screenshots, code, math)'].map(t => (
                <div key={t} className="flex items-center gap-2 text-xs text-stone-300">
                  <span className="text-blue-500/60">+</span> {t}
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <SectionLabel>How Studio of Ten Content Feeds the Studio</SectionLabel>
        <p className="text-sm text-stone-400 mb-4">The content does not pitch directly. It demonstrates capability and qualifies the prospect.</p>
        <div className="space-y-2">
          {[
            'Operator sees a build log or tool write-up - thinks "this person knows what they\'re doing"',
            'Encounters the 10-cap framing - thinks "that\'s the kind of attention I want"',
            'Lands on studiooften.com - already pre-qualified by the content',
            'Submits scorecard or books a call - filtered by ICP fit before time is spent',
          ].map((s, i) => (
            <div key={i} className="flex items-start gap-3 text-sm text-stone-300">
              <span className="text-stone-600 font-mono text-xs mt-0.5 w-4 shrink-0">{i + 1}</span>
              {s}
            </div>
          ))}
        </div>
        <div className="mt-4 p-3 bg-stone-900 rounded-lg border border-stone-800">
          <p className="text-xs text-stone-400">Never push a pitch. Show the work. Let the cap do the qualifying.</p>
        </div>
      </Card>
    </div>
  )
}

function LaunchTab() {
  const steps = [
    { done: false, step: 'Instagram bio set, profile mark uploaded (10 on near-black)' },
    { done: false, step: 'LinkedIn personal title updated to mention Studio of Ten' },
    { done: false, step: 'studiooften.com link in all bios' },
    { done: false, step: 'First 5 launch posts drafted and queued' },
    { done: false, step: 'Personal network blitz - 30+ direct messages' },
    { done: false, step: 'First build log live within 7 days' },
    { done: false, step: 'Sustained cadence: 2-3 LinkedIn posts/week, 1-2 IG/week' },
    { done: false, step: 'First case study written after first paying client ships' },
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
        <SectionLabel>First 90 Days Plan</SectionLabel>
        <div className="space-y-3">
          {[
            { week: 'Weeks 1-2', action: 'Land the bios, set up profiles, write first 5 LinkedIn posts, queue them.' },
            { week: 'Weeks 3-4', action: 'Personal network blitz - 30+ direct messages with personal note + studiooften.com.' },
            { week: 'Weeks 5-8', action: 'Sustained LinkedIn cadence (3x/week), follow up warm leads, expect first 1-2 EOIs.' },
            { week: 'Weeks 9-12', action: 'First 1-2 client engagements running, start documenting first case study.' },
          ].map(r => (
            <div key={r.week} className="border border-stone-800 rounded-lg p-3">
              <p className="text-xs font-mono text-blue-400 mb-1">{r.week}</p>
              <p className="text-sm text-stone-300">{r.action}</p>
            </div>
          ))}
        </div>
        <p className="text-xs text-stone-500 mt-4">Target by end of 90 days: 3 active clients.</p>
      </Card>

      <Card>
        <SectionLabel>Source Tracking</SectionLabel>
        <div className="space-y-2">
          {[
            { platform: 'LinkedIn bio',     url: 'studiooften.com?source=linkedin' },
            { platform: 'Instagram bio',    url: 'studiooften.com?source=instagram' },
            { platform: 'Instagram story',  url: 'studiooften.com?source=instagram_story' },
            { platform: 'Threads bio',      url: 'studiooften.com?source=threads' },
            { platform: 'Direct DM blitz',  url: 'studiooften.com?source=network' },
          ].map(r => (
            <div key={r.platform} className="flex items-center justify-between py-2 border-b border-stone-800/60 last:border-0">
              <p className="text-sm text-stone-400 w-36 shrink-0">{r.platform}</p>
              <code className="text-xs text-blue-400 bg-blue-500/10 px-2 py-1 rounded">{r.url}</code>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <SectionLabel>Ecosystem Role</SectionLabel>
        <div className="space-y-3 text-sm text-stone-400">
          <p>Studio of Ten is one of three Kade-owned brands. Each plays a different role.</p>
          <div className="mt-4 space-y-2">
            {[
              'Body Recode - the long-term coaching play, the case study, the proof asset',
              'Personal Brand (@kade_dunstone_) - the thinking, the journey, the operator-builder',
              'Studio of Ten - the side revenue, the capped studio, the build offer',
              'A prospect can find Kade through any of the three and arrive at Studio of Ten',
              'Studio of Ten content references Body Recode as the case study, never the offer',
              'Body Recode never sells Studio of Ten - they live in different audiences',
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

export default function StudioOfTenPage() {
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
      <div className="px-6 pt-6 pb-0 border-b border-stone-800">
        <div className="flex items-center gap-3 mb-1">
          <h1 className="text-xl font-semibold text-white">Studio of Ten</h1>
          <span className="text-xs text-stone-500 bg-stone-800 px-2 py-0.5 rounded font-mono">studiooften.com</span>
        </div>
        <p className="text-sm text-stone-500 mb-4">Capped-capacity build studio - the brand, the offer, the cadence</p>

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

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-3xl">
          {tabContent[tab]}
        </div>
      </div>
    </div>
  )
}
