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
      <div className="flex items-center justify-between br-page-header sticky top-0 z-20 mb-7 pt-4 pb-3.5 border-b border-[#2A2F39] bg-[#14171D]/[0.88] backdrop-blur-md print:static print:bg-transparent">
        <div>
          <h1 className="text-[20px] font-semibold tracking-[-0.025em] mb-1">Funnels</h1>
          <p className="text-[#8A9099] text-sm">Lead capture pages that feed straight into your CRM</p>
        </div>
        <Link
          href="/dashboard/business/funnels/new"
          className="flex items-center gap-2 bg-[#FAFAF8] hover:bg-[#E4E4E0] text-[#14171D] text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
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
              className="flex items-center gap-4 bg-[#1A1E26] br-card p-4 hover:border-[#2A2F39] transition-colors"
            >
              <div className="p-2 bg-[#1F242C] rounded-lg shrink-0">
                <Layers size={14} className="text-[#8A9099]" />
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[#FAFAF8] truncate">{funnel.name}</p>
                <p className="text-[12.5px] text-[#8A9099] mt-0.5">
                  bodyrecode.au/f/{funnel.slug}
                </p>
              </div>

              <div className="shrink-0 flex items-center gap-3">
                <span className={`text-xs font-medium ${funnel.is_active ? 'text-[#FAFAF8]' : 'text-[#8A9099]'}`}>
                  {funnel.is_active ? 'Live' : 'Off'}
                </span>
                <a
                  href={`/f/${funnel.slug}`}
                  target="_blank"
                  rel="noreferrer"
                  className="p-1.5 text-[#676D76] hover:text-[#8A9099] transition-colors"
                  title="Preview"
                >
                  <ExternalLink size={13} />
                </a>
                <Link
                  href={`/dashboard/business/funnels/${funnel.id}`}
                  className="text-[12.5px] text-[#8A9099] hover:text-[#FAFAF8] transition-colors"
                >
                  Edit
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-[#1A1E26] border border-dashed border-[#2A2F39] rounded-xl p-12 text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-[#1F242C] rounded-xl">
              <Layers size={24} className="text-[#8A9099]" strokeWidth={1.5} />
            </div>
          </div>
          <p className="text-[#8A9099] text-sm font-medium mb-1">No funnels yet</p>
          <p className="text-[#676D76] text-[12.5px] mb-6">
            Create a landing page to capture leads - they flow straight into your CRM
          </p>
          <Link
            href="/dashboard/business/funnels/new"
            className="inline-flex items-center gap-2 bg-[#FAFAF8] hover:bg-[#E4E4E0] text-[#14171D] text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
          >
            <Plus size={14} strokeWidth={2.5} />
            Create your first funnel
          </Link>
        </div>
      )}
    </div>
  )
}
