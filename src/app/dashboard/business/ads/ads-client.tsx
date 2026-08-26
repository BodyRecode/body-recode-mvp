'use client'

import { useState } from 'react'
import { Plus, TrendingUp, Trash2, Pencil, X, Check } from 'lucide-react'

interface AdCampaign {
  id: string
  platform: 'meta' | 'google'
  name: string
  spend: number
  leads_count: number
  date_from: string | null
  date_to: string | null
}

interface Props {
  initialCampaigns: AdCampaign[]
}

const PLATFORM_LABELS: Record<string, string> = {
  meta: 'Meta',
  google: 'Google',
}

const PLATFORM_COLORS: Record<string, string> = {
  meta: 'bg-[rgba(27,109,252,0.08)] text-[#1056D6] border-[#1B6DFC]/20',
  google: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
}

const empty = (): Partial<AdCampaign> => ({
  platform: 'meta',
  name: '',
  spend: 0,
  leads_count: 0,
  date_from: '',
  date_to: '',
})

export default function AdsClient({ initialCampaigns }: Props) {
  const [campaigns, setCampaigns] = useState<AdCampaign[]>(initialCampaigns)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<Partial<AdCampaign>>(empty())
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const cpl = (spend: number, leads: number) =>
    leads > 0 ? (spend / leads).toFixed(2) : '-'

  const totalSpend = campaigns.reduce((s, c) => s + (c.spend ?? 0), 0)
  const totalLeads = campaigns.reduce((s, c) => s + (c.leads_count ?? 0), 0)
  const totalCpl = totalLeads > 0 ? (totalSpend / totalLeads).toFixed(2) : '-'

  function startEdit(c: AdCampaign) {
    setEditingId(c.id)
    setForm({ ...c })
    setShowForm(false)
  }

  function cancelEdit() {
    setEditingId(null)
    setForm(empty())
  }

  async function saveNew() {
    setSaving(true)
    const res = await fetch('/api/ads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    if (res.ok) {
      const created = await res.json()
      setCampaigns(prev => [created, ...prev])
      setShowForm(false)
      setForm(empty())
    }
    setSaving(false)
  }

  async function saveEdit() {
    if (!editingId) return
    setSaving(true)
    const res = await fetch(`/api/ads/${editingId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    if (res.ok) {
      const updated = await res.json()
      setCampaigns(prev => prev.map(c => c.id === editingId ? updated : c))
      setEditingId(null)
      setForm(empty())
    }
    setSaving(false)
  }

  async function deleteCampaign(id: string) {
    setDeletingId(id)
    await fetch(`/api/ads/${id}`, { method: 'DELETE' })
    setCampaigns(prev => prev.filter(c => c.id !== id))
    setDeletingId(null)
  }

  const FormFields = () => (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-[12.5px] text-[#666D7A] mb-1">Platform</label>
          <select
            value={form.platform ?? 'meta'}
            onChange={e => setForm(f => ({ ...f, platform: e.target.value as 'meta' | 'google' }))}
            className="w-full bg-[#EFF1F4] border border-[#E8EAEE] rounded-lg px-3 py-2 text-sm text-[#141821] focus:outline-none focus:border-[#1B6DFC]"
          >
            <option value="meta">Meta</option>
            <option value="google">Google</option>
          </select>
        </div>
        <div>
          <label className="block text-[12.5px] text-[#666D7A] mb-1">Campaign Name</label>
          <input
            type="text"
            value={form.name ?? ''}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            placeholder="e.g. Body Recode Jan"
            className="w-full bg-[#EFF1F4] border border-[#E8EAEE] rounded-lg px-3 py-2 text-sm text-[#141821] placeholder-[#98A0AD] focus:outline-none focus:border-[#1B6DFC]"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-[12.5px] text-[#666D7A] mb-1">Spend (AUD)</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={form.spend ?? 0}
            onChange={e => setForm(f => ({ ...f, spend: parseFloat(e.target.value) || 0 }))}
            className="w-full bg-[#EFF1F4] border border-[#E8EAEE] rounded-lg px-3 py-2 text-sm text-[#141821] focus:outline-none focus:border-[#1B6DFC]"
          />
        </div>
        <div>
          <label className="block text-[12.5px] text-[#666D7A] mb-1">Leads Generated</label>
          <input
            type="number"
            min="0"
            value={form.leads_count ?? 0}
            onChange={e => setForm(f => ({ ...f, leads_count: parseInt(e.target.value) || 0 }))}
            className="w-full bg-[#EFF1F4] border border-[#E8EAEE] rounded-lg px-3 py-2 text-sm text-[#141821] focus:outline-none focus:border-[#1B6DFC]"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-[12.5px] text-[#666D7A] mb-1">Date From</label>
          <input
            type="date"
            value={form.date_from ?? ''}
            onChange={e => setForm(f => ({ ...f, date_from: e.target.value || null }))}
            className="w-full bg-[#EFF1F4] border border-[#E8EAEE] rounded-lg px-3 py-2 text-sm text-[#141821] focus:outline-none focus:border-[#1B6DFC]"
          />
        </div>
        <div>
          <label className="block text-[12.5px] text-[#666D7A] mb-1">Date To</label>
          <input
            type="date"
            value={form.date_to ?? ''}
            onChange={e => setForm(f => ({ ...f, date_to: e.target.value || null }))}
            className="w-full bg-[#EFF1F4] border border-[#E8EAEE] rounded-lg px-3 py-2 text-sm text-[#141821] focus:outline-none focus:border-[#1B6DFC]"
          />
        </div>
      </div>
      {/* Live CPL preview */}
      {(form.spend ?? 0) > 0 && (form.leads_count ?? 0) > 0 && (
        <p className="text-[12.5px] text-[#666D7A]">
          CPL: <span className="text-[#1B6DFC] font-semibold">${cpl(form.spend ?? 0, form.leads_count ?? 0)}</span>
        </p>
      )}
    </div>
  )

  return (
    <div className="max-w-3xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-[22px] font-semibold tracking-[-0.025em] mb-1">Ads</h1>
          <p className="text-[#666D7A] text-sm">Track Meta and Google performance. Spend, leads, cost-per-lead.</p>
        </div>
        <button
          onClick={() => { setShowForm(true); setEditingId(null); setForm(empty()) }}
          className="flex items-center gap-2 bg-[#1B6DFC] hover:bg-[#1560E0] text-[#FBFCFD] text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
        >
          <Plus size={15} />
          Add Campaign
        </button>
      </div>

      {/* Summary cards */}
      {campaigns.length > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-[#F4F6F9] br-card p-4">
            <p className="text-[12.5px] text-[#666D7A] mb-1">Total Spend</p>
            <p className="text-xl font-semibold">${totalSpend.toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          </div>
          <div className="bg-[#F4F6F9] br-card p-4">
            <p className="text-[12.5px] text-[#666D7A] mb-1">Total Leads</p>
            <p className="text-xl font-semibold">{totalLeads}</p>
          </div>
          <div className="bg-[#F4F6F9] br-card p-4">
            <p className="text-[12.5px] text-[#666D7A] mb-1">Avg CPL</p>
            <p className="text-xl font-semibold">{totalCpl !== '-' ? `$${totalCpl}` : '-'}</p>
          </div>
        </div>
      )}

      {/* New campaign form */}
      {showForm && (
        <div className="bg-[#F4F6F9] br-card p-5 mb-4">
          <h2 className="text-sm font-semibold mb-4">New Campaign</h2>
          <FormFields />
          <div className="flex items-center gap-2 mt-4">
            <button
              onClick={saveNew}
              disabled={saving || !form.name?.trim()}
              className="flex items-center gap-1.5 bg-[#1B6DFC] hover:bg-[#1560E0] disabled:opacity-50 text-[#FBFCFD] text-[12.5px] font-semibold px-3 py-1.5 rounded-lg transition-colors"
            >
              <Check size={12} />
              {saving ? 'Saving...' : 'Save Campaign'}
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="flex items-center gap-1.5 text-[12.5px] text-[#666D7A] hover:text-[#141821] transition-colors"
            >
              <X size={12} />
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Campaign list */}
      {campaigns.length === 0 && !showForm ? (
        <div className="bg-[#F4F6F9] border border-dashed border-[#E8EAEE] rounded-xl p-12 text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-[#EFF1F4] rounded-xl">
              <TrendingUp size={24} className="text-[#666D7A]" strokeWidth={1.5} />
            </div>
          </div>
          <p className="text-[#666D7A] text-sm font-medium mb-1">No campaigns yet</p>
          <p className="text-[#98A0AD] text-[12.5px]">Add your first Meta or Google campaign to start tracking spend and CPL.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {campaigns.map(campaign => (
            <div key={campaign.id} className="bg-[#F4F6F9] br-card p-5">
              {editingId === campaign.id ? (
                <>
                  <FormFields />
                  <div className="flex items-center gap-2 mt-4">
                    <button
                      onClick={saveEdit}
                      disabled={saving}
                      className="flex items-center gap-1.5 bg-[#1B6DFC] hover:bg-[#1560E0] disabled:opacity-50 text-[#FBFCFD] text-[12.5px] font-semibold px-3 py-1.5 rounded-lg transition-colors"
                    >
                      <Check size={12} />
                      {saving ? 'Saving...' : 'Save'}
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="flex items-center gap-1.5 text-[12.5px] text-[#666D7A] hover:text-[#141821] transition-colors"
                    >
                      <X size={12} />
                      Cancel
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${PLATFORM_COLORS[campaign.platform] ?? ''}`}>
                        {PLATFORM_LABELS[campaign.platform] ?? campaign.platform}
                      </span>
                      {campaign.date_from && (
                        <span className="text-[12.5px] text-[#98A0AD]">
                          {new Date(campaign.date_from).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}
                          {campaign.date_to && ` – ${new Date(campaign.date_to).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}`}
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-semibold text-[#141821] mb-3">{campaign.name}</p>
                    <div className="flex items-center gap-6">
                      <div>
                        <p className="text-[12.5px] text-[#666D7A]">Spend</p>
                        <p className="text-sm font-semibold">${(campaign.spend ?? 0).toLocaleString('en-AU', { minimumFractionDigits: 2 })}</p>
                      </div>
                      <div>
                        <p className="text-[12.5px] text-[#666D7A]">Leads</p>
                        <p className="text-sm font-semibold">{campaign.leads_count ?? 0}</p>
                      </div>
                      <div>
                        <p className="text-[12.5px] text-[#666D7A]">CPL</p>
                        <p className="text-sm font-semibold text-[#1B6DFC]">
                          {cpl(campaign.spend ?? 0, campaign.leads_count ?? 0) !== '-'
                            ? `$${cpl(campaign.spend ?? 0, campaign.leads_count ?? 0)}`
                            : '-'}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 ml-4">
                    <button
                      onClick={() => startEdit(campaign)}
                      className="p-1.5 text-[#666D7A] hover:text-[#141821] transition-colors"
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      onClick={() => deleteCampaign(campaign.id)}
                      disabled={deletingId === campaign.id}
                      className="p-1.5 text-[#666D7A] hover:text-[#C82626] transition-colors disabled:opacity-50"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
