import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import ReadingLayout from '@/components/foundational-reading-layout'
import { verifyPdfAccessToken, PDF_TOKEN_PARAM } from '@/lib/pdf-access-token'

/**
 * Token-authenticated render target for the Foundational Reading PDF.
 *
 * Lives OUTSIDE /dashboard on purpose. The dashboard layout is a server
 * component that redirects any request without a session, so it fires before a
 * page-level token check can run. A server-side PDF request therefore rendered
 * the login screen no matter what the page itself allowed, which is how a
 * screenshot of the sign-in form ended up attached to a client email on
 * 2026-08-01.
 *
 * Renders the SAME ReadingLayout the coach preview and the client portal use,
 * so this is the real document rather than a reproduction of it.
 *
 * Only reachable with a 60-second HMAC token scoped to this exact path, which
 * the PDF route mints and hands to its own headless browser. No session, no
 * cookies, nothing a person ever clicks.
 */
export default async function FoundationalReadingRenderPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const { id } = await params
  const sp = await searchParams

  const raw = sp[PDF_TOKEN_PARAM]
  const token = Array.isArray(raw) ? raw[0] : raw
  if (!verifyPdfAccessToken(token, `/render/foundational-reading/${id}`)) return notFound()

  const admin = createAdminClient()
  const [{ data: client }, { data: rows }] = await Promise.all([
    admin.from('clients').select('id, name').eq('id', id).maybeSingle(),
    admin.from('cffs').select('*').eq('client_id', id).eq('is_archived', false)
      .order('generated_at', { ascending: false }).limit(1),
  ])

  const cffs = rows?.[0] ?? null
  if (!client || !cffs || !cffs.client_reading_generated_at) return notFound()

  return (
    <ReadingLayout
      reading={{
        cr_where_you_are: cffs.cr_where_you_are,
        cr_what_your_body_is_telling_us: cffs.cr_what_your_body_is_telling_us,
        cr_what_were_focusing_on_first: cffs.cr_what_were_focusing_on_first,
        cr_what_were_not_doing_yet: cffs.cr_what_were_not_doing_yet,
        cr_coach_note: cffs.cr_coach_note,
        body_state_classification: cffs.body_state_classification,
        generated_at: cffs.client_reading_generated_at,
        client_reading_published_at: cffs.client_reading_published_at,
      }}
      client={{ name: client.name }}
    />
  )
}
