import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, ApiError } from '../lib/api'
import { useAuth } from '../context/AuthContext'

type AppStatus = 'pending' | 'accepted' | 'rejected'

interface JobApplication {
  id: number
  crewmember_id: string
  jobposting_id: number
  message: string | null
  cv_url: string | null
  status: AppStatus
  created_at: string
}

interface CrewInquiry {
  id: number
  owner_id: string
  crew_listing_id: number
  message: string | null
  status: AppStatus
  created_at: string
}

interface BaseListing {
  id: number
  title: string
  role: string
  location: string | null
}

interface UserLite {
  id: string
  first_name: string
  last_name: string
  photo_url: string | null
}

const ROLE_LABELS: Record<string, string> = {
  captain: 'Captain', first_mate: 'First Mate', chef: 'Chef / Cook',
  engineer: 'Engineer', sailor: 'Sailor', steward: 'Steward / Stewardess', deckhand: 'Deckhand',
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

const STATUS_PILL: Record<AppStatus, string> = {
  pending: 'bg-gold/15 text-gold border-gold/25',
  accepted: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
  rejected: 'bg-red-500/15 text-red-400 border-red-500/25',
}

export default function Applications() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const isOwner = user?.account_type === 'owner'

  type Tab = 'received' | 'sent'
  const [tab, setTab] = useState<Tab>('received')
  const [items, setItems] = useState<(JobApplication | CrewInquiry)[]>([])
  const [users, setUsers] = useState<Record<string, UserLite>>({})
  const [listings, setListings] = useState<Record<number, BaseListing>>({})
  const [loading, setLoading] = useState(true)
  const [actingOn, setActingOn] = useState<number | null>(null)

  // Tab semantics:
  // OWNER:
  //   received → /job-applications/received   (crew applied to my postings) [accept/reject]
  //   sent     → /crew-inquiries/mine         (I inquired about crew listings)
  // CREW:
  //   received → /crew-inquiries/received     (owners inquired about my listings) [accept/reject]
  //   sent     → /job-applications/mine       (I applied to job postings)

  const isJobAppList = isOwner ? tab === 'received' : tab === 'sent'

  const apiPath = (() => {
    if (isOwner && tab === 'received') return '/api/v1/job-applications/received'
    if (isOwner && tab === 'sent')     return '/api/v1/crew-inquiries/mine'
    if (!isOwner && tab === 'received') return '/api/v1/crew-inquiries/received'
    return '/api/v1/job-applications/mine'
  })()

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const data = await api.get<(JobApplication | CrewInquiry)[]>(apiPath)
      setItems(data)

      // Fetch related users (for received tabs we want sender info)
      const userIds = Array.from(new Set(data.map(it =>
        isJobAppList ? (it as JobApplication).crewmember_id : (it as CrewInquiry).owner_id
      )))
      const userResults = await Promise.all(userIds.map(id =>
        users[id] ? Promise.resolve(users[id]) : api.get<UserLite>(`/api/v1/users/${id}`).catch(() => null)
      ))
      const userMap = { ...users }
      userIds.forEach((id, i) => {
        const u = userResults[i]
        if (u) userMap[id] = u
      })
      setUsers(userMap)

      // Fetch related listings (so we can show what the application/inquiry is about)
      const listingIds = Array.from(new Set(data.map(it =>
        isJobAppList ? (it as JobApplication).jobposting_id : (it as CrewInquiry).crew_listing_id
      )))
      const listingPath = isJobAppList ? '/api/v1/job-postings' : '/api/v1/crew-listings'
      const listingResults = await Promise.all(listingIds.map(id =>
        listings[id] ? Promise.resolve(listings[id]) : api.get<BaseListing>(`${listingPath}/${id}`).catch(() => null)
      ))
      const listingMap = { ...listings }
      listingIds.forEach((id, i) => {
        const l = listingResults[i]
        if (l) listingMap[id] = l
      })
      setListings(listingMap)
    } catch {
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [apiPath, isJobAppList])

  useEffect(() => { refresh() }, [refresh])

  const accept = async (id: number) => {
    setActingOn(id)
    try {
      const path = isJobAppList
        ? `/api/v1/job-applications/${id}/accept`
        : `/api/v1/crew-inquiries/${id}/accept`
      const res = await api.post<{ conversation: { id: number } }>(path, {})
      navigate(`/messages/${res.conversation.id}`)
    } catch (err) {
      alert((err as ApiError).detail ?? 'Failed to accept.')
    } finally {
      setActingOn(null)
    }
  }

  const reject = async (id: number) => {
    if (!confirm('Reject this?')) return
    setActingOn(id)
    try {
      const path = isJobAppList
        ? `/api/v1/job-applications/${id}/reject`
        : `/api/v1/crew-inquiries/${id}/reject`
      await api.post(path, {})
      setItems(prev => prev.map(it => it.id === id ? { ...it, status: 'rejected' } : it))
    } catch (err) {
      alert((err as ApiError).detail ?? 'Failed to reject.')
    } finally {
      setActingOn(null)
    }
  }

  const withdraw = async (id: number) => {
    if (!confirm('Withdraw this? This cannot be undone.')) return
    setActingOn(id)
    try {
      const path = isJobAppList
        ? `/api/v1/job-applications/${id}`
        : `/api/v1/crew-inquiries/${id}`
      await api.delete(path)
      setItems(prev => prev.filter(it => it.id !== id))
    } catch (err) {
      alert((err as ApiError).detail ?? 'Failed to withdraw.')
    } finally {
      setActingOn(null)
    }
  }

  const tabReceivedLabel = isOwner ? 'Applications received' : 'Inquiries received'
  const tabSentLabel = isOwner ? 'My inquiries' : 'My applications'
  const isReceived = tab === 'received'

  return (
    <div className="px-4 sm:px-6 lg:px-10 py-6 lg:py-10">
      <div className="max-w-4xl mx-auto">

        <div className="mb-6">
          <h1 className="font-display text-2xl lg:text-3xl font-semibold text-cream">Applications</h1>
          <p className="text-sm text-cream/40 mt-1">
            Manage applications and inquiries between you and the other side.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-navy-light rounded-xl border border-white/8 mb-6 w-full sm:w-auto sm:inline-flex">
          <button
            onClick={() => setTab('received')}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === 'received'
                ? 'bg-gold/15 text-gold border border-gold/25'
                : 'text-cream/55 hover:text-cream border border-transparent'
            }`}
          >
            {tabReceivedLabel}
          </button>
          <button
            onClick={() => setTab('sent')}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === 'sent'
                ? 'bg-gold/15 text-gold border border-gold/25'
                : 'text-cream/55 hover:text-cream border border-transparent'
            }`}
          >
            {tabSentLabel}
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-6 h-6 border-2 border-gold border-t-transparent rounded-full animate-spin" />
          </div>
        ) : items.length === 0 ? (
          <div className="bg-navy-light border border-dashed border-white/10 rounded-2xl py-16 text-center">
            <div className="text-3xl opacity-30 mb-3">📬</div>
            <p className="text-cream/50 text-sm">
              {isReceived
                ? `You have not received any ${isOwner ? 'applications' : 'inquiries'} yet.`
                : `You have not sent any ${isOwner ? 'inquiries' : 'applications'} yet.`}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map(it => {
              const senderId = isJobAppList ? (it as JobApplication).crewmember_id : (it as CrewInquiry).owner_id
              const listingId = isJobAppList ? (it as JobApplication).jobposting_id : (it as CrewInquiry).crew_listing_id
              const sender = users[senderId]
              const listing = listings[listingId]
              const cv = (it as JobApplication).cv_url
              const initials = sender ? `${sender.first_name[0]}${sender.last_name[0]}`.toUpperCase() : '?'

              return (
                <div key={it.id} className="bg-navy-light border border-white/8 rounded-2xl p-5">
                  <div className="flex items-start justify-between gap-3 mb-3 flex-wrap">
                    <div className="min-w-0">
                      {listing ? (
                        <>
                          <span className="text-[10px] font-semibold tracking-[0.15em] uppercase px-2 py-0.5 rounded-full bg-gold/10 border border-gold/20 text-gold inline-block mb-1.5">
                            {ROLE_LABELS[listing.role] ?? listing.role}
                          </span>
                          <h3 className="font-display text-base font-semibold text-cream">{listing.title}</h3>
                          {listing.location && (
                            <p className="text-xs text-cream/40 mt-0.5">{listing.location}</p>
                          )}
                        </>
                      ) : (
                        <h3 className="font-display text-base font-semibold text-cream/60">Listing #{listingId}</h3>
                      )}
                    </div>
                    <span className={`text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full border ${STATUS_PILL[it.status]}`}>
                      {it.status}
                    </span>
                  </div>

                  {/* Other party (only show on received tabs) */}
                  {isReceived && (
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-7 h-7 rounded-full overflow-hidden bg-gold/10 border border-gold/20 flex items-center justify-center flex-shrink-0">
                        {sender?.photo_url ? (
                          <img src={sender.photo_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span className="font-display text-[10px] font-semibold text-gold">{initials}</span>
                        )}
                      </div>
                      <p className="text-xs text-cream/65">
                        From <span className="text-cream font-medium">{sender ? `${sender.first_name} ${sender.last_name}` : 'Unknown'}</span>
                      </p>
                    </div>
                  )}

                  {it.message && (
                    <p className="text-sm text-cream/70 mb-3 whitespace-pre-wrap">{it.message}</p>
                  )}

                  {cv && (
                    <a href={cv} target="_blank" rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-gold hover:text-gold-light transition-colors mb-3">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      View CV (PDF)
                    </a>
                  )}

                  <div className="flex items-center justify-between gap-2 pt-3 border-t border-white/5 flex-wrap">
                    <span className="text-[11px] text-cream/35">{formatDate(it.created_at)}</span>
                    <div className="flex gap-2">
                      {isReceived && it.status === 'pending' && (
                        <>
                          <button
                            onClick={() => accept(it.id)}
                            disabled={actingOn === it.id}
                            className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/25 text-emerald-400 hover:bg-emerald-500/25 transition-colors disabled:opacity-50"
                          >
                            {actingOn === it.id ? 'Accepting…' : 'Accept'}
                          </button>
                          <button
                            onClick={() => reject(it.id)}
                            disabled={actingOn === it.id}
                            className="text-xs font-medium px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-cream/60 hover:text-red-400 hover:border-red-400/30 transition-colors disabled:opacity-50"
                          >
                            Reject
                          </button>
                        </>
                      )}
                      {!isReceived && it.status === 'pending' && (
                        <button
                          onClick={() => withdraw(it.id)}
                          disabled={actingOn === it.id}
                          className="text-xs font-medium px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-cream/60 hover:text-red-400 hover:border-red-400/30 transition-colors disabled:opacity-50"
                        >
                          Withdraw
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
