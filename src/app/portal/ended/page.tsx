/**
 * Where an offboarded client lands. Deliberately plain and not cold: the
 * engagement has ended, that is all it says, and it does not imply fault.
 */
export default function PortalEndedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50 px-6">
      <div className="max-w-md text-center">
        <h1 className="text-lg font-semibold text-stone-900">This portal is closed</h1>
        <p className="mt-3 text-sm text-stone-600 leading-relaxed">
          Your coaching engagement has ended, so your plans and readings are no longer available here.
        </p>
        <p className="mt-3 text-sm text-stone-600 leading-relaxed">
          Your records are retained securely. If you need a copy of anything, or you would like to pick
          things back up, email{' '}
          <a href="mailto:kade@bodyrecode.au" className="text-[#1B6DFC] hover:underline">kade@bodyrecode.au</a>.
        </p>
      </div>
    </div>
  )
}
