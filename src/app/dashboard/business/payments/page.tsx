import { createClient } from '@/lib/supabase/server'
import { CreditCard, Package, CheckCircle2, Clock, XCircle } from 'lucide-react'
import CreateProductButton from './create-product-button'
import RecordPaymentButton from './record-payment-button'
import GetPaymentLinkButton from './get-payment-link-button'
import PaymentsNav from './payments-nav'
import Link from 'next/link'
import { PageHeader, Card, StatCard, SectionLabel, EmptyState, Avatar, Pill } from '@/components/dashboard/ui'

type Accent = 'teal' | 'amber' | 'red' | 'neutral'

const statusConfig: Record<string, { label: string; icon: typeof Clock; accent: Accent }> = {
  paid: { label: 'Paid', icon: CheckCircle2, accent: 'teal' },
  pending: { label: 'Pending', icon: Clock, accent: 'amber' },
  failed: { label: 'Failed', icon: XCircle, accent: 'red' },
  refunded: { label: 'Refunded', icon: XCircle, accent: 'neutral' },
}

export default async function PaymentsPage() {
  const supabase = await createClient()

  const [{ data: products }, { data: payments }] = await Promise.all([
    supabase
      .from('be_products')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: true }),
    supabase
      .from('be_payments')
      .select('*, be_products(name), leads(id, name), clients(id, name)')
      .order('created_at', { ascending: false })
      .limit(30),
  ])

  const totalRevenue = payments
    ?.filter(p => p.status === 'paid')
    .reduce((sum, p) => sum + (p.amount || 0), 0) || 0

  const pendingRevenue = payments
    ?.filter(p => p.status === 'pending')
    .reduce((sum, p) => sum + (p.amount || 0), 0) || 0

  return (
    <div className="max-w-3xl">
      <PageHeader
        title="Payments"
        subtitle="Products, invoices, and payment history"
        cta={<>
          <RecordPaymentButton products={products || []} />
          <CreateProductButton />
        </>}
      />

      <PaymentsNav />

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-8">
        <StatCard
          label="Collected"
          value={`$${totalRevenue.toLocaleString('en-AU')}`}
          sub="Every payment marked paid"
          accent="teal"
          icon={CheckCircle2}
        />
        <StatCard
          label="Pending"
          value={`$${pendingRevenue.toLocaleString('en-AU')}`}
          sub="Recorded, not yet cleared"
          accent={pendingRevenue > 0 ? 'amber' : 'neutral'}
          icon={Clock}
        />
      </div>

      {/* Products */}
      <div className="mb-8">
        <SectionLabel meta={products?.length ? `${products.length}` : undefined}>Products</SectionLabel>
        {products && products.length > 0 ? (
          <Card padding="none">
            <div className="divide-y divide-[#EFF1F4]">
            {products.map((product) => (
              <div
                key={product.id}
                className="p-4 flex items-center justify-between gap-4 hover:bg-[#F7F9FC] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[#EFF1F4] rounded-lg">
                    <Package size={14} className="text-[#666D7A]" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#141821]">{product.name}</p>
                    <p className="text-[12.5px] text-[#666D7A]">
                      {product.type === 'subscription'
                        ? `${product.billing_interval} subscription`
                        : 'One-time payment'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-sm font-semibold text-[#141821]">${product.price.toLocaleString('en-AU')}</p>
                    {product.type === 'subscription' && (
                      <p className="text-[12.5px] text-[#666D7A]">/ {product.billing_interval?.replace('ly', '')}</p>
                    )}
                  </div>
                  <GetPaymentLinkButton
                    productId={product.id}
                    cachedUrl={product.stripe_payment_link_url ?? null}
                  />
                </div>
              </div>
            ))}
            </div>
          </Card>
        ) : (
          <Card padding="none">
            <EmptyState icon={Package} title="No products yet" hint="Add your coaching products above" />
          </Card>
        )}
      </div>

      {/* Payment history */}
      <div>
        <SectionLabel>Payment history</SectionLabel>
        {payments && payments.length > 0 ? (
          <Card padding="none"><div className="divide-y divide-[#EFF1F4]">
            {payments.map((payment) => {
              const contact = payment.leads || payment.clients
              const contactHref = payment.lead_id
                ? `/dashboard/business/crm/${payment.lead_id}`
                : payment.client_id
                ? `/dashboard/clients/${payment.client_id}`
                : null
              const cfg = statusConfig[payment.status] ?? statusConfig.pending
              const contactName = Array.isArray(contact)
                ? contact[0]?.name
                : (contact as { name: string } | null)?.name ?? 'Unknown'
              const productName = Array.isArray(payment.be_products)
                ? payment.be_products[0]?.name
                : (payment.be_products as { name: string } | null)?.name ?? 'Manual'

              return (
                <div
                  key={payment.id}
                  className="p-4 flex items-center gap-3.5 hover:bg-[#F7F9FC] transition-colors"
                >
                  <Avatar name={contactName} size={31} />
                  <div className="flex-1 min-w-0">
                    {contactHref ? (
                      <Link
                        href={contactHref}
                        className="text-sm font-medium text-[#141821] hover:text-[#1B6DFC] transition-colors truncate block"
                      >
                        {contactName}
                      </Link>
                    ) : (
                      <p className="text-sm font-medium text-[#141821] truncate">{contactName}</p>
                    )}
                    <p className="text-[12.5px] text-[#666D7A] mt-0.5">{productName}</p>
                  </div>

                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold text-[#141821]">
                      ${payment.amount.toLocaleString('en-AU')}
                    </p>
                    <p className="text-[12.5px] text-[#98A0AD]">
                      {new Date(payment.created_at).toLocaleDateString('en-AU', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </p>
                  </div>

                  <span className="shrink-0">
                    <Pill accent={cfg.accent}>{cfg.label}</Pill>
                  </span>
                </div>
              )
            })}
          </div></Card>
        ) : (
          <Card padding="none">
            <EmptyState icon={CreditCard} title="No payments recorded yet" hint="Recorded and Stripe payments both land here" />
          </Card>
        )}
      </div>
    </div>
  )
}
