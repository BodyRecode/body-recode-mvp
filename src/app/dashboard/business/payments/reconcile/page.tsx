/**
 * Reconcile — fix the join between Stripe and our DB.
 *
 * Three concerns:
 *   1. Run Stripe backfill (page through customers, match by email, hydrate
 *      client_subscriptions).
 *   2. Show orphans on both sides:
 *      - Unmatched Stripe customers (paying us, no client row) — usually
 *        leads who paid for the scorecard report or Self-Guided Program and
 *        never converted to clients. Listed so we can decide whether to
 *        create a client record.
 *      - Clients with no stripe_customer_id (after backfill) — typically
 *        never paid, or email mismatch. Listed so we can manually link or
 *        check.
 *   3. Tag every be_products row with a category (performance_coaching /
 *      body_recode / studio_of_ten / overhead / other) so LTV filters and
 *      future business reports work correctly.
 */

import { createClient } from '@/lib/supabase/server'
import { AlertTriangle, ExternalLink, Tag } from 'lucide-react'
import Link from 'next/link'
import PaymentsNav from '../payments-nav'
import RunBackfillButton from '@/components/dashboard/run-backfill-button'
import RunCommencementBackfillButton from '@/components/dashboard/run-commencement-backfill-button'
import ProductCategoryEditor from '@/components/dashboard/product-category-editor'

export default async function ReconcilePage() {
  const supabase = await createClient()

  const [
    { data: clientsNoStripe },
    { data: products },
  ] = await Promise.all([
    supabase
      .from('clients')
      .select('id, name, email, active, created_at')
      .is('stripe_customer_id', null)
      .neq('active', false)
      .order('created_at', { ascending: false }),
    supabase
      .from('be_products')
      .select('id, name, price, type, billing_interval, category, is_active')
      .order('created_at', { ascending: true }),
  ])

  const untaggedProducts = (products ?? []).filter(p => !p.category)

  return (
    <div className="max-w-4xl">
      <div className="br-page-header sticky top-0 z-20 mb-7 pt-4 pb-3.5 border-b border-[#E8EAEE] bg-white/[0.88] backdrop-blur-md print:static print:bg-transparent">
        <h1 className="text-[22px] font-semibold tracking-[-0.025em] mb-1">Payments</h1>
        <p className="text-[#666D7A] text-sm">Products, invoices, and payment history</p>
      </div>

      <PaymentsNav />

      <div className="mb-6">
        <h2 className="text-lg font-semibold text-[#141821] mb-1">Reconcile</h2>
        <p className="text-[#666D7A] text-sm">Match Stripe customers to client records and tag products by business stream.</p>
      </div>

      {/* Backfill */}
      <section className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          <h3 className="text-[12.5px] font-semibold text-[#666D7A]">Stripe Backfill</h3>
        </div>
        <div className="bg-[#F4F6F9] br-card p-5">
          <p className="text-sm text-[#141821] mb-1">Pull every Stripe customer and subscription into the cache.</p>
          <p className="text-[12.5px] text-[#666D7A] mb-4">Safe to re-run. Matches Stripe customers to clients by email, populates <code className="text-[#666D7A]">stripe_customer_id</code>, and refreshes <code className="text-[#666D7A]">client_subscriptions</code> from live Stripe state. Run this once after the Phase 1 schema migration, then anytime you suspect drift.</p>
          <RunBackfillButton />
        </div>
      </section>

      {/* Commencement backfill */}
      <section className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          <h3 className="text-[12.5px] font-semibold text-[#666D7A]">Commencement Fee Backfill</h3>
        </div>
        <div className="bg-[#F4F6F9] br-card p-5">
          <p className="text-sm text-[#141821] mb-1">Patch historical clients whose $240 commencement payment landed before the tracker was wired.</p>
          <p className="text-[12.5px] text-[#666D7A] mb-4">Until recently, the lead-stage commencement webhook recorded payments in <code className="text-[#666D7A]">be_payments</code> only — it never wrote to <code className="text-[#666D7A]">client_payment_plan</code>. That left clients like Luke showing &quot;Not tracked for payments&quot; even though the fee landed. This walks every paid $240 no-subscription payment and marks the matching plan row as paid. Idempotent.</p>
          <RunCommencementBackfillButton />
        </div>
      </section>

      {/* Clients with no Stripe link */}
      <section className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          <h3 className="text-[12.5px] font-semibold text-[#666D7A]">Clients with no Stripe link</h3>
          <span className="text-[12.5px] text-[#98A0AD]">{clientsNoStripe?.length ?? 0}</span>
        </div>
        {clientsNoStripe && clientsNoStripe.length > 0 ? (
          <div className="bg-[#F4F6F9] br-card overflow-hidden">
            {clientsNoStripe.map(c => (
              <Link
                key={c.id}
                href={`/dashboard/clients/${c.id}#payments`}
                className="flex items-center justify-between px-4 py-3 border-b border-[#E8EAEE] last:border-b-0 hover:bg-[#EFF1F4]/40 transition-colors"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[#141821] truncate">{c.name ?? c.email ?? 'Unnamed'}</p>
                  <p className="text-[12.5px] text-[#666D7A] truncate">{c.email ?? 'No email'}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] text-[#A96A12] font-semibold">No link</span>
                  <ExternalLink size={12} className="text-[#98A0AD]" />
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="bg-[#F4F6F9] border border-dashed border-[#E8EAEE] rounded-xl p-6 text-center">
            <p className="text-[#666D7A] text-sm">All active clients are linked to a Stripe customer.</p>
          </div>
        )}
        <p className="text-[12.5px] text-[#98A0AD] mt-2">
          These are active clients with no <code>stripe_customer_id</code>. Run backfill first; if a client still shows up here it usually means the email on their client record doesn&apos;t match the email on their Stripe customer. Open the client and use &quot;Refresh from Stripe&quot; — if it still fails, the emails differ and you&apos;ll need to fix the client&apos;s email or link the Stripe ID manually (manual linking UI not yet built; ask the assistant if you need it).
        </p>
      </section>

      {/* Product categories */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h3 className="text-[12.5px] font-semibold text-[#666D7A]">Product Categories</h3>
            <span className="text-[12.5px] text-[#98A0AD]">{products?.length ?? 0}</span>
          </div>
          {untaggedProducts.length > 0 && (
            <div className="flex items-center gap-1.5 text-[12.5px] text-[#A96A12]">
              <AlertTriangle size={12} />
              {untaggedProducts.length} untagged
            </div>
          )}
        </div>
        <p className="text-[12.5px] text-[#98A0AD] mb-3">
          Tag every product by which business stream it belongs to. <strong className="text-[#666D7A]">Performance Coaching</strong> products count toward client LTV; the others don&apos;t. Until products are tagged, untagged paid payments are treated as Performance Coaching by default.
        </p>
        {products && products.length > 0 ? (
          <div className="bg-[#F4F6F9] br-card overflow-hidden">
            {products.map(p => (
              <div
                key={p.id}
                className="flex items-center justify-between px-4 py-3 border-b border-[#E8EAEE] last:border-b-0"
              >
                <div className="min-w-0 flex items-center gap-3">
                  <Tag size={13} className="text-[#98A0AD] shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[#141821] truncate">{p.name}</p>
                    <p className="text-[12.5px] text-[#666D7A]">
                      ${p.price?.toLocaleString('en-AU')}
                      {p.type === 'subscription' && p.billing_interval && (
                        <span className="text-[#98A0AD]"> / {p.billing_interval.replace('ly', '')}</span>
                      )}
                      {!p.is_active && <span className="text-[#141821] ml-2">(inactive)</span>}
                    </p>
                  </div>
                </div>
                <ProductCategoryEditor
                  productId={p.id}
                  initialCategory={(p.category ?? '') as ''}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-[#F4F6F9] border border-dashed border-[#E8EAEE] rounded-xl p-6 text-center">
            <p className="text-[#666D7A] text-sm">No products yet.</p>
          </div>
        )}
      </section>
    </div>
  )
}
