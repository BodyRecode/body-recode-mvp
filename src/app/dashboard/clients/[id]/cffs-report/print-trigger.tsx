'use client'

import { useEffect } from 'react'

export default function PrintTrigger() {
  useEffect(() => {
    const timer = setTimeout(() => window.print(), 800)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="no-print" style={{ background: '#1A1A1A', padding: '12px 32px', display: 'flex', justifyContent: 'flex-end' }}>
      <button
        onClick={() => window.print()}
        style={{ background: '#10E1C2', color: '#1A1A1A', border: 'none', padding: '10px 28px', fontSize: '13px', fontWeight: 700, fontFamily: 'Montserrat, sans-serif', cursor: 'pointer', letterSpacing: '0.05em', textTransform: 'uppercase' }}
      >
        Download PDF
      </button>
    </div>
  )
}
