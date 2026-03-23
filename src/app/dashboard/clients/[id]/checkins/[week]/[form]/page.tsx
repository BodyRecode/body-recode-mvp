import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { FORM_A_SECTIONS, FORM_B_SECTIONS } from '@/lib/weekly-checkin-questions'

export default async function CheckInDetailPage({
  params,
}: {
  params: Promise<{ id: string; week: string; form: string }>
}) {
  const { id, week, form } = await params
  const formType = form.toUpperCase() as 'A' | 'B'
  const weekNumber = parseInt(week)

  if (!['A', 'B'].includes(formType) || isNaN(weekNumber)) notFound()

  const supabase = await createClient()

  const { data: client } = await supabase
    .from('clients')
    .select('id, name')
    .eq('id', id)
    .maybeSingle()

  if (!client) notFound()

  const { data: checkin } = await supabase
    .from('weekly_checkins')
    .select('responses, submitted_at')
    .eq('client_id', id)
    .eq('week_number', weekNumber)
    .eq('form_type', formType)
    .maybeSingle()

  if (!checkin) notFound()

  const sections = formType === 'A' ? FORM_A_SECTIONS : FORM_B_SECTIONS
  const responses = checkin.responses as Record<string, string>

  const submittedAt = new Date(checkin.submitted_at).toLocaleString('en-AU', {
    timeZone: 'Australia/Brisbane',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })

  return (
    <div className="min-h-screen bg-[#0a0a0a] p-6 md:p-10">
      <div className="max-w-2xl mx-auto">

        <div className="mb-8">
          <Link
            href={`/dashboard/clients/${id}`}
            className="text-xs text-stone-500 hover:text-stone-300 transition-colors"
          >
            ← Back to {client.name}
          </Link>
        </div>

        <div className="mb-8">
          <p className="text-xs font-bold tracking-widest text-teal-400 uppercase mb-1">
            Week {weekNumber} · Form {formType}
          </p>
          <h1 className="text-2xl font-bold text-white tracking-tight">{client.name}</h1>
          <p className="text-stone-500 text-sm mt-1">Submitted {submittedAt}</p>
        </div>

        <div className="space-y-6">
          {sections.map(section => {
            const answered = section.questions.filter(q => responses[q.id])
            if (answered.length === 0) return null
            return (
              <div key={section.title} className="bg-stone-900 border border-stone-800 rounded-xl p-5">
                <p className="text-xs font-bold uppercase tracking-widest text-stone-500 mb-4">{section.title}</p>
                <div className="space-y-5">
                  {answered.map(q => (
                    <div key={q.id}>
                      <p className="text-xs text-stone-500 mb-1.5 leading-relaxed">{q.text}</p>
                      <p className="text-sm text-stone-200 leading-relaxed">{responses[q.id]}</p>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>

      </div>
    </div>
  )
}
