import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Megaphone, Plus, Mail, MessageSquare, Send, Clock, FileText, CheckCircle2, XCircle } from 'lucide-react'

const typeIcon = { email: Mail, sms: MessageSquare, social: Megaphone }

const statusConfig: Record<string, { label: string; colour: string; icon: typeof Clock }> = {
  draft: { label: 'Draft', colour: 'text-[#666D7A]', icon: FileText },
  scheduled: { label: 'Scheduled', colour: 'text-amber-700', icon: Clock },
  active: { label: 'Sending', colour: 'text-blue-500', icon: Send },
  completed: { label: 'Sent', colour: 'text-blue-500', icon: CheckCircle2 },
  cancelled: { label: 'Cancelled', colour: 'text-[#666D7A]', icon: XCircle },
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
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-[22px] font-semibold tracking-[-0.025em] mb-1">Campaigns</h1>
          <p className="text-[#666D7A] text-sm">{drafts} draft · {sent} sent</p>
        </div>
        <Link
          href="/dashboard/business/campaigns/new"
          className="flex items-center gap-2 bg-blue-500 hover:bg-blue-500 text-stone-50 text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
        >
          <Plus size={14} strokeWidth={2.5} />
          New Campaign
        </Link>
      </div>

      {campaigns && campaigns.length > 0 ? (
        <div className="space-y-2">
          {campaigns.map(campaign => {
            const Icon = typeIcon[campaign.type as keyof typeof typeIcon] ?? Mail
            const cfg = statusConfig[campaign.status] ?? statusConfig.draft
            const StatusIcon = cfg.icon
            return (
              <Link
                key={campaign.id}
                href={`/dashboard/business/campaigns/${campaign.id}`}
                className="flex items-center gap-4 bg-[#F4F6F9] border border-[#E8EAEE] rounded-xl p-4 hover:border-[#E8EAEE] transition-colors group"
              >
                <div className="p-2 bg-[#EFF1F4] rounded-lg shrink-0">
                  <Icon size={14} className="text-[#666D7A]" />
                </div>

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
                  <div className={`flex items-center gap-1 text-xs font-medium ${cfg.colour}`}>
                    <StatusIcon size={11} />
                    {cfg.label}
                  </div>
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
        </div>
      ) : (
        <div className="bg-[#F4F6F9] border border-dashed border-[#E8EAEE] rounded-xl p-12 text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-[#EFF1F4] rounded-xl">
              <Megaphone size={24} className="text-[#666D7A]" strokeWidth={1.5} />
            </div>
          </div>
          <p className="text-[#666D7A] text-sm font-medium mb-1">No campaigns yet</p>
          <p className="text-[#98A0AD] text-[12.5px] mb-6">Send email or SMS broadcasts to your leads and clients</p>
          <Link
            href="/dashboard/business/campaigns/new"
            className="inline-flex items-center gap-2 bg-blue-500 hover:bg-blue-500 text-stone-50 text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
          >
            <Plus size={14} strokeWidth={2.5} />
            Create your first campaign
          </Link>
        </div>
      )}
    </div>
  )
}
