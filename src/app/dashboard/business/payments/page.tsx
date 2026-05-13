import { createClient } from '@/lib/supabase/server'
import { CreditCard, Package, CheckCircle2, Clock, XCircle } from 'lucide-react'
import CreateProductButton from './create-product-button'
import RecordPaymentButton from './record-payment-button'
import GetPaymentLinkButton from './get-payment-link-button'
import PaymentsNav from './payments-nav'
import Link from 'next/link'

const statusConfig: Record<string, { label: string; icon: typeof Clock; colour: string }> = {
  paid: { label: 'Paid', icon: CheckCircle2, colour: 'text-teal-400' },
  pending: { label: 'Pending', icon: Clock, colour: 'text-amber-400' },
  failed: { label: 'Failed', icon: XCircle, colour: 'text-red-400' },
  refunded: { label: 'Refunded', icon: XCircle, colour: 'text-stone-500' },
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
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold mb-1">Payments</h1>
          <p className="text-stone-400 text-sm">Products, invoices, and payment history</p>
        </div>
        <div className="flex items-center gap-2">
          <RecordPaymentButton products={products || []} />
          <CreateProductButton />
        </div>
      </div>

      <PaymentsNav />

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-8">
        <div className="bg-stone-900 border border-stone-800 rounded-xl p-5">
          <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-2">Total Revenue</p>
          <p className="text-3xl font-bold text-white">${totalRevenue.toLocaleString('en-AU')}</p>
        </div>
        <div className="bg-stone-900 border border-stone-800 rounded-xl p-5">
          <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-2">Pending</p>
          <p className="text-3xl font-bold text-amber-400">${pendingRevenue.toLocaleString('en-AU')}</p>
        </div>
      </div>

      {/* Products */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Products</h2>
        </div>
        {products && products.length > 0 ? (
          <div className="space-y-2">
            {products.map((product) => (
              <div
                key={product.id}
                className="bg-stone-900 border border-stone-800 rounded-xl p-4 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-stone-800 rounded-lg">
                    <Package size={14} className="text-stone-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{product.name}</p>
                    <p className="text-xs text-stone-500">
                      {product.type === 'subscription'
                        ? `${product.billing_interval} subscription`
                        : 'One-time payment'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-sm font-semibold text-white">${product.price.toLocaleString('en-AU')}</p>
                    {product.type === 'subscription' && (
                      <p className="text-xs text-stone-500">/ {product.billing_interval?.replace('ly', '')}</p>
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
        ) : (
          <div className="bg-stone-900 border border-dashed border-stone-800 rounded-xl p-8 text-center">
            <Package size={20} className="text-stone-600 mx-auto mb-2" />
            <p className="text-stone-500 text-sm">No products yet</p>
            <p className="text-stone-600 text-xs mt-1">Add your coaching products above</p>
          </div>
        )}
      </div>

      {/* Payment history */}
      <div>
        <h2 className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-3">Payment History</h2>
        {payments && payments.length > 0 ? (
          <div className="space-y-2">
            {payments.map((payment) => {
              const contact = payment.leads || payment.clients
              const contactHref = payment.lead_id
                ? `/dashboard/business/crm/${payment.lead_id}`
                : payment.client_id
                ? `/dashboard/clients/${payment.client_id}`
                : null
              const cfg = statusConfig[payment.status] ?? statusConfig.pending
              const Icon = cfg.icon
              const contactName = Array.isArray(contact)
                ? contact[0]?.name
                : (contact as { name: string } | null)?.name ?? 'Unknown'
              const productName = Array.isArray(payment.be_products)
                ? payment.be_products[0]?.name
                : (payment.be_products as { name: string } | null)?.name ?? 'Manual'

              return (
                <div
                  key={payment.id}
                  className="bg-stone-900 border border-stone-800 rounded-xl p-4 flex items-center gap-4"
                >
                  <div className="flex-1 min-w-0">
                    {contactHref ? (
                      <Link
                        href={contactHref}
                        className="text-sm font-medium text-white hover:text-teal-400 transition-colors truncate block"
                      >
                        {contactName}
                      </Link>
                    ) : (
                      <p className="text-sm font-medium text-white truncate">{contactName}</p>
                    )}
                    <p className="text-xs text-stone-500 mt-0.5">{productName}</p>
                  </div>

                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold text-white">
                      ${payment.amount.toLocaleString('en-AU')}
                    </p>
                    <p className="text-xs text-stone-600">
                      {new Date(payment.created_at).toLocaleDateString('en-AU', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </p>
                  </div>

                  <div className={`flex items-center gap-1.5 text-xs shrink-0 ${cfg.colour}`}>
                    <Icon size={13} />
                    {cfg.label}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="bg-stone-900 border border-dashed border-stone-800 rounded-xl p-8 text-center">
            <CreditCard size={20} className="text-stone-600 mx-auto mb-2" />
            <p className="text-stone-500 text-sm">No payments recorded yet</p>
          </div>
        )}
      </div>
    </div>
  )
}
