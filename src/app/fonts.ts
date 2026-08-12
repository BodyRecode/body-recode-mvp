import localFont from 'next/font/local'

// Self-hosted fonts. Previously these were pulled from next/font/google at build
// time, which fetches the woff2 from fonts.gstatic.com during the build. On
// 2026-08-12 Google rotated a Source Serif 4 file URL, the cached build fetched
// a now-404 URL, and the Vercel build failed app-wide (layout uses the body
// font, so every deploy was exposed). Self-hosting removes the build-time
// network dependency entirely: the build can no longer be broken by Google
// rotating a font URL. Variable woff2, latin subset, downloaded from Google Fonts.

export const geist = localFont({
  src: './fonts/Geist.woff2',
  weight: '100 900',
  display: 'swap',
})

export const serif = localFont({
  src: [
    { path: './fonts/SourceSerif4.woff2', weight: '200 900', style: 'normal' },
    { path: './fonts/SourceSerif4-Italic.woff2', weight: '200 900', style: 'italic' },
  ],
  display: 'swap',
})
