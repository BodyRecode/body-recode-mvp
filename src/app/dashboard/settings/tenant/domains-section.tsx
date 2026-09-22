'use client'

import { useEffect, useState, useTransition } from 'react'

type Domain = {
  id: string
  tenant_id: string
  domain: string
  is_primary: boolean
  verified_at: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export function DomainsSection() {
  const [domains, setDomains] = useState<Domain[]>([])
  const [envVarLine, setEnvVarLine] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [newDomain, setNewDomain] = useState('')
  const [newNotes, setNewNotes] = useState('')
  const [newIsPrimary, setNewIsPrimary] = useState(false)
  const [pending, startTransition] = useTransition()

  async function reload() {
    setLoading(true)
    const r = await fetch('/api/tenant/domains')
    if (!r.ok) {
      setError((await r.json().catch(() => ({ error: 'load failed' }))).error ?? 'load failed')
      setLoading(false)
      return
    }
    const data = await r.json()
    setDomains(data.domains ?? [])
    setEnvVarLine(data.env_var_line ?? '')
    setLoading(false)
    setError(null)
  }

  useEffect(() => {
    reload()
  }, [])

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!newDomain.trim()) return
    startTransition(async () => {
      const r = await fetch('/api/tenant/domains', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          domain: newDomain.trim(),
          notes: newNotes.trim() || undefined,
          is_primary: newIsPrimary,
        }),
      })
      if (!r.ok) {
        const body = await r.json().catch(() => ({ error: 'add failed' }))
        setError(body.error ?? 'add failed')
        return
      }
      setNewDomain('')
      setNewNotes('')
      setNewIsPrimary(false)
      await reload()
    })
  }

  async function handleDelete(id: string) {
    if (!confirm('Remove this domain?')) return
    startTransition(async () => {
      const r = await fetch(`/api/tenant/domains?id=${id}`, { method: 'DELETE' })
      if (!r.ok) {
        const body = await r.json().catch(() => ({ error: 'delete failed' }))
        setError(body.error ?? 'delete failed')
        return
      }
      await reload()
    })
  }

  return (
    <div className="mb-4 br-card overflow-hidden">
      <div className="px-5 py-3 border-b border-[#E4E4E0] bg-[#FAFAF8]">
        <h3 className="text-[13.5px] font-semibold text-[#0F1115] tracking-[-0.015em]">Custom domains</h3>
      </div>
      <div className="p-5">
        <p className="text-[13.5px] text-[#6E747D] leading-relaxed mb-4">
          Route additional domains to this tenant. After adding a domain, point it via CNAME to <code className="bg-[#F2F2EF] px-1 py-0.5 rounded text-[12.5px]">cname.vercel-dns.com</code> in your DNS registrar, then copy the env var line below into Vercel and redeploy.
        </p>

        {error && (
          <div className="mb-3 p-3 rounded-lg border border-[#E8C9C9] bg-[#FBF1F1] text-[12.5px] text-[#8F2D2D]">{error}</div>
        )}

        {loading ? (
          <div className="text-[13.5px] text-[#6E747D]">Loading domains…</div>
        ) : domains.length === 0 ? (
          <div className="text-[13.5px] text-[#6E747D] italic mb-4">No custom domains yet.</div>
        ) : (
          <div className="mb-4 border border-[#E4E4E0] rounded-lg overflow-hidden">
            <table className="w-full text-[13.5px]">
              <thead className="bg-[#FAFAF8]">
                <tr>
                  <th className="text-left px-3 py-2 text-[11px] font-medium text-[#6E747D]">Domain</th>
                  <th className="text-left px-3 py-2 text-[11px] font-medium text-[#6E747D]">Primary</th>
                  <th className="text-left px-3 py-2 text-[11px] font-medium text-[#6E747D]">Verified</th>
                  <th className="text-left px-3 py-2 text-[11px] font-medium text-[#6E747D]">Notes</th>
                  <th className="text-right px-3 py-2 text-[11px] font-medium text-[#6E747D]"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F2F2EF]">
                {domains.map((d) => (
                  <tr key={d.id}>
                    <td className="px-3 py-2 font-mono text-[#0F1115]">{d.domain}</td>
                    <td className="px-3 py-2">
                      {d.is_primary ? (
                        <span className="text-[11px] font-medium bg-[#F2F2EF] text-[#000000] px-1.5 py-0.5 rounded">Primary</span>
                      ) : (
                        <span className="text-[#9CA2AB]">—</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-[#6E747D]">
                      {d.verified_at ? new Date(d.verified_at).toLocaleDateString('en-AU') : <span className="text-[#B06E1F]">Pending</span>}
                    </td>
                    <td className="px-3 py-2 text-[#6E747D]">{d.notes ?? <span className="text-[#9CA2AB]">—</span>}</td>
                    <td className="px-3 py-2 text-right">
                      <button
                        onClick={() => handleDelete(d.id)}
                        disabled={pending}
                        className="text-[12.5px] text-[#8F2D2D] hover:text-[#8F2D2D] underline disabled:opacity-40"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <form onSubmit={handleAdd} className="mb-4 p-3 rounded-lg border border-[#E4E4E0] bg-[#FAFAF8]">
          <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-3 items-end">
            <label className="block">
              <span className="text-[11px] font-medium text-[#6E747D] mb-1 block">Domain</span>
              <input
                type="text"
                required
                placeholder="mycoach.com"
                value={newDomain}
                onChange={(e) => setNewDomain(e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-[#E4E4E0] text-[13.5px] font-mono focus:outline-none focus:ring-2 focus:ring-[#242932]"
                disabled={pending}
              />
            </label>
            <label className="block">
              <span className="text-[11px] font-medium text-[#6E747D] mb-1 block">Notes (optional)</span>
              <input
                type="text"
                placeholder="e.g. rebrand, regional"
                value={newNotes}
                onChange={(e) => setNewNotes(e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-[#E4E4E0] text-[13.5px] focus:outline-none focus:ring-2 focus:ring-[#242932]"
                disabled={pending}
              />
            </label>
            <button
              type="submit"
              disabled={pending || !newDomain.trim()}
              className="px-4 py-2 rounded-md bg-[#000000] text-white text-[13.5px] font-semibold hover:bg-[#000000] disabled:opacity-40"
            >
              {pending ? 'Adding…' : 'Add'}
            </button>
          </div>
          <label className="flex items-center gap-2 mt-3">
            <input
              type="checkbox"
              checked={newIsPrimary}
              onChange={(e) => setNewIsPrimary(e.target.checked)}
              disabled={pending}
            />
            <span className="text-[12.5px] text-[#0F1115]">Mark as primary (used for absolute URLs in emails, deposes any existing primary)</span>
          </label>
        </form>

        {envVarLine && (
          <div className="p-3 rounded-lg border border-[#DCDCD7] bg-[rgba(27,109,252,0.08)]">
            <p className="text-[11px] font-medium text-[#000000] mb-2">Vercel env var update</p>
            <p className="text-[12.5px] text-[#000000] leading-relaxed mb-2">
              Copy this line into <code className="bg-[#F2F2EF] px-1 py-0.5 rounded text-[11px]">NEXT_PUBLIC_TENANT_DOMAIN_MAP</code> in Vercel &rarr; Project settings &rarr; Environment variables, then trigger a redeploy. The map applies at edge middleware load, so a redeploy is required.
            </p>
            <div className="p-2 rounded bg-white border border-[#F2F2EF] font-mono text-[12.5px] text-[#0F1115] break-all select-all">{envVarLine}</div>
          </div>
        )}
      </div>
    </div>
  )
}
