'use client'

import { useState, useCallback } from 'react'
import {
  Plus, Trash2, Pencil, X, Check, Zap, Clapperboard,
  Copy, ChevronDown, Video, RefreshCw, Download, Image,
} from 'lucide-react'

// ─── Types ─────────────────────────────────────────────────────────────────

interface Hook {
  id: string
  hook_text: string
  category: string
  performance_score: number
}

interface Message {
  id: string
  message_text: string
  type: string
}

interface Cta {
  id: string
  cta_text: string
}

interface Output {
  id: string
  hook_id: string | null
  message_id: string | null
  cta_id: string | null
  platform: string
  content_text: string
  status: string
  video_status: string | null
  video_url: string | null
  heygen_video_id: string | null
  hook?: { hook_text: string; category: string } | null
  message?: { message_text: string; type: string } | null
  cta?: { cta_text: string } | null
}

interface Props {
  initialHooks: Hook[]
  initialMessages: Message[]
  initialCtas: Cta[]
  initialOutputs: Output[]
}

// ─── Constants ──────────────────────────────────────────────────────────────

const HOOK_CATEGORIES = [
  { value: 'unaware', label: 'Unaware - Cold' },
  { value: 'problem_aware', label: 'Problem Aware - Cold' },
  { value: 'contrarian', label: 'Contrarian - Cold' },
  { value: 'curiosity', label: 'Curiosity - Cold/Warm' },
  { value: 'solution_aware', label: 'Solution Aware - Warm' },
  { value: 'authority', label: 'Authority - Warm' },
]

const MESSAGE_TYPES = [
  { value: 'education', label: 'Education' },
  { value: 'myth_busting', label: 'Myth-busting' },
  { value: 'story', label: 'Story' },
  { value: 'system_explanation', label: 'System Explanation' },
  { value: 'authority', label: 'Authority' },
]

const PLATFORMS = [
  { value: 'meta', label: 'Meta Ad' },
  { value: 'instagram', label: 'Instagram Caption' },
  { value: 'tiktok', label: 'TikTok Script' },
  { value: 'email', label: 'Email Snippet' },
  { value: 'landing_page', label: 'Landing Page' },
]

const OUTPUT_STATUSES = [
  { value: 'draft', label: 'Draft', color: 'text-stone-600 bg-stone-200 border-stone-300' },
  { value: 'approved', label: 'Approved', color: 'text-blue-500 bg-blue-50 border-blue-500/20' },
  { value: 'deployed', label: 'Deployed', color: 'text-blue-700 bg-blue-50 border-blue-500/20' },
  { value: 'winning', label: 'Winning', color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20' },
  { value: 'removed', label: 'Removed', color: 'text-red-700 bg-red-50 border-red-500/20' },
]

const SCORE_LABELS: Record<number, { label: string; color: string }> = {
  0: { label: 'Unscored', color: 'text-stone-500' },
  1: { label: 'Losing', color: 'text-red-700' },
  2: { label: 'Neutral', color: 'text-stone-600' },
  3: { label: 'Winning', color: 'text-blue-500' },
}

function categoryColor(cat: string) {
  const map: Record<string, string> = {
    problem_aware: 'bg-red-50 text-red-700 border-red-500/20',
    solution_aware: 'bg-blue-50 text-blue-500 border-blue-500/20',
    unaware: 'bg-stone-300 text-stone-600 border-stone-400',
    contrarian: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    curiosity: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    authority: 'bg-blue-50 text-blue-700 border-blue-500/20',
  }
  return map[cat] ?? 'bg-stone-300 text-stone-600 border-stone-400'
}

function categoryLabel(cat: string) {
  return HOOK_CATEGORIES.find(c => c.value === cat)?.label ?? cat
}

function messageTypeColor(type: string) {
  const map: Record<string, string> = {
    education: 'bg-blue-50 text-blue-500 border-blue-500/20',
    myth_busting: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    story: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    system_explanation: 'bg-blue-50 text-blue-700 border-blue-500/20',
    authority: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  }
  return map[type] ?? 'bg-stone-300 text-stone-600 border-stone-400'
}

function messageTypeLabel(type: string) {
  return MESSAGE_TYPES.find(t => t.value === type)?.label ?? type
}

function statusStyle(status: string) {
  return OUTPUT_STATUSES.find(s => s.value === status)?.color ?? 'text-stone-600 bg-stone-200 border-stone-300'
}

function platformLabel(p: string) {
  return PLATFORMS.find(pl => pl.value === p)?.label ?? p
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function ContentClient({ initialHooks, initialMessages, initialCtas, initialOutputs }: Props) {
  const [tab, setTab] = useState<'hooks' | 'messages' | 'ctas' | 'generate' | 'outputs' | 'cards'>('hooks')

  const [hooks, setHooks] = useState<Hook[]>(initialHooks)
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [ctas, setCtas] = useState<Cta[]>(initialCtas)
  const [outputs, setOutputs] = useState<Output[]>(initialOutputs)

  const tabs = [
    { key: 'hooks', label: `Hooks (${hooks.length})` },
    { key: 'messages', label: `Messages (${messages.length})` },
    { key: 'ctas', label: `CTAs (${ctas.length})` },
    { key: 'generate', label: 'Generate' },
    { key: 'outputs', label: `Outputs (${outputs.length})` },
    { key: 'cards', label: 'Card Library' },
  ] as const

  return (
    <div className="max-w-4xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold mb-1">Content Engine</h1>
          <p className="text-stone-600 text-sm">Build hook, message, and CTA libraries. Generate batches of ad copy and reels.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-6 border-b border-stone-200">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px ${
              tab === t.key
                ? 'border-blue-500 text-[#1A1A1A]'
                : 'border-transparent text-stone-500 hover:text-stone-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'hooks' && (
        <HooksTab hooks={hooks} setHooks={setHooks} />
      )}
      {tab === 'messages' && (
        <MessagesTab messages={messages} setMessages={setMessages} />
      )}
      {tab === 'ctas' && (
        <CtasTab ctas={ctas} setCtas={setCtas} />
      )}
      {tab === 'generate' && (
        <GenerateTab
          hooks={hooks}
          messages={messages}
          ctas={ctas}
          outputs={outputs}
          setOutputs={setOutputs}
          onViewOutputs={() => setTab('outputs')}
        />
      )}
      {tab === 'outputs' && (
        <OutputsTab outputs={outputs} setOutputs={setOutputs} />
      )}
      {tab === 'cards' && (
        <CardsTab />
      )}
    </div>
  )
}

// ─── Hooks Tab ──────────────────────────────────────────────────────────────

function HooksTab({ hooks, setHooks }: { hooks: Hook[]; setHooks: React.Dispatch<React.SetStateAction<Hook[]>> }) {
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({ hook_text: '', category: 'problem_aware' })
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  async function save() {
    setSaving(true)
    if (editingId) {
      const res = await fetch(`/api/content/hooks/${editingId}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
      })
      if (res.ok) {
        const updated = await res.json()
        setHooks(h => h.map(x => x.id === editingId ? updated : x))
        setEditingId(null)
      }
    } else {
      const res = await fetch('/api/content/hooks', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
      })
      if (res.ok) {
        const created = await res.json()
        setHooks(h => [created, ...h])
        setShowForm(false)
      }
    }
    setForm({ hook_text: '', category: 'problem_aware' })
    setSaving(false)
  }

  async function deleteHook(id: string) {
    setDeletingId(id)
    await fetch(`/api/content/hooks/${id}`, { method: 'DELETE' })
    setHooks(h => h.filter(x => x.id !== id))
    setDeletingId(null)
  }

  async function setScore(id: string, score: number) {
    const res = await fetch(`/api/content/hooks/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ performance_score: score }),
    })
    if (res.ok) {
      const updated = await res.json()
      setHooks(h => h.map(x => x.id === id ? updated : x))
    }
  }

  function startEdit(hook: Hook) {
    setEditingId(hook.id)
    setForm({ hook_text: hook.hook_text, category: hook.category })
    setShowForm(false)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs text-stone-500">{hooks.length} hooks in library</p>
        <button
          onClick={() => { setShowForm(true); setEditingId(null); setForm({ hook_text: '', category: 'problem_aware' }) }}
          className="flex items-center gap-2 bg-blue-500 hover:bg-blue-500 text-stone-50 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
        >
          <Plus size={13} /> Add Hook
        </button>
      </div>

      {(showForm || editingId) && (
        <div className="bg-stone-100 border border-stone-200 rounded-xl p-4 mb-4 space-y-3">
          <div>
            <label className="block text-xs text-stone-500 mb-1">Hook</label>
            <textarea
              value={form.hook_text}
              onChange={e => setForm(f => ({ ...f, hook_text: e.target.value }))}
              placeholder="Your body isn't broken - it's protecting you"
              rows={2}
              className="w-full bg-stone-200 border border-stone-300 rounded-lg px-3 py-2 text-sm text-[#1A1A1A] placeholder-stone-400 focus:outline-none focus:border-blue-500 resize-none"
            />
          </div>
          <div>
            <label className="block text-xs text-stone-500 mb-1">Category</label>
            <select
              value={form.category}
              onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
              className="bg-stone-200 border border-stone-300 rounded-lg px-3 py-2 text-sm text-[#1A1A1A] focus:outline-none focus:border-blue-500"
            >
              {HOOK_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={save} disabled={saving || !form.hook_text.trim()}
              className="flex items-center gap-1.5 bg-blue-500 hover:bg-blue-500 disabled:opacity-50 text-stone-50 text-xs font-semibold px-3 py-1.5 rounded-lg"
            >
              <Check size={12} /> {saving ? 'Saving...' : 'Save'}
            </button>
            <button onClick={() => { setShowForm(false); setEditingId(null) }} className="text-xs text-stone-500 hover:text-stone-700 flex items-center gap-1">
              <X size={12} /> Cancel
            </button>
          </div>
        </div>
      )}

      {hooks.length === 0 && !showForm ? (
        <EmptyState icon={<Zap size={24} className="text-stone-500" strokeWidth={1.5} />} title="No hooks yet" description="Add your first hook to start building the library." />
      ) : (
        <div className="space-y-2">
          {hooks.map(hook => (
            <div key={hook.id} className="bg-stone-100 border border-stone-200 rounded-xl p-4">
              {editingId === hook.id ? null : (
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${categoryColor(hook.category)}`}>
                        {categoryLabel(hook.category)}
                      </span>
                      <ScoreSelector score={hook.performance_score} onChange={s => setScore(hook.id, s)} />
                    </div>
                    <p className="text-sm text-[#1A1A1A]">{hook.hook_text}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => startEdit(hook)} className="p-1.5 text-stone-500 hover:text-stone-700">
                      <Pencil size={13} />
                    </button>
                    <button onClick={() => deleteHook(hook.id)} disabled={deletingId === hook.id} className="p-1.5 text-stone-500 hover:text-red-700 disabled:opacity-50">
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

// ─── Messages Tab ───────────────────────────────────────────────────────────

function MessagesTab({ messages, setMessages }: { messages: Message[]; setMessages: React.Dispatch<React.SetStateAction<Message[]>> }) {
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({ message_text: '', type: 'education' })
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  async function save() {
    setSaving(true)
    if (editingId) {
      const res = await fetch(`/api/content/messages/${editingId}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
      })
      if (res.ok) {
        const updated = await res.json()
        setMessages(m => m.map(x => x.id === editingId ? updated : x))
        setEditingId(null)
      }
    } else {
      const res = await fetch('/api/content/messages', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
      })
      if (res.ok) {
        const created = await res.json()
        setMessages(m => [created, ...m])
        setShowForm(false)
      }
    }
    setForm({ message_text: '', type: 'education' })
    setSaving(false)
  }

  async function deleteMessage(id: string) {
    setDeletingId(id)
    await fetch(`/api/content/messages/${id}`, { method: 'DELETE' })
    setMessages(m => m.filter(x => x.id !== id))
    setDeletingId(null)
  }

  function startEdit(msg: Message) {
    setEditingId(msg.id)
    setForm({ message_text: msg.message_text, type: msg.type })
    setShowForm(false)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs text-stone-500">{messages.length} messages in library</p>
        <button
          onClick={() => { setShowForm(true); setEditingId(null); setForm({ message_text: '', type: 'education' }) }}
          className="flex items-center gap-2 bg-blue-500 hover:bg-blue-500 text-stone-50 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
        >
          <Plus size={13} /> Add Message
        </button>
      </div>

      {(showForm || editingId) && (
        <div className="bg-stone-100 border border-stone-200 rounded-xl p-4 mb-4 space-y-3">
          <div>
            <label className="block text-xs text-stone-500 mb-1">Message</label>
            <textarea
              value={form.message_text}
              onChange={e => setForm(f => ({ ...f, message_text: e.target.value }))}
              placeholder="Stress triggers cortisol, which tells the body to hold fat - especially around the belly. Training harder into that state makes it worse."
              rows={4}
              className="w-full bg-stone-200 border border-stone-300 rounded-lg px-3 py-2 text-sm text-[#1A1A1A] placeholder-stone-400 focus:outline-none focus:border-blue-500 resize-none"
            />
          </div>
          <div>
            <label className="block text-xs text-stone-500 mb-1">Type</label>
            <select
              value={form.type}
              onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
              className="bg-stone-200 border border-stone-300 rounded-lg px-3 py-2 text-sm text-[#1A1A1A] focus:outline-none focus:border-blue-500"
            >
              {MESSAGE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={save} disabled={saving || !form.message_text.trim()}
              className="flex items-center gap-1.5 bg-blue-500 hover:bg-blue-500 disabled:opacity-50 text-stone-50 text-xs font-semibold px-3 py-1.5 rounded-lg"
            >
              <Check size={12} /> {saving ? 'Saving...' : 'Save'}
            </button>
            <button onClick={() => { setShowForm(false); setEditingId(null) }} className="text-xs text-stone-500 hover:text-stone-700 flex items-center gap-1">
              <X size={12} /> Cancel
            </button>
          </div>
        </div>
      )}

      {messages.length === 0 && !showForm ? (
        <EmptyState icon={<Zap size={24} className="text-stone-500" strokeWidth={1.5} />} title="No messages yet" description="Add your first message block to start building the library." />
      ) : (
        <div className="space-y-2">
          {messages.map(msg => (
            <div key={msg.id} className="bg-stone-100 border border-stone-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full border mb-2 ${messageTypeColor(msg.type)}`}>
                    {messageTypeLabel(msg.type)}
                  </span>
                  <p className="text-sm text-[#1A1A1A] whitespace-pre-wrap">{msg.message_text}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => startEdit(msg)} className="p-1.5 text-stone-500 hover:text-stone-700">
                    <Pencil size={13} />
                  </button>
                  <button onClick={() => deleteMessage(msg.id)} disabled={deletingId === msg.id} className="p-1.5 text-stone-500 hover:text-red-700 disabled:opacity-50">
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── CTAs Tab ────────────────────────────────────────────────────────────────

function CtasTab({ ctas, setCtas }: { ctas: Cta[]; setCtas: React.Dispatch<React.SetStateAction<Cta[]>> }) {
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({ cta_text: '' })
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  async function save() {
    setSaving(true)
    if (editingId) {
      const res = await fetch(`/api/content/ctas/${editingId}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
      })
      if (res.ok) {
        const updated = await res.json()
        setCtas(c => c.map(x => x.id === editingId ? updated : x))
        setEditingId(null)
      }
    } else {
      const res = await fetch('/api/content/ctas', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
      })
      if (res.ok) {
        const created = await res.json()
        setCtas(c => [created, ...c])
        setShowForm(false)
      }
    }
    setForm({ cta_text: '' })
    setSaving(false)
  }

  async function deleteCta(id: string) {
    setDeletingId(id)
    await fetch(`/api/content/ctas/${id}`, { method: 'DELETE' })
    setCtas(c => c.filter(x => x.id !== id))
    setDeletingId(null)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs text-stone-500">{ctas.length} CTAs in library</p>
        <button
          onClick={() => { setShowForm(true); setEditingId(null); setForm({ cta_text: '' }) }}
          className="flex items-center gap-2 bg-blue-500 hover:bg-blue-500 text-stone-50 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
        >
          <Plus size={13} /> Add CTA
        </button>
      </div>

      {(showForm || editingId) && (
        <div className="bg-stone-100 border border-stone-200 rounded-xl p-4 mb-4 space-y-3">
          <div>
            <label className="block text-xs text-stone-500 mb-1">CTA</label>
            <input
              type="text"
              value={form.cta_text}
              onChange={e => setForm({ cta_text: e.target.value })}
              placeholder="Run your Performance Check-In"
              className="w-full bg-stone-200 border border-stone-300 rounded-lg px-3 py-2 text-sm text-[#1A1A1A] placeholder-stone-400 focus:outline-none focus:border-blue-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <button onClick={save} disabled={saving || !form.cta_text.trim()}
              className="flex items-center gap-1.5 bg-blue-500 hover:bg-blue-500 disabled:opacity-50 text-stone-50 text-xs font-semibold px-3 py-1.5 rounded-lg"
            >
              <Check size={12} /> {saving ? 'Saving...' : 'Save'}
            </button>
            <button onClick={() => { setShowForm(false); setEditingId(null) }} className="text-xs text-stone-500 hover:text-stone-700 flex items-center gap-1">
              <X size={12} /> Cancel
            </button>
          </div>
        </div>
      )}

      {ctas.length === 0 && !showForm ? (
        <EmptyState icon={<Zap size={24} className="text-stone-500" strokeWidth={1.5} />} title="No CTAs yet" description="Add your first call-to-action." />
      ) : (
        <div className="space-y-2">
          {ctas.map(cta => (
            <div key={cta.id} className="bg-stone-100 border border-stone-200 rounded-xl p-4 flex items-center justify-between">
              {editingId === cta.id ? (
                <div className="flex-1 flex items-center gap-2">
                  <input
                    type="text"
                    value={form.cta_text}
                    onChange={e => setForm({ cta_text: e.target.value })}
                    className="flex-1 bg-stone-200 border border-stone-300 rounded-lg px-3 py-1.5 text-sm text-[#1A1A1A] focus:outline-none focus:border-blue-500"
                  />
                  <button onClick={save} disabled={saving} className="flex items-center gap-1 bg-blue-500 hover:bg-blue-500 disabled:opacity-50 text-stone-50 text-xs font-semibold px-2.5 py-1.5 rounded-lg">
                    <Check size={12} /> {saving ? 'Saving...' : 'Save'}
                  </button>
                  <button onClick={() => setEditingId(null)} className="text-xs text-stone-500 hover:text-stone-700">
                    <X size={13} />
                  </button>
                </div>
              ) : (
                <>
                  <p className="text-sm text-[#1A1A1A]">{cta.cta_text}</p>
                  <div className="flex items-center gap-1">
                    <button onClick={() => { setEditingId(cta.id); setForm({ cta_text: cta.cta_text }); setShowForm(false) }} className="p-1.5 text-stone-500 hover:text-stone-700">
                      <Pencil size={13} />
                    </button>
                    <button onClick={() => deleteCta(cta.id)} disabled={deletingId === cta.id} className="p-1.5 text-stone-500 hover:text-red-700 disabled:opacity-50">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Generate Tab ────────────────────────────────────────────────────────────

function GenerateTab({
  hooks, messages, ctas, outputs, setOutputs, onViewOutputs,
}: {
  hooks: Hook[]
  messages: Message[]
  ctas: Cta[]
  outputs: Output[]
  setOutputs: React.Dispatch<React.SetStateAction<Output[]>>
  onViewOutputs: () => void
}) {
  const [selectedHooks, setSelectedHooks] = useState<string[]>([])
  const [selectedMessages, setSelectedMessages] = useState<string[]>([])
  const [selectedCtas, setSelectedCtas] = useState<string[]>([])
  const [platform, setPlatform] = useState('meta')
  const [generating, setGenerating] = useState(false)
  const [generatingAll, setGeneratingAll] = useState(false)
  const [result, setResult] = useState<{ generated: number } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [generateAllProgress, setGenerateAllProgress] = useState<{ platform: string; done: number; total: number } | null>(null)

  const toggle = (id: string, list: string[], setList: React.Dispatch<React.SetStateAction<string[]>>) => {
    setList(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  const variantCount = selectedHooks.length * selectedMessages.length * selectedCtas.length
  const allVariantCount = hooks.length * messages.length * ctas.length * PLATFORMS.length

  async function generate() {
    setGenerating(true)
    setError(null)
    setResult(null)
    const res = await fetch('/api/content/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hook_ids: selectedHooks, message_ids: selectedMessages, cta_ids: selectedCtas, platform }),
    })
    if (res.ok) {
      const data = await res.json()
      setResult({ generated: data.generated })
      const outRes = await fetch('/api/content/outputs')
      if (outRes.ok) setOutputs(await outRes.json())
    } else {
      const data = await res.json()
      setError(data.error ?? 'Generation failed')
    }
    setGenerating(false)
  }

  async function generateAll() {
    if (!hooks.length || !messages.length || !ctas.length) return
    setGeneratingAll(true)
    setError(null)
    setResult(null)

    const hookIds = hooks.map(h => h.id)
    const messageIds = messages.map(m => m.id)
    const ctaIds = ctas.map(c => c.id)
    let totalGenerated = 0

    for (let i = 0; i < PLATFORMS.length; i++) {
      const p = PLATFORMS[i]
      setGenerateAllProgress({ platform: p.label, done: i, total: PLATFORMS.length })
      const res = await fetch('/api/content/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hook_ids: hookIds, message_ids: messageIds, cta_ids: ctaIds, platform: p.value }),
      })
      if (res.ok) {
        const data = await res.json()
        totalGenerated += data.generated
      }
    }

    setGenerateAllProgress(null)
    setResult({ generated: totalGenerated })
    const outRes = await fetch('/api/content/outputs')
    if (outRes.ok) setOutputs(await outRes.json())
    setGeneratingAll(false)
  }

  return (
    <div className="space-y-6">
      {/* Platform selector */}
      <div>
        <label className="block text-xs text-stone-500 mb-2">Platform</label>
        <div className="flex flex-wrap gap-2">
          {PLATFORMS.map(p => (
            <button
              key={p.value}
              onClick={() => setPlatform(p.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                platform === p.value
                  ? 'bg-blue-50 border-blue-300 text-blue-500'
                  : 'bg-stone-100 border-stone-300 text-stone-600 hover:text-[#1A1A1A] hover:border-stone-400'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Hook selector */}
      <SelectableList
        label="Hooks"
        items={hooks.map(h => ({ id: h.id, label: h.hook_text, badge: categoryLabel(h.category), badgeColor: categoryColor(h.category) }))}
        selected={selectedHooks}
        onToggle={id => toggle(id, selectedHooks, setSelectedHooks)}
        onSelectAll={() => setSelectedHooks(hooks.map(h => h.id))}
        onClear={() => setSelectedHooks([])}
        emptyText="No hooks yet. Add some in the Hooks tab."
      />

      {/* Message selector */}
      <SelectableList
        label="Messages"
        items={messages.map(m => ({ id: m.id, label: m.message_text, badge: messageTypeLabel(m.type), badgeColor: messageTypeColor(m.type) }))}
        selected={selectedMessages}
        onToggle={id => toggle(id, selectedMessages, setSelectedMessages)}
        onSelectAll={() => setSelectedMessages(messages.map(m => m.id))}
        onClear={() => setSelectedMessages([])}
        emptyText="No messages yet. Add some in the Messages tab."
      />

      {/* CTA selector */}
      <SelectableList
        label="CTAs"
        items={ctas.map(c => ({ id: c.id, label: c.cta_text }))}
        selected={selectedCtas}
        onToggle={id => toggle(id, selectedCtas, setSelectedCtas)}
        onSelectAll={() => setSelectedCtas(ctas.map(c => c.id))}
        onClear={() => setSelectedCtas([])}
        emptyText="No CTAs yet. Add some in the CTAs tab."
      />

      {/* Variant count + generate */}
      <div className="bg-stone-100 border border-stone-200 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs text-stone-500 mb-0.5">Variants to generate</p>
            <p className="text-2xl font-semibold text-[#1A1A1A]">
              {variantCount > 0 ? variantCount.toLocaleString() : '-'}
            </p>
            {variantCount > 0 && (
              <p className="text-xs text-stone-500 mt-0.5">
                {selectedHooks.length} hooks × {selectedMessages.length} messages × {selectedCtas.length} CTAs
              </p>
            )}
          </div>
          <button
            onClick={generate}
            disabled={generating || generatingAll || variantCount === 0}
            className="flex items-center gap-2 bg-blue-500 hover:bg-blue-500 disabled:opacity-50 text-stone-50 font-semibold px-5 py-2.5 rounded-lg transition-colors text-sm"
          >
            <Zap size={15} />
            {generating ? 'Generating...' : 'Generate'}
          </button>
        </div>

        {error && <p className="text-xs text-red-700">{error}</p>}

        {result && (
          <div className="flex items-center justify-between bg-blue-50 border border-blue-500/20 rounded-lg px-4 py-3">
            <p className="text-sm text-blue-500 font-medium">{result.generated.toLocaleString()} pieces of content generated.</p>
            <button onClick={onViewOutputs} className="text-xs text-blue-500 hover:text-blue-700 underline">
              View Outputs
            </button>
          </div>
        )}
      </div>

      {/* Generate All */}
      {hooks.length > 0 && messages.length > 0 && ctas.length > 0 && (
        <div className="bg-stone-100 border border-stone-200 rounded-xl p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-[#1A1A1A] mb-1">Generate Everything</p>
              <p className="text-xs text-stone-600 leading-relaxed">
                Use every hook, message, and CTA across all 5 platforms in one run.
              </p>
              <p className="text-xs text-stone-500 mt-1">
                {hooks.length} hooks × {messages.length} messages × {ctas.length} CTAs × 5 platforms = <span className="text-[#1A1A1A] font-semibold">{allVariantCount.toLocaleString()} outputs</span>
              </p>
            </div>
            <button
              onClick={generateAll}
              disabled={generatingAll || generating}
              className="shrink-0 flex items-center gap-2 bg-stone-300 hover:bg-stone-400 disabled:opacity-50 text-[#1A1A1A] font-semibold px-4 py-2.5 rounded-lg transition-colors text-sm"
            >
              <Zap size={15} />
              {generatingAll ? 'Running...' : 'Generate All'}
            </button>
          </div>

          {generateAllProgress && (
            <div className="mt-4">
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-xs text-stone-600">Generating {generateAllProgress.platform}...</p>
                <p className="text-xs text-stone-500">{generateAllProgress.done}/{generateAllProgress.total} platforms</p>
              </div>
              <div className="h-1.5 bg-stone-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all duration-500"
                  style={{ width: `${(generateAllProgress.done / generateAllProgress.total) * 100}%` }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Reel generation notice */}
      <div className="bg-stone-100 border border-stone-200 rounded-xl p-5">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-stone-200 rounded-lg shrink-0">
            <Video size={18} className="text-blue-500" strokeWidth={1.5} />
          </div>
          <div>
            <p className="text-sm font-semibold text-[#1A1A1A] mb-1">Reel Generation</p>
            <p className="text-xs text-stone-600 leading-relaxed">
              Once you have outputs, you can generate AI avatar reels from any piece of copy - your face, your voice, no camera required.
              Powered by ElevenLabs (voice clone) and HeyGen (avatar video). Set up your avatar and voice clone first, then reels are one click from the Outputs tab.
            </p>
            <p className="text-xs text-stone-500 mt-2">
              Requires: <span className="text-stone-600">ELEVENLABS_API_KEY, ELEVENLABS_VOICE_ID, HEYGEN_API_KEY, HEYGEN_AVATAR_ID</span> in Vercel env vars.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Outputs Tab ─────────────────────────────────────────────────────────────

function OutputsTab({ outputs, setOutputs }: { outputs: Output[]; setOutputs: React.Dispatch<React.SetStateAction<Output[]>> }) {
  const [filterPlatform, setFilterPlatform] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [generatingReelId, setGeneratingReelId] = useState<string | null>(null)
  const [reelScript, setReelScript] = useState<{ [id: string]: string }>({})
  const [showScriptFor, setShowScriptFor] = useState<string | null>(null)
  const [pollingIds, setPollingIds] = useState<Set<string>>(new Set())
  const [showGraphicFor, setShowGraphicFor] = useState<string | null>(null)
  const [graphicStyle, setGraphicStyle] = useState<{ [id: string]: string }>({})
  const [showCarouselFor, setShowCarouselFor] = useState<string | null>(null)
  const [carouselSlides, setCarouselSlides] = useState<{ [id: string]: { slide: number; text: string; style: string }[] }>({})
  const [generatingCarousel, setGeneratingCarousel] = useState<string | null>(null)
  const [downloadingCarousel, setDownloadingCarousel] = useState<string | null>(null)

  const GRAPHIC_STYLES = [
    { value: 'quote', label: 'Quote Card' },
    { value: 'statement', label: 'Statement Card' },
    { value: 'question', label: 'Question Card' },
  ]

  function graphicUrl(text: string, style: string) {
    return `/api/content/graphic?style=${style}&text=${encodeURIComponent(text)}`
  }

  async function downloadGraphic(text: string, style: string, outputId: string) {
    const url = graphicUrl(text, style)
    const res = await fetch(url)
    const blob = await res.blob()
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `body-recode-${style}-${outputId.slice(0, 8)}.png`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  async function generateCarousel(outputId: string, contentText: string) {
    setGeneratingCarousel(outputId)
    const res = await fetch('/api/content/carousel-slides', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content_text: contentText }),
    })
    if (res.ok) {
      const data = await res.json()
      setCarouselSlides(s => ({ ...s, [outputId]: data.slides }))
      setShowCarouselFor(outputId)
      setShowGraphicFor(null)
    }
    setGeneratingCarousel(null)
  }

  async function downloadCarouselZip(outputId: string) {
    const slides = carouselSlides[outputId]
    if (!slides?.length) return
    setDownloadingCarousel(outputId)

    const JSZip = (await import('jszip')).default
    const zip = new JSZip()

    for (const slide of slides) {
      const url = graphicUrl(slide.text, slide.style)
      const res = await fetch(url)
      const blob = await res.blob()
      const arrayBuffer = await blob.arrayBuffer()
      zip.file(`slide-${slide.slide}.png`, arrayBuffer)
    }

    const zipBlob = await zip.generateAsync({ type: 'blob' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(zipBlob)
    a.download = `body-recode-carousel-${outputId.slice(0, 8)}.zip`
    a.click()
    URL.revokeObjectURL(a.href)
    setDownloadingCarousel(null)
  }

  const filtered = outputs.filter(o => {
    if (filterPlatform !== 'all' && o.platform !== filterPlatform) return false
    if (filterStatus !== 'all' && o.status !== filterStatus) return false
    return true
  })

  async function updateStatus(id: string, status: string) {
    const res = await fetch(`/api/content/outputs/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }),
    })
    if (res.ok) {
      const updated = await res.json()
      setOutputs(o => o.map(x => x.id === id ? { ...x, status: updated.status } : x))
    }
  }

  async function deleteOutput(id: string) {
    await fetch(`/api/content/outputs/${id}`, { method: 'DELETE' })
    setOutputs(o => o.filter(x => x.id !== id))
  }

  async function copyText(id: string, text: string) {
    await navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 1500)
  }

  const pollReel = useCallback(async (outputId: string) => {
    const interval = setInterval(async () => {
      const res = await fetch(`/api/content/reel-status?output_id=${outputId}`)
      if (res.ok) {
        const data = await res.json()
        if (data.video_status === 'ready' || data.video_status === 'failed') {
          setOutputs(o => o.map(x => x.id === outputId ? { ...x, video_status: data.video_status, video_url: data.video_url ?? null } : x))
          setPollingIds(p => { const n = new Set(p); n.delete(outputId); return n })
          clearInterval(interval)
        }
      }
    }, 8000)
  }, [setOutputs])

  async function generateReel(output: Output) {
    const script = reelScript[output.id] ?? output.content_text
    setGeneratingReelId(output.id)
    const res = await fetch('/api/content/generate-reel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ output_id: output.id, script }),
    })
    if (res.ok) {
      setOutputs(o => o.map(x => x.id === output.id ? { ...x, video_status: 'rendering' } : x))
      setShowScriptFor(null)
      setPollingIds(p => new Set([...p, output.id]))
      pollReel(output.id)
    }
    setGeneratingReelId(null)
  }

  return (
    <div>
      {/* Filters */}
      <div className="flex items-center gap-3 mb-4">
        <select
          value={filterPlatform}
          onChange={e => setFilterPlatform(e.target.value)}
          className="bg-stone-100 border border-stone-200 rounded-lg px-3 py-1.5 text-xs text-stone-700 focus:outline-none focus:border-blue-500"
        >
          <option value="all">All platforms</option>
          {PLATFORMS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
        </select>
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="bg-stone-100 border border-stone-200 rounded-lg px-3 py-1.5 text-xs text-stone-700 focus:outline-none focus:border-blue-500"
        >
          <option value="all">All statuses</option>
          {OUTPUT_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
        <p className="text-xs text-stone-500 ml-auto">{filtered.length} outputs</p>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={<Clapperboard size={24} className="text-stone-500" strokeWidth={1.5} />} title="No outputs yet" description="Go to Generate and create your first batch of content." />
      ) : (
        <div className="space-y-3">
          {filtered.map(output => (
            <div key={output.id} className="bg-stone-100 border border-stone-200 rounded-xl p-4">
              {/* Top row */}
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-medium text-stone-600 bg-stone-200 border border-stone-300 px-2 py-0.5 rounded-full">
                  {platformLabel(output.platform)}
                </span>
                {output.hook?.category && (
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${categoryColor(output.hook.category)}`}>
                    {categoryLabel(output.hook.category)}
                  </span>
                )}
                <StatusDropdown status={output.status} onChange={s => updateStatus(output.id, s)} />
                <div className="ml-auto flex items-center gap-1">
                  <button onClick={() => copyText(output.id, output.content_text)} className="p-1.5 text-stone-500 hover:text-stone-700 transition-colors">
                    {copiedId === output.id ? <Check size={13} className="text-blue-500" /> : <Copy size={13} />}
                  </button>
                  <button onClick={() => deleteOutput(output.id)} className="p-1.5 text-stone-500 hover:text-red-700 transition-colors">
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>

              {/* Content */}
              <p className="text-sm text-[#1A1A1A] whitespace-pre-wrap mb-3">{output.content_text}</p>

              {/* Graphic section */}
              <div className="pt-2 border-t border-stone-200 mb-2">
                {showGraphicFor === output.id ? (
                  <div className="space-y-3 mt-2">
                    {/* Style picker */}
                    <div className="flex items-center gap-2">
                      {GRAPHIC_STYLES.map(s => (
                        <button
                          key={s.value}
                          onClick={() => setGraphicStyle(g => ({ ...g, [output.id]: s.value }))}
                          className={`px-3 py-1 rounded-lg text-xs font-medium border transition-colors ${
                            (graphicStyle[output.id] ?? 'quote') === s.value
                              ? 'bg-blue-50 border-blue-300 text-blue-500'
                              : 'bg-stone-200 border-stone-300 text-stone-600 hover:text-[#1A1A1A]'
                          }`}
                        >
                          {s.label}
                        </button>
                      ))}
                      <button onClick={() => setShowGraphicFor(null)} className="ml-auto text-xs text-stone-500 hover:text-stone-700">
                        <X size={13} />
                      </button>
                    </div>
                    {/* Preview */}
                    <div className="rounded-xl overflow-hidden border border-stone-300 w-64 h-64">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={graphicUrl(output.content_text, graphicStyle[output.id] ?? 'quote')}
                        alt="Graphic preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <button
                      onClick={() => downloadGraphic(output.content_text, graphicStyle[output.id] ?? 'quote', output.id)}
                      className="flex items-center gap-1.5 bg-blue-500 hover:bg-blue-500 text-stone-50 text-xs font-semibold px-3 py-1.5 rounded-lg"
                    >
                      <Download size={12} /> Download 1080×1080 PNG
                    </button>
                  </div>
                ) : showCarouselFor === output.id && carouselSlides[output.id] ? (
                  <div className="space-y-3 mt-2">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold text-stone-600">{carouselSlides[output.id].length} slides</p>
                      <button onClick={() => setShowCarouselFor(null)} className="text-stone-500 hover:text-stone-700">
                        <X size={13} />
                      </button>
                    </div>
                    {/* Slide previews */}
                    <div className="flex gap-2 overflow-x-auto pb-1">
                      {carouselSlides[output.id].map(slide => (
                        <div key={slide.slide} className="shrink-0">
                          <div className="w-28 h-28 rounded-lg overflow-hidden border border-stone-300">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={graphicUrl(slide.text, slide.style)}
                              alt={`Slide ${slide.slide}`}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <p className="text-xs text-stone-400 text-center mt-1">{slide.slide}</p>
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={() => downloadCarouselZip(output.id)}
                      disabled={downloadingCarousel === output.id}
                      className="flex items-center gap-1.5 bg-blue-500 hover:bg-blue-500 disabled:opacity-50 text-stone-50 text-xs font-semibold px-3 py-1.5 rounded-lg"
                    >
                      <Download size={12} />
                      {downloadingCarousel === output.id ? 'Packaging...' : `Download ${carouselSlides[output.id].length} slides as ZIP`}
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 mt-2">
                    <button
                      onClick={() => setShowGraphicFor(output.id)}
                      className="flex items-center gap-1.5 text-xs text-stone-500 hover:text-stone-700 transition-colors"
                    >
                      <Image size={12} /> Create Graphic
                    </button>
                    <span className="text-stone-300 text-xs">·</span>
                    <button
                      onClick={() => generateCarousel(output.id, output.content_text)}
                      disabled={generatingCarousel === output.id}
                      className="flex items-center gap-1.5 text-xs text-stone-500 hover:text-stone-700 transition-colors disabled:opacity-50"
                    >
                      <Clapperboard size={12} />
                      {generatingCarousel === output.id ? 'Building slides...' : 'Create Carousel'}
                    </button>
                  </div>
                )}
              </div>

              {/* Reel section */}
              {output.video_status === 'ready' && output.video_url ? (
                <div className="flex items-center gap-2 mt-2 pt-2 border-t border-stone-200">
                  <Video size={13} className="text-blue-500" />
                  <span className="text-xs text-blue-500 font-medium">Reel ready</span>
                  <a href={output.video_url} target="_blank" rel="noopener noreferrer"
                    className="ml-auto flex items-center gap-1 text-xs text-stone-600 hover:text-[#1A1A1A]"
                  >
                    <Download size={12} /> Download
                  </a>
                </div>
              ) : output.video_status === 'rendering' || pollingIds.has(output.id) ? (
                <div className="flex items-center gap-2 mt-2 pt-2 border-t border-stone-200">
                  <RefreshCw size={13} className="text-stone-500 animate-spin" />
                  <span className="text-xs text-stone-500">Rendering reel...</span>
                </div>
              ) : output.video_status === 'failed' ? (
                <div className="flex items-center gap-2 mt-2 pt-2 border-t border-stone-200">
                  <span className="text-xs text-red-700">Reel generation failed</span>
                  <button onClick={() => setShowScriptFor(output.id)} className="ml-auto text-xs text-stone-500 hover:text-stone-700">
                    Retry
                  </button>
                </div>
              ) : (
                <div className="mt-2 pt-2 border-t border-stone-200">
                  {showScriptFor === output.id ? (
                    <div className="space-y-2">
                      <label className="block text-xs text-stone-500">Script for reel (edit if needed)</label>
                      <textarea
                        value={reelScript[output.id] ?? output.content_text}
                        onChange={e => setReelScript(s => ({ ...s, [output.id]: e.target.value }))}
                        rows={3}
                        className="w-full bg-stone-200 border border-stone-300 rounded-lg px-3 py-2 text-xs text-[#1A1A1A] focus:outline-none focus:border-blue-500 resize-none"
                      />
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => generateReel(output)}
                          disabled={generatingReelId === output.id}
                          className="flex items-center gap-1.5 bg-blue-500 hover:bg-blue-500 disabled:opacity-50 text-stone-50 text-xs font-semibold px-3 py-1.5 rounded-lg"
                        >
                          <Video size={12} /> {generatingReelId === output.id ? 'Submitting...' : 'Generate Reel'}
                        </button>
                        <button onClick={() => setShowScriptFor(null)} className="text-xs text-stone-500 hover:text-stone-700">
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowScriptFor(output.id)}
                      className="flex items-center gap-1.5 text-xs text-stone-500 hover:text-stone-700 transition-colors"
                    >
                      <Video size={12} /> Generate Reel
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Shared sub-components ───────────────────────────────────────────────────

function EmptyState({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="bg-stone-100 border border-dashed border-stone-300 rounded-xl p-12 text-center">
      <div className="flex justify-center mb-4">
        <div className="p-3 bg-stone-200 rounded-xl">{icon}</div>
      </div>
      <p className="text-stone-600 text-sm font-medium mb-1">{title}</p>
      <p className="text-stone-400 text-xs">{description}</p>
    </div>
  )
}

function ScoreSelector({ score, onChange }: { score: number; onChange: (s: number) => void }) {
  const [open, setOpen] = useState(false)
  const { label, color } = SCORE_LABELS[score] ?? SCORE_LABELS[0]
  return (
    <div className="relative">
      <button onClick={() => setOpen(o => !o)} className={`flex items-center gap-1 text-xs ${color}`}>
        {label} <ChevronDown size={10} />
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 bg-stone-200 border border-stone-300 rounded-lg overflow-hidden z-10 w-28 shadow-xl">
          {Object.entries(SCORE_LABELS).map(([val, { label: l, color: c }]) => (
            <button
              key={val}
              onClick={() => { onChange(Number(val)); setOpen(false) }}
              className={`w-full text-left px-3 py-1.5 text-xs hover:bg-stone-300 ${c}`}
            >
              {l}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function StatusDropdown({ status, onChange }: { status: string; onChange: (s: string) => void }) {
  const [open, setOpen] = useState(false)
  const current = OUTPUT_STATUSES.find(s => s.value === status) ?? OUTPUT_STATUSES[0]
  return (
    <div className="relative">
      <button onClick={() => setOpen(o => !o)} className={`flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border ${current.color}`}>
        {current.label} <ChevronDown size={10} />
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 bg-stone-200 border border-stone-300 rounded-lg overflow-hidden z-10 w-28 shadow-xl">
          {OUTPUT_STATUSES.map(s => (
            <button
              key={s.value}
              onClick={() => { onChange(s.value); setOpen(false) }}
              className="w-full text-left px-3 py-1.5 text-xs hover:bg-stone-300 text-stone-700"
            >
              {s.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function SelectableList({
  label, items, selected, onToggle, onSelectAll, onClear, emptyText,
}: {
  label: string
  items: { id: string; label: string; badge?: string; badgeColor?: string }[]
  selected: string[]
  onToggle: (id: string) => void
  onSelectAll: () => void
  onClear: () => void
  emptyText: string
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="text-xs text-stone-500 font-medium">{label} ({selected.length} selected)</label>
        {items.length > 0 && (
          <div className="flex items-center gap-2">
            <button onClick={onSelectAll} className="text-xs text-stone-500 hover:text-blue-500">All</button>
            <button onClick={onClear} className="text-xs text-stone-500 hover:text-stone-700">None</button>
          </div>
        )}
      </div>
      {items.length === 0 ? (
        <p className="text-xs text-stone-400 italic">{emptyText}</p>
      ) : (
        <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
          {items.map(item => {
            const active = selected.includes(item.id)
            return (
              <button
                key={item.id}
                onClick={() => onToggle(item.id)}
                className={`w-full text-left flex items-start gap-2.5 px-3 py-2 rounded-lg border text-xs transition-colors ${
                  active
                    ? 'bg-blue-50 border-blue-200 text-[#1A1A1A]'
                    : 'bg-stone-100 border-stone-200 text-stone-600 hover:border-stone-300 hover:text-stone-700'
                }`}
              >
                <div className={`w-3.5 h-3.5 rounded border shrink-0 mt-0.5 flex items-center justify-center ${active ? 'bg-blue-500 border-blue-500' : 'border-stone-400'}`}>
                  {active && <Check size={9} className="text-stone-50" strokeWidth={3} />}
                </div>
                <span className="flex-1 leading-relaxed line-clamp-2">{item.label}</span>
                {item.badge && (
                  <span className={`shrink-0 text-xs font-medium px-1.5 py-0.5 rounded-full border ${item.badgeColor ?? 'bg-stone-300 text-stone-600 border-stone-400'}`}>
                    {item.badge}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}


// ─── Cards Tab ──────────────────────────────────────────────────────────────

const CARDS = [
  { file: '01-logo-only.png', label: 'Logo Only' },
  { file: '02-statement.png', label: 'Statement' },
  { file: '03-question.png', label: 'Question' },
  { file: '04-insight.png', label: 'Insight' },
  { file: '05-body-state-red.png', label: 'Body State - Depleted' },
  { file: '06-body-state-amber.png', label: 'Body State - Transitioning' },
  { file: '07-body-state-teal.png', label: 'Body State - Ready' },
  { file: '08-photo-split.png', label: 'Photo Split' },
  { file: '09-photo-quote.png', label: 'Photo Quote' },
  { file: '10-photo-top.png', label: 'Photo Top' },
  { file: '11-photo-right.png', label: 'Photo Right' },
  { file: '12-carousel-hook.png', label: 'Carousel Hook' },
  { file: '13-carousel-slide.png', label: 'Carousel Slide' },
  { file: '14-carousel-cta.png', label: 'Carousel CTA' },
  { file: '15-scorecard-cta.png', label: 'Scorecard CTA' },
  { file: '16-founder.png', label: 'Founder' },
]

function CardsTab() {
  function handleDownload(file: string) {
    const a = document.createElement('a')
    a.href = `/cards/${file}`
    a.download = `body-recode-${file}`
    a.click()
  }

  return (
    <div>
      <p className="text-stone-600 text-sm mb-6">16 card templates. Download any card as a 1080×1080 PNG ready to post.</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {CARDS.map(card => (
          <div key={card.file} className="bg-stone-100 border border-stone-200 rounded-xl overflow-hidden">
            <div className="aspect-square bg-stone-50 overflow-hidden">
              <img
                src={`/cards/${card.file}`}
                alt={card.label}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="p-3">
              <p className="text-xs text-stone-600 mb-2 truncate">{card.label}</p>
              <button
                onClick={() => handleDownload(card.file)}
                className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 bg-stone-200 hover:bg-stone-300 border border-stone-300 rounded-lg text-xs text-stone-700 transition-colors"
              >
                <Download size={11} />
                Download PNG
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
