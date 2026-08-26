'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor,
  useSensor, useSensors, DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove, SortableContext, sortableKeyboardCoordinates,
  useSortable, verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  GripVertical, Plus, Trash2, Loader2, Mail, MessageSquare,
  Tag, ArrowRight, Bell, Clock, GitBranch, Save, Play, Pause, ChevronDown, ChevronUp, X,
} from 'lucide-react'

// ─── Types ───────────────────────────────────────────────────────────────────

export type StepType = 'action' | 'wait' | 'condition'
export type ActionType =
  | 'send_email' | 'send_sms' | 'add_tag' | 'remove_tag'
  | 'move_pipeline_stage' | 'notify_coach' | 'trigger_intake' | 'create_booking'

export interface WorkflowStep {
  id: string
  type: StepType
  action_type?: ActionType
  config: Record<string, string | number>
  position: number
}

export interface WorkflowData {
  id?: string
  name: string
  trigger_type: string
  trigger_config: Record<string, string>
  is_active: boolean
  steps: WorkflowStep[]
}

// ─── Constants ───────────────────────────────────────────────────────────────

const TRIGGERS = [
  { value: 'lead_created', label: 'Lead Created', description: 'Fires when a new lead enters the CRM' },
  { value: 'booking_created', label: 'Booking Created', description: 'Fires when a Zoom is booked' },
  { value: 'payment_completed', label: 'Payment Completed', description: 'Fires when a payment is marked paid' },
  { value: 'pipeline_stage_changed', label: 'Pipeline Stage Changed', description: 'Fires when a lead moves to a new stage' },
  { value: 'tag_added', label: 'Tag Added', description: 'Fires when a tag is applied to a contact' },
  { value: 'form_submitted', label: 'Form Submitted', description: 'Fires when a form is submitted' },
]

const PIPELINE_STAGES = [
  { value: 'new', label: 'New Lead' },
  { value: 'report_sent', label: 'Report Sent' },
  { value: 'zoom_1_booked', label: 'Zoom Booked' },
  { value: 'zoom_1_completed', label: 'Zoom Completed' },
  { value: 'commencement_fee_paid', label: 'Commencement Fee Paid' },
  { value: 'active_client', label: 'Active Client' },
]

const ACTION_DEFS: {
  type: ActionType; label: string; icon: React.ComponentType<{ size?: number; className?: string }>
  fields: { key: string; label: string; type: 'text' | 'textarea' | 'select' | 'number'; options?: { value: string; label: string }[] }[]
}[] = [
  {
    type: 'send_email', label: 'Send Email', icon: Mail,
    fields: [
      { key: 'subject', label: 'Subject', type: 'text' },
      { key: 'body', label: 'Body', type: 'textarea' },
    ],
  },
  {
    type: 'send_sms', label: 'Send SMS', icon: MessageSquare,
    fields: [{ key: 'message', label: 'Message', type: 'textarea' }],
  },
  {
    type: 'add_tag', label: 'Add Tag', icon: Tag,
    fields: [{ key: 'tag', label: 'Tag Name', type: 'text' }],
  },
  {
    type: 'remove_tag', label: 'Remove Tag', icon: Tag,
    fields: [{ key: 'tag', label: 'Tag Name', type: 'text' }],
  },
  {
    type: 'move_pipeline_stage', label: 'Move Pipeline Stage', icon: ArrowRight,
    fields: [{ key: 'stage', label: 'Stage', type: 'select', options: PIPELINE_STAGES }],
  },
  {
    type: 'notify_coach', label: 'Notify Coach', icon: Bell,
    fields: [{ key: 'message', label: 'Message', type: 'textarea' }],
  },
]

const WAIT_UNITS = [
  { value: 'minutes', label: 'Minutes' },
  { value: 'hours', label: 'Hours' },
  { value: 'days', label: 'Days' },
]

// ─── Sortable Step Card ───────────────────────────────────────────────────────

function SortableStep({
  step, onUpdate, onDelete,
}: {
  step: WorkflowStep
  onUpdate: (id: string, updates: Partial<WorkflowStep>) => void
  onDelete: (id: string) => void
}) {
  const [expanded, setExpanded] = useState(true)
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: step.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const actionDef = ACTION_DEFS.find(a => a.type === step.action_type)
  const ActionIcon = actionDef?.icon

  return (
    <div ref={setNodeRef} style={style} className="relative">
      {/* Connector line */}
      <div className="absolute left-7 -top-4 w-px h-4 bg-[#EFF1F4]" />

      <div className="bg-[#F4F6F9] border border-[#E8EAEE] rounded-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 p-3">
          <button
            {...attributes}
            {...listeners}
            className="text-[#98A0AD] hover:text-[#666D7A] cursor-grab active:cursor-grabbing p-1"
          >
            <GripVertical size={14} />
          </button>

          {step.type === 'wait' && <Clock size={14} className="text-amber-700 shrink-0" />}
          {step.type === 'condition' && <GitBranch size={14} className="text-violet-700 shrink-0" />}
          {step.type === 'action' && ActionIcon && <ActionIcon size={14} className="text-blue-500 shrink-0" />}

          <span className="text-sm font-medium text-[#141821] flex-1">
            {step.type === 'wait'
              ? `Wait ${step.config.amount || '?'} ${step.config.unit || 'hours'}`
              : step.type === 'condition'
              ? 'Condition'
              : actionDef?.label ?? 'Action'}
          </span>

          <button onClick={() => setExpanded(e => !e)} className="text-[#666D7A] hover:text-[#141821] p-1">
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          <button onClick={() => onDelete(step.id)} className="text-[#98A0AD] hover:text-red-700 transition-colors p-1">
            <Trash2 size={13} />
          </button>
        </div>

        {/* Config */}
        {expanded && (
          <div className="px-4 pb-4 pt-1 border-t border-[#E8EAEE] space-y-3">
            {step.type === 'action' && (
              <>
                {/* Action type picker */}
                <div>
                  <label className="block text-[12.5px] text-[#666D7A] mb-1.5">Action</label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {ACTION_DEFS.map(def => {
                      const Icon = def.icon
                      return (
                        <button
                          key={def.type}
                          onClick={() => onUpdate(step.id, { action_type: def.type, config: {} })}
                          className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs border transition-colors ${
                            step.action_type === def.type
                              ? 'bg-blue-50 border-blue-300 text-blue-500'
                              : 'border-[#E8EAEE] text-[#666D7A] hover:border-[#CFD4DC] hover:text-[#141821]'
                          }`}
                        >
                          <Icon size={11} />
                          {def.label}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Action fields */}
                {actionDef?.fields.map(field => (
                  <div key={field.key}>
                    <label className="block text-[12.5px] text-[#666D7A] mb-1.5">{field.label}</label>
                    {field.type === 'textarea' ? (
                      <textarea
                        value={(step.config[field.key] as string) || ''}
                        onChange={e => onUpdate(step.id, {
                          config: { ...step.config, [field.key]: e.target.value }
                        })}
                        rows={3}
                        placeholder={`Enter ${field.label.toLowerCase()}...`}
                        className="w-full bg-[#EFF1F4] border border-[#E8EAEE] rounded-lg px-3 py-2 text-[12.5px] text-[#141821] placeholder-[#98A0AD] resize-none focus:outline-none focus:border-[#CFD4DC]"
                      />
                    ) : field.type === 'select' ? (
                      <select
                        value={(step.config[field.key] as string) || ''}
                        onChange={e => onUpdate(step.id, {
                          config: { ...step.config, [field.key]: e.target.value }
                        })}
                        className="w-full bg-[#EFF1F4] border border-[#E8EAEE] rounded-lg px-3 py-2 text-[12.5px] text-[#141821] focus:outline-none focus:border-[#CFD4DC]"
                      >
                        <option value="">Select...</option>
                        {field.options?.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        value={(step.config[field.key] as string) || ''}
                        onChange={e => onUpdate(step.id, {
                          config: { ...step.config, [field.key]: e.target.value }
                        })}
                        placeholder={`Enter ${field.label.toLowerCase()}...`}
                        className="w-full bg-[#EFF1F4] border border-[#E8EAEE] rounded-lg px-3 py-2 text-[12.5px] text-[#141821] placeholder-[#98A0AD] focus:outline-none focus:border-[#CFD4DC]"
                      />
                    )}
                  </div>
                ))}

                {/* Variable hint */}
                <p className="text-[10px] text-[#98A0AD]">
                  Variables: {'{{contact_name}}'} {'{{contact_email}}'} {'{{booking_date}}'} {'{{zoom_link}}'}
                </p>
              </>
            )}

            {step.type === 'wait' && (
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="block text-[12.5px] text-[#666D7A] mb-1.5">Amount</label>
                  <input
                    type="number"
                    min="1"
                    value={(step.config.amount as string) || ''}
                    onChange={e => onUpdate(step.id, {
                      config: { ...step.config, amount: e.target.value }
                    })}
                    className="w-full bg-[#EFF1F4] border border-[#E8EAEE] rounded-lg px-3 py-2 text-[12.5px] text-[#141821] focus:outline-none focus:border-[#CFD4DC]"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-[12.5px] text-[#666D7A] mb-1.5">Unit</label>
                  <select
                    value={(step.config.unit as string) || 'hours'}
                    onChange={e => onUpdate(step.id, {
                      config: { ...step.config, unit: e.target.value }
                    })}
                    className="w-full bg-[#EFF1F4] border border-[#E8EAEE] rounded-lg px-3 py-2 text-[12.5px] text-[#141821] focus:outline-none focus:border-[#CFD4DC]"
                  >
                    {WAIT_UNITS.map(u => (
                      <option key={u.value} value={u.value}>{u.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Add Step Button ──────────────────────────────────────────────────────────

function AddStepButton({ onAdd }: { onAdd: (type: StepType) => void }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="relative flex flex-col items-center">
      <div className="w-px h-4 bg-[#EFF1F4]" />
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 text-[12.5px] text-[#666D7A] hover:text-[#141821] border border-[#E8EAEE] hover:border-[#CFD4DC] px-3 py-1.5 rounded-lg transition-colors bg-[#FBFCFD]"
      >
        <Plus size={12} />
        Add Step
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute top-8 z-20 bg-[#F4F6F9] border border-[#E8EAEE] rounded-xl shadow-2xl overflow-hidden w-44">
            {[
              { type: 'action' as StepType, label: 'Action', icon: Zap, colour: 'text-blue-500' },
              { type: 'wait' as StepType, label: 'Wait / Delay', icon: Clock, colour: 'text-amber-700' },
              { type: 'condition' as StepType, label: 'Condition', icon: GitBranch, colour: 'text-violet-700' },
            ].map(opt => {
              const Icon = opt.icon
              return (
                <button
                  key={opt.type}
                  onClick={() => { onAdd(opt.type); setOpen(false) }}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[12.5px] text-[#141821] hover:bg-[#EFF1F4] transition-colors"
                >
                  <Icon size={13} className={opt.colour} />
                  {opt.label}
                </button>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}

// Zap icon for add step button
function Zap({ size = 16, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  )
}

// ─── Main Editor ──────────────────────────────────────────────────────────────

interface Props {
  initial?: WorkflowData
}

export default function WorkflowEditor({ initial }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [name, setName] = useState(initial?.name ?? '')
  const [triggerType, setTriggerType] = useState(initial?.trigger_type ?? '')
  const [triggerConfig, setTriggerConfig] = useState(initial?.trigger_config ?? {})
  const [isActive, setIsActive] = useState(initial?.is_active ?? true)
  const [steps, setSteps] = useState<WorkflowStep[]>(initial?.steps ?? [])
  const [showTriggerPicker, setShowTriggerPicker] = useState(!initial?.trigger_type)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  function addStep(type: StepType) {
    const newStep: WorkflowStep = {
      id: crypto.randomUUID(),
      type,
      action_type: type === 'action' ? 'send_email' : undefined,
      config: type === 'wait' ? { amount: '1', unit: 'hours' } : {},
      position: steps.length,
    }
    setSteps(s => [...s, newStep])
  }

  function updateStep(id: string, updates: Partial<WorkflowStep>) {
    setSteps(s => s.map(step => step.id === id ? { ...step, ...updates } : step))
  }

  function deleteStep(id: string) {
    setSteps(s => s.filter(step => step.id !== id))
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (over && active.id !== over.id) {
      setSteps(items => {
        const oldIndex = items.findIndex(i => i.id === active.id)
        const newIndex = items.findIndex(i => i.id === over.id)
        return arrayMove(items, oldIndex, newIndex).map((s, i) => ({ ...s, position: i }))
      })
    }
  }

  function save() {
    if (!name || !triggerType) return
    const payload = {
      name, trigger_type: triggerType, trigger_config: triggerConfig,
      is_active: isActive,
      steps: steps.map((s, i) => ({ ...s, position: i })),
    }
    startTransition(async () => {
      const url = initial?.id
        ? `/api/automations/${initial.id}`
        : '/api/automations'
      const method = initial?.id ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (res.ok) {
        router.push('/dashboard/business/automations')
        router.refresh()
      }
    })
  }

  const selectedTrigger = TRIGGERS.find(t => t.value === triggerType)

  return (
    <div className="max-w-2xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex-1 mr-4">
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Workflow name..."
            className="w-full bg-transparent text-[22px] font-semibold text-[#141821] tracking-[-0.025em] placeholder-[#98A0AD] focus:outline-none border-b border-transparent focus:border-[#E8EAEE] pb-1 transition-colors"
          />
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsActive(a => !a)}
            className={`flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg border transition-colors ${
              isActive
                ? 'bg-blue-50 border-blue-200 text-blue-500'
                : 'bg-[#EFF1F4] border-[#E8EAEE] text-[#666D7A]'
            }`}
          >
            {isActive ? <Play size={11} /> : <Pause size={11} />}
            {isActive ? 'Active' : 'Paused'}
          </button>
          <button
            onClick={save}
            disabled={!name || !triggerType || isPending}
            className="flex items-center gap-2 bg-blue-500 hover:bg-blue-500 text-[#FBFCFD] text-sm font-semibold px-4 py-2 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {isPending ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
            Save
          </button>
        </div>
      </div>

      {/* Trigger block */}
      <div className="mb-2">
        <p className="text-[10px] font-semibold text-[#98A0AD] mb-2 ml-1">Trigger</p>
        {selectedTrigger && !showTriggerPicker ? (
          <div
            className="bg-[#F4F6F9] border border-blue-200 rounded-xl p-4 flex items-center justify-between cursor-pointer hover:border-blue-500/60 transition-colors"
            onClick={() => setShowTriggerPicker(true)}
          >
            <div>
              <p className="text-sm font-semibold text-blue-500">{selectedTrigger.label}</p>
              <p className="text-[12.5px] text-[#666D7A] mt-0.5">{selectedTrigger.description}</p>
            </div>
            <button className="text-[#98A0AD] hover:text-[#666D7A]">
              <X size={14} />
            </button>
          </div>
        ) : (
          <div className="bg-[#F4F6F9] border border-[#E8EAEE] rounded-xl p-4">
            <p className="text-[12.5px] text-[#666D7A] mb-3">Choose what starts this workflow:</p>
            <div className="space-y-2">
              {TRIGGERS.map(trigger => (
                <button
                  key={trigger.value}
                  onClick={() => { setTriggerType(trigger.value); setShowTriggerPicker(false) }}
                  className={`w-full text-left px-3 py-2.5 rounded-lg border transition-colors ${
                    triggerType === trigger.value
                      ? 'bg-blue-50 border-blue-300'
                      : 'border-[#E8EAEE] hover:border-[#E8EAEE] hover:bg-[#EFF1F4]/50'
                  }`}
                >
                  <p className={`text-sm font-medium ${triggerType === trigger.value ? 'text-blue-500' : 'text-[#141821]'}`}>
                    {trigger.label}
                  </p>
                  <p className="text-[12.5px] text-[#666D7A] mt-0.5">{trigger.description}</p>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Steps */}
      {triggerType && (
        <div className="mt-2">
          <p className="text-[10px] font-semibold text-[#98A0AD] mb-2 ml-1 mt-4">Steps</p>

          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={steps.map(s => s.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-0 flex flex-col">
                {steps.map((step) => (
                  <SortableStep
                    key={step.id}
                    step={step}
                    onUpdate={updateStep}
                    onDelete={deleteStep}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>

          <AddStepButton onAdd={addStep} />

          {steps.length === 0 && (
            <p className="text-center text-[#98A0AD] text-[12.5px] mt-2">
              Add your first step above
            </p>
          )}
        </div>
      )}
    </div>
  )
}
