import { PageHeader, PageBody, SectionHead } from '@/components/dashboard/ui'
import { BRAND } from '@/lib/brand-tokens'

/**
 * The guide for a coach on the interpretation product.
 *
 * 22 September 2026. What a coach used to see here was Kade's operator manual
 * for a different business, price list included. This is written for the thing
 * they actually have.
 *
 * IT EXPLAINS RATHER THAN INSTRUCTS, which is the same rule the product itself
 * follows. It says what the system does and what the words mean. It does not
 * tell a coach how to train anybody, because that is the one thing this
 * product will never do and a guide that drifted into it would undercut the
 * whole position.
 *
 * NO PRICES, NO FUNNEL, NO SALES PROCESS. Those are Kade's and they live in
 * the operator guide beside this one.
 */

type Block = { heading: string; body: string[]; note?: string }

const SECTIONS: Array<{ title: string; blocks: Block[] }> = [
  {
    title: 'What this is',
    blocks: [
      {
        heading: 'It reads a body and explains it',
        body: [
          'A client answers a long assessment. The system reads it and returns a written interpretation of what appears to be going on: how much load they can carry right now, the pattern underneath it, and what is holding it there.',
          'Every week it reads their check-in against their own baseline rather than against a target. At twelve weeks it reads them again and puts the two side by side.',
        ],
      },
      {
        heading: 'It never tells you what to prescribe',
        body: [
          'No training blocks, no eating plans, no supplements, no protocols. That is your job and it stays your job.',
          'This is not a gap in the product, it is the product. You already write good programmes. What is hard is explaining why this person is where they are, in words you can say to their face and stand behind.',
        ],
        note: 'If something in a read ever reads like a tip, that is a fault. Report it.',
      },
    ],
  },
  {
    title: 'Readiness',
    blocks: [
      {
        heading: 'How much they can take right now',
        body: [
          'Readiness is the thing you programme against. It is named on every screen and it comes with the reason attached, so you can say it out loud.',
          'Remediation means the system is settling rather than building. Optimisation means capacity is holding and there is room. Post-Optimisation means it is established and stable.',
        ],
      },
      {
        heading: 'Remediation is not a problem',
        body: [
          'Somebody in Remediation is not in trouble and not failing. They are being asked for less, on purpose, because the evidence says adding load now would land on top of something.',
          'That is why it is never shown in red anywhere in this product. If you tell a client they are "in Remediation" as though it were a category they have fallen into, you are saying the opposite of what the read says.',
        ],
        note: 'Name the level, then say what it means in the same breath. "Her readiness is Remediation, which means the system needs settling before anything is added."',
      },
    ],
  },
  {
    title: 'The pattern',
    blocks: [
      {
        heading: 'A different question from readiness',
        body: [
          'Readiness is how ready they are. The pattern is what is driving it. They are two axes, and two people can share a pattern and have opposite readiness.',
          'There are four: Stress-Stored, Insulin-Drift, Estrogen-Shift and Androgen-Decline. Which ones can apply depends on sex at birth, so the system will never hand somebody a pattern that is not possible for them.',
        ],
      },
    ],
  },
  {
    title: 'The weekly loop',
    blocks: [
      {
        heading: 'One thing a week, read against where they started',
        body: [
          'The check-in window opens Friday evening and closes Sunday evening. Your client fills in one form. The questions alternate week to week between two sets, so it does not become the same form every time.',
          'What comes back is read against their own baseline. Not against a target, not against anybody else.',
        ],
      },
      {
        heading: 'What you do with it',
        body: [
          'Read it. That is the loop. Today shows you who is waiting and why, ordered by what it would cost to leave them.',
          'A client in Remediation who is not being read matters more than a steady one with a check-in outstanding, which is why the list is not simply oldest first.',
        ],
      },
    ],
  },
  {
    title: 'When it stops',
    blocks: [
      {
        heading: 'It holds rather than guessing',
        body: [
          'If something in the picture needs somebody qualified rather than a coach, the system says so and holds. It will not name a pattern on top of an unanswered question, and it will not deepen a deficit while a flag is open.',
          'You will see this as Attention, with a ring around it so it cannot be confused with a readiness. It means a gate has fired. It is not a fourth readiness level and it is not a judgement about your client.',
        ],
        note: 'Nothing moves for that client until it clears. That is deliberate, and it is the reason the rest of the read is worth trusting.',
      },
    ],
  },
  {
    title: 'What you can say, and what you cannot',
    blocks: [
      {
        heading: 'Interpretation, never diagnosis',
        body: [
          'Nothing this produces is a diagnosis, and it does not diagnose, treat, cure or prevent anything. You must not describe it that way to a client or in any marketing. This is a regulatory line rather than a style preference.',
          'The word to reach for is read, or interpretation, or explanation.',
        ],
      },
      {
        heading: 'Never "broken"',
        body: [
          'A body is not broken. It is being misread. That is the whole premise, and it is worth watching for in your own wording because it leaks in easily.',
        ],
      },
    ],
  },
  {
    title: 'The screens',
    blocks: [
      {
        heading: 'Where things are',
        body: [
          'Today is who needs you and why, in the order it would cost you to ignore them. All Clients is your whole book. Check Ins is the bench where you work through what has come in.',
          'Your Practice is about you rather than about one client: who is drifting away, and what your book is made of. The six marks beside each name are the last six weeks, filled where they answered.',
        ],
      },
      {
        heading: 'If something is wrong',
        body: [
          'Use the button in the bottom corner of any page. It sends the page you were on with it, which saves a round of questions. Anything you have reported, and where it got to, is under Support.',
        ],
        note: 'This is pre-release. It will change during the pilot and it may contain faults. Reporting them is most of what the pilot is for.',
      },
    ],
  },
]

export default function CoachGuide() {
  return (
    <PageBody>
      <PageHeader
        eyebrow="Guide"
        title="How this works"
        subtitle="What the system does, what the words mean, and where the line is. It explains rather than instructs, which is the same rule the product follows."
      />

      {SECTIONS.map(section => (
        <div key={section.title}>
          <SectionHead title={section.title} />
          {section.blocks.map(b => (
            <div key={b.heading} className="py-5 border-b" style={{ borderColor: BRAND.darkLineSoft }}>
              <h3 className="text-[20px] font-bold tracking-[-0.028em] leading-tight" style={{ color: BRAND.darkInk }}>
                {b.heading}
              </h3>
              {b.body.map((p, i) => (
                <p key={i} className="text-[13.5px] leading-[1.6] mt-2.5 max-w-[680px]" style={{ color: BRAND.darkInkMuted }}>
                  {p}
                </p>
              ))}
              {b.note && (
                <p
                  className="text-[12.5px] leading-[1.55] mt-3.5 max-w-[680px] pl-3.5 border-l-2"
                  style={{ color: BRAND.darkInkSoft, borderColor: BRAND.darkLine }}
                >
                  {b.note}
                </p>
              )}
            </div>
          ))}
        </div>
      ))}

      <p className="text-[12.5px] mt-8 max-w-[680px]" style={{ color: BRAND.darkInkFaint }}>
        Anything here that does not match what you are seeing on screen is a fault in one of the two. Report it and we will
        fix whichever is wrong.
      </p>
    </PageBody>
  )
}
