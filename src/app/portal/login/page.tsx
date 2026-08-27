import LoginForm from './login-form'
import { brand } from '@/config/tenant'

export default async function PortalLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string; error?: string; email?: string }>
}) {
  const { redirect, error, email } = await searchParams
  const redirectTo = redirect || '/portal'
  const errorMessage = error === 'no_client'
    ? `No client account found for ${email || 'this email'}. Contact your coach.`
    : error === 'session_failed'
    ? 'Sign-in link expired or already used. Please request a new one.'
    : error === 'no_code'
    ? 'Invalid sign-in link. Please request a new one.'
    : null

  const t = brand()

  return (
    <div className="min-h-screen bg-[#FFFFFF] text-[#141821] flex flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <img
            src={`${t.marketingDomain}${t.logoUrlLight}`}
            width="280"
            alt={t.name}
            className="mx-auto mb-8"
          />
          <h1 className="text-2xl font-bold text-[#141821] mb-2">Client Portal</h1>
          <p className="text-[#666D7A] text-sm">Sign in to your coaching portal.</p>
        </div>
        {errorMessage && (
          <div className="mb-6 bg-[#FDEDED] border border-[#F5C9C9] rounded-xl px-4 py-3">
            <p className="text-sm text-[#C82626]">{errorMessage}</p>
          </div>
        )}
        <LoginForm redirect={redirectTo} />
      </div>
    </div>
  )
}
