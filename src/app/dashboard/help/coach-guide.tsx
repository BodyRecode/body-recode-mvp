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
    title: 'The four ratings',
    blocks: [
      {
        heading: 'Not limiting, Limiting, Main limit',
        body: [
          'Alongside readiness, four things are rated separately: how much work they can absorb right now, how reliably their week allows training and eating to happen, their stress and recovery state, and how consistently they do what is agreed when the week allows it.',
          'Each one answers a single question, which is whether that thing is holding them back. Not limiting means it is not. Limiting means it is, enough to shape how much you ask of them. Main limit means it is the one holding everything else back, and until it moves the other three cannot go far.',
          'Normally only one is the main limit. If three are, that tells you nothing about where to start, and it is worth saying so.',
        ],
        note: 'These four carry no colour, deliberately. Colour on this system means readiness, and these are not readiness.',
      },
    ],
  },
  {
    title: 'What you call it to them',
    blocks: [
      {
        heading: 'Their three words, not ours',
        body: [
          'Between us the three readiness levels are Remediation, Optimisation and Post-Optimisation. A client never hears any of those. Theirs are Depleted, Transitioning and Ready, and they are the words they already met in the scorecard, in their five-day read and on the call with you.',
          'This is not a style preference. Remediation means the act of remedying a fault, so said to a client it means we have assessed you and found something wrong. The whole premise is that the body is not broken, it is being misread.',
        ],
        note: 'It is enforced rather than remembered: nothing can be published to a client carrying one of our words, and the system will tell you which one and where.',
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
    title: 'When a client leaves',
    blocks: [
      {
        heading: 'They keep their read and nothing else',
        body: [
          'Ending someone does not delete them and does not lock them out. Their own read stays readable to them, because it is the thing they paid for and the thing they will come back to. Everything else closes: no plan, no check-ins, no messaging, and nothing new is produced for them.',
          'They see a page saying plainly that their coaching has ended and what is still theirs to read.',
        ],
        note: 'If they come back, ending is reversible. Nothing is thrown away.',
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
        heading: 'Twelve weeks on one page',
        body: [
          'On a client file there is a page that puts their whole twelve weeks in one place: where they started, where they are, and which way their readiness moved. It is built to be handed over or printed, so it is on paper rather than in the dark, and there is a version with the name removed for showing someone who is not a client yet.',
          'It does not work the answer out again. It reads out what the system already concluded week by week, including where readiness held, because holding steady is a result rather than nothing happening.',
        ],
      },
      {
        heading: 'Testimonials',
        body: [
          'On a client\'s file there is an ask for a few lines about how it has gone. They write it and choose how they want to be named, or decline without writing anything, and what they write lands on your Testimonials page already carrying their permission and their choice of name.',
          'It asks once. Nothing chases them, which is deliberate: a compliment somebody had to be asked for twice is not one you would want to put in front of a prospect.',
        ],
        note: 'There is no button that publishes anything anywhere. You copy it out and place it yourself, because a quote going live on a misclick is somebody\'s real words.',
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
