'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Mail, MessageSquare, Megaphone, ChevronDown, Send, Clock, Save, Trash2, X } from 'lucide-react'

const PIPELINE_STAGES = [
  { value: 'new', label: 'New Lead' },
  { value: 'report_sent', label: 'Report Sent' },
  { value: 'zoom_1_booked', label: 'Zoom Booked' },
  { value: 'zoom_1_completed', label: 'Zoom Completed' },
  { value: 'commencement_fee_paid', label: 'Commencement Fee Paid' },
  { value: 'active_client', label: 'Active Client' },
]

interface CampaignEditorProps {
  campaign?: {
    id: string
    name: string
    type: string
    subject: string | null
    content: string | null
    status: string
    recipient_filter: Record<string, string> | null
    scheduled_at: string | null
  }
  tags: Array<{ id: string; name: string }>
}

export default function CampaignEditor({ campaign, tags }: CampaignEditorProps) {
  const router = useRouter()
  const isNew = !campaign?.id

  const [name, setName] = useState(campaign?.name ?? '')
  const [type, setType] = useState(campaign?.type ?? 'email')
  const [subject, setSubject] = useState(campaign?.subject ?? '')
  const [content, setContent] = useState(campaign?.content ?? '')
  const [recipientType, setRecipientType] = useState(campaign?.recipient_filter?.type ?? 'all_leads')
  const [recipientValue, setRecipientValue] = useState(campaign?.recipient_filter?.value ?? '')
  const [scheduleAt, setScheduleAt] = useState(campaign?.scheduled_at ? campaign.scheduled_at.slice(0, 16) : '')
  const [showSchedule, setShowSchedule] = useState(false)
  const [saving, setSaving] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [testPhone, setTestPhone] = useState('')
  const [testSending, setTestSending] = useState(false)
  const [testResult, setTestResult] = useState<'sent' | 'error' | null>(null)

  const recipientFilter = { type: recipientType, ...(recipientValue ? { value: recipientValue } : {}) }

  async function save(status?: string) {
    if (!name.trim()) { setError('Campaign name is required'); return }
    setSaving(true)
    setError('')

    const payload = {
      name, type, subject: subject || null, content: content || null,
      recipient_filter: recipientFilter,
      scheduled_at: null,
      ...(status ? { status } : {}),
    }

    try {
      let data
      if (isNew) {
        const res = await fetch('/api/campaigns', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        data = await res.json()
        if (!res.ok) throw new Error(data.error)
      } else {
        const res = await fetch(`/api/campaigns/${campaign!.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        data = await res.json()
        if (!res.ok) throw new Error(data.error)
      }

      router.push(`/dashboard/business/campaigns/${data.id}`)
      router.refresh()
    } catch (e: any) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  async function sendNow() {
    if (!campaign?.id && isNew) {
      // Save first, then send
      setSaving(true)
      setError('')
      try {
        const res = await fetch('/api/campaigns', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, type, subject, content, recipient_filter: recipientFilter }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error)
        setSaving(false)
        setSending(true)
        const sendRes = await fetch(`/api/campaigns/${data.id}/send`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        })
        const sendData = await sendRes.json()
        if (!sendRes.ok) throw new Error(sendData.error)
        router.push(`/dashboard/business/campaigns`)
        router.refresh()
      } catch (e: any) {
        setError(e.message)
        setSaving(false)
        setSending(false)
      }
      return
    }

    // Save current changes first
    setSaving(true)
    const patchRes = await fetch(`/api/campaigns/${campaign!.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, type, subject, content, recipient_filter: recipientFilter }),
    })
    setSaving(false)
    if (!patchRes.ok) { setError('Failed to save before sending'); return }

    setSending(true)
    try {
      const res = await fetch(`/api/campaigns/${campaign!.id}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      router.push('/dashboard/business/campaigns')
      router.refresh()
    } catch (e: any) {
      setError(e.message)
    } finally {
      setSending(false)
    }
  }

  async function schedule() {
    if (!scheduleAt) { setError('Choose a date and time to schedule'); return }
    setSending(true)
    setError('')

    try {
      // Save first
      const id = campaign?.id
      if (isNew || !id) {
        const res = await fetch('/api/campaigns', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, type, subject, content, recipient_filter: recipientFilter }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error)
        const sendRes = await fetch(`/api/campaigns/${data.id}/send`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ schedule_at: new Date(scheduleAt).toISOString() }),
        })
        if (!sendRes.ok) { const d = await sendRes.json(); throw new Error(d.error) }
      } else {
        await fetch(`/api/campaigns/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, type, subject, content, recipient_filter: recipientFilter }),
        })
        const sendRes = await fetch(`/api/campaigns/${id}/send`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ schedule_at: new Date(scheduleAt).toISOString() }),
        })
        if (!sendRes.ok) { const d = await sendRes.json(); throw new Error(d.error) }
      }
      router.push('/dashboard/business/campaigns')
      router.refresh()
    } catch (e: any) {
      setError(e.message)
    } finally {
      setSending(false)
    }
  }

  async function sendTestSms() {
    if (!testPhone.trim() || !content.trim()) return
    setTestSending(true)
    setTestResult(null)
    try {
      const res = await fetch('/api/campaigns/test-sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: testPhone.trim(), message: content }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setTestResult('sent')
    } catch (e: any) {
      setError(e.message)
      setTestResult('error')
    } finally {
      setTestSending(false)
    }
  }

  async function deleteCampaign() {
    if (!campaign?.id) return
    if (!confirm('Delete this campaign?')) return
    await fetch(`/api/campaigns/${campaign.id}`, { method: 'DELETE' })
    router.push('/dashboard/business/campaigns')
    router.refresh()
  }

  const typeOptions = [
    { value: 'email', label: 'Email', icon: Mail },
    { value: 'sms', label: 'SMS', icon: MessageSquare },
    { value: 'social', label: 'Social', icon: Megaphone },
  ]

  const recipientOptions = [
    { value: 'all_leads', label: 'All Leads', needsValue: false },
    { value: 'all_clients', label: 'All Clients', needsValue: false },
    { value: 'pipeline_stage', label: 'Pipeline Stage', needsValue: true },
    { value: 'tag', label: 'Tag', needsValue: true },
  ]

  const selectedRecipientOption = recipientOptions.find(o => o.value === recipientType)
  const isSent = campaign?.status === 'completed' || campaign?.status === 'active'

  return (
    <div className="max-w-2xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-[22px] font-semibold tracking-[-0.025em] mb-1">{isNew ? 'New Campaign' : 'Edit Campaign'}</h1>
          {campaign?.status && (
            <p className="text-[12.5px] text-[#666D7A] capitalize">{campaign.status}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {!isNew && campaign?.status === 'draft' && (
            <button
              onClick={deleteCampaign}
              className="p-2 text-[#98A0AD] hover:text-red-700 transition-colors"
            >
              <Trash2 size={16} />
            </button>
          )}
          <button
            onClick={() => router.back()}
            className="p-2 text-[#98A0AD] hover:text-[#666D7A] transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-500/20 rounded-lg px-4 py-3 text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="space-y-6">
        {/* Name */}
        <div>
          <label className="block text-[12.5px] font-medium text-[#666D7A] mb-2">Campaign Name</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. July Check-In Blast"
            disabled={isSent}
            className="w-full bg-[#F4F6F9] border border-[#E8EAEE] rounded-lg px-4 py-2.5 text-sm text-[#141821] placeholder-stone-400 focus:outline-none focus:border-blue-500 disabled:opacity-50"
          />
        </div>

        {/* Type */}
        <div>
          <label className="block text-[12.5px] font-medium text-[#666D7A] mb-2">Type</label>
          <div className="flex gap-2">
            {typeOptions.map(opt => {
              const Icon = opt.icon
              return (
                <button
                  key={opt.value}
                  onClick={() => !isSent && setType(opt.value)}
                  disabled={isSent}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-colors disabled:opacity-50 ${
                    type === opt.value
                      ? 'bg-blue-50 border-blue-300 text-blue-500'
                      : 'border-[#E8EAEE] text-[#666D7A] hover:border-[#E8EAEE]'
                  }`}
                >
                  <Icon size={13} />
                  {opt.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Subject (email only) */}
        {type === 'email' && (
          <div>
            <label className="block text-[12.5px] font-medium text-[#666D7A] mb-2">Subject Line</label>
            <input
              type="text"
              value={subject}
              onChange={e => setSubject(e.target.value)}
              placeholder="Your email subject..."
              disabled={isSent}
              className="w-full bg-[#F4F6F9] border border-[#E8EAEE] rounded-lg px-4 py-2.5 text-sm text-[#141821] placeholder-stone-400 focus:outline-none focus:border-blue-500 disabled:opacity-50"
            />
          </div>
        )}

        {/* Content */}
        <div>
          <label className="block text-[12.5px] font-medium text-[#666D7A] mb-2">
            {type === 'email' ? 'Email Body' : type === 'sms' ? 'SMS Message' : 'Post Content'}
          </label>
          <p className="text-[12.5px] text-[#98A0AD] mb-2">Use {'{{first_name}}'} to personalise</p>
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder={type === 'email' ? 'Write your email...' : 'Write your message...'}
            rows={type === 'email' ? 12 : 5}
            disabled={isSent}
            className="w-full bg-[#F4F6F9] border border-[#E8EAEE] rounded-lg px-4 py-3 text-sm text-[#141821] placeholder-stone-400 focus:outline-none focus:border-blue-500 resize-none disabled:opacity-50"
          />
        </div>

        {/* Test Send (SMS only) */}
        {type === 'sms' && (
          <div className="border border-[#E8EAEE] rounded-lg p-4">
            <p className="text-[12.5px] font-medium text-[#666D7A] mb-3">Test Send</p>
            <div className="flex gap-2">
              <input
                type="tel"
                value={testPhone}
                onChange={e => { setTestPhone(e.target.value); setTestResult(null) }}
                placeholder="04xx xxx xxx"
                className="flex-1 bg-[#F4F6F9] border border-[#E8EAEE] rounded-lg px-4 py-2.5 text-sm text-[#141821] placeholder-stone-400 focus:outline-none focus:border-blue-500"
              />
              <button
                onClick={sendTestSms}
                disabled={testSending || !testPhone.trim() || !content.trim()}
                className="flex items-center gap-2 px-4 py-2.5 bg-[#EFF1F4] hover:bg-stone-300 text-[#141821] text-sm font-medium rounded-lg transition-colors disabled:opacity-40"
              >
                <Send size={13} />
                {testSending ? 'Sending...' : 'Send Test'}
              </button>
            </div>
            {testResult === 'sent' && (
              <p className="text-[12.5px] text-blue-500 mt-2">Test SMS sent successfully.</p>
            )}
          </div>
        )}

        {/* Recipients */}
        {!isSent && (
          <div>
            <label className="block text-[12.5px] font-medium text-[#666D7A] mb-2">Recipients</label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <select
                  value={recipientType}
                  onChange={e => { setRecipientType(e.target.value); setRecipientValue('') }}
                  className="w-full appearance-none bg-[#F4F6F9] border border-[#E8EAEE] rounded-lg px-4 py-2.5 pr-8 text-sm text-[#141821] focus:outline-none focus:border-blue-500"
                >
                  {recipientOptions.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#666D7A] pointer-events-none" />
              </div>

              {selectedRecipientOption?.needsValue && recipientType === 'pipeline_stage' && (
                <div className="relative flex-1">
                  <select
                    value={recipientValue}
                    onChange={e => setRecipientValue(e.target.value)}
                    className="w-full appearance-none bg-[#F4F6F9] border border-[#E8EAEE] rounded-lg px-4 py-2.5 pr-8 text-sm text-[#141821] focus:outline-none focus:border-blue-500"
                  >
                    <option value="">Select stage...</option>
                    {PIPELINE_STAGES.map(s => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#666D7A] pointer-events-none" />
                </div>
              )}

              {selectedRecipientOption?.needsValue && recipientType === 'tag' && (
                <div className="relative flex-1">
                  <select
                    value={recipientValue}
                    onChange={e => setRecipientValue(e.target.value)}
                    className="w-full appearance-none bg-[#F4F6F9] border border-[#E8EAEE] rounded-lg px-4 py-2.5 pr-8 text-sm text-[#141821] focus:outline-none focus:border-blue-500"
                  >
                    <option value="">Select tag...</option>
                    {tags.map(t => (
                      <option key={t.id} value={t.name}>{t.name}</option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#666D7A] pointer-events-none" />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        {!isSent && (
          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={() => save()}
              disabled={saving || sending}
              className="flex items-center gap-2 px-4 py-2 bg-[#EFF1F4] hover:bg-stone-300 text-[#141821] text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              <Save size={14} />
              Save Draft
            </button>

            <button
              onClick={sendNow}
              disabled={saving || sending}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-500 text-stone-50 text-sm font-semibold rounded-lg transition-colors disabled:opacity-50"
            >
              <Send size={14} />
              {sending ? 'Sending...' : 'Send Now'}
            </button>

            <button
              onClick={() => setShowSchedule(v => !v)}
              disabled={saving || sending}
              className="flex items-center gap-2 px-4 py-2 border border-[#E8EAEE] hover:border-[#1B6DFC] hover:bg-blue-50 text-[#666D7A] text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              <Clock size={14} />
              Schedule
            </button>
          </div>
        )}

        {showSchedule && !isSent && (
          <div className="flex items-center gap-3">
            <input
              type="datetime-local"
              value={scheduleAt}
              onChange={e => setScheduleAt(e.target.value)}
              className="bg-[#F4F6F9] border border-[#E8EAEE] rounded-lg px-4 py-2 text-sm text-[#141821] focus:outline-none focus:border-blue-500"
            />
            <button
              onClick={schedule}
              disabled={sending}
              className="px-4 py-2 bg-amber-50 border border-amber-200 text-amber-700 text-sm font-medium rounded-lg hover:bg-amber-100 transition-colors disabled:opacity-50"
            >
              {sending ? 'Scheduling...' : 'Confirm Schedule'}
            </button>
          </div>
        )}

        {isSent && (
          <div className="bg-blue-500/5 border border-blue-500/20 rounded-lg px-4 py-3 text-blue-500 text-sm">
            This campaign has been sent and can no longer be edited.
          </div>
        )}
      </div>
    </div>
  )
}
