import { readFileSync } from 'fs'
import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'
import { buildYogaPlanSystemPrompt, buildYogaPlanUserPrompt } from '../src/lib/yoga-plan-prompt'
for (const l of readFileSync('.env.local','utf8').split('\n')){const m=l.match(/^([A-Z0-9_]+)=(.*)$/);if(m)process.env[m[1]]=m[2].replace(/^["']|["']$/g,'')}
const admin=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.SUPABASE_SERVICE_ROLE_KEY!)
const anthropic=new Anthropic({apiKey:process.env.ANTHROPIC_API_KEY!})
const TC='57af8a3b-7e88-41b7-9bcd-25cddac568c8'
;(async()=>{
  const msg=await anthropic.messages.create({model:'claude-haiku-4-5-20251001',max_tokens:2500,system:buildYogaPlanSystemPrompt(),messages:[{role:'user',content:buildYogaPlanUserPrompt({clientName:'Razia',bodyStateContext:'Depleted, poor sleep, high stress, no formal yoga experience.'})}]})
  const t=msg.content[0].type==='text'?msg.content[0].text:''
  const plan=JSON.parse(t.slice(t.indexOf('{'),t.lastIndexOf('}')+1))
  console.log('PLAN:',plan.plan_name,'\nOBJECTIVE:',plan.macro_objective,'\n')
  plan.blocks.forEach((b:any,i:number)=>console.log(`  ${i+1}. ${b.block_name} [${b.intensity}, ${b.week_duration}wk] - ${b.focus}\n     ${b.rationale}`))
  // store via the route's pattern
  await admin.from('training_plans').update({is_active:false}).eq('client_id',TC).eq('is_active',true)
  const {data:tp}=await admin.from('training_plans').insert({client_id:TC,plan_name:plan.plan_name,macro_objective:plan.macro_objective,is_active:true}).select('id').single()
  const rows=plan.blocks.map((b:any,i:number)=>({plan_id:tp!.id,client_id:TC,block_name:b.block_name,progression_phase:'restoration',training_goal:'capacity',phase_category:b.intensity,phase_objective:b.focus,week_duration:[4,6,8].includes(b.week_duration)?b.week_duration:4,position:i+1,status:'planned'}))
  const {error}=await admin.from('plan_blocks').insert(rows)
  console.log('\nstored plan',tp!.id,'blocks:',rows.length,error?('ERR '+error.message):'ok')
})().catch(e=>{console.error(e);process.exit(1)})
