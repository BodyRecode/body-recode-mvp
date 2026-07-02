import SignupClient from './signup-client'
import { brand } from '@/config/tenant'

export const metadata = {
  title: `Coach signup · ${brand().name}`,
  description: 'Create your coaching platform tenant.',
}

export default function CoachSignupPage() {
  return (
    <div className="min-h-screen bg-[#FFFFFF] text-[#1A1A1A] flex flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-lg">
        <div className="text-center mb-10">
          <div className="inline-block px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-[11px] font-bold uppercase tracking-widest mb-4">
            Coach signup
          </div>
          <h1 className="text-3xl font-bold text-[#1A1A1A] mb-3">Provision your platform</h1>
          <p className="text-[#6B6B6B] text-sm leading-relaxed">
            One form → new coach account + tenant configuration → ready to configure your brand.
          </p>
        </div>
        <SignupClient />
      </div>
    </div>
  )
}
