// Resize and re-encode an image client-side so the request body stays
// under Vercel's 4.5MB serverless limit. Modern phones produce 5-15MB
// photos which would otherwise be rejected with HTTP 413 before the
// route handler runs.
//
// Uses createImageBitmap with imageOrientation: 'from-image' so EXIF
// rotation is respected on iOS Safari and Android Chrome.
//
// Returns the original File when:
//   - The input is not an image (e.g. a PDF)
//   - createImageBitmap or canvas encoding fails
//   - Re-encoding produced a larger file AND the original is already readable
//
// THE HEIC BUG, fixed 21 September 2026. An iPhone shoots HEIC by default and
// this function already converts it correctly: iOS has the decoder, so
// createImageBitmap reads it and the canvas writes JPEG. The conversion then
// got THROWN AWAY by the size check, because HEIC is a much better format than
// JPEG and the converted file is often bigger than the original.
//
// So the one case the check existed to optimise was the one case where keeping
// the original made the photo unreadable to everything downstream. The client
// was then shown a message telling her to go into her iPhone settings and
// change her camera format, which is not a thing to ask of somebody sending
// you a photograph of her own body.
//
// Size now loses to readability. A slightly larger JPEG we can actually read
// beats a smaller HEIC we cannot.

export function isUnreadableImageFormat(file: File): boolean {
  const type = (file.type || '').toLowerCase()
  if (/heic|heif|avif|tiff/.test(type)) return true
  return /\.(heic|heif|avif|tiff?)$/i.test(file.name)
}

export async function compressImage(
  file: File,
  maxDim = 1600,
  quality = 0.82,
): Promise<File> {
  if (!file.type.startsWith('image/')) return file
  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
    const { width, height } = bitmap
    const scale = Math.min(1, maxDim / Math.max(width, height))
    const targetW = Math.max(1, Math.round(width * scale))
    const targetH = Math.max(1, Math.round(height * scale))
    const canvas = document.createElement('canvas')
    canvas.width = targetW
    canvas.height = targetH
    const ctx = canvas.getContext('2d')
    if (!ctx) return file
    ctx.drawImage(bitmap, 0, 0, targetW, targetH)
    bitmap.close?.()
    const blob: Blob | null = await new Promise(res => canvas.toBlob(res, 'image/jpeg', quality))
    if (!blob) return file

    // Keep the conversion whenever the source cannot be read downstream, even
    // if it came out larger. See the HEIC note above.
    const mustConvert = isUnreadableImageFormat(file)
    if (!mustConvert && blob.size >= file.size) return file
    const baseName = file.name.replace(/\.[^.]+$/, '') || 'photo'
    return new File([blob], `${baseName}.jpg`, { type: 'image/jpeg', lastModified: Date.now() })
  } catch {
    return file
  }
}

// Conservative client-side limit. Vercel's hard limit is 4.5MB and we
// want headroom for FormData boundary + other fields.
export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024

// True when a file is in a format our AI vision pipeline cannot read. HEIC is
// the one that bites: it is the iPhone default and a Samsung option, and most
// browsers outside Safari cannot decode it, so compressImage() above silently
// returns the original instead of a JPEG. The file then uploads fine, looks
// fine in the coach dashboard, and only fails much later when we try to read
// it. Call this after compressImage — if it is still true, re-encoding did
// not happen and the photo will not be readable.

