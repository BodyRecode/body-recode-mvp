'use client'

import { useState, useTransition } from 'react'
import { unsubscribeAction, resubscribeAction } from './actions'

const BLUE = '#1B6DFC'
const GRAPHITE = '#1A1A1A'
const BODY = '#4A4A4A'
const MUTED = '#6B6B6B'
const HAIRLINE = '#E5E5E5'

export default function UnsubscribeClient({
  token,
  email,
  initiallySuppressed,
}: {
  token: string
  email: string
  initiallySuppressed: boolean
}) {
  const [suppressed, setSuppressed] = useState(initiallySuppressed)
  const [pending, startTransition] = useTransition()
  const [failed, setFailed] = useState(false)

  function run(action: (t: string) => Promise<{ ok: boolean }>, next: boolean) {
    setFailed(false)
    startTransition(async () => {
      const res = await action(token)
      if (res.ok) setSuppressed(next)
      else setFailed(true)
    })
  }

  return (
    <main
      style={{
        minHeight: '100vh',
        background: '#FFFFFF',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif",
      }}
    >
      <div style={{ width: '100%', maxWidth: '480px' }}>
        <p
          style={{
            fontSize: '11px',
            fontWeight: 800,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: MUTED,
            margin: '0 0 10px',
          }}
        >
          Body Recode
        </p>

        {suppressed ? (
          <>
            <h1 style={{ fontSize: '26px', fontWeight: 900, letterSpacing: '-0.025em', color: GRAPHITE, margin: '0 0 12px', lineHeight: 1.2 }}>
              You&apos;re unsubscribed.
            </h1>
            <p style={{ fontSize: '15px', lineHeight: 1.7, color: BODY, margin: '0 0 8px' }}>
              We&apos;ve stopped all marketing emails to <strong style={{ color: GRAPHITE }}>{email}</strong>. That covers every sequence, not just the one you were reading.
            </p>
            <p style={{ fontSize: '13px', lineHeight: 1.7, color: MUTED, margin: '0 0 28px' }}>
              You may still receive messages you specifically asked for, like a booking confirmation or a sign-in code.
            </p>

            <div style={{ borderTop: `1px solid ${HAIRLINE}`, paddingTop: '20px' }}>
              <p style={{ fontSize: '13px', color: MUTED, margin: '0 0 12px' }}>Changed your mind?</p>
              <button
                onClick={() => run(resubscribeAction, false)}
                disabled={pending}
                style={{
                  padding: '12px 20px',
                  borderRadius: '10px',
                  border: `1.5px solid ${HAIRLINE}`,
                  background: '#FFFFFF',
                  color: GRAPHITE,
                  fontSize: '14px',
                  fontWeight: 700,
                  cursor: pending ? 'default' : 'pointer',
                  opacity: pending ? 0.6 : 1,
                }}
              >
                {pending ? 'Working…' : 'Resubscribe'}
              </button>
            </div>
          </>
        ) : (
          <>
            <h1 style={{ fontSize: '26px', fontWeight: 900, letterSpacing: '-0.025em', color: GRAPHITE, margin: '0 0 12px', lineHeight: 1.2 }}>
              Unsubscribe?
            </h1>
            <p style={{ fontSize: '15px', lineHeight: 1.7, color: BODY, margin: '0 0 8px' }}>
              This stops all marketing emails to <strong style={{ color: GRAPHITE }}>{email}</strong> — every sequence, not just this one.
            </p>
            <p style={{ fontSize: '13px', lineHeight: 1.7, color: MUTED, margin: '0 0 28px' }}>
              You&apos;ll still get anything you specifically asked for, like a booking confirmation or a sign-in code.
            </p>

            <button
              onClick={() => run(unsubscribeAction, true)}
              disabled={pending}
              style={{
                width: '100%',
                padding: '16px',
                borderRadius: '12px',
                border: 'none',
                background: BLUE,
                color: '#FFFFFF',
                fontSize: '15px',
                fontWeight: 800,
                cursor: pending ? 'default' : 'pointer',
                opacity: pending ? 0.6 : 1,
                boxShadow: '0 8px 20px -6px rgba(27,109,252,0.5)',
              }}
            >
              {pending ? 'Working…' : 'Unsubscribe me'}
            </button>
          </>
        )}

        {failed && (
          <p style={{ fontSize: '13px', color: '#DC2626', marginTop: '16px' }}>
            Something went wrong. Please reply to any email from us and we&apos;ll do it manually.
          </p>
        )}
      </div>
    </main>
  )
}
