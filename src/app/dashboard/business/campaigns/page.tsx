import { createClient } from '@/lib/supabase/server'
import { PageHeader, Card, Btn, Pill, EmptyState } from '@/components/dashboard/ui'
import Link from 'next/link'
import { Megaphone, Plus, Mail, MessageSquare, Send, Clock, FileText, CheckCircle2, XCircle } from 'lucide-react'

const typeIcon = { email: Mail, sms: MessageSquare, social: Megaphone }

type Accent = 'teal' | 'amber' | 'neutral'

const statusConfig: Record<string, { label: string; accent: Accent; icon: typeof Clock }> = {
  draft: { label: 'Draft', accent: 'neutral', icon: FileText },
  scheduled: { label: 'Scheduled', accent: 'amber', icon: Clock },
  active: { label: 'Sending', accent: 'teal', icon: Send },
  completed: { label: 'Sent', accent: 'teal', icon: CheckCircle2 },
  cancelled: { label: 'Cancelled', accent: 'neutral', icon: XCircle },
}

export default async function CampaignsPage() {
  const supabase = await createClient()

  const { data: campaigns } = await supabase
    .from('be_campaigns')
    .select('*')
    .order('created_at', { ascending: false })

  const drafts = campaigns?.filter(c => c.status === 'draft').length || 0
  const sent = campaigns?.filter(c => c.status === 'completed').length || 0

  return (
    <div className="max-w-3xl">
      <PageHeader
        title="Campaigns"
        subtitle={`${drafts} draft · ${sent} sent`}
        cta={
          <Btn href="/dashboard/business/campaigns/new" variant="primary" icon={Plus}>
            New campaign
          </Btn>
        }
      />

      {campaigns && campaigns.length > 0 ? (
        <Card padding="none"><div className="divide-y divide-[#EFF1F4]">
          {campaigns.map(campaign => {
            const Icon = typeIcon[campaign.type as keyof typeof typeIcon] ?? Mail
            const cfg = statusConfig[campaign.status] ?? statusConfig.draft
            return (
              <Link
                key={campaign.id}
                href={`/dashboard/business/campaigns/${campaign.id}`}
                className="flex items-center gap-3.5 p-4 hover:bg-[#F7F9FC] transition-colors group"
              >
                <span
                  className="w-[30px] h-[30px] rounded-lg shrink-0 flex items-center justify-center text-[#1B6DFC]"
                  style={{ background: 'rgba(27,109,252,0.08)', boxShadow: 'inset 0 0 0 1px #B5CFFC' }}
                >
                  <Icon size={14} />
                </span>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#141821] group-hover:text-blue-500 transition-colors truncate">
                    {campaign.name}
                  </p>
                  <p className="text-[12.5px] text-[#666D7A] mt-0.5">
                    {campaign.type.toUpperCase()}
                    {campaign.subject ? ` · ${campaign.subject}` : ''}
                    {campaign.recipient_count > 0 ? ` · ${campaign.recipient_count} recipients` : ''}
                  </p>
                </div>

                <div className="shrink-0 text-right">
                  <Pill accent={cfg.accent}>{cfg.label}</Pill>
                  {campaign.scheduled_at && campaign.status === 'scheduled' && (
                    <p className="text-[12.5px] text-[#98A0AD] mt-0.5">
                      {new Date(campaign.scheduled_at).toLocaleDateString('en-AU', {
                        day: 'numeric', month: 'short',
                        hour: 'numeric', minute: '2-digit', hour12: true,
                      })}
                    </p>
                  )}
                  {campaign.sent_at && (
                    <p className="text-[12.5px] text-[#98A0AD] mt-0.5">
                      {new Date(campaign.sent_at).toLocaleDateString('en-AU', {
                        day: 'numeric', month: 'short',
                      })}
                    </p>
                  )}
                </div>
              </Link>
            )
          })}
        </div></Card>
      ) : (
        <Card padding="none">
          <div className="pb-8">
            <EmptyState
              icon={Megaphone}
              title="No campaigns yet"
              hint="Send email or SMS broadcasts to your leads and clients"
            />
            <div className="flex justify-center">
              <Btn href="/dashboard/business/campaigns/new" variant="primary" icon={Plus}>
                Create your first campaign
              </Btn>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
