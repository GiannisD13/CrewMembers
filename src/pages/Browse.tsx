import { useState, useEffect, useMemo } from 'react'
import { api } from '../lib/api'
import { useAuth } from '../context/AuthContext'

interface BaseListing {
  id: number
  schedule_id: number
  title: string
  role: string
  description: string | null
  location: string | null
  is_active: boolean
  created_at: string
}

interface JobPosting extends BaseListing {
  owner_id: string
  salary: string | number | null
}

interface CrewListingItem extends BaseListing {
  crew_member_id: string
}

type Listing = JobPosting | CrewListingItem

const CREW_ROLES = [
  { value: 'captain',    label: 'Captain' },
  { value: 'first_mate', label: 'First Mate' },
  { value: 'chef',       label: 'Chef / Cook' },
  { value: 'engineer',   label: 'Engineer' },
  { value: 'sailor',     label: 'Sailor' },
  { value: 'steward',    label: 'Steward / Stewardess' },
  { value: 'deckhand',   label: 'Deckhand' },
]

const ROLE_LABELS: Record<string, string> = Object.fromEntries(CREW_ROLES.map(r => [r.value, r.label]))

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
}

export default function Browse() {
  const { user } = useAuth()
  const isCrewUser = user?.account_type === 'crew'

  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)

  // Server-applied filters (backend supports)
  const [role, setRole]         = useState('')
  const [location, setLocation] = useState('')
  const [minSalary, setMinSalary] = useState('')

  // Client-only search
  const [search, setSearch] = useState('')

  const apiPath = isCrewUser ? '/api/v1/job-postings' : '/api/v1/crew-listings'
  const heading = isCrewUser ? 'Browse Positions' : 'Browse Crew'
  const subhead = isCrewUser
    ? 'Open positions from yacht owners looking for crew.'
    : 'Crew members currently available for hire.'

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams()
    if (role)      params.set('role', role)
    if (location)  params.set('location', location)
    if (isCrewUser && minSalary) params.set('min_salary', minSalary)
    const qs = params.toString()
    const url = qs ? `${apiPath}?${qs}` : apiPath

    api.get<Listing[]>(url)
      .then(setListings)
      .catch(() => setListings([]))
      .finally(() => setLoading(false))
  }, [role, location, minSalary, apiPath, isCrewUser])

  const filtered = useMemo(() => {
    if (!search.trim()) return listings
    const q = search.toLowerCase()
    return listings.filter(l =>
      l.title.toLowerCase().includes(q) ||
      (l.description ?? '').toLowerCase().includes(q) ||
      (l.location ?? '').toLowerCase().includes(q)
    )
  }, [listings, search])

  const clearFilters = () => { setRole(''); setLocation(''); setMinSalary(''); setSearch('') }
  const hasFilters = role || location || minSalary || search

  return (
    <div>

      {/* ── Header ───────────────────────────────────────────────── */}
      <div className="px-4 sm:px-6 lg:px-10 pt-6 lg:pt-10 pb-6">
        <p className="text-[10px] font-semibold tracking-[0.25em] uppercase text-gold mb-2">
          {isCrewUser ? 'Open Positions' : 'Available Crew'}
        </p>
        <h1 className="font-display text-2xl lg:text-3xl font-semibold text-cream mb-1">{heading}</h1>
        <p className="text-sm text-cream/40">{subhead}</p>
      </div>

      {/* ── Filters ──────────────────────────────────────────────── */}
      <div className="sticky top-0 lg:top-0 z-20 bg-navy/95 backdrop-blur-md border-y border-white/5 px-4 sm:px-6 lg:px-10 py-3">
        <div className="flex flex-wrap gap-2 items-center">

          {/* Search */}
          <div className="relative flex-1 min-w-[180px] max-w-md">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cream/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search title, description…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-3 py-2 text-sm text-cream placeholder-cream/25 focus:outline-none focus:border-gold/50 transition-colors"
            />
          </div>

          {/* Role */}
          <select
            value={role}
            onChange={e => setRole(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-cream/70 focus:outline-none focus:border-gold/50 cursor-pointer"
          >
            <option value="" className="bg-navy-mid">All roles</option>
            {CREW_ROLES.map(r => (
              <option key={r.value} value={r.value} className="bg-navy-mid">{r.label}</option>
            ))}
          </select>

          {/* Location */}
          <input
            type="text"
            placeholder="Location"
            value={location}
            onChange={e => setLocation(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-cream/80 placeholder-cream/30 focus:outline-none focus:border-gold/50 w-36"
          />

          {/* Min salary (jobs only) */}
          {isCrewUser && (
            <input
              type="number"
              min="0"
              step="100"
              placeholder="Min salary €"
              value={minSalary}
              onChange={e => setMinSalary(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-cream/80 placeholder-cream/30 focus:outline-none focus:border-gold/50 w-36"
            />
          )}

          {hasFilters && (
            <button
              onClick={clearFilters}
              className="text-xs font-medium text-cream/40 hover:text-cream/70 transition-colors flex items-center gap-1.5"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Clear
            </button>
          )}

          <span className="text-xs text-cream/30 ml-auto">
            {loading ? 'Loading…' : `${filtered.length} result${filtered.length !== 1 ? 's' : ''}`}
          </span>
        </div>
      </div>

      {/* ── Grid ─────────────────────────────────────────────────── */}
      <div className="px-4 sm:px-6 lg:px-10 py-8">

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="w-6 h-6 border-2 border-gold border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-navy-light border border-dashed border-white/10 rounded-2xl py-16 px-6 text-center">
            <div className="text-3xl opacity-30 mb-3">⚓</div>
            <p className="text-cream/50 text-sm mb-3">
              {hasFilters ? 'No listings match your filters.' : 'No listings available right now.'}
            </p>
            {hasFilters && (
              <button onClick={clearFilters} className="text-xs font-semibold text-gold hover:text-gold-light transition-colors">
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
            {filtered.map(item => (
              <article
                key={item.id}
                className="bg-navy-light border border-white/10 rounded-2xl p-5 hover:border-gold/30 hover:shadow-[0_0_30px_rgba(196,151,58,0.08)] transition-all cursor-pointer"
              >
                <div className="flex items-start justify-between mb-3">
                  <span className="text-[10px] font-semibold tracking-[0.15em] uppercase px-2 py-0.5 rounded-full bg-gold/10 border border-gold/20 text-gold">
                    {ROLE_LABELS[item.role] ?? item.role}
                  </span>
                  <span className="text-[10px] text-cream/30">{formatDate(item.created_at)}</span>
                </div>

                <h3 className="font-display text-lg font-semibold text-cream mb-3 line-clamp-2">{item.title}</h3>

                <div className="space-y-1.5 mb-4 text-xs text-cream/55">
                  {item.location && (
                    <div className="flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span className="truncate">{item.location}</span>
                    </div>
                  )}
                  {isCrewUser && (item as JobPosting).salary != null && (
                    <div className="flex items-center gap-1.5 text-gold">
                      <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="font-medium">€{Number((item as JobPosting).salary).toLocaleString()} / month</span>
                    </div>
                  )}
                </div>

                {item.description && (
                  <p className="text-xs text-cream/45 line-clamp-3">{item.description}</p>
                )}
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
