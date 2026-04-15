import { useState, useEffect, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import JobCard from '../components/JobCard'
import CrewCard from '../components/CrewCard'
import Footer from '../components/Footer'
import { mockJobs, mockCrew } from '../data/mockData'
import type { TabType } from '../types'

const ALL_ROLES = ['Captain', 'First Mate', 'Deckhand', 'Engineer', 'Chef', 'Stewardess', 'Skipper']
const ALL_LOCATIONS = ['Greece', 'Croatia', 'Portugal', 'Monaco', 'Italy', 'Spain']

export default function Browse() {
  const [searchParams, setSearchParams] = useSearchParams()
  const initialTab = (searchParams.get('tab') as TabType) ?? 'jobs'

  const [tab, setTab]               = useState<TabType>(initialTab)
  const [search, setSearch]         = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('')
  const [locFilter, setLocFilter]   = useState<string>('')

  // Sync tab with URL param
  useEffect(() => {
    setSearchParams(prev => { prev.set('tab', tab); return prev }, { replace: true })
  }, [tab, setSearchParams])

  // Scroll reveal
  useEffect(() => {
    const els = document.querySelectorAll('.reveal')
    const obs = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target) } }),
      { threshold: 0.08 }
    )
    els.forEach(el => obs.observe(el))
    return () => obs.disconnect()
  }, [tab])

  const filteredJobs = useMemo(() =>
    mockJobs.filter(j => {
      const q = search.toLowerCase()
      const matchSearch = !q || j.vesselName.toLowerCase().includes(q) || j.route.from.toLowerCase().includes(q) || j.route.to.toLowerCase().includes(q)
      const matchRole   = !roleFilter || j.rolesNeeded.some(r => r.toLowerCase().includes(roleFilter.toLowerCase()))
      const matchLoc    = !locFilter  || j.location === locFilter
      return matchSearch && matchRole && matchLoc
    }),
  [search, roleFilter, locFilter])

  const filteredCrew = useMemo(() =>
    mockCrew.filter(c => {
      const q = search.toLowerCase()
      const matchSearch = !q || c.name.toLowerCase().includes(q) || c.primaryRole.toLowerCase().includes(q)
      const matchRole   = !roleFilter || c.roles.some(r => r.toLowerCase().includes(roleFilter.toLowerCase()))
      return matchSearch && matchRole
    }),
  [search, roleFilter])

  const clearFilters = () => { setSearch(''); setRoleFilter(''); setLocFilter('') }
  const hasFilters   = search || roleFilter || locFilter

  return (
    <div className="min-h-screen bg-navy-mid">

      {/* ── Page header ──────────────────────────────────────────── */}
      <div className="bg-navy border-b border-white/5 pt-24 pb-10 px-6 lg:px-10">
        <div className="max-w-7xl mx-auto">
          <p className="text-[10px] font-semibold tracking-[0.25em] uppercase text-gold mb-3">
            {tab === 'jobs' ? 'Open Positions' : 'Available Crew'}
          </p>
          <h1 className="font-display text-3xl md:text-4xl font-bold text-cream mb-6 leading-tight">
            {tab === 'jobs'
              ? <>Find your next <em className="italic text-gold-light">voyage.</em></>
              : <>Find the right <em className="italic text-gold-light">crew.</em></>}
          </h1>

          {/* Tabs */}
          <div className="flex gap-1 bg-white/5 p-1 rounded-xl w-fit">
            {(['jobs', 'crew'] as TabType[]).map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
                  tab === t
                    ? 'bg-gold text-navy font-semibold'
                    : 'text-cream/50 hover:text-cream'
                }`}
              >
                {t === 'jobs' ? 'Open Positions' : 'Available Crew'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Filters bar ──────────────────────────────────────────── */}
      <div className="bg-navy/80 backdrop-blur-sm border-b border-white/5 px-6 lg:px-10 py-4 sticky top-16 z-30">
        <div className="max-w-7xl mx-auto flex flex-wrap gap-3 items-center">

          {/* Search */}
          <div className="relative flex-1 min-w-48 max-w-sm">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cream/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder={tab === 'jobs' ? 'Search vessel, route…' : 'Search name, role…'}
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-white/5 border border-white/8 rounded-lg pl-9 pr-4 py-2 text-sm text-cream placeholder-cream/25 focus:outline-none focus:border-gold/50 transition-colors"
            />
          </div>

          {/* Role filter */}
          <select
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value)}
            className="bg-white/5 border border-white/8 rounded-lg px-3 py-2 text-sm text-cream/70 focus:outline-none focus:border-gold/50 transition-colors cursor-pointer"
          >
            <option value="">All roles</option>
            {ALL_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
          </select>

          {/* Location filter (jobs only) */}
          {tab === 'jobs' && (
            <select
              value={locFilter}
              onChange={e => setLocFilter(e.target.value)}
              className="bg-white/5 border border-white/8 rounded-lg px-3 py-2 text-sm text-cream/70 focus:outline-none focus:border-gold/50 transition-colors cursor-pointer"
            >
              <option value="">All locations</option>
              {ALL_LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          )}

          {/* Clear filters */}
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

          {/* Result count */}
          <span className="text-xs text-cream/30 ml-auto">
            {tab === 'jobs' ? filteredJobs.length : filteredCrew.length} result{(tab === 'jobs' ? filteredJobs.length : filteredCrew.length) !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* ── Grid ─────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-10">

        {tab === 'jobs' && (
          filteredJobs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredJobs.map((job, i) => (
                <div key={job.id} className={`reveal reveal-d${(i % 3) + 1}`}>
                  <JobCard job={job} />
                </div>
              ))}
            </div>
          ) : (
            <EmptyState message="No positions match your filters." onClear={clearFilters} />
          )
        )}

        {tab === 'crew' && (
          filteredCrew.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredCrew.map((member, i) => (
                <div key={member.id} className={`reveal reveal-d${(i % 3) + 1}`}>
                  <CrewCard member={member} />
                </div>
              ))}
            </div>
          ) : (
            <EmptyState message="No crew members match your filters." onClear={clearFilters} />
          )
        )}
      </div>

      <Footer />
    </div>
  )
}

function EmptyState({ message, onClear }: { message: string; onClear: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-28 text-center">
      <div className="text-5xl mb-5 opacity-30">⚓</div>
      <p className="text-cream/40 text-sm mb-4">{message}</p>
      <button onClick={onClear} className="text-xs font-semibold text-gold border border-gold/30 px-4 py-2 rounded-lg hover:bg-gold hover:text-navy transition-all">
        Clear filters
      </button>
    </div>
  )
}
