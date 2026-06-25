interface PlanBlock {
  id: string
  block_name: string
  phase_category: string | null // intensity ceiling
  week_duration: number
  position: number
  status: string
}
interface TrainingPlan {
  plan_name: string
  macro_objective: string | null
  plan_blocks: PlanBlock[]
}

const intensityColour: Record<string, string> = {
  restorative: 'text-green-600 bg-green-50 border-green-200',
  gentle: 'text-blue-400 bg-blue-50 border-blue-200',
  moderate: 'text-blue-600 bg-blue-50 border-blue-200',
  strong: 'text-violet-700 bg-violet-50 border-violet-200',
}
const statusDot: Record<string, string> = {
  planned: 'bg-stone-400', in_progress: 'bg-amber-500', complete: 'bg-green-500', skipped: 'bg-stone-300',
}

const PILLARS = [
  { label: 'State', desc: 'where the body is', colour: 'text-stone-500' },
  { label: 'Arc', desc: 'the months ahead', colour: 'text-stone-500' },
  { label: 'Block', desc: 'a few weeks', colour: 'text-stone-500' },
  { label: 'Practice', desc: 'the weekly template', colour: 'text-blue-400' },
  { label: 'Reading', desc: 'the why, for the client', colour: 'text-blue-500' },
]

export default function YogaHierarchyVisual({
  plan, currentBlockName, practiceCount,
}: { plan: TrainingPlan | null; currentBlockName: string | null; practiceCount: number }) {
  const blocks = (plan?.plan_blocks ?? []).slice().sort((a, b) => a.position - b.position)
  const totalWeeks = blocks.filter((b) => b.status !== 'skipped').reduce((s, b) => s + b.week_duration, 0)
  const current = blocks.find((b) => b.status === 'in_progress')

  return (
    <div className="bg-stone-100 border border-stone-200 rounded-xl overflow-hidden">
      <div className="px-5 py-3 border-b border-stone-200">
        <p className="text-[10px] font-bold text-stone-600 uppercase tracking-widest">System Hierarchy</p>
        <p className="text-xs text-stone-400 mt-0.5">How the arc, block, practice and reading connect</p>
      </div>

      <div className="p-5 flex gap-6">
        {/* Left: pillar stack */}
        <div className="shrink-0 w-32">
          <p className="text-[9px] font-bold text-stone-400 uppercase tracking-widest mb-3">Order</p>
          <div className="space-y-1">
            {PILLARS.map((p, i) => (
              <div key={p.label} className="flex items-start gap-2">
                <div className="flex flex-col items-center shrink-0 mt-1">
                  <div className={`w-1.5 h-1.5 rounded-full ${i >= 3 ? 'bg-blue-400' : 'bg-stone-400'}`} />
                  {i < PILLARS.length - 1 && <div className="w-px h-4 bg-stone-300" />}
                </div>
                <div>
                  <p className={`text-[10px] font-bold ${p.colour}`}>{p.label}</p>
                  <p className="text-[9px] text-stone-400 leading-tight">{p.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="w-px bg-stone-200 shrink-0" />

        {/* Right: Arc -> Block -> Practice */}
        <div className="flex-1 min-w-0 space-y-4">
          {/* Macro Arc */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
              <p className="text-[9px] font-bold text-stone-500 uppercase tracking-widest">Macro Arc</p>
              {plan && <p className="text-[9px] text-stone-400 ml-auto">{totalWeeks}w total</p>}
            </div>
            {plan ? (
              <div>
                <p className="text-xs font-semibold text-stone-800 mb-2">{plan.plan_name}</p>
                {plan.macro_objective && <p className="text-[10px] text-stone-500 mb-2 leading-relaxed">{plan.macro_objective}</p>}
                <div className="flex items-center gap-1 flex-wrap">
                  {blocks.map((block, i) => (
                    <div key={block.id} className="flex items-center gap-1">
                      <div className={`flex items-center gap-1.5 px-2 py-1 rounded border text-[9px] ${
                        block.status === 'complete'
                          ? 'bg-stone-200/30 border-stone-200 text-stone-400'
                          : intensityColour[block.phase_category ?? ''] || 'bg-stone-200 border-stone-300 text-stone-600'
                      } ${block.status === 'in_progress' ? 'ring-1 ring-amber-400/50' : ''}`}>
                        <div className={`w-1 h-1 rounded-full shrink-0 ${statusDot[block.status]}`} />
                        <span className="font-medium truncate max-w-[90px]">{block.block_name}</span>
                        <span className="opacity-60">{block.week_duration}w</span>
                      </div>
                      {i < blocks.length - 1 && <span className="text-stone-700 text-[9px]">›</span>}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-[10px] text-stone-400 italic">No macro arc planned</p>
            )}
          </div>

          <div className="flex items-center gap-2 pl-0.5">
            <div className="w-px h-3 bg-stone-300" />
            <span className="text-[9px] text-stone-500">current block</span>
          </div>

          {/* Block */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
              <p className="text-[9px] font-bold text-stone-500 uppercase tracking-widest">Block</p>
            </div>
            {current || currentBlockName ? (
              <div className={`px-3 py-2 rounded-lg border ${intensityColour[current?.phase_category ?? ''] || 'bg-stone-200 border-stone-300'}`}>
                <p className="text-xs font-semibold">{current?.block_name ?? currentBlockName}</p>
                {current && <p className="text-[9px] opacity-70 mt-0.5 capitalize">{current.phase_category} · {current.week_duration}w</p>}
              </div>
            ) : (
              <p className="text-[10px] text-stone-400 italic">{plan ? 'No block in progress' : 'No block active'}</p>
            )}
          </div>

          <div className="flex items-center gap-2 pl-0.5">
            <div className="w-px h-3 bg-stone-300" />
            <span className="text-[9px] text-stone-500">generates practices</span>
          </div>

          {/* Practice */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-1.5 h-1.5 rounded-full bg-stone-400 shrink-0" />
              <p className="text-[9px] font-bold text-stone-500 uppercase tracking-widest">Practice</p>
            </div>
            <p className="text-[10px] text-stone-500">
              {practiceCount > 0 ? `${practiceCount} practices in the weekly template` : 'No practices generated yet'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
