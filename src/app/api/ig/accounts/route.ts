// Which Instagram account does each brand actually resolve to, right now, in
// whatever environment this is running in?
//
// Written 24 Aug 2026. Two Body Recode posts published to @kade_dunstone_ on 21
// and 22 Aug and nothing in the system could say so: calendar_posts recorded
// brand=body_recode, the publish returned success, and the only detector was Kade
// opening the wrong app and finding a client post on his personal feed.
//
// The cause was two changes on the same afternoon. Setting up personal-brand
// publishing pointed META_IG_BUSINESS_ACCOUNT_ID at the personal account, and the
// Meta app's grant lost the Body Recode Page at the same time.
//
// Production env vars are Sensitive, so nobody can read them back, not even from
// the Vercel dashboard. This answers the only question that matters about them
// without exposing anything: what handle is behind each brand.
//
// Open: https://app.bodyrecode.au/api/ig/accounts
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isCoachUser, forbidden } from '@/lib/api-auth'
import { igAccountHandle, type IgAccount } from '@/lib/instagram-publish'

export const dynamic = 'force-dynamic'

const BRANDS: Array<{ account: IgAccount; tokenVar: string; idVar: string }> = [
  { account: 'body_recode', tokenVar: 'META_GRAPH_ACCESS_TOKEN', idVar: 'META_IG_BUSINESS_ACCOUNT_ID' },
  { account: 'personal_brand', tokenVar: 'META_GRAPH_ACCESS_TOKEN_PB', idVar: 'META_IG_BUSINESS_ACCOUNT_ID_PB' },
]

export async function GET() {
  const sessionClient = await createClient()
  const { data: { user } } = await sessionClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'auth_required' }, { status: 401 })
  if (!(await isCoachUser(user))) return forbidden()

  const results = []
  for (const b of BRANDS) {
    const expected = igAccountHandle(b.account).replace(/^@/, '')
    const token = process.env[b.tokenVar]?.trim()
    const igId = process.env[b.idVar]?.trim()

    if (!token || !igId) {
      results.push({ brand: b.account, expected: `@${expected}`, ok: false,
        problem: `${!token ? b.tokenVar : b.idVar} is not set` })
      continue
    }

    // Who is this, and what else can the token see? The second half is what makes
    // a mix-up obvious: a token that can reach only one Page is the shape of this bug.
    const who = await fetch(`https://graph.facebook.com/v21.0/${igId}?fields=username&access_token=${encodeURIComponent(token)}`)
      .then(r => r.json()).catch(() => ({})) as { username?: string; error?: { message?: string } }
    const pages = await fetch(`https://graph.facebook.com/v21.0/me/accounts?fields=name,instagram_business_account{username}&access_token=${encodeURIComponent(token)}`)
      .then(r => r.json()).catch(() => ({})) as { data?: Array<{ name?: string; instagram_business_account?: { username?: string } }> }

    const actual = who.username?.toLowerCase()
    results.push({
      brand: b.account,
      expected: `@${expected}`,
      resolvesTo: actual ? `@${actual}` : null,
      ok: actual === expected.toLowerCase(),
      problem: actual ? undefined : `cannot resolve ${b.idVar}${who.error?.message ? `: ${who.error.message}` : ''}`,
      tokenCanReach: (pages.data ?? []).map(p => p.instagram_business_account?.username).filter(Boolean).map(u => `@${u}`),
    })
  }

  const bad = results.filter(r => !r.ok)
  return NextResponse.json({
    ok: bad.length === 0,
    summary: bad.length === 0
      ? 'Both brands resolve to the right Instagram account.'
      : `${bad.length} wrong. Posts for ${bad.map(r => r.brand).join(' and ')} will be refused rather than published.`,
    accounts: results,
  }, { status: 200 })
}
