/**
 * Fetch a stored photo for a read. Moved out of generate-cffs/route.ts on
 * 2026-09-14, unchanged, so the Progress Read reads photos the same way.
 */
import {
  sniffImageMediaType,
  describeImageFormat,
  type ImageMediaType,
} from '@/lib/image-media-type'

// Anthropic vision accepts up to 5MB per image. Our baseline pipeline already
// compresses to 1600px / 0.82 JPEG (~400KB) so we never approach the cap, but
// the timeout keeps a stuck S3 fetch from blocking the whole CFFS generation.
const IMAGE_FETCH_TIMEOUT_MS = 15_000

export async function fetchImageAsBase64(
  url: string,
): Promise<{ base64: string; media_type: ImageMediaType } | null> {
  try {
    const controller = new AbortController()
    const t = setTimeout(() => controller.abort(), IMAGE_FETCH_TIMEOUT_MS)
    const res = await fetch(url, { signal: controller.signal })
    clearTimeout(t)
    if (!res.ok) {
      console.warn(`[CFFS] baseline photo fetch failed: ${res.status} ${url.slice(0, 80)}…`)
      return null
    }
    const buf = Buffer.from(await res.arrayBuffer())
    const media_type = sniffImageMediaType(buf)
    if (!media_type) {
      console.warn(
        `[CFFS] baseline photo skipped — ${describeImageFormat(buf)} is not readable by Anthropic vision ` +
        `(JPEG/PNG/GIF/WebP only). Client should retake with the camera set to JPEG. ${url.slice(0, 120)}`
      )
      return null
    }
    return { base64: buf.toString('base64'), media_type }
  } catch (err) {
    console.warn('[CFFS] baseline photo fetch threw:', err instanceof Error ? err.message : err)
    return null
  }
}
