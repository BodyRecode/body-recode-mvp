// Funnel B product launch gating.
//
// Challenge / Blueprint / Membership are PRE-LAUNCH (waitlist mode) until their
// respective NEXT_PUBLIC_*_LIVE flag is exactly the string 'true'. Flip the flag
// in the environment (Vercel / .env.local) to turn live enrollment/checkout back
// on without a code change.
//
// Why a flag and not deletion: the full live pages (enroll form / Stripe checkout)
// stay intact behind the flag, so launch day is one env change, and the waitlist
// built in the meantime becomes the launch list.
//
// NB these are read in client components, so they MUST be referenced as static
// NEXT_PUBLIC_* literals (Next inlines them at build time); do not access via a
// computed key.

export type LaunchProduct = 'challenge' | 'blueprint' | 'membership' | 'extension'

export function isProductLive(product: LaunchProduct): boolean {
  switch (product) {
    case 'challenge':
      return process.env.NEXT_PUBLIC_CHALLENGE_LIVE === 'true'
    case 'blueprint':
      return process.env.NEXT_PUBLIC_BLUEPRINT_LIVE === 'true'
    case 'membership':
      return process.env.NEXT_PUBLIC_MEMBERSHIP_LIVE === 'true'
    case 'extension':
      return process.env.NEXT_PUBLIC_EXTENSION_LIVE === 'true'
  }
}
