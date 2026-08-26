import Link from 'next/link'
import { brand } from '@/config/tenant'
import { PageHeader, Card, MONO_FONT } from '@/components/dashboard/ui'
import { BookOpen, MessageSquare, ShieldCheck, Download, FileText, ArrowUpRight } from 'lucide-react'

export const dynamic = 'force-dynamic'

// Coach-facing training course for the Coach Co-Pilot. Teaches coaches to use
// the tool to one standard — the white-label enablement surface. Tenant-aware
// via brand(); the doctrine it teaches stays Body Recode (the licensed engine).

type Lesson = {
  n: number
  title: string
  where: 'Client' | 'Anywhere'
  forWhat: string
  how: string[]
  example: string
  wont: string
}

const LESSONS: Lesson[] = [
  {
    n: 1,
    title: 'Explain a read',
    where: 'Client',
    forWhat: 'Understand WHY the system landed a client where it did — the state, the phase, the gates — in plain terms you can act on.',
    how: [
      'Open a client, tap the co-pilot bubble (bottom-right).',
      'Ask it to explain: “Why did the synthesis put her in Remediation?”, “Walk me through his fat map.”',
    ],
    example: '“Why is capacity Amber for him?” → it cites his recovery and sleep answers and what that means for load.',
    wont: 'It won’t invent data — if the answer isn’t in the file, it says so.',
  },
  {
    n: 2,
    title: 'Pressure-test a call',
    where: 'Client',
    forWhat: 'Have it argue against you, against the doctrine, so you don’t talk yourself into progressing someone who isn’t ready. This is the moat.',
    how: [
      'State your intended call and ask it to challenge you.',
      '“Doctrine says hold — talk me out of progressing him.” “Should this be Restoration?”',
    ],
    example: '“I want to move her to Accumulation” → it checks the readiness gates and tells you what has to be true first.',
    wont: 'It won’t rubber-stamp you — if the gates aren’t clear, it holds the line.',
  },
  {
    n: 3,
    title: 'Review a plan against doctrine',
    where: 'Client',
    forWhat: 'Catch what the engine got wrong before you publish — the single habit that lets any coach reach the standard.',
    how: [
      'After you generate a program or nutrition plan, ask: “Review his program against the doctrine.”',
      'It reads the actual sessions and macros and flags what’s off.',
    ],
    example: 'It catches intensity sitting in a Restoration block, a calorie target that leaked into the training plan, or a meal count fighting an appetite-suppression med.',
    wont: 'It reviews and advises — you make the change and publish.',
  },
  {
    n: 4,
    title: 'Draft a program',
    where: 'Client',
    forWhat: 'Get a full, doctrine-correct starting spec instead of a blank form.',
    how: [
      'Tap “＋ Draft a program”.',
      'It proposes phase, goal, frequency, duration, training age, competency — each with a reason.',
      'Review, edit the block name, tap “Generate this draft”.',
    ],
    example: 'For a stressed Remediation client it proposes a Restoration block, capacity goal, conservative volume — and tells you why.',
    wont: 'It only ever saves a DRAFT. Nothing reaches the client until you publish it on the program page.',
  },
  {
    n: 5,
    title: 'Refine a draft',
    where: 'Client',
    forWhat: 'Change one thing without re-rolling the whole plan — swaps, tweaks, and structural edits.',
    how: [
      'Tap “✎ Refine program” (or “✎ Refine nutrition”), then describe ONE change.',
      '“Swap the barbell squat for a hip thrust.” “Drop the bench to 3 sets.” “Add a fourth day.” “Drop Wednesday’s carries.”',
      'It shows exactly what will change; tap Apply.',
    ],
    example: '“Add a fourth day” → it proposes a phase-appropriate session and adds it; the other three days stay byte-for-byte identical.',
    wont: 'It won’t make a change that breaks the phase, a gate, a stated injury, the frequency ceiling, or (nutrition) the protein anchor.',
  },
  {
    n: 6,
    title: 'Draft & refine nutrition',
    where: 'Client',
    forWhat: 'Everything above, for the nutrition plan — draft it, then edit foods and meals.',
    how: [
      'Tap “＋ Draft nutrition” to propose the plan (entry state, protein anchor, carb demand, meals/day).',
      'Tap “✎ Refine nutrition” to change one thing: “Swap the oats for berries.” “Drop to 3 meals.”',
    ],
    example: 'Swap a food and it re-sums that meal’s macros and the day’s calorie band automatically — nothing desyncs.',
    wont: 'It flags any change that would break the protein anchor, the calorie floor, or a dietary restriction.',
  },
  {
    n: 7,
    title: 'Read your roster + morning brief',
    where: 'Anywhere',
    forWhat: 'See who needs you across ALL your clients without opening each profile.',
    how: [
      'On any non-client page, the bubble shows a red badge = clients awaiting you.',
      'Open it and tap “☀ Morning brief”, or ask “Who’s drifting this week?”, “Who’s due to progress?”',
    ],
    example: 'The brief groups your roster by urgency, names the doctrine reason for each, and the single next step.',
    wont: 'For a deep single-client question it points you to open that client’s profile.',
  },
  {
    n: 8,
    title: 'Set your preferences',
    where: 'Anywhere',
    forWhat: 'Teach it how YOU like to coach so it applies that everywhere.',
    how: [
      'Open the bubble on a non-client page → “What I can help with” → “⚙ Set your coaching preferences”.',
      'Write plain guidance: “Favour 4-day splits when the gates allow.” “Keep first blocks to 3 sets.” “Prefer dairy-free swaps.”',
    ],
    example: 'From then on, its drafts and advice lean your way — where the doctrine allows.',
    wont: 'Preferences are SOFT guidance only. They never override a client’s readiness gates, phase, or safety.',
  },
]

const WALKTHROUGHS: { title: string; steps: string[] }[] = [
  {
    title: 'New client → their first block',
    steps: [
      'Open the client. Ask the co-pilot to explain their read so you understand the state and phase.',
      'Tap “＋ Draft a program”. Sanity-check the proposed phase/goal against what it told you.',
      'Generate. Then ask it: “Review this program against the doctrine.”',
      'Fix anything it flags via “✎ Refine program”, then publish.',
    ],
  },
  {
    title: 'A client is drifting → triage it',
    steps: [
      'From any page, tap the co-pilot bubble and hit “☀ Morning brief”.',
      'Find the client flagged as regressing; read the doctrine reason.',
      'Open their profile, ask the co-pilot to pressure-test whether to hold or adjust.',
      'If a plan change is needed, refine the draft — one change at a time.',
    ],
  },
]

export default function CopilotGuidePage() {
  const b = brand()
  return (
    <div>
      <PageHeader
        eyebrow={`${b.name} · Coach training`}
        title="Coach Co-Pilot — how to use it"
        subtitle="A short course on getting the most out of your co-pilot. Work through it once and you’ll run every client to the same standard."
        accent="blue"
      />

      {/* Start here */}
      <Card className="mb-6" accent="blue">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#F0F6FF] border border-[#CBD9F2] flex items-center justify-center shrink-0">
            <BookOpen size={17} className="text-[#1B6DFC]" />
          </div>
          <div className="min-w-0">
            <p className="text-[15px] font-bold text-[#141821] mb-1.5">Start here</p>
            <p className="text-[13.5px] text-[#4B4B4B] leading-relaxed mb-3">
              The co-pilot is a doctrine-trained mentor you talk with. It rides on every page as a floating bubble.
              On a <strong>client’s profile</strong> it has read that client’s file and answers grounded in it.
              On <strong>any other page</strong> it reads your whole roster and answers about the method in general.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              <div className="br-card px-3.5 py-2.5">
                <p className="text-[12px] font-medium text-[#141821] mb-0.5">Rule 1 — You approve everything</p>
                <p className="text-[12.5px] text-[#666D7A] leading-relaxed">Nothing it drafts or edits reaches a client on its own. It’s always a draft you review and publish.</p>
              </div>
              <div className="br-card px-3.5 py-2.5">
                <p className="text-[12px] font-medium text-[#141821] mb-0.5">Rule 2 — Doctrine always wins</p>
                <p className="text-[12.5px] text-[#666D7A] leading-relaxed">It never overrides a client’s readiness gates, phase order, injuries, or safety — not for your instruction, not for your preferences.</p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Lessons */}
      <p className="text-[11px] font-medium text-[#98A0AD] mb-3" style={{ fontFamily: MONO_FONT }}>The lessons — one per capability</p>
      <div className="space-y-4 mb-8">
        {LESSONS.map((l) => (
          <Card key={l.n}>
            <div className="flex items-start gap-3.5">
              <div className="w-8 h-8 rounded-lg bg-[#141821] text-white flex items-center justify-center shrink-0 text-[13px] font-bold tabular-nums" style={{ fontFamily: MONO_FONT }}>
                {String(l.n).padStart(2, '0')}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap mb-1.5">
                  <h3 className="text-[15px] font-bold text-[#141821]">{l.title}</h3>
                  <span className="text-[11.5px] font-mediumr px-1.5 py-0.5 rounded-full border border-[#B5CFFC] bg-[rgba(27,109,252,0.06)] text-[#1B6DFC]" style={{ fontFamily: MONO_FONT }}>
                    {l.where === 'Client' ? 'On a client' : 'Anywhere'}
                  </span>
                </div>
                <p className="text-[13.5px] text-[#4B4B4B] leading-relaxed mb-3">{l.forWhat}</p>

                <p className="text-[11px] font-medium text-[#98A0AD] mb-1">How</p>
                <ol className="list-decimal list-inside space-y-0.5 text-[13px] text-[#43474F] mb-3">
                  {l.how.map((s, i) => <li key={i}>{s}</li>)}
                </ol>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  <div className="border border-[#EFF1F4] bg-[#FBFCFD] rounded-xl px-3.5 py-2.5">
                    <p className="text-[11px] font-medium text-[#177245] mb-0.5">Example</p>
                    <p className="text-[12.5px] text-[#4B4B4B] leading-relaxed">{l.example}</p>
                  </div>
                  <div className="border border-[#EFF1F4] bg-[#FBFCFD] rounded-xl px-3.5 py-2.5">
                    <p className="text-[11px] font-medium text-[#B4780E] mb-0.5">What it won’t do</p>
                    <p className="text-[12.5px] text-[#4B4B4B] leading-relaxed">{l.wont}</p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Worked walk-throughs */}
      <p className="text-[11px] font-medium text-[#98A0AD] mb-3" style={{ fontFamily: MONO_FONT }}>Put it together — worked walk-throughs</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {WALKTHROUGHS.map((w) => (
          <Card key={w.title}>
            <p className="text-[14px] font-bold text-[#141821] mb-2">{w.title}</p>
            <ol className="list-decimal list-inside space-y-1.5 text-[13px] text-[#43474F] leading-relaxed">
              {w.steps.map((s, i) => <li key={i}>{s}</li>)}
            </ol>
          </Card>
        ))}
      </div>

      {/* Guardrails + flag loop */}
      <Card className="mb-6">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#F4F6F9] border border-[#E7C9A0] flex items-center justify-center shrink-0">
            <ShieldCheck size={17} className="text-[#B4780E]" />
          </div>
          <div className="min-w-0">
            <p className="text-[15px] font-bold text-[#141821] mb-1.5">Keeping it honest — the flag loop</p>
            <p className="text-[13.5px] text-[#4B4B4B] leading-relaxed mb-2">
              Every answer has a quiet <strong>thumbs-down</strong>. Use it whenever an answer is wrong or drifts from the doctrine.
              Flagged exchanges land in <Link href="/dashboard/copilot-review" className="text-[#1B6DFC] hover:underline">Clients → Co-Pilot Review</Link> to
              be checked and cleared. This is how the standard stays consistent as more coaches rely on it — catch drift before it spreads.
            </p>
            <p className="text-[12.5px] text-[#666D7A] leading-relaxed">
              The best habit to build: after you generate any program or nutrition plan, ask the co-pilot to review it against the doctrine before you publish.
            </p>
          </div>
        </div>
      </Card>

      {/* Downloads / links */}
      <Card>
        <p className="text-[11px] font-medium text-[#98A0AD] mb-3" style={{ fontFamily: MONO_FONT }}>Take it with you</p>
        <div className="flex flex-wrap items-center gap-3">
          <a href="/docs/copilot-guide/COACH_COPILOT_GUIDE.pdf" target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-[13px] font-semibold px-3.5 py-2 bg-[#141821] text-white rounded-lg hover:bg-black transition-colors">
            <Download size={14} /> Download the guide (PDF)
          </a>
          <a href="/docs/copilot-guide/COACH_COPILOT_GUIDE.md" target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-[13px] font-medium px-3.5 py-2 border border-[#E8EAEE] text-[#4B4B4B] rounded-lg hover:bg-[#F6F6F6] transition-colors">
            <FileText size={14} /> View as text
          </a>
          <Link href="/dashboard/help#coach-copilot" className="inline-flex items-center gap-1.5 text-[13px] text-[#1B6DFC] hover:underline ml-1">
            Co-Pilot in the full guide <ArrowUpRight size={13} />
          </Link>
        </div>
      </Card>

      <div className="flex items-center gap-2 mt-8 text-[12px] text-[#98A0AD]">
        <MessageSquare size={13} />
        <span>The co-pilot is coach-facing only — it never speaks to a client, and nothing it produces is sent without you.</span>
      </div>
    </div>
  )
}
