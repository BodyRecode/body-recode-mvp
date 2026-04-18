import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'

const card: React.CSSProperties = {
  background: '#ffffff', border: '1px solid #e7e5e0', borderRadius: '12px', padding: '20px 22px',
}

const label: React.CSSProperties = {
  fontSize: '11px', fontWeight: 700, color: '#14b8a6',
  letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '4px',
}

const sectionTitle: React.CSSProperties = {
  fontSize: '20px', fontWeight: 800, color: '#1c1917', letterSpacing: '-0.01em', margin: '4px 0 0',
}

export default async function NutritionPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const admin = createAdminClient()
  const { data: enrollment } = await admin
    .from('challenge_enrollments')
    .select('id')
    .eq('token', token)
    .eq('status', 'active')
    .single()
  if (!enrollment) notFound()

  return (
    <div style={{
      minHeight: '100vh', background: '#fafaf9', color: '#1c1917',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    }}>
      {/* Header */}
      <div style={{ borderBottom: '1px solid #e7e5e0', padding: '18px 24px', background: '#ffffff' }}>
        <div style={{ maxWidth: '640px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <img src="https://bodyrecode.au/logo-teal.png" width="130" alt="Body Recode" style={{ display: 'block' }} />
          <Link href={`/challenge/${token}`} style={{ fontSize: '13px', color: '#0f766e', textDecoration: 'none', fontWeight: 500 }}>
            Back to portal
          </Link>
        </div>
      </div>

      <div style={{ maxWidth: '640px', margin: '0 auto', padding: '40px 24px 80px' }}>

        {/* Title */}
        <div style={{ marginBottom: '48px' }}>
          <p style={label}>14-Day Body Decode Challenge</p>
          <h1 style={{ fontSize: '28px', fontWeight: 900, letterSpacing: '-0.02em', margin: '6px 0 12px', color: '#1c1917' }}>Nutrition Guide</h1>
          <p style={{ fontSize: '15px', color: '#57534e', lineHeight: 1.75, margin: 0 }}>
            This is not a diet. It is a metabolic reset. The goal of the next 14 days is to calm inflammation, stabilise blood sugar, and restore your body&apos;s ability to use fat for fuel. Simple food, eaten at the right times.
          </p>
        </div>

        {/* HABNS System */}
        <div style={{ marginBottom: '48px' }}>
          <p style={label}>The System</p>
          <p style={sectionTitle}>Hybrid Animal-Based Nutrition System</p>
          <div style={{
            background: 'rgba(20,184,166,0.07)', border: '1px solid rgba(20,184,166,0.2)',
            borderRadius: '12px', padding: '22px', marginTop: '16px', marginBottom: '16px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <span style={{
                fontSize: '11px', fontWeight: 800, color: '#ffffff',
                background: '#14b8a6', padding: '3px 10px', borderRadius: '99px', letterSpacing: '0.08em',
              }}>HABNS</span>
            </div>
            <p style={{ fontSize: '15px', color: '#1c1917', lineHeight: 1.75, margin: 0 }}>
              The Hybrid Animal-Based Nutrition System is built on the nutrient density of animal foods as its foundation, with fruit as the primary carbohydrate source and strategic clean carbohydrates placed only around training. It works with your hormones rather than against them.
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            {[
              { icon: '🥩', text: 'Protein and fat anchor every meal' },
              { icon: '🍊', text: 'Fruit is your carbohydrate base' },
              { icon: '⚡', text: 'Clean carbs only around training' },
              { icon: '🔁', text: 'Meals are simple and repeatable' },
            ].map(p => (
              <div key={p.text} style={{ ...card, display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '18px', lineHeight: 1 }}>{p.icon}</span>
                <p style={{ fontSize: '13px', color: '#44403c', margin: 0, lineHeight: 1.55 }}>{p.text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* What to eat */}
        <div style={{ marginBottom: '48px' }}>
          <p style={label}>Animal-Based Foundation Foods</p>
          <p style={sectionTitle}>What to eat</p>
          <p style={{ fontSize: '14px', color: '#78716c', marginTop: '8px', marginBottom: '16px', lineHeight: 1.6 }}>
            These foods form the base of every meal. They are nutrient-dense, digestion-friendly, and hormonally supportive.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {[
              {
                cat: 'Protein',
                items: 'Beef, chicken, eggs, pork, lamb, turkey, seafood, yoghurt, cottage cheese',
                note: 'Prioritise at every meal',
              },
              {
                cat: 'Fats',
                items: 'Butter, ghee, coconut oil, avocado, cheese, egg yolks, tallow',
                note: 'Your energy source between meals',
              },
              {
                cat: 'Fruit',
                items: 'Bananas, berries, pineapple, apples, oranges, grapes, mango, melon',
                note: 'Your primary carbohydrate source every day',
              },
              {
                cat: 'Vegetables',
                items: 'Any that you enjoy and digest well',
                note: 'Optional - not required',
              },
            ].map(f => (
              <div key={f.cat} style={{ ...card }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                  <p style={{ fontSize: '14px', fontWeight: 700, color: '#14b8a6', margin: 0 }}>{f.cat}</p>
                  <span style={{ fontSize: '11px', color: '#78716c', background: '#f0efed', padding: '2px 8px', borderRadius: '99px', whiteSpace: 'nowrap' as const, marginLeft: '10px' }}>{f.note}</span>
                </div>
                <p style={{ fontSize: '13px', color: '#57534e', margin: 0, lineHeight: 1.55 }}>{f.items}</p>
              </div>
            ))}
          </div>
        </div>

        {/* What to avoid */}
        <div style={{ marginBottom: '48px' }}>
          <p style={label}>For These 14 Days</p>
          <p style={sectionTitle}>What to remove</p>
          <p style={{ fontSize: '14px', color: '#78716c', marginTop: '8px', marginBottom: '16px', lineHeight: 1.6 }}>
            These foods drive the inflammation, blood sugar swings, and hormonal disruption you are resetting from.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            {[
              'Seed oils (canola, sunflower, vegetable)',
              'Processed and packaged foods',
              'Refined sugar and lollies',
              'Bread, pasta, cereals, wraps',
              'Alcohol',
              'Flavoured drinks and juice',
              'Protein bars and diet foods',
              'Fast food and takeaway',
            ].map(item => (
              <div key={item} style={{ ...card, padding: '12px 14px', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                <svg style={{ flexShrink: 0, marginTop: '2px' }} width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
                <p style={{ fontSize: '13px', color: '#78716c', margin: 0, lineHeight: 1.5 }}>{item}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Carb Strategy */}
        <div style={{ marginBottom: '48px' }}>
          <p style={label}>Carbohydrate Strategy</p>
          <p style={sectionTitle}>Timing is everything</p>
          <p style={{ fontSize: '14px', color: '#78716c', marginTop: '8px', marginBottom: '16px', lineHeight: 1.6 }}>
            Clean carbohydrates are only eaten in the window around your training sessions. Outside of training, fat is your fuel.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
            {[
              { window: 'Rest days', rule: 'Protein + fat + fruit only. No starchy carbs.' },
              { window: 'Pre-training', rule: 'Small amount of fruit or honey if needed.' },
              { window: 'Post-training', rule: 'Protein + clean starchy carbs within 1 hour.' },
            ].map(w => (
              <div key={w.window} style={{ ...card, display: 'flex', gap: '0', alignItems: 'stretch', padding: 0, overflow: 'hidden' }}>
                <div style={{ background: 'rgba(20,184,166,0.08)', borderRight: '1px solid #e7e5e0', padding: '14px 16px', minWidth: '120px', display: 'flex', alignItems: 'center' }}>
                  <p style={{ fontSize: '12px', fontWeight: 700, color: '#14b8a6', margin: 0, textTransform: 'uppercase' as const, letterSpacing: '0.06em' }}>{w.window}</p>
                </div>
                <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center' }}>
                  <p style={{ fontSize: '13px', color: '#1c1917', margin: 0, lineHeight: 1.5 }}>{w.rule}</p>
                </div>
              </div>
            ))}
          </div>
          <div style={{ marginBottom: '12px' }}>
            <p style={{ fontSize: '13px', fontWeight: 700, color: '#a8a29e', textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: '10px' }}>Post-training carb options</p>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' as const }}>
              {['White rice', 'Potatoes', 'Sweet potato', 'Banana', 'Honey', 'Berries', 'Pineapple'].map(c => (
                <span key={c} style={{ fontSize: '13px', color: '#57534e', background: '#f0efed', borderRadius: '6px', padding: '5px 12px' }}>{c}</span>
              ))}
            </div>
          </div>
          <div style={{ ...card, background: 'rgba(20,184,166,0.07)', border: '1px solid rgba(20,184,166,0.18)' }}>
            <p style={{ fontSize: '13px', color: '#0f766e', lineHeight: 1.65, margin: 0 }}>
              This approach resets insulin sensitivity, reduces inflammation, and teaches your body to use stored fat for energy. After the challenge, carbohydrate flexibility increases inside the 6-Week Blueprint.
            </p>
          </div>
        </div>

        {/* Daily Rhythm */}
        <div style={{ marginBottom: '48px' }}>
          <p style={label}>Daily Rhythm</p>
          <p style={sectionTitle}>How a full day looks</p>
          <p style={{ fontSize: '14px', color: '#78716c', marginTop: '8px', marginBottom: '20px', lineHeight: 1.6 }}>
            Follow this rhythm on training days. On rest days, skip the training window and keep it to protein, fat, and fruit.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
            {[
              { time: 'On waking', content: '500ml water + pinch of salt', note: 'Before anything else. Rehydrate first.' },
              { time: 'Breakfast', content: 'Protein + fat', note: 'Eggs in butter + avocado, or yoghurt + berries' },
              { time: 'Pre-training', content: 'Salt + water', note: 'Add fruit or honey if you need a boost' },
              { time: 'During training', content: 'Water + electrolytes', note: null },
              { time: 'Post-training', content: 'Whey + fruit', note: 'Within 30 minutes. Start recovery.' },
              { time: 'Post-training meal', content: 'Protein + clean carbs', note: 'Beef + rice, chicken + potato' },
              { time: 'Evening meal', content: 'Protein + fat', note: 'Salmon + avocado, eggs + ghee, steak + butter' },
            ].map((m, i) => (
              <div key={m.time} style={{ display: 'flex', gap: '0' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginRight: '14px' }}>
                  <div style={{
                    width: '10px', height: '10px', borderRadius: '50%',
                    background: '#14b8a6', border: '2px solid #fafaf9',
                    flexShrink: 0, marginTop: '18px',
                  }} />
                  {i < 6 && <div style={{ width: '2px', flex: 1, background: '#e7e5e0', minHeight: '16px' }} />}
                </div>
                <div style={{ ...card, marginBottom: '6px', flex: 1 }}>
                  <p style={{ fontSize: '11px', fontWeight: 700, color: '#14b8a6', textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: '4px' }}>{m.time}</p>
                  <p style={{ fontSize: '14px', color: '#1c1917', margin: '0 0 2px', fontWeight: 600 }}>{m.content}</p>
                  {m.note && <p style={{ fontSize: '12px', color: '#a8a29e', margin: 0, lineHeight: 1.5 }}>{m.note}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Meal Builder */}
        <div style={{ marginBottom: '48px' }}>
          <p style={label}>Meal Builder</p>
          <p style={sectionTitle}>Build every meal the same way</p>
          <p style={{ fontSize: '14px', color: '#78716c', marginTop: '8px', marginBottom: '16px', lineHeight: 1.6 }}>
            Every meal follows the same structure. Start with protein, add fat, add fruit, then carbs only if it is a training day.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
            {[
              { num: '01', title: 'Protein', sub: 'Always first', items: 'Beef, chicken, eggs, pork, lamb, seafood, yoghurt' },
              { num: '02', title: 'Fat', sub: 'Every meal', items: 'Butter, ghee, coconut oil, avocado, cheese, egg yolks' },
              { num: '03', title: 'Fruit', sub: 'Daily carb base', items: 'Any fruit you enjoy. Eat freely.' },
              { num: '04', title: 'Starchy carbs', sub: 'Post-training only', items: 'Rice, potato, sweet potato, honey' },
            ].map(m => (
              <div key={m.num} style={{ ...card }}>
                <p style={{ fontSize: '24px', fontWeight: 900, color: '#14b8a6', margin: '0 0 2px', letterSpacing: '-0.02em' }}>{m.num}</p>
                <p style={{ fontSize: '14px', fontWeight: 700, color: '#1c1917', margin: '0 0 2px' }}>{m.title}</p>
                <p style={{ fontSize: '11px', color: '#a8a29e', textTransform: 'uppercase' as const, letterSpacing: '0.06em', margin: '0 0 8px' }}>{m.sub}</p>
                <p style={{ fontSize: '12px', color: '#78716c', margin: 0, lineHeight: 1.55 }}>{m.items}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Example Meals */}
        <div style={{ marginBottom: '48px' }}>
          <p style={label}>Example Meals</p>
          <p style={sectionTitle}>What this looks like in practice</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '16px' }}>
            {[
              {
                meal: 'Breakfast',
                tag: 'Every day',
                items: [
                  '3 eggs scrambled in butter + half an avocado',
                  'Cottage cheese + mixed berries + honey',
                  'Greek yoghurt + banana + pinch of salt',
                ]
              },
              {
                meal: 'Lunch or Dinner (Rest Day)',
                tag: 'Protein + fat only',
                items: [
                  'Beef mince + avocado + salt',
                  'Chicken thighs cooked in butter + side of fruit',
                  'Salmon fillet + cucumber + avocado',
                  'Steak + fried eggs + ghee',
                ]
              },
              {
                meal: 'Post-Training Meal',
                tag: 'Training day only',
                items: [
                  'Beef mince + white rice',
                  'Chicken thighs + potato + butter',
                  'Ground turkey + sweet potato',
                  'Whey protein shake + banana immediately post-session',
                ]
              },
            ].map(e => (
              <div key={e.meal} style={card}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                  <p style={{ fontSize: '14px', fontWeight: 700, color: '#1c1917', margin: 0 }}>{e.meal}</p>
                  <span style={{ fontSize: '11px', color: '#78716c', background: '#f0efed', padding: '2px 8px', borderRadius: '99px' }}>{e.tag}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {e.items.map(item => (
                    <div key={item} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                      <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#14b8a6', flexShrink: 0, marginTop: '7px' }} />
                      <p style={{ fontSize: '13px', color: '#44403c', margin: 0, lineHeight: 1.55 }}>{item}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Hydration */}
        <div style={{ marginBottom: '48px' }}>
          <p style={label}>Hydration and Electrolytes</p>
          <p style={sectionTitle}>Salt and water are your base</p>
          <p style={{ fontSize: '14px', color: '#78716c', marginTop: '8px', marginBottom: '16px', lineHeight: 1.6 }}>
            Most people are chronically under-hydrated and low on electrolytes. Fixing this alone improves energy, focus, and training performance.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div style={card}>
              <p style={{ fontSize: '13px', fontWeight: 700, color: '#14b8a6', marginBottom: '12px' }}>Daily targets</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {[
                  '2-3 litres of water daily',
                  'Pinch of salt in morning water',
                  'Electrolytes during training',
                  'No flavoured drinks or juice',
                  'Coffee is fine, just not first thing',
                ].map(i => (
                  <div key={i} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                    <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#14b8a6', flexShrink: 0, marginTop: '6px' }} />
                    <p style={{ fontSize: '13px', color: '#57534e', margin: 0, lineHeight: 1.45 }}>{i}</p>
                  </div>
                ))}
              </div>
            </div>
            <div style={card}>
              <p style={{ fontSize: '13px', fontWeight: 700, color: '#14b8a6', marginBottom: '12px' }}>Why salt matters</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {[
                  'Sharper mental clarity',
                  'Better muscle pump',
                  'More stable energy',
                  'Less post-training fatigue',
                  'Better cortisol regulation',
                ].map(i => (
                  <div key={i} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                    <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#14b8a6', flexShrink: 0, marginTop: '6px' }} />
                    <p style={{ fontSize: '13px', color: '#57534e', margin: 0, lineHeight: 1.45 }}>{i}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Supplements */}
        <div style={{ marginBottom: '48px' }}>
          <p style={label}>Supplements</p>
          <p style={sectionTitle}>What supports the system</p>
          <p style={{ fontSize: '14px', color: '#78716c', marginTop: '8px', marginBottom: '16px', lineHeight: 1.6 }}>
            All optional. Supplements support consistency - they do not replace food quality.
          </p>
          <div style={card}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
              {[
                { name: 'Electrolytes', timing: 'Daily', note: 'Especially important on training days and in the morning' },
                { name: 'Whey protein', timing: 'Post-training', note: 'Fast-digesting protein to kickstart recovery' },
                { name: 'FocusFuel', timing: 'Pre-training', note: 'Clean energy without seed oils or artificial sweeteners' },
                { name: 'Creatine', timing: 'Daily', note: '5g per day. Supports performance and recovery' },
                { name: 'Magnesium', timing: 'Evening', note: 'Supports sleep quality and muscle recovery' },
              ].map((s, i) => (
                <div key={s.name} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                  paddingTop: i === 0 ? '0' : '14px',
                  paddingBottom: '14px',
                  borderBottom: i < 4 ? '1px solid #e7e5e0' : 'none',
                }}>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: '14px', fontWeight: 600, color: '#1c1917', margin: '0 0 3px' }}>{s.name}</p>
                    <p style={{ fontSize: '12px', color: '#a8a29e', margin: 0, lineHeight: 1.4 }}>{s.note}</p>
                  </div>
                  <span style={{ fontSize: '11px', color: '#14b8a6', background: 'rgba(20,184,166,0.08)', border: '1px solid rgba(20,184,166,0.2)', padding: '3px 10px', borderRadius: '99px', marginLeft: '16px', whiteSpace: 'nowrap' as const }}>{s.timing}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Shopping List */}
        <div>
          <p style={label}>Shopping List</p>
          <p style={sectionTitle}>Everything you need</p>
          <p style={{ fontSize: '14px', color: '#78716c', marginTop: '8px', marginBottom: '16px', lineHeight: 1.6 }}>
            Keep it simple. Stock these and you will not need to think about food choices during the challenge.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {[
              { cat: 'Proteins', items: 'Beef mince, chicken thighs, eggs (lots), salmon, pork, lamb, Greek yoghurt, cottage cheese, whey protein' },
              { cat: 'Fats', items: 'Butter, ghee, coconut oil, avocados, cheese (cheddar or parmesan), egg yolks' },
              { cat: 'Fruit', items: 'Bananas, mixed berries (fresh or frozen), pineapple, apples, oranges, grapes, mango' },
              { cat: 'Post-Training Carbs', items: 'White rice, potatoes (white and sweet), raw honey' },
              { cat: 'Hydration', items: 'Quality sea salt or Himalayan salt, electrolyte powder (no sugar), sparkling water' },
              { cat: 'Kitchen basics', items: 'Bone broth, herbs, spices, garlic, lemon' },
            ].map((s) => (
              <div key={s.cat} style={{ ...card, padding: '16px 18px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                  <div style={{
                    width: '6px', height: '6px', borderRadius: '50%',
                    background: '#14b8a6', flexShrink: 0, marginTop: '6px',
                  }} />
                  <div>
                    <p style={{ fontSize: '13px', fontWeight: 700, color: '#14b8a6', margin: '0 0 4px' }}>{s.cat}</p>
                    <p style={{ fontSize: '13px', color: '#78716c', margin: 0, lineHeight: 1.6 }}>{s.items}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
