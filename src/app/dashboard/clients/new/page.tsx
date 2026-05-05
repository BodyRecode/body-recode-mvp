'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import SendEmailButton from '@/components/send-email-button'

export default function NewClientPage() {
  const router = useRouter()
  const supabase = createClient()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [intakeLink, setIntakeLink] = useState('')
  const [intakeToken, setIntakeToken] = useState('')
  const [clientId, setClientId] = useState('')
  const [copied, setCopied] = useState(false)

  async function handleCreate() {
    if (!name.trim()) {
      setError('Client name is required')
      return
    }
    setLoading(true)
    setError('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }

    // Create client record
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .insert({ coach_id: user.id, name: name.trim(), email: email.trim() || null, phone: phone.trim() || null, active: true })
      .select()
      .single()

    if (clientError || !client) {
      setError('Failed to create client. Please try again.')
      setLoading(false)
      return
    }

    // Create intake invitation
    const { data: invitation, error: invError } = await supabase
      .from('intake_invitations')
      .insert({ client_id: client.id })
      .select()
      .single()

    if (invError || !invitation) {
      setError('Client created but failed to generate intake link.')
      setLoading(false)
      return
    }

    setClientId(client.id)
    setIntakeToken(invitation.token)
    setIntakeLink(`${window.location.origin}/intake/${invitation.token}`)
    setLoading(false)
  }

  function copyLink() {
    navigator.clipboard.writeText(intakeLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const inputClass =
    'w-full bg-stone-900 border border-stone-700 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-stone-500 transition-colors placeholder-stone-600'

  // Success state - show the link
  if (intakeLink) {
    return (
      <div className="max-w-lg mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold">Client added</h1>
          <p className="text-stone-400 text-sm mt-1">{name} has been created</p>
        </div>

        <div className="bg-stone-900 border border-stone-800 rounded-xl p-6 mb-4">
          <p className="text-xs uppercase tracking-wider text-stone-500 mb-3">Intake link</p>
          <p className="text-stone-300 text-sm mb-1">
            Send this link to <span className="text-white font-medium">{name}</span> to complete their foundational intake.
            A CFFS will be generated automatically once they submit.
          </p>

          <div className="mt-4 bg-stone-950 rounded-lg px-4 py-3 flex items-center gap-3">
            <p className="text-stone-400 text-xs font-mono flex-1 truncate">{intakeLink}</p>
            <button
              onClick={copyLink}
              className="shrink-0 text-xs font-medium px-3 py-1.5 rounded-md border border-stone-600 text-stone-300 hover:border-stone-400 hover:text-white transition-colors"
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>

        <div className="flex gap-3 flex-wrap">
          {email && (
            <SendEmailButton
              clientId={clientId}
              clientName={name}
              clientEmail={email}
              intakeToken={intakeToken}
              variant="outline"
            />
          )}
          <Link
            href="/dashboard/clients/new"
            onClick={() => {
              setName('')
              setEmail('')
              setIntakeLink('')
              setIntakeToken('')
              setClientId('')
            }}
            className="text-sm px-4 py-2.5 border border-stone-700 text-stone-300 rounded-lg hover:border-stone-500 transition-colors"
          >
            Add another
          </Link>
          <Link
            href={`/dashboard/clients/${clientId}`}
            className="flex-1 text-center text-sm px-4 py-2.5 bg-white text-stone-950 font-medium rounded-lg hover:bg-stone-100 transition-colors"
          >
            View client
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-2 text-stone-500 text-sm mb-2">
          <Link href="/dashboard" className="hover:text-stone-300 transition-colors">Clients</Link>
          <span>/</span>
          <span className="text-stone-300">New client</span>
        </div>
        <h1 className="text-2xl font-semibold">Add client</h1>
        <p className="text-stone-400 text-sm mt-1">
          Enter their details and you&apos;ll get a unique intake link to send them.
        </p>
      </div>

      <div className="bg-stone-900 border border-stone-800 rounded-xl p-6 space-y-4">
        <div>
          <label className="block text-sm text-stone-300 mb-1.5">
            Full name <span className="text-stone-600">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleCreate()}
            placeholder="e.g. Sarah Johnson"
            className={inputClass}
            autoFocus
          />
        </div>

        <div>
          <label className="block text-sm text-stone-300 mb-1.5">
            Email <span className="text-stone-600 text-xs">(optional)</span>
          </label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleCreate()}
            placeholder="e.g. sarah@example.com"
            className={inputClass}
          />
        </div>

        <div>
          <label className="block text-sm text-stone-300 mb-1.5">
            Mobile <span className="text-stone-600 text-xs">(optional - for SMS notifications)</span>
          </label>
          <input
            type="tel"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleCreate()}
            placeholder="e.g. +61 400 000 000"
            className={inputClass}
          />
        </div>
      </div>

      {error && <p className="text-red-400 text-sm mt-3">{error}</p>}

      <div className="mt-4 flex gap-3">
        <Link
          href="/dashboard"
          className="px-5 py-2.5 rounded-lg text-sm border border-stone-700 text-stone-300 hover:border-stone-500 transition-colors"
        >
          Cancel
        </Link>
        <button
          onClick={handleCreate}
          disabled={loading}
          className="flex-1 px-5 py-2.5 rounded-lg text-sm bg-white text-stone-950 font-medium hover:bg-stone-100 transition-colors disabled:opacity-50"
        >
          {loading ? 'Creating…' : 'Create client & generate link'}
        </button>
      </div>
    </div>
  )
}
