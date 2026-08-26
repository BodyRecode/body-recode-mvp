'use client'

import { useState, useTransition } from 'react'

export function StripeConnectSection({
  stripeAccountId,
  stripeAccountStatus,
  searchStatus,
}: {
  stripeAccountId: string | null
  stripeAccountStatus: 'pending' | 'active' | 'restricted' | null
  searchStatus: string | null
}) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleOnboard() {
    startTransition(async () => {
      const r = await fetch('/api/tenant/stripe/onboard', { method: 'POST' })
      if (!r.ok) {
        const body = await r.json().catch(() => ({ error: 'onboarding failed' }))
        setError(body.error ?? 'onboarding failed')
        return
      }
      const { url } = await r.json()
      if (url) window.location.href = url
      else setError('no onboarding url returned')
    })
  }

  const statusLabel = stripeAccountStatus ?? (stripeAccountId ? 'unknown' : 'not connected')
  const statusTone =
    stripeAccountStatus === 'active'
      ? 'bg-green-100 text-green-700'
      : stripeAccountStatus === 'restricted'
        ? 'bg-red-100 text-red-700'
        : stripeAccountStatus === 'pending'
          ? 'bg-amber-100 text-amber-700'
          : 'bg-[#F4F6F9] text-[#666D7A]'

  const resultBanner =
    searchStatus === 'active' ? (
      <div className="mb-3 p-3 rounded-lg border border-green-200 bg-green-50 text-[13px] text-green-900">
        <strong>Connected.</strong> Your Stripe account is ready to accept payments. Checkout callsites now route to your account when you update them to pass the tenant context.
      </div>
    ) : searchStatus === 'restricted' ? (
      <div className="mb-3 p-3 rounded-lg border border-red-200 bg-red-50 text-[13px] text-red-900">
        <strong>Restricted.</strong> Stripe needs more information (usually ID docs). Click Continue onboarding to finish.
      </div>
    ) : searchStatus === 'pending' ? (
      <div className="mb-3 p-3 rounded-lg border border-amber-200 bg-amber-50 text-[13px] text-amber-900">
        <strong>Onboarding not complete.</strong> Click Continue onboarding to finish the Stripe form.
      </div>
    ) : searchStatus === 'retrieve_failed' ? (
      <div className="mb-3 p-3 rounded-lg border border-red-200 bg-red-50 text-[13px] text-red-900">
        Couldn&apos;t reach Stripe to check your account. Try again or reach out to Kade.
      </div>
    ) : searchStatus === 'no_account' ? (
      <div className="mb-3 p-3 rounded-lg border border-red-200 bg-red-50 text-[13px] text-red-900">
        No Stripe account on file. Click Connect Stripe to start onboarding.
      </div>
    ) : null

  return (
    <div className="mb-4 bg-white border border-[#E8EAEE] rounded-xl overflow-hidden">
      <div className="px-5 py-3 border-b border-[#E8EAEE] bg-[#FBFCFD]">
        <h3 className="text-[13.5px] font-semibold text-[#141821] tracking-[-0.015em]">Stripe Connect</h3>
      </div>
      <div className="p-5">
        <p className="text-[13px] text-[#666D7A] leading-relaxed mb-4">
          Connect your Stripe account to accept payments directly from your clients. Your customers pay you, and Stripe deposits into your bank account. The platform is the payment processor; your clients never see &quot;Body Recode&quot; on a receipt.
        </p>

        {resultBanner}

        {error && (
          <div className="mb-3 p-3 rounded-lg border border-red-200 bg-red-50 text-[12px] text-red-800">{error}</div>
        )}

        <div className="mb-4 flex items-center gap-3">
          <span className="text-[11px] font-medium text-[#666D7A]">Status</span>
          <span className={`text-[12px] font-medium px-2 py-0.5 rounded ${statusTone}`}>{statusLabel}</span>
          {stripeAccountId && (
            <span className="text-[11px] font-mono text-[#666D7A] break-all">{stripeAccountId}</span>
          )}
        </div>

        {stripeAccountStatus !== 'active' ? (
          <button
            onClick={handleOnboard}
            disabled={pending}
            className="px-4 py-2 rounded-md bg-blue-600 text-white text-[13px] font-semibold hover:bg-blue-700 disabled:opacity-40"
          >
            {pending ? 'Opening Stripe…' : stripeAccountId ? 'Continue onboarding' : 'Connect Stripe'}
          </button>
        ) : (
          <div className="text-[13px] text-[#666D7A] leading-relaxed">
            Fully onboarded. To view your Stripe dashboard, log in at{' '}
            <a href="https://dashboard.stripe.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700 underline">
              dashboard.stripe.com
            </a>
            .
          </div>
        )}
      </div>
    </div>
  )
}
