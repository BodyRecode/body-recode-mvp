/* Live end-to-end test of the yoga generation engine (no HTTP/auth layer).
   Exercises the real doctrine + prompt modules against the linked DB + Anthropic.
   Run: npx tsx scripts/test-yoga-generate.ts <client_id> [rrs_level] */

import { readFileSync } from 'fs'
import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'
import {
  intensityCeilingForState, intensityAtOrBelow, filterContraindicated,
  practiceArc, clampYogaSequence, RRSLevel, YogaIntensity, YogaSequence,
} from '../src/lib/yoga-doctrine'
import { buildYogaSystemPrompt, buildYogaUserPrompt, YogaMovementRow } from '../src/lib/yoga-prompt'

// load .env.local
for (const line of readFileSync('.env.local', 'utf8').split('\n')) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
  if (m) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
}

const clientId = process.argv[2]
const level = (Number(process.argv[3] ?? 3) as RRSLevel)
const contraindications = ['low_back_injury'] // demonstrate the safety filter

const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

async function main() {
  const { data: client } = await admin.from('clients').select('id, name').eq('id', clientId).maybeSingle()
  if (!client) throw new Error('client not found')

  const ceiling: YogaIntensity = intensityCeilingForState(level)
  const { data: lib } = await admin.from('yoga_movements')
    .select('id, name, sanskrit_name, family, intensity, level, target_regions, weight_bearing, props, contraindications, hold_style, default_hold_seconds, default_breaths, breath_cue, cue')
    .eq('is_active', true)
  const within = (lib ?? []).filter((p) => intensityAtOrBelow(p.intensity as YogaIntensity, ceiling))
  const available = filterContraindicated(within, contraindications)

  console.log(`\nclient: ${client.name}`)
  console.log(`rrs level ${level} -> ceiling: ${ceiling}`)
  console.log(`library ${lib?.length} -> within ceiling ${within.length} -> after contraindications ${available.length}`)
  console.log(`contraindications applied: ${contraindications.join(', ')}\n`)

  const arc = practiceArc(ceiling)
  const msg = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 4000,
    system: buildYogaSystemPrompt(),
    messages: [{ role: 'user', content: buildYogaUserPrompt(client.name, ceiling, arc, 'Running on empty, poor sleep, stress high. Needs downregulation.', available as YogaMovementRow[], 45, null) }],
  })
  const text = msg.content[0].type === 'text' ? msg.content[0].text : ''
  const json = text.slice(text.indexOf('{'), text.lastIndexOf('}') + 1)
  const parsed = JSON.parse(json) as YogaSequence
  const { sequence, notes } = clampYogaSequence(parsed, available.map((p) => p.name))

  console.log(`PRACTICE: ${sequence.practice_name}`)
  console.log(`intention: ${sequence.intention}\n`)
  for (const seg of sequence.segments) {
    console.log(`  [${seg.label}]`)
    for (const p of seg.poses) {
      const hold = p.hold_seconds ? `${p.hold_seconds}s` : p.breaths ? `${p.breaths} breaths` : ''
      console.log(`    - ${p.name}${p.side && p.side !== 'both' ? ` (${p.side})` : ''}  ${hold}  ${p.cue ?? ''}`)
    }
  }
  console.log(`\nclamp notes: ${notes.length ? notes.join(' | ') : 'none'}`)
  console.log(`summary: ${sequence.summary ?? ''}`)

  // store
  const sessions = [{ day_label: sequence.practice_name, skeleton: 'Yoga Practice', modality: 'yoga', intention: sequence.intention, summary: sequence.summary ?? null, ceiling, segments: sequence.segments }]
  const { data: prog, error } = await admin.from('programs').insert({
    client_id: clientId, block_name: sequence.practice_name, modality: 'yoga',
    progression_phase: 'restoration', training_goal: 'capacity', training_frequency: 2,
    training_age: 'beginner', week_duration: 4, equipment_access: [], sessions,
    status: 'draft', is_active: false,
  }).select('id').single()
  if (error) throw error
  console.log(`\nstored program id: ${prog.id}`)
}

main().catch((e) => { console.error(e); process.exit(1) })
