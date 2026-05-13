'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

/**
 * Sub-nav strip rendered at the top of every page under /dashboard/business/payments/.
 * Three tabs:
 *   - Overview (the existing page: products + payment history)
 *   - Clients  (cross-cut: every client + payment plan + subscription status)
 *   - Reconcile (orphans on either side + product category tagging)
 */
export default function PaymentsNav() {
  const pathname = usePathname()

  const tabs = [
    { href: '/dashboard/business/payments', label: 'Overview', exact: true },
    { href: '/dashboard/business/payments/clients', label: 'Clients', exact: false },
    { href: '/dashboard/business/payments/reconcile', label: 'Reconcile', exact: false },
  ]

  return (
    <div className="flex items-center gap-1 mb-6 border-b border-stone-800">
      {tabs.map(t => {
        const active = t.exact ? pathname === t.href : pathname?.startsWith(t.href)
        return (
          <Link
            key={t.href}
            href={t.href}
            className={`px-3 py-2 text-xs font-medium transition-colors border-b-2 -mb-px ${
              active
                ? 'text-teal-400 border-teal-400'
                : 'text-stone-500 hover:text-stone-300 border-transparent'
            }`}
          >
            {t.label}
          </Link>
        )
      })}
    </div>
  )
}
