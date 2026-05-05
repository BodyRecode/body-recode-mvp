import LoginForm from './login-form'

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

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <img
            src="https://bodyrecode.au/logo-teal.png"
            width="280"
            alt="Body Recode"
            className="mx-auto mb-8"
          />
          <h1 className="text-2xl font-bold text-white mb-2">Client Portal</h1>
          <p className="text-[#a8a29e] text-sm">Sign in to your coaching portal.</p>
        </div>
        {errorMessage && (
          <div className="mb-6 bg-red-950/30 border border-red-800 rounded-xl px-4 py-3">
            <p className="text-sm text-red-400">{errorMessage}</p>
          </div>
        )}
        <LoginForm redirect={redirectTo} />
      </div>
    </div>
  )
}
