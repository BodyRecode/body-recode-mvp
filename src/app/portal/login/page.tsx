import LoginForm from './login-form'
import { brand } from '@/config/tenant'
import { BrandMark } from '@/components/brand-mark'

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
    <div className="min-h-screen bg-[#FFFFFF] text-[#0F1115] flex flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm">
        {/* THE RETIRED MARK WAS STILL HERE, and this is the first thing every
            client sees. A remote PNG of the old helix with "decode, rewire,
            rebuild" under it, a tagline that has not been the positioning for
            months. The drawn mark is the same one the coach sign-in uses, it
            needs no network request, and it cannot 404 the way logo-white.png
            already does. 23 Sep 2026. */}
        <div className="mb-9 flex justify-center">
          <BrandMark tone="dark" size="lg" name={t.name} />
        </div>
        <div className="text-center mb-8">
          <p className="text-[11px] font-medium uppercase" style={{ letterSpacing: '0.18em', color: '#9CA2AB' }}>
            Your portal
          </p>
          <h1 className="text-[34px] leading-[1.05] font-semibold tracking-[-0.03em] text-[#0F1115] mt-3">
            Sign in
          </h1>
          <p className="text-[13.5px] text-[#6E747D] mt-3 leading-relaxed">
            Your plan, your reads and everything you have sent us, in one place.
          </p>
        </div>
        {errorMessage && (
          <div className="mb-6 bg-[#FBF1F1] border border-[#E8C9C9] rounded-xl px-4 py-3">
            <p className="text-[13.5px] text-[#8F2D2D]">{errorMessage}</p>
          </div>
        )}
        <LoginForm redirect={redirectTo} />
      </div>
    </div>
  )
}
