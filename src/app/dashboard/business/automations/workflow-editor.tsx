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
  { value: 'booking_created', label: 'Booking Created', description: 'Fires when a Zoom 1 or Zoom 2 is booked' },
  { value: 'payment_completed', label: 'Payment Completed', description: 'Fires when a payment is marked paid' },
  { value: 'pipeline_stage_changed', label: 'Pipeline Stage Changed', description: 'Fires when a lead moves to a new stage' },
  { value: 'tag_added', label: 'Tag Added', description: 'Fires when a tag is applied to a contact' },
  { value: 'form_submitted', label: 'Form Submitted', description: 'Fires when a form is submitted' },
]

const PIPELINE_STAGES = [
  { value: 'new_check_in', label: 'New Lead' },
  { value: 'report_sent', label: 'Report Sent' },
  { value: 'zoom_1_booked', label: 'Zoom 1 Booked' },
  { value: 'zoom_1_completed', label: 'Zoom 1 Done' },
  { value: 'zoom_2_booked', label: 'Zoom 2 Booked' },
  { value: 'zoom_2_completed', label: 'Zoom 2 Done' },
  { value: 'commencement_fee_paid', label: 'Fee Paid' },
  { value: 'active_coaching', label: 'Active Client' },
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
      <div className="absolute left-7 -top-4 w-px h-4 bg-stone-800" />

      <div className="bg-stone-900 border border-stone-800 rounded-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 p-3">
          <button
            {...attributes}
            {...listeners}
            className="text-stone-600 hover:text-stone-400 cursor-grab active:cursor-grabbing p-1"
          >
            <GripVertical size={14} />
          </button>

          {step.type === 'wait' && <Clock size={14} className="text-amber-400 shrink-0" />}
          {step.type === 'condition' && <GitBranch size={14} className="text-violet-400 shrink-0" />}
          {step.type === 'action' && ActionIcon && <ActionIcon size={14} className="text-teal-400 shrink-0" />}

          <span className="text-sm font-medium text-white flex-1">
            {step.type === 'wait'
              ? `Wait ${step.config.amount || '?'} ${step.config.unit || 'hours'}`
              : step.type === 'condition'
              ? 'Condition'
              : actionDef?.label ?? 'Action'}
          </span>

          <button onClick={() => setExpanded(e => !e)} className="text-stone-500 hover:text-stone-300 p-1">
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          <button onClick={() => onDelete(step.id)} className="text-stone-600 hover:text-red-400 transition-colors p-1">
            <Trash2 size={13} />
          </button>
        </div>

        {/* Config */}
        {expanded && (
          <div className="px-4 pb-4 pt-1 border-t border-stone-800 space-y-3">
            {step.type === 'action' && (
              <>
                {/* Action type picker */}
                <div>
                  <label className="block text-xs text-stone-500 mb-1.5">Action</label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {ACTION_DEFS.map(def => {
                      const Icon = def.icon
                      return (
                        <button
                          key={def.type}
                          onClick={() => onUpdate(step.id, { action_type: def.type, config: {} })}
                          className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs border transition-colors ${
                            step.action_type === def.type
                              ? 'bg-teal-500/10 border-teal-500/40 text-teal-400'
                              : 'border-stone-700 text-stone-400 hover:border-stone-600 hover:text-white'
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
                    <label className="block text-xs text-stone-500 mb-1.5">{field.label}</label>
                    {field.type === 'textarea' ? (
                      <textarea
                        value={(step.config[field.key] as string) || ''}
                        onChange={e => onUpdate(step.id, {
                          config: { ...step.config, [field.key]: e.target.value }
                        })}
                        rows={3}
                        placeholder={`Enter ${field.label.toLowerCase()}...`}
                        className="w-full bg-stone-800 border border-stone-700 rounded-lg px-3 py-2 text-xs text-white placeholder-stone-600 resize-none focus:outline-none focus:border-stone-500"
                      />
                    ) : field.type === 'select' ? (
                      <select
                        value={(step.config[field.key] as string) || ''}
                        onChange={e => onUpdate(step.id, {
                          config: { ...step.config, [field.key]: e.target.value }
                        })}
                        className="w-full bg-stone-800 border border-stone-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-stone-500"
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
                        className="w-full bg-stone-800 border border-stone-700 rounded-lg px-3 py-2 text-xs text-white placeholder-stone-600 focus:outline-none focus:border-stone-500"
                      />
                    )}
                  </div>
                ))}

                {/* Variable hint */}
                <p className="text-[10px] text-stone-600">
                  Variables: {'{{contact_name}}'} {'{{contact_email}}'} {'{{booking_date}}'} {'{{zoom_link}}'}
                </p>
              </>
            )}

            {step.type === 'wait' && (
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="block text-xs text-stone-500 mb-1.5">Amount</label>
                  <input
                    type="number"
                    min="1"
                    value={(step.config.amount as string) || ''}
                    onChange={e => onUpdate(step.id, {
                      config: { ...step.config, amount: e.target.value }
                    })}
                    className="w-full bg-stone-800 border border-stone-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-stone-500"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-xs text-stone-500 mb-1.5">Unit</label>
                  <select
                    value={(step.config.unit as string) || 'hours'}
                    onChange={e => onUpdate(step.id, {
                      config: { ...step.config, unit: e.target.value }
                    })}
                    className="w-full bg-stone-800 border border-stone-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-stone-500"
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
      <div className="w-px h-4 bg-stone-800" />
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 text-xs text-stone-500 hover:text-white border border-stone-700 hover:border-stone-500 px-3 py-1.5 rounded-lg transition-colors bg-stone-950"
      >
        <Plus size={12} />
        Add Step
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute top-8 z-20 bg-stone-900 border border-stone-700 rounded-xl shadow-2xl overflow-hidden w-44">
            {[
              { type: 'action' as StepType, label: 'Action', icon: Zap, colour: 'text-teal-400' },
              { type: 'wait' as StepType, label: 'Wait / Delay', icon: Clock, colour: 'text-amber-400' },
              { type: 'condition' as StepType, label: 'Condition', icon: GitBranch, colour: 'text-violet-400' },
            ].map(opt => {
              const Icon = opt.icon
              return (
                <button
                  key={opt.type}
                  onClick={() => { onAdd(opt.type); setOpen(false) }}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs text-stone-300 hover:bg-stone-800 transition-colors"
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
            className="w-full bg-transparent text-2xl font-semibold text-white placeholder-stone-600 focus:outline-none border-b border-transparent focus:border-stone-700 pb-1 transition-colors"
          />
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsActive(a => !a)}
            className={`flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg border transition-colors ${
              isActive
                ? 'bg-teal-500/10 border-teal-500/30 text-teal-400'
                : 'bg-stone-800 border-stone-700 text-stone-400'
            }`}
          >
            {isActive ? <Play size={11} /> : <Pause size={11} />}
            {isActive ? 'Active' : 'Paused'}
          </button>
          <button
            onClick={save}
            disabled={!name || !triggerType || isPending}
            className="flex items-center gap-2 bg-teal-500 hover:bg-teal-400 text-stone-950 text-sm font-semibold px-4 py-2 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {isPending ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
            Save
          </button>
        </div>
      </div>

      {/* Trigger block */}
      <div className="mb-2">
        <p className="text-[10px] font-semibold text-stone-600 uppercase tracking-widest mb-2 ml-1">Trigger</p>
        {selectedTrigger && !showTriggerPicker ? (
          <div
            className="bg-stone-900 border border-teal-500/30 rounded-xl p-4 flex items-center justify-between cursor-pointer hover:border-teal-500/60 transition-colors"
            onClick={() => setShowTriggerPicker(true)}
          >
            <div>
              <p className="text-sm font-semibold text-teal-400">{selectedTrigger.label}</p>
              <p className="text-xs text-stone-500 mt-0.5">{selectedTrigger.description}</p>
            </div>
            <button className="text-stone-600 hover:text-stone-400">
              <X size={14} />
            </button>
          </div>
        ) : (
          <div className="bg-stone-900 border border-stone-800 rounded-xl p-4">
            <p className="text-xs text-stone-500 mb-3">Choose what starts this workflow:</p>
            <div className="space-y-2">
              {TRIGGERS.map(trigger => (
                <button
                  key={trigger.value}
                  onClick={() => { setTriggerType(trigger.value); setShowTriggerPicker(false) }}
                  className={`w-full text-left px-3 py-2.5 rounded-lg border transition-colors ${
                    triggerType === trigger.value
                      ? 'bg-teal-500/10 border-teal-500/40'
                      : 'border-stone-800 hover:border-stone-700 hover:bg-stone-800/50'
                  }`}
                >
                  <p className={`text-sm font-medium ${triggerType === trigger.value ? 'text-teal-400' : 'text-white'}`}>
                    {trigger.label}
                  </p>
                  <p className="text-xs text-stone-500 mt-0.5">{trigger.description}</p>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Steps */}
      {triggerType && (
        <div className="mt-2">
          <p className="text-[10px] font-semibold text-stone-600 uppercase tracking-widest mb-2 ml-1 mt-4">Steps</p>

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
            <p className="text-center text-stone-600 text-xs mt-2">
              Add your first step above
            </p>
          )}
        </div>
      )}
    </div>
  )
}
