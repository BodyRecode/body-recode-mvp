'use client'

import { brand } from "@/config/tenant";

export default function ScorecardPreview() {
  const sections = [
    {
      number: '01',
      title: 'Energy',
      rows: [
        { score: 1, desc: 'Tired most of the day. Relying on caffeine. Crashes after lunch or training.' },
        { score: 2, desc: 'Inconsistent. Some good days, some bad. Not reliable.' },
        { score: 3, desc: 'Steady energy through the day. Don\'t need caffeine to function.' },
      ],
    },
    {
      number: '02',
      title: 'Sleep',
      rows: [
        { score: 1, desc: 'Poor quality. Waking through the night. Don\'t feel rested in the morning.' },
        { score: 2, desc: 'Okay most nights but not consistently recovering.' },
        { score: 3, desc: 'Sleeping well. Waking rested. Recovery feels solid.' },
      ],
    },
    {
      number: '03',
      title: 'Stress Load',
      rows: [
        { score: 1, desc: 'High stress. Work, life, or emotional load is significant and ongoing.' },
        { score: 2, desc: 'Moderate. Manageable most of the time but not low.' },
        { score: 3, desc: 'Low to moderate. Not carrying a heavy chronic stress load right now.' },
      ],
    },
    {
      number: '04',
      title: 'Training Response',
      rows: [
        { score: 1, desc: 'Not progressing. Performance is flat or declining. Body feels beaten up.' },
        { score: 2, desc: 'Some progress but inconsistent. Hard to build momentum.' },
        { score: 3, desc: 'Responding well. Getting stronger, fitter, recovering between sessions.' },
      ],
    },
    {
      number: '05',
      title: 'Fat Loss Response',
      rows: [
        { score: 1, desc: 'Nothing is moving despite effort. Diet is clean, training is consistent. No result.' },
        { score: 2, desc: 'Slow or stalled. Some movement but not matching the input.' },
        { score: 3, desc: 'Body is responding. Composition is shifting in the right direction.' },
      ],
    },
  ]

  const results = [
    {
      range: '5 – 8',
      label: 'Depleted State',
      color: '#DC2626',
      desc: 'Your body is in protection mode. Cortisol is elevated, metabolism is suppressed, and your biology is actively resisting fat loss and performance gains. Pushing harder with more training and less food will make this worse. Your body needs to be brought out of this state first. Prescription without interpretation is the reason you\'re stuck.',
    },
    {
      range: '9 – 11',
      label: 'Transitioning State',
      color: '#B7791F',
      desc: 'Mixed signals. Your body has capacity but it\'s not consistent. Something is limiting your response: sleep, stress, recovery, or a mismatch between your training load and your current biological state. You\'re close, but you need to identify the specific bottleneck before adding more input.',
    },
    {
      range: '12 – 15',
      label: 'Ready State',
      color: '#1B6DFC',
      desc: 'Your biology is in a position to respond. If fat loss or performance isn\'t happening at this score, the issue is in the prescription. Training, nutrition, or both need to be adjusted. You have the foundation. Now it needs to be optimised.',
    },
  ]

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Inter', sans-serif; background: #fafaf9; }
        @media print {
          body { background: white; }
          .no-print { display: none !important; }
          .page { box-shadow: none !important; margin: 0 !important; border-radius: 0 !important; }
        }
      `}</style>

      {/* Print button */}
      <div className="no-print" style={{ background: '#FFFFFF', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ color: '#6B6B6B', fontSize: '13px' }}>Scorecard Preview / {brand().name}</span>
        <button
          onClick={() => window.print()}
          style={{ background: '#1B6DFC', color: '#FFFFFF', fontWeight: 700, fontSize: '13px', padding: '8px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer' }}
        >
          Save as PDF
        </button>
      </div>

      {/* Page */}
      <div className="page" style={{ maxWidth: '794px', margin: '40px auto 80px', background: '#FFFFFF', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 25px 60px rgba(0,0,0,0.3)', color: 'white' }}>

        {/* Header */}
        <div style={{ background: '#FFFFFF', borderBottom: '1px solid #E5E5E5', padding: '56px 64px 48px' }}>
          <img src="/logo-black.png" alt={brand().name} style={{ height: '52px', marginBottom: '40px', display: 'block' }} />
          <div style={{ width: '40px', height: '3px', background: '#1B6DFC', marginBottom: '24px' }} />
          <h1 style={{ fontSize: '42px', fontWeight: 900, color: '#ffffff', letterSpacing: '-0.03em', lineHeight: 1.1, marginBottom: '16px' }}>
            The Body State<br />Scorecard
          </h1>
          <p style={{ fontSize: '16px', color: '#6B6B6B', lineHeight: 1.6, maxWidth: '480px' }}>
            Find out why your body isn&apos;t responding. Takes 2 minutes.<br />
            Score each section 1, 2, or 3. Add up your total at the end.
          </p>
        </div>

        {/* Sections */}
        <div style={{ padding: '0 64px' }}>
          {sections.map((section, i) => (
            <div key={section.number} style={{ borderBottom: i < sections.length - 1 ? '1px solid #E5E5E5' : 'none', padding: '36px 0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#1B6DFC', letterSpacing: '0.12em', textTransform: 'uppercase' }}>{section.number}</span>
                <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#ffffff', letterSpacing: '-0.01em' }}>{section.title}</h2>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {section.rows.map(row => (
                  <div key={row.score} style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', background: '#FFFFFF', borderRadius: '10px', padding: '14px 18px' }}>
                    {/* Score circle */}
                    <div style={{
                      width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0,
                      background: row.score === 1 ? 'rgba(239,68,68,0.12)' : row.score === 2 ? 'rgba(245,158,11,0.12)' : 'rgba(27,109,252,0.12)',
                      border: `1.5px solid ${row.score === 1 ? 'rgba(239,68,68,0.3)' : row.score === 2 ? 'rgba(245,158,11,0.3)' : 'rgba(27,109,252,0.3)'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '12px', fontWeight: 700,
                      color: row.score === 1 ? '#DC2626' : row.score === 2 ? '#B7791F' : '#1B6DFC',
                      marginTop: '1px',
                    }}>
                      {row.score}
                    </div>
                    <p style={{ fontSize: '14px', color: '#3A3A3A', lineHeight: 1.55, flex: 1 }}>{row.desc}</p>
                    {/* Checkbox */}
                    <div style={{ width: '20px', height: '20px', borderRadius: '4px', border: '1.5px solid #2c2826', flexShrink: 0, marginTop: '3px' }} />
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '16px' }}>
                <span style={{ fontSize: '12px', color: '#6B6B6B', fontWeight: 500 }}>My score</span>
                <div style={{ width: '48px', height: '1.5px', background: '#2c2826' }} />
                <div style={{ width: '32px', height: '32px', borderRadius: '6px', border: '1.5px solid #2c2826' }} />
              </div>
            </div>
          ))}
        </div>

        {/* Total */}
        <div style={{ margin: '0 64px', padding: '28px 32px', background: '#FFFFFF', border: '1px solid #E5E5E5', borderRadius: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ fontSize: '11px', fontWeight: 700, color: '#999999', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '6px' }}>Total Score</p>
              <p style={{ fontSize: '13px', color: '#6B6B6B' }}>Add up your five scores above</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '56px', height: '40px', borderRadius: '8px', border: '1.5px solid #2c2826' }} />
              <span style={{ fontSize: '16px', color: '#999999', fontWeight: 600 }}>/&nbsp;15</span>
            </div>
          </div>
        </div>

        {/* Results */}
        <div style={{ padding: '48px 64px 0' }}>
          <div style={{ width: '32px', height: '3px', background: '#1B6DFC', marginBottom: '24px' }} />
          <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em', marginBottom: '24px' }}>Your Result</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {results.map(r => (
              <div key={r.range} style={{ background: '#FFFFFF', border: '1px solid #E5E5E5', borderRadius: '12px', padding: '24px 28px', borderLeft: `3px solid ${r.color}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '10px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: r.color, fontFamily: 'monospace' }}>{r.range}</span>
                  <span style={{ fontSize: '15px', fontWeight: 700, color: '#ffffff' }}>{r.label}</span>
                </div>
                <p style={{ fontSize: '13px', color: '#6B6B6B', lineHeight: 1.7 }}>{r.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Footer */}
        <div style={{ margin: '48px 64px 64px', background: '#B5CFFC', border: '1px solid #1B6DFC', borderRadius: '14px', padding: '36px 40px' }}>
          <p style={{ fontSize: '18px', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em', marginBottom: '12px', lineHeight: 1.3 }}>
            Whatever your score, the next step is the same.
          </p>
          <p style={{ fontSize: '14px', color: '#99d6d0', lineHeight: 1.7, marginBottom: '24px' }}>
            A Performance Check-In gives you a full interpretation of your body state, not a generic program. It&apos;s 20 minutes. It&apos;s free. And it tells you exactly what your body needs right now.
          </p>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', background: '#1B6DFC', color: '#FFFFFF', fontWeight: 700, fontSize: '14px', padding: '12px 28px', borderRadius: '8px' }}>
            Book your Performance Check-In →
          </div>
        </div>

      </div>
    </>
  )
}
