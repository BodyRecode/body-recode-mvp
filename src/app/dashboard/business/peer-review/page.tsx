'use client'

import { useState, useEffect } from 'react'
import { ExternalLink, Plus, Trash2, ChevronDown, ChevronUp, Copy, Check } from 'lucide-react'
import { brand } from "@/config/tenant";

type ReviewerStatus = 'Not contacted' | 'Contacted' | 'Accessed site' | 'Responded' | 'Call booked' | 'Complete'

type Reviewer = {
  id: string
  name: string
  field: string
  organisation: string
  contactDate: string
  status: ReviewerStatus
  feedback: string
  notes: string
  socialDm: string
}

const STATUS_COLOURS: Record<ReviewerStatus, string> = {
  'Not contacted': 'bg-stone-200 text-stone-600',
  'Contacted':     'bg-blue-500/15 text-blue-700',
  'Accessed site': 'bg-yellow-500/15 text-yellow-400',
  'Responded':     'bg-blue-500/15 text-blue-500',
  'Call booked':   'bg-purple-500/15 text-purple-400',
  'Complete':      'bg-green-500/15 text-green-400',
}

const STATUSES: ReviewerStatus[] = ['Not contacted', 'Contacted', 'Accessed site', 'Responded', 'Call booked', 'Complete']

const ASSETS = [
  { label: 'Review Site', url: 'https://review.bodyrecode.au', description: 'Landing page for reviewers' },
  { label: 'System Overview', url: 'https://review.bodyrecode.au/doctrine/overview', description: 'Peer review document. 6,400 words, 13 sections' },
  { label: 'Full Doctrine', url: 'https://review.bodyrecode.au/doctrine/full', description: '433 source files, 6 system layers' },
]

const OUTREACH_TEMPLATE = `Hi [NAME],

I wanted to reach out directly because I think what I'm building is relevant to your work, and I'd genuinely value your perspective on it.

I've spent the last few years developing a biological interpretation system called Body Recode™. The core premise is that most coaching and clinical interventions fail not because they're wrong in absolute terms, but because they're applied without first reading the hormonal and regulatory state the body is actually in. The system sits upstream of intervention. It reads the body before anything is prescribed.

I'm now at the stage where I want external professional eyes on it. I'm building a small founding advisor group whose feedback will directly shape how the system develops.

What I'm offering:
- A formal founding advisor credit on the platform at launch
- Permanent early access to the platform when it opens
- A 30-minute call with me to discuss your feedback
- First access to the clinical integration module and direct input into how it interfaces with your workflow

What I'm asking:
- Read the System Overview document (approx 30 minutes)
- Share your honest professional assessment
- Respond within four weeks if you're able

The document is available here: https://review.bodyrecode.au

[YOUR NAME]
Body Recode™`

const FOLLOWUP_TEMPLATE = `Hi [NAME],

Just following up on the message I sent a couple of weeks ago about the Body Recode™ peer review.

If you've had a chance to look at the document and have any initial thoughts, I'd love to hear them. If the timing hasn't worked out, no pressure at all.

The link is still live at https://review.bodyrecode.au if you'd like to take a look.

[YOUR NAME]`

const CALL_AGENDA = `CALL AGENDA - 30 minutes

Use this as a loose guide, not a script.

1. Thank them for their time and their feedback (5 min)
2. Ask what landed well and what raised questions (10 min)
3. Dig into their specific area: how they see it interfacing with their practice (10 min)
4. Explain where the system is headed and what their advisor role looks like in practice (5 min)

---

Key things to listen for:

- Scientific objections to the Fat Map Method zones
- Scope of practice concerns (are they worried it overlaps with clinical diagnosis?)
- Genuine interest in using or integrating it
- Names of other people they think should see it`

const DEFAULT_REVIEWERS: Reviewer[] = [
  {
    id: 'jim',
    name: 'Jim',
    field: 'Pro Bodybuilder / Health Science',
    organisation: '',
    contactDate: '',
    status: 'Not contacted',
    feedback: '',
    notes: '',
    socialDm: `Hey Jim, been meaning to reach out for a while.\n\nI've spent the last few years building a biological interpretation system called Body Recode - it reads the body's hormonal and regulatory state before any training or nutrition is prescribed. You're one of the few people I know who operates at the level of science I've tried to build this to.\n\nI'm putting together a small founding advisor group and I'd genuinely like you to be part of it. Would you be up for taking a look at what I've built?`,
  },
  {
    id: 'danny',
    name: 'Danny',
    field: 'Sports Medicine Doctor',
    organisation: '',
    contactDate: '',
    status: 'Not contacted',
    feedback: '',
    notes: '',
    socialDm: `Hey Danny, hope you're well.\n\nI've built a biological interpretation system called Body Recode - designed to sit alongside clinical assessment and give practitioners a structured hormonal read before intervention. One of the intended use environments is clinical integration.\n\nI'm looking for a small group of clinical professionals to review it honestly and your background makes your perspective particularly valuable. Would you be open to taking a look?`,
  },
  {
    id: 'tom',
    name: 'Tom',
    field: 'Physiotherapist',
    organisation: 'Cairns Taipans NBL',
    contactDate: '',
    status: 'Not contacted',
    feedback: '',
    notes: '',
    socialDm: `Hey Tom, hope the Taipans are going well.\n\nI've been building a biological interpretation system called Body Recode - it reads the body's state before any load or intervention is prescribed, and flags when referral is warranted. It sits alongside practitioner assessment, not replacing it.\n\nYour experience working with elite athletes under sustained load makes your perspective on this exactly what I need. Would you be up for taking a look?`,
  },
  {
    id: 'layne-norton',
    name: 'Layne Norton',
    field: 'PhD Nutritional Sciences / Bodybuilder',
    organisation: 'Carbon Diet Coach',
    contactDate: '',
    status: 'Not contacted',
    feedback: '',
    notes: 'Met at Melbourne expo. Attended his seminar. Lead with personal connection.',
    socialDm: `Hey Layne, we met briefly at [EXPO NAME] in Melbourne - I sat in on your seminar.\n\nI've spent the last few years building a biological interpretation system called Body Recode. One of the central frameworks is the Fat Map Method - reading regional fat distribution as hormonal and metabolic signalling. I know that's exactly the kind of claim you'd want to pull apart, and that's precisely why I'm reaching out.\n\nWould you be open to reviewing it?`,
  },
  {
    id: 'kenji-doma',
    name: 'Kenji Doma',
    field: 'Exercise Science Academic',
    organisation: 'James Cook University',
    contactDate: '',
    status: 'Not contacted',
    feedback: '',
    notes: "Used to work out of Kade's PT studio. Strong personal connection. Academic framing - rigorous research perspective.",
    socialDm: `Hey Kenji, it's been a long time - hope things are going well at JCU.\n\nI've been building on everything I was working through back at the studio - it's now a full biological interpretation system called Body Recode. I'm at the stage where I want academic eyes on it and your background in exercise physiology makes you exactly the right person.\n\nWould you be up for taking a look?`,
  },
  {
    id: 'richard-arnot',
    name: 'Richard Arnot',
    field: 'Retired Surgeon',
    organisation: '',
    contactDate: '',
    status: 'Not contacted',
    feedback: '',
    notes: "Former client, same era as Kenji. Retired - no scope-of-practice defensiveness. Lead with \"you saw how I worked back then.\"",
    socialDm: `Hey Richard, it's been a long time - hope you're keeping well.\n\nYou were a client of mine when I was still developing the foundations of how I think about the body. I've now built that into a full biological interpretation system called Body Recode.\n\nI'm putting together a small founding advisor group and I'd genuinely value your medical perspective on it. Would you be open to taking a look?`,
  },
]

export default function PeerReviewPage() {
  const [reviewers, setReviewers] = useState<Reviewer[]>([])
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [copiedKey, setCopiedKey] = useState<string | null>(null)
  const [activeTemplate, setActiveTemplate] = useState<'outreach' | 'followup' | 'agenda'>('outreach')

  useEffect(() => {
    const saved = localStorage.getItem('br_peer_reviewers')
    if (saved) {
      const existing: Reviewer[] = JSON.parse(saved)
      const existingIds = new Set(existing.map(r => r.id))
      const merged = [
        ...existing.map(r => ({
          ...r,
          socialDm: r.socialDm ?? DEFAULT_REVIEWERS.find(d => d.id === r.id)?.socialDm ?? '',
        })),
        ...DEFAULT_REVIEWERS.filter(r => !existingIds.has(r.id)),
      ]
      setReviewers(merged)
      localStorage.setItem('br_peer_reviewers', JSON.stringify(merged))
    } else {
      setReviewers(DEFAULT_REVIEWERS)
      localStorage.setItem('br_peer_reviewers', JSON.stringify(DEFAULT_REVIEWERS))
    }
  }, [])

  const save = (updated: Reviewer[]) => {
    setReviewers(updated)
    localStorage.setItem('br_peer_reviewers', JSON.stringify(updated))
  }

  const addReviewer = () => {
    const newReviewer: Reviewer = {
      id: Date.now().toString(),
      name: '',
      field: '',
      organisation: '',
      contactDate: '',
      status: 'Not contacted',
      feedback: '',
      notes: '',
      socialDm: '',
    }
    save([...reviewers, newReviewer])
    setExpandedId(newReviewer.id)
  }

  const updateReviewer = (id: string, field: keyof Reviewer, value: string) => {
    save(reviewers.map(r => r.id === id ? { ...r, [field]: value } : r))
  }

  const deleteReviewer = (id: string) => {
    save(reviewers.filter(r => r.id !== id))
    if (expandedId === id) setExpandedId(null)
  }

  const copy = (text: string, key: string) => {
    navigator.clipboard.writeText(text)
    setCopiedKey(key)
    setTimeout(() => setCopiedKey(null), 2000)
  }

  const stats = {
    total: reviewers.length,
    contacted: reviewers.filter(r => r.status !== 'Not contacted').length,
    responded: reviewers.filter(r => ['Responded', 'Call booked', 'Complete'].includes(r.status)).length,
    complete: reviewers.filter(r => r.status === 'Complete').length,
  }

  return (
    <div className="p-8 max-w-5xl">

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
          <span className="text-xs font-semibold tracking-widest uppercase text-blue-500">System Development</span>
        </div>
        <h1 className="text-2xl font-bold text-[#1A1A1A] mb-2">Peer Review Program</h1>
        <p className="text-sm text-stone-600 max-w-2xl">
          Manage the {brand().name}™ peer review process. Track outreach, reviewer status, and feedback from medical, allied health, and performance professionals.
                          </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Reviewers', value: stats.total },
          { label: 'Contacted', value: stats.contacted },
          { label: 'Responded', value: stats.responded },
          { label: 'Complete', value: stats.complete },
        ].map(stat => (
          <div key={stat.label} className="bg-stone-100 border border-stone-200 rounded-xl p-4">
            <p className="text-2xl font-bold text-[#1A1A1A] mb-1">{stat.value}</p>
            <p className="text-xs text-stone-500">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Review Assets */}
      <div className="mb-8">
        <h2 className="text-sm font-semibold text-stone-700 mb-3">Review Assets</h2>
        <div className="grid grid-cols-3 gap-3">
          {ASSETS.map(asset => (
            <a
              key={asset.label}
              href={asset.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-start justify-between gap-3 bg-stone-100 border border-stone-200 rounded-xl p-4 hover:border-stone-300 transition-colors group"
            >
              <div>
                <p className="text-sm font-medium text-[#1A1A1A] mb-1">{asset.label}</p>
                <p className="text-xs text-stone-500">{asset.description}</p>
              </div>
              <ExternalLink size={14} className="text-stone-400 group-hover:text-blue-500 transition-colors shrink-0 mt-0.5" />
            </a>
          ))}
        </div>
      </div>

      {/* Outreach Templates */}
      <div className="mb-8">
        <h2 className="text-sm font-semibold text-stone-700 mb-3">Outreach Templates</h2>
        <div className="bg-stone-100 border border-stone-200 rounded-xl overflow-hidden">
          <div className="flex border-b border-stone-200">
            {([
              { key: 'outreach', label: 'Initial Outreach' },
              { key: 'followup', label: '2-Week Follow-Up' },
              { key: 'agenda', label: 'Call Agenda' },
            ] as const).map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTemplate(tab.key)}
                className={`px-5 py-3 text-xs font-medium transition-colors ${
                  activeTemplate === tab.key ? 'text-blue-500 border-b-2 border-blue-500' : 'text-stone-500 hover:text-stone-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="p-4">
            <pre className="text-xs text-stone-600 whitespace-pre-wrap leading-relaxed font-sans">
              {activeTemplate === 'outreach' ? OUTREACH_TEMPLATE : activeTemplate === 'followup' ? FOLLOWUP_TEMPLATE : CALL_AGENDA}
            </pre>
            {activeTemplate !== 'agenda' && (
              <button
                onClick={() => copy(activeTemplate === 'outreach' ? OUTREACH_TEMPLATE : FOLLOWUP_TEMPLATE, activeTemplate)}
                className="mt-4 px-4 py-2 text-xs font-medium rounded-lg bg-stone-200 text-stone-700 hover:bg-stone-300 transition-colors"
              >
                {copiedKey === activeTemplate ? 'Copied' : 'Copy to clipboard'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Reviewer Tracker */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-stone-700">Reviewer Tracker</h2>
          <button
            onClick={addReviewer}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-blue-50 text-blue-500 border border-blue-500/20 rounded-lg hover:bg-blue-100 transition-colors"
          >
            <Plus size={13} />
            Add Reviewer
          </button>
        </div>

        {reviewers.length === 0 ? (
          <div className="bg-stone-100 border border-stone-200 rounded-xl p-10 text-center">
            <p className="text-sm text-stone-500">No reviewers added yet.</p>
            <p className="text-xs text-stone-400 mt-1">Click "Add Reviewer" to start tracking your outreach.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {reviewers.map(reviewer => (
              <div key={reviewer.id} className="bg-stone-100 border border-stone-200 rounded-xl overflow-hidden">

                {/* Row */}
                <div className="flex items-center gap-4 px-4 py-3">
                  <button
                    onClick={() => setExpandedId(expandedId === reviewer.id ? null : reviewer.id)}
                    className="text-stone-400 hover:text-stone-600 transition-colors shrink-0"
                  >
                    {expandedId === reviewer.id ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                  </button>

                  <input
                    value={reviewer.name}
                    onChange={e => updateReviewer(reviewer.id, 'name', e.target.value)}
                    placeholder="Full name"
                    className="flex-1 bg-transparent text-sm text-[#1A1A1A] placeholder-stone-400 outline-none"
                  />

                  <input
                    value={reviewer.field}
                    onChange={e => updateReviewer(reviewer.id, 'field', e.target.value)}
                    placeholder="Field (e.g. GP, Physio, EP)"
                    className="w-44 bg-transparent text-sm text-stone-600 placeholder-stone-400 outline-none"
                  />

                  <input
                    value={reviewer.contactDate}
                    onChange={e => updateReviewer(reviewer.id, 'contactDate', e.target.value)}
                    placeholder="Date contacted"
                    className="w-32 bg-transparent text-sm text-stone-600 placeholder-stone-400 outline-none"
                  />

                  <select
                    value={reviewer.status}
                    onChange={e => updateReviewer(reviewer.id, 'status', e.target.value as ReviewerStatus)}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium border-0 outline-none cursor-pointer ${STATUS_COLOURS[reviewer.status]}`}
                    style={{ background: 'transparent' }}
                  >
                    {STATUSES.map(s => (
                      <option key={s} value={s} className="bg-stone-100 text-[#1A1A1A]">{s}</option>
                    ))}
                  </select>

                  <button
                    onClick={() => deleteReviewer(reviewer.id)}
                    className="text-stone-700 hover:text-red-500 transition-colors shrink-0"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                {/* Expanded */}
                {expandedId === reviewer.id && (
                  <div className="px-4 pb-4 border-t border-stone-200 pt-4 space-y-4">

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs text-stone-500 mb-1.5 block">Organisation</label>
                        <input
                          value={reviewer.organisation}
                          onChange={e => updateReviewer(reviewer.id, 'organisation', e.target.value)}
                          placeholder="Practice / hospital / gym"
                          className="w-full bg-stone-200 rounded-lg px-3 py-2 text-sm text-[#1A1A1A] placeholder-stone-400 outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-stone-500 mb-1.5 block">Feedback Summary</label>
                        <input
                          value={reviewer.feedback}
                          onChange={e => updateReviewer(reviewer.id, 'feedback', e.target.value)}
                          placeholder="Key feedback points"
                          className="w-full bg-stone-200 rounded-lg px-3 py-2 text-sm text-[#1A1A1A] placeholder-stone-400 outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs text-stone-500 mb-1.5 block">Call Notes</label>
                      <textarea
                        value={reviewer.notes}
                        onChange={e => updateReviewer(reviewer.id, 'notes', e.target.value)}
                        placeholder="Notes from your follow-up call..."
                        rows={3}
                        className="w-full bg-stone-200 rounded-lg px-3 py-2 text-sm text-[#1A1A1A] placeholder-stone-400 outline-none resize-none"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs text-stone-500">Social DM</label>
                        {reviewer.socialDm && (
                          <button
                            onClick={() => copy(reviewer.socialDm, `dm-${reviewer.id}`)}
                            className="flex items-center gap-1 text-xs text-stone-500 hover:text-blue-500 transition-colors"
                          >
                            {copiedKey === `dm-${reviewer.id}` ? <Check size={11} /> : <Copy size={11} />}
                            {copiedKey === `dm-${reviewer.id}` ? 'Copied' : 'Copy'}
                          </button>
                        )}
                      </div>
                      <textarea
                        value={reviewer.socialDm}
                        onChange={e => updateReviewer(reviewer.id, 'socialDm', e.target.value)}
                        placeholder="Short DM for Facebook / Instagram outreach..."
                        rows={5}
                        className="w-full bg-stone-200 rounded-lg px-3 py-2 text-sm text-[#1A1A1A] placeholder-stone-400 outline-none resize-none"
                      />
                      <p className="text-xs text-stone-400 mt-1">Short opener only. Goal is a reply, not a full read. Send full message once they respond.</p>
                    </div>

                  </div>
                )}

              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  )
}
