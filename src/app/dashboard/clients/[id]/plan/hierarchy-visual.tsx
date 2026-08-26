interface PlanBlock {
  id: string
  position: number
  block_name: string
  progression_phase: string
  training_goal: string
  week_duration: number
  status: 'planned' | 'in_progress' | 'complete' | 'skipped'
}

interface Plan {
  plan_name: string
  macro_objective: string | null
  plan_blocks: PlanBlock[]
}

interface ActiveProgram {
  block_name: string
  progression_phase: string
  training_goal: string
  training_frequency: number
  week_duration: number
}

interface NutritionPlan {
  entry_state: string | null
  carb_demand_level: string | null
  modulation_level: string | null
}

const phaseColour: Record<string, string> = {
  accumulation: 'bg-blue-50 border-blue-200 text-blue-700',
  intensification: 'bg-orange-400/10 border-orange-400/30 text-orange-400',
  realization: 'bg-red-50 border-red-200 text-red-700',
  restoration: 'bg-green-400/10 border-green-400/30 text-green-400',
}

const statusDot: Record<string, string> = {
  planned: 'bg-stone-400',
  in_progress: 'bg-amber-400',
  complete: 'bg-green-500',
  skipped: 'bg-[#EFF1F4]',
}

const PILLARS = [
  { label: 'RRS', full: 'Recovery + Regulation', colour: 'text-red-700', desc: 'Governs all execution' },
  { label: 'Fat Map', full: 'Fat Map Method', colour: 'text-orange-400', desc: 'Constraint authority' },
  { label: 'BIRS', full: 'Behaviour + Identity', colour: 'text-yellow-400', desc: 'Complexity limits' },
  { label: 'PTS', full: 'Progressive Training', colour: 'text-blue-700', desc: 'Training demand' },
  { label: 'HABNS', full: 'Nutrition Support', colour: 'text-blue-500', desc: 'Nutrition support' },
]

export default function HierarchyVisual({
  plan,
  activeProgram,
  nutritionPlan,
}: {
  plan: Plan | null
  activeProgram: ActiveProgram | null
  nutritionPlan: NutritionPlan | null
}) {
  const totalWeeks = plan?.plan_blocks.filter(b => b.status !== 'skipped').reduce((s, b) => s + b.week_duration, 0) ?? 0
  const currentBlock = plan?.plan_blocks.find(b => b.status === 'in_progress')

  return (
    <div className="bg-[#F4F6F9] border border-[#E8EAEE] rounded-xl overflow-hidden">
      <div className="px-5 py-3 border-b border-[#E8EAEE]">
        <p className="text-[10px] font-medium text-[#666D7A]">System Hierarchy</p>
        <p className="text-[12.5px] text-[#98A0AD] mt-0.5">How macro, meso, micro and nutrition interact</p>
      </div>

      <div className="p-5 flex gap-6">

        {/* Left: Pillar stack */}
        <div className="shrink-0 w-40">
          <p className="text-[9px] font-medium text-[#98A0AD] mb-3">Cross-Pillar Order</p>
          <div className="space-y-1">
            {PILLARS.map((p, i) => (
              <div key={p.label} className="flex items-start gap-2">
                <div className="flex flex-col items-center shrink-0 mt-1">
                  <div className={`w-1.5 h-1.5 rounded-full ${i === 3 ? 'bg-blue-400' : i === 4 ? 'bg-blue-500' : 'bg-stone-400'}`} />
                  {i < PILLARS.length - 1 && <div className="w-px h-4 bg-stone-300" />}
                </div>
                <div>
                  <p className={`text-[10px] font-bold ${p.colour}`}>{p.label}</p>
                  <p className="text-[9px] text-[#98A0AD] leading-tight">{p.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Vertical divider */}
        <div className="w-px bg-[#EFF1F4] shrink-0" />

        {/* Right: Macro → Meso → Micro → Nutrition */}
        <div className="flex-1 min-w-0 space-y-4">

          {/* Layer 1: Macro Arc */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
              <p className="text-[9px] font-medium text-[#666D7A]">Macro Arc</p>
              {plan && <p className="text-[9px] text-[#98A0AD] ml-auto">{totalWeeks}w total</p>}
            </div>

            {plan ? (
              <div>
                <p className="text-[12.5px] font-semibold text-[#141821] mb-2">{plan.plan_name}</p>
                {plan.macro_objective && (
                  <p className="text-[10px] text-[#666D7A] mb-2 leading-relaxed">{plan.macro_objective}</p>
                )}
                {plan.plan_blocks.length > 0 && (
                  <div className="flex items-center gap-1 flex-wrap">
                    {plan.plan_blocks.map((block, i) => (
                      <div key={block.id} className="flex items-center gap-1">
                        <div className={`flex items-center gap-1.5 px-2 py-1 rounded border text-[9px] ${
                          block.status === 'in_progress'
                            ? `${phaseColour[block.progression_phase] || 'bg-[#EFF1F4] border-[#E8EAEE] text-[#666D7A]'} ring-1 ring-amber-400/50`
                            : block.status === 'complete'
                            ? 'bg-[#EFF1F4]/30 border-[#E8EAEE] text-[#98A0AD]'
                            : phaseColour[block.progression_phase] || 'bg-[#EFF1F4] border-[#E8EAEE] text-[#666D7A]'
                        }`}>
                          <div className={`w-1 h-1 rounded-full shrink-0 ${statusDot[block.status]}`} />
                          <span className="font-medium truncate max-w-[80px]">{block.block_name}</span>
                          <span className="opacity-60">{block.week_duration}w</span>
                        </div>
                        {i < plan.plan_blocks.length - 1 && (
                          <span className="text-[#141821] text-[9px]">›</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-[10px] text-[#98A0AD] italic">No macro arc planned</p>
            )}
          </div>

          {/* Connector */}
          <div className="flex items-center gap-2 pl-1">
            <div className="w-px h-3 bg-stone-300 ml-0.5" />
            <span className="text-[9px] text-[#141821]">current block</span>
          </div>

          {/* Layer 2: Meso Block */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
              <p className="text-[9px] font-medium text-[#666D7A]">Meso Block</p>
            </div>

            {currentBlock ? (
              <div className={`px-3 py-2 rounded-lg border ${phaseColour[currentBlock.progression_phase] || 'bg-[#EFF1F4] border-[#E8EAEE]'}`}>
                <p className="text-[12.5px] font-semibold">{currentBlock.block_name}</p>
                <p className="text-[9px] opacity-70 mt-0.5 capitalize">{currentBlock.progression_phase} · {currentBlock.training_goal} · {currentBlock.week_duration}w</p>
              </div>
            ) : (
              <p className="text-[10px] text-[#98A0AD] italic">{plan ? 'No block in progress' : 'No meso block active'}</p>
            )}
          </div>

          {/* Connector */}
          <div className="flex items-center gap-2 pl-1">
            <div className="w-px h-3 bg-stone-300 ml-0.5" />
            <span className="text-[9px] text-[#141821]">generates program</span>
          </div>

          {/* Layer 3: Micro Program */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-1.5 h-1.5 rounded-full bg-violet-400 shrink-0" />
              <p className="text-[9px] font-medium text-[#666D7A]">Micro Program</p>
            </div>

            {activeProgram ? (
              <div className="px-3 py-2 rounded-lg bg-[#EFF1F4]/50 border border-[#E8EAEE]">
                <p className="text-[12.5px] font-semibold text-[#141821]">{activeProgram.block_name}</p>
                <p className="text-[9px] text-[#666D7A] mt-0.5 capitalize">
                  {activeProgram.progression_phase} · {activeProgram.training_goal} · {activeProgram.training_frequency}x/week · {activeProgram.week_duration}w
                </p>
              </div>
            ) : (
              <p className="text-[10px] text-[#98A0AD] italic">No active program</p>
            )}
          </div>

          {/* Connector */}
          <div className="flex items-center gap-2 pl-1">
            <div className="w-px h-3 bg-stone-300 ml-0.5" />
            <span className="text-[9px] text-[#141821]">supported by</span>
          </div>

          {/* Layer 4: Nutrition */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
              <p className="text-[9px] font-medium text-[#666D7A]">Nutrition Support</p>
            </div>

            {nutritionPlan ? (
              <div className="flex gap-2 flex-wrap">
                {nutritionPlan.entry_state && (
                  <span className="text-[9px] px-2 py-1 bg-blue-50 border border-blue-500/20 rounded text-blue-500 capitalize">
                    {nutritionPlan.entry_state}
                  </span>
                )}
                {nutritionPlan.carb_demand_level && (
                  <span className="text-[9px] px-2 py-1 bg-[#EFF1F4] border border-[#E8EAEE] rounded text-[#666D7A] capitalize">
                    Carbs: {nutritionPlan.carb_demand_level}
                  </span>
                )}
                {nutritionPlan.modulation_level && (
                  <span className="text-[9px] px-2 py-1 bg-[#EFF1F4] border border-[#E8EAEE] rounded text-[#666D7A] capitalize">
                    Modulation: {nutritionPlan.modulation_level}
                  </span>
                )}
              </div>
            ) : (
              <p className="text-[10px] text-[#98A0AD] italic">No active nutrition plan</p>
            )}
          </div>

        </div>
      </div>

      {/* Footer legend */}
      <div className="px-5 py-3 border-t border-[#E8EAEE] flex items-center gap-4 flex-wrap">
        {[
          { dot: 'bg-stone-400', label: 'Planned' },
          { dot: 'bg-amber-400', label: 'In Progress' },
          { dot: 'bg-green-500', label: 'Complete' },
        ].map(item => (
          <div key={item.label} className="flex items-center gap-1.5">
            <div className={`w-1.5 h-1.5 rounded-full ${item.dot}`} />
            <span className="text-[9px] text-[#98A0AD]">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
