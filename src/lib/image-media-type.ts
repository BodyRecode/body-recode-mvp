// Anthropic vision accepts exactly four image formats. Anything else — HEIC,
// HEIF, AVIF, TIFF — is rejected with a 400 "Could not process image" that
// fails the whole request, not just the offending image.
//
// We identify the format from the file's own magic bytes rather than trusting
// a Content-Type header or a browser-supplied File.type. Phones shooting HEIC
// (iPhone default; Samsung with "high efficiency" on) upload files the
// browser-side compressor cannot decode, so they pass through untouched. A
// header-based check saw "image/heic", fell through to a jpeg default, and
// handed HEIC bytes to Anthropic labelled as JPEG.

export type ImageMediaType = 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp'

/** Returns the Anthropic-supported media type, or null if the bytes are a format vision cannot read. */
export function sniffImageMediaType(buf: Buffer): ImageMediaType | null {
  if (buf.length < 12) return null
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'image/jpeg'
  if (buf.toString('hex', 0, 8) === '89504e470d0a1a0a') return 'image/png'
  const gif = buf.toString('ascii', 0, 6)
  if (gif === 'GIF87a' || gif === 'GIF89a') return 'image/gif'
  if (buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WEBP') return 'image/webp'
  return null
}

/** Human-readable format name for error messages shown to coaches and clients. */
export function describeImageFormat(buf: Buffer): string {
  if (buf.length >= 12 && buf.toString('ascii', 4, 8) === 'ftyp') {
    const brand = buf.toString('ascii', 8, 12)
    if (brand.startsWith('avi')) return 'AVIF'
    return 'HEIC' // heic, heix, hevc, mif1, msf1
  }
  if (buf.length >= 4) {
    const le = buf.toString('hex', 0, 4)
    if (le === '49492a00' || le === '4d4d002a') return 'TIFF'
  }
  return 'an unsupported format'
}
