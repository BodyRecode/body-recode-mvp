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
  accumulation: 'bg-[rgba(27,109,252,0.08)] border-[#2A2F39] text-[#FFFFFF]',
  intensification: 'bg-[#1A1E26]/10 border-[#2A2F39]/30 text-[#C2C6CC]',
  realization: 'bg-[#1A1214] border-[#4A2222] text-[#D4817E]',
  restoration: 'bg-[#1A1E26]/10 border-[#2A2F39]/30 text-[#C2C6CC]',
}

const statusDot: Record<string, string> = {
  planned: 'bg-[#676D76]',
  in_progress: 'bg-[#E0A254]',
  complete: 'bg-[#6FA98B]',
  skipped: 'bg-[#1A1E26]',
}

const PILLARS = [
  { label: 'RRS', full: 'Recovery + Regulation', colour: 'text-[#D4817E]', desc: 'Governs all execution' },
  { label: 'Fat Map', full: 'Fat Map Method', colour: 'text-[#C2C6CC]', desc: 'Constraint authority' },
  { label: 'BIRS', full: 'Behaviour + Identity', colour: 'text-[#C2C6CC]', desc: 'Complexity limits' },
  { label: 'PTS', full: 'Progressive Training', colour: 'text-[#FFFFFF]', desc: 'Training demand' },
  { label: 'HABNS', full: 'Nutrition Support', colour: 'text-[#FAFAF8]', desc: 'Nutrition support' },
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
    <div className="bg-[#14171D] br-card overflow-hidden">
      <div className="px-5 py-3 border-b border-[#2A2F39]">
        <p className="text-[10px] font-medium text-[#8A9099]">System Hierarchy</p>
        <p className="text-[12.5px] text-[#676D76] mt-0.5">How macro, meso, micro and nutrition interact</p>
      </div>

      <div className="p-5 flex gap-6">

        {/* Left: Pillar stack */}
        <div className="shrink-0 w-40">
          <p className="text-[10px] font-medium text-[#676D76] mb-3">Cross-Pillar Order</p>
          <div className="space-y-1">
            {PILLARS.map((p, i) => (
              <div key={p.label} className="flex items-start gap-2">
                <div className="flex flex-col items-center shrink-0 mt-1">
                  <div className={`w-1.5 h-1.5 rounded-full ${i === 3 ? 'bg-[#242932]' : i === 4 ? 'bg-[#FAFAF8]' : 'bg-[#676D76]'}`} />
                  {i < PILLARS.length - 1 && <div className="w-px h-4 bg-[#2A2F39]" />}
                </div>
                <div>
                  <p className={`text-[10px] font-bold ${p.colour}`}>{p.label}</p>
                  <p className="text-[10px] text-[#676D76] leading-tight">{p.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Vertical divider */}
        <div className="w-px bg-[#1A1E26] shrink-0" />

        {/* Right: Macro → Meso → Micro → Nutrition */}
        <div className="flex-1 min-w-0 space-y-4">

          {/* Layer 1: Macro Arc */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-1.5 h-1.5 rounded-full bg-[#242932] shrink-0" />
              <p className="text-[10px] font-medium text-[#8A9099]">Macro Arc</p>
              {plan && <p className="text-[10px] text-[#676D76] ml-auto">{totalWeeks}w total</p>}
            </div>

            {plan ? (
              <div>
                <p className="text-[12.5px] font-semibold text-[#FAFAF8] mb-2">{plan.plan_name}</p>
                {plan.macro_objective && (
                  <p className="text-[10px] text-[#8A9099] mb-2 leading-relaxed">{plan.macro_objective}</p>
                )}
                {plan.plan_blocks.length > 0 && (
                  <div className="flex items-center gap-1 flex-wrap">
                    {plan.plan_blocks.map((block, i) => (
                      <div key={block.id} className="flex items-center gap-1">
                        <div className={`flex items-center gap-1.5 px-2 py-1 rounded border text-[10px] ${
                          block.status === 'in_progress'
                            ? `${phaseColour[block.progression_phase] || 'bg-[#1A1E26] border-[#2A2F39] text-[#8A9099]'} ring-1 ring-[#E0A254]/50`
                            : block.status === 'complete'
                            ? 'bg-[#1A1E26]/30 border-[#2A2F39] text-[#676D76]'
                            : phaseColour[block.progression_phase] || 'bg-[#1A1E26] border-[#2A2F39] text-[#8A9099]'
                        }`}>
                          <div className={`w-1 h-1 rounded-full shrink-0 ${statusDot[block.status]}`} />
                          <span className="font-medium truncate max-w-[80px]">{block.block_name}</span>
                          <span className="opacity-60">{block.week_duration}w</span>
                        </div>
                        {i < plan.plan_blocks.length - 1 && (
                          <span className="text-[#FAFAF8] text-[10px]">›</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-[10px] text-[#676D76] italic">No macro arc planned</p>
            )}
          </div>

          {/* Connector */}
          <div className="flex items-center gap-2 pl-1">
            <div className="w-px h-3 bg-[#2A2F39] ml-0.5" />
            <span className="text-[10px] text-[#FAFAF8]">current block</span>
          </div>

          {/* Layer 2: Meso Block */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-1.5 h-1.5 rounded-full bg-[#E0A254] shrink-0" />
              <p className="text-[10px] font-medium text-[#8A9099]">Meso Block</p>
            </div>

            {currentBlock ? (
              <div className={`px-3 py-2 rounded-lg border ${phaseColour[currentBlock.progression_phase] || 'bg-[#1A1E26] border-[#2A2F39]'}`}>
                <p className="text-[12.5px] font-semibold">{currentBlock.block_name}</p>
                <p className="text-[10px] opacity-70 mt-0.5 capitalize">{currentBlock.progression_phase} · {currentBlock.training_goal} · {currentBlock.week_duration}w</p>
              </div>
            ) : (
              <p className="text-[10px] text-[#676D76] italic">{plan ? 'No block in progress' : 'No meso block active'}</p>
            )}
          </div>

          {/* Connector */}
          <div className="flex items-center gap-2 pl-1">
            <div className="w-px h-3 bg-[#2A2F39] ml-0.5" />
            <span className="text-[10px] text-[#FAFAF8]">generates program</span>
          </div>

          {/* Layer 3: Micro Program */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-1.5 h-1.5 rounded-full bg-[#1A1E26] shrink-0" />
              <p className="text-[10px] font-medium text-[#8A9099]">Micro Program</p>
            </div>

            {activeProgram ? (
              <div className="px-3 py-2 rounded-lg bg-[#1A1E26]/50 border border-[#2A2F39]">
                <p className="text-[12.5px] font-semibold text-[#FAFAF8]">{activeProgram.block_name}</p>
                <p className="text-[10px] text-[#8A9099] mt-0.5 capitalize">
                  {activeProgram.progression_phase} · {activeProgram.training_goal} · {activeProgram.training_frequency}x/week · {activeProgram.week_duration}w
                </p>
              </div>
            ) : (
              <p className="text-[10px] text-[#676D76] italic">No active program</p>
            )}
          </div>

          {/* Connector */}
          <div className="flex items-center gap-2 pl-1">
            <div className="w-px h-3 bg-[#2A2F39] ml-0.5" />
            <span className="text-[10px] text-[#FAFAF8]">supported by</span>
          </div>

          {/* Layer 4: Nutrition */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-1.5 h-1.5 rounded-full bg-[#FAFAF8] shrink-0" />
              <p className="text-[10px] font-medium text-[#8A9099]">Nutrition Support</p>
            </div>

            {nutritionPlan ? (
              <div className="flex gap-2 flex-wrap">
                {nutritionPlan.entry_state && (
                  <span className="text-[10px] px-2 py-1 bg-[rgba(27,109,252,0.08)] border border-[#FAFAF8]/20 rounded text-[#FAFAF8] capitalize">
                    {nutritionPlan.entry_state}
                  </span>
                )}
                {nutritionPlan.carb_demand_level && (
                  <span className="text-[10px] px-2 py-1 bg-[#1A1E26] border border-[#2A2F39] rounded text-[#8A9099] capitalize">
                    Carbs: {nutritionPlan.carb_demand_level}
                  </span>
                )}
                {nutritionPlan.modulation_level && (
                  <span className="text-[10px] px-2 py-1 bg-[#1A1E26] border border-[#2A2F39] rounded text-[#8A9099] capitalize">
                    Modulation: {nutritionPlan.modulation_level}
                  </span>
                )}
              </div>
            ) : (
              <p className="text-[10px] text-[#676D76] italic">No active nutrition plan</p>
            )}
          </div>

        </div>
      </div>

      {/* Footer legend */}
      <div className="px-5 py-3 border-t border-[#2A2F39] flex items-center gap-4 flex-wrap">
        {[
          { dot: 'bg-[#676D76]', label: 'Planned' },
          { dot: 'bg-[#E0A254]', label: 'In Progress' },
          { dot: 'bg-[#6FA98B]', label: 'Complete' },
        ].map(item => (
          <div key={item.label} className="flex items-center gap-1.5">
            <div className={`w-1.5 h-1.5 rounded-full ${item.dot}`} />
            <span className="text-[10px] text-[#676D76]">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
