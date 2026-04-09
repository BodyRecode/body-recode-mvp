import Link from 'next/link'
import { FileText, Mail, BookOpen, ExternalLink } from 'lucide-react'

type Asset = {
  label: string
  description: string
  href: string
  external?: boolean
  tag?: string
  tagColour?: string
}

type AssetGroup = {
  title: string
  icon: React.ReactNode
  assets: Asset[]
}

const ASSET_GROUPS: AssetGroup[] = [
  {
    title: 'Self-Guided Programs',
    icon: <BookOpen size={14} className="text-teal-400" />,
    assets: [
      {
        label: 'Depleted State Program',
        description: '12-week self-guided training and nutrition program for Depleted State',
        href: '/dashboard/preview/program/depleted',
        tag: 'Depleted',
        tagColour: 'text-red-400 bg-red-500/10 border-red-500/20',
      },
      {
        label: 'Transitioning State Program',
        description: '12-week self-guided training and nutrition program for Transitioning State',
        href: '/dashboard/preview/program/transitioning',
        tag: 'Transitioning',
        tagColour: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
      },
      {
        label: 'Ready State Program',
        description: '12-week self-guided training and nutrition program for Ready State',
        href: '/dashboard/preview/program/ready',
        tag: 'Ready',
        tagColour: 'text-teal-400 bg-teal-500/10 border-teal-500/20',
      },
    ],
  },
  {
    title: 'Downsell Emails',
    icon: <Mail size={14} className="text-teal-400" />,
    assets: [
      {
        label: 'Depleted — Offer + Delivery Emails',
        description: 'Offer email sent on Zoom 1 decline, and delivery email sent after purchase',
        href: '/dashboard/preview/downsell-email/depleted',
        tag: 'Depleted',
        tagColour: 'text-red-400 bg-red-500/10 border-red-500/20',
      },
      {
        label: 'Transitioning — Offer + Delivery Emails',
        description: 'Offer email sent on Zoom 1 decline, and delivery email sent after purchase',
        href: '/dashboard/preview/downsell-email/transitioning',
        tag: 'Transitioning',
        tagColour: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
      },
      {
        label: 'Ready — Offer + Delivery Emails',
        description: 'Offer email sent on Zoom 1 decline, and delivery email sent after purchase',
        href: '/dashboard/preview/downsell-email/ready',
        tag: 'Ready',
        tagColour: 'text-teal-400 bg-teal-500/10 border-teal-500/20',
      },
    ],
  },
  {
    title: 'Client-Facing Pages',
    icon: <FileText size={14} className="text-teal-400" />,
    assets: [
      {
        label: 'Scorecard',
        description: 'Body State Scorecard at bodyrecode.au/scorecard',
        href: '/scorecard',
        external: true,
      },
      {
        label: 'Scorecard Results (example)',
        description: 'What the lead sees after completing the scorecard',
        href: '/scorecard-preview',
        external: true,
      },
      {
        label: 'Book a Call',
        description: 'Public booking page at bodyrecode.au/book',
        href: '/book',
        external: true,
      },
      {
        label: 'Orientation Guide',
        description: 'Page sent to leads after Zoom 1',
        href: '/orientation',
        external: true,
      },
      {
        label: 'Coaching Guide',
        description: 'Active client coaching guide at app.bodyrecode.au/coaching-guide',
        href: '/coaching-guide',
        external: true,
      },
    ],
  },
]

export default function PreviewIndexPage() {
  return (
    <div style={{ maxWidth: '720px' }}>
      <div style={{ marginBottom: '32px' }}>
        <div style={{ width: '28px', height: '3px', background: '#14b8a6', borderRadius: '2px', marginBottom: '16px' }} />
        <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em', marginBottom: '6px' }}>Assets</h1>
        <p style={{ fontSize: '14px', color: '#78716c', lineHeight: 1.6 }}>All client-facing assets, programs, and emails. View exactly what clients and leads receive.</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
        {ASSET_GROUPS.map((group) => (
          <div key={group.title}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              {group.icon}
              <p style={{ fontSize: '11px', fontWeight: 700, color: '#57534e', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{group.title}</p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {group.assets.map((asset) => (
                <Link
                  key={asset.href}
                  href={asset.href}
                  target={asset.external ? '_blank' : undefined}
                  rel={asset.external ? 'noopener noreferrer' : undefined}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '16px',
                    background: '#111110',
                    border: '1px solid #1c1917',
                    borderRadius: '12px',
                    padding: '16px 20px',
                    textDecoration: 'none',
                    transition: 'border-color 0.15s',
                  }}
                  className="hover:border-stone-600"
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '3px' }}>
                      <span style={{ fontSize: '14px', fontWeight: 600, color: '#ffffff' }}>{asset.label}</span>
                      {asset.tag && (
                        <span style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.06em', padding: '2px 8px', borderRadius: '999px', border: '1px solid' }}
                          className={asset.tagColour}>
                          {asset.tag}
                        </span>
                      )}
                    </div>
                    <p style={{ fontSize: '13px', color: '#78716c', lineHeight: 1.5 }}>{asset.description}</p>
                  </div>
                  <ExternalLink size={14} color="#57534e" style={{ flexShrink: 0 }} />
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
