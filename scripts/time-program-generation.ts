/**
 * How long does a program generation actually take?
 *
 * Vicki's Block 1 timed out twice. Rather than nudge the limit up again and
 * have Kade wait another two minutes to find out, measure it: same system
 * prompt, same model, same token cap, real exercise library.
 */
import Anthropic from '@anthropic-ai/sdk'
import { buildProgramSystemPrompt } from '../src/lib/program-prompt'
import { withTemporalContext } from '../src/lib/temporal-context'
import { AI_MODELS } from '../src/lib/ai-models'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

async function main() {
  const system = withTemporalContext(buildProgramSystemPrompt())
  console.log(`system prompt: ${system.length} chars (~${Math.round(system.length / 4)} tokens)`)
  console.log(`model: ${AI_MODELS.clinical}, max_tokens: 20000\n`)

  const t0 = Date.now()
  let firstToken = 0
  let out = ''

  const stream = anthropic.messages.stream({
    model: AI_MODELS.clinical,
    max_tokens: 20000,
    system,
    messages: [{
      role: 'user',
      content: `Generate a 3x/week full-body Restoration program, capacity goal, 4 weeks, beginner training age, developing competency, machine and bodyweight equipment only, for a 52-year-old female with an active sacroiliac presentation, foot and ankle injury history, and wrist limitations. Include a Capacity/Resilience slot in every session. Return the full JSON object exactly as specified.`,
    }],
  })

  stream.on('text', (t) => {
    if (!firstToken) firstToken = Date.now() - t0
    out += t
  })

  const final = await stream.finalMessage()
  const total = Date.now() - t0

  console.log(`first token:   ${(firstToken / 1000).toFixed(1)}s`)
  console.log(`total:         ${(total / 1000).toFixed(1)}s`)
  console.log(`stop_reason:   ${final.stop_reason}`)
  console.log(`output tokens: ${final.usage.output_tokens}`)
  console.log(`input tokens:  ${final.usage.input_tokens}`)
  console.log(`chars out:     ${out.length}`)
  console.log(`\nverdict: ${total < 240_000 ? 'FITS in the 240s budget' : 'EXCEEDS the budget, needs splitting'}`)

}

main()
