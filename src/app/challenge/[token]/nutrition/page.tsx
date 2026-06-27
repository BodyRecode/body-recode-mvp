import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'

const card: React.CSSProperties = {
  background: '#FFFFFF', border: '1px solid #E5E5E5', borderRadius: '12px', padding: '20px 22px',
}

const label: React.CSSProperties = {
  fontSize: '11px', fontWeight: 700, color: '#1B6DFC',
  letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '4px',
}

const sectionTitle: React.CSSProperties = {
  fontSize: '26px', fontWeight: 800, color: '#1A1A1A', letterSpacing: '-0.025em', margin: '6px 0 0', lineHeight: 1.2,
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
      minHeight: '100vh', background: '#FFFFFF', color: '#1A1A1A',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    }}>
      {/* Header */}
      <div style={{ borderBottom: '1px solid #E5E5E5', padding: '18px 24px', background: '#FFFFFF' }}>
        <div style={{ maxWidth: '640px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <img src="https://bodyrecode.au/logo-black.png" width="160" alt="Body Recode" style={{ display: 'block' }} />
          <Link href={`/challenge/${token}`} style={{ fontSize: '13px', color: '#1B6DFC', textDecoration: 'none', fontWeight: 500 }}>
            Back to portal
          </Link>
        </div>
      </div>

      {/* Hero with Signal Blue radial glow — matches /challenge + training page */}
      <div style={{ position: 'relative', overflow: 'hidden' }}>
        <div style={{
          position: 'absolute', top: '-140px', right: '-140px',
          width: '480px', height: '480px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(27, 109, 252, 0.12) 0%, transparent 65%)',
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', bottom: '0', left: '-100px',
          width: '320px', height: '320px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(27, 109, 252, 0.06) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <div style={{ maxWidth: '640px', margin: '0 auto', padding: '56px 24px 32px', position: 'relative' }}>
          <p style={label}>14-Day Body Decode Challenge</p>
          <h1 style={{
            fontSize: 'clamp(34px, 6vw, 44px)', fontWeight: 900,
            letterSpacing: '-0.03em', margin: '8px 0 18px', color: '#1A1A1A', lineHeight: 1.05,
          }}>
            Nutrition Guide
          </h1>
          <div style={{ width: '48px', height: '3px', background: '#1B6DFC', borderRadius: '2px', marginBottom: '24px' }} />
          <p style={{ fontSize: '16px', color: '#4A4A4A', lineHeight: 1.75, margin: 0 }}>
            This is not a diet. It is a metabolic reset. The goal of the next 14 days is to calm inflammation, stabilise blood sugar, and restore your body&apos;s ability to use fat for fuel. Simple food, eaten at the right times.
          </p>
        </div>
      </div>

      <div style={{ maxWidth: '640px', margin: '0 auto', padding: '24px 24px 80px' }}>

        {/* HABNS System */}
        <div style={{ marginBottom: '48px' }}>
          <p style={label}>The System</p>
          <p style={sectionTitle}>Hybrid Animal-Based Nutrition System</p>
          <div style={{
            background: 'rgba(27,109,252,0.07)', border: '1px solid rgba(27,109,252,0.2)',
            borderRadius: '12px', padding: '22px', marginTop: '16px', marginBottom: '16px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <span style={{
                fontSize: '11px', fontWeight: 800, color: '#ffffff',
                background: '#1B6DFC', padding: '3px 10px', borderRadius: '99px', letterSpacing: '0.08em',
              }}>HABNS</span>
            </div>
            <p style={{ fontSize: '15px', color: '#3A3A3A', lineHeight: 1.75, margin: 0 }}>
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
                <p style={{ fontSize: '13px', color: '#6B6B6B', margin: 0, lineHeight: 1.55 }}>{p.text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* What to eat */}
        <div style={{ marginBottom: '48px' }}>
          <p style={label}>Animal-Based Foundation Foods</p>
          <p style={sectionTitle}>What to eat</p>
          <p style={{ fontSize: '14px', color: '#6B6B6B', marginTop: '8px', marginBottom: '16px', lineHeight: 1.6 }}>
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
                  <p style={{ fontSize: '14px', fontWeight: 700, color: '#1B6DFC', margin: 0 }}>{f.cat}</p>
                  <span style={{ fontSize: '11px', color: '#6B6B6B', background: '#E5E5E5', padding: '2px 8px', borderRadius: '99px', whiteSpace: 'nowrap' as const, marginLeft: '10px' }}>{f.note}</span>
                </div>
                <p style={{ fontSize: '13px', color: '#999999', margin: 0, lineHeight: 1.55 }}>{f.items}</p>
              </div>
            ))}
          </div>
        </div>

        {/* What to avoid */}
        <div style={{ marginBottom: '48px' }}>
          <p style={label}>For These 14 Days</p>
          <p style={sectionTitle}>What to remove</p>
          <p style={{ fontSize: '14px', color: '#6B6B6B', marginTop: '8px', marginBottom: '16px', lineHeight: 1.6 }}>
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
                <svg style={{ flexShrink: 0, marginTop: '2px' }} width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
                <p style={{ fontSize: '13px', color: '#6B6B6B', margin: 0, lineHeight: 1.5 }}>{item}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Carb Strategy */}
        <div style={{ marginBottom: '48px' }}>
          <p style={label}>Carbohydrate Strategy</p>
          <p style={sectionTitle}>Timing is everything</p>
          <p style={{ fontSize: '14px', color: '#6B6B6B', marginTop: '8px', marginBottom: '16px', lineHeight: 1.6 }}>
            Clean carbohydrates are only eaten in the window around your training sessions. Outside of training, fat is your fuel.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
            {[
              { window: 'Rest days', rule: 'Protein + fat + fruit only. No starchy carbs.' },
              { window: 'Pre-training', rule: 'Small amount of fruit or honey if needed.' },
              { window: 'Post-training', rule: 'Protein + clean starchy carbs within 1 hour.' },
            ].map(w => (
              <div key={w.window} style={{ ...card, display: 'flex', gap: '0', alignItems: 'stretch', padding: 0, overflow: 'hidden' }}>
                <div style={{ background: 'rgba(27,109,252,0.08)', borderRight: '1px solid #E5E5E5', padding: '14px 16px', minWidth: '120px', display: 'flex', alignItems: 'center' }}>
                  <p style={{ fontSize: '12px', fontWeight: 700, color: '#1B6DFC', margin: 0, textTransform: 'uppercase' as const, letterSpacing: '0.06em' }}>{w.window}</p>
                </div>
                <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center' }}>
                  <p style={{ fontSize: '13px', color: '#3A3A3A', margin: 0, lineHeight: 1.5 }}>{w.rule}</p>
                </div>
              </div>
            ))}
          </div>
          <div style={{ marginBottom: '12px' }}>
            <p style={{ fontSize: '13px', fontWeight: 700, color: '#6B6B6B', textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: '10px' }}>Post-training carb options</p>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' as const }}>
              {['White rice', 'Potatoes', 'Sweet potato', 'Banana', 'Honey', 'Berries', 'Pineapple'].map(c => (
                <span key={c} style={{
                  fontSize: '13px', fontWeight: 600, color: '#1A1A1A',
                  background: '#F5F5F5', border: '1px solid #E5E5E5',
                  borderRadius: '6px', padding: '5px 12px',
                }}>{c}</span>
              ))}
            </div>
          </div>
          <div style={{ ...card, background: 'rgba(27,109,252,0.07)', border: '1px solid rgba(27,109,252,0.25)', borderLeft: '3px solid #1B6DFC' }}>
            <p style={{ fontSize: '10px', fontWeight: 700, color: '#1056D6', letterSpacing: '0.12em', textTransform: 'uppercase' as const, margin: '0 0 8px' }}>
              Why this works
            </p>
            <p style={{ fontSize: '14px', color: '#1A1A1A', lineHeight: 1.7, margin: 0 }}>
              This approach resets insulin sensitivity, reduces inflammation, and teaches your body to use stored fat for energy. After the challenge, carbohydrate flexibility increases inside the <strong style={{ fontWeight: 700 }}>6-Week Blueprint</strong>.
            </p>
          </div>
        </div>

        {/* Daily Rhythm — peri-workout protocol moves with your training time */}
        <div style={{ marginBottom: '48px' }}>
          <p style={label}>Daily Rhythm</p>
          <p style={sectionTitle}>How a full day looks</p>
          <p style={{ fontSize: '14px', color: '#6B6B6B', marginTop: '8px', marginBottom: '24px', lineHeight: 1.6 }}>
            The peri-workout protocol travels with your training time. The rest of your day is anchor meals — protein and fat at the times that fit your life.
          </p>

          {/* Block 1: The Peri-Workout Protocol */}
          <div style={{ marginBottom: '36px' }}>
            <p style={{ fontSize: '10px', fontWeight: 700, color: '#1056D6', letterSpacing: '0.12em', textTransform: 'uppercase' as const, margin: '0 0 14px' }}>
              The peri-workout protocol
            </p>
            <p style={{ fontSize: '14px', color: '#4A4A4A', marginBottom: '14px', lineHeight: 1.6 }}>
              Four steps that always wrap around training — whenever training happens.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[
                { num: '01', when: 'Pre', timing: '30-60 min before training', what: 'Salt + water. Add fruit or honey if you need a boost.' },
                { num: '02', when: 'During', timing: 'Throughout the session', what: 'Water + electrolytes.' },
                { num: '03', when: 'Post', timing: 'Within 30 minutes', what: 'Whey + fruit. Start the recovery window.' },
                { num: '04', when: 'Post-training meal', timing: '1-2 hours after training', what: 'Protein + clean carbs. Beef + rice, chicken + potato, ground turkey + sweet potato.' },
              ].map(p => (
                <div key={p.num} style={{
                  background: '#FFFFFF', border: '1px solid #E5E5E5', borderLeft: '3px solid #1B6DFC',
                  borderRadius: '12px', padding: '16px 20px', display: 'flex', gap: '14px', alignItems: 'flex-start',
                  boxShadow: '0 1px 3px rgba(27, 109, 252, 0.05)',
                }}>
                  <span style={{
                    fontSize: '12px', fontWeight: 800, color: '#1B6DFC',
                    background: 'rgba(27,109,252,0.08)', padding: '4px 10px', borderRadius: '6px',
                    fontFamily: '"Courier New",Consolas,monospace', letterSpacing: '0.04em',
                    minWidth: '34px', textAlign: 'center' as const, flexShrink: 0, marginTop: '2px',
                  }}>{p.num}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', flexWrap: 'wrap' as const, marginBottom: '4px' }}>
                      <p style={{ fontSize: '16px', fontWeight: 800, color: '#1A1A1A', margin: 0, letterSpacing: '-0.01em' }}>{p.when}</p>
                      <span style={{ fontSize: '12px', color: '#6B6B6B', fontWeight: 600 }}>{p.timing}</span>
                    </div>
                    <p style={{ fontSize: '13px', color: '#4A4A4A', margin: 0, lineHeight: 1.65 }}>{p.what}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Block 2: Daily Anchors */}
          <div style={{ marginBottom: '36px' }}>
            <p style={{ fontSize: '10px', fontWeight: 700, color: '#6B6B6B', letterSpacing: '0.12em', textTransform: 'uppercase' as const, margin: '0 0 14px' }}>
              Your daily anchors
            </p>
            <p style={{ fontSize: '14px', color: '#4A4A4A', marginBottom: '14px', lineHeight: 1.6 }}>
              The rest of the day. Protein and fat at the times that fit your schedule. Wherever your training sits, the protocol slots in around these.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[
                { time: 'On waking', what: '500ml water + pinch of salt', note: 'Before anything else. Rehydrate first.' },
                { time: 'Breakfast', what: 'Protein + fat', note: 'Eggs in butter + avocado, or yoghurt + berries.' },
                { time: 'Lunch', what: 'Protein + fat', note: 'Beef mince + avocado, salmon + cucumber, chicken thighs + butter.' },
                { time: 'Dinner', what: 'Protein + fat', note: 'Salmon + avocado, eggs + ghee, steak + butter.' },
              ].map(m => (
                <div key={m.time} style={{ ...card, padding: '14px 18px' }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', flexWrap: 'wrap' as const, marginBottom: '3px' }}>
                    <p style={{ fontSize: '14px', fontWeight: 700, color: '#1A1A1A', margin: 0 }}>{m.time}</p>
                    <span style={{ fontSize: '13px', color: '#1056D6', fontWeight: 600 }}>{m.what}</span>
                  </div>
                  <p style={{ fontSize: '12px', color: '#6B6B6B', margin: 0, lineHeight: 1.55 }}>{m.note}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Block 3: Three Example Days */}
          <div>
            <p style={{ fontSize: '10px', fontWeight: 700, color: '#1056D6', letterSpacing: '0.12em', textTransform: 'uppercase' as const, margin: '0 0 14px' }}>
              How it slots in
            </p>
            <p style={{ fontSize: '14px', color: '#4A4A4A', marginBottom: '20px', lineHeight: 1.6 }}>
              Three example days. The same four-step protocol moves to wrap your training. Find the one that fits your schedule.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {[
                {
                  label: 'Morning trainer',
                  sub: 'Training ~6am, pre-breakfast',
                  timeline: [
                    { time: '5:30am', text: 'Water + salt', kind: 'anchor' as const },
                    { time: '5:45am', text: 'Pre — salt + water (+ fruit if needed)', kind: 'peri' as const },
                    { time: '6-7am', text: 'During — water + electrolytes', kind: 'peri' as const },
                    { time: '7am', text: 'Post — whey + fruit', kind: 'peri' as const },
                    { time: '8:30am', text: 'Breakfast / post-training meal — protein + clean carbs (beef + rice)', kind: 'peri-meal' as const },
                    { time: '1pm', text: 'Lunch — protein + fat', kind: 'anchor' as const },
                    { time: '7pm', text: 'Dinner — protein + fat', kind: 'anchor' as const },
                  ],
                },
                {
                  label: 'Midday trainer',
                  sub: 'Training ~12pm, between meals',
                  timeline: [
                    { time: '7am', text: 'Water + salt', kind: 'anchor' as const },
                    { time: '8am', text: 'Breakfast — protein + fat', kind: 'anchor' as const },
                    { time: '11:30am', text: 'Pre — salt + water (+ fruit if needed)', kind: 'peri' as const },
                    { time: '12-1pm', text: 'During — water + electrolytes', kind: 'peri' as const },
                    { time: '1pm', text: 'Post — whey + fruit', kind: 'peri' as const },
                    { time: '2pm', text: 'Lunch / post-training meal — protein + clean carbs (chicken + potato)', kind: 'peri-meal' as const },
                    { time: '7pm', text: 'Dinner — protein + fat', kind: 'anchor' as const },
                  ],
                },
                {
                  label: 'Evening trainer',
                  sub: 'Training ~5pm, after work',
                  timeline: [
                    { time: '7am', text: 'Water + salt', kind: 'anchor' as const },
                    { time: '8am', text: 'Breakfast — protein + fat', kind: 'anchor' as const },
                    { time: '12pm', text: 'Lunch — protein + fat', kind: 'anchor' as const },
                    { time: '4:30pm', text: 'Pre — salt + water (+ fruit if needed)', kind: 'peri' as const },
                    { time: '5-6pm', text: 'During — water + electrolytes', kind: 'peri' as const },
                    { time: '6pm', text: 'Post — whey + fruit', kind: 'peri' as const },
                    { time: '7:30pm', text: 'Dinner / post-training meal — protein + clean carbs (turkey + sweet potato)', kind: 'peri-meal' as const },
                  ],
                },
              ].map(day => (
                <div key={day.label} style={{
                  background: '#FFFFFF', border: '1px solid #E5E5E5',
                  borderRadius: '14px', padding: '20px 22px',
                }}>
                  <div style={{ marginBottom: '14px' }}>
                    <p style={{ fontSize: '15px', fontWeight: 800, color: '#1A1A1A', margin: '0 0 2px', letterSpacing: '-0.01em' }}>{day.label}</p>
                    <p style={{ fontSize: '12px', color: '#6B6B6B', margin: 0 }}>{day.sub}</p>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {day.timeline.map((row) => {
                      const isPeri = row.kind === 'peri' || row.kind === 'peri-meal'
                      return (
                        <div key={row.time + row.text} style={{
                          display: 'flex', gap: '12px', alignItems: 'flex-start',
                          padding: '10px 12px', borderRadius: '8px',
                          background: isPeri ? 'rgba(27,109,252,0.06)' : '#F7F7F7',
                          border: isPeri ? '1px solid rgba(27,109,252,0.18)' : '1px solid #E5E5E5',
                        }}>
                          <span style={{
                            fontSize: '11px', fontWeight: 700,
                            color: isPeri ? '#1056D6' : '#6B6B6B',
                            minWidth: '64px', flexShrink: 0,
                            fontFamily: '"Courier New",Consolas,monospace',
                            paddingTop: '1px',
                          }}>{row.time}</span>
                          <p style={{
                            fontSize: '13px',
                            color: isPeri ? '#1A1A1A' : '#3A3A3A',
                            fontWeight: isPeri ? 600 : 500,
                            margin: 0, lineHeight: 1.5, flex: 1,
                          }}>{row.text}</p>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Rest day reminder */}
            <div style={{
              ...card, marginTop: '16px',
              background: '#F7F7F7', borderLeft: '3px solid #6B6B6B',
            }}>
              <p style={{ fontSize: '10px', fontWeight: 700, color: '#6B6B6B', letterSpacing: '0.12em', textTransform: 'uppercase' as const, margin: '0 0 8px' }}>
                Rest days
              </p>
              <p style={{ fontSize: '14px', color: '#1A1A1A', lineHeight: 1.7, margin: 0 }}>
                Drop the peri-workout protocol entirely. Anchor meals only — protein, fat, and fruit. No starchy carbs.
              </p>
            </div>
          </div>

        </div>

        {/* Meal Builder */}
        <div style={{ marginBottom: '48px' }}>
          <p style={label}>Meal Builder</p>
          <p style={sectionTitle}>Build every meal the same way</p>
          <p style={{ fontSize: '14px', color: '#6B6B6B', marginTop: '8px', marginBottom: '16px', lineHeight: 1.6 }}>
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
                <p style={{ fontSize: '24px', fontWeight: 900, color: '#1B6DFC', margin: '0 0 2px', letterSpacing: '-0.02em' }}>{m.num}</p>
                <p style={{ fontSize: '14px', fontWeight: 700, color: '#1A1A1A', margin: '0 0 2px' }}>{m.title}</p>
                <p style={{ fontSize: '11px', color: '#6B6B6B', textTransform: 'uppercase' as const, letterSpacing: '0.06em', margin: '0 0 8px' }}>{m.sub}</p>
                <p style={{ fontSize: '12px', color: '#6B6B6B', margin: 0, lineHeight: 1.55 }}>{m.items}</p>
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
                  <p style={{ fontSize: '14px', fontWeight: 700, color: '#1A1A1A', margin: 0 }}>{e.meal}</p>
                  <span style={{ fontSize: '11px', color: '#6B6B6B', background: '#E5E5E5', padding: '2px 8px', borderRadius: '99px' }}>{e.tag}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {e.items.map(item => (
                    <div key={item} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                      <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#1B6DFC', flexShrink: 0, marginTop: '7px' }} />
                      <p style={{ fontSize: '13px', color: '#6B6B6B', margin: 0, lineHeight: 1.55 }}>{item}</p>
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
          <p style={{ fontSize: '14px', color: '#6B6B6B', marginTop: '8px', marginBottom: '16px', lineHeight: 1.6 }}>
            Most people are chronically under-hydrated and low on electrolytes. Fixing this alone improves energy, focus, and training performance.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div style={card}>
              <p style={{ fontSize: '13px', fontWeight: 700, color: '#1B6DFC', marginBottom: '12px' }}>Daily targets</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {[
                  '2-3 litres of water daily',
                  'Pinch of salt in morning water',
                  'Electrolytes during training',
                  'No flavoured drinks or juice',
                  'Coffee is fine, just not first thing',
                ].map(i => (
                  <div key={i} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                    <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#1B6DFC', flexShrink: 0, marginTop: '6px' }} />
                    <p style={{ fontSize: '13px', color: '#999999', margin: 0, lineHeight: 1.45 }}>{i}</p>
                  </div>
                ))}
              </div>
            </div>
            <div style={card}>
              <p style={{ fontSize: '13px', fontWeight: 700, color: '#1B6DFC', marginBottom: '12px' }}>Why salt matters</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {[
                  'Sharper mental clarity',
                  'Better muscle pump',
                  'More stable energy',
                  'Less post-training fatigue',
                  'Better cortisol regulation',
                ].map(i => (
                  <div key={i} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                    <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#1B6DFC', flexShrink: 0, marginTop: '6px' }} />
                    <p style={{ fontSize: '13px', color: '#999999', margin: 0, lineHeight: 1.45 }}>{i}</p>
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
          <p style={{ fontSize: '14px', color: '#6B6B6B', marginTop: '8px', marginBottom: '16px', lineHeight: 1.6 }}>
            All optional. Supplements support consistency - they do not replace food quality.
          </p>
          <div style={card}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
              {[
                { name: 'Electrolytes', timing: 'Daily', note: 'Especially important on training days and in the morning' },
                { name: 'Whey protein', timing: 'Post-training', note: 'Fast-digesting protein to kickstart recovery' },
                { name: 'FocusFuel', timing: 'Pre-training', note: 'Clean energy without seed oils or artificial sweeteners', comingSoon: true },
                { name: 'Creatine', timing: 'Daily', note: '5g per day. Supports performance and recovery' },
                { name: 'Magnesium', timing: 'Evening', note: 'Supports sleep quality and muscle recovery' },
              ].map((s, i) => (
                <div key={s.name} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                  paddingTop: i === 0 ? '0' : '14px',
                  paddingBottom: '14px',
                  borderBottom: i < 4 ? '1px solid #E5E5E5' : 'none',
                  opacity: s.comingSoon ? 0.75 : 1,
                }}>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: '14px', fontWeight: 600, color: '#1A1A1A', margin: '0 0 3px' }}>{s.name}</p>
                    <p style={{ fontSize: '12px', color: '#6B6B6B', margin: 0, lineHeight: 1.4 }}>{s.note}</p>
                  </div>
                  {s.comingSoon ? (
                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#B7791F', background: 'rgba(217,119,6,0.08)', border: '1px solid rgba(217,119,6,0.25)', padding: '3px 10px', borderRadius: '99px', marginLeft: '16px', whiteSpace: 'nowrap' as const, letterSpacing: '0.04em', textTransform: 'uppercase' as const }}>Coming soon</span>
                  ) : (
                    <span style={{ fontSize: '11px', color: '#1B6DFC', background: 'rgba(27,109,252,0.08)', border: '1px solid rgba(27,109,252,0.2)', padding: '3px 10px', borderRadius: '99px', marginLeft: '16px', whiteSpace: 'nowrap' as const }}>{s.timing}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Shopping List */}
        <div>
          <p style={label}>Shopping List</p>
          <p style={sectionTitle}>Everything you need</p>
          <p style={{ fontSize: '14px', color: '#6B6B6B', marginTop: '8px', marginBottom: '16px', lineHeight: 1.6 }}>
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
                    background: '#1B6DFC', flexShrink: 0, marginTop: '6px',
                  }} />
                  <div>
                    <p style={{ fontSize: '13px', fontWeight: 700, color: '#1B6DFC', margin: '0 0 4px' }}>{s.cat}</p>
                    <p style={{ fontSize: '13px', color: '#6B6B6B', margin: 0, lineHeight: 1.6 }}>{s.items}</p>
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
