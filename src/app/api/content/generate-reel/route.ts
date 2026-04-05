import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const maxDuration = 60

// POST /api/content/generate-reel
// Body: { output_id: string, script: string }
// 1. Sends script to ElevenLabs → generates audio with Kade's voice
// 2. Sends avatar_id + audio_url to HeyGen → renders video
// 3. Stores video_id and sets video_status = 'rendering' on the output row
// Caller polls /api/content/outputs/[id] for video_status = 'ready' and video_url

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const elevenLabsKey = process.env.ELEVENLABS_API_KEY
  const elevenLabsVoiceId = process.env.ELEVENLABS_VOICE_ID
  const heygenKey = process.env.HEYGEN_API_KEY
  const heygenAvatarId = process.env.HEYGEN_AVATAR_ID

  if (!elevenLabsKey || !elevenLabsVoiceId || !heygenKey || !heygenAvatarId) {
    return NextResponse.json(
      { error: 'Reel generation not configured. Set ELEVENLABS_API_KEY, ELEVENLABS_VOICE_ID, HEYGEN_API_KEY, HEYGEN_AVATAR_ID in Vercel env vars.' },
      { status: 503 }
    )
  }

  const { output_id, script } = await request.json()
  if (!output_id || !script?.trim()) {
    return NextResponse.json({ error: 'output_id and script are required.' }, { status: 400 })
  }

  // Step 1: ElevenLabs — convert script to audio
  const ttsResponse = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${elevenLabsVoiceId}`,
    {
      method: 'POST',
      headers: {
        'xi-api-key': elevenLabsKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: script,
        model_id: 'eleven_multilingual_v2',
        voice_settings: { stability: 0.5, similarity_boost: 0.75 },
      }),
    }
  )

  if (!ttsResponse.ok) {
    const err = await ttsResponse.text()
    return NextResponse.json({ error: `ElevenLabs error: ${err}` }, { status: 502 })
  }

  // Upload audio to ElevenLabs hosted storage so HeyGen can fetch it via URL
  // ElevenLabs returns raw audio — we need a publicly accessible URL.
  // We use HeyGen's upload endpoint to get a hosted audio URL.
  const audioBuffer = await ttsResponse.arrayBuffer()
  const audioBlob = new Blob([audioBuffer], { type: 'audio/mpeg' })
  const formData = new FormData()
  formData.append('file', audioBlob, 'voice.mp3')
  formData.append('type', 'audio')

  const uploadResponse = await fetch('https://upload.heygen.com/v1/asset', {
    method: 'POST',
    headers: { 'x-api-key': heygenKey },
    body: formData,
  })

  if (!uploadResponse.ok) {
    const err = await uploadResponse.text()
    return NextResponse.json({ error: `HeyGen audio upload error: ${err}` }, { status: 502 })
  }

  const { data: uploadData } = await uploadResponse.json()
  const audioUrl: string = uploadData?.url

  // Step 2: HeyGen — submit video generation job
  const videoPayload = {
    video_inputs: [
      {
        character: {
          type: 'avatar',
          avatar_id: heygenAvatarId,
          avatar_style: 'normal',
        },
        voice: {
          type: 'audio',
          audio_url: audioUrl,
        },
      },
    ],
    dimension: { width: 1080, height: 1920 }, // vertical reel format
    aspect_ratio: null,
  }

  const videoResponse = await fetch('https://api.heygen.com/v2/video/generate', {
    method: 'POST',
    headers: {
      'x-api-key': heygenKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(videoPayload),
  })

  if (!videoResponse.ok) {
    const err = await videoResponse.text()
    return NextResponse.json({ error: `HeyGen video error: ${err}` }, { status: 502 })
  }

  const { data: videoData } = await videoResponse.json()
  const heygenVideoId: string = videoData?.video_id

  // Step 3: Store video_id and set status = rendering on output row
  const adminSupabase = createAdminClient()
  await adminSupabase
    .from('be_content_outputs')
    .update({ heygen_video_id: heygenVideoId, video_status: 'rendering' })
    .eq('id', output_id)
    .eq('coach_id', user.id)

  return NextResponse.json({ heygen_video_id: heygenVideoId, video_status: 'rendering' })
}
