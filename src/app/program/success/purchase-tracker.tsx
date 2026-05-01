'use client'

import { useEffect } from 'react'

export default function PurchaseTracker({ value, contentName }: { value: number; contentName: string }) {
  useEffect(() => {
    const w = window as unknown as { fbq?: (...args: unknown[]) => void }
    if (typeof w.fbq === 'function') {
      w.fbq('track', 'Purchase', {
        value,
        currency: 'AUD',
        content_name: contentName,
      })
    }
  }, [value, contentName])
  return null
}
