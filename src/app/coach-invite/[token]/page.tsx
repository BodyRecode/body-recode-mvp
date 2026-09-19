import { brand } from '@/config/tenant'
import AcceptInviteClient from './accept-invite-client'

export const metadata = {
  title: `Set your password · ${brand().name}`,
  robots: { index: false, follow: false },
}

/**
 * Where a coach invitation is accepted. The token is in the address, so the
 * page is never indexed and the invitation is read through a server route
 * rather than from the browser.
 */
export default async function CoachInvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  return (
    <div className="min-h-screen bg-[#FFFFFF] text-[#1A1A1A] flex flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-md">
        <AcceptInviteClient token={token} />
      </div>
    </div>
  )
}
