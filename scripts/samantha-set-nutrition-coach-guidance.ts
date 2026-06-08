// Set coach_guidance on Samantha's active nutrition plan to capture the
// travel-block reality (4 weeks away, no kitchen, eats out, natural 2-meal
// pattern is acceptable while traveling). This guidance carries forward to
// every regenerate via the precedence rule in generate-nutrition/route.ts
// (explicit body value wins; else carry from most recent plan). Idempotent.

import { createClient } from '@supabase/supabase-js'

const CLIENT_ID = '403af6c4-136a-40e9-bd90-7d8e1dd101b9'
const PLAN_ID = '8899d670-a4c7-438e-8e9e-02f2b22d2cc9'

const GUIDANCE = `Travel block (5 June 2026 to 5 July 2026). Samantha is away from home for four weeks with no kitchen access and eats out / orders takeaway daily. The plan must work in restaurants and hotel rooms, not at her stove.

Adherence design (apply within strict output format — substitution_options MUST stay in the "Food (Ng state) ↔ Alt1 (Ng state), Alt2 (Ng state)" shape, NEVER prose sentences):
- Loosen meal-time rigidity in weekly_structure_notes only (timing is approximate, not clock-precise).
- Expand substitution_options by adding MORE comma-separated alternatives on the right-hand side of the ↔ for each line — at least 4-5 alternatives per protein/carb/fat line, biased toward portable, restaurant-resolvable, no-prep foods (Greek yoghurt cups, tinned fish, cooked chicken from a deli, sushi protein, eggs, banana, sweet potato, white rice, avocado). Do NOT write sentences describing when to use each swap; that note can go after an em-dash on a single line if needed.
- Surface adherence design choices in execution_rules and weekly_structure_notes, not in substitution_options.

Honour her natural eating rhythm during travel. Her stated typical_day_eating notes she often compresses to 2 meals (skips lunch when breakfast happens, or skips breakfast when lunch happens). For the travel block, treat meal_frequency=3 as the target but allow weekly_structure_notes to acknowledge that compressing to 2 substantive meals is acceptable AS LONG AS the protein anchor still distributes evenly within per-meal caps (no appetite-suppression medication, so the 4-meal hard rule does NOT apply). Do not prescribe lunch as a separate locked event if she has stated breakfast XOR lunch is her honest pattern.

Hold the regulation-first framing. She is still Remediation per CFFS; this block maintains nutritional stability under travel disruption, not aggressive recomposition. Goal is consistency under disruption, not capacity build. After her return on 6 July, regenerate without travel guidance to resume the home-kitchen baseline plan.

Acknowledge in the rationale that this plan is adherence-designed for the travel window, not the home baseline.`

async function main() {
  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  const { data: before, error: rErr } = await sb
    .from('nutrition_plans')
    .select('id, client_id, plan_name, coach_guidance, status')
    .eq('id', PLAN_ID).single()
  if (rErr) { console.error(rErr); process.exit(1) }
  if (!before || before.client_id !== CLIENT_ID) { console.error('Plan/client mismatch'); process.exit(1) }

  console.log('--- BEFORE ---')
  console.log(`plan_name: ${before.plan_name} | status: ${before.status}`)
  console.log(`coach_guidance: ${before.coach_guidance ?? '(none)'}`)

  const { error: uErr } = await sb
    .from('nutrition_plans')
    .update({ coach_guidance: GUIDANCE })
    .eq('id', PLAN_ID)
  if (uErr) { console.error('Update failed:', uErr); process.exit(1) }

  console.log('\n--- AFTER ---')
  console.log(GUIDANCE)
  console.log(`\nNow regenerate from /dashboard/clients/${CLIENT_ID}/nutrition (Regenerate button).`)
  console.log('The route will carry this guidance forward because no explicit value is in the regenerate body.')
}

main().catch((e) => { console.error(e); process.exit(1) })
