import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { Resend } from 'resend'
import { createAdminClient } from '@/lib/supabase/admin'
import { darkEmailSignature } from '@/lib/email-signature'
import { buildProgramBuyerEmails, buildReportFollowUpEmails, daysAfter9amBrisbane, nextMorning9amBrisbane } from '@/lib/generate-report'
import { inngest } from '@/lib/inngest'
import { syncSubscriptionFromStripe, markCommencementPaid } from '@/lib/stripe-sync'
import { appUrl } from '@/lib/app-url'
import {
  darkEmailShell, emailUrlFallback,
  emailLogo, emailEyebrow, emailHeading, emailDivider,
  emailBody, emailStatusCard, emailCta, emailNumberedList, emailFeaturedCard,
} from '@/lib/email-shell'
import {
  buildBlueprintPurchaseWelcomeEmail,
  buildBlueprintCoachNotificationEmail,
} from '@/lib/blueprint-emails'
import {
  buildMembershipPurchaseWelcomeEmail,
  buildMembershipCoachNotificationEmail,
} from '@/lib/membership-emails'
import {
  buildDigitalAssetDeliveryEmail,
  ascensionCtaFor,
  type AscensionTarget,
} from '@/lib/digital-asset-emails'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

const LIBRARY_BUCKET = 'library-assets'

// Phase A — instant_pdf fulfilment.
// Generates a signed URL for the PDF, builds the reader URL, and sends
// the delivery email with the state-matched ascension CTA. Marks the
// purchase row fulfilled.
async function fulfilInstantPdf(args: {
  purchase_id: string
  product: { id: string; name: string; kind: string | null }
  meta: {
    slug: string
    source_path: string
    fulfilment_kind: string
    engine_call: string | null
    ascension_cta_path: string | null
  }
  email: string
  source: string
}) {
  const admin = createAdminClient()
  const firstName = args.email.split('@')[0]
  const productTitle = args.product.name

  // 1. Sign a 24-hour download URL.
  const { data: signed } = await admin.storage
    .from(LIBRARY_BUCKET)
    .createSignedUrl(args.meta.source_path, 60 * 60 * 24)
  const pdfUrl = signed?.signedUrl ?? ''

  // 2. Reader URL: members get the membership-token link, cold buyers get
  // their purchase-id token. We use the purchase id directly so the email
  // link is stable.
  const readerUrl = `${appUrl()}/library/${args.purchase_id}/${args.meta.slug}`

  // 3. Ascension CTA from metadata (state-matched).
  const ascensionTarget = (args.meta.ascension_cta_path as AscensionTarget) || 'depleted'
  const ascension = ascensionCtaFor(ascensionTarget, args.source)

  // 4. Send the delivery email.
  if (process.env.RESEND_API_KEY && pdfUrl) {
    const resend = new Resend(process.env.RESEND_API_KEY)
    const built = buildDigitalAssetDeliveryEmail({
      firstName,
      productTitle,
      pdfUrl,
      readerUrl,
      ascensionCtaLabel: ascension.label,
      ascensionCtaUrl: ascension.url,
    })
    await resend.emails.send({
      from: 'Kade at Body Recode <kade@bodyrecode.au>',
      to: args.email,
      subject: built.subject,
      html: built.html,
    })
  }

  // 5. Mark the purchase fulfilled with the signed PDF URL as output_ref.
  await admin
    .from('digital_asset_purchases')
    .update({
      status: 'fulfilled',
      fulfilled_at: new Date().toISOString(),
      output_ref: pdfUrl,
    })
    .eq('id', args.purchase_id)
}

export async function POST(request: NextRequest) {
  const body = await request.text()
  const sig = request.headers.get('stripe-signature')

  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Missing signature or webhook secret' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET)
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  // Handle subscription created / updated — keep client_subscriptions in sync
  if (event.type === 'customer.subscription.created' || event.type === 'customer.subscription.updated') {
    const subscription = event.data.object as Stripe.Subscription
    const admin = createAdminClient()
    try {
      await syncSubscriptionFromStripe(admin, subscription)
    } catch (e) {
      console.error('subscription sync failed:', e)
    }
    return NextResponse.json({ received: true })
  }

  // Handle subscription cancellation
  if (event.type === 'customer.subscription.deleted') {
    const subscription = event.data.object as Stripe.Subscription
    const admin = createAdminClient()

    // Mirror the cancellation into our cache
    try {
      await syncSubscriptionFromStripe(admin, subscription)
    } catch (e) {
      console.error('subscription sync (deleted) failed:', e)
    }

    // Performance coaching cancellation
    const clientRefId = subscription.metadata?.client_id
    if (clientRefId) {
      await admin.from('clients').update({ subscription_active: false }).eq('id', clientRefId)
    }

    // Membership cancellation
    const { data: membership } = await admin
      .from('membership_enrollments')
      .select('id, email, first_name, pattern')
      .eq('stripe_subscription_id', subscription.id)
      .maybeSingle()

    if (membership) {
      await admin
        .from('membership_enrollments')
        .update({ cancelled_at: new Date().toISOString() })
        .eq('id', membership.id)

      const patternLabels: Record<string, string> = {
        'stress-stored': 'Stress-Stored',
        'metabolic-drift': 'Insulin-Drift',
        'hormonal-shift': 'Estrogen-Shift',
        'system-overload': 'Androgen-Decline',
      }

      await inngest.send({
        name: 'reengagement/membership-cancelled',
        data: {
          email: membership.email,
          firstName: membership.first_name,
          source: 'membership',
          patternLabel: patternLabels[membership.pattern] ?? undefined,
        },
      })
    }

    return NextResponse.json({ received: true })
  }

  // Handle recurring subscription invoice paid (auto-renewal)
  if (event.type === 'invoice.payment_succeeded') {
    const invoice = event.data.object as Stripe.Invoice
    const invoiceWithSubEarly = invoice as Stripe.Invoice & { subscription?: string | Stripe.Subscription | null }
    const earlySubId = typeof invoiceWithSubEarly.subscription === 'string'
      ? invoiceWithSubEarly.subscription
      : invoiceWithSubEarly.subscription?.id ?? null

    // Split-commencement second installment (subscription_cycle = the 7-day-later renewal).
    // The first installment is recorded via the checkout.session.completed handler;
    // here we only handle the auto-charged second $120 to avoid a duplicate row.
    if (earlySubId && invoice.billing_reason === 'subscription_cycle') {
      try {
        const sub = await stripe.subscriptions.retrieve(earlySubId)
        if (sub.metadata?.type === 'commencement_fee' && sub.metadata?.installments === '2') {
          const leadId = sub.metadata.lead_id
          if (leadId) {
            const admin = createAdminClient()
            const { data: lead } = await admin
              .from('leads')
              .select('id, name, email, converted_to_client_id')
              .eq('id', leadId)
              .maybeSingle()
            if (lead?.converted_to_client_id && invoice.amount_paid > 0) {
              await admin.from('be_payments').insert({
                lead_id: leadId,
                client_id: lead.converted_to_client_id,
                amount: invoice.amount_paid / 100,
                status: 'paid',
                stripe_payment_id: null,
                stripe_subscription_id: earlySubId,
                paid_at: new Date().toISOString(),
              })
              if (process.env.RESEND_API_KEY) {
                const resend = new Resend(process.env.RESEND_API_KEY)
                await resend.emails.send({
                  from: 'Body Recode <kade@bodyrecode.au>',
                  to: 'kade@bodyrecode.au',
                  subject: `Second commencement installment received — ${lead.name}`,
                  html: `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:480px;margin:0 auto;padding:40px 24px;background:#FFFFFF;color:#aaa;">
  <img src="https://bodyrecode.au/logo-black.png" width="110" alt="Body Recode" style="display:block;margin-bottom:32px;" />
  <p style="font-size:20px;font-weight:700;color:#fff;margin:0 0 8px;">${lead.name} paid the second $120.</p>
  <p style="font-size:15px;color:#aaa;margin:0 0 24px;">Commencement fee fully paid ($240 total). The split subscription will auto-cancel within the next 24 hours.</p>
  <a href="${appUrl()}/dashboard/clients/${lead.converted_to_client_id}#payments" style="display:inline-block;padding:12px 24px;background:#1B6DFC;color:#000;font-size:14px;font-weight:700;text-decoration:none;border-radius:8px;">View client</a>
</div>`,
                })
              }
            }
            return NextResponse.json({ received: true })
          }
        }
      } catch (e) {
        console.error('split-commencement invoice.payment_succeeded check failed:', e)
      }
    }

    const clientId = invoice.lines?.data?.[0]?.metadata?.client_id
    if (clientId && invoice.amount_paid > 0) {
      const admin = createAdminClient()
      await admin.from('be_payments').insert({
        client_id: clientId,
        amount: invoice.amount_paid / 100,
        status: 'paid',
        stripe_payment_id: null,
        paid_at: new Date().toISOString(),
      })
    }

    // Refresh the parent subscription so client_subscriptions reflects the
    // advanced current_period_end. In Stripe SDK v18+, invoice.subscription
    // was removed from the typed surface; access the raw field defensively.
    const invoiceWithSub = invoice as Stripe.Invoice & { subscription?: string | Stripe.Subscription | null }
    const subId = typeof invoiceWithSub.subscription === 'string'
      ? invoiceWithSub.subscription
      : invoiceWithSub.subscription?.id ?? null
    if (subId) {
      try {
        const admin = createAdminClient()
        const sub = await stripe.subscriptions.retrieve(subId, {
          expand: ['items.data.price.product'],
        })
        await syncSubscriptionFromStripe(admin, sub)
      } catch (e) {
        console.error('subscription refresh on invoice.payment_succeeded failed:', e)
      }
    }
    return NextResponse.json({ received: true })
  }

  // Handle invoice payment failure
  if (event.type === 'invoice.payment_failed') {
    const invoice = event.data.object as Stripe.Invoice
    const clientId = invoice.lines?.data?.[0]?.metadata?.client_id
    if (clientId) {
      const admin = createAdminClient()
      await admin.from('be_payments').insert({
        client_id: clientId,
        amount: invoice.amount_due / 100,
        status: 'failed',
        stripe_payment_id: null,
      })

      // Notify coach of failed payment
      if (process.env.RESEND_API_KEY) {
        const { data: client } = await admin
          .from('clients')
          .select('name, email')
          .eq('id', clientId)
          .single()
        if (client) {
          const resend = new Resend(process.env.RESEND_API_KEY)
          await resend.emails.send({
            from: 'Body Recode <kade@bodyrecode.au>',
            to: 'kade@bodyrecode.au',
            subject: `Payment failed — ${client.name}`,
            html: `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:480px;margin:0 auto;padding:40px 24px;background:#FFFFFF;color:#aaa;">
  <img src="https://bodyrecode.au/logo-black.png" width="110" alt="Body Recode" style="display:block;margin-bottom:32px;" />
  <p style="font-size:20px;font-weight:700;color:#fff;margin:0 0 8px;">Payment failed — ${client.name}</p>
  <p style="font-size:15px;color:#aaa;margin:0 0 24px;">A subscription payment for ${client.name} (${client.email}) has failed. Check Stripe for details.</p>
  <a href="${appUrl()}/dashboard/business/payments" style="display:inline-block;padding:12px 24px;background:#1B6DFC;color:#000;font-size:14px;font-weight:700;text-decoration:none;border-radius:8px;">View Payments</a>
</div>`,
          })
        }
      }
    }
    return NextResponse.json({ received: true })
  }

  if (event.type !== 'checkout.session.completed') {
    return NextResponse.json({ received: true })
  }

  const session = event.data.object as Stripe.Checkout.Session

  // Handle weekly subscription payment.
  //
  // Duplicate-subscription guard (added 2026-05-22 after Samantha was billed
  // three times for three separate subscriptions in 14 days — the static
  // Stripe Payment Link is reusable and there was no client-level idempotency).
  // The guard distinguishes three cases:
  //   1. Same subscription, webhook retry → already-recorded payment exists →
  //      ack and exit, do NOT insert another row.
  //   2. Different subscription, client already has subscription_active=true →
  //      auto-cancel the new sub immediately, alert Kade, do NOT mark/record.
  //   3. Fresh subscription, client is inactive → standard path.
  if (session.mode === 'subscription' && session.client_reference_id) {
    const admin = createAdminClient()
    const incomingSubId = session.subscription as string | null

    if (incomingSubId) {
      const { data: existingPayment } = await admin
        .from('be_payments')
        .select('id')
        .eq('stripe_subscription_id', incomingSubId)
        .maybeSingle()
      if (existingPayment) {
        return NextResponse.json({ received: true, note: 'webhook retry for already-recorded subscription' })
      }
    }

    const { data: existingClient } = await admin
      .from('clients')
      .select('subscription_active, name, email')
      .eq('id', session.client_reference_id)
      .maybeSingle()

    if (existingClient?.subscription_active && incomingSubId) {
      try {
        await stripe.subscriptions.cancel(incomingSubId, { prorate: false, invoice_now: false })
      } catch (e) {
        console.error('duplicate-sub guard: failed to auto-cancel', incomingSubId, e)
      }

      if (process.env.RESEND_API_KEY) {
        const resend = new Resend(process.env.RESEND_API_KEY)
        const inner = `
${emailLogo()}
${emailEyebrow('Duplicate Subscription Caught')}
${emailHeading(`${existingClient.name ?? 'A client'} just completed a 2nd subscription.`)}
${emailDivider()}
${emailBody(`The Stripe webhook saw a checkout.session.completed for this client, but their <strong>subscription_active</strong> flag was already true. The new subscription has been auto-cancelled before any charge could land beyond the first invoice that Stripe already captured. Issue a refund for that first invoice in the Stripe dashboard if the client did not intend to subscribe twice.`)}
${emailStatusCard({
  eyebrow: 'Details',
  headline: `${existingClient.name ?? '(unknown)'} · sub ${incomingSubId} auto-cancelled`,
  body: `Client email: ${existingClient.email ?? '(unknown)'}. If this 2nd subscription was intentional (e.g. an upgrade or replacement), reactivate it in Stripe and adjust the client's payment plan manually. Otherwise issue a refund for the captured first invoice.`,
})}
${darkEmailSignature()}
`
        await resend.emails.send({
          from: 'Body Recode System <kade@bodyrecode.au>',
          to: 'kade@bodyrecode.au',
          subject: `Duplicate subscription auto-cancelled - ${existingClient.name ?? 'client'}`,
          html: darkEmailShell(inner, { previewText: `Duplicate sub auto-cancelled for ${existingClient.name ?? 'a client'}` }),
        })
      }

      return NextResponse.json({ received: true, note: 'duplicate subscription auto-cancelled', cancelled: incomingSubId })
    }

    await admin
      .from('clients')
      .update({ subscription_active: true })
      .eq('id', session.client_reference_id)

    if (session.amount_total && session.amount_total > 0) {
      await admin.from('be_payments').insert({
        client_id: session.client_reference_id,
        amount: session.amount_total / 100,
        status: 'paid',
        stripe_payment_id: session.payment_intent as string ?? null,
        stripe_subscription_id: incomingSubId ?? null,
        paid_at: new Date().toISOString(),
      })
    }
    return NextResponse.json({ received: true })
  }

  // Handle Self-Guided Program (downsell) purchase
  if (session.metadata?.type === 'self_guided_program') {
    const { lead_id, body_state, name, email } = session.metadata
    const admin = createAdminClient()

    const token = crypto.randomUUID()

    await admin
      .from('leads')
      .update({
        downsell_purchased: true,
        downsell_state: body_state,
        downsell_purchased_at: new Date().toISOString(),
        downsell_program_token: token,
      })
      .eq('id', lead_id)

    await admin.from('lead_events').insert({
      lead_id,
      type: 'downsell_purchased',
      subject: `Self-Guided Program purchased (${body_state} state)`,
      notes: `$97 one-time. Program token: ${token}`,
      sent_at: new Date().toISOString(),
    })

    const programUrl = `${appUrl()}/program/${token}`
    const firstName = name.split(' ')[0]

    if (email && process.env.RESEND_API_KEY) {
      const resend = new Resend(process.env.RESEND_API_KEY)

      const stateLabels: Record<string, string> = {
        depleted: 'Depleted',
        transitioning: 'Transitioning',
        ready: 'Ready',
      }
      const stateLabel = stateLabels[body_state] ?? body_state

      // Delivery email to customer
      await resend.emails.send({
        from: 'Kade at Body Recode <kade@bodyrecode.au>',
        to: email,
        subject: `Your ${stateLabel} State Program`,
        html: `<!DOCTYPE html><html><head><meta charset="utf-8"/><meta name="color-scheme" content="light only"/></head>
<body style="margin:0;padding:0;background-color:#FFFFFF;">
  <table width="100%" cellpadding="0" cellspacing="0" bgcolor="#FFFFFF" style="background-color:#FFFFFF;padding:48px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" bgcolor="#FFFFFF" style="max-width:520px;background-color:#FFFFFF;border-radius:16px;border:1px solid #E5E5E5;overflow:hidden;">
          <tr>
            <td bgcolor="#FFFFFF" style="background-color:#FFFFFF;padding:28px 40px;border-bottom:1px solid #E5E5E5;">
              <img src="https://bodyrecode.au/logo-black.png" width="130" alt="Body Recode" style="display:block;" />
            </td>
          </tr>
          <tr>
            <td bgcolor="#FFFFFF" style="background-color:#FFFFFF;padding:36px 40px 40px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:15px;line-height:1.75;color:#999999;">
              <p style="margin:0 0 18px;font-size:15px;color:#999999;line-height:1.75;">Hi ${firstName},</p>
              <p style="margin:0 0 18px;font-size:15px;color:#999999;line-height:1.75;">Your 12-week ${stateLabel} State Program is ready. Everything is in there: the full training protocol, nutrition targets, priority foods, and what to expect each phase.</p>
              <p style="margin:0 0 18px;font-size:15px;color:#999999;line-height:1.75;">Bookmark the page so you can come back to it any time.</p>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin:28px 0;">
                <tr><td><a href="${programUrl}" style="display:inline-block;padding:14px 28px;background:#1B6DFC;color:#FFFFFF;font-size:14px;font-weight:700;text-decoration:none;border-radius:8px;letter-spacing:0.03em;">View My Program</a></td></tr>
              </table>
              <p style="margin:0 0 18px;font-size:13px;color:#999999;line-height:1.75;">Or copy this link: ${programUrl}</p>
              ${darkEmailSignature()}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body></html>`,
      })

      // Notify Kade
      await resend.emails.send({
        from: 'Body Recode <kade@bodyrecode.au>',
        to: 'kade@bodyrecode.au',
        subject: `Self-Guided Program sold - ${name}`,
        html: `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:480px;margin:0 auto;padding:40px 24px;background:#FFFFFF;color:#aaa;">
  <img src="https://bodyrecode.au/logo-black.png" width="110" alt="Body Recode" style="display:block;margin-bottom:32px;" />
  <p style="font-size:20px;font-weight:700;color:#fff;margin:0 0 8px;">${name} purchased the ${stateLabel} State Program</p>
  <p style="font-size:15px;color:#aaa;margin:0 0 24px;">$97. Program delivered to ${email}. They are in the downsell funnel.</p>
  <a href="${appUrl()}/dashboard/leads/${lead_id}" style="display:inline-block;padding:12px 24px;background:#1B6DFC;color:#000;font-size:14px;font-weight:700;text-decoration:none;border-radius:8px;">View Lead</a>
</div>`,
      })

      // Schedule program buyer nurture sequence (Week 4, 8, 12)
      const BOOKING_LINK = process.env.BOOKING_LINK ?? `${appUrl()}/book`
      const { email1: n1, email2: n2, email3: n3 } = buildProgramBuyerEmails(firstName, BOOKING_LINK)
      const now = new Date()
      const week4 = daysAfter9amBrisbane(now, 28)
      const week8 = daysAfter9amBrisbane(now, 56)
      const week12 = daysAfter9amBrisbane(now, 84)

      await Promise.all([
        resend.emails.send({
          from: 'Kade at Body Recode <kade@bodyrecode.au>',
          to: email,
          subject: n1.subject,
          html: n1.html,
          scheduledAt: week4.toISOString(),
        }),
        resend.emails.send({
          from: 'Kade at Body Recode <kade@bodyrecode.au>',
          to: email,
          subject: n2.subject,
          html: n2.html,
          scheduledAt: week8.toISOString(),
        }),
        resend.emails.send({
          from: 'Kade at Body Recode <kade@bodyrecode.au>',
          to: email,
          subject: n3.subject,
          html: n3.html,
          scheduledAt: week12.toISOString(),
        }),
      ])

      await admin.from('lead_events').insert({
        lead_id,
        type: 'email_sent',
        subject: 'Program buyer nurture sequence scheduled (Week 4, 8, 12)',
        notes: 'Auto-scheduled on program purchase.',
        sent_at: new Date().toISOString(),
      })
    }

    return NextResponse.json({ received: true })
  }

  // Handle Body Decode Report purchase
  if (session.metadata?.type === 'scorecard_report') {
    const { name, email, score, body_state, section_scores } = session.metadata
    const admin = createAdminClient()

    const { data: report } = await admin
      .from('scorecard_reports')
      .insert({
        name,
        email,
        score: parseInt(score),
        body_state,
        section_scores: JSON.parse(section_scores ?? '{}'),
        stripe_payment_id: session.payment_intent as string ?? null,
      })
      .select('token')
      .single()

    if (report && process.env.RESEND_API_KEY) {
      const resend = new Resend(process.env.RESEND_API_KEY)
      const firstName = name.split(' ')[0]
      const reportUrl = `${appUrl()}/report/${report.token}`
      const BOOKING_LINK = process.env.BOOKING_LINK ?? `${appUrl()}/book`

      // Deliver the report
      const reportInner = `
${emailLogo()}
${emailEyebrow('Body Decode Report')}
${emailHeading('Your report is ready.')}
${emailDivider()}
${emailBody(`Hi ${firstName},`)}
${emailBody('Your Body Decode Report is ready. It breaks down what your scorecard results mean, what your body state tells us, what is actively working against you right now, and what to focus on first.', { bottom: 28 })}
${emailCta({ href: reportUrl, label: 'View my report' })}
${emailUrlFallback(reportUrl, 'Or paste this link into your browser')}
${darkEmailSignature()}
`
      await resend.emails.send({
        from: 'Kade at Body Recode <kade@bodyrecode.au>',
        to: email,
        subject: `Your Body Decode Report is ready`,
        html: darkEmailShell(reportInner, { previewText: `${firstName}, your Body Decode Report is ready.` }),
      })

      // Phase B5: bundle the matching State Field Guide alongside the Report.
      // Locked Plan §6.3: the scorecard-result secondary is the Report + Guide
      // bundle at $37. The Report stays the hero (sent above); the matching
      // State Guide is the value-add (fulfilled below). If the Guide product
      // for this body_state has not been authored/seeded yet (digital_asset_metadata
      // row missing), the bundle silently degrades to Report-only — no crash,
      // no email mention of a Guide that does not yet exist.
      const normalisedState = body_state?.toLowerCase().match(/^(depleted|transitioning|ready)/)?.[1]
      if (normalisedState) {
        const { data: guideProduct } = await admin
          .from('be_products')
          .select('id, name, kind, digital_asset_metadata!inner(slug, source_path, fulfilment_kind, engine_call, ascension_cta_path, active, state_match)')
          .eq('kind', 'field_guide')
          .eq('digital_asset_metadata.state_match', normalisedState)
          .eq('digital_asset_metadata.active', true)
          .maybeSingle()

        if (guideProduct) {
          const meta = Array.isArray(guideProduct.digital_asset_metadata)
            ? guideProduct.digital_asset_metadata[0]
            : guideProduct.digital_asset_metadata

          if (meta) {
            const { data: existingClient } = await admin
              .from('clients')
              .select('id')
              .ilike('email', email)
              .maybeSingle()

            const { data: guidePurchase } = await admin
              .from('digital_asset_purchases')
              .insert({
                client_id: existingClient?.id ?? null,
                email_at_purchase: email.toLowerCase(),
                product_id: guideProduct.id,
                stripe_payment_id: session.payment_intent as string ?? null,
                stripe_session_id: `${session.id}__bundle_guide`,  // suffix to avoid unique conflict with the Report row if a separate one ever lands
                status: 'paid',
                source: `scorecard_report_bundle_${normalisedState}`,
              })
              .select('id')
              .single()

            if (guidePurchase) {
              await fulfilInstantPdf({
                purchase_id: guidePurchase.id,
                product: { id: guideProduct.id, name: guideProduct.name, kind: guideProduct.kind },
                meta: {
                  slug: meta.slug,
                  source_path: meta.source_path,
                  fulfilment_kind: meta.fulfilment_kind,
                  engine_call: meta.engine_call,
                  ascension_cta_path: meta.ascension_cta_path,
                },
                email,
                source: `scorecard_report_bundle_${normalisedState}`,
              })
            }
          }
        }
      }

      // Schedule 3-email report follow-up sequence
      const { email1: f1, email2: f2, email3: f3 } = buildReportFollowUpEmails(firstName, body_state, BOOKING_LINK)
      const day2 = daysAfter9amBrisbane(nextMorning9amBrisbane(), 1)
      const day5 = daysAfter9amBrisbane(nextMorning9amBrisbane(), 4)
      const day10 = daysAfter9amBrisbane(nextMorning9amBrisbane(), 9)

      const [rf1, rf2, rf3] = await Promise.all([
        resend.emails.send({
          from: 'Kade at Body Recode <kade@bodyrecode.au>',
          to: email,
          subject: f1.subject,
          html: f1.html,
          scheduledAt: day2.toISOString(),
        }),
        resend.emails.send({
          from: 'Kade at Body Recode <kade@bodyrecode.au>',
          to: email,
          subject: f2.subject,
          html: f2.html,
          scheduledAt: day5.toISOString(),
        }),
        resend.emails.send({
          from: 'Kade at Body Recode <kade@bodyrecode.au>',
          to: email,
          subject: f3.subject,
          html: f3.html,
          scheduledAt: day10.toISOString(),
        }),
      ])

      // Find lead by email and cancel any pending scorecard follow-up, log event
      const { data: lead } = await admin
        .from('leads')
        .select('id, followup_email_ids')
        .ilike('email', email)
        .maybeSingle()

      if (lead) {
        const followupIds = (lead.followup_email_ids as string[] | null) ?? []
        if (followupIds.length > 0) {
          for (const emailId of followupIds) {
            try { await resend.emails.cancel(emailId) } catch {}
          }
        }

        const newEmailIds = [rf1.data?.id, rf2.data?.id, rf3.data?.id].filter(Boolean) as string[]
        await admin
          .from('leads')
          .update({ followup_email_ids: newEmailIds, status: 'report_sent' })
          .eq('id', lead.id)

        await admin.from('lead_events').insert({
          lead_id: lead.id,
          type: 'email_sent',
          subject: 'Body Decode Report delivered',
          notes: 'Report follow-up sequence scheduled (Day 2, Day 5, Day 10)',
          sent_at: new Date().toISOString(),
        })
      }
    }

    return NextResponse.json({ received: true })
  }

  // Handle Blueprint purchase
  if (session.metadata?.type === 'blueprint_purchase') {
    const { name, email, pattern_from_challenge } = session.metadata
    const admin = createAdminClient()
    const firstName = name.split(' ')[0]

    // If buyer came through challenge, pattern is pre-loaded — create enrollment directly
    // If no pattern, portal will show assessment gate
    const pattern = pattern_from_challenge || null

    const { data: enrollment } = await admin
      .from('blueprint_enrollments')
      .insert({
        email: email.toLowerCase(),
        first_name: firstName,
        pattern: pattern ?? 'pending',
        pattern_source: pattern ? 'challenge' : 'assessment',
        stripe_payment_intent_id: session.payment_intent as string ?? null,
      })
      .select('token')
      .single()

    if (enrollment && process.env.RESEND_API_KEY) {
      const resend = new Resend(process.env.RESEND_API_KEY)
      const portalUrl = `${appUrl()}/blueprint/${enrollment.token}`

      const welcome = buildBlueprintPurchaseWelcomeEmail({ firstName, portalUrl, pattern })
      await resend.emails.send({
        from: 'Kade at Body Recode <kade@bodyrecode.au>',
        to: email,
        subject: welcome.subject,
        html: welcome.html,
      })

      // Fire week-advance sequence
      await inngest.send({
        name: 'blueprint/enrolled',
        data: { token: enrollment.token, email, firstName },
      })

      const coachNotify = buildBlueprintCoachNotificationEmail({ name, email, pattern })
      await resend.emails.send({
        from: 'Body Recode <kade@bodyrecode.au>',
        to: 'kade@bodyrecode.au',
        subject: coachNotify.subject,
        html: coachNotify.html,
      })
    }

    return NextResponse.json({ received: true })
  }

  // Handle Membership purchase
  if (session.metadata?.type === 'membership_purchase') {
    const { first_name, email, pattern_from_blueprint, blueprint_token } = session.metadata
    const admin = createAdminClient()
    const stripeSubscriptionId = session.subscription as string ?? null

    const { data: membership } = await admin
      .from('membership_enrollments')
      .insert({
        email: email.toLowerCase(),
        first_name,
        pattern: pattern_from_blueprint || 'pending',
        pattern_source: pattern_from_blueprint ? 'blueprint' : 'assessment',
        blueprint_token: blueprint_token || null,
        stripe_subscription_id: stripeSubscriptionId,
        current_block: 'A',
        current_week: 1,
      })
      .select('token')
      .single()

    if (membership && process.env.RESEND_API_KEY) {
      const resend = new Resend(process.env.RESEND_API_KEY)
      // Always route to the Membership portal — that is where Block A
      // actually lives. The Blueprint portal at /blueprint/{token} still
      // resolves and gracefully hands off via the Week 6 handoff card,
      // so the user's prior Blueprint URL is not orphaned.
      const portalUrl = `${appUrl()}/membership/${membership.token}`

      const welcome = buildMembershipPurchaseWelcomeEmail({ firstName: first_name, portalUrl })
      await resend.emails.send({
        from: 'Kade at Body Recode <kade@bodyrecode.au>',
        to: email,
        subject: welcome.subject,
        html: welcome.html,
      })

      const coachNotify = buildMembershipCoachNotificationEmail({
        firstName: first_name,
        email,
        pattern: pattern_from_blueprint || null,
        blueprintToken: blueprint_token || null,
      })
      await resend.emails.send({
        from: 'Body Recode <kade@bodyrecode.au>',
        to: 'kade@bodyrecode.au',
        subject: coachNotify.subject,
        html: coachNotify.html,
      })

      await inngest.send({
        name: 'membership/enrolled',
        data: { token: membership.token, email, first_name },
      })
    }

    return NextResponse.json({ received: true })
  }

  // Handle Extension purchase
  if (session.metadata?.type === 'extension_purchase') {
    const { first_name, email, pattern_from_blueprint, blueprint_token } = session.metadata
    const admin = createAdminClient()

    const { data: enrollment } = await admin
      .from('extension_enrollments')
      .insert({
        email: email.toLowerCase(),
        first_name,
        pattern: pattern_from_blueprint || 'pending',
        pattern_source: pattern_from_blueprint ? 'blueprint' : 'assessment',
        blueprint_token: blueprint_token || null,
        stripe_payment_intent_id: session.payment_intent as string ?? null,
        current_week: 1,
      })
      .select('token')
      .single()

    if (enrollment && process.env.RESEND_API_KEY) {
      const resend = new Resend(process.env.RESEND_API_KEY)
      const portalUrl = `${appUrl()}/extension/${enrollment.token}`

      const extensionInner = `
${emailLogo()}
${emailEyebrow('Body Rewire Extension')}
${emailHeading('Your 90-day extension is ready.')}
${emailDivider()}
${emailBody(`Hi ${first_name},`)}
${emailBody('Your 90-Day Body Rewire Extension is active. Your portal is ready — 12 weeks of progressive programming that picks up exactly where the Blueprint ended.')}
${emailBody('Weeks 1-6 run <strong style="color:#1A1A1A;">Block A (Consolidate)</strong>. Weeks 7-12 run <strong style="color:#1A1A1A;">Block B (Advance)</strong>. Same pattern, same portal structure you already know.', { bottom: 28 })}
${emailCta({ href: portalUrl, label: 'Open my Extension portal' })}
${emailUrlFallback(portalUrl, 'Or paste this link into your browser')}
${darkEmailSignature()}
`
      await resend.emails.send({
        from: 'Kade at Body Recode <kade@bodyrecode.au>',
        to: email,
        subject: `Your 90-Day Body Rewire Extension is ready`,
        html: darkEmailShell(extensionInner, { previewText: `${first_name}, your 90-Day Extension is ready.` }),
      })

      const extensionCoachInner = `
${emailLogo()}
${emailEyebrow('Extension Purchased')}
${emailHeading(`${first_name} bought the 90-Day Extension.`)}
${emailDivider()}
${emailStatusCard({
  eyebrow: 'New enrollment',
  headline: `Email: ${email}`,
  body: `Pattern: ${pattern_from_blueprint || 'Pending assessment'}. Week-advance sequence fired via Inngest.`,
})}
${darkEmailSignature()}
`
      await resend.emails.send({
        from: 'Body Recode <kade@bodyrecode.au>',
        to: 'kade@bodyrecode.au',
        subject: `Extension purchased - ${first_name}`,
        html: darkEmailShell(extensionCoachInner, { previewText: `${first_name} bought the 90-Day Extension.` }),
      })

      await inngest.send({
        name: 'extension/enrolled',
        data: { token: enrollment.token, email, firstName: first_name },
      })
    }

    return NextResponse.json({ received: true })
  }

  // Handle Digital Asset purchase (Field Guides / protocols / bolt-ons).
  // Phase A locked 2026-06-06 — see 2026-06-06_Phase_A_Reconcile.md §4.4.
  if (session.metadata?.type === 'digital_asset_purchase') {
    const { product_id, email, source } = session.metadata
    const admin = createAdminClient()

    const { data: product } = await admin
      .from('be_products')
      .select('id, name, kind')
      .eq('id', product_id)
      .single()

    const { data: meta } = await admin
      .from('digital_asset_metadata')
      .select('slug, source_path, fulfilment_kind, engine_call, ascension_cta_path')
      .eq('product_id', product_id)
      .single()

    if (!product || !meta) {
      console.error('[stripe webhook] digital_asset_purchase: product or metadata not found', { product_id })
      return NextResponse.json({ received: true })
    }

    // Look up existing client by email if any (backfills client_id).
    const { data: existingClient } = await admin
      .from('clients')
      .select('id')
      .ilike('email', email)
      .maybeSingle()

    // Lift the engine-input fields out of session.metadata into raw at top
    // level so orchestrator code can read them without spelunking. Currently
    // only `question` (for member_question deep-dive); future engines that
    // capture pre-purchase input land here too.
    const metaQuestion = typeof session.metadata?.question === 'string' ? session.metadata.question : null

    const { data: purchase, error: purchaseError } = await admin
      .from('digital_asset_purchases')
      .insert({
        client_id: existingClient?.id ?? null,
        email_at_purchase: email.toLowerCase(),
        product_id,
        stripe_payment_id: session.payment_intent as string ?? null,
        stripe_session_id: session.id,
        status: 'paid',
        source: source ?? 'direct',
        raw: {
          ...(session as unknown as Record<string, unknown>),
          ...(metaQuestion ? { question: metaQuestion } : {}),
        },
      })
      .select('id')
      .single()

    if (purchaseError || !purchase) {
      console.error('[stripe webhook] digital_asset_purchase insert error:', purchaseError)
      return NextResponse.json({ received: true })
    }

    // Fulfilment routing by kind. Phase A shipped instant_pdf; Phase C shipped
    // instant_engine (bolt_on_ai). coach_task + shipping branches are still stubs.
    if (meta.fulfilment_kind === 'instant_pdf') {
      await fulfilInstantPdf({ purchase_id: purchase.id, product, meta, email, source: source ?? 'direct' })
    } else if (meta.fulfilment_kind === 'instant_engine') {
      // 1. Send the "we're generating" email synchronously so the buyer
      //    knows the order landed even if Inngest is slow to pick up.
      if (process.env.RESEND_API_KEY) {
        try {
          const { Resend: ResendCls } = await import('resend')
          const { buildDeepDiveGeneratingEmail } = await import('@/lib/digital-asset-engine-emails')
          const resend = new ResendCls(process.env.RESEND_API_KEY)
          const firstName = email.split('@')[0]
          const built = buildDeepDiveGeneratingEmail({
            firstName,
            productTitle: product.name,
            etaMinutes: 10,
          })
          await resend.emails.send({
            from: 'Kade at Body Recode <kade@bodyrecode.au>',
            to: email,
            subject: built.subject,
            html: built.html,
          })
        } catch (e) {
          console.error('[stripe webhook] instant_engine generating email failed:', e)
        }
      }

      // 2. Fire the Inngest event. The fulfilment function picks it up,
      //    runs the engine, renders the PDF, uploads, marks fulfilled,
      //    sends the ready email.
      try {
        const { inngest } = await import('@/lib/inngest')
        await inngest.send({
          name: 'digital_asset/engine_call',
          data: { purchase_id: purchase.id },
        })
      } catch (e) {
        console.error('[stripe webhook] inngest.send digital_asset/engine_call failed:', e)
      }
    } else if (meta.fulfilment_kind === 'coach_task') {
      // Phase D — bolt_on_human. Create a coach Today's Focus action.
      // TODO(Phase D): create coach_tasks row + due_at SLA
      console.log('[stripe webhook] digital_asset_purchase coach_task stub', purchase.id)
    } else if (meta.fulfilment_kind === 'shipping') {
      // Phase E — bolt_on_physical. Write to shipping queue.
      // TODO(Phase E): shipping_queue insert
      console.log('[stripe webhook] digital_asset_purchase shipping stub', purchase.id)
    }

    return NextResponse.json({ received: true })
  }

  if (session.metadata?.type !== 'commencement_fee') {
    return NextResponse.json({ received: true })
  }

  // Split-commencement: cap the subscription at 2 invoices by setting cancel_at
  // ~8 days out. Stripe doesn't accept cancel_at on subscription_data at create
  // time, so we do it here once we know the subscription id. Day 0 invoice is
  // already paid (this webhook); day 7 invoice will auto-bill; the cancellation
  // hits before day 14 so no third invoice is generated.
  if (session.mode === 'subscription' && session.metadata.installments === '2' && session.subscription) {
    try {
      const subId = typeof session.subscription === 'string' ? session.subscription : session.subscription.id
      await stripe.subscriptions.update(subId, {
        cancel_at: Math.floor(Date.now() / 1000) + 8 * 24 * 60 * 60,
      })
    } catch (e) {
      console.error('commencement webhook: failed to set cancel_at on split subscription:', e)
    }
  }

  // Two paths for commencement_fee:
  //   - metadata.client_id → existing client paying their own commencement
  //     (typically a non-billing package the coach decided to charge after
  //     all). No lead lookup; we record the payment + mark the plan paid.
  //   - metadata.lead_id   → standard funnel (lead → fee → client created).
  //     The existing flow below handles this and is unchanged.
  const directClientId = session.metadata.client_id
  if (directClientId) {
    const admin = createAdminClient()

    const { data: client } = await admin
      .from('clients')
      .select('id, name, email')
      .eq('id', directClientId)
      .maybeSingle()

    if (!client) {
      console.error('commencement_fee webhook: client_id in metadata not found:', directClientId)
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    // Record the payment.
    if (session.amount_total && session.amount_total > 0) {
      await admin.from('be_payments').insert({
        client_id: client.id,
        amount: session.amount_total / 100,
        status: 'paid',
        stripe_payment_id: session.payment_intent as string ?? null,
        paid_at: new Date().toISOString(),
      })
    }

    // Mark the commencement fee paid on the plan row, creating one if it
    // doesn't exist yet (the non-billing path skips plan creation by default,
    // so the first commencement-fee payment is what materialises the row).
    const paidAt = new Date().toISOString()
    const { data: existingPlan } = await admin
      .from('client_payment_plan')
      .select('client_id')
      .eq('client_id', client.id)
      .maybeSingle()

    if (existingPlan) {
      await admin
        .from('client_payment_plan')
        .update({
          commencement_fee_paid_at: paidAt,
          commencement_fee_stripe_payment_id: session.payment_intent as string ?? null,
        })
        .eq('client_id', client.id)
    } else {
      // Attach to the coach's default plan if there is one. payment_plan_id is
      // nullable so it's fine if the lookup misses (e.g. brand-new tenant).
      const { data: coachRow } = await admin
        .from('clients')
        .select('coach_id')
        .eq('id', client.id)
        .single()
      const { data: defaultPlan } = coachRow
        ? await admin
            .from('payment_plans')
            .select('id')
            .eq('coach_id', coachRow.coach_id)
            .eq('is_default', true)
            .maybeSingle()
        : { data: null }

      await admin.from('client_payment_plan').insert({
        client_id: client.id,
        payment_plan_id: defaultPlan?.id ?? null,
        commencement_fee_paid_at: paidAt,
        commencement_fee_stripe_payment_id: session.payment_intent as string ?? null,
      })
    }

    // Notify coach.
    if (process.env.RESEND_API_KEY) {
      const resend = new Resend(process.env.RESEND_API_KEY)
      await resend.emails.send({
        from: 'Body Recode <kade@bodyrecode.au>',
        to: 'kade@bodyrecode.au',
        subject: `Commencement fee received — ${client.name}`,
        html: `
<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:480px;margin:0 auto;padding:40px 24px;background:#FFFFFF;color:#aaa;">
  <img src="https://bodyrecode.au/logo-black.png" width="110" alt="Body Recode" style="display:block;margin-bottom:32px;" />
  <p style="font-size:20px;font-weight:700;color:#fff;margin:0 0 8px;">${client.name} paid the commencement fee.</p>
  <p style="font-size:15px;color:#aaa;margin:0 0 24px;">$240 confirmed. The Payments tracker now shows commencement as paid on their profile.</p>
  <a href="${appUrl()}/dashboard/clients/${client.id}#payments" style="display:inline-block;padding:12px 24px;background:#1B6DFC;color:#000;font-size:14px;font-weight:700;text-decoration:none;border-radius:8px;">View client</a>
</div>`,
      })
    }

    return NextResponse.json({ received: true })
  }

  const leadId = session.metadata.lead_id
  if (!leadId) return NextResponse.json({ error: 'No lead_id or client_id in metadata' }, { status: 400 })

  const admin = createAdminClient()

  const { data: lead } = await admin
    .from('leads')
    .select('*')
    .eq('id', leadId)
    .maybeSingle()

  if (!lead) return NextResponse.json({ error: 'Lead not found' }, { status: 404 })

  // Two paths:
  //   1) Lead was already manually converted (markPaid=false). Client + intake
  //      invitation already exist - just record the payment, flip the status,
  //      and send the welcome email.
  //   2) Lead is still a lead. Standard flow: create client + invitation,
  //      flip the status, send welcome email.
  let client: { id: string; onboarding_token: string } | null = null

  if (lead.converted_to_client_id) {
    const { data: existing, error: existingErr } = await admin
      .from('clients')
      .select('id, onboarding_token')
      .eq('id', lead.converted_to_client_id)
      .single()
    if (existingErr || !existing) {
      console.error('Lead is converted but client record is missing:', existingErr)
      return NextResponse.json({ error: 'Client record missing' }, { status: 500 })
    }
    client = existing
  } else {
    // onboarding_token is generated by DB default
    const { data: created, error: clientError } = await admin
      .from('clients')
      .insert({ coach_id: lead.coach_id, name: lead.name, email: lead.email ?? null })
      .select('id, onboarding_token')
      .single()

    if (clientError || !created) {
      console.error('Failed to create client:', clientError)
      return NextResponse.json({ error: 'Failed to create client' }, { status: 500 })
    }
    client = created

    // Create intake invitation (still needed — portal page references it via client.intake_invitations)
    const { error: invError } = await admin
      .from('intake_invitations')
      .insert({ client_id: client.id })

    if (invError) {
      console.error('Failed to create intake invitation:', invError)
      return NextResponse.json({ error: 'Failed to create intake invitation' }, { status: 500 })
    }
  }

  // Update lead — set converted markers if this was an unconverted lead, and
  // always flip status to commencement_fee_paid now that payment has landed.
  const leadUpdate: Record<string, unknown> = { status: 'commencement_fee_paid' }
  if (!lead.converted_to_client_id) {
    leadUpdate.converted_to_client_id = client.id
    leadUpdate.converted_at = new Date().toISOString()
  }
  await admin
    .from('leads')
    .update(leadUpdate)
    .eq('id', leadId)

  // Record commencement fee payment. In subscription mode (split installments)
  // session.payment_intent is null, so we fall back to the subscription id for
  // traceability. session.amount_total is the first-invoice amount ($120 in
  // split mode, $240 in one-off mode), so it reflects what actually landed.
  const subscriptionIdForPayment = session.subscription as string | null
  if (session.amount_total && session.amount_total > 0) {
    await admin.from('be_payments').insert({
      lead_id: leadId,
      client_id: client.id,
      amount: session.amount_total / 100,
      status: 'paid',
      stripe_payment_id: session.payment_intent as string ?? null,
      stripe_subscription_id: subscriptionIdForPayment ?? null,
      paid_at: new Date().toISOString(),
    })
  }

  // Populate client_payment_plan.commencement_fee_paid_at so the per-client
  // Payments tracker recognises this client as paid. Without this, the
  // section reads as "Not tracked for payments" even though the fee landed
  // — Luke's case. Idempotent: skips if already marked paid. For split
  // installments we mark on the first $120 (matches the "portal opens on
  // first payment" decision); the second $120 lands separately via
  // invoice.payment_succeeded above.
  try {
    await markCommencementPaid(
      admin,
      client.id,
      (session.payment_intent as string) || subscriptionIdForPayment || '',
      new Date(),
    )
  } catch (e) {
    console.error('commencement webhook: markCommencementPaid failed:', e)
  }

  // Notify coach (Payment Received)
  if (process.env.RESEND_API_KEY) {
    const resend = new Resend(process.env.RESEND_API_KEY)
    const coachInner = `
${emailLogo()}
${emailEyebrow('Payment Received')}
${emailHeading(`${lead.name} just paid.`)}
${emailDivider()}
${emailBody(`Commencement fee confirmed. The welcome email and intake link have been sent to ${lead.email}.`)}
${emailStatusCard({
  eyebrow: 'Next step',
  headline: 'Wait for intake completion',
  body: `${lead.name} now has portal access and will start the onboarding flow: agreement → health declaration → 221-question intake → baseline. You will be notified as each step lands.`,
})}
${emailCta({ href: `${appUrl()}/dashboard/leads/${lead.id}`, label: 'View lead' })}
${darkEmailSignature()}
`
    await resend.emails.send({
      from: 'Body Recode <kade@bodyrecode.au>',
      to: 'kade@bodyrecode.au',
      subject: `Payment received - ${lead.name}`,
      html: darkEmailShell(coachInner, { previewText: `${lead.name} paid the commencement fee.` }),
    })
  }

  // Send portal access email (Welcome)
  if (lead.email && process.env.RESEND_API_KEY) {
    const resend = new Resend(process.env.RESEND_API_KEY)
    const firstName = lead.name.split(' ')[0]
    const portalUrl = `${appUrl()}/portal/${client.onboarding_token}`
    const guideUrl = 'https://app.bodyrecode.au/coaching-guide'

    const welcomeInner = `
${emailLogo()}
${emailEyebrow('Welcome to Body Recode')}
${emailHeading(`You're officially in, ${firstName}.`)}
${emailDivider()}
${emailBody(`Hi ${firstName},`)}
${emailBody('Your commencement fee has been received. Your client portal is ready.')}
${emailBody(`Open the link below and sign in with this email address (${lead.email}). You'll get a 6-digit code by email — no password to set or remember.`, { bottom: 28 })}
${emailCta({ href: portalUrl, label: 'Open my portal' })}
${emailUrlFallback(portalUrl, 'Or paste this link into your browser')}
${emailFeaturedCard(
  emailNumberedList([
    'Coaching Agreement',
    'Health Declaration',
    'Foundational Intake (221 questions across 8 areas, 15-20 min)',
    'Baseline Documentation (photos and measurements)',
  ]),
  { eyebrow: 'Inside the portal, work through' },
)}
${emailBody('Take your time with the intake — it is the foundation of everything I do with you. Answer based on your typical experience, not your best or worst days.')}
${emailBody(`While you're getting set up, read through your <a href="${guideUrl}" style="color:#1B6DFC;font-weight:600;text-decoration:none;">Active Coaching Client Guide</a> (also linked inside your portal). It covers how the coaching process works, what to expect each week, and how we build progress together.`)}
${emailBody('Looking forward to getting started.')}
${darkEmailSignature()}
`

    await resend.emails.send({
      from: 'Kade at Body Recode <kade@bodyrecode.au>',
      to: lead.email,
      subject: `Welcome to Body Recode, ${firstName}`,
      html: darkEmailShell(welcomeInner, { previewText: `Welcome ${firstName} — your portal is ready.` }),
    })
  }

  return NextResponse.json({ received: true })
}
