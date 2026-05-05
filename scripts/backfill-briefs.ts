import { generatePreCallBrief } from '../src/lib/pre-call-brief'

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    console.error('Missing env vars')
    process.exit(1)
  }

  console.log('Fetching scored leads...')
  const r = await fetch(
    url + '/rest/v1/leads?select=id,name,scorecard_score,scorecard_body_state,scorecard_section_scores,approach_response,investment_readiness,lead_quality,pre_call_brief&scorecard_score=not.is.null&scorecard_body_state=not.is.null',
    { headers: { apikey: key, Authorization: 'Bearer ' + key } }
  )
  const leads = await r.json() as any[]
  console.log('Found ' + leads.length + ' scored leads')

  let generated = 0, skipped = 0, errors = 0
  for (const lead of leads) {
    if (lead.pre_call_brief) {
      skipped++
      continue
    }
    if (!lead.name) {
      console.warn('Skipping lead without name:', lead.id)
      errors++
      continue
    }
    try {
      const brief = generatePreCallBrief({
        name: lead.name,
        scorecard_score: lead.scorecard_score,
        scorecard_body_state: lead.scorecard_body_state,
        scorecard_section_scores: lead.scorecard_section_scores ?? {},
        approach_response: lead.approach_response,
        investment_readiness: lead.investment_readiness,
        lead_quality: lead.lead_quality,
      })
      const pr = await fetch(url + '/rest/v1/leads?id=eq.' + lead.id, {
        method: 'PATCH',
        headers: {
          apikey: key,
          Authorization: 'Bearer ' + key,
          'Content-Type': 'application/json',
          Prefer: 'return=minimal',
        },
        body: JSON.stringify({ pre_call_brief: brief }),
      })
      if (!pr.ok) {
        console.error('Patch failed for', lead.name, pr.status, await pr.text())
        errors++
      } else {
        generated++
        console.log('  ✓ ' + lead.name + ' (' + lead.scorecard_body_state + ', ' + lead.scorecard_score + '/15)')
      }
    } catch (e) {
      console.error('Error for', lead.name, ':', e instanceof Error ? e.message : e)
      errors++
    }
  }

  console.log('\nDone. Generated:', generated, ' Skipped (already had):', skipped, ' Errors:', errors)
}

main().catch(e => { console.error(e); process.exit(1) })
