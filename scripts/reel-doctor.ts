// Reel doctor: read a filmed take the way an editor would, without being able to
// hear it.
//
// Claude can't watch footage or listen to audio, so it can't tell you which take
// is best. What it CAN do, now that whisper is installed, is read the take: every
// word with a millisecond timestamp, every filler, every dead pause, the pace,
// the loudness, and every place the delivery drifted from the written script.
// That turns "pick the good take" from a judgement call into a table.
//
// Two modes:
//   (default)  ANALYSE. Never writes to the video. Prints a report per take and,
//              when given more than one file, ranks them.
//   --fix      EDIT. Trims dead air off the head and tail, normalises loudness to
//              the -14 LUFS Instagram expects, forces exact 1080x1920, and writes
//              a new file to 03_READY_TO_POST. The original is never touched.
//
// Usage:
//   npx tsx scripts/reel-doctor.ts REELS/01_FILMED_RAW/*.mp4 --day Mon
//   npx tsx scripts/reel-doctor.ts REELS/01_FILMED_RAW/mon_take3.mp4 --fix
//
// --day Mon|Tue|Wed|Fri|Sun compares the take against that day's written script
// and reports what was dropped, added or changed. Without it you still get
// fillers, pauses, pace and levels.
//
// Requires: brew install whisper-cpp, and the model at WHISPER_MODEL
// (default ~/.local/share/whisper/ggml-large-v3-turbo.bin).

import { execFileSync, spawnSync } from 'node:child_process'
import { existsSync, mkdtempSync, readFileSync, mkdirSync, statSync } from 'node:fs'
import { tmpdir, homedir } from 'node:os'
import { basename, join } from 'node:path'

const MODEL = process.env.WHISPER_MODEL ?? join(homedir(), '.local/share/whisper/ggml-large-v3-turbo.bin')
const SCRIPTS_MD = '/Users/kadedunstone/Library/CloudStorage/Dropbox/01_BODY_RECODE/07_MARKETING/03_ORGANIC_INSTAGRAM/BR_REEL_SCRIPTS_WEEK1.md'
const READY = '/Users/kadedunstone/Library/CloudStorage/Dropbox/01_BODY_RECODE/07_MARKETING/03_ORGANIC_INSTAGRAM/REELS/03_READY_TO_POST'

// Fillers worth a timecode. "like" and "so" are only fillers in some positions,
// so they're tracked separately and reported without being counted as defects.
const FILLERS = ['um', 'uh', 'erm', 'ah', 'er', 'hmm', 'yeah']
const SOFT = ['like', 'basically', 'literally', 'actually', 'obviously', 'sort', 'kind']
const PAUSE_S = 1.0            // a gap longer than this is dead air mid-sentence
const LONG_PAUSE_S = 2.0       // a gap this long is almost certainly a lost line

type Word = { t0: number; t1: number; text: string }

const sh = (cmd: string, args: string[]) =>
  execFileSync(cmd, args, { maxBuffer: 1 << 28 }).toString()

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9' ]/g, ' ').replace(/\s+/g, ' ').trim()

// Whisper writes "92" and "39%" where the script says "ninety-two" and "thirty
// nine per cent". Without this every script quoting a statistic looks like it
// drifted badly when the delivery was word perfect.
const ONES = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
  'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen']
const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety']

function numToWords(n: number): string {
  if (n < 20) return ONES[n]
  if (n < 100) return (TENS[Math.floor(n / 10)] + ' ' + (n % 10 ? ONES[n % 10] : '')).trim()
  if (n < 1000) {
    const rest = n % 100
    return (ONES[Math.floor(n / 100)] + ' hundred ' + (rest ? numToWords(rest) : '')).trim()
  }
  return String(n)
}

/** Canonical token stream: numerals spelled out, percent unified, hyphens split. */
function tokens(s: string): string[] {
  return norm(
    s.replace(/%/g, ' per cent ')
     .replace(/\bpercent\b/gi, 'per cent')
     .replace(/[-–]/g, ' ')
     .replace(/\b(\d+)\b/g, (_, d) => ` ${numToWords(Number(d))} `)
  ).split(' ').filter(Boolean)
}
const clock = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toFixed(1).padStart(4, '0')}`

function probe(file: string) {
  const j = JSON.parse(sh('ffprobe', [
    '-v', 'error', '-select_streams', 'v:0',
    '-show_entries', 'stream=width,height,r_frame_rate:format=duration',
    '-of', 'json', file,
  ]))
  const st = j.streams?.[0] ?? {}
  const [n, d] = String(st.r_frame_rate ?? '0/1').split('/').map(Number)
  return {
    width: st.width ?? 0,
    height: st.height ?? 0,
    fps: d ? n / d : 0,
    duration: Number(j.format?.duration ?? 0),
  }
}

/** EBU R128 loudness, measured not guessed. Instagram targets about -14 LUFS. */
function loudness(file: string) {
  // ffmpeg prints the measurement to stderr on BOTH success and failure, so this
  // uses spawnSync. execFileSync only surfaces stderr when the exit code is
  // non-zero, which silently lost the reading whenever ffmpeg succeeded.
  const r = spawnSync('ffmpeg', [
    '-hide_banner', '-nostats', '-i', file, '-vn',
    '-af', 'loudnorm=print_format=json', '-f', 'null', '-',
  ], { maxBuffer: 1 << 28, encoding: 'utf8' })
  const m = (r.stderr ?? '').match(/\{[^{}]*"input_i"[\s\S]*?\}/)
  if (!m) return null
  try {
    const j = JSON.parse(m[0])
    const lufs = Number(j.input_i), peak = Number(j.input_tp)
    return Number.isFinite(lufs) ? { lufs, peak } : null
  } catch { return null }
}

/**
 * Exact speech boundaries from ffmpeg, not from whisper.
 * Whisper's first-token timestamp snaps to 0.00 even when there's real dead air
 * in front of it, so trusting it for trim points cuts the wrong place.
 */
function speechBounds(file: string, duration: number) {
  const r = spawnSync('ffmpeg', [
    '-hide_banner', '-nostats', '-i', file, '-vn',
    '-af', 'silencedetect=noise=-40dB:d=0.35', '-f', 'null', '-',
  ], { maxBuffer: 1 << 28, encoding: 'utf8' })
  const err = r.stderr ?? ''
  const starts = [...err.matchAll(/silence_start:\s*(-?[\d.]+)/g)].map(m => Number(m[1]))
  const ends = [...err.matchAll(/silence_end:\s*([\d.]+)/g)].map(m => Number(m[1]))
  // Head silence only counts if the file opens inside a silent run.
  const head = starts.length && starts[0] <= 0.05 && ends.length ? ends[0] : 0
  const lastStart = starts.length ? starts[starts.length - 1] : null
  const tail = lastStart !== null && lastStart > head && ends.length < starts.length
    ? duration - lastStart : 0
  return { head, tail, speechStart: head, speechEnd: duration - tail }
}

function transcribe(file: string): Word[] {
  if (!existsSync(MODEL)) {
    console.error(`\nMissing whisper model at ${MODEL}\n` +
      `  brew install whisper-cpp\n` +
      `  curl -L -o "${MODEL}" https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-large-v3-turbo.bin\n`)
    process.exit(1)
  }
  const dir = mkdtempSync(join(tmpdir(), 'reeldoc-'))
  const wav = join(dir, 'a.wav')
  // Phone footage often has minor stream damage that ffmpeg complains about and
  // decodes anyway. Judge on whether we got usable audio out, not on exit code.
  try {
    execFileSync('ffmpeg', [
      '-y', '-loglevel', 'error', '-err_detect', 'ignore_err',
      '-i', file, '-vn', '-ar', '16000', '-ac', '1', '-c:a', 'pcm_s16le', wav,
    ], { stdio: 'ignore' })
  } catch { /* checked below */ }
  if (!existsSync(wav) || statSync(wav).size < 4096) {
    console.log('  could not extract audio from this file')
    return []
  }
  // -ml 1 -sow gives one segment per word, which is what makes cutting possible.
  execFileSync('whisper-cli', [
    '-m', MODEL, '-f', wav, '-l', 'en', '-ml', '1', '-sow', '-np',
    '--output-json', '-of', join(dir, 'out'),
  ], { stdio: 'ignore' })
  const j = JSON.parse(readFileSync(join(dir, 'out.json'), 'utf8'))
  return (j.transcription ?? [])
    .map((s: any) => ({ t0: s.offsets.from / 1000, t1: s.offsets.to / 1000, text: s.text.trim() }))
    .filter((w: Word) => w.text.length > 0)
}

/** Pull one day's spoken lines (blockquote + spoken CTA) out of the scripts doc. */
function scriptFor(day: string): string | null {
  if (!existsSync(SCRIPTS_MD)) return null
  const parts = readFileSync(SCRIPTS_MD, 'utf8').split(/\n## (Mon|Tue|Wed|Fri|Sun) /)
  for (let i = 1; i < parts.length; i += 2) {
    if (parts[i].toLowerCase() !== day.toLowerCase()) continue
    const body = parts[i + 1].split('\n---')[0]
    const quote = body.split('\n').filter(l => l.startsWith('>')).map(l => l.replace(/^>\s?/, '')).join(' ')
    const cta = [...body.matchAll(/\*\*CTA, spoken:\*\* "([^"]+)"/g)].map(m => m[1]).join(' ')
    return `${quote} ${cta}`
  }
  return null
}

/** Longest common subsequence, so we can say what was dropped vs added. */
function diff(want: string[], got: string[]) {
  const n = want.length, m = got.length
  const dp: Uint32Array[] = Array.from({ length: n + 1 }, () => new Uint32Array(m + 1))
  for (let i = n - 1; i >= 0; i--)
    for (let j = m - 1; j >= 0; j--)
      dp[i][j] = want[i] === got[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1])
  const dropped: string[] = [], added: string[] = []
  let i = 0, j = 0
  while (i < n && j < m) {
    if (want[i] === got[j]) { i++; j++ }
    else if (dp[i + 1][j] >= dp[i][j + 1]) dropped.push(want[i++])
    else added.push(got[j++])
  }
  dropped.push(...want.slice(i)); added.push(...got.slice(j))
  return { dropped, added, kept: dp[0][0] }
}

function analyse(file: string, day?: string) {
  const name = basename(file)
  console.log(`\n${'='.repeat(72)}\n${name}\n${'='.repeat(72)}`)

  const p = probe(file)
  const portrait = p.height > p.width
  const ratio = p.width && p.height ? (p.width / p.height).toFixed(3) : '?'
  console.log(`  ${p.width}x${p.height} @ ${p.fps.toFixed(2)}fps   ${p.duration.toFixed(1)}s   ratio ${ratio}` +
    `${portrait ? '' : '   <-- LANDSCAPE, will not publish as a reel'}`)

  const lo = loudness(file)
  if (lo) {
    const off = lo.lufs - (-14)
    const verdict = Math.abs(off) < 2 ? 'fine' : off < 0 ? `${Math.abs(off).toFixed(1)}dB too quiet` : `${off.toFixed(1)}dB too loud`
    console.log(`  loudness ${lo.lufs.toFixed(1)} LUFS, peak ${lo.peak.toFixed(1)} dBTP  (${verdict}; --fix corrects it)`)
  }

  const words = transcribe(file)
  if (!words.length) { console.log('  no speech detected'); return { file, score: -1 } }

  const b = speechBounds(file, p.duration)
  const speech = Math.max(0.1, b.speechEnd - b.speechStart)
  const wpm = Math.round(words.length / (speech / 60))
  console.log(`  ${words.length} words in ${speech.toFixed(1)}s of speech = ${wpm} wpm`)
  console.log(`  head silence ${b.head.toFixed(2)}s   tail silence ${b.tail.toFixed(2)}s   (--fix trims both)`)

  // Fillers, with timecodes so they can be cut.
  const hard = words.filter(w => FILLERS.includes(norm(w.text)))
  const soft = words.filter(w => SOFT.includes(norm(w.text)))
  if (hard.length) {
    console.log(`\n  FILLERS (${hard.length}) - cut these`)
    for (const w of hard) console.log(`    ${clock(w.t0)}  ${w.text}`)
  } else console.log('\n  FILLERS  none')
  if (soft.length) console.log(`  soft crutches (${soft.length}): ${[...new Set(soft.map(w => norm(w.text)))].join(', ')}`)

  // Dead air.
  const pauses: { at: number; len: number }[] = []
  for (let i = 1; i < words.length; i++) {
    const gap = words[i].t0 - words[i - 1].t1
    if (gap >= PAUSE_S) pauses.push({ at: words[i - 1].t1, len: gap })
  }
  if (pauses.length) {
    console.log(`\n  PAUSES over ${PAUSE_S}s (${pauses.length})`)
    for (const g of pauses) {
      console.log(`    ${clock(g.at)}  ${g.len.toFixed(1)}s${g.len >= LONG_PAUSE_S ? '   <-- likely a lost line' : ''}`)
    }
  } else console.log('\n  PAUSES  none over ' + PAUSE_S + 's')

  // The hook. First line is the whole reel.
  const firstStop = words.findIndex(w => /[.?!]$/.test(w.text))
  if (firstStop > 0) {
    const hook = words.slice(0, firstStop + 1)
    const hookSecs = hook[hook.length - 1].t1 - hook[0].t0
    console.log(`\n  HOOK  ${hookSecs.toFixed(1)}s  "${hook.map(w => w.text).join(' ')}"`)
    if (hookSecs > 6) console.log('    over 6s. The hook has to land before the scroll decision.')
    const after = words[firstStop + 1]
    if (after) {
      const beat = after.t0 - hook[hook.length - 1].t1
      console.log(`    pause after the hook: ${beat.toFixed(2)}s` + (beat < 0.4 ? '   <-- too fast, it needs air' : ''))
    }
  }

  // Drift from the written script.
  let score = 0
  if (day) {
    const want = scriptFor(day)
    if (!want) console.log(`\n  no script found for --day ${day}`)
    else {
      const w = tokens(want), g = tokens(words.map(x => x.text).join(' '))
      const d = diff(w, g)
      const fidelity = Math.round((d.kept / w.length) * 100)
      console.log(`\n  SCRIPT MATCH  ${fidelity}%  (${d.kept}/${w.length} words as written)`)
      if (d.dropped.length) console.log(`    dropped (${d.dropped.length}): ${d.dropped.slice(0, 25).join(' ')}${d.dropped.length > 25 ? ' ...' : ''}`)
      if (d.added.length) console.log(`    added   (${d.added.length}): ${d.added.slice(0, 25).join(' ')}${d.added.length > 25 ? ' ...' : ''}`)
      score = fidelity
    }
  }

  // A single number for ranking takes. Fidelity, less penalties for the things
  // that actually make a take unusable.
  const penalty = hard.length * 3 + pauses.filter(p => p.len >= LONG_PAUSE_S).length * 5
  return { file, name, score: (day ? score : 100) - penalty, wpm, fillers: hard.length, pauses: pauses.length, duration: p.duration }
}

function fix(file: string) {
  const p = probe(file)
  const b = speechBounds(file, p.duration)
  const start = Math.max(0, b.speechStart - 0.25)          // keep a breath in front
  const end = Math.min(p.duration, b.speechEnd + 0.45)     // let the last word ring
  mkdirSync(READY, { recursive: true })
  const out = join(READY, basename(file).replace(/\.[^.]+$/, '') + '_edit.mp4')

  console.log(`  trimming ${start.toFixed(2)}s .. ${end.toFixed(2)}s  (${(end - start).toFixed(1)}s)`)
  execFileSync('ffmpeg', [
    '-y', '-loglevel', 'error',
    '-ss', String(start), '-to', String(end), '-i', file,
    // Fill 1080x1920 without letterboxing, then normalise to Instagram's target.
    '-vf', 'scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,setsar=1',
    '-af', 'loudnorm=I=-14:TP=-1.5:LRA=11',
    '-c:v', 'libx264', '-profile:v', 'high', '-preset', 'slow', '-crf', '20',
    '-pix_fmt', 'yuv420p', '-movflags', '+faststart',
    '-c:a', 'aac', '-b:a', '192k', '-ar', '48000',
    out,
  ], { stdio: 'inherit' })
  const q = probe(out)
  console.log(`  wrote ${out}\n  ${q.width}x${q.height}  ${q.duration.toFixed(1)}s`)
}

const args = process.argv.slice(2)
const dayIx = args.indexOf('--day')
const day = dayIx >= 0 ? args[dayIx + 1] : undefined
const doFix = args.includes('--fix')
// Guard the -1 case: without --day, dayIx + 1 is 0 and this would eat the first file.
const files = args.filter((a, i) => !a.startsWith('--') && !(dayIx >= 0 && i === dayIx + 1))

if (!files.length) {
  console.log('usage: npx tsx scripts/reel-doctor.ts <video...> [--day Mon] [--fix]')
  process.exit(1)
}

if (doFix) {
  for (const f of files) { console.log(`\n${basename(f)}`); fix(f) }
} else {
  const results = files.map(f => analyse(f, day)).filter(r => r.score >= 0)
  if (results.length > 1) {
    console.log(`\n${'='.repeat(72)}\nRANKED\n${'='.repeat(72)}`)
    results.sort((a, b) => b.score - a.score)
    for (const [i, r] of results.entries()) {
      console.log(`  ${i + 1}. ${r.name}   score ${r.score}   ${r.wpm}wpm   ${r.fillers} fillers   ${r.pauses} pauses   ${r.duration?.toFixed(1)}s`)
    }
    console.log(`\n  Ranking is mechanical. It cannot hear tone, warmth or whether your eyes\n` +
      `  were in the lens. Treat it as a shortlist, not a verdict.`)
  }
}
