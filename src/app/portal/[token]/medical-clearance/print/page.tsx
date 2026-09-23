import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import { brand } from "@/config/tenant";
import { requirePortalClient } from '@/lib/portal-guard'

export default async function PortalClearancePrintPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const admin = createAdminClient()

  const client = await requirePortalClient(token, 'medical_clearance_required')

  if (!client || !client.medical_clearance_required) return notFound()

  return (
    <div className="min-h-screen bg-white text-black p-12 max-w-3xl mx-auto print:p-8">
      <style>{`@media print { button { display: none; } }`}</style>

      <div className="flex items-start justify-between mb-10">
        <div>
          <p className="text-[12.5px] font-bold tracking-widest uppercase text-[#4A4F57] mb-1">{brand().name}™</p>
          <h1 className="text-[20px] font-bold text-black">Medical Clearance Request Form</h1>
          <p className="text-[13.5px] text-[#6E747D] mt-1">Version 1.1</p>
        </div>
        <button
          onClick={() => window.print()}
          className="text-[13.5px] bg-[#0F1115] text-white font-semibold px-4 py-2 rounded-lg hover:bg-[#6E747D] transition-colors print:hidden"
        >
          Print / Save as PDF
        </button>
      </div>

      <div className="space-y-8 text-[13.5px]">
        <section>
          <h2 className="font-bold text-[16px] mb-2">1. Purpose</h2>
          <p className="text-[#6E747D] leading-relaxed">This document requests confirmation that the individual named below is medically cleared to participate in supervised progressive resistance and conditioning training within {brand().name}™ Performance Coaching.</p>
          <p className="text-[#6E747D] leading-relaxed mt-2">This form does not request diagnosis, treatment planning, or clinical interpretation. It requests confirmation of exercise participation eligibility only.</p>
        </section>

        <section>
          <h2 className="font-bold text-[16px] mb-3">2. Client Details</h2>
          <div className="space-y-4">
            <div>
              <p className="text-[12.5px] font-semibold text-[#6E747D] uppercase tracking-wide mb-1">Full Legal Name</p>
              <p className="font-semibold text-[16px] border-b border-[#4A4F57] pb-1">{client.name}</p>
            </div>
            <div>
              <p className="text-[12.5px] font-semibold text-[#6E747D] uppercase tracking-wide mb-1">Date of Birth</p>
              <div className="border-b border-[#4A4F57] pb-1 h-6" />
            </div>
            <div>
              <p className="text-[12.5px] font-semibold text-[#6E747D] uppercase tracking-wide mb-1">Primary Contact Details</p>
              <p className="border-b border-[#4A4F57] pb-1">{client.email ?? ''}</p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="font-bold text-[16px] mb-3">3. Reason for Clearance Request</h2>
          <p className="text-[#6E747D] mb-3">Medical clearance has been requested due to the following self-declared condition or screening response:</p>
          <div className="space-y-2">
            <div className="border-b border-[#4A4F57] pb-1 h-6" />
            <div className="border-b border-[#4A4F57] pb-1 h-6" />
            <div className="border-b border-[#4A4F57] pb-1 h-6" />
          </div>
          <p className="text-[#6E747D] text-[12.5px] mt-2">This request is precautionary and relates only to exercise participation eligibility.</p>
        </section>

        <section>
          <h2 className="font-bold text-[16px] mb-3">4. Nature of Training Exposure</h2>
          <p className="text-[#6E747D] mb-2">{brand().name}™ Performance Coaching includes supervised progressive exercise exposure, which may involve:</p>
          <ul className="list-disc list-inside text-[#6E747D] space-y-1 ml-2">
            <li>Progressive resistance training</li>
            <li>Moderate to high effort strength training</li>
            <li>Structured conditioning exposure</li>
            <li>Controlled increases in training load over time</li>
            <li>Gym-based sessions under supervision</li>
          </ul>
          <p className="text-[#6E747D] mt-2">No medical treatment or rehabilitation services are provided. Training exposure is adjusted according to tolerance and any medical limitations specified below.</p>
        </section>

        <section className="border border-[#4A4F57] rounded-lg p-5">
          <h2 className="font-bold text-[16px] mb-3">5. Medical Clearance Declaration <span className="font-normal text-[#6E747D]">(Completed by Medical Practitioner)</span></h2>
          <p className="text-[#6E747D] mb-4">I confirm that I am a qualified medical practitioner authorised to provide exercise participation clearance.</p>
          <div className="space-y-4">
            {['Medical Practitioner Name', 'Provider Number', 'Practice Name', 'Contact Details'].map(label => (
              <div key={label}>
                <p className="text-[12.5px] font-semibold text-[#6E747D] uppercase tracking-wide mb-1">{label}</p>
                <div className="border-b border-[#4A4F57] pb-1 h-6" />
              </div>
            ))}
          </div>
          <div className="mt-5">
            <p className="text-[12.5px] font-semibold text-[#6E747D] uppercase tracking-wide mb-3">Participation Status (Select One)</p>
            <div className="space-y-2">
              <label className="flex items-center gap-3"><input type="checkbox" className="w-4 h-4" /><span>Cleared for participation without restriction</span></label>
              <label className="flex items-center gap-3"><input type="checkbox" className="w-4 h-4" /><span>Cleared for participation with the following limitations or precautions:</span></label>
              <div className="ml-7 space-y-2">
                <div className="border-b border-[#4A4F57] pb-1 h-6" />
                <div className="border-b border-[#4A4F57] pb-1 h-6" />
              </div>
              <label className="flex items-center gap-3"><input type="checkbox" className="w-4 h-4" /><span>Not cleared for progressive exercise participation at this time</span></label>
            </div>
          </div>
        </section>

        <section>
          <h2 className="font-bold text-[16px] mb-2">6. Scope Acknowledgement</h2>
          <p className="text-[#6E747D]">This declaration confirms medical permission for participation only. It does not transfer clinical responsibility to {brand().name}™. {brand().name}™ will operate within any limitations specified above and within its professional scope of practice.</p>
        </section>

        <section>
          <h2 className="font-bold text-[16px] mb-3">7. Validity</h2>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-[12.5px] font-semibold text-[#6E747D] uppercase tracking-wide mb-1">Effective Date</p>
              <div className="border-b border-[#4A4F57] pb-1 h-6" />
            </div>
            <div>
              <p className="text-[12.5px] font-semibold text-[#6E747D] uppercase tracking-wide mb-1">Review / Expiry Date</p>
              <div className="border-b border-[#4A4F57] pb-1 h-6" />
            </div>
          </div>
        </section>

        <section>
          <h2 className="font-bold text-[16px] mb-3">8. Practitioner Declaration</h2>
          <p className="text-[#6E747D] mb-4">I confirm that the above clearance reflects my professional opinion regarding exercise participation suitability at this time.</p>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-[12.5px] font-semibold text-[#6E747D] uppercase tracking-wide mb-1">Signature</p>
              <div className="border-b border-[#4A4F57] pb-1 h-10" />
            </div>
            <div>
              <p className="text-[12.5px] font-semibold text-[#6E747D] uppercase tracking-wide mb-1">Date</p>
              <div className="border-b border-[#4A4F57] pb-1 h-10" />
            </div>
          </div>
        </section>

        <div className="border-t border-[#E4E4E0] pt-6 text-[12.5px] text-[#4A4F57]">
          <p>{brand().name}™ | Kade Dunstone | ABN 90 535 525 708 | Anytime Fitness Newstead, Brisbane</p>
        </div>
      </div>
    </div>
  )
}
