import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'

const card: React.CSSProperties = {
  background: '#111110', border: '1px solid #1c1917', borderRadius: '12px', padding: '20px 22px',
}

const label: React.CSSProperties = {
  fontSize: '11px', fontWeight: 700, color: '#14b8a6',
  letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '4px',
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
      minHeight: '100vh', background: '#0c0a09', color: '#ffffff',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    }}>
      {/* Header */}
      <div style={{ borderBottom: '1px solid #1c1917', padding: '18px 24px' }}>
        <div style={{ maxWidth: '640px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <img src="https://bodyrecode.au/logo-teal.png" width="130" alt="Body Recode" style={{ display: 'block' }} />
          <Link href={`/challenge/${token}`} style={{ fontSize: '13px', color: '#57534e', textDecoration: 'none' }}>
            ← Back to portal
          </Link>
        </div>
      </div>

      <div style={{ maxWidth: '640px', margin: '0 auto', padding: '40px 24px 80px' }}>

        {/* Title */}
        <div style={{ marginBottom: '40px' }}>
          <p style={label}>14-Day Body Decode Challenge</p>
          <h1 style={{ fontSize: '28px', fontWeight: 900, letterSpacing: '-0.02em', margin: '6px 0 12px' }}>Nutrition Guide</h1>
          <p style={{ fontSize: '15px', color: '#a8a29e', lineHeight: 1.7, margin: 0 }}>
            Simple whole foods, predictable meal timing, and digestion-friendly choices that calm your system. This is not a diet. It is a reset.
          </p>
        </div>

        {/* What is HABPS */}
        <div style={{ marginBottom: '48px' }}>
          <p style={{ ...label, marginBottom: '12px' }}>The System</p>
          <div style={{ ...card, background: 'rgba(20,184,166,0.05)', border: '1px solid rgba(20,184,166,0.15)', marginBottom: '16px' }}>
            <p style={{ fontSize: '16px', fontWeight: 800, color: '#ffffff', marginBottom: '8px' }}>HABPS</p>
            <p style={{ fontSize: '13px', color: '#a8a29e', lineHeight: 1.65, margin: '0 0 4px' }}>
              Hybrid Animal Based Performance System. It blends the nutrient density of animal-based eating with the strategic use of clean carbohydrates to support training, recovery, and performance.
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            {[
              'Protein and healthy fats anchor every meal',
              'Fruit provides your daily carbohydrates',
              'Clean carbs added after training only',
              'Meals are repeatable, simple, and digestion friendly',
            ].map(p => (
              <div key={p} style={{ ...card, display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                <svg style={{ flexShrink: 0, marginTop: '2px' }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#14b8a6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <p style={{ fontSize: '13px', color: '#d4cfc9', margin: 0, lineHeight: 1.5 }}>{p}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Animal Based Foundations */}
        <div style={{ marginBottom: '48px' }}>
          <p style={{ ...label, marginBottom: '12px' }}>Animal Based Foundations</p>
          <p style={{ fontSize: '15px', color: '#a8a29e', marginBottom: '16px', lineHeight: 1.6 }}>Your base comes from high quality animal foods.</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {[
              { cat: 'Protein sources', items: 'Beef, chicken, eggs, seafood, pork, lamb, yoghurt, cottage cheese' },
              { cat: 'Primary fats', items: 'Butter, ghee, coconut oil, avocado, cheese, egg yolks' },
              { cat: 'Fruit', items: 'Any fruit you enjoy. Fruit is your carbohydrate foundation.' },
              { cat: 'Vegetables', items: 'Optional. Include if you enjoy them and digest them well.' },
            ].map(f => (
              <div key={f.cat} style={{ ...card, display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                <p style={{ fontSize: '13px', fontWeight: 700, color: '#14b8a6', margin: 0, minWidth: '130px', flexShrink: 0 }}>{f.cat}</p>
                <p style={{ fontSize: '13px', color: '#a8a29e', margin: 0, lineHeight: 1.5 }}>{f.items}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Carb Strategy */}
        <div style={{ marginBottom: '48px' }}>
          <p style={{ ...label, marginBottom: '12px' }}>Carbohydrate Strategy</p>
          <div style={{ ...card, marginBottom: '12px' }}>
            <p style={{ fontSize: '16px', fontWeight: 800, color: '#ffffff', marginBottom: '6px' }}>Strict for 14 days</p>
            <p style={{ fontSize: '14px', color: '#a8a29e', lineHeight: 1.65, marginBottom: '16px' }}>
              Clean carbohydrates are only eaten around training for these 14 days.
            </p>
            <p style={{ fontSize: '13px', fontWeight: 700, color: '#14b8a6', marginBottom: '8px' }}>This improves:</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '16px' }}>
              {['Energy control', 'Fat loss', 'Clarity and focus', 'Better digestion', 'Recovery and performance'].map(i => (
                <div key={i} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#14b8a6', flexShrink: 0 }} />
                  <p style={{ fontSize: '13px', color: '#d4cfc9', margin: 0 }}>{i}</p>
                </div>
              ))}
            </div>
            <p style={{ fontSize: '13px', fontWeight: 700, color: '#14b8a6', marginBottom: '8px' }}>Training carb options:</p>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' as const }}>
              {['Potatoes', 'White rice', 'Honey', 'Banana', 'Berries', 'Pineapple'].map(c => (
                <span key={c} style={{ fontSize: '13px', color: '#a8a29e', background: '#1c1917', borderRadius: '6px', padding: '4px 10px' }}>{c}</span>
              ))}
            </div>
          </div>
          <div style={{ ...card, background: 'rgba(20,184,166,0.05)', border: '1px solid rgba(20,184,166,0.15)' }}>
            <p style={{ fontSize: '13px', color: '#99d6d0', lineHeight: 1.6, margin: 0 }}>
              After the challenge, carbohydrate flexibility increases inside the 6-Week Blueprint.
            </p>
          </div>
        </div>

        {/* Daily Rhythm */}
        <div style={{ marginBottom: '48px' }}>
          <p style={{ ...label, marginBottom: '12px' }}>Your Daily Nutrition Rhythm</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {[
              { time: 'Morning', content: 'Eggs + avocado + ghee coffee', note: 'Salt + water before anything else' },
              { time: 'Pre-Workout', content: 'Salt + water', note: 'Add fruit or honey if needed' },
              { time: 'Intra-Workout', content: 'Water + electrolytes', note: null },
              { time: 'Post-Workout Shake', content: 'Whey + honey or banana', note: null },
              { time: 'Post-Workout Meal', content: 'Protein + clean carbs', note: 'Example: Beef with rice or potato' },
              { time: 'Evening Meal', content: 'Protein + fats', note: 'Example: Salmon + avocado + optional greens' },
            ].map((m, i) => (
              <div key={m.time} style={{ display: 'flex', gap: '0' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginRight: '14px' }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#14b8a6', border: '2px solid #0c0a09', flexShrink: 0, marginTop: '6px' }} />
                  {i < 5 && <div style={{ width: '2px', flex: 1, background: '#1c1917', minHeight: '20px' }} />}
                </div>
                <div style={{ ...card, marginBottom: '0', flex: 1 }}>
                  <p style={{ fontSize: '12px', fontWeight: 700, color: '#14b8a6', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '3px' }}>{m.time}</p>
                  <p style={{ fontSize: '14px', color: '#ffffff', margin: '0 0 2px', fontWeight: 600 }}>{m.content}</p>
                  {m.note && <p style={{ fontSize: '12px', color: '#57534e', margin: 0 }}>{m.note}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Meal Builder */}
        <div style={{ marginBottom: '48px' }}>
          <p style={{ ...label, marginBottom: '12px' }}>Meal Builder</p>
          <p style={{ fontSize: '14px', color: '#78716c', marginBottom: '16px' }}>Every meal follows a simple structure.</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
            {[
              { num: '1', title: 'Protein (base)', items: 'Beef, chicken, eggs, seafood, pork, lamb' },
              { num: '2', title: 'Healthy fats', items: 'Butter, ghee, coconut oil, cheese, avocado, egg yolks' },
              { num: '3', title: 'Carbohydrates', items: 'Fruit daily. Clean carbs post-training only.' },
              { num: '4', title: 'Optional extras', items: 'Salt, herbs, spices, bone broth' },
            ].map(m => (
              <div key={m.num} style={{ ...card }}>
                <p style={{ fontSize: '22px', fontWeight: 900, color: '#14b8a6', margin: '0 0 4px' }}>{m.num}</p>
                <p style={{ fontSize: '13px', fontWeight: 700, color: '#ffffff', margin: '0 0 6px' }}>{m.title}</p>
                <p style={{ fontSize: '12px', color: '#57534e', margin: 0, lineHeight: 1.5 }}>{m.items}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Example Meals */}
        <div style={{ marginBottom: '48px' }}>
          <p style={{ ...label, marginBottom: '12px' }}>Example Meals</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {[
              {
                meal: 'Breakfast', items: [
                  'Eggs cooked in butter + avocado',
                  'Cottage cheese + berries',
                  'Greek yoghurt + honey (on training days)',
                ]
              },
              {
                meal: 'Lunch or Dinner', items: [
                  'Beef mince + avocado',
                  'Chicken thighs + butter cooked greens',
                  'Steak + fruit',
                  'Salmon + cucumber + avocado',
                ]
              },
              {
                meal: 'Training Day', items: [
                  'Beef + rice',
                  'Chicken + potato',
                  'Whey + honey immediately post workout',
                ]
              },
            ].map(e => (
              <div key={e.meal} style={card}>
                <p style={{ fontSize: '13px', fontWeight: 700, color: '#14b8a6', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px' }}>{e.meal}</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {e.items.map(i => (
                    <div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#2a2826', flexShrink: 0 }} />
                      <p style={{ fontSize: '14px', color: '#d4cfc9', margin: 0 }}>{i}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Hydration */}
        <div style={{ marginBottom: '48px' }}>
          <p style={{ ...label, marginBottom: '12px' }}>Hydration and Electrolytes</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div style={card}>
              <p style={{ fontSize: '13px', fontWeight: 700, color: '#14b8a6', marginBottom: '10px' }}>Daily targets</p>
              {['2-3 litres of water', 'Salt in morning water', 'Electrolytes during training', 'Avoid sugary sports drinks'].map(i => (
                <p key={i} style={{ fontSize: '13px', color: '#a8a29e', margin: '0 0 5px', lineHeight: 1.4 }}>· {i}</p>
              ))}
            </div>
            <div style={card}>
              <p style={{ fontSize: '13px', fontWeight: 700, color: '#14b8a6', marginBottom: '10px' }}>Why salt matters</p>
              {['Better focus', 'Better pump', 'Better energy', 'Less fatigue'].map(i => (
                <p key={i} style={{ fontSize: '13px', color: '#a8a29e', margin: '0 0 5px', lineHeight: 1.4 }}>· {i}</p>
              ))}
            </div>
          </div>
        </div>

        {/* Supplements */}
        <div style={{ marginBottom: '48px' }}>
          <p style={{ ...label, marginBottom: '12px' }}>Supplements (Optional)</p>
          <div style={{ ...card }}>
            <p style={{ fontSize: '14px', color: '#78716c', marginBottom: '14px' }}>Supplements support consistency. They do not replace food.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[
                { name: 'Electrolytes', note: 'Daily' },
                { name: 'Whey protein', note: 'Post-workout' },
                { name: 'FocusFuel', note: 'Pre-workout' },
                { name: 'Creatine', note: 'Optional' },
                { name: 'Magnesium', note: 'At night' },
              ].map(s => (
                <div key={s.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <p style={{ fontSize: '14px', color: '#d4cfc9', margin: 0 }}>{s.name}</p>
                  <span style={{ fontSize: '12px', color: '#57534e', background: '#1c1917', padding: '2px 10px', borderRadius: '99px' }}>{s.note}</span>
                </div>
              ))}
            </div>
            <p style={{ fontSize: '13px', color: '#57534e', marginTop: '16px', marginBottom: 0, fontStyle: 'italic' }}>All optional. Not required to succeed.</p>
          </div>
        </div>

        {/* Shopping List */}
        <div>
          <p style={{ ...label, marginBottom: '12px' }}>Shopping List</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {[
              { cat: 'Proteins', items: 'Beef, chicken, eggs, pork, lamb, turkey, seafood, yoghurt, cottage cheese' },
              { cat: 'Healthy Fats', items: 'Butter, ghee, coconut oil, avocado, cheese, egg yolks' },
              { cat: 'Fruit', items: 'Bananas, berries, pineapple, apples, pears, grapes' },
              { cat: 'Clean Carbs (Post-Training Only)', items: 'White rice, potatoes, sweet potatoes, honey' },
              { cat: 'Hydration', items: 'Electrolytes, salt, sparkling water' },
              { cat: 'Optional Extras', items: 'Bone broth, herbs, spices' },
            ].map(s => (
              <div key={s.cat} style={{ ...card, display: 'flex', gap: '16px' }}>
                <div style={{
                  width: '24px', height: '24px', borderRadius: '6px', flexShrink: 0,
                  background: 'rgba(20,184,166,0.1)', border: '1px solid rgba(20,184,166,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#14b8a6" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <div>
                  <p style={{ fontSize: '13px', fontWeight: 700, color: '#14b8a6', margin: '0 0 3px' }}>{s.cat}</p>
                  <p style={{ fontSize: '13px', color: '#78716c', margin: 0, lineHeight: 1.5 }}>{s.items}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
