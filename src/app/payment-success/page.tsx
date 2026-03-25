export default function PaymentSuccessPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-6">
      <div className="text-center max-w-sm">
        <p className="text-xs font-bold tracking-widest text-teal-400 uppercase mb-6">Body Recode</p>
        <h1 className="text-xl font-semibold text-white mb-3">Payment received</h1>
        <p className="text-stone-400 text-sm leading-relaxed">
          Your commencement fee has been processed. You'll receive an email shortly with your intake link to complete before your first session.
        </p>
      </div>
    </div>
  )
}
