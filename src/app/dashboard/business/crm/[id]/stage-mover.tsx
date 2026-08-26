'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'

interface Props {
  leadId: string
  currentStatus: string
  stageOrder: string[]
  stageLabel: Record<string, string>
}

export default function StageMover({ leadId, currentStatus, stageOrder, stageLabel }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [optimisticStatus, setOptimisticStatus] = useState(currentStatus)

  const currentIndex = stageOrder.indexOf(optimisticStatus)
  const canGoBack = currentIndex > 0
  const canGoForward = currentIndex < stageOrder.length - 1

  async function moveStage(newStatus: string) {
    setOptimisticStatus(newStatus)
    startTransition(async () => {
      await fetch(`/api/leads/${leadId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      router.refresh()
    })
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => moveStage(stageOrder[currentIndex - 1])}
        disabled={!canGoBack || isPending}
        className="flex items-center gap-1.5 text-[12.5px] text-[#666D7A] hover:text-[#141821] border border-[#E8EAEE] hover:border-[#CFD4DC] disabled:opacity-30 disabled:cursor-not-allowed px-3 py-1.5 rounded-lg transition-colors"
      >
        <ChevronLeft size={13} />
        {canGoBack ? stageLabel[stageOrder[currentIndex - 1]] : 'Back'}
      </button>

      {isPending && <Loader2 size={13} className="text-[#666D7A] animate-spin" />}

      <button
        onClick={() => moveStage(stageOrder[currentIndex + 1])}
        disabled={!canGoForward || isPending}
        className="flex items-center gap-1.5 text-[12.5px] text-[#141821] bg-blue-50 hover:bg-blue-100 border border-blue-200 hover:border-blue-500/60 disabled:opacity-30 disabled:cursor-not-allowed px-3 py-1.5 rounded-lg transition-colors ml-auto"
      >
        {canGoForward ? stageLabel[stageOrder[currentIndex + 1]] : 'Done'}
        <ChevronRight size={13} />
      </button>
    </div>
  )
}
