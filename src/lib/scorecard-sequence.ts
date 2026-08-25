/**
 * The live scorecard follow-up sequence, in code, as ONE definition.
 *
 * WHY THIS FILE EXISTS. These nine steps were duplicated in three places:
 * `scorecard/seed-automation`, `admin/resync-scorecard-workflow`, and
 * `cron/daily-health-check`. The live rows in `be_workflow_steps` were then
 * rewritten in the UI on 24 Aug 2026 to sell The Body Decode instead of the
 * retired $37 report, and none of the three copies moved with them.
 *
 * That left a live landmine rather than a tidiness problem:
 *
 *   - the nightly health check compares subject/body against its own copy and
 *     reported the sequence as FAILED every night - "leads are getting the old
 *     wording right now" - which was false, and
 *   - its suggested fix is Re-sync, which would have overwritten the current
 *     copy with emails selling a product that no longer exists, pointed at
 *     /get-report.
 *
 * So the prose below IS the live copy, lifted verbatim on 25 Aug 2026, with
 * `${brand().marketingDomain}` restored where the UI edit had left a literal
 * bodyrecode.au. All three call sites now import from here.
 *
 * IF YOU EDIT THE SEQUENCE IN THE UI, UPDATE THIS FILE IN THE SAME SITTING.
 * The drift check is what tells you the two have parted; it cannot tell you
 * which one is right. See project_scorecard_sequence_seed_vs_live.
 *
 * NINE STEPS, and the health check re-seeds everything if the count differs.
 * Adding or removing one without updating that expectation destroys the live
 * copy on the next nightly run.
 */
import { brand } from '@/config/tenant'

export type ScorecardStep = {
  position: number
  type: 'action' | 'wait'
  action_type: 'send_email' | null
  config: Record<string, unknown>
}

export function scorecardSteps(): ScorecardStep[] {
  const domain = brand().marketingDomain
  return [
    {
      position: 1, type: 'action', action_type: 'send_email',
      config: {
        subject: `Why your body has stopped responding, {{first_name}}`,
        body: `Hi {{first_name}},

You just took the scorecard. Result: {{scorecard_score}}/15. Readiness: {{scorecard_state}}.

That number is the starting point, not the answer. It tells you which of three states your body is currently in. It does not tell you why fat loss has stalled, what specifically is making things worse, or what to fix first.

The Body Decode does.

It is the full read of your result: the pattern your body is working through, why it has been holding what it holds, where that shows up in an ordinary week, what it commonly gets mistaken for, and the three things that actually move it.

Then five short lessons, one a day, walking you through it, because it is a lot to take in at once.

You have already answered the questions, so it opens with your read rather than asking you anything again.

Free. No card.

Start here: ${domain}/decode?source=scorecard_email_1

If you would rather talk it through first, you can book a free 30-minute strategy call: ${domain}/book

Kade
Body Recode`,
      },
    },
    { position: 2, type: 'wait', action_type: null, config: { unit: 'days', amount: '2' } },
    {
      position: 3, type: 'action', action_type: 'send_email',
      config: {
        subject: `What your {{scorecard_state}} result actually means`,
        body: `Hi {{first_name}},

Your score was {{scorecard_score}}/15. Readiness: {{scorecard_state}}.

Most people in your situation think they need to train harder or eat less. That is usually the wrong call.

When a body has stopped responding to effort, the issue is rarely the effort itself. It is the prescription. Pushing harder against a body that is already resisting is what got it stuck in the first place.

Your result named the pattern behind that. What it could not do is explain it, because a result page is a summary.

The Body Decode is the whole read. What {{scorecard_state}} actually means for your training, your nutrition and your recovery, why fat loss has stalled, what to stop immediately, and the order to fix what is left. Written to your specific result.

Then five short lessons, one a day, walking you through it.

Free, and there is nothing to buy at the end of it to get the read.

Start here: ${domain}/decode?source=scorecard_email_2

Kade
Body Recode`,
      },
    },
    { position: 4, type: 'wait', action_type: null, config: { unit: 'days', amount: '2' } },
    {
      position: 5, type: 'action', action_type: 'send_email',
      config: {
        subject: `Re: your scorecard`,
        body: `Hi {{first_name}},

Following up on your scorecard.

The most common thing I hear after someone takes it: "That finally explains why nothing has been working."

Knowing your state is the first piece. Knowing what to do about it is the second. That is what the call is for.

30 minutes. Free. No pitch. We go through your scorecard together, identify the specific bottleneck, and map out what to do first.

Book here: ${domain}/book

If you would rather have the full read in writing first, that is free at ${domain}/decode?source=scorecard_email_3.

Kade
Body Recode`,
      },
    },
    { position: 6, type: 'wait', action_type: null, config: { unit: 'days', amount: '4' } },
    {
      position: 7, type: 'action', action_type: 'send_email',
      config: {
        subject: `The prescription problem`,
        body: `Hi {{first_name}},

Most coaching programs give everyone the same plan. Same training, same nutrition, same timeline. Your readiness does not factor in at all.

Your scorecard came back as {{scorecard_state}}. That is a specific biological pattern, not a label. It tells me how your body is handling load, how well it is recovering, and how much capacity it has to respond right now.

A program built for a Ready state will make a Depleted state worse. That is not a motivation problem. It is a prescription problem.

The fastest way to address it is the call. 30 minutes, free, no pitch. We map out what your specific state needs first, and what to stop immediately.

Book here: ${domain}/book

Kade
Body Recode`,
      },
    },
    { position: 8, type: 'wait', action_type: null, config: { unit: 'days', amount: '5' } },
    {
      position: 9, type: 'action', action_type: 'send_email',
      config: {
        subject: `Last one from me, {{first_name}}`,
        body: `Hi {{first_name}},

Last email from me on this.

Your scorecard result is still there whenever you want to act on it. Two doors based on your {{scorecard_state}} score:

1. The Body Decode. Free. The full read of your result, the pattern you are working through, and the order to fix it, plus five short lessons walking you through it. Best if you want to act on it yourself.

2. Free 30-minute call. Best if you would rather talk it through first.

Start The Body Decode: ${domain}/decode?source=scorecard_email_5
Book the call: ${domain}/book

No follow-up after this.

Kade
Body Recode`,
      },
    },
  ]
}
