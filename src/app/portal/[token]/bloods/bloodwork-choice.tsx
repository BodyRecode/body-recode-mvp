'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Check } from 'lucide-react'

/**
 * Onboarding choice for the Blood Work step. Two ways to address it: upload
 * recent results (the form below this component), or record that you'll arrange
 * a panel. This component owns the second path. Purely an acknowledgement, no
 * clinical anything: your GP orders and interprets the test.
 */
export default function BloodworkChoice({
  token,
  arranged,
  hasUpload,
}: {
  token: string
  arranged: boolean
  hasUpload: boolean
}) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function setArranged(next: boolean) {
    if (saving) return
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/portal/bloodwork-arrange', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, arranged: next }),
      })
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || 'Could not save')
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save')
      setSaving(false)
    }
  }

  // Once a panel is uploaded, the uploads list below is the record. No choice needed.
  if (hasUpload) return null

  if (arranged) {
    return (
      <div className="rounded-2xl border border-[#1B6DFC]/30 bg-[#EFF5FE] p-5 mb-8">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full bg-[#1B6DFC] flex items-center justify-center">
            <Check size={13} className="text-white" strokeWidth={3} />
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-[#141821] mb-1">Noted, you will arrange a panel</p>
            <p className="text-xs text-[#666D7A] leading-relaxed mb-3">
              Use the request list above with your GP. When you have your results, upload a copy below and your coach will factor it in. There is no rush, this does not hold up your coaching.
            </p>
            <button
              onClick={() => setArranged(false)}
              disabled={saving}
              className="text-xs font-medium text-[#666D7A] hover:text-[#1B6DFC] transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Undo'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-[#1B6DFC] bg-[#FFFFFF] p-5 mb-8">
      <p className="text-xs font-bold tracking-widest text-[#1B6DFC] uppercase mb-2">Part of your Foundational Read</p>
      <p className="text-sm text-[#141821] leading-relaxed mb-1 font-medium">A blood panel gives me the inside picture.</p>
      <p className="text-xs text-[#666D7A] leading-relaxed mb-4">
        If you have recent results, upload them below. If not, take the request list above to your GP and let me know you are arranging it, so I know it is on the way. Your GP orders and interprets the test, I read it as one more signal for your coaching.
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={() => setArranged(true)}
          disabled={saving}
          className="inline-flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-lg bg-[#1B6DFC] text-white hover:bg-[#1560E0] transition-colors disabled:opacity-50"
        >
          {saving ? <Loader2 size={14} className="animate-spin" /> : null}
          I&apos;ll get a panel done
        </button>
        <span className="text-xs text-[#98A0AD]">or upload recent results below</span>
      </div>
      {error && <p className="mt-2 text-xs text-[#8A5A14]">{error}</p>}
    </div>
  )
}
