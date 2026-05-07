import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const maxDuration = 300

// POST /api/content/generate-reel
// Body: { output_id: string, script: string }
// 1. ElevenLabs → audio (Kade's cloned voice)
// 2. Upload audio to Supabase Storage (content-audio bucket) → public URL
// 3. HeyGen video/generate with avatar + audio_url → video_id
// 4. Store video_id, set video_status = 'rendering'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const elevenLabsKey = process.env.ELEVENLABS_API_KEY
  const elevenLabsVoiceId = process.env.ELEVENLABS_VOICE_ID
  const heygenKey = process.env.HEYGEN_API_KEY
  const heygenAvatarId = process.env.HEYGEN_AVATAR_ID
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

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

  // Step 1: ElevenLabs — convert script to Kade's voice
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
    console.error('ElevenLabs TTS error:', ttsResponse.status, err)
    return NextResponse.json({ error: `ElevenLabs error: ${err}` }, { status: 502 })
  }

  const audioBuffer = await ttsResponse.arrayBuffer()

  // Step 2: Upload audio to Supabase Storage → get public URL for HeyGen
  const adminSupabase = createAdminClient()
  const fileName = `reel-audio/${output_id}-${Date.now()}.mp3`

  const { error: uploadError } = await adminSupabase.storage
    .from('content-audio')
    .upload(fileName, Buffer.from(audioBuffer), {
      contentType: 'audio/mpeg',
      upsert: true,
    })

  if (uploadError) {
    console.error('Supabase storage upload error:', uploadError)
    return NextResponse.json({ error: `Audio storage error: ${uploadError.message}` }, { status: 502 })
  }

  const { data: publicUrlData } = adminSupabase.storage
    .from('content-audio')
    .getPublicUrl(fileName)

  const audioUrl = publicUrlData.publicUrl

  // Step 3: HeyGen — submit video generation job
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
    dimension: { width: 1080, height: 1920 },
    aspect_ratio: null,
  }

  console.log('Submitting to HeyGen with audio_url:', audioUrl)

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
    console.error('HeyGen video generate error:', videoResponse.status, err)
    return NextResponse.json({ error: `HeyGen video error: ${err}` }, { status: 502 })
  }

  const videoJson = await videoResponse.json()
  console.log('HeyGen video response:', JSON.stringify(videoJson))
  const heygenVideoId: string = videoJson?.data?.video_id ?? videoJson?.video_id

  // Step 4: Store video_id and set status = rendering
  await adminSupabase
    .from('be_content_outputs')
    .update({ heygen_video_id: heygenVideoId, video_status: 'rendering' })
    .eq('id', output_id)
    .eq('coach_id', user.id)

  return NextResponse.json({ heygen_video_id: heygenVideoId, video_status: 'rendering' })
}
