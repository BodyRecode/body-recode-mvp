import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { Resend } from 'resend'
import { createAdminClient } from '@/lib/supabase/admin'
import { darkEmailSignature } from '@/lib/email-signature'
import { buildProgramBuyerEmails, buildReportFollowUpEmails, daysAfter9amBrisbane, nextMorning9amBrisbane } from '@/lib/generate-report'
import { inngest } from '@/lib/inngest'
import { syncSubscriptionFromStripe, markCommencementPaid } from '@/lib/stripe-sync'
import { appUrl } from '@/lib/app-url'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

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
            html: `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:480px;margin:0 auto;padding:40px 24px;background:#0c0a09;color:#aaa;">
  <img src="https://bodyrecode.au/logo-teal.png" width="110" alt="Body Recode" style="display:block;margin-bottom:32px;" />
  <p style="font-size:20px;font-weight:700;color:#fff;margin:0 0 8px;">Payment failed — ${client.name}</p>
  <p style="font-size:15px;color:#aaa;margin:0 0 24px;">A subscription payment for ${client.name} (${client.email}) has failed. Check Stripe for details.</p>
  <a href="${appUrl()}/dashboard/business/payments" style="display:inline-block;padding:12px 24px;background:#10E1C2;color:#000;font-size:14px;font-weight:700;text-decoration:none;border-radius:8px;">View Payments</a>
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

  // Handle weekly subscription payment
  if (session.mode === 'subscription' && session.client_reference_id) {
    const admin = createAdminClient()
    await admin
      .from('clients')
      .update({ subscription_active: true })
      .eq('id', session.client_reference_id)

    // Record subscription commencement payment
    if (session.amount_total && session.amount_total > 0) {
      await admin.from('be_payments').insert({
        client_id: session.client_reference_id,
        amount: session.amount_total / 100,
        status: 'paid',
        stripe_payment_id: session.payment_intent as string ?? null,
        stripe_subscription_id: session.subscription as string ?? null,
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
        html: `<!DOCTYPE html><html><head><meta charset="utf-8"/><meta name="color-scheme" content="dark"/></head>
<body style="margin:0;padding:0;background-color:#0c0a09;">
  <table width="100%" cellpadding="0" cellspacing="0" bgcolor="#0c0a09" style="background-color:#0c0a09;padding:48px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" bgcolor="#111110" style="max-width:520px;background-color:#111110;border-radius:16px;border:1px solid #1c1917;overflow:hidden;">
          <tr>
            <td bgcolor="#111110" style="background-color:#111110;padding:28px 40px;border-bottom:1px solid #1c1917;">
              <img src="https://bodyrecode.au/logo-teal.png" width="130" alt="Body Recode" style="display:block;" />
            </td>
          </tr>
          <tr>
            <td bgcolor="#111110" style="background-color:#111110;padding:36px 40px 40px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:15px;line-height:1.75;color:#888888;">
              <p style="margin:0 0 18px;font-size:15px;color:#888888;line-height:1.75;">Hi ${firstName},</p>
              <p style="margin:0 0 18px;font-size:15px;color:#888888;line-height:1.75;">Your 12-week ${stateLabel} State Program is ready. Everything is in there: the full training protocol, nutrition targets, priority foods, and what to expect each phase.</p>
              <p style="margin:0 0 18px;font-size:15px;color:#888888;line-height:1.75;">Bookmark the page so you can come back to it any time.</p>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin:28px 0;">
                <tr><td><a href="${programUrl}" style="display:inline-block;padding:14px 28px;background:#10E1C2;color:#0c0a09;font-size:14px;font-weight:700;text-decoration:none;border-radius:8px;letter-spacing:0.03em;">View My Program</a></td></tr>
              </table>
              <p style="margin:0 0 18px;font-size:13px;color:#555555;line-height:1.75;">Or copy this link: ${programUrl}</p>
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
        html: `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:480px;margin:0 auto;padding:40px 24px;background:#0c0a09;color:#aaa;">
  <img src="https://bodyrecode.au/logo-teal.png" width="110" alt="Body Recode" style="display:block;margin-bottom:32px;" />
  <p style="font-size:20px;font-weight:700;color:#fff;margin:0 0 8px;">${name} purchased the ${stateLabel} State Program</p>
  <p style="font-size:15px;color:#aaa;margin:0 0 24px;">$97. Program delivered to ${email}. They are in the downsell funnel.</p>
  <a href="${appUrl()}/dashboard/leads/${lead_id}" style="display:inline-block;padding:12px 24px;background:#10E1C2;color:#000;font-size:14px;font-weight:700;text-decoration:none;border-radius:8px;">View Lead</a>
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
      await resend.emails.send({
        from: 'Kade at Body Recode <kade@bodyrecode.au>',
        to: email,
        subject: `Your Body Decode Report is ready`,
        html: `<!DOCTYPE html><html><head><meta charset="utf-8"/><meta name="color-scheme" content="dark"/></head>
<body style="margin:0;padding:0;background-color:#0c0a09;">
  <table width="100%" cellpadding="0" cellspacing="0" bgcolor="#0c0a09" style="background-color:#0c0a09;padding:48px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" bgcolor="#111110" style="max-width:520px;background-color:#111110;border-radius:16px;border:1px solid #1c1917;overflow:hidden;">
          <tr>
            <td bgcolor="#111110" style="background-color:#111110;padding:28px 40px;border-bottom:1px solid #1c1917;">
              <img src="https://bodyrecode.au/logo-teal.png" width="130" alt="Body Recode" style="display:block;" />
            </td>
          </tr>
          <tr>
            <td bgcolor="#111110" style="background-color:#111110;padding:36px 40px 40px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:15px;line-height:1.75;color:#888888;">
              <p style="margin:0 0 18px;font-size:15px;color:#888888;line-height:1.75;">Hi ${firstName},</p>
              <p style="margin:0 0 18px;font-size:15px;color:#888888;line-height:1.75;">Your Body Decode Report is ready. It breaks down what your scorecard results mean, what your body state tells us, what is working against you right now, and what to focus on first.</p>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin:28px 0;">
                <tr><td><a href="${reportUrl}" style="display:inline-block;padding:14px 28px;background:#10E1C2;color:#0c0a09;font-size:14px;font-weight:700;text-decoration:none;border-radius:8px;letter-spacing:0.03em;">View My Report</a></td></tr>
              </table>
              <p style="margin:0 0 18px;font-size:13px;color:#555555;line-height:1.75;">Or copy this link: ${reportUrl}</p>
              ${darkEmailSignature()}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body></html>`,
      })

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

      const patternLabel: Record<string, string> = {
        'stress-stored': 'Stress-Stored',
        'metabolic-drift': 'Insulin-Drift',
        'hormonal-shift': 'Estrogen-Shift',
        'system-overload': 'Androgen-Decline',
      }
      const patternDisplay = pattern ? patternLabel[pattern] ?? pattern : null

      await resend.emails.send({
        from: 'Kade at Body Recode <kade@bodyrecode.au>',
        to: email,
        subject: `Your 6-Week Body Rewire Blueprint is ready`,
        html: `<!DOCTYPE html><html><head><meta charset="utf-8"/><meta name="color-scheme" content="dark"/></head>
<body style="margin:0;padding:0;background-color:#0c0a09;">
  <table width="100%" cellpadding="0" cellspacing="0" bgcolor="#0c0a09" style="background-color:#0c0a09;padding:48px 20px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" bgcolor="#111110" style="max-width:520px;background-color:#111110;border-radius:16px;border:1px solid #1c1917;overflow:hidden;">
        <tr>
          <td bgcolor="#111110" style="background-color:#111110;padding:28px 40px;border-bottom:1px solid #1c1917;">
            <img src="https://bodyrecode.au/logo-teal.png" width="130" alt="Body Recode" style="display:block;" />
          </td>
        </tr>
        <tr>
          <td bgcolor="#111110" style="background-color:#111110;padding:36px 40px 40px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:15px;line-height:1.75;color:#888888;">
            <p style="margin:0 0 18px;font-size:15px;color:#888888;">Hi ${firstName},</p>
            <p style="margin:0 0 18px;font-size:15px;color:#888888;">Your 6-Week Body Rewire Blueprint is ready. ${patternDisplay ? `Your programme has been built around your <strong style="color:#fff;">${patternDisplay}</strong> pattern.` : `Your first step is a short pattern assessment so the programme can be built around your biology.`}</p>
            <p style="margin:0 0 18px;font-size:15px;color:#888888;">The programme runs across three phases:</p>
            <ul style="padding-left:20px;color:#888888;margin:0 0 24px;">
              <li style="margin-bottom:8px;"><strong style="color:#fff;">Phase 1 - Regulate</strong> (Weeks 1-2) - Re-establish structure and biological rhythm</li>
              <li style="margin-bottom:8px;"><strong style="color:#fff;">Phase 2 - Adapt</strong> (Weeks 3-4) - Drive adaptation through progressive load</li>
              <li style="margin-bottom:8px;"><strong style="color:#fff;">Phase 3 - Embed</strong> (Weeks 5-6) - Lock in the new baseline before Stage 3</li>
            </ul>
            <table width="100%" cellpadding="0" cellspacing="0" style="margin:28px 0;">
              <tr><td><a href="${portalUrl}" style="display:inline-block;padding:14px 28px;background:#14b8a6;color:#0c0a09;font-size:14px;font-weight:700;text-decoration:none;border-radius:8px;">Open my Blueprint</a></td></tr>
            </table>
            <p style="margin:0 0 18px;font-size:13px;color:#555;">Bookmark this link. It is your personal portal for the full 6 weeks.<br/><a href="${portalUrl}" style="color:#555;">${portalUrl}</a></p>
            ${darkEmailSignature()}
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body></html>`,
      })

      // Fire week-advance sequence
      await inngest.send({
        name: 'blueprint/enrolled',
        data: { token: enrollment.token, email, firstName },
      })

      // Coach notification
      await resend.emails.send({
        from: 'Body Recode <kade@bodyrecode.au>',
        to: 'kade@bodyrecode.au',
        subject: `Blueprint purchased - ${name}`,
        html: `<div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;padding:40px 24px;background:#0c0a09;color:#aaa;">
  <img src="https://bodyrecode.au/logo-teal.png" width="110" alt="Body Recode" style="display:block;margin-bottom:32px;" />
  <p style="font-size:20px;font-weight:700;color:#fff;margin:0 0 8px;">${name} purchased the Blueprint</p>
  <p style="font-size:15px;color:#aaa;margin:0 0 8px;">Email: ${email}</p>
  <p style="font-size:15px;color:#aaa;margin:0 0 24px;">Pattern: ${patternDisplay ?? 'Pending assessment'}</p>
</div>`,
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
      const portalUrl = blueprint_token
        ? `${appUrl()}/blueprint/${blueprint_token}`
        : `${appUrl()}/membership/${membership.token}`

      await resend.emails.send({
        from: 'Kade at Body Recode <kade@bodyrecode.au>',
        to: email,
        subject: `Welcome to the Body Recode Membership`,
        html: `<!DOCTYPE html><html><head><meta charset="utf-8"/><meta name="color-scheme" content="dark"/></head>
<body style="margin:0;padding:0;background-color:#0c0a09;">
  <table width="100%" cellpadding="0" cellspacing="0" bgcolor="#0c0a09" style="background-color:#0c0a09;padding:48px 20px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" bgcolor="#111110" style="max-width:520px;background-color:#111110;border-radius:16px;border:1px solid #1c1917;overflow:hidden;">
        <tr>
          <td bgcolor="#111110" style="background-color:#111110;padding:28px 40px;border-bottom:1px solid #1c1917;">
            <img src="https://bodyrecode.au/logo-teal.png" width="130" alt="Body Recode" style="display:block;" />
          </td>
        </tr>
        <tr>
          <td bgcolor="#111110" style="background-color:#111110;padding:36px 40px 40px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:15px;line-height:1.75;color:#888888;">
            <p style="margin:0 0 18px;font-size:15px;color:#888888;">Hi ${first_name},</p>
            <p style="margin:0 0 18px;font-size:15px;color:#888888;">You are in. Your Body Recode Membership is active and <strong style="color:#fff;">Block A is loaded into your portal</strong>.</p>
            <p style="margin:0 0 18px;font-size:15px;color:#888888;">Block A - Consolidate picks up directly from where the Blueprint ended. Your pattern rules carry forward. The training and nutrition have been built on top of the foundation you have already established.</p>
            <table width="100%" cellpadding="0" cellspacing="0" style="margin:28px 0;">
              <tr><td><a href="${portalUrl}" style="display:inline-block;padding:14px 28px;background:#14b8a6;color:#0c0a09;font-size:14px;font-weight:700;text-decoration:none;border-radius:8px;">Open my portal</a></td></tr>
            </table>
            <p style="margin:0 0 18px;font-size:13px;color:#555;">Your first monthly coach Loom will be sent at the end of Week 4. Monthly group Q&A call details to follow.</p>
            ${darkEmailSignature()}
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body></html>`,
      })

      await resend.emails.send({
        from: 'Body Recode <kade@bodyrecode.au>',
        to: 'kade@bodyrecode.au',
        subject: `Membership purchased - ${first_name}`,
        html: `<div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;padding:40px 24px;background:#0c0a09;color:#aaa;">
  <img src="https://bodyrecode.au/logo-teal.png" width="110" alt="Body Recode" style="display:block;margin-bottom:32px;" />
  <p style="font-size:20px;font-weight:700;color:#fff;margin:0 0 8px;">${first_name} joined the membership</p>
  <p style="font-size:15px;color:#aaa;margin:0 0 8px;">Email: ${email}</p>
  <p style="font-size:15px;color:#aaa;margin:0 0 8px;">Pattern: ${pattern_from_blueprint || 'Pending assessment'}</p>
  <p style="font-size:15px;color:#aaa;margin:0 0 24px;">Blueprint token: ${blueprint_token || 'None - direct join'}</p>
</div>`,
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

      await resend.emails.send({
        from: 'Kade at Body Recode <kade@bodyrecode.au>',
        to: email,
        subject: `Your 90-Day Body Rewire Extension is ready`,
        html: `<!DOCTYPE html><html><head><meta charset="utf-8"/></head>
<body style="margin:0;padding:0;background-color:#0c0a09;">
  <table width="100%" cellpadding="0" cellspacing="0" bgcolor="#0c0a09" style="background-color:#0c0a09;padding:48px 20px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" bgcolor="#111110" style="max-width:520px;background-color:#111110;border-radius:16px;border:1px solid #1c1917;overflow:hidden;">
        <tr><td bgcolor="#111110" style="background-color:#111110;padding:28px 40px;border-bottom:1px solid #1c1917;">
          <img src="https://bodyrecode.au/logo-teal.png" width="130" alt="Body Recode" style="display:block;" />
        </td></tr>
        <tr><td bgcolor="#111110" style="background-color:#111110;padding:36px 40px 40px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:15px;line-height:1.75;color:#888888;">
          <p style="margin:0 0 18px;font-size:15px;color:#888888;">Hi ${first_name},</p>
          <p style="margin:0 0 18px;font-size:15px;color:#888888;">Your 90-Day Body Rewire Extension is active. Your portal is ready - 12 weeks of progressive programming that picks up exactly where the Blueprint ended.</p>
          <p style="margin:0 0 18px;font-size:15px;color:#888888;">Weeks 1-6 run Block A (Consolidate). Weeks 7-12 run Block B (Advance). Same pattern, same portal structure you already know.</p>
          <table width="100%" cellpadding="0" cellspacing="0" style="margin:28px 0;">
            <tr><td><a href="${portalUrl}" style="display:inline-block;padding:14px 28px;background:#14b8a6;color:#0c0a09;font-size:14px;font-weight:700;text-decoration:none;border-radius:8px;">Open my Extension Portal</a></td></tr>
          </table>
          ${darkEmailSignature()}
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`,
      })

      await resend.emails.send({
        from: 'Body Recode <kade@bodyrecode.au>',
        to: 'kade@bodyrecode.au',
        subject: `Extension purchased - ${first_name}`,
        html: `<div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;padding:40px 24px;background:#0c0a09;color:#aaa;">
  <p style="font-size:20px;font-weight:700;color:#fff;margin:0 0 8px;">${first_name} purchased the 90-Day Extension</p>
  <p style="font-size:15px;color:#aaa;margin:0 0 8px;">Email: ${email}</p>
  <p style="font-size:15px;color:#aaa;margin:0;">Pattern: ${pattern_from_blueprint || 'Pending assessment'}</p>
</div>`,
      })

      await inngest.send({
        name: 'extension/enrolled',
        data: { token: enrollment.token, email, firstName: first_name },
      })
    }

    return NextResponse.json({ received: true })
  }

  if (session.metadata?.type !== 'commencement_fee') {
    return NextResponse.json({ received: true })
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
<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:480px;margin:0 auto;padding:40px 24px;background:#0c0a09;color:#aaa;">
  <img src="https://bodyrecode.au/logo-teal.png" width="110" alt="Body Recode" style="display:block;margin-bottom:32px;" />
  <p style="font-size:20px;font-weight:700;color:#fff;margin:0 0 8px;">${client.name} paid the commencement fee.</p>
  <p style="font-size:15px;color:#aaa;margin:0 0 24px;">$240 confirmed. The Payments tracker now shows commencement as paid on their profile.</p>
  <a href="${appUrl()}/dashboard/clients/${client.id}#payments" style="display:inline-block;padding:12px 24px;background:#10E1C2;color:#000;font-size:14px;font-weight:700;text-decoration:none;border-radius:8px;">View client</a>
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

  // Record commencement fee payment
  if (session.amount_total && session.amount_total > 0) {
    await admin.from('be_payments').insert({
      lead_id: leadId,
      client_id: client.id,
      amount: session.amount_total / 100,
      status: 'paid',
      stripe_payment_id: session.payment_intent as string ?? null,
      paid_at: new Date().toISOString(),
    })
  }

  // Populate client_payment_plan.commencement_fee_paid_at so the per-client
  // Payments tracker recognises this client as paid. Without this, the
  // section reads as "Not tracked for payments" even though the fee landed
  // — Luke's case. Idempotent: skips if already marked paid.
  try {
    await markCommencementPaid(
      admin,
      client.id,
      session.payment_intent as string ?? '',
      new Date(),
    )
  } catch (e) {
    console.error('commencement webhook: markCommencementPaid failed:', e)
  }

  // Notify coach
  if (process.env.RESEND_API_KEY) {
    const resend = new Resend(process.env.RESEND_API_KEY)
    await resend.emails.send({
      from: 'Body Recode <kade@bodyrecode.au>',
      to: 'kade@bodyrecode.au',
      subject: `Payment received — ${lead.name}`,
      html: `
<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:480px;margin:0 auto;padding:40px 24px;background:#0c0a09;color:#aaa;">
  <img src="https://bodyrecode.au/logo-teal.png" width="110" alt="Body Recode" style="display:block;margin-bottom:32px;" />
  <p style="font-size:20px;font-weight:700;color:#fff;margin:0 0 8px;">${lead.name} just paid.</p>
  <p style="font-size:15px;color:#aaa;margin:0 0 24px;">Commencement fee confirmed. Welcome email and intake link have been sent to ${lead.email}.</p>
  <a href="${appUrl()}/dashboard/leads/${lead.id}" style="display:inline-block;padding:12px 24px;background:#10E1C2;color:#000;font-size:14px;font-weight:700;text-decoration:none;border-radius:8px;">View lead</a>
</div>`,
    })
  }

  // Send portal access email
  if (lead.email && process.env.RESEND_API_KEY) {
    const resend = new Resend(process.env.RESEND_API_KEY)
    const firstName = lead.name.split(' ')[0]
    const portalUrl = `${appUrl()}/portal/${client.onboarding_token}`

    await resend.emails.send({
      from: 'Kade at Body Recode <kade@bodyrecode.au>',
      to: lead.email,
      subject: `Welcome to Body Recode, ${firstName}`,
      html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /></head>
<body style="margin:0;padding:0;background:#0c0a09;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:48px 32px;">
    <div style="margin-bottom:40px;">
      <img src="https://bodyrecode.au/logo-teal.png" width="130" alt="Body Recode" style="display:block;" />
    </div>
    <p style="font-size:15px;color:#aaa;line-height:1.9;margin:0 0 20px;">Hi ${firstName},</p>
    <p style="font-size:15px;color:#aaa;line-height:1.9;margin:0 0 20px;">Your commencement fee has been received. You're officially in.</p>
    <p style="font-size:15px;color:#aaa;line-height:1.9;margin:0 0 20px;">Your client portal is ready. Open the link below and sign in with this email address (${lead.email}). You'll get a 6-digit code by email - no password to set or remember.</p>
    <a href="${portalUrl}" style="display:inline-block;margin:0 0 28px;padding:14px 28px;background:#10E1C2;color:#000;font-size:14px;font-weight:700;text-decoration:none;border-radius:8px;letter-spacing:0.02em;">Open my portal</a>
    <p style="font-size:15px;color:#aaa;line-height:1.9;margin:0 0 20px;">Inside the portal you'll work through your onboarding in this order:</p>
    <ol style="font-size:15px;color:#aaa;line-height:1.9;margin:0 0 24px;padding-left:20px;">
      <li style="margin-bottom:6px;">Coaching Agreement</li>
      <li style="margin-bottom:6px;">Health Declaration</li>
      <li style="margin-bottom:6px;">Foundational Intake (208 questions across 8 areas - 15-20 min)</li>
      <li>Baseline Documentation (photos and measurements)</li>
    </ol>
    <p style="font-size:15px;color:#aaa;line-height:1.9;margin:0 0 20px;">Take your time with the intake - it's the foundation of everything I do with you. Answer based on your typical experience, not your best or worst days.</p>
    <p style="font-size:15px;color:#aaa;line-height:1.9;margin:0 0 20px;">While you're getting set up, read through your <a href="https://app.bodyrecode.au/coaching-guide" style="color:#10E1C2;font-weight:600;text-decoration:none;">Active Coaching Client Guide</a> (also linked inside your portal). It covers how the coaching process works, what to expect each week, and how we build progress together.</p>
    <p style="font-size:15px;color:#aaa;line-height:1.9;margin:0 0 20px;">Looking forward to getting started.</p>
    ${darkEmailSignature()}
    <p style="margin:20px 0 0;font-size:13px;color:#444;line-height:1.5;">Or copy this link: ${portalUrl}</p>
  </div>
</body>
</html>`,
    })
  }

  return NextResponse.json({ received: true })
}
