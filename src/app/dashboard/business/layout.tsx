import BusinessSidebar from './sidebar'

export default function BusinessLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="-mx-6 -my-8 flex" style={{ height: 'calc(100vh - 57px)' }}>
      <BusinessSidebar />
      <main className="flex-1 overflow-y-auto bg-stone-50 p-8">
        {children}
      </main>
    </div>
  )
}
