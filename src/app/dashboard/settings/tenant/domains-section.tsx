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
      <div className="px-5 py-3 border-b border-[#E8EAEE] bg-[#FBFCFD]">
        <h3 className="text-[13.5px] font-semibold text-[#141821] tracking-[-0.015em]">Custom domains</h3>
      </div>
      <div className="p-5">
        <p className="text-[13px] text-[#666D7A] leading-relaxed mb-4">
          Route additional domains to this tenant. After adding a domain, point it via CNAME to <code className="bg-[#F4F6F9] px-1 py-0.5 rounded text-[12px]">cname.vercel-dns.com</code> in your DNS registrar, then copy the env var line below into Vercel and redeploy.
        </p>

        {error && (
          <div className="mb-3 p-3 rounded-lg border border-[#F5C9C9] bg-[#FDEDED] text-[12px] text-[#A11D1D]">{error}</div>
        )}

        {loading ? (
          <div className="text-[13px] text-[#666D7A]">Loading domains…</div>
        ) : domains.length === 0 ? (
          <div className="text-[13px] text-[#666D7A] italic mb-4">No custom domains yet.</div>
        ) : (
          <div className="mb-4 border border-[#E8EAEE] rounded-lg overflow-hidden">
            <table className="w-full text-[13px]">
              <thead className="bg-[#FBFCFD]">
                <tr>
                  <th className="text-left px-3 py-2 text-[11px] font-medium text-[#666D7A]">Domain</th>
                  <th className="text-left px-3 py-2 text-[11px] font-medium text-[#666D7A]">Primary</th>
                  <th className="text-left px-3 py-2 text-[11px] font-medium text-[#666D7A]">Verified</th>
                  <th className="text-left px-3 py-2 text-[11px] font-medium text-[#666D7A]">Notes</th>
                  <th className="text-right px-3 py-2 text-[11px] font-medium text-[#666D7A]"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F4F6F9]">
                {domains.map((d) => (
                  <tr key={d.id}>
                    <td className="px-3 py-2 font-mono text-[#141821]">{d.domain}</td>
                    <td className="px-3 py-2">
                      {d.is_primary ? (
                        <span className="text-[11.5px] font-medium bg-[#DDE9FD] text-[#1056D6] px-1.5 py-0.5 rounded">Primary</span>
                      ) : (
                        <span className="text-[#98A0AD]">—</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-[#666D7A]">
                      {d.verified_at ? new Date(d.verified_at).toLocaleDateString('en-AU') : <span className="text-[#A96A12]">Pending</span>}
                    </td>
                    <td className="px-3 py-2 text-[#666D7A]">{d.notes ?? <span className="text-[#98A0AD]">—</span>}</td>
                    <td className="px-3 py-2 text-right">
                      <button
                        onClick={() => handleDelete(d.id)}
                        disabled={pending}
                        className="text-[12px] text-[#C82626] hover:text-[#C82626] underline disabled:opacity-40"
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

        <form onSubmit={handleAdd} className="mb-4 p-3 rounded-lg border border-[#E8EAEE] bg-[#FBFCFD]">
          <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-3 items-end">
            <label className="block">
              <span className="text-[11px] font-medium text-[#666D7A] mb-1 block">Domain</span>
              <input
                type="text"
                required
                placeholder="mycoach.com"
                value={newDomain}
                onChange={(e) => setNewDomain(e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-[#E8EAEE] text-[13px] font-mono focus:outline-none focus:ring-2 focus:ring-[#5390FF]"
                disabled={pending}
              />
            </label>
            <label className="block">
              <span className="text-[11px] font-medium text-[#666D7A] mb-1 block">Notes (optional)</span>
              <input
                type="text"
                placeholder="e.g. rebrand, regional"
                value={newNotes}
                onChange={(e) => setNewNotes(e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-[#E8EAEE] text-[13px] focus:outline-none focus:ring-2 focus:ring-[#5390FF]"
                disabled={pending}
              />
            </label>
            <button
              type="submit"
              disabled={pending || !newDomain.trim()}
              className="px-4 py-2 rounded-md bg-[#1560E0] text-white text-[13px] font-semibold hover:bg-[#1056D6] disabled:opacity-40"
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
            <span className="text-[12px] text-[#141821]">Mark as primary (used for absolute URLs in emails, deposes any existing primary)</span>
          </label>
        </form>

        {envVarLine && (
          <div className="p-3 rounded-lg border border-[#B5CFFC] bg-[rgba(27,109,252,0.08)]">
            <p className="text-[11px] font-medium text-[#0A46B2] mb-2">Vercel env var update</p>
            <p className="text-[12px] text-[#0B4FCB] leading-relaxed mb-2">
              Copy this line into <code className="bg-[#DDE9FD] px-1 py-0.5 rounded text-[11px]">NEXT_PUBLIC_TENANT_DOMAIN_MAP</code> in Vercel &rarr; Project settings &rarr; Environment variables, then trigger a redeploy. The map applies at edge middleware load, so a redeploy is required.
            </p>
            <div className="p-2 rounded bg-white border border-[#DDE9FD] font-mono text-[12px] text-[#141821] break-all select-all">{envVarLine}</div>
          </div>
        )}
      </div>
    </div>
  )
}
