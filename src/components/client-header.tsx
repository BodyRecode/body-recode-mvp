import PortalSignOutButton from './portal-sign-out-button'

const WHATSAPP_NUMBER = '61400336284'

export default function ClientHeader() {
  return (
    <>
      <div className="sticky top-0 z-10 bg-[#0a0a0a]/95 backdrop-blur-sm border-b border-stone-900 px-5 py-4 flex items-center justify-between">
        <img src="https://bodyrecode.au/logo-teal.png" width="160" alt="Body Recode" style={{ display: 'block' }} />
        <PortalSignOutButton />
      </div>
      <div className="fixed bottom-0 left-0 right-0 z-10 bg-[#0a0a0a]/95 backdrop-blur-sm border-t border-stone-900 px-5 py-3 text-center">
        <a
          href={`https://wa.me/${WHATSAPP_NUMBER}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-stone-500 hover:text-teal-400 transition-colors"
        >
          Questions? Message Kade on WhatsApp →
        </a>
      </div>
    </>
  )
}
