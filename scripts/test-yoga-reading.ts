import { readFileSync } from 'fs'
import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'
import { buildYogaReadingSystemPrompt, buildYogaReadingUserPrompt } from '../src/lib/yoga-reading-prompt'
for (const line of readFileSync('.env.local','utf8').split('\n')){const m=line.match(/^([A-Z0-9_]+)=(.*)$/);if(m)process.env[m[1]]=m[2].replace(/^["']|["']$/g,'')}
const admin=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.SUPABASE_SERVICE_ROLE_KEY!)
const anthropic=new Anthropic({apiKey:process.env.ANTHROPIC_API_KEY!})
const TC='57af8a3b-7e88-41b7-9bcd-25cddac568c8'
;(async()=>{
  const {data:p}=await admin.from('programs').select('id,block_name,prescription_rationale,weekly_pattern_summary,progression_notes').eq('client_id',TC).eq('modality','yoga').order('generated_at',{ascending:false}).limit(1).single()
  const msg=await anthropic.messages.create({model:'claude-haiku-4-5-20251001',max_tokens:2000,system:buildYogaReadingSystemPrompt(),messages:[{role:'user',content:buildYogaReadingUserPrompt({clientName:'Razia',blockName:p!.block_name,rationale:p!.prescription_rationale,weeklyStructure:p!.weekly_pattern_summary,progression:p!.progression_notes})}]})
  const t=msg.content[0].type==='text'?msg.content[0].text:''
  const r=JSON.parse(t.slice(t.indexOf('{'),t.lastIndexOf('}')+1))
  for(const k of Object.keys(r)){console.log('\n['+k+']\n'+r[k])}
})().catch(e=>{console.error(e);process.exit(1)})
