'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Send } from 'lucide-react'

interface Props {
  leadId: string
  leadName: string
  leadEmail: string
}

export default function InboxCompose({ leadId, leadName, leadEmail }: Props) {
  const router = useRouter()
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)

  async function send() {
    if (!subject.trim() || !message.trim()) {
      setError('Subject and message are required')
      return
    }
    setSending(true)
    setError('')

    try {
      const res = await fetch(`/api/inbox/${leadId}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, message }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      setSent(true)
      setSubject('')
      setMessage('')
      setTimeout(() => {
        setSent(false)
        router.refresh()
      }, 1500)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="bg-stone-900 border border-stone-800 rounded-xl overflow-hidden">
      <div className="px-4 py-2.5 border-b border-stone-800">
        <div className="flex items-center gap-2 text-xs text-stone-500">
          <span>To:</span>
          <span className="text-stone-300">{leadName} &lt;{leadEmail}&gt;</span>
        </div>
      </div>
      <div className="px-4 py-2.5 border-b border-stone-800">
        <input
          type="text"
          value={subject}
          onChange={e => setSubject(e.target.value)}
          placeholder="Subject"
          className="w-full bg-transparent text-sm text-white placeholder-stone-600 focus:outline-none"
        />
      </div>
      <textarea
        value={message}
        onChange={e => setMessage(e.target.value)}
        placeholder="Write your message..."
        rows={4}
        className="w-full bg-transparent px-4 py-3 text-sm text-white placeholder-stone-600 focus:outline-none resize-none"
      />
      <div className="px-4 py-3 border-t border-stone-800 flex items-center justify-between">
        {error && <p className="text-red-400 text-xs">{error}</p>}
        {sent && <p className="text-teal-400 text-xs">Sent.</p>}
        {!error && !sent && <span />}
        <button
          onClick={send}
          disabled={sending}
          className="flex items-center gap-2 bg-teal-500 hover:bg-teal-400 disabled:opacity-50 text-stone-950 text-xs font-semibold px-4 py-2 rounded-lg transition-colors"
        >
          <Send size={12} />
          {sending ? 'Sending...' : 'Send'}
        </button>
      </div>
    </div>
  )
}
