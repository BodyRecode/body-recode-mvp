'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function PendingContent() {
  const params = useSearchParams()
  const email = params.get('email') ?? ''

  return (
    <div style={{ minHeight: '100vh', background: '#0c0a09', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
      <div style={{ maxWidth: 520, width: '100%', textAlign: 'center' }}>
        <img src="https://bodyrecode.au/logo-teal.png" width={120} alt="Body Recode" style={{ display: 'block', margin: '0 auto 40px' }} />
        <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#14b8a6', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 32px' }}>
          <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="#0c0a09" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: '#fff', margin: '0 0 16px', fontFamily: 'system-ui, sans-serif' }}>
          Payment confirmed
        </h1>
        <p style={{ fontSize: 15, color: '#888', lineHeight: 1.75, margin: '0 0 12px', fontFamily: 'system-ui, sans-serif' }}>
          Your 6-Week Body Rewire Blueprint is being set up now.
        </p>
        {email && (
          <p style={{ fontSize: 15, color: '#888', lineHeight: 1.75, margin: '0 0 32px', fontFamily: 'system-ui, sans-serif' }}>
            Check <span style={{ color: '#fff' }}>{email}</span> for your portal link. It will arrive within a few minutes.
          </p>
        )}
        <p style={{ fontSize: 13, color: '#555', fontFamily: 'system-ui, sans-serif' }}>
          If you do not receive the email within 10 minutes, check your spam folder or contact kade@bodyrecode.au
        </p>
      </div>
    </div>
  )
}

export default function BlueprintPendingPage() {
  return (
    <Suspense>
      <PendingContent />
    </Suspense>
  )
}
