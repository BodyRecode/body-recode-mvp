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
    'w-full bg-[#14171D] border border-[#2A2F39] text-[#FAFAF8] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#2A2F39] transition-colors placeholder-[#676D76]'

  // Success state - show the link
  if (intakeLink) {
    return (
      <div className="max-w-lg mx-auto">
        <div className="br-page-header sticky top-0 z-20 mb-7 pt-4 pb-3.5 border-b border-[#2A2F39] bg-[#14171D]/[0.88] backdrop-blur-md print:static print:bg-transparent">
          <h1 className="text-2xl font-semibold">Client added</h1>
          <p className="text-[#8A9099] text-sm mt-1">{name} has been created</p>
        </div>

        <div className="bg-[#14171D] br-card p-6 mb-4">
          <p className="text-[12.5px] text-[#8A9099] mb-3">Intake link</p>
          <p className="text-[#FAFAF8] text-sm mb-1">
            Send this link to <span className="text-[#FAFAF8] font-medium">{name}</span> to complete their foundational intake.
            A CFFS will be generated automatically once they submit.
          </p>

          <div className="mt-4 bg-[#0B0D10] rounded-lg px-4 py-3 flex items-center gap-3">
            <p className="text-[#8A9099] text-[12.5px] font-mono flex-1 truncate">{intakeLink}</p>
            <button
              onClick={copyLink}
              className="shrink-0 text-[12.5px] font-medium px-3 py-1.5 rounded-md border border-[#2A2F39] text-[#FAFAF8] hover:border-[#8A9099] hover:text-[#FAFAF8] transition-colors"
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
            className="text-sm px-4 py-2.5 border border-[#2A2F39] text-[#FAFAF8] rounded-lg br-card-hover transition-shadow"
          >
            Add another
          </Link>
          <Link
            href={`/dashboard/clients/${clientId}`}
            className="flex-1 text-center text-sm px-4 py-2.5 bg-[#14171D] text-[#FAFAF8] font-medium rounded-lg hover:bg-[#0B0D10] transition-colors"
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
        <div className="flex items-center gap-2 text-[#8A9099] text-sm br-page-header sticky top-0 z-20 mb-7 pt-4 pb-3.5 border-b border-[#2A2F39] bg-[#14171D]/[0.88] backdrop-blur-md print:static print:bg-transparent">
          <Link href="/dashboard" className="hover:text-[#FAFAF8] transition-colors">Clients</Link>
          <span>/</span>
          <span className="text-[#FAFAF8]">New client</span>
        </div>
        <h1 className="text-2xl font-semibold">Add client</h1>
        <p className="text-[#8A9099] text-sm mt-1">
          Enter their details and you&apos;ll get a unique intake link to send them.
        </p>
      </div>

      <div className="bg-[#14171D] br-card p-6 space-y-4">
        <div>
          <label className="block text-sm text-[#FAFAF8] mb-1.5">
            Full name <span className="text-[#676D76]">*</span>
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
          <label className="block text-sm text-[#FAFAF8] mb-1.5">
            Email <span className="text-[#676D76] text-[12.5px]">(optional)</span>
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
          <label className="block text-sm text-[#FAFAF8] mb-1.5">
            Mobile <span className="text-[#676D76] text-[12.5px]">(optional - for SMS notifications)</span>
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

      {error && <p className="text-[#D4817E] text-sm mt-3">{error}</p>}

      <div className="mt-4 flex gap-3">
        <Link
          href="/dashboard"
          className="px-5 py-2.5 rounded-lg text-sm border border-[#2A2F39] text-[#FAFAF8] br-card-hover transition-shadow"
        >
          Cancel
        </Link>
        <button
          onClick={handleCreate}
          disabled={loading}
          className="flex-1 px-5 py-2.5 rounded-lg text-sm bg-[#14171D] text-[#FAFAF8] font-medium hover:bg-[#0B0D10] transition-colors disabled:opacity-50"
        >
          {loading ? 'Creating…' : 'Create client & generate link'}
        </button>
      </div>
    </div>
  )
}
