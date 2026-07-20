import { createAdminClient } from '@/lib/supabase/admin'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import ClientHeader from '@/components/client-header'
import { Download } from 'lucide-react'
import { isCoachEmail } from '@/lib/coach-auth'

const MONO_FONT = "ui-monospace, 'JetBrains Mono', 'SF Mono', Menlo, monospace"

/**
 * Baseline Bloodwork guide page.
 *
 * The content is a general health-education PDF (branded, prepared by the
 * Body Recode PDF builder). Two versions exist: male-slanted (testosterone,
 * DHT, prostate) and female-slanted (cycle-timing, AMH, iron emphasis).
 * We resolve which PDF to serve from the client's gender field, sign a
 * short-lived Storage URL, and expose it as a Download button.
 *
 * The page itself intentionally does NOT reproduce the full guide content
 * inline — the PDF IS the deliverable. This page is a table-of-contents +
 * download button so the client can save/print/take-to-GP.
 *
 * Legal framing (worth preserving): this page must never edge into medical
 * advice territory. Guide is general education, disclaimer is in the PDF
 * top, and the CTA copy keeps the boundary explicit ("take to your GP").
 */
export default async function BaselineBloodworkGuidePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/portal/login')

  const admin = createAdminClient()
  const { data: client } = await admin
    .from('clients')
    .select('id, name, email')
    .eq('onboarding_token', token)
    .maybeSingle()

  if (!client) return notFound()
  const userEmail = (user.email ?? '').toLowerCase()
  if (userEmail !== (client.email ?? '').toLowerCase() && !isCoachEmail(userEmail)) {
    redirect(`/portal/${token}`)
  }

  // Gender lives on intakes.gender, not clients.
  const { data: intake } = await admin
    .from('intakes')
    .select('gender')
    .eq('client_id', client.id)
    .order('submitted_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  const normalisedGender = (intake?.gender ?? '').toLowerCase()
  if (normalisedGender !== 'male' && normalisedGender !== 'female') {
    // No intake / gender not resolved → guide tile wouldn't have been shown.
    // If they hit this URL directly, bounce them back to the guides index.
    redirect(`/portal/${token}/guides`)
  }

  const storagePath = normalisedGender === 'male'
    ? 'guides/baseline-bloodwork-male.pdf'
    : 'guides/baseline-bloodwork-female.pdf'
  const { data: signed } = await admin.storage
    .from('library-assets')
    .createSignedUrl(storagePath, 60 * 60 * 24) // 24-hour signed URL

  // Content sections common to both versions. The gender-specific parts
  // (hormonal panel details, cycle-timing) live in the PDF itself.
  const commonSections = [
    'Why baseline bloodwork matters',
    'Fasting, timing and prep',
    'The hormonal system',
    'Thyroid function',
    'Blood count and iron',
    'Cardiovascular biomarkers',
    'Metabolic biomarkers',
    'Liver and kidney function',
    'Prostate (male) / Bone density note (female)',
    'Nutritional and general',
    'What to do with your results',
    'Where to get comprehensive blood work in Australia',
  ]

  return (
    <div className="min-h-screen bg-[#FFFFFF] text-[#1A1A1A]">
      <ClientHeader />
      <div className="max-w-lg mx-auto px-6 py-10">
        <div className="mb-8">
          <Link href={`/portal/${token}/guides`} className="text-[12px] text-[#999999] hover:text-[#3A3A3A] transition-colors">← Back to guides</Link>
          <p
            className="text-[10px] font-bold text-[#1B6DFC] uppercase mt-4 mb-3"
            style={{ fontFamily: MONO_FONT, letterSpacing: '0.18em' }}
          >
            Health Education
          </p>
          <h1 className="text-[30px] font-extrabold text-[#1A1A1A] tracking-tight leading-[1.1] mb-3">Understanding your baseline bloodwork</h1>
          <p className="text-[#6B6B6B] text-[15px] leading-relaxed">
            A comprehensive baseline blood panel is one of the highest-leverage things you can do for your long-term health. This guide walks through what a comprehensive panel covers and what each marker measures, so you can follow the conversation with your doctor and understand your results when they come back.
          </p>
        </div>

        {/* Download CTA - front and centre */}
        {signed?.signedUrl ? (
          <a
            href={signed.signedUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-4 rounded-2xl border border-[#1B6DFC] bg-blue-50 p-5 hover:bg-blue-100 transition-colors mb-8"
          >
            <div className="w-10 h-10 rounded-xl bg-[#1B6DFC] flex items-center justify-center shrink-0">
              <Download size={16} className="text-[#FFFFFF]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[15px] font-semibold text-[#1A1A1A] mb-0.5 group-hover:text-[#1B6DFC] transition-colors">Download the guide (PDF)</p>
              <p className="text-[12px] text-[#6B6B6B] leading-relaxed">Save it, print it, take it to your GP appointment.</p>
            </div>
          </a>
        ) : (
          <div className="rounded-2xl border border-[#E5E5E5] bg-[#FFFFFF] p-5 mb-8">
            <p className="text-[13px] text-[#6B6B6B]">Download link temporarily unavailable. Message your coach and they can send you the PDF directly.</p>
          </div>
        )}

        {/* Table of contents */}
        <div className="mb-8">
          <p
            className="text-[10px] font-bold text-[#999999] uppercase mb-3"
            style={{ fontFamily: MONO_FONT, letterSpacing: '0.18em' }}
          >
            What is in the guide
          </p>
          <div className="rounded-2xl border border-[#E5E5E5] bg-[#FFFFFF] overflow-hidden">
            {commonSections.map((s, i) => (
              <div
                key={s}
                className={`px-5 py-3 text-[13px] text-[#3A3A3A] ${i < commonSections.length - 1 ? 'border-b border-[#E5E5E5]' : ''}`}
              >
                {s}
              </div>
            ))}
          </div>
        </div>

        {/* Explicit non-medical framing */}
        <div className="rounded-2xl border border-[#E5E5E5] bg-[#FAFAFA] p-5 mb-8">
          <p
            className="text-[10px] font-bold text-[#999999] uppercase mb-2"
            style={{ fontFamily: MONO_FONT, letterSpacing: '0.18em' }}
          >
            Read this first
          </p>
          <p className="text-[13px] text-[#6B6B6B] leading-relaxed">
            This is general health education prepared to help you have a better conversation with your doctor. It is not medical advice, not personalised to your specific situation, and not a substitute for a consultation with a registered medical practitioner. Clinical decisions - what to test, how to interpret results, what to do next - sit with your GP or specialist.
          </p>
        </div>

        <p className="text-[12px] text-[#999999] italic leading-relaxed">
          Once your results come back, share them with your coach. Your baseline shapes how your program evolves from here.
        </p>

        <div className="h-16" />
      </div>
    </div>
  )
}
