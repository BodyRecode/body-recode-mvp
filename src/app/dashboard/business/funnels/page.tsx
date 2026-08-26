import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Layers, Plus, ExternalLink } from 'lucide-react'

export default async function FunnelsPage() {
  const supabase = await createClient()

  const { data: funnels } = await supabase
    .from('be_funnels')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between br-page-header sticky top-0 z-20 mb-7 pt-4 pb-3.5 border-b border-[#E8EAEE] bg-white/[0.88] backdrop-blur-md print:static print:bg-transparent">
        <div>
          <h1 className="text-[22px] font-semibold tracking-[-0.025em] mb-1">Funnels</h1>
          <p className="text-[#666D7A] text-sm">Lead capture pages that feed straight into your CRM</p>
        </div>
        <Link
          href="/dashboard/business/funnels/new"
          className="flex items-center gap-2 bg-[#1B6DFC] hover:bg-[#1560E0] text-[#FBFCFD] text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
        >
          <Plus size={14} strokeWidth={2.5} />
          New Funnel
        </Link>
      </div>

      {funnels && funnels.length > 0 ? (
        <div className="space-y-2">
          {funnels.map(funnel => (
            <div
              key={funnel.id}
              className="flex items-center gap-4 bg-[#F4F6F9] br-card p-4 hover:border-[#E8EAEE] transition-colors"
            >
              <div className="p-2 bg-[#EFF1F4] rounded-lg shrink-0">
                <Layers size={14} className="text-[#666D7A]" />
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[#141821] truncate">{funnel.name}</p>
                <p className="text-[12.5px] text-[#666D7A] mt-0.5">
                  bodyrecode.au/f/{funnel.slug}
                </p>
              </div>

              <div className="shrink-0 flex items-center gap-3">
                <span className={`text-xs font-medium ${funnel.is_active ? 'text-[#1B6DFC]' : 'text-[#666D7A]'}`}>
                  {funnel.is_active ? 'Live' : 'Off'}
                </span>
                <a
                  href={`/f/${funnel.slug}`}
                  target="_blank"
                  rel="noreferrer"
                  className="p-1.5 text-[#98A0AD] hover:text-[#666D7A] transition-colors"
                  title="Preview"
                >
                  <ExternalLink size={13} />
                </a>
                <Link
                  href={`/dashboard/business/funnels/${funnel.id}`}
                  className="text-[12.5px] text-[#666D7A] hover:text-[#1B6DFC] transition-colors"
                >
                  Edit
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-[#F4F6F9] border border-dashed border-[#E8EAEE] rounded-xl p-12 text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-[#EFF1F4] rounded-xl">
              <Layers size={24} className="text-[#666D7A]" strokeWidth={1.5} />
            </div>
          </div>
          <p className="text-[#666D7A] text-sm font-medium mb-1">No funnels yet</p>
          <p className="text-[#98A0AD] text-[12.5px] mb-6">
            Create a landing page to capture leads - they flow straight into your CRM
          </p>
          <Link
            href="/dashboard/business/funnels/new"
            className="inline-flex items-center gap-2 bg-[#1B6DFC] hover:bg-[#1560E0] text-[#FBFCFD] text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
          >
            <Plus size={14} strokeWidth={2.5} />
            Create your first funnel
          </Link>
        </div>
      )}
    </div>
  )
}
