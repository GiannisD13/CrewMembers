import { useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Sidebar from './Sidebar'

export default function AppShell({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)

  if (!user) return null

  return (
    <div className="min-h-screen bg-navy flex">
      <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />

      <div className="flex-1 min-w-0 flex flex-col">

        {/* Mobile top bar */}
        <header className="lg:hidden sticky top-0 z-30 h-14 px-4 flex items-center justify-between bg-navy/95 backdrop-blur-md border-b border-white/5">
          <button
            onClick={() => setMobileOpen(true)}
            className="p-2 -ml-2 text-cream/70 hover:text-cream transition-colors"
            aria-label="Open menu"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <Link to={`/dashboard/${user.account_type}`} className="font-display text-base font-bold tracking-wide text-cream">
            Crew<span className="text-gold">Deck</span>
          </Link>

          <div className="w-9" />
        </header>

        <main className="flex-1 min-w-0">
          {children}
        </main>
      </div>
    </div>
  )
}
