import LoginForm from './login-form'

export default async function PortalLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string }>
}) {
  const { redirect } = await searchParams
  const redirectTo = redirect || '/portal'

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <img
            src="https://bodyrecode.au/logo-teal.png"
            width="120"
            alt="Body Recode"
            className="mx-auto mb-8"
          />
          <h1 className="text-2xl font-bold text-white mb-2">Client Portal</h1>
          <p className="text-stone-400 text-sm">Enter your email to receive a sign-in link.</p>
        </div>
        <LoginForm redirect={redirectTo} />
      </div>
    </div>
  )
}
