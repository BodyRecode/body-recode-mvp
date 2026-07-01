// Instant-engine fulfilment orchestrator (Phase C - bolt_on_ai).
//
// Called by the Inngest digital_asset/engine_call function when a
// digital_asset_purchase with fulfilment_kind='instant_engine' lands.
//
// Flow:
//   1. Load purchase + product + metadata + member email + linked client_id
//   2. Dispatch on engine_call (e.g. 'trajectory')
//   3. Store the engine output (5 prose sections + context) in
//      digital_asset_purchases.raw.engine_output
//   4. Render the deep-dive route to PDF via puppeteer
//   5. Upload PDF to library-assets/deep-dives/{purchase_id}.pdf
//   6. Mark purchase status='fulfilled' + output_ref=storage path + fulfilled_at
//   7. Send the deep-dive ready email
//
// If anything in steps 2-5 throws, the orchestrator surfaces the error to
// Inngest so the function retries with exponential backoff.

import { createAdminClient } from '@/lib/supabase/admin'
import { appUrl } from '@/lib/app-url'
import { Resend } from 'resend'
import puppeteer, { type Browser } from 'puppeteer-core'

/**
 * Base URL for the internal puppeteer render hit. Unlike appUrl(), this
 * honours localhost in dev because the render route is on the SAME server
 * the orchestrator is running on — never leaks to email.
 */
function internalRenderBase(): string {
  const raw = process.env.NEXT_PUBLIC_APP_URL?.trim()
  if (raw) return raw.replace(/\/+$/, '')
  return 'http://localhost:3000'
}
import {
  generateTrajectoryReadingForLatestBlock,
  type TrajectoryGenerationResult,
} from '@/lib/trajectory-generator'
import {
  generateMemberQuestion,
  type MemberQuestionResult,
} from '@/lib/member-question-generator'
import {
  generateCustomBlock,
  type CustomBlockResult,
} from '@/lib/custom-block-generator'
import {
  generateWeeklyPattern,
  type WeeklyPatternResult,
} from '@/lib/weekly-pattern-generator'
import { buildDeepDiveReadyEmail } from '@/lib/digital-asset-engine-emails'
import { fromCoach } from '@/lib/email-shell'

const LIBRARY_BUCKET = 'library-assets'
const DEEP_DIVE_PREFIX = 'deep-dives'

const LOCAL_CHROME_PATHS = [
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
]

async function resolveChromeExecutable(): Promise<string> {
  if (process.env.NODE_ENV === 'production' || process.env.VERCEL) {
    const chromium = (await import('@sparticuz/chromium')).default
    return await chromium.executablePath()
  }
  if (process.env.PUPPETEER_EXECUTABLE_PATH) return process.env.PUPPETEER_EXECUTABLE_PATH
  const fs = await import('node:fs/promises')
  for (const candidate of LOCAL_CHROME_PATHS) {
    try {
      await fs.access(candidate)
      return candidate
    } catch { /* try next */ }
  }
  throw new Error('Could not find Chrome executable')
}

async function launchEngineBrowser(): Promise<Browser> {
  if (process.env.VERCEL || process.env.NODE_ENV === 'production') {
    const chromium = (await import('@sparticuz/chromium')).default
    return puppeteer.launch({
      args: chromium.args,
      defaultViewport: { width: 1240, height: 1754 },
      executablePath: await chromium.executablePath(),
      headless: true,
    })
  }
  return puppeteer.launch({
    headless: true,
    executablePath: await resolveChromeExecutable(),
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  })
}

async function renderRouteToPdf(path: string): Promise<Uint8Array> {
  const url = `${internalRenderBase()}${path}`
  const browser = await launchEngineBrowser()
  try {
    const page = await browser.newPage()
    await page.emulateMediaType('print')
    await page.goto(url, { waitUntil: 'networkidle0', timeout: 60_000 })
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
      preferCSSPageSize: true,
    })
    return new Uint8Array(pdf)
  } finally {
    await browser.close().catch(() => {})
  }
}

export class InstantEngineFulfilmentError extends Error {
  constructor(message: string) { super(message) }
}

type EngineOutputEnvelope = {
  engine_call: string
  generated_at: string
  trajectory?: TrajectoryGenerationResult
  member_question?: MemberQuestionResult
  member_custom_block?: CustomBlockResult
  weekly_pattern_report?: WeeklyPatternResult
}

export async function fulfilInstantEngine(purchaseId: string): Promise<void> {
  const admin = createAdminClient()

  // 1. Load purchase + product + metadata
  const { data: purchase } = await admin
    .from('digital_asset_purchases')
    .select('id, email_at_purchase, client_id, product_id, status, raw')
    .eq('id', purchaseId)
    .maybeSingle()
  if (!purchase) throw new InstantEngineFulfilmentError(`Purchase ${purchaseId} not found`)
  if (purchase.status === 'fulfilled') return  // already done; idempotent

  const { data: product } = await admin
    .from('be_products')
    .select('id, name, kind')
    .eq('id', purchase.product_id)
    .maybeSingle()
  if (!product) throw new InstantEngineFulfilmentError('Product not found')

  const { data: meta } = await admin
    .from('digital_asset_metadata')
    .select('slug, fulfilment_kind, engine_call, ascension_cta_path')
    .eq('product_id', purchase.product_id)
    .maybeSingle()
  if (!meta) throw new InstantEngineFulfilmentError('Metadata not found')
  if (meta.fulfilment_kind !== 'instant_engine') {
    throw new InstantEngineFulfilmentError(`Wrong fulfilment_kind: ${meta.fulfilment_kind}`)
  }
  if (!meta.engine_call) throw new InstantEngineFulfilmentError('Missing engine_call')

  // 2. Engine dispatch.
  const envelope: EngineOutputEnvelope = {
    engine_call: meta.engine_call,
    generated_at: new Date().toISOString(),
  }

  if (meta.engine_call === 'trajectory') {
    // Coaching-client-only engines. Resolve client_id by email.
    let clientId = purchase.client_id
    if (!clientId) {
      const { data: client } = await admin
        .from('clients')
        .select('id')
        .ilike('email', purchase.email_at_purchase)
        .maybeSingle()
      if (!client) {
        throw new InstantEngineFulfilmentError(
          `No coaching client found for ${purchase.email_at_purchase}. ${meta.engine_call} engine requires an active coaching client record.`,
        )
      }
      clientId = client.id
      await admin
        .from('digital_asset_purchases')
        .update({ client_id: clientId })
        .eq('id', purchaseId)
    }
    envelope.trajectory = await generateTrajectoryReadingForLatestBlock(clientId!)
  } else if (meta.engine_call === 'weekly_pattern_report') {
    // Membership-tier engine. No pre-purchase input - reads check-ins + pattern.
    // Delivery number lives on raw.delivery_number (set by the Inngest
    // sequence function that fires reports 1-4 at 7-day intervals).
    const rawObj = (purchase.raw as Record<string, unknown> | null) ?? {}
    const deliveryNumber = typeof rawObj.delivery_number === 'number' ? rawObj.delivery_number : 1
    const { data: enrolment } = await admin
      .from('membership_enrollments')
      .select('id')
      .ilike('email', purchase.email_at_purchase)
      .is('cancelled_at', null)
      .maybeSingle()
    if (!enrolment) {
      throw new InstantEngineFulfilmentError(
        `No active Membership enrollment found for ${purchase.email_at_purchase}.`,
      )
    }
    envelope.weekly_pattern_report = await generateWeeklyPattern({
      enrolmentId: enrolment.id,
      deliveryNumber,
    })
  } else if (meta.engine_call === 'member_question' || meta.engine_call === 'member_custom_block') {
    // Membership-tier engines. Reads enrollment + check-ins. Pre-purchase
    // input lives on raw - 'question' for member_question, 'constraints' for
    // member_custom_block. Both are captured via Stripe metadata in the
    // shared input pattern.
    const rawObj = (purchase.raw as Record<string, unknown> | null) ?? {}
    // Find member by email so we can read their enrollment + check-ins.
    const { data: enrolment } = await admin
      .from('membership_enrollments')
      .select('id')
      .ilike('email', purchase.email_at_purchase)
      .is('cancelled_at', null)
      .maybeSingle()
    if (!enrolment) {
      throw new InstantEngineFulfilmentError(
        `No active Membership enrollment found for ${purchase.email_at_purchase}.`,
      )
    }
    if (meta.engine_call === 'member_question') {
      const question = typeof rawObj.question === 'string' ? rawObj.question : ''
      if (!question.trim()) {
        throw new InstantEngineFulfilmentError('member_question engine requires raw.question text on the purchase row')
      }
      envelope.member_question = await generateMemberQuestion({
        enrolmentId: enrolment.id,
        question,
      })
    } else {
      // member_custom_block: input field stored at raw.constraints
      const constraints = typeof rawObj.constraints === 'string'
        ? rawObj.constraints
        : (typeof rawObj.question === 'string' ? rawObj.question : '')
      if (!constraints.trim()) {
        throw new InstantEngineFulfilmentError('member_custom_block engine requires raw.constraints text on the purchase row')
      }
      envelope.member_custom_block = await generateCustomBlock({
        enrolmentId: enrolment.id,
        constraints,
      })
    }
  } else {
    throw new InstantEngineFulfilmentError(
      `engine_call '${meta.engine_call}' not yet implemented`,
    )
  }

  // 4. Persist engine output in raw before rendering so the route can read it.
  const rawMerged = {
    ...(purchase.raw as Record<string, unknown> | null ?? {}),
    engine_output: envelope,
  }
  await admin
    .from('digital_asset_purchases')
    .update({ raw: rawMerged })
    .eq('id', purchaseId)

  // 5. Render the deep-dive route as PDF
  const renderSecret = process.env.DEEP_DIVE_RENDER_SECRET
  if (!renderSecret) throw new InstantEngineFulfilmentError('DEEP_DIVE_RENDER_SECRET not set')
  const renderPath = `/render/deep-dive/${purchaseId}?secret=${encodeURIComponent(renderSecret)}`
  const pdfBytes = await renderRouteToPdf(renderPath)

  // 6. Upload PDF to library
  const storagePath = `${DEEP_DIVE_PREFIX}/${purchaseId}.pdf`
  const { error: uploadErr } = await admin.storage
    .from(LIBRARY_BUCKET)
    .upload(storagePath, pdfBytes, {
      contentType: 'application/pdf',
      upsert: true,
    })
  if (uploadErr) {
    throw new InstantEngineFulfilmentError(`Storage upload failed: ${uploadErr.message}`)
  }

  // 7. Update purchase: status, output_ref, fulfilled_at.
  // output_ref stores the storage path; signed URLs are minted per render.
  await admin
    .from('digital_asset_purchases')
    .update({
      status: 'fulfilled',
      fulfilled_at: new Date().toISOString(),
      output_ref: storagePath,
    })
    .eq('id', purchaseId)

  // 8. Sign a 24h delivery URL and send the ready email
  const { data: signed } = await admin.storage
    .from(LIBRARY_BUCKET)
    .createSignedUrl(storagePath, 60 * 60 * 24)
  const pdfUrl = signed?.signedUrl ?? ''

  // Reader URL uses the member's library token if we can resolve one,
  // otherwise the purchase id (which the library reader route already handles).
  let readerToken: string = purchaseId
  const { data: member } = await admin
    .from('membership_enrollments')
    .select('token')
    .ilike('email', purchase.email_at_purchase)
    .is('cancelled_at', null)
    .maybeSingle()
  if (member?.token) readerToken = member.token
  const readerUrl = `${appUrl()}/library/${readerToken}/${meta.slug}`
  const firstName = purchase.email_at_purchase.split('@')[0]

  if (process.env.RESEND_API_KEY && pdfUrl) {
    const resend = new Resend(process.env.RESEND_API_KEY)
    const built = buildDeepDiveReadyEmail({
      firstName,
      productTitle: product.name,
      pdfUrl,
      readerUrl,
    })
    await resend.emails.send({
      from: fromCoach(),
      to: purchase.email_at_purchase,
      subject: built.subject,
      html: built.html,
    })
  }
}
