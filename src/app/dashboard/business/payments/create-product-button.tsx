'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, X, Loader2 } from 'lucide-react'

export default function CreateProductButton() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [form, setForm] = useState({
    name: '',
    price: '',
    type: 'one_time' as 'one_time' | 'subscription',
    billing_interval: 'weekly' as 'weekly' | 'fortnightly' | 'monthly',
    description: '',
  })

  function close() {
    setOpen(false)
    setForm({ name: '', price: '', type: 'one_time', billing_interval: 'weekly', description: '' })
  }

  function submit() {
    if (!form.name || !form.price) return
    startTransition(async () => {
      await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          price: parseFloat(form.price),
          type: form.type,
          billing_interval: form.type === 'subscription' ? form.billing_interval : null,
          description: form.description || null,
        }),
      })
      close()
      router.refresh()
    })
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 bg-[#1B6DFC] hover:bg-[#1560E0] text-[#FBFCFD] text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
      >
        <Plus size={14} strokeWidth={2.5} />
        New Product
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#FBFCFD]" onClick={close} />
          <div className="relative bg-[#F4F6F9] br-card p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold">New Product</h2>
              <button onClick={close} className="text-[#666D7A] hover:text-[#141821] transition-colors">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[12.5px] font-medium text-[#666D7A] mb-1.5">Product Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Coaching Foundational Read"
                  className="w-full bg-[#EFF1F4] border border-[#E8EAEE] rounded-lg px-3 py-2 text-sm text-[#141821] placeholder-[#98A0AD] focus:outline-none focus:border-[#CFD4DC]"
                />
              </div>

              <div>
                <label className="block text-[12.5px] font-medium text-[#666D7A] mb-1.5">Price (AUD)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#666D7A] text-sm">$</span>
                  <input
                    type="number"
                    value={form.price}
                    onChange={(e) => setForm(f => ({ ...f, price: e.target.value }))}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    className="w-full bg-[#EFF1F4] border border-[#E8EAEE] rounded-lg pl-7 pr-3 py-2 text-sm text-[#141821] placeholder-[#98A0AD] focus:outline-none focus:border-[#CFD4DC]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[12.5px] font-medium text-[#666D7A] mb-1.5">Type</label>
                <div className="flex gap-2">
                  {[
                    { value: 'one_time', label: 'One-time' },
                    { value: 'subscription', label: 'Subscription' },
                  ].map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setForm(f => ({ ...f, type: opt.value as 'one_time' | 'subscription' }))}
                      className={`flex-1 text-xs font-medium py-2 rounded-lg border transition-colors ${
                        form.type === opt.value
                          ? 'bg-[rgba(27,109,252,0.08)] border-[#9CC0FB] text-[#1B6DFC]'
                          : 'border-[#E8EAEE] text-[#666D7A] hover:border-[#CFD4DC] hover:text-[#141821]'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {form.type === 'subscription' && (
                <div>
                  <label className="block text-[12.5px] font-medium text-[#666D7A] mb-1.5">Billing Interval</label>
                  <div className="flex gap-2">
                    {[
                      { value: 'weekly', label: 'Weekly' },
                      { value: 'fortnightly', label: 'Fortnightly' },
                      { value: 'monthly', label: 'Monthly' },
                    ].map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => setForm(f => ({ ...f, billing_interval: opt.value as 'weekly' | 'fortnightly' | 'monthly' }))}
                        className={`flex-1 text-xs font-medium py-2 rounded-lg border transition-colors ${
                          form.billing_interval === opt.value
                            ? 'bg-[rgba(27,109,252,0.08)] border-[#9CC0FB] text-[#1B6DFC]'
                            : 'border-[#E8EAEE] text-[#666D7A] hover:border-[#CFD4DC] hover:text-[#141821]'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-[12.5px] font-medium text-[#666D7A] mb-1.5">Description (optional)</label>
                <input
                  type="text"
                  value={form.description}
                  onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Brief description"
                  className="w-full bg-[#EFF1F4] border border-[#E8EAEE] rounded-lg px-3 py-2 text-sm text-[#141821] placeholder-[#98A0AD] focus:outline-none focus:border-[#CFD4DC]"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={close}
                className="flex-1 text-sm text-[#666D7A] hover:text-[#141821] border border-[#E8EAEE] hover:border-[#CFD4DC] py-2.5 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={submit}
                disabled={!form.name || !form.price || isPending}
                className="flex-1 flex items-center justify-center gap-2 text-sm font-semibold bg-[#1B6DFC] hover:bg-[#1560E0] text-[#FBFCFD] disabled:opacity-40 disabled:cursor-not-allowed py-2.5 rounded-lg transition-colors"
              >
                {isPending && <Loader2 size={13} className="animate-spin" />}
                Save Product
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
