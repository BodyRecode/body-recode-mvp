// Extension email builders.
//
// The 90-Day Body Rewire Extension weekly emails. Mirrors blueprint-emails.ts:
// each weekly email is pattern-aware, with a per-pattern callout block below the
// body. Weeks 1-6 are Block A (Consolidate), weeks 7-12 are Block B (Advance).
//
// Inventory:
//   - buildExtensionWeekEmail — extensionWeekAdvanceFunction, Weeks 2-12 (pattern-aware,
//     doubles as the check-in prompt for the just-completed week)
//
// Pattern labels/colours are reused from blueprint-emails so the four patterns
// read identically across every product. All builders return {subject, html}.

import { darkEmailSignature } from './email-signature'
import {
  darkEmailShell, emailUrlFallback,
  emailLogo, emailEyebrow, emailHeading, emailDivider, emailBody, emailCta,
} from './email-shell'
import { BLUEPRINT_PATTERN_LABELS, BLUEPRINT_PATTERN_COLOURS } from './blueprint-emails'

// Pattern-callout shell: wraps the week-email body with a left-border
// pattern-specific callout, same treatment as the Blueprint weekly emails.
function extensionWeekShell(body: string, patternLabel: string, patternColour: string, patternCallout: string): string {
  const patternBlock = `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-left:3px solid ${patternColour};margin:24px 0 0;">
        <tr>
          <td style="padding-left:16px;">
            <p style="font-size:11px;font-weight:700;color:${patternColour};letter-spacing:0.12em;text-transform:uppercase;margin:0 0 8px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">${patternLabel}</p>
            <p style="font-size:13px;color:#4A4A4A;line-height:1.7;margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">${patternCallout}</p>
          </td>
        </tr>
      </table>`
  return darkEmailShell(`
${emailLogo()}
${body}
${patternBlock}
${darkEmailSignature()}
`)
}

// Each entry is the email sent when the participant ADVANCES INTO that week
// (so the body opens the new week and reminds them to log the completed one).
const EXTENSION_WEEK_EMAILS: Record<number, {
  subject: (firstName: string) => string
  body: (firstName: string, portalUrl: string, completedWeek: number) => string
  patternBlock: Record<string, string>
}> = {
  2: {
    subject: (n) => `Week 2, ${n}. Consolidation holds.`,
    body: (n, url, cw) => `
${emailEyebrow('Week 2 · Consolidate')}
${emailHeading('Hold the new baseline.')}
${emailDivider()}
${emailBody(`Hi ${n},`)}
${emailBody('Block A is called Consolidate for a reason. The Blueprint corrected your pattern. These first weeks make that correction the default, not the exception. This week is about holding the structure so the change stops being something you maintain and starts being something your body just does.')}
${emailBody(`Before you go further, log your Week ${cw} check-in in the portal. It takes two minutes and keeps the read on your biology honest as you build.`, { bottom: 28 })}
${emailCta({ href: url, label: `Submit Week ${cw} check-in` })}
${emailUrlFallback(url, 'Or paste this link into your browser')}
`,
    patternBlock: {
      'stress-stored':   'Your cortisol baseline is lower than it was at the start of the Blueprint. Consolidation protects that. Keep sleep and session intensity where they are prescribed, and the holding pattern stays unwound.',
      'metabolic-drift': 'Insulin sensitivity is still improving. Consistent meal timing this block is what makes the gain permanent rather than temporary. Do not tighten food further, just hold the rhythm.',
      'hormonal-shift':  'Your hormonal correction lags the others and needs the full consolidation window to set. Adequate fuelling and cycle-aware training this block are what lock it in.',
      'system-overload': 'Your nervous system finally has capacity again. Consolidation guards it. Resist adding volume ahead of the plan, the base has to be stable before Block B advances it.',
    },
  },
  3: {
    subject: (n) => `Week 3, ${n}. Load returns.`,
    body: (n, url, cw) => `
${emailEyebrow('Week 3 · Consolidate')}
${emailHeading('Progressive load, on a stable base.')}
${emailDivider()}
${emailBody(`Hi ${n},`)}
${emailBody('Two weeks of holding the base, and now load steps up inside Block A. The difference from the Blueprint is the ground under you. You are progressing on a corrected pattern, not a stalled one, so the same work produces a cleaner response.')}
${emailBody(`Log your Week ${cw} check-in before you start the new week. The markers are how you see the base holding while the load climbs.`, { bottom: 28 })}
${emailCta({ href: url, label: `Submit Week ${cw} check-in` })}
${emailUrlFallback(url, 'Or paste this link into your browser')}
`,
    patternBlock: {
      'stress-stored':   'Because your stress load is down, your body can actually use the added volume this week. Hold the prescribed effort targets, the load is calibrated to be productive without re-elevating cortisol.',
      'metabolic-drift': 'Better insulin sensitivity means carbohydrate now partitions toward recovery. The tighter nutrition timing this week takes advantage of that. Fuel the training, do not restrict it.',
      'hormonal-shift':  'Consistent fuelling plus moderate progressive load is what restores the hormonal balance that holds lean mass. The step-up here is deliberately gentle, slow restoration is the protocol.',
      'system-overload': 'Volume returns before intensity for your pattern. Your CNS accepts load again now, but the bigger increases wait until Block B. Keep this week conservative.',
    },
  },
  4: {
    subject: (n) => `Week 4, ${n}. The work compounds.`,
    body: (n, url, cw) => `
${emailEyebrow('Week 4 · Consolidate')}
${emailHeading('Two thirds through Block A.')}
${emailDivider()}
${emailBody(`Hi ${n},`)}
${emailBody('You are deep into the Consolidate block now. The changes are stacking on a base that is genuinely stable. This is the point where people who stopped at the Blueprint would have started drifting back, and where you are instead building.')}
${emailBody(`Keep the read honest. Submit your Week ${cw} check-in in the portal before this week begins.`, { bottom: 28 })}
${emailCta({ href: url, label: `Submit Week ${cw} check-in` })}
${emailUrlFallback(url, 'Or paste this link into your browser')}
`,
    patternBlock: {
      'stress-stored':   'Steadier sleep, calmer afternoons, fewer between-meal cravings. Four weeks of held structure should be showing reliably now. The fat cortisol was protecting keeps becoming available.',
      'metabolic-drift': 'Hunger should feel predictable rather than urgent by now. That is the metabolic correction holding. If it is not, check meal compliance before changing anything else.',
      'hormonal-shift':  'Energy stability and better sleep are the upstream signals that your hormonal baseline is shifting. The physical change often lags these by a couple of weeks, keep going.',
      'system-overload': 'Your capacity is restored enough that load can climb without recovery debt building. This week is designed to build on that, not test it.',
    },
  },
  5: {
    subject: (n) => `Week 5, ${n}. Block A peaks.`,
    body: (n, url, cw) => `
${emailEyebrow('Week 5 · Consolidate')}
${emailHeading('Peak of the Consolidate block.')}
${emailDivider()}
${emailBody(`Hi ${n},`)}
${emailBody('This is the highest-demand week of Block A. Training intensity is at its peak for the block and nutrition precision is at its tightest. The job this week is to hold the recovery inputs, sleep, meal timing, supplementation, under that higher load. That is what makes intensity productive instead of draining.')}
${emailBody(`Submit your Week ${cw} check-in first. Under peak load the markers matter most.`, { bottom: 28 })}
${emailCta({ href: url, label: `Submit Week ${cw} check-in` })}
${emailUrlFallback(url, 'Or paste this link into your browser')}
`,
    patternBlock: {
      'stress-stored':   'Sleep is a training variable for you. Poor sleep spikes cortisol and undoes a week of work fast. If sleep slips, drop session intensity before anything else.',
      'metabolic-drift': 'One poor night cuts insulin sensitivity 20 to 30 percent the next day. Since that is your primary target, sleep quality is part of the protocol this week, not optional.',
      'hormonal-shift':  'Deep sleep is when reproductive hormones complete their daily reset. Protecting sleep this week is directly protecting the hormonal correction you have built.',
      'system-overload': 'Sleep outranks training for your pattern. Under peak load it is the single highest-leverage action you have. Build the week around protecting it.',
    },
  },
  6: {
    subject: (n) => `Week 6, ${n}. Block A lands.`,
    body: (n, url, cw) => `
${emailEyebrow('Week 6 · Consolidate and Deload')}
${emailHeading('Consolidation complete. Advance is next.')}
${emailDivider()}
${emailBody(`Hi ${n},`)}
${emailBody('Final week of Block A, and it is a deload. Volume drops, intensity stays controlled, nutrition holds. The body makes its biggest adaptations when load eases and recovery takes over. This is where the last six weeks of consolidation actually set.')}
${emailBody('Next week Block B begins. Advance. The correction is now your baseline, and from here you build real capacity on top of it. Half the Extension is behind you.')}
${emailBody(`Log your Week ${cw} check-in and take a moment to compare these markers with where you started.`, { bottom: 28 })}
${emailCta({ href: url, label: `Submit Week ${cw} check-in` })}
${emailUrlFallback(url, 'Or paste this link into your browser')}
`,
    patternBlock: {
      'stress-stored':   'Six weeks of held, lowered cortisol load has moved your baseline for good. Block B builds progressive intensity on a system that can now genuinely handle it.',
      'metabolic-drift': 'Your insulin sensitivity is in a different place than the start of the Extension. Block B introduces calorie periodisation to build on the corrected metabolic environment.',
      'hormonal-shift':  'The hormonal restoration is set now, not fragile. Block B advances load while still adjusting around your cycle, so muscle comes on without tipping the pattern back.',
      'system-overload': 'Your nervous system has real capacity again. Block B is where progressive challenge returns in full to a system that can absorb it.',
    },
  },
  7: {
    subject: (n) => `Week 7, ${n}. Block B begins.`,
    body: (n, url, cw) => `
${emailEyebrow('Week 7 · Advance')}
${emailHeading('The build starts here.')}
${emailDivider()}
${emailBody(`Hi ${n},`)}
${emailBody('Block B. Advance. Consolidation held the correction in place, this block builds on it. Load steps up on a base you have proven is stable. This is where the Extension stops being about protecting the change and starts being about progressing it.')}
${emailBody(`Open Block B in your portal, and log your Week ${cw} check-in before you start.`, { bottom: 28 })}
${emailCta({ href: url, label: `Submit Week ${cw} check-in` })}
${emailUrlFallback(url, 'Or paste this link into your browser')}
`,
    patternBlock: {
      'stress-stored':   'With cortisol regulated and held, your body can take a real progressive stimulus now. Block B pushes capacity while recovery stays protected. Trust the higher load.',
      'metabolic-drift': 'Calorie periodisation enters this block. With insulin sensitivity restored, the body partitions the higher intake toward muscle and recovery rather than storage.',
      'hormonal-shift':  'Adequate fuelling has restored the hormonal environment that supports building lean mass. Block B advances load into that restored environment, still cycle-aware.',
      'system-overload': 'Intensity now joins the volume your CNS reclaimed in Block A. The build in Block B is what the whole Extension was setting up. Your system can hold it.',
    },
  },
  8: {
    subject: (n) => `Week 8, ${n}. Capacity is climbing.`,
    body: (n, url, cw) => `
${emailEyebrow('Week 8 · Advance')}
${emailHeading('Building on proven ground.')}
${emailDivider()}
${emailBody(`Hi ${n},`)}
${emailBody('Second week of the build. The load from last week has been absorbed and this week asks for a little more. Because the base is corrected and consolidated, your body reads the added demand as a signal to keep adapting rather than a threat to defend against.')}
${emailBody(`Submit your Week ${cw} check-in first. The markers show the build landing.`, { bottom: 28 })}
${emailCta({ href: url, label: `Submit Week ${cw} check-in` })}
${emailUrlFallback(url, 'Or paste this link into your browser')}
`,
    patternBlock: {
      'stress-stored':   'Progressive load on a regulated system produces clean strength gains without the old stress spike. Hold your prescribed effort, the response is in the recovery.',
      'metabolic-drift': 'The higher-carb training days this block feed the build. Keep the timing tight around sessions and the periodisation does its job.',
      'hormonal-shift':  'Muscle retention and energy both improve as the hormonal environment holds under load. The step-up stays moderate, the trajectory matters more than the size of the jump.',
      'system-overload': 'Volume and intensity together now, but recovery still leads. If session quality dips, protect sleep before you push harder.',
    },
  },
  9: {
    subject: (n) => `Week 9, ${n}. Load steps up.`,
    body: (n, url, cw) => `
${emailEyebrow('Week 9 · Advance')}
${emailHeading('The demand increases.')}
${emailDivider()}
${emailBody(`Hi ${n},`)}
${emailBody('Three quarters of the way through the Extension. Load steps up again this week. This is the productive middle of the build, where the accumulated work of the last two months starts to show as genuine capacity, not just recovery.')}
${emailBody(`Keep the read honest. Log your Week ${cw} check-in before this week begins.`, { bottom: 28 })}
${emailCta({ href: url, label: `Submit Week ${cw} check-in` })}
${emailUrlFallback(url, 'Or paste this link into your browser')}
`,
    patternBlock: {
      'stress-stored':   'You are training at a level that would have re-triggered your pattern three months ago. It does not now, because the base underneath it is regulated. That is the whole point.',
      'metabolic-drift': 'Insulin sensitivity holding under a higher load is the marker that the correction is durable. Fuel the harder sessions, the body uses it well now.',
      'hormonal-shift':  'The lean mass you are holding under this load is the visible result of the hormonal restoration. Keep fuelling adequately, under-eating here would undo it.',
      'system-overload': 'This is real progressive challenge to a system that could not have absorbed it at the start. Recovery still first, but the build is genuinely on.',
    },
  },
  10: {
    subject: (n) => `Week 10, ${n}. Deep in the build.`,
    body: (n, url, cw) => `
${emailEyebrow('Week 10 · Advance')}
${emailHeading('The work is compounding hard.')}
${emailDivider()}
${emailBody(`Hi ${n},`)}
${emailBody('Ten weeks in. The adaptations are stacking on a base that has been stable for over a month. This is the part of a programme most people never reach, because most never make it past six weeks. You are building on ground they never got to.')}
${emailBody(`Submit your Week ${cw} check-in first, then start the week.`, { bottom: 28 })}
${emailCta({ href: url, label: `Submit Week ${cw} check-in` })}
${emailUrlFallback(url, 'Or paste this link into your browser')}
`,
    patternBlock: {
      'stress-stored':   'Ten weeks of a regulated stress response has changed what your body is capable of holding. The composition changes that were locked behind cortisol are landing now.',
      'metabolic-drift': 'A metabolism that partitions well is a different machine than the one you started with. The build weeks are where that shows up as visible change.',
      'hormonal-shift':  'Hormonal corrections show late and then hold. The physical results arriving now are the delayed payoff of the fuelling and consistency you have held throughout.',
      'system-overload': 'The flat, unresponsive feeling that defined your pattern is a long way behind you. Ten weeks of restored capacity under progressive load is why.',
    },
  },
  11: {
    subject: (n) => `Week 11, ${n}. Peak of the Extension.`,
    body: (n, url, cw) => `
${emailEyebrow('Week 11 · Advance')}
${emailHeading('Peak demand. Hold everything.')}
${emailDivider()}
${emailBody(`Hi ${n},`)}
${emailBody('This is the highest-demand week of the whole Extension. Training intensity peaks, nutrition precision is tightest, and every recovery input matters. The job is the same as it has always been at peak weeks: hold the structure under pressure. That is what makes the intensity productive.')}
${emailBody(`Under peak load the markers matter most. Log your Week ${cw} check-in before you begin.`, { bottom: 28 })}
${emailCta({ href: url, label: `Submit Week ${cw} check-in` })}
${emailUrlFallback(url, 'Or paste this link into your browser')}
`,
    patternBlock: {
      'stress-stored':   'Peak intensity is the moment your regulated base earns out. Keep sleep locked and the load stays productive rather than stressful. Drop intensity before you drop sleep.',
      'metabolic-drift': 'Sleep and insulin sensitivity are linked. Under peak load, protecting sleep protects the metabolic gain you have spent 11 weeks building.',
      'hormonal-shift':  'Deep sleep is when the hormonal reset completes. At peak load it is not optional, it is the thing holding the whole result together.',
      'system-overload': 'Sleep is your primary recovery stimulus and it outranks training. At peak week, build everything around protecting it.',
    },
  },
  12: {
    subject: (n) => `Final week, ${n}. What comes next.`,
    body: (n, url, cw) => `
${emailEyebrow('Week 12 · Advance and Deload')}
${emailHeading('Ninety days. A different body.')}
${emailDivider()}
${emailBody(`Hi ${n},`)}
${emailBody('Final week. It is a deload, volume drops, intensity stays controlled, nutrition holds, and the body makes its last big adaptations as recovery takes over. Take some time to compare where you are now with where you were at the end of the Blueprint. Energy, sleep, recovery, capacity, composition. Twelve weeks of building on a corrected base looks like this.')}
${emailBody('The Extension covered Blocks A and B. If you want to keep the progression going, the Membership picks up at Block C, no repeated content, no backtracking. Your portal shows you what that looks like.')}
${emailBody(`Log your final Week ${cw} check-in and see the full arc of your read.`, { bottom: 28 })}
${emailCta({ href: url, label: 'See what comes next' })}
${emailUrlFallback(url, 'Or paste this link into your browser')}
`,
    patternBlock: {
      'stress-stored':   'Ninety days of a regulated stress response, held and then built on. The pattern that was storing fat and draining your energy is a long way behind you. Block C keeps the capacity climbing.',
      'metabolic-drift': 'Your metabolism partitions fuel like a different system now. The Membership Block C progresses that further with the next layer of periodisation.',
      'hormonal-shift':  'The hormonal environment that was working against you has been corrected and built on for three months. Block C continues the progression while keeping it cycle-aware.',
      'system-overload': 'A nervous system with real, proven capacity. The flat pattern is gone. Block C introduces the next progression to a system that has earned it.',
    },
  },
}

export function buildExtensionWeekEmail({
  week,
  firstName,
  portalUrl,
  pattern,
}: {
  week: number
  firstName: string
  portalUrl: string
  pattern: string
}): { subject: string; html: string } {
  const def = EXTENSION_WEEK_EMAILS[week] ?? EXTENSION_WEEK_EMAILS[2]
  const completedWeek = week - 1
  const resolvedPattern = BLUEPRINT_PATTERN_LABELS[pattern] ? pattern : 'stress-stored'
  const patternLabel = BLUEPRINT_PATTERN_LABELS[resolvedPattern]
  const patternColour = BLUEPRINT_PATTERN_COLOURS[resolvedPattern]
  const patternCallout = def.patternBlock[resolvedPattern] ?? def.patternBlock['stress-stored']
  return {
    subject: def.subject(firstName),
    html: extensionWeekShell(def.body(firstName, portalUrl, completedWeek), patternLabel, patternColour, patternCallout),
  }
}
