'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { BRAND } from '@/lib/brand-tokens'

/**
 * The only thing on Settings a coach can actually do.
 *
 * A reset link rather than a change-password form, on purpose: a form here
 * would need the current password to be safe, and a coach who has forgotten it
 * is exactly the person using this. The link goes to the address they sign in
 * with, so it proves they are them without asking them to prove it twice.
 */
export default function AccountActions({ email }: { email: string }) {
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'failed'>('idle')

  async function send() {
    setState('sending')
    const { error } = await createClient().auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login`,
    })
    setState(error ? 'failed' : 'sent')
  }

  if (state === 'sent') {
    return (
      <p className="text-[13.5px]" style={{ color: BRAND.darkInkMuted }}>
        Sent to {email}. Check your inbox, and the spam folder if it is not there in a minute.
      </p>
    )
  }

  return (
    <div>
      <button
        onClick={send}
        disabled={state === 'sending'}
        className="text-[12.5px] font-bold rounded-lg px-3.5 py-[7px] disabled:opacity-40"
        style={{ background: BRAND.darkInk, color: BRAND.darkWell }}
      >
        {state === 'sending' ? 'Sending…' : 'Email me a reset link'}
      </button>
      {state === 'failed' && (
        <p className="text-[12.5px] mt-2" style={{ color: BRAND.attentionOnDark }}>
          That did not send. Reply to your invitation email and we will sort it.
        </p>
      )}
    </div>
  )
}
