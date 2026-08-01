/**
 * Where a frozen (paused) client lands. Warmer than /portal/ended: the
 * engagement is on hold, not over, and the copy says "when you are ready".
 */
export default function PortalFrozenPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50 px-6">
      <div className="max-w-md text-center">
        <h1 className="text-lg font-semibold text-stone-900">Your coaching is on pause</h1>
        <p className="mt-3 text-sm text-stone-600 leading-relaxed">
          Everything is still here. Your plans, history and file are safe. Weekly billing and check-ins are paused while you take a break.
        </p>
        <p className="mt-3 text-sm text-stone-600 leading-relaxed">
          When you are ready to pick things back up, email{' '}
          <a href="mailto:kade@bodyrecode.au" className="text-[#1B6DFC] hover:underline">kade@bodyrecode.au</a>{' '}and we will unpause the same day.
        </p>
      </div>
    </div>
  )
}
