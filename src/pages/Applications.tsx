import { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, ApiError } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import { useNotifications } from '../context/NotificationsContext'
import ProfileModal from '../components/ProfileModal'
import ConfirmAcceptModal from '../components/ConfirmAcceptModal'
import ApplicationDetailModal from '../components/ApplicationDetailModal'

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
  const { markApplicationsSeen } = useNotifications()
  const navigate = useNavigate()
  const isOwner = user?.account_type === 'owner'

  type Tab = 'received' | 'sent'
  const [tab, setTab] = useState<Tab>('received')
  const [items, setItems] = useState<(JobApplication | CrewInquiry)[]>([])
  const [users, setUsers] = useState<Record<string, UserLite>>({})
  const [listings, setListings] = useState<Record<number, BaseListing>>({})
  const [loading, setLoading] = useState(true)
  const [actingOn, setActingOn] = useState<number | null>(null)
  const [profileUserId, setProfileUserId] = useState<string | null>(null)
  const [pendingAccept, setPendingAccept] = useState<{ id: number; name: string | null } | null>(null)
  const [openAppId, setOpenAppId] = useState<number | null>(null)

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

  useEffect(() => { markApplicationsSeen() }, [markApplicationsSeen])

  const requestAccept = (id: number) => {
    const item = items.find(it => it.id === id)
    if (!item) return
    const senderId = isJobAppList ? (item as JobApplication).crewmember_id : (item as CrewInquiry).owner_id
    const sender = users[senderId]
    const name = sender ? `${sender.first_name} ${sender.last_name}` : null
    setPendingAccept({ id, name })
  }

  const confirmAccept = async () => {
    if (!pendingAccept) return
    setActingOn(pendingAccept.id)
    try {
      const path = isJobAppList
        ? `/api/v1/job-applications/${pendingAccept.id}/accept`
        : `/api/v1/crew-inquiries/${pendingAccept.id}/accept`
      const res = await api.post<{ conversation: { id: number } }>(path, {})
      setPendingAccept(null)
      setOpenAppId(null)
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
      setOpenAppId(null)
    } catch (err) {
      alert((err as ApiError).detail ?? 'Failed to withdraw.')
    } finally {
      setActingOn(null)
    }
  }

  const tabReceivedLabel = isOwner ? 'Applications received' : 'Inquiries received'
  const tabSentLabel = isOwner ? 'My inquiries' : 'My applications'
  const isReceived = tab === 'received'

  // Group items by listing id
  const grouped = useMemo(() => {
    const map = new Map<number, (JobApplication | CrewInquiry)[]>()
    items.forEach(it => {
      const lid = isJobAppList ? (it as JobApplication).jobposting_id : (it as CrewInquiry).crew_listing_id
      if (!map.has(lid)) map.set(lid, [])
      map.get(lid)!.push(it)
    })
    // Sort each group by created_at desc, then sort groups by latest activity desc
    const groups: { listingId: number; entries: (JobApplication | CrewInquiry)[] }[] = []
    map.forEach((entries, listingId) => {
      entries.sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at))
      groups.push({ listingId, entries })
    })
    groups.sort((a, b) => {
      const aLatest = +new Date(a.entries[0]?.created_at ?? 0)
      const bLatest = +new Date(b.entries[0]?.created_at ?? 0)
      return bLatest - aLatest
    })
    return groups
  }, [items, isJobAppList])

  const openItem = openAppId != null ? items.find(it => it.id === openAppId) ?? null : null
  const openSender = openItem
    ? users[isJobAppList ? (openItem as JobApplication).crewmember_id : (openItem as CrewInquiry).owner_id] ?? null
    : null
  const openListing = openItem
    ? listings[isJobAppList ? (openItem as JobApplication).jobposting_id : (openItem as CrewInquiry).crew_listing_id] ?? null
    : null

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
          <div className="space-y-6">
            {grouped.map(({ listingId, entries }) => {
              const listing = listings[listingId]
              const pendingCount = entries.filter(e => e.status === 'pending').length
              const total = entries.length

              return (
                <section key={listingId} className="bg-navy-light border border-white/8 rounded-2xl overflow-hidden">

                  {/* Group header */}
                  <header className="px-5 py-4 bg-navy/40 border-b border-white/8">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div className="min-w-0 flex-1">
                        {listing ? (
                          <>
                            <div className="flex items-center gap-2 flex-wrap mb-1.5">
                              <span className="text-[10px] font-semibold tracking-[0.15em] uppercase px-2 py-0.5 rounded-full bg-gold/10 border border-gold/20 text-gold">
                                {ROLE_LABELS[listing.role] ?? listing.role}
                              </span>
                              {listing.location && (
                                <span className="text-[11px] text-cream/40">· {listing.location}</span>
                              )}
                            </div>
                            <h3 className="font-display text-base font-semibold text-cream">{listing.title}</h3>
                          </>
                        ) : (
                          <h3 className="font-display text-base font-semibold text-cream/60">Listing #{listingId}</h3>
                        )}
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-xs text-cream/55">
                          <span className="text-cream font-semibold">{total}</span> {total === 1 ? (isReceived ? (isOwner ? 'application' : 'inquiry') : (isOwner ? 'inquiry' : 'application')) : (isReceived ? (isOwner ? 'applications' : 'inquiries') : (isOwner ? 'inquiries' : 'applications'))}
                        </p>
                        {pendingCount > 0 && (
                          <p className="text-[11px] text-gold mt-0.5">{pendingCount} pending</p>
                        )}
                      </div>
                    </div>
                  </header>

                  {/* Rows */}
                  <ul className="divide-y divide-white/5">
                    {entries.map(it => {
                      const senderId = isJobAppList ? (it as JobApplication).crewmember_id : (it as CrewInquiry).owner_id
                      const sender = users[senderId]
                      const initials = sender ? `${sender.first_name[0]}${sender.last_name[0]}`.toUpperCase() : '?'
                      const senderName = sender ? `${sender.first_name} ${sender.last_name}` : 'Unknown'
                      const preview = it.message?.split('\n')[0]?.slice(0, 90) ?? ''

                      return (
                        <li key={it.id}>
                          <button
                            type="button"
                            onClick={() => setOpenAppId(it.id)}
                            className="w-full text-left px-5 py-3.5 flex items-center gap-3 hover:bg-white/[0.03] transition-colors group"
                          >
                            <div className="w-9 h-9 rounded-full overflow-hidden bg-gold/10 border border-gold/20 flex items-center justify-center flex-shrink-0">
                              {sender?.photo_url ? (
                                <img src={sender.photo_url} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <span className="font-display text-[11px] font-semibold text-gold">{initials}</span>
                              )}
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="text-sm font-medium text-cream group-hover:text-gold transition-colors truncate">
                                  {isReceived ? senderName : `To ${senderName}`}
                                </p>
                                <span className={`text-[9px] font-semibold tracking-wider uppercase px-1.5 py-0.5 rounded-full border ${STATUS_PILL[it.status]}`}>
                                  {it.status}
                                </span>
                              </div>
                              {preview && (
                                <p className="text-[11px] text-cream/45 truncate mt-0.5">{preview}</p>
                              )}
                            </div>

                            <div className="text-right flex-shrink-0 hidden sm:block">
                              <p className="text-[11px] text-cream/35">{formatDate(it.created_at)}</p>
                            </div>

                            <svg className="w-4 h-4 text-cream/30 group-hover:text-gold/70 transition-colors flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </button>
                        </li>
                      )
                    })}
                  </ul>
                </section>
              )
            })}
          </div>
        )}
      </div>

      <ProfileModal
        isOpen={!!profileUserId}
        onClose={() => setProfileUserId(null)}
        userId={profileUserId}
      />

      <ConfirmAcceptModal
        isOpen={!!pendingAccept}
        onClose={() => setPendingAccept(null)}
        onConfirm={confirmAccept}
        loading={actingOn != null && actingOn === pendingAccept?.id}
        personName={pendingAccept?.name ?? null}
      />

      <ApplicationDetailModal
        isOpen={openItem != null}
        onClose={() => setOpenAppId(null)}
        status={openItem?.status ?? 'pending'}
        message={openItem?.message ?? null}
        cvUrl={openItem ? (openItem as JobApplication).cv_url ?? null : null}
        createdAt={openItem?.created_at ?? new Date().toISOString()}
        sender={openSender}
        listing={openListing}
        isReceived={isReceived}
        acting={actingOn != null && actingOn === openAppId}
        onAccept={isReceived && openItem?.status === 'pending' ? () => requestAccept(openItem!.id) : undefined}
        onReject={isReceived && openItem?.status === 'pending' ? () => reject(openItem!.id) : undefined}
        onWithdraw={!isReceived && openItem?.status === 'pending' ? () => withdraw(openItem!.id) : undefined}
        onOpenProfile={openSender ? () => setProfileUserId(openSender.id) : undefined}
      />
    </div>
  )
}
