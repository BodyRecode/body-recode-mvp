/**
 * Boardroom briefing engine — proactive AI advisory briefings for the
 * Board of Advisors + C-suite role dashboards.
 *
 * Each persona (Sarah CFO, Marcus CMO, Priya CCO, James COO,
 * David Steward, Naomi Operator, Rachel Coach) has:
 *   - A distinct voice + priority lens
 *   - A snapshot data feed (their functional metrics)
 *   - Cross-role context (for the Board level)
 *
 * generateBriefing() calls Claude with forced tool use to guarantee
 * structured JSON output matching the BriefingItem[] schema. Cached
 * 15 min per persona-role key to avoid regeneration on every page render.
 *
 * Failures return an empty briefing — coach dashboards must never crash
 * because the LLM had a bad day.
 */

import Anthropic from '@anthropic-ai/sdk'
import { coach, brand, products } from '@/config/tenant'

// Model chosen for briefing generation: cost-efficient, quality-sufficient.
// Upgrade to opus-4-8 later if briefing quality is insufficient at scale.
const MODEL = 'claude-sonnet-5'
const MAX_TOKENS = 2048

// ─── Types ──────────────────────────────────────────────────────────────

export type BriefingType = 'action' | 'question' | 'observation' | 'alert'
export type BriefingPriority = 'critical' | 'high' | 'normal'

export type BriefingItem = {
  type: BriefingType
  title: string             // Persona opening line
  body: string              // The insight/context (1-3 sentences)
  cta_label?: string        // Optional CTA button text
  cta_href?: string         // Optional deep-link (relative path)
  priority: BriefingPriority
}

export type Briefing = {
  role: BoardroomRole
  persona: string           // e.g. "Sarah"
  personaTitle: string      // e.g. "CFO"
  items: BriefingItem[]
  generatedAt: string
  error?: string
}

export type BoardroomRole = 'cfo' | 'cmo' | 'cco' | 'coo' | 'board'

// ─── Persona configs ────────────────────────────────────────────────────

type PersonaConfig = {
  name: string
  title: string
  voice: string
  lens: string
  scope: string
}

const PERSONAS: Record<BoardroomRole, PersonaConfig> = {
  cfo: {
    name: 'Sarah',
    title: 'CFO',
    voice: 'warm, patient, cash-first, precise with numbers',
    lens: 'financial discipline and unit economics',
    scope: 'MRR, revenue windows, refund rate, churn, LTV, cash runway',
  },
  cmo: {
    name: 'Marcus',
    title: 'CMO',
    voice: 'sharp, challenging, brand-obsessed, will push back on lazy ideas',
    lens: 'funnel efficiency and acquisition',
    scope: 'CPL, CVR at each stage, wave fill, ad performance, content pulse',
  },
  cco: {
    name: 'Priya',
    title: 'CCO',
    voice: 'empathetic, retention-native, brings every conversation back to the client experience',
    lens: 'client relationships and retention',
    scope: 'churn rate, at-risk clients, feedback triage, engagement, sentiment',
  },
  coo: {
    name: 'James',
    title: 'COO',
    voice: 'systems thinker, ops-obsessive, loves a good process',
    lens: 'service delivery and operational health',
    scope: 'capacity, reading pipeline, TTFR, onboarding, queue depth',
  },
  board: {
    name: 'The Board',
    title: 'Board of Advisors',
    voice: 'three distinct voices — Steward (long-term capital-efficient), Operator (execution accountability), Coach (founder wellbeing and values alignment)',
    lens: 'meta-level: is the founder doing the right work given the whole picture',
    scope: 'synthesis across all C-suite + founder behaviour + stated goals',
  },
}

// ─── Cache ──────────────────────────────────────────────────────────────

const cache = new Map<string, { briefing: Briefing; expiresAt: number }>()
const CACHE_TTL_MS = 15 * 60 * 1000

// ─── Public API ─────────────────────────────────────────────────────────

/**
 * Generate (or fetch from cache) a briefing for a given role.
 * `contextJson` should be a JSON-stringified representation of whatever
 * snapshot data the persona needs to ground its briefing.
 */
export async function getBriefing(
  role: BoardroomRole,
  contextJson: string
): Promise<Briefing> {
  const cacheKey = `${role}:${contextJson.slice(0, 100)}`
  const cached = cache.get(cacheKey)
  if (cached && cached.expiresAt > Date.now()) {
    return cached.briefing
  }

  const persona = PERSONAS[role]
  try {
    const items = await callClaude(role, persona, contextJson)
    const briefing: Briefing = {
      role,
      persona: persona.name,
      personaTitle: persona.title,
      items,
      generatedAt: new Date().toISOString(),
    }
    cache.set(cacheKey, { briefing, expiresAt: Date.now() + CACHE_TTL_MS })
    return briefing
  } catch (err) {
    // Never crash a dashboard because the LLM had a bad day. Return an empty
    // briefing with the error so the UI can surface a small stub message.
    return {
      role,
      persona: persona.name,
      personaTitle: persona.title,
      items: [],
      generatedAt: new Date().toISOString(),
      error: (err as Error).message,
    }
  }
}

export function invalidateBriefingCache(): void {
  cache.clear()
}

// ─── Claude call ────────────────────────────────────────────────────────

async function callClaude(
  role: BoardroomRole,
  persona: PersonaConfig,
  contextJson: string
): Promise<BriefingItem[]> {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  const c = coach()
  const t = brand()
  const p = products()
  const isBoard = role === 'board'

  const systemPrompt = buildSystemPrompt(persona, isBoard, c.firstName, t.name, p)

  const userMessage = isBoard
    ? `Here is the current state of the business across all C-suite views + founder context. Generate the Board's briefing for ${c.firstName} — synthesize insight across all inputs. Show three distinct voices (Steward, Operator, Coach) as three separate items.

<snapshot>
${contextJson}
</snapshot>`
    : `Here is your current snapshot data. Generate your briefing.

<snapshot>
${contextJson}
</snapshot>`

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    system: systemPrompt,
    tools: [BRIEFING_TOOL],
    tool_choice: { type: 'tool', name: 'record_briefing' },
    messages: [{ role: 'user', content: userMessage }],
  })

  // Find the tool_use block, parse its input as { items: BriefingItem[] }
  for (const block of response.content) {
    if (block.type === 'tool_use' && block.name === 'record_briefing') {
      const input = block.input as { items?: BriefingItem[] }
      if (Array.isArray(input.items)) {
        return input.items.filter(isValidItem)
      }
    }
  }

  throw new Error('no valid tool_use block in response')
}

function buildSystemPrompt(
  persona: PersonaConfig,
  isBoard: boolean,
  founderFirstName: string,
  tenantName: string,
  p: ReturnType<typeof products>
): string {
  const baseIntro = isBoard
    ? `You are the Board of Advisors — three distinct voices sitting above the CEO of ${tenantName}. You report only to the founder ${founderFirstName}.`
    : `You are ${persona.name}, the ${persona.title} of ${tenantName}. You report to the founder ${founderFirstName}.`

  const voiceInstruction = isBoard
    ? `The three voices are:
  - **Steward** (David) — long-term thinking, capital efficiency, patience, principle-based. Reminds ${founderFirstName} that fragile growth is worse than slow growth.
  - **Operator** (Naomi) — execution accountability, cadence, focus. Asks the ONE-thing-that-moves-the-needle-this-week question.
  - **Coach** (Rachel) — ${founderFirstName}-focused, not business-focused. Wellbeing, energy, decision quality, values alignment.

Generate exactly three briefing items: item[0] is Steward's take, item[1] is Operator's, item[2] is Coach's. Each item's \`title\` should start with the voice name in bold-style (e.g. "Steward: ..." or "David: ...").`
    : `Your voice: ${persona.voice}.
Your lens: ${persona.lens}.
Your scope: ${persona.scope}.`

  return `${baseIntro}

${voiceInstruction}

## What you're briefing on

${founderFirstName} is running ${tenantName}, a biological interpretation intelligence platform, coaching women whose bodies have stopped responding. Products:
- ${p.scorecardName} (lead magnet, free)
- ${p.reportProductName} ($${p.reportPrice} one-time)
- ${p.challengeName} ($${p.challengePrice} free, 14-day)
- ${p.blueprintName} ($${p.blueprintPrice} one-time)
- ${p.membershipName} ($${p.membershipPrice}/week recurring)
- Coaching: $${p.coachingPackage2xPrice} Foundational Read

Mon 13 Jul 2026 Funnel B launch is 10 days away — Meta ads activate that morning.

## Rules for briefings

1. **Grounded in the data.** Cite specific numbers from the snapshot. If a metric is null, say so — never invent.
2. **Actionable or insightful.** Suggested actions must have a clear \`cta_href\` to a page that helps take that action. Suggested questions must be answerable via conversation.
3. **Type discipline.**
   - \`action\` = "do this now" (include cta_href like /dashboard/feedback, /dashboard/business/ads etc)
   - \`question\` = "consider this" (no cta_href needed)
   - \`observation\` = "notice this" (context without demand)
   - \`alert\` = urgent, high-priority signal
4. **Priority discipline.**
   - \`critical\` = launch-critical or same-day
   - \`high\` = this week
   - \`normal\` = strategic/awareness
5. **Body length.** 1-3 sentences. Not paragraphs.
6. **Voice consistency.** Match ${isBoard ? 'the three distinct advisor voices' : `${persona.name}'s voice: ${persona.voice}`}.

## Anti-patterns to avoid

- Generic advice not grounded in the actual numbers
- Cheerleading ("Great work!")
- Overusing exclamation points
- Repeating what the metrics already show without adding insight
- Suggesting actions with no CTA path

Return ${isBoard ? '3 items (one per voice)' : '2-4 items'} via the record_briefing tool.`
}

// ─── Tool schema ────────────────────────────────────────────────────────

const BRIEFING_TOOL: Anthropic.Tool = {
  name: 'record_briefing',
  description: 'Record the briefing items for this persona. Always call this exactly once with 2-4 items (or exactly 3 for Board).',
  input_schema: {
    type: 'object',
    properties: {
      items: {
        type: 'array',
        description: 'Array of 2-4 briefing items (3 for Board, one per advisor voice)',
        items: {
          type: 'object',
          properties: {
            type: {
              type: 'string',
              enum: ['action', 'question', 'observation', 'alert'],
              description: 'Briefing item type',
            },
            title: {
              type: 'string',
              description: 'Persona opening line (max 100 chars)',
            },
            body: {
              type: 'string',
              description: 'Insight/context, 1-3 sentences citing specific numbers',
            },
            cta_label: {
              type: 'string',
              description: 'Optional CTA button text',
            },
            cta_href: {
              type: 'string',
              description: 'Optional relative deep-link (e.g. /dashboard/feedback)',
            },
            priority: {
              type: 'string',
              enum: ['critical', 'high', 'normal'],
              description: 'Sort order + color tone',
            },
          },
          required: ['type', 'title', 'body', 'priority'],
        },
      },
    },
    required: ['items'],
  },
}

function isValidItem(item: unknown): item is BriefingItem {
  if (!item || typeof item !== 'object') return false
  const i = item as Record<string, unknown>
  return (
    typeof i.type === 'string' &&
    ['action', 'question', 'observation', 'alert'].includes(i.type) &&
    typeof i.title === 'string' &&
    typeof i.body === 'string' &&
    typeof i.priority === 'string' &&
    ['critical', 'high', 'normal'].includes(i.priority)
  )
}
