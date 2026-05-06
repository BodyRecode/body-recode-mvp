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
//   - Re-encoding produced a larger file than the original

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
    if (!blob || blob.size >= file.size) return file
    const baseName = file.name.replace(/\.[^.]+$/, '') || 'photo'
    return new File([blob], `${baseName}.jpg`, { type: 'image/jpeg', lastModified: Date.now() })
  } catch {
    return file
  }
}

// Conservative client-side limit. Vercel's hard limit is 4.5MB and we
// want headroom for FormData boundary + other fields.
export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024
