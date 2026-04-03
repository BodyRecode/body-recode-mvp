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
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold mb-1">Funnels</h1>
          <p className="text-stone-400 text-sm">Lead capture pages that feed straight into your CRM</p>
        </div>
        <Link
          href="/dashboard/business/funnels/new"
          className="flex items-center gap-2 bg-teal-500 hover:bg-teal-400 text-stone-950 text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
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
              className="flex items-center gap-4 bg-stone-900 border border-stone-800 rounded-xl p-4 hover:border-stone-700 transition-colors"
            >
              <div className="p-2 bg-stone-800 rounded-lg shrink-0">
                <Layers size={14} className="text-stone-400" />
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{funnel.name}</p>
                <p className="text-xs text-stone-500 mt-0.5">
                  bodyrecode.au/f/{funnel.slug}
                </p>
              </div>

              <div className="shrink-0 flex items-center gap-3">
                <span className={`text-xs font-medium ${funnel.is_active ? 'text-teal-400' : 'text-stone-500'}`}>
                  {funnel.is_active ? 'Live' : 'Off'}
                </span>
                <a
                  href={`/f/${funnel.slug}`}
                  target="_blank"
                  rel="noreferrer"
                  className="p-1.5 text-stone-600 hover:text-stone-400 transition-colors"
                  title="Preview"
                >
                  <ExternalLink size={13} />
                </a>
                <Link
                  href={`/dashboard/business/funnels/${funnel.id}`}
                  className="text-xs text-stone-500 hover:text-teal-400 transition-colors"
                >
                  Edit
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-stone-900 border border-dashed border-stone-800 rounded-xl p-12 text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-stone-800 rounded-xl">
              <Layers size={24} className="text-stone-500" strokeWidth={1.5} />
            </div>
          </div>
          <p className="text-stone-400 text-sm font-medium mb-1">No funnels yet</p>
          <p className="text-stone-600 text-xs mb-6">
            Create a landing page to capture leads — they flow straight into your CRM
          </p>
          <Link
            href="/dashboard/business/funnels/new"
            className="inline-flex items-center gap-2 bg-teal-500 hover:bg-teal-400 text-stone-950 text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
          >
            <Plus size={14} strokeWidth={2.5} />
            Create your first funnel
          </Link>
        </div>
      )}
    </div>
  )
}
