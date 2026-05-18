import { readFileSync, writeFileSync, mkdirSync } from 'fs'
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'

// Inline the renderer so we don't need ts-node
const mod = await import('./src/lib/medical-clearance-pdf.ts').catch(async () => {
  // Use tsx via dynamic import path
  const { execSync } = await import('child_process')
  execSync('npx tsx --no-install -e "import(\'./src/lib/medical-clearance-pdf.ts\').then(m => process.stdout.write(JSON.stringify(\'ok\')))"', { stdio: 'inherit' })
  return null
})
