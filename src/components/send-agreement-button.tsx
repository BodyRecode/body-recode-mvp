'use client'

interface Props {
  clientId: string
  agreementStatus: 'none' | 'pending' | 'signed'
  agreementSentAt?: string | null
}

export default function SendAgreementButton({ agreementStatus }: Props) {
  if (agreementStatus === 'signed') {
    return (
      <span className="text-xs text-teal-400 bg-teal-400/10 border border-teal-400/20 px-2.5 py-1 rounded-full">
        Case Study Agreement signed
      </span>
    )
  }

  if (agreementStatus === 'pending') {
    return (
      <span className="text-xs text-amber-400 bg-amber-400/10 border border-amber-400/20 px-2.5 py-1 rounded-full">
        Case Study Agreement waiting in client portal
      </span>
    )
  }

  return (
    <span className="text-xs text-stone-500 bg-stone-800/40 border border-stone-700 px-2.5 py-1 rounded-full">
      Agreement will appear in portal once Founding Client is set
    </span>
  )
}
