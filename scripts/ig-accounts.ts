// Which Instagram account will each brand actually publish to?
//
// Written 23 Aug 2026 after two Body Recode posts published to @kade_dunstone_ on
// 21 and 22 Aug. The account map in instagram-publish.ts was correct; the env vars
// behind it were not, and nothing in the system could tell. calendar_posts recorded
// brand=body_recode, the publish returned success, and the only detector was Kade
// finding a client post on his personal feed.
//
// Run this after ANY change to the Meta credentials.
// Run: npx tsx --env-file=.env.local scripts/ig-accounts.ts
const ACCOUNTS = [
  { brand: 'body_recode',    expect: 'body_recode_',  tokenVar: 'META_GRAPH_ACCESS_TOKEN',    idVar: 'META_IG_BUSINESS_ACCOUNT_ID' },
  { brand: 'personal_brand', expect: 'kade_dunstone_', tokenVar: 'META_GRAPH_ACCESS_TOKEN_PB', idVar: 'META_IG_BUSINESS_ACCOUNT_ID_PB' },
]

async function main() {
  let bad = 0
  for (const a of ACCOUNTS) {
    const token = process.env[a.tokenVar]?.trim()
    const igId = process.env[a.idVar]?.trim()
    if (!token || !igId) { console.log(`  ${a.brand.padEnd(15)} ${!token ? a.tokenVar : a.idVar} MISSING`); bad++; continue }

    const who = await (await fetch(`https://graph.facebook.com/v21.0/${igId}?fields=username,followers_count&access_token=${encodeURIComponent(token)}`)).json()
    if (!who.username) {
      console.log(`  ${a.brand.padEnd(15)} CANNOT RESOLVE ${a.idVar}: ${who.error?.message ?? 'unknown'}`); bad++; continue
    }
    const ok = who.username.toLowerCase() === a.expect
    console.log(`  ${ok ? 'OK  ' : 'WRONG'} ${a.brand.padEnd(15)} -> @${who.username} (${who.followers_count} followers), expected @${a.expect}`)
    if (!ok) bad++

    // what else this token can see, which is how the mix-up is spotted
    const pages = await (await fetch(`https://graph.facebook.com/v21.0/me/accounts?fields=name,instagram_business_account{username}&access_token=${encodeURIComponent(token)}`)).json()
    const reach = (pages.data ?? []).map((p: { instagram_business_account?: { username?: string } }) => p.instagram_business_account?.username).filter(Boolean)
    console.log(`       this token can reach: ${reach.length ? reach.map((r: string) => '@' + r).join(', ') : 'nothing'}`)
  }
  console.log(bad ? `\n  ${bad} PROBLEM. Do not let the queue run until this is fixed.` : '\n  Both accounts resolve to the right handle.')
}
main()
