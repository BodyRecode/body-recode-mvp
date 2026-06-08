// Deep-dive render route.
//
// Hit by puppeteer inside the instant-engine fulfilment orchestrator to
// convert engine output (5 sections of prose) into a PDF. NOT linked from
// the platform UI - the only legitimate caller is the orchestrator.
//
// Gated by a shared secret in ?secret=<env> so neither members nor the
// public can hit it. Returns notFound() if secret is wrong, purchase
// missing, or engine output not yet stored on the purchase row.

import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import TrajectoryReadingLayout from '@/components/trajectory-reading-layout'
import MemberQuestionLayout from '@/components/member-question-layout'

type EngineEnvelope = {
  engine_call: string
  generated_at: string
  trajectory?: {
    sections: {
      tr_where_this_block_started: string
      tr_how_your_signal_moved: string
      tr_what_held_steady: string
      tr_what_this_sets_up_next: string
      tr_coach_note: string
    }
    blockStartWeek: number
    blockEndWeek: number
    weeksRead: number
    programId: string
    programName: string | null
    clientName: string
  }
  member_question?: {
    sections: {
      mq_what_youre_asking: string
      mq_what_the_data_says: string
      mq_body_recode_reading: string
      mq_this_week: string
    }
    memberName: string
    patternLabel: string
    blockLabel: string
    weekNumber: number
    question: string
    checkInsRead: number
  }
}

export default async function DeepDiveRenderPage({
  params,
  searchParams,
}: {
  params: Promise<{ purchase_id: string }>
  searchParams: Promise<{ secret?: string }>
}) {
  const { purchase_id } = await params
  const { secret } = await searchParams

  const expected = process.env.DEEP_DIVE_RENDER_SECRET
  if (!expected || !secret || secret !== expected) return notFound()

  const admin = createAdminClient()

  const { data: purchase } = await admin
    .from('digital_asset_purchases')
    .select('id, raw, product_id')
    .eq('id', purchase_id)
    .maybeSingle()
  if (!purchase) return notFound()

  const raw = (purchase.raw ?? {}) as Record<string, unknown>
  const envelope = (raw.engine_output ?? null) as EngineEnvelope | null
  if (!envelope) return notFound()

  const { data: product } = await admin
    .from('be_products')
    .select('name')
    .eq('id', purchase.product_id)
    .maybeSingle()
  const productName = product?.name ?? 'AI Deep-Dive'

  if (envelope.engine_call === 'member_question' && envelope.member_question) {
    const mq = envelope.member_question
    return (
      <MemberQuestionLayout
        data={{
          question: mq.question,
          sections: mq.sections,
          memberName: mq.memberName,
          patternLabel: mq.patternLabel,
          blockLabel: mq.blockLabel,
          weekNumber: mq.weekNumber,
          generated_at: envelope.generated_at,
        }}
      />
    )
  }

  if (envelope.engine_call === 'trajectory' && envelope.trajectory) {
    const t = envelope.trajectory
    return (
      <TrajectoryReadingLayout
        reading={{
          tr_where_this_block_started: t.sections.tr_where_this_block_started,
          tr_how_your_signal_moved: t.sections.tr_how_your_signal_moved,
          tr_what_held_steady: t.sections.tr_what_held_steady,
          tr_what_this_sets_up_next: t.sections.tr_what_this_sets_up_next,
          tr_coach_note: t.sections.tr_coach_note,
          block_name: `${productName} - ${t.programName ?? 'Recent Block'}`,
          progression_phase: null,
          training_goal: null,
          generated_at: envelope.generated_at,
          trajectory_reading_published_at: envelope.generated_at,
        }}
        client={{ name: t.clientName }}
      />
    )
  }

  return notFound()
}
