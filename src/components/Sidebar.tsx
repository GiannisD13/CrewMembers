import { useEffect } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useNotifications } from '../context/NotificationsContext'

interface SidebarProps {
  mobileOpen: boolean
  onClose: () => void
}

const ICONS = {
  dashboard: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
    </svg>
  ),
  listings: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M4 6h16M4 10h16M4 14h10M4 18h7" />
    </svg>
  ),
  browse: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M21 21l-5.2-5.2m2.2-5.3a7.5 7.5 0 11-15 0 7.5 7.5 0 0115 0z" />
    </svg>
  ),
  applications: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  messages: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  ),
  logout: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
  ),
}

export default function Sidebar({ mobileOpen, onClose }: SidebarProps) {
  const { user, logout } = useAuth()
  const { newMessages, hasNewApplications } = useNotifications()
  const navigate  = useNavigate()
  const location  = useLocation()

  // Close mobile drawer on route change
  useEffect(() => { onClose() }, [location.pathname])

  if (!user) return null

  const browseLabel = user.account_type === 'crew' ? 'Browse Positions' : 'Browse Crew'
  const initials = `${user.first_name[0]}${user.last_name[0]}`.toUpperCase()

  const handleLogout = () => { logout(); navigate('/') }

  const linkCls = (active: boolean) =>
    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
      active
        ? 'bg-gold/10 text-gold-light/95 border border-gold/25'
        : 'text-cream/55 hover:text-cream hover:bg-white/5 border border-transparent'
    }`

  const content = (
    <div className="flex flex-col h-full">

      {/* Logo */}
      <div className="px-6 pt-6 pb-5 border-b border-white/5 flex items-center justify-between">
        <Link to={`/dashboard/${user.account_type}`} className="font-display text-xl font-bold tracking-wide text-cream">
          Crew<span className="text-gold">Deck</span>
        </Link>
        <button
          onClick={onClose}
          className="lg:hidden p-1.5 text-cream/40 hover:text-cream/70 transition-colors"
          aria-label="Close menu"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        <p className="text-[10px] font-semibold tracking-[0.2em] uppercase text-cream/30 px-3 mb-2">Menu</p>
        <NavLink to={`/dashboard/${user.account_type}`} end className={({ isActive }) => linkCls(isActive)}>
          {ICONS.dashboard} Dashboard
        </NavLink>
        <NavLink to="/my-listings" className={({ isActive }) => linkCls(isActive)}>
          {ICONS.listings} My Listings
        </NavLink>
        <NavLink to="/browse" className={({ isActive }) => linkCls(isActive)}>
          {ICONS.browse} {browseLabel}
        </NavLink>
        <NavLink to="/applications" className={({ isActive }) => linkCls(isActive)}>
          {ICONS.applications}
          <span className="flex-1">Applications</span>
          {hasNewApplications && (
            <span className="w-2 h-2 rounded-full bg-gold-light/95 shadow-[0_0_8px_rgba(196,151,58,0.5)]" aria-label="New activity" />
          )}
        </NavLink>
        <NavLink to="/messages" className={({ isActive }) => linkCls(isActive)}>
          {ICONS.messages}
          <span className="flex-1">Messages</span>
          {newMessages > 0 && (
            <span className="min-w-[20px] h-5 px-1.5 rounded-md bg-gold/95 text-navy text-[10px] font-bold flex items-center justify-center">
              {newMessages > 99 ? '99+' : newMessages}
            </span>
          )}
        </NavLink>
      </nav>

      {/* User card */}
      <div className="p-4 border-t border-white/5">
        <Link
          to={`/dashboard/${user.account_type}`}
          className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors mb-2"
        >
          <div className="w-9 h-9 rounded-full overflow-hidden bg-gold/10 border border-gold/20 flex items-center justify-center flex-shrink-0">
            {user.photo_url ? (
              <img src={user.photo_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="font-display text-sm font-semibold text-gold">{initials}</span>
            )}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-cream truncate">{user.first_name} {user.last_name}</p>
            <p className="text-[11px] font-light tracking-wide text-cream/40 capitalize">{user.account_type === 'owner' ? 'Yacht Owner' : 'Crew Member'}</p>
          </div>
        </Link>
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-cream/50 hover:text-cream hover:bg-white/5 transition-colors"
        >
          {ICONS.logout} Sign out
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile backdrop */}
      <div
        onClick={onClose}
        className={`lg:hidden fixed inset-0 z-40 bg-black/70 backdrop-blur-sm transition-opacity duration-300 ${
          mobileOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      />

      {/* Sidebar (mobile fixed drawer / desktop static column) */}
      <aside
        className={`
          fixed lg:static top-0 left-0 z-50
          h-screen lg:h-screen w-72 flex-shrink-0
          bg-navy-mid border-r border-white/8
          transform transition-transform duration-300
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 lg:sticky lg:top-0
        `}
      >
        {content}
      </aside>
    </>
  )
}
