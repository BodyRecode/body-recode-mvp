// Seed story scaffolding for the 6-week post-launch arc (Mon 20 Jul → Sun 24 Aug 2026).
//
// Generates ~3 stories per day with rotating themes per the IG Stories Playbook:
//   - Morning (07:30): hook OR pattern spotlight OR quote
//   - Midday (12:30): inside-the-challenge OR pattern-process OR diagnostic
//   - Evening (19:30): photo overlay OR launch-reveal OR personal moment
//
// Themes shift by week per the strategy doc:
//   - Week 2 (20-26 Jul): "what's at Day 14" + Blueprint preview
//   - Week 3 (27 Jul-2 Aug): Blueprint deep-dive + first testimonials
//   - Week 4 (3-9 Aug): Membership warming + mid-cohort cases
//   - Week 5 (10-16 Aug): Membership launch flood + Blueprint completers
//   - Week 6 (17-24 Aug): evergreen doctrinal cadence
//
// Run: cd ~/body-recode-mvp && set -a && source .env.local && set +a && npx tsx scripts/seed-post-launch-stories.ts

import { createClient } from '@supabase/supabase-js'

type StoryCategory = 'hook' | 'pattern' | 'inside_challenge' | 'quote' | 'photo_overlay' | 'launch_reveal'

interface StorySlot {
  date: string
  time: string
  category: StoryCategory
  title: string
  notes: string
}

// Week themes - each week's stories rotate through theme categories
const WEEK_THEMES: Record<string, { focus: string; categoryRotation: StoryCategory[][] }> = {
  // Week 2 (Mon 20 - Sun 26 Jul) - Blueprint preview + Wave 2
  'week-2': {
    focus: 'Day 14 reveals + Blueprint preview + Wave 2 announcement (if applicable)',
    categoryRotation: [
      ['hook', 'inside_challenge', 'photo_overlay'],     // Mon
      ['pattern', 'quote', 'photo_overlay'],              // Tue
      ['hook', 'inside_challenge', 'pattern'],            // Wed
      ['quote', 'inside_challenge', 'photo_overlay'],     // Thu
      ['hook', 'pattern', 'photo_overlay'],               // Fri
      ['quote', 'inside_challenge'],                      // Sat (2 stories)
      ['hook', 'photo_overlay', 'inside_challenge'],      // Sun (Day 14 reveal moment)
    ],
  },
  // Week 3 (Mon 27 Jul - Sun 2 Aug) - Blueprint drive + first testimonials
  'week-3': {
    focus: 'Blueprint deep-dive + first granted testimonials + Day 21 feedback emails landing',
    categoryRotation: [
      ['hook', 'pattern', 'quote'],
      ['quote', 'inside_challenge', 'photo_overlay'],
      ['hook', 'pattern', 'inside_challenge'],
      ['quote', 'photo_overlay', 'pattern'],
      ['hook', 'inside_challenge', 'quote'],
      ['quote', 'photo_overlay'],
      ['hook', 'pattern', 'quote'],
    ],
  },
  // Week 4 (Mon 3 - Sun 9 Aug) - Membership warming + mid-cohort cases
  'week-4': {
    focus: 'Mid-Blueprint testimonials + Membership pre-launch warming',
    categoryRotation: [
      ['hook', 'pattern', 'quote'],
      ['quote', 'pattern', 'photo_overlay'],
      ['hook', 'inside_challenge', 'photo_overlay'],
      ['quote', 'pattern', 'inside_challenge'],
      ['hook', 'photo_overlay', 'pattern'],
      ['quote', 'pattern'],
      ['hook', 'quote', 'photo_overlay'],
    ],
  },
  // Week 5 (Mon 10 - Sun 16 Aug) - Membership launch flood
  'week-5': {
    focus: 'MEMBERSHIP LAUNCH WEEK - mirror Week 1 energy, 5-6 stories/day Mon-Wed, normalise by Fri',
    categoryRotation: [
      ['launch_reveal', 'hook', 'inside_challenge', 'photo_overlay', 'quote'], // Mon launch
      ['hook', 'pattern', 'inside_challenge', 'photo_overlay'],                  // Tue
      ['quote', 'inside_challenge', 'pattern', 'photo_overlay'],                 // Wed
      ['hook', 'pattern', 'quote'],                                              // Thu normalise
      ['quote', 'inside_challenge', 'photo_overlay'],                            // Fri
      ['hook', 'pattern'],                                                       // Sat
      ['hook', 'pattern', 'quote'],                                              // Sun
    ],
  },
  // Week 6 (Mon 17 - Sun 24 Aug) - Evergreen normalised cadence
  'week-6': {
    focus: 'Evergreen cycle - 3 stories/day, doctrinal content at full volume',
    categoryRotation: [
      ['hook', 'pattern', 'quote'],
      ['quote', 'pattern', 'photo_overlay'],
      ['hook', 'inside_challenge', 'photo_overlay'],
      ['quote', 'pattern', 'inside_challenge'],
      ['hook', 'pattern', 'quote'],
      ['quote', 'photo_overlay'],
      ['hook', 'pattern', 'quote'],
    ],
  },
}

const STORY_TIMES_BY_INDEX = ['07:30', '12:30', '19:30', '21:00', '22:00'] // for slot 1,2,3,4,5

// Week start dates (Monday of each week)
const WEEK_STARTS = [
  { week: 'week-2', startDate: '2026-07-20' },
  { week: 'week-3', startDate: '2026-07-27' },
  { week: 'week-4', startDate: '2026-08-03' },
  { week: 'week-5', startDate: '2026-08-10' },
  { week: 'week-6', startDate: '2026-08-17' },
]

function addDays(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  const dt = new Date(Date.UTC(y, m - 1, d + days))
  return `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, '0')}-${String(dt.getUTCDate()).padStart(2, '0')}`
}

function titleFor(category: StoryCategory, weekFocus: string, slotIdx: number, weekNum: string): string {
  const weekShort = weekNum.replace('week-', 'W')
  const labels: Record<StoryCategory, string> = {
    hook: `Hook · ${weekShort} ${slotIdx + 1}`,
    pattern: `Pattern spotlight · ${weekShort} ${slotIdx + 1}`,
    inside_challenge: `Inside · ${weekShort} ${slotIdx + 1}`,
    quote: `Quote · ${weekShort} ${slotIdx + 1}`,
    photo_overlay: `Photo overlay · ${weekShort} ${slotIdx + 1}`,
    launch_reveal: `Launch reveal · ${weekShort} ${slotIdx + 1}`,
  }
  return labels[category]
}

function notesFor(category: StoryCategory, weekFocus: string): string {
  return `${weekFocus} · category=${category}. Render with appropriate copy when week N-1 signal is known.`
}

const stories: StorySlot[] = []

for (const { week, startDate } of WEEK_STARTS) {
  const theme = WEEK_THEMES[week]
  for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
    const date = addDays(startDate, dayOffset)
    const cats = theme.categoryRotation[dayOffset]
    for (let slotIdx = 0; slotIdx < cats.length; slotIdx++) {
      stories.push({
        date,
        time: STORY_TIMES_BY_INDEX[slotIdx] ?? `${(20 + slotIdx).toString().padStart(2, '0')}:00`,
        category: cats[slotIdx],
        title: titleFor(cats[slotIdx], theme.focus, slotIdx, week),
        notes: notesFor(cats[slotIdx], theme.focus),
      })
    }
  }
}

async function main() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Supabase env missing')
  }
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

  let inserted = 0
  let skipped = 0
  for (const s of stories) {
    const { data: existing } = await supabase
      .from('calendar_posts')
      .select('id')
      .eq('date', s.date)
      .eq('time', s.time)
      .eq('type', 'story')
      .maybeSingle()
    if (existing) {
      skipped++
      continue
    }
    const { error } = await supabase.from('calendar_posts').insert({
      date: s.date,
      time: s.time,
      brand: 'body_recode',
      platform: 'instagram',
      type: 'story',
      phase: 'evergreen',
      title: s.title,
      notes: s.notes,
      caption: null,
      graphic: null, // Stories will be rendered closer to date when copy is known
    })
    if (error) {
      console.error(`[!] ${s.date} ${s.time}: ${error.message}`)
      continue
    }
    inserted++
  }

  console.log(`Done. Inserted ${inserted} · Skipped ${skipped} (date+time slot already taken)`)
  console.log(`Total scoped: ${stories.length} stories across Weeks 2-6 (35 days)`)
}

main().catch(err => { console.error('Fatal:', err); process.exit(1) })
