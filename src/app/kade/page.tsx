import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Kade Dunstone',
  description: 'Performance coach. Founder. Builder.',
}

export default function KadePage() {
  return (
    <div className="min-h-screen bg-[#0c0a09] flex flex-col items-center justify-center px-5 py-16">
      <div className="w-full max-w-sm">

        {/* Identity */}
        <div className="text-center mb-12">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/kade.jpg" alt="Kade Dunstone" className="w-20 h-20 rounded-full object-cover mx-auto mb-5 border border-stone-700" />
          <h1 className="text-xl font-bold text-white mb-1">Kade Dunstone</h1>
          <p className="text-sm text-stone-500">Performance coach. Founder. Builder.</p>
        </div>

        {/* Links */}
        <div className="space-y-3">

          {/* Performance Coaching */}
          <a
            href="https://performance.bodyrecode.au"
            className="group flex items-center justify-between w-full bg-[#111110] border border-stone-800 hover:border-teal-500/40 hover:bg-teal-500/5 rounded-xl px-5 py-4 transition-all"
          >
            <div>
              <p className="text-sm font-semibold text-white group-hover:text-teal-400 transition-colors">Performance Coaching</p>
              <p className="text-xs text-stone-500 mt-0.5">Body State Scorecard + 1:1 coaching</p>
            </div>
            <span className="text-stone-600 group-hover:text-teal-400 transition-colors text-lg">→</span>
          </a>

          {/* Body Recode Platform */}
          <a
            href="https://bodyrecode.au"
            className="group flex items-center justify-between w-full bg-[#111110] border border-stone-800 hover:border-stone-600 rounded-xl px-5 py-4 transition-all"
          >
            <div>
              <p className="text-sm font-semibold text-white transition-colors">Body Recode™</p>
              <p className="text-xs text-stone-500 mt-0.5">Biological interpretation platform</p>
            </div>
            <span className="text-stone-600 group-hover:text-stone-400 transition-colors text-lg">→</span>
          </a>

          {/* Threads */}
          <a
            href="https://www.threads.net/@kade_dunstone_"
            className="group flex items-center justify-between w-full bg-[#111110] border border-stone-800 hover:border-stone-600 rounded-xl px-5 py-4 transition-all"
          >
            <div>
              <p className="text-sm font-semibold text-white transition-colors">Threads</p>
              <p className="text-xs text-stone-500 mt-0.5">@kade_dunstone_</p>
            </div>
            <span className="text-stone-600 group-hover:text-stone-400 transition-colors text-lg">→</span>
          </a>

          {/* Instagram */}
          <a
            href="https://www.instagram.com/kade_dunstone_"
            className="group flex items-center justify-between w-full bg-[#111110] border border-stone-800 hover:border-stone-600 rounded-xl px-5 py-4 transition-all"
          >
            <div>
              <p className="text-sm font-semibold text-white transition-colors">Instagram</p>
              <p className="text-xs text-stone-500 mt-0.5">@kade_dunstone_</p>
            </div>
            <span className="text-stone-600 group-hover:text-stone-400 transition-colors text-lg">→</span>
          </a>

        </div>

        {/* Footer */}
        <p className="text-center text-xs text-stone-700 mt-12">bodyrecode.au/kade</p>
      </div>
    </div>
  )
}
