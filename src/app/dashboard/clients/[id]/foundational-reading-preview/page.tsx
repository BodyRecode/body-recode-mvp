import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import PrintTrigger from '../cffs-report/print-trigger'
import ReadingLayout from '@/components/foundational-reading-layout'

export default async function FoundationalReadingPreviewPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { id } = await params
  const admin = createAdminClient()

  const [{ data: client }, { data: cffsRows }] = await Promise.all([
    admin.from('clients').select('id, name').eq('id', id).maybeSingle(),
    admin
      .from('cffs')
      .select('*')
      .eq('client_id', id)
      .eq('is_archived', false)
      .order('generated_at', { ascending: false })
      .limit(1),
  ])

  const cffs = cffsRows?.[0] ?? null
  if (!client || !cffs || !cffs.client_reading_generated_at) notFound()

  // Render the reading as a clean, full-viewport standalone document ON SCREEN,
  // covering the dashboard chrome (top nav) so the editorial layout isn't
  // crammed under the app menu. Print/PDF is untouched: the PDF route renders
  // in print media (page.pdf()), where this container resets to static and the
  // dashboard nav is already print:hidden.
  return (
    <>
      <style>{`
        .fr-standalone { position: fixed; inset: 0; overflow-y: auto; background: #FFFFFF; z-index: 100; }
        @media print { .fr-standalone { position: static; overflow: visible; z-index: auto; } }
      `}</style>
      <div className="fr-standalone">
        <PrintTrigger
          backHref={`/dashboard/clients/${id}`}
          pdfHref={`/api/dashboard/clients/${id}/foundational-reading/pdf`}
          filename={`${client.name.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}-foundational-reading.pdf`}
        />
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
      </div>
    </>
  )
}
