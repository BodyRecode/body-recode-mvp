// Suggested-question catalogue for the coach co-pilot. Context-aware: the
// starters shown depend on WHERE the coach is (nutrition page vs program page
// vs profile vs a general dashboard page) and are grouped into categories the
// coach drills into, so the high-value "hero" prompts are discoverable rather
// than tribal knowledge. Built 2026-07-17 (Kade's idea).

export type StarterCategory = {
  label: string
  questions: string[]
}

/** Client-scoped starters — the bubble on /dashboard/clients/[id]/... */
export function clientStarterCategories(pathname: string, firstName: string): StarterCategory[] {
  const name = firstName?.trim() || 'this client'
  const isNutrition = /\/nutrition(\/|$)/.test(pathname)
  const isProgram = /\/(program|plan)(\/|$)/.test(pathname)

  const review: string[] = isNutrition
    ? [
        `Review ${name}'s nutrition plan against the doctrine. Is anything off or inconsistent?`,
        `Does the meal timing cover ${name}'s snacking window?`,
        `Is the protein anchor honoured and evenly spread across the meals?`,
      ]
    : isProgram
      ? [
          `Review ${name}'s training program against the doctrine. Is anything off?`,
          `Does the loading match the block's phase and readiness gates?`,
          `Is anything starting too hot for this point in the block?`,
        ]
      : [
          `Review ${name}'s nutrition plan against the doctrine — anything off?`,
          `Review ${name}'s training program against the doctrine — anything off?`,
        ]

  const draftFix = isNutrition
    ? `Draft coach guidance to fix what's off in ${name}'s nutrition plan.`
    : isProgram
      ? `Draft coach guidance to fix what's off in ${name}'s program.`
      : `Draft coach guidance to steer ${name}'s next plan.`

  return [
    { label: 'Review a plan', questions: review },
    {
      label: 'Explain the read',
      questions: [
        `Why did the synthesis land ${name} where it did?`,
        `What is the binding constraint for ${name} right now, and why?`,
        `Walk me through ${name}'s fat map.`,
      ],
    },
    {
      label: 'Pressure-test me',
      questions: [
        `The doctrine says hold. Talk me out of progressing ${name}.`,
        `Should ${name} be in Restoration right now?`,
        `What am I most at risk of missing with ${name}?`,
      ],
    },
    { label: 'Draft a fix', questions: [draftFix] },
  ]
}

/** General starters — the global bubble on non-client dashboard pages. */
export function generalStarterCategories(_pathname: string): StarterCategory[] {
  return [
    {
      label: 'Doctrine',
      questions: [
        'Explain the cross-pillar authority order in plain terms.',
        'When must a client enter Restoration, and why?',
        'Walk me through the four readiness gates.',
        'Why is progression permissioned, never assumed?',
      ],
    },
    {
      label: 'Method',
      questions: [
        'How do body state and phase differ?',
        'What is the Fat Map, and how do I read it?',
        'How does nutrition stay in its lane versus training?',
      ],
    },
    {
      label: 'Using the co-pilot',
      questions: [
        "How do I get you to review a specific client's plan?",
        "What can you help me with on a client's file?",
      ],
    },
  ]
}
