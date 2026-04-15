import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { id } = await params
  const { transcript, memberName, signalPattern, slsLevel, rpsLevel, rilsLevel } = await request.json()

  if (!transcript?.trim()) return NextResponse.json({ error: 'No transcript provided' }, { status: 400 })

  const systemPrompt = `You are an internal documentation assistant for Body Recode™, a biology-first performance coaching system.

Your role is to analyse Zoom consultation transcripts and produce structured internal summaries for the coach (Kade Dunstone). These summaries are coach-facing only — never shared with the member.

The Zoom is a 45–60 minute call split into two halves: the first half covers pattern clarification (not a sales call, diagnosis, or coaching intervention), and the second half covers pricing and decision. The goal is: the member moves from "I'm being evaluated" → "This person understands me" → "I want to proceed."

Your summary must be observational, precise, and clinically neutral. Do not add commentary or suggestions beyond what the transcript supports. Do not invent details not present in the transcript.`

  const userPrompt = `Member: ${memberName}
Signal Pattern: ${signalPattern}
SLS Level: ${slsLevel} | RPS Level: ${rpsLevel} | RILS Level: ${rilsLevel}

TRANSCRIPT:
${transcript}

Generate a structured Zoom consultation summary with the following sections. Be specific and quote from the transcript where useful.

## Opening Frame
How did the member respond when the call opened? Tone, energy, any notable first impressions.

## Report Reflection
What did the member say stood out from their report? What resonated? Anything they pushed back on or were surprised by?

## Context Exploration
Key context revealed during the call. Training structure, recovery patterns, sleep, external load, life factors. Include specifics mentioned.

## Signal Confirmation
Did the conversation confirm or complicate the SLS/RPS/RILS levels from the check-in? Note any signals that surfaced in conversation that weren't captured in the quiz.

## Pattern Interpretation Response
How did the member respond to the pattern interpretation? Did they connect with it? Were there signs of resistance or breakthrough moments?

## Psychological Readiness
Category: [A / B / C]
- A = Ready, clear interest in proceeding
- B = Interested but hesitant — note specific hesitations
- C = Not ready or not a right fit — note why

Brief explanation of your assessment.

## Hesitations and Constraints
Any practical or psychological barriers mentioned (cost, time, past experiences, scepticism, partner/family considerations).

## Next Step Outcome
What was agreed or discussed at the close? (Commencement fee paid / follow-up scheduled / left open / not proceeding)

## Follow-Up Actions
Any specific actions required after the call. Include anything you said you'd send or look into.

## Governance Note
Did the consultation stay within Zoom 1 doctrine bounds? (No prescriptions, no programming, no medical interpretation, no outcome promises.) Note any moments that approached the boundary.`

  const response = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1500,
    messages: [{ role: 'user', content: userPrompt }],
    system: systemPrompt,
  })

  const summary = (response.content[0] as { type: string; text: string }).text

  await supabase
    .from('leads')
    .update({ zoom_transcript: transcript, zoom_summary: summary })
    .eq('id', id)

  return NextResponse.json({ summary })
}
