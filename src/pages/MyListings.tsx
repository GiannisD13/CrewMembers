import { useState, useEffect, useCallback, useMemo } from 'react'
import { api, ApiError } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import NewListingModal from '../components/NewListingModal'
import ListingDetailModal from '../components/ListingDetailModal'

interface BaseListing {
  id: number
  schedule_id: number
  title: string
  role: string
  description: string | null
  location: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

interface JobPosting extends BaseListing {
  owner_id: string
  salary: string | number | null
}

interface CrewListing extends BaseListing {
  crew_member_id: string
}

type Listing = JobPosting | CrewListing

interface ApplicationLite {
  id: number
  status: 'pending' | 'accepted' | 'rejected'
  created_at: string
}

const ROLE_LABELS: Record<string, string> = {
  captain: 'Captain', first_mate: 'First Mate', chef: 'Chef',
  engineer: 'Engineer', sailor: 'Sailor', steward: 'Steward', deckhand: 'Deckhand',
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function MyListings() {
  const { user } = useAuth()
  const isOwner = user?.account_type === 'owner'

  const [listings, setListings] = useState<Listing[]>([])
  const [applications, setApplications] = useState<ApplicationLite[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [selected, setSelected] = useState<Listing | null>(null)

  const path = isOwner ? '/api/v1/job-postings/mine' : '/api/v1/crew-listings/mine'
  const itemBase = isOwner ? '/api/v1/job-postings' : '/api/v1/crew-listings'
  const appsPath = isOwner ? '/api/v1/job-applications/received' : '/api/v1/crew-inquiries/received'

  const refresh = useCallback(async () => {
    try {
      const [listingsData, appsData] = await Promise.all([
        api.get<Listing[]>(path),
        api.get<ApplicationLite[]>(appsPath).catch(() => [] as ApplicationLite[]),
      ])
      setListings(listingsData)
      setApplications(appsData)
    } catch {
      setListings([])
      setApplications([])
    } finally {
      setLoading(false)
    }
  }, [path, appsPath])

  useEffect(() => { refresh() }, [refresh])

  const toggleActive = async (id: number, current: boolean) => {
    try {
      await api.patch(`${itemBase}/${id}`, { is_active: !current })
      setListings(prev => prev.map(l => l.id === id ? { ...l, is_active: !current } : l))
    } catch (err) {
      alert((err as ApiError).detail ?? 'Failed to update.')
    }
  }

  const remove = async (id: number) => {
    if (!confirm('Delete this listing? This cannot be undone.')) return
    try {
      await api.delete(`${itemBase}/${id}`)
      setListings(prev => prev.filter(l => l.id !== id))
    } catch (err) {
      alert((err as ApiError).detail ?? 'Failed to delete.')
    }
  }

  const stats = useMemo(() => {
    const total = listings.length
    const active = listings.filter(l => l.is_active).length
    const pending = applications.filter(a => a.status === 'pending').length
    const now = new Date()
    const acceptedThisMonth = applications.filter(a => {
      if (a.status !== 'accepted') return false
      const d = new Date(a.created_at)
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
    }).length
    return { total, active, pending, acceptedThisMonth }
  }, [listings, applications])

  const appNoun = isOwner ? 'application' : 'inquiry'
  const appNounPlural = isOwner ? 'applications' : 'inquiries'

  return (
    <div>
      <div className="px-4 sm:px-6 lg:px-10 py-6 lg:py-10">

        {/* Header */}
        <div className="flex flex-wrap items-end justify-between gap-4 mb-7">
          <div>
            <h1 className="font-display text-3xl lg:text-4xl font-semibold tracking-tight text-cream">
              My Listings
            </h1>
            <p className="text-xs sm:text-sm font-light text-cream/40 mt-1.5 tracking-wide">
              {isOwner ? 'Job postings you have published.' : 'Crew listings you have published.'}
            </p>
          </div>
          <button
            onClick={() => setModalOpen(true)}
            className="bg-gold/95 text-navy font-semibold text-sm px-4 py-2.5 rounded-lg hover:bg-gold-light transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            New Listing
          </button>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
          <StatCard
            label="Listings posted"
            value={stats.total}
            sub={null}
          />
          <StatCard
            label="Active now"
            value={stats.active}
            sub={stats.total > 0 ? `of ${stats.total} total` : null}
            accent="teal"
          />
          <StatCard
            label={`Pending ${appNounPlural}`}
            value={stats.pending}
            sub={stats.pending > 0 ? 'awaiting review' : null}
            accent={stats.pending > 0 ? 'gold' : undefined}
          />
          <StatCard
            label="Accepted this month"
            value={stats.acceptedThisMonth}
            sub={stats.acceptedThisMonth === 1 ? `${appNoun} welcomed` : `${appNounPlural} welcomed`}
          />
        </div>

        {/* Section label */}
        <div className="flex items-center justify-between mb-3">
          <p className="text-[10px] font-semibold tracking-[0.22em] uppercase text-cream/35">
            Your listings
          </p>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="w-6 h-6 border-2 border-gold border-t-transparent rounded-full animate-spin" />
          </div>
        ) : listings.length === 0 ? (
          <div className="bg-navy-light/80 border border-dashed border-white/12 rounded-xl py-16 px-6 text-center">
            <div className="w-12 h-12 rounded-lg bg-gold/10 border border-gold/20 flex items-center justify-center mx-auto mb-4">
              <svg className="w-5 h-5 text-gold-light/85" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <h3 className="font-display text-lg font-semibold text-cream mb-1">No listings yet</h3>
            <p className="text-xs sm:text-sm font-light text-cream/45 max-w-sm mx-auto mb-5 tracking-wide">
              {isOwner
                ? 'Post your first job to start receiving applications from professional crew.'
                : 'Create your first listing to let yacht owners discover you.'}
            </p>
            <button
              onClick={() => setModalOpen(true)}
              className="bg-gold/95 text-navy font-semibold text-sm px-4 py-2.5 rounded-lg hover:bg-gold-light transition-colors"
            >
              Create your first listing
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3 sm:gap-4">
            {listings.map(item => (
              <article
                key={item.id}
                onClick={() => setSelected(item)}
                className={`relative bg-navy-light border rounded-xl p-4 sm:p-5 transition-all cursor-pointer ${
                  item.is_active
                    ? 'border-white/12 hover:border-gold/35'
                    : 'border-white/8 bg-navy-light/55 hover:border-white/15'
                }`}
              >

                {/* Status pill */}
                <div className="flex items-center justify-between mb-3">
                  <span className={`inline-flex items-center gap-1.5 text-[10px] font-semibold tracking-[0.18em] uppercase ${
                    item.is_active ? 'text-teal-light' : 'text-cream/30'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${item.is_active ? 'bg-teal-light' : 'bg-cream/30'}`} />
                    {item.is_active ? 'Active' : 'Inactive'}
                  </span>
                  <span className="text-[10px] font-light tracking-wide text-cream/35">{formatDate(item.created_at)}</span>
                </div>

                {/* Title */}
                <h3 className={`font-display text-lg font-semibold tracking-tight mb-2 line-clamp-2 ${
                  item.is_active ? 'text-cream' : 'text-cream/70'
                }`}>
                  {item.title}
                </h3>

                {/* Role badge */}
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[10px] font-semibold tracking-[0.18em] uppercase px-2 py-0.5 rounded-md bg-gold/8 border border-gold/20 text-gold-light/90">
                    {ROLE_LABELS[item.role] ?? item.role}
                  </span>
                </div>

                {/* Meta */}
                <div className="space-y-1.5 mb-4 text-[11px] sm:text-xs font-light tracking-wide text-cream/45">
                  {item.location && (
                    <div className="flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.4}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span className="truncate">{item.location}</span>
                    </div>
                  )}
                  {isOwner && (item as JobPosting).salary != null && (
                    <div className="flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.4}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>€{Number((item as JobPosting).salary).toLocaleString()} / month</span>
                    </div>
                  )}
                </div>

                {/* Description */}
                {item.description && (
                  <p className="text-[11px] sm:text-xs font-light text-cream/45 line-clamp-2 mb-4 leading-relaxed">{item.description}</p>
                )}

                {/* Actions */}
                <div
                  className="flex items-center gap-2 pt-3 border-t border-white/6"
                  onClick={e => e.stopPropagation()}
                >
                  <button
                    onClick={() => toggleActive(item.id, item.is_active)}
                    className="flex-1 text-xs font-medium px-3 py-2 rounded-lg bg-white/5 text-cream/65 hover:bg-white/10 hover:text-cream transition-colors"
                  >
                    {item.is_active ? 'Deactivate' : 'Activate'}
                  </button>
                  <button
                    onClick={() => remove(item.id)}
                    className="px-3 py-2 rounded-lg text-cream/40 hover:text-red-400/80 hover:bg-red-500/10 transition-colors"
                    title="Delete"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3" />
                    </svg>
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}

        <NewListingModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          onSuccess={refresh}
          type={isOwner ? 'job' : 'crew'}
        />

        <ListingDetailModal
          isOpen={!!selected}
          onClose={() => setSelected(null)}
          onChange={refresh}
          listing={selected}
          type={isOwner ? 'job' : 'crew'}
        />
      </div>
    </div>
  )
}

interface StatCardProps {
  label: string
  value: number
  sub: string | null
  accent?: 'teal' | 'gold'
}

function StatCard({ label, value, sub, accent }: StatCardProps) {
  const valueClass =
    accent === 'teal' ? 'text-teal-light'
    : accent === 'gold' ? 'text-gold-light/95'
    : 'text-cream'

  return (
    <div className="bg-navy-light/85 border border-white/12 rounded-xl p-4 sm:p-5 backdrop-blur-[2px]">
      <p className="text-[10px] font-semibold tracking-[0.2em] uppercase text-cream/45 mb-2 sm:mb-3">
        {label}
      </p>
      <p className={`font-display text-2xl sm:text-3xl font-semibold tracking-tight ${valueClass}`}>
        {value}
      </p>
      {sub && (
        <p className="text-[10px] sm:text-[11px] font-light tracking-wide text-cream/35 mt-1">
          {sub}
        </p>
      )}
    </div>
  )
}
