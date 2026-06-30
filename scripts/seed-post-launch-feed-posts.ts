// Seed feed-post scaffolding for the 6-week post-launch arc (Mon 20 Jul → Sun 24 Aug 2026).
//
// Strategy: every slot gets a calendar_posts row with date, time, brand, platform,
// type, phase, title, and a starter-draft caption. Graphics + final captions get
// generated/refined week-by-week based on Week N-1 signal.
//
// Cadence per the strategy doc:
//   - BR: 5 posts/wk (Mon Authority, Tue Diagnostic/Contrarian rotate, Wed Pattern, Fri Coach, Sun Diagnostic)
//   - Personal brand: 3 posts/wk (Mon, Wed, Fri OR Tue, Thu, Sat - rotates)
//   - LinkedIn: 2 posts/wk (Tue + Thu)
//   - Plus Week 5 Membership launch bump (extra posts)
//
// Run: cd ~/body-recode-mvp && set -a && source .env.local && set +a && npx tsx scripts/seed-post-launch-feed-posts.ts

import { createClient } from '@supabase/supabase-js'

type Brand = 'body_recode' | 'personal_brand'
type Platform = 'instagram' | 'linkedin'
type PostType = 'authority' | 'diagnostic' | 'contrarian' | 'pattern' | 'coach' | 'pattern' | 'thread'
type Phase = 'launch' | 'ascension' | 'membership_launch' | 'evergreen'

interface PostScaffold {
  date: string
  time: string
  brand: Brand
  platform: Platform
  type: PostType
  phase: Phase
  title: string
  notes: string
}

// Week-by-week scaffolding. Title fields are intent-keyed; captions are starter drafts
// (this script ONLY seeds the scaffold - captions get added in week-by-week passes).

const posts: PostScaffold[] = [
  // ── WEEK 2 · Day 14 reveals + Wave 2 (Mon 20 - Sun 26 Jul) ──
  // Launch-day cohort hits Day 14 on Sun 26 Jul. Theme: Blueprint preview, what's after Day 14.
  { date: '2026-07-20', time: '07:00', brand: 'body_recode', platform: 'instagram', type: 'authority', phase: 'ascension', title: 'Wave 2 reopen OR continued Wave 1 push (decide Mon based on Wave 1 fill state)', notes: 'Edit copy depending on whether Wave 1 filled. If yes: "Wave 1 sold out in X days, Wave 2 opens with 25 spots." If no: continued Wave 1 messaging.' },
  { date: '2026-07-21', time: '07:30', brand: 'personal_brand', platform: 'instagram', type: 'pattern', phase: 'ascension', title: 'Personal · the question I get most after Day 14', notes: 'Founder voice. Common Day 14 question + the answer that points at Blueprint.' },
  { date: '2026-07-21', time: '07:30', brand: 'body_recode', platform: 'instagram', type: 'diagnostic', phase: 'ascension', title: 'Diagnostic · Day 14 framing - what people often miss', notes: 'Scorecard-funnel push for new cold leads. Anti-shame framing.' },
  { date: '2026-07-21', time: '08:00', brand: 'body_recode', platform: 'linkedin', type: 'thread', phase: 'ascension', title: 'LinkedIn · 1 week post-launch reflection', notes: 'Executive-reframe: what the first week of the Body Decode launch revealed about how high-performers respond to a diagnostic-led approach. No selling - observation.' },
  { date: '2026-07-22', time: '12:00', brand: 'body_recode', platform: 'instagram', type: 'pattern', phase: 'ascension', title: 'Pattern carousel · What happens at Day 14 (and beyond)', notes: '6-slide carousel: Day 14 = the read. Day 15-21 = integration. Day 22+ = next decision. Blueprint preview at the end.' },
  { date: '2026-07-23', time: '09:00', brand: 'personal_brand', platform: 'instagram', type: 'pattern', phase: 'ascension', title: 'Personal · the 6 weeks I spent rebuilding the Blueprint', notes: 'Founder voice. Story of how the Blueprint was built / pressure-tested.' },
  { date: '2026-07-23', time: '08:00', brand: 'body_recode', platform: 'linkedin', type: 'thread', phase: 'ascension', title: 'LinkedIn · the corrective work is not the read', notes: 'Frame: knowing your pattern (free read) is different to correcting it (paid Blueprint). Why the order matters.' },
  { date: '2026-07-24', time: '18:00', brand: 'body_recode', platform: 'instagram', type: 'coach', phase: 'ascension', title: 'Coach feature · Blueprint preview (photo-led)', notes: 'Use a kade portrait. Doctrine: "The Challenge reads the pattern. The Blueprint corrects it. Six weeks. Read first. Then act."' },
  { date: '2026-07-25', time: '09:00', brand: 'personal_brand', platform: 'instagram', type: 'pattern', phase: 'ascension', title: 'Personal · what I do with my own body now', notes: 'Founder voice. Show the system applied to Kade himself.' },
  { date: '2026-07-26', time: '08:00', brand: 'body_recode', platform: 'instagram', type: 'diagnostic', phase: 'ascension', title: 'Sun Diagnostic · scorecard funnel push (Estrogen-Shift archetype)', notes: 'Archetype rotation per Funnel B strategy doc. Hook targeted to Perimenopausal Performer.' },

  // ── WEEK 3 · Blueprint drive (Mon 27 Jul - Sun 2 Aug) ──
  // First Blueprint enrolees hit Week 1. Theme: Blueprint deep-dive, first testimonials.
  { date: '2026-07-27', time: '07:00', brand: 'body_recode', platform: 'instagram', type: 'authority', phase: 'ascension', title: 'Mon Authority · Blueprint is the correction the Challenge points at', notes: 'Doctrine-led. Position Blueprint clearly in the ladder.' },
  { date: '2026-07-28', time: '07:30', brand: 'personal_brand', platform: 'instagram', type: 'pattern', phase: 'ascension', title: 'Personal · why the Blueprint is not a generic 6-week program', notes: 'Founder voice. Differentiation from market.' },
  { date: '2026-07-28', time: '12:00', brand: 'body_recode', platform: 'instagram', type: 'diagnostic', phase: 'ascension', title: 'Tue Diagnostic · first granted testimonial published', notes: 'EDIT BEFORE POSTING: pull text from feedback dashboard granted permission. Include attribution per their consent choice.' },
  { date: '2026-07-28', time: '08:00', brand: 'body_recode', platform: 'linkedin', type: 'thread', phase: 'ascension', title: 'LinkedIn · two weeks post-launch (data + observation)', notes: 'Show the early data: completion rates, NPS averages, what 100+ enrolees revealed about the high-performer plateau.' },
  { date: '2026-07-29', time: '12:00', brand: 'body_recode', platform: 'instagram', type: 'pattern', phase: 'ascension', title: 'Pattern carousel · Inside the Blueprint Week 1', notes: '6-slide carousel showing what Blueprint Week 1 actually looks like (without spoiling). Training/nutrition/coaching/check-in structure.' },
  { date: '2026-07-30', time: '09:00', brand: 'personal_brand', platform: 'instagram', type: 'pattern', phase: 'ascension', title: 'Personal · stories from the first Blueprint cohort (anonymised)', notes: 'Anti-shame framing. Pattern observations from real client work, not specific people.' },
  { date: '2026-07-30', time: '08:00', brand: 'body_recode', platform: 'linkedin', type: 'thread', phase: 'ascension', title: 'LinkedIn · why most fitness plans skip the read', notes: 'Executive-reframe. Argument: the read is the differentiator.' },
  { date: '2026-07-31', time: '18:00', brand: 'body_recode', platform: 'instagram', type: 'coach', phase: 'ascension', title: 'Coach feature · pattern-specific Blueprint hooks', notes: 'Use a kade portrait. Highlight one specific pattern (e.g. Stress-Stored) + the Blueprint correction for it.' },
  { date: '2026-08-01', time: '09:00', brand: 'personal_brand', platform: 'instagram', type: 'pattern', phase: 'ascension', title: 'Personal · what after Blueprint looks like (Membership tease)', notes: 'Soft Membership warming. "Once the pattern is corrected, what comes next is structure that compounds it."' },
  { date: '2026-08-02', time: '08:00', brand: 'body_recode', platform: 'instagram', type: 'diagnostic', phase: 'ascension', title: 'Sun Diagnostic · scorecard funnel push (Slipping High Performer)', notes: 'Archetype rotation. Hook targeted to Androgen-Decline.' },

  // ── WEEK 4 · First cohort maturity (Mon 3 - Sun 9 Aug) ──
  // Theme: mid-cohort testimonials, Membership pre-launch warming.
  { date: '2026-08-03', time: '07:00', brand: 'body_recode', platform: 'instagram', type: 'authority', phase: 'membership_launch', title: 'Mon Authority · the long-arc is the next layer (Membership warming)', notes: 'Position Membership as the natural continuation. Wave 4 evergreen flip likely this week.' },
  { date: '2026-08-04', time: '07:30', brand: 'personal_brand', platform: 'instagram', type: 'pattern', phase: 'membership_launch', title: 'Personal · why Membership exists', notes: 'Founder voice. The problem Membership solves (continuity after a 6-week sprint).' },
  { date: '2026-08-04', time: '12:00', brand: 'body_recode', platform: 'instagram', type: 'contrarian', phase: 'membership_launch', title: 'Tue Contrarian · the protocol is not the work', notes: 'Counter to "follow this protocol for 12 weeks" market positioning. The READ is the work, the protocol is the consequence.' },
  { date: '2026-08-04', time: '08:00', brand: 'body_recode', platform: 'linkedin', type: 'thread', phase: 'membership_launch', title: 'LinkedIn · the difference between sprint coaching and continuity', notes: 'Executive-reframe. Why the structure changes once the body has been read.' },
  { date: '2026-08-05', time: '12:00', brand: 'body_recode', platform: 'instagram', type: 'pattern', phase: 'membership_launch', title: 'Pattern carousel · Inside Membership (preview)', notes: '6-slide carousel showing what Membership looks like: monthly Looms, block-based training, ongoing pattern reads.' },
  { date: '2026-08-06', time: '09:00', brand: 'personal_brand', platform: 'instagram', type: 'pattern', phase: 'membership_launch', title: 'Personal · mid-Blueprint cohort case study (granted)', notes: 'EDIT BEFORE POSTING: pull from feedback dashboard granted permission. Anonymise carefully.' },
  { date: '2026-08-06', time: '08:00', brand: 'body_recode', platform: 'linkedin', type: 'thread', phase: 'membership_launch', title: 'LinkedIn · the ladder framework (Challenge → Blueprint → Membership)', notes: 'Educational. How the three products fit together. Soft Membership tease.' },
  { date: '2026-08-07', time: '18:00', brand: 'body_recode', platform: 'instagram', type: 'coach', phase: 'membership_launch', title: 'Coach feature · Membership concept', notes: 'Use a kade portrait. Position Membership as "the structure after the structure."' },
  { date: '2026-08-08', time: '09:00', brand: 'personal_brand', platform: 'instagram', type: 'pattern', phase: 'membership_launch', title: 'Personal · what Membership Monday Looms look like', notes: 'Founder voice. Preview the Membership weekly ritual.' },
  { date: '2026-08-09', time: '08:00', brand: 'body_recode', platform: 'instagram', type: 'diagnostic', phase: 'membership_launch', title: 'Sun Diagnostic · scorecard funnel push (Stressed Exec)', notes: 'Archetype rotation. Hook targeted to Stress-Stored.' },

  // ── WEEK 5 · MEMBERSHIP LAUNCH (Mon 10 - Sun 16 Aug) ──
  // Mirror of Week 1 Challenge launch energy. Theme: Membership announcement + Blueprint completer ascensions.
  { date: '2026-08-10', time: '07:00', brand: 'body_recode', platform: 'instagram', type: 'authority', phase: 'membership_launch', title: 'MEMBERSHIP LAUNCH · Mon Authority announcement', notes: 'Membership flips live today 7am. Authority-led announcement post.' },
  { date: '2026-08-10', time: '12:00', brand: 'body_recode', platform: 'instagram', type: 'pattern', phase: 'membership_launch', title: 'Pattern carousel · what Membership is + what it is not', notes: '6-slide carousel. Anti-shame framing, no hype.' },
  { date: '2026-08-11', time: '07:30', brand: 'personal_brand', platform: 'instagram', type: 'pattern', phase: 'membership_launch', title: 'Personal · why I built Membership', notes: 'Founder voice. Why this exists.' },
  { date: '2026-08-11', time: '12:00', brand: 'body_recode', platform: 'instagram', type: 'diagnostic', phase: 'membership_launch', title: 'Tue Diagnostic · Membership for the post-correction body', notes: 'Position Membership as the after-Blueprint structure.' },
  { date: '2026-08-11', time: '08:00', brand: 'body_recode', platform: 'linkedin', type: 'thread', phase: 'membership_launch', title: 'LinkedIn · Membership launch executive announcement', notes: 'Long-form. Position for the executive audience (Blueprint graduates).' },
  { date: '2026-08-12', time: '12:00', brand: 'body_recode', platform: 'instagram', type: 'pattern', phase: 'membership_launch', title: 'Wed Pattern · how Membership pattern continuity works', notes: 'Doctrinal post about pattern continuity across training blocks.' },
  { date: '2026-08-13', time: '09:00', brand: 'personal_brand', platform: 'instagram', type: 'pattern', phase: 'membership_launch', title: 'Personal · Blueprint Week 6 cohort completion (granted case study)', notes: 'EDIT BEFORE POSTING: pull from feedback dashboard Blueprint Day 30 granted captures.' },
  { date: '2026-08-13', time: '08:00', brand: 'body_recode', platform: 'linkedin', type: 'thread', phase: 'membership_launch', title: 'LinkedIn · how the full ladder works (Challenge → Blueprint → Membership)', notes: 'Educational. Now that all three are live, the ladder story is complete.' },
  { date: '2026-08-14', time: '18:00', brand: 'body_recode', platform: 'instagram', type: 'coach', phase: 'membership_launch', title: 'Coach feature · first Blueprint completer ascending to Membership', notes: 'Use a kade portrait. Personal framing on the ladder progression.' },
  { date: '2026-08-15', time: '09:00', brand: 'personal_brand', platform: 'instagram', type: 'pattern', phase: 'membership_launch', title: 'Personal · the Membership Member experience first week', notes: 'Founder voice. What a Member sees in their first week.' },
  { date: '2026-08-16', time: '08:00', brand: 'body_recode', platform: 'instagram', type: 'diagnostic', phase: 'membership_launch', title: 'Sun Diagnostic · scorecard funnel push (Insulin-Drift)', notes: 'Archetype rotation.' },

  // ── WEEK 6 · Evergreen cycle (Mon 17 - Sun 24 Aug) ──
  // Theme: full ladder live, system maturity, doctrinal content at full volume.
  { date: '2026-08-17', time: '07:00', brand: 'body_recode', platform: 'instagram', type: 'authority', phase: 'evergreen', title: 'Mon Authority · the full system at one month live', notes: 'Position the doctrine at full volume now that the ladder is complete.' },
  { date: '2026-08-18', time: '07:30', brand: 'personal_brand', platform: 'instagram', type: 'pattern', phase: 'evergreen', title: 'Personal · what 1 month of running this ladder taught me', notes: 'Founder voice. Reflection on the 6 weeks.' },
  { date: '2026-08-18', time: '12:00', brand: 'body_recode', platform: 'instagram', type: 'contrarian', phase: 'evergreen', title: 'Tue Contrarian · the pattern is in the data not the discipline', notes: 'Pull data observation from the first month. Specific signal.' },
  { date: '2026-08-18', time: '08:00', brand: 'body_recode', platform: 'linkedin', type: 'thread', phase: 'evergreen', title: 'LinkedIn · first-month system observations', notes: 'Executive-reframe. What the launch revealed.' },
  { date: '2026-08-19', time: '12:00', brand: 'body_recode', platform: 'instagram', type: 'pattern', phase: 'evergreen', title: 'Wed Pattern · the 4 patterns at scale (now with real data)', notes: '6-slide carousel. Pattern distribution from first 100+ enrolees.' },
  { date: '2026-08-20', time: '09:00', brand: 'personal_brand', platform: 'instagram', type: 'pattern', phase: 'evergreen', title: 'Personal · what I see now that I did not see before launch', notes: 'Founder voice. Honest reflection on what changed.' },
  { date: '2026-08-20', time: '08:00', brand: 'body_recode', platform: 'linkedin', type: 'thread', phase: 'evergreen', title: 'LinkedIn · the case against the optimisation playbook', notes: 'Executive-reframe. Counter the "optimise everything" market.' },
  { date: '2026-08-21', time: '18:00', brand: 'body_recode', platform: 'instagram', type: 'coach', phase: 'evergreen', title: 'Coach feature · the read-before-prescribe doctrine', notes: 'Use a kade portrait. Core doctrine post.' },
  { date: '2026-08-22', time: '09:00', brand: 'personal_brand', platform: 'instagram', type: 'pattern', phase: 'evergreen', title: 'Personal · Member story (granted, Blueprint→Membership ascender)', notes: 'EDIT BEFORE POSTING: granted-permission case study.' },
  { date: '2026-08-23', time: '09:00', brand: 'body_recode', platform: 'instagram', type: 'pattern', phase: 'evergreen', title: 'Sat Pattern · the system mature read', notes: 'Doctrinal post. State-first messaging at full volume.' },
  { date: '2026-08-24', time: '08:00', brand: 'body_recode', platform: 'instagram', type: 'diagnostic', phase: 'evergreen', title: 'Sun Diagnostic · 6 weeks since launch (next-archetype rotation)', notes: 'Archetype rotation continues. Sunday Diagnostic always = Stressed Exec at minimum, but rotate the hook.' },
]

async function main() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Supabase env missing')
  }
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

  let inserted = 0
  let skipped = 0
  for (const p of posts) {
    // Skip if already exists (idempotent on date + title prefix)
    const { data: existing } = await supabase
      .from('calendar_posts')
      .select('id')
      .eq('date', p.date)
      .ilike('title', `${p.title.slice(0, 30)}%`)
      .maybeSingle()
    if (existing) {
      skipped++
      console.log(`[=] exists: ${p.date} / "${p.title.slice(0, 50)}..."`)
      continue
    }

    const { error } = await supabase.from('calendar_posts').insert({
      date: p.date,
      time: p.time,
      brand: p.brand,
      platform: p.platform,
      type: p.type,
      phase: p.phase,
      title: p.title,
      notes: p.notes,
      caption: null, // Captions get drafted week-by-week based on signal
      graphic: null, // Graphics get rendered week-by-week
    })
    if (error) {
      console.error(`[!] ${p.date} / ${p.title.slice(0, 40)}: ${error.message}`)
      continue
    }
    inserted++
    console.log(`[+] ${p.date} ${p.time} · ${p.brand}/${p.platform}/${p.type} · "${p.title.slice(0, 50)}..."`)
  }

  console.log(`\nDone. Inserted ${inserted} · Skipped ${skipped} (already existed) · Total scoped ${posts.length}`)
}

main().catch(err => { console.error('Fatal:', err); process.exit(1) })
