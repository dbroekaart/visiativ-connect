import BottomNav from './BottomNav'

export default function Layout({ children, title, back, actions }) {
  return (
    <div className="min-h-screen bg-[#F2F2F7] flex flex-col">
      {/* Top bar */}
      {title ? (
        <header className="glass border-b border-white/60 px-4 py-3 flex items-center gap-3 sticky top-0 z-40">
          {back && (
            <button
              onClick={back}
              className="flex items-center gap-1 text-brand-600 font-medium text-sm mr-1 -ml-1 px-2 py-1 rounded-lg hover:bg-brand-50 transition-colors"
            >
              <svg width="8" height="13" viewBox="0 0 8 13" fill="none">
                <path d="M7 1L1.5 6.5L7 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Back
            </button>
          )}
          <img src={`${import.meta.env.BASE_URL}logo.svg`} alt="Visiativ" className="h-5 flex-shrink-0" />
          <h1 className="font-semibold text-gray-900 text-base flex-1 tracking-tight">{title}</h1>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </header>
      ) : (
        /* Logo-only bar on pages without a title (e.g. Home) */
        <header className="glass border-b border-white/60 px-4 py-3 flex items-center sticky top-0 z-40">
          <img src={`${import.meta.env.BASE_URL}logo.svg`} alt="Visiativ" className="h-5" />
        </header>
      )}

      {/* Page content — padded above bottom nav */}
      <main className="flex-1 pb-24 overflow-y-auto">
        {children}
      </main>

      <BottomNav />
    </div>
  )
}
