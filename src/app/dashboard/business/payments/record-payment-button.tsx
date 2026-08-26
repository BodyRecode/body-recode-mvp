'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { DollarSign, X, Loader2 } from 'lucide-react'

interface Product {
  id: string
  name: string
  price: number
  type: string
}

interface Props {
  products: Product[]
}

export default function RecordPaymentButton({ products }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [contacts, setContacts] = useState<{ id: string; name: string; type: 'lead' | 'client' }[]>([])
  const [loadingContacts, setLoadingContacts] = useState(false)

  const [form, setForm] = useState({
    contactId: '',
    contactType: 'lead' as 'lead' | 'client',
    productId: '',
    amount: '',
    status: 'paid' as 'paid' | 'pending',
    notes: '',
  })

  async function openModal() {
    setOpen(true)
    setLoadingContacts(true)
    try {
      const [leadsRes, clientsRes] = await Promise.all([
        fetch('/api/bookings/contacts?type=leads'),
        fetch('/api/bookings/contacts?type=clients'),
      ])
      const leads = await leadsRes.json()
      const clients = await clientsRes.json()
      setContacts([
        ...(leads || []).map((l: { id: string; name: string }) => ({ ...l, type: 'lead' as const })),
        ...(clients || []).map((c: { id: string; name: string }) => ({ ...c, type: 'client' as const })),
      ])
    } finally {
      setLoadingContacts(false)
    }
  }

  function handleProductChange(productId: string) {
    const product = products.find(p => p.id === productId)
    setForm(f => ({ ...f, productId, amount: product ? String(product.price) : f.amount }))
  }

  function close() {
    setOpen(false)
    setForm({ contactId: '', contactType: 'lead', productId: '', amount: '', status: 'paid', notes: '' })
  }

  function submit() {
    if (!form.contactId || !form.amount) return
    const contact = contacts.find(c => c.id === form.contactId)
    startTransition(async () => {
      await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lead_id: contact?.type === 'lead' ? form.contactId : null,
          client_id: contact?.type === 'client' ? form.contactId : null,
          product_id: form.productId || null,
          amount: parseFloat(form.amount),
          status: form.status,
        }),
      })
      close()
      router.refresh()
    })
  }

  return (
    <>
      <button
        onClick={openModal}
        className="flex items-center gap-2 text-sm text-[#141821] hover:text-[#141821] border border-[#E8EAEE] hover:border-[#CFD4DC] px-4 py-2 rounded-lg transition-colors"
      >
        <DollarSign size={14} />
        Record Payment
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#FBFCFD]" onClick={close} />
          <div className="relative bg-[#F4F6F9] border border-[#E8EAEE] rounded-xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold">Record Payment</h2>
              <button onClick={close} className="text-[#666D7A] hover:text-[#141821] transition-colors">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[12.5px] font-medium text-[#666D7A] mb-1.5">Contact</label>
                {loadingContacts ? (
                  <div className="flex items-center gap-2 text-[#666D7A] text-sm py-2">
                    <Loader2 size={14} className="animate-spin" />
                    Loading...
                  </div>
                ) : (
                  <select
                    value={form.contactId}
                    onChange={(e) => {
                      const contact = contacts.find(c => c.id === e.target.value)
                      setForm(f => ({ ...f, contactId: e.target.value, contactType: contact?.type ?? 'lead' }))
                    }}
                    className="w-full bg-[#EFF1F4] border border-[#E8EAEE] rounded-lg px-3 py-2 text-sm text-[#141821] focus:outline-none focus:border-[#CFD4DC]"
                  >
                    <option value="">Select a contact...</option>
                    {contacts.filter(c => c.type === 'lead').length > 0 && (
                      <optgroup label="Leads">
                        {contacts.filter(c => c.type === 'lead').map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </optgroup>
                    )}
                    {contacts.filter(c => c.type === 'client').length > 0 && (
                      <optgroup label="Clients">
                        {contacts.filter(c => c.type === 'client').map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </optgroup>
                    )}
                  </select>
                )}
              </div>

              <div>
                <label className="block text-[12.5px] font-medium text-[#666D7A] mb-1.5">Product (optional)</label>
                <select
                  value={form.productId}
                  onChange={(e) => handleProductChange(e.target.value)}
                  className="w-full bg-[#EFF1F4] border border-[#E8EAEE] rounded-lg px-3 py-2 text-sm text-[#141821] focus:outline-none focus:border-[#CFD4DC]"
                >
                  <option value="">Manual / no product</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name} - ${p.price}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[12.5px] font-medium text-[#666D7A] mb-1.5">Amount (AUD)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#666D7A] text-sm">$</span>
                  <input
                    type="number"
                    value={form.amount}
                    onChange={(e) => setForm(f => ({ ...f, amount: e.target.value }))}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    className="w-full bg-[#EFF1F4] border border-[#E8EAEE] rounded-lg pl-7 pr-3 py-2 text-sm text-[#141821] placeholder-stone-400 focus:outline-none focus:border-[#CFD4DC]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[12.5px] font-medium text-[#666D7A] mb-1.5">Status</label>
                <div className="flex gap-2">
                  {[
                    { value: 'paid', label: 'Paid' },
                    { value: 'pending', label: 'Pending' },
                  ].map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setForm(f => ({ ...f, status: opt.value as 'paid' | 'pending' }))}
                      className={`flex-1 text-xs font-medium py-2 rounded-lg border transition-colors ${
                        form.status === opt.value
                          ? 'bg-blue-50 border-blue-300 text-blue-500'
                          : 'border-[#E8EAEE] text-[#666D7A] hover:border-[#CFD4DC] hover:text-[#141821]'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
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
                disabled={!form.contactId || !form.amount || isPending}
                className="flex-1 flex items-center justify-center gap-2 text-sm font-semibold bg-blue-500 hover:bg-blue-500 text-stone-50 disabled:opacity-40 disabled:cursor-not-allowed py-2.5 rounded-lg transition-colors"
              >
                {isPending && <Loader2 size={13} className="animate-spin" />}
                Record
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
