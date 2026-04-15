import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const location = useLocation()
  const isDark = location.pathname === '/' || location.pathname === '/login' || location.pathname === '/register'

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', handler)
    return () => window.removeEventListener('scroll', handler)
  }, [])

  const navBg = isDark
    ? scrolled ? 'bg-navy/95 backdrop-blur-md shadow-lg shadow-black/20' : 'bg-transparent'
    : 'bg-cream border-b border-cream-dim'

  const textColor = isDark ? 'text-cream/70 hover:text-cream' : 'text-navy/60 hover:text-navy'
  const logoColor = isDark ? 'text-cream' : 'text-navy'

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${navBg}`}>
      <div className="max-w-7xl mx-auto px-6 lg:px-10 h-16 flex items-center justify-between">

        {/* Logo */}
        <Link to="/" className={`font-display text-xl font-bold tracking-wide ${logoColor}`}>
          Crew<span className="text-gold">Deck</span>
        </Link>

        {/* Desktop links */}
        <ul className="hidden md:flex items-center gap-8">
          <li>
            <Link to="/browse" className={`text-sm font-medium transition-colors ${textColor}`}>
              Browse
            </Link>
          </li>
          <li>
            <Link to="/browse?tab=jobs" className={`text-sm font-medium transition-colors ${textColor}`}>
              Open Positions
            </Link>
          </li>
          <li>
            <Link to="/browse?tab=crew" className={`text-sm font-medium transition-colors ${textColor}`}>
              Available Crew
            </Link>
          </li>
        </ul>

        {/* Auth buttons */}
        <div className="hidden md:flex items-center gap-3">
          <Link
            to="/login"
            className={`text-sm font-medium px-4 py-2 rounded-lg transition-colors ${textColor}`}
          >
            Sign in
          </Link>
          <Link
            to="/register"
            className="text-sm font-semibold px-5 py-2 rounded-lg bg-gold text-navy hover:bg-gold-light transition-colors"
          >
            Join Free
          </Link>
        </div>

        {/* Mobile menu button */}
        <button
          className={`md:hidden p-2 ${isDark ? 'text-cream' : 'text-navy'}`}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          <div className="w-5 flex flex-col gap-1">
            <span className={`block h-px bg-current transition-all ${menuOpen ? 'rotate-45 translate-y-1.5' : ''}`} />
            <span className={`block h-px bg-current transition-all ${menuOpen ? 'opacity-0' : ''}`} />
            <span className={`block h-px bg-current transition-all ${menuOpen ? '-rotate-45 -translate-y-1.5' : ''}`} />
          </div>
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-navy border-t border-white/10 px-6 py-4 flex flex-col gap-4">
          <Link to="/browse" className="text-cream/70 text-sm font-medium" onClick={() => setMenuOpen(false)}>Browse</Link>
          <Link to="/browse?tab=jobs" className="text-cream/70 text-sm font-medium" onClick={() => setMenuOpen(false)}>Open Positions</Link>
          <Link to="/browse?tab=crew" className="text-cream/70 text-sm font-medium" onClick={() => setMenuOpen(false)}>Available Crew</Link>
          <hr className="border-white/10" />
          <Link to="/login" className="text-cream/70 text-sm font-medium" onClick={() => setMenuOpen(false)}>Sign in</Link>
          <Link to="/register" className="text-sm font-semibold px-5 py-2.5 rounded-lg bg-gold text-navy text-center" onClick={() => setMenuOpen(false)}>Join Free</Link>
        </div>
      )}
    </nav>
  )
}
