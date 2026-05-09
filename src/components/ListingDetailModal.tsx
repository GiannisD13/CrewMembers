import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, ApiError } from '../lib/api'
import ProfileModal from './ProfileModal'
import ConfirmAcceptModal from './ConfirmAcceptModal'

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

interface CrewListing extends BaseListing {
  crew_member_id: string
}

type Listing = JobPosting | CrewListing

interface ListingDetailModalProps {
  isOpen: boolean
  onClose: () => void
  onChange: () => void
  listing: Listing | null
  type: 'job' | 'crew'
}

interface Schedule {
  id: number
  availability_type: string
  start_date: string | null
  end_date: string | null
  recurring_days: number[] | null
  one_off_dates: string[] | null
}

interface MediaItem { id: number; url: string; order: number }

interface UserLite {
  id: string
  first_name: string
  last_name: string
  photo_url: string | null
  email: string
}

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
const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const inputCls = 'w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-cream placeholder-cream/20 focus:outline-none focus:border-gold/60 transition-all'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function ListingDetailModal({ isOpen, onClose, onChange, listing, type }: ListingDetailModalProps) {
  const navigate = useNavigate()
  const fileRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState({ title: '', role: '', description: '', location: '', salary: '' })
  const [savingFields, setSavingFields] = useState(false)
  const [fieldsMsg, setFieldsMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const [schedule, setSchedule] = useState<Schedule | null>(null)
  const [media, setMedia] = useState<MediaItem[]>([])
  const [photoUploading, setPhotoUploading] = useState(false)

  const [applications, setApplications] = useState<(JobApplication | CrewInquiry)[]>([])
  const [users, setUsers] = useState<Record<string, UserLite>>({})
  const [appsLoading, setAppsLoading] = useState(false)
  const [actingOn, setActingOn] = useState<number | null>(null)
  const [profileUserId, setProfileUserId] = useState<string | null>(null)
  const [pendingAccept, setPendingAccept] = useState<{ id: number; name: string | null } | null>(null)

  // Init form when listing changes
  useEffect(() => {
    if (!listing) return
    setForm({
      title: listing.title,
      role: listing.role,
      description: listing.description ?? '',
      location: listing.location ?? '',
      salary: type === 'job' && (listing as JobPosting).salary != null
        ? String((listing as JobPosting).salary)
        : '',
    })
    setFieldsMsg(null)
  }, [listing, type])

  // Lock body scroll
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  // Load schedule, media, applications in parallel when modal opens
  useEffect(() => {
    if (!isOpen || !listing) return

    api.get<Schedule>(`/api/v1/availability-schedules/${listing.schedule_id}`)
      .then(setSchedule)
      .catch(() => setSchedule(null))

    if (type === 'job') {
      api.get<MediaItem[]>(`/api/v1/job-postings/${listing.id}/media`)
        .then(m => setMedia([...m].sort((a, b) => a.order - b.order)))
        .catch(() => setMedia([]))
    } else {
      setMedia([])
    }

    loadApplications()
  }, [isOpen, listing?.id, type])

  const loadApplications = async () => {
    if (!listing) return
    setAppsLoading(true)
    try {
      const path = type === 'job'
        ? `/api/v1/job-postings/${listing.id}/applications`
        : `/api/v1/crew-listings/${listing.id}/inquiries`
      const data = await api.get<(JobApplication | CrewInquiry)[]>(path)
      setApplications(data)

      // Load each unique sender
      const ids = Array.from(new Set(data.map(a =>
        type === 'job' ? (a as JobApplication).crewmember_id : (a as CrewInquiry).owner_id
      )))
      const lookups = await Promise.all(ids.map(id =>
        api.get<UserLite>(`/api/v1/users/${id}`).catch(() => null)
      ))
      const map: Record<string, UserLite> = {}
      ids.forEach((id, i) => { if (lookups[i]) map[id] = lookups[i]! })
      setUsers(map)
    } catch {
      setApplications([])
    } finally {
      setAppsLoading(false)
    }
  }

  const isDirty = listing ? (
    form.title !== listing.title ||
    form.role !== listing.role ||
    form.description !== (listing.description ?? '') ||
    form.location !== (listing.location ?? '') ||
    (type === 'job' && form.salary !== (
      (listing as JobPosting).salary != null ? String((listing as JobPosting).salary) : ''
    ))
  ) : false

  const saveFields = async () => {
    if (!listing || !isDirty) return
    setSavingFields(true)
    setFieldsMsg(null)
    try {
      const body: Record<string, unknown> = {}
      if (form.title.trim() !== listing.title) body.title = form.title.trim()
      if (form.role !== listing.role) body.role = form.role
      if (form.description !== (listing.description ?? '')) {
        body.description = form.description.trim() || null
      }
      if (form.location !== (listing.location ?? '')) {
        body.location = form.location.trim() || null
      }
      if (type === 'job') {
        const cur = (listing as JobPosting).salary != null ? String((listing as JobPosting).salary) : ''
        if (form.salary !== cur) {
          body.salary = form.salary.trim() ? Number(form.salary) : null
        }
      }
      const path = type === 'job'
        ? `/api/v1/job-postings/${listing.id}`
        : `/api/v1/crew-listings/${listing.id}`
      await api.patch(path, body)
      setFieldsMsg({ type: 'success', text: 'Listing updated.' })
      onChange()
    } catch (err) {
      setFieldsMsg({ type: 'error', text: (err as ApiError).detail ?? 'Failed to save.' })
    } finally {
      setSavingFields(false)
    }
  }

  const handleAddPhotos = async (files: FileList | null) => {
    if (!files || !files.length || !listing || type !== 'job') return
    setPhotoUploading(true)
    try {
      const startOrder = media.length
      const uploaded: MediaItem[] = []
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        if (!file.type.startsWith('image/')) continue
        try {
          const { url } = await api.postFile<{ url: string }>('/api/v1/uploads/posting-media', file)
          const m = await api.post<MediaItem>(
            `/api/v1/job-postings/${listing.id}/media`,
            { url, order: startOrder + i },
          )
          uploaded.push(m)
        } catch {
          // skip failing file
        }
      }
      setMedia(prev => [...prev, ...uploaded].sort((a, b) => a.order - b.order))
    } finally {
      setPhotoUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const removeMedia = async (id: number) => {
    try {
      await api.delete(`/api/v1/job-postings/media/${id}`)
      setMedia(prev => prev.filter(m => m.id !== id))
    } catch (err) {
      alert((err as ApiError).detail ?? 'Failed to remove photo.')
    }
  }

  const requestAccept = (appId: number) => {
    const senderId = (() => {
      const app = applications.find(a => a.id === appId)
      if (!app) return null
      return type === 'job' ? (app as JobApplication).crewmember_id : (app as CrewInquiry).owner_id
    })()
    const sender = senderId ? users[senderId] : null
    const name = sender ? `${sender.first_name} ${sender.last_name}` : null
    setPendingAccept({ id: appId, name })
  }

  const confirmAccept = async () => {
    if (!listing || !pendingAccept) return
    setActingOn(pendingAccept.id)
    try {
      const path = type === 'job'
        ? `/api/v1/job-applications/${pendingAccept.id}/accept`
        : `/api/v1/crew-inquiries/${pendingAccept.id}/accept`
      const res = await api.post<{ conversation: { id: number } }>(path, {})
      setPendingAccept(null)
      onClose()
      navigate(`/messages/${res.conversation.id}`)
    } catch (err) {
      alert((err as ApiError).detail ?? 'Failed to accept.')
    } finally {
      setActingOn(null)
    }
  }

  const rejectApplication = async (appId: number) => {
    if (!confirm('Reject this application?')) return
    setActingOn(appId)
    try {
      const path = type === 'job'
        ? `/api/v1/job-applications/${appId}/reject`
        : `/api/v1/crew-inquiries/${appId}/reject`
      await api.post(path, {})
      setApplications(prev => prev.map(a => a.id === appId ? { ...a, status: 'rejected' } : a))
    } catch (err) {
      alert((err as ApiError).detail ?? 'Failed to reject.')
    } finally {
      setActingOn(null)
    }
  }

  if (!listing) return null

  return (
    <div
      className={`fixed inset-0 z-[60] transition-opacity duration-300 ${
        isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
      role="dialog"
      aria-modal="true"
    >
      <div onClick={onClose} className="absolute inset-0 bg-navy/80 backdrop-blur-md" />

      <div className="relative h-full lg:h-auto lg:my-8 mx-auto w-full lg:max-w-3xl lg:max-h-[calc(100vh-4rem)] flex flex-col bg-navy-mid lg:rounded-xl border border-white/10 shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-start justify-between px-6 py-4 border-b border-white/8 flex-shrink-0">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[10px] font-semibold tracking-[0.18em] uppercase px-2 py-0.5 rounded-md bg-gold/8 border border-gold/20 text-gold-light/90">
                {ROLE_LABELS[listing.role] ?? listing.role}
              </span>
              <span className={`text-[10px] font-semibold tracking-wider uppercase flex items-center gap-1.5 ${
                listing.is_active ? 'text-teal-light' : 'text-cream/30'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${listing.is_active ? 'bg-teal-light' : 'bg-cream/30'}`} />
                {listing.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
            <h2 className="font-display text-xl font-semibold tracking-tight text-cream truncate">{listing.title}</h2>
            <p className="text-xs font-light tracking-wide text-cream/40 mt-0.5">Posted {formatDate(listing.created_at)}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 -mr-2 text-cream/40 hover:text-cream/70 transition-colors flex-shrink-0"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-7">

          {/* Photos (jobs only) */}
          {type === 'job' && (
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-[10px] font-semibold tracking-[0.2em] uppercase text-gold-light/80">Vessel Photos</h3>
                <span className="text-[11px] text-cream/35">{media.length} {media.length === 1 ? 'photo' : 'photos'}</span>
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {media.map(m => (
                  <div key={m.id} className="relative aspect-square rounded-xl overflow-hidden border border-white/10 group">
                    <img src={m.url} alt="" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeMedia(m.id)}
                      className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-navy/80 text-cream/80 hover:text-red-400 transition-colors flex items-center justify-center backdrop-blur-sm opacity-0 group-hover:opacity-100"
                      aria-label="Remove"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  disabled={photoUploading}
                  className="aspect-square rounded-xl border-2 border-dashed border-white/15 hover:border-gold/40 hover:bg-white/5 transition-all flex flex-col items-center justify-center gap-1 text-cream/40 hover:text-gold disabled:opacity-50"
                >
                  {photoUploading ? (
                    <div className="w-5 h-5 border-2 border-gold border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M12 4v16m8-8H4" />
                      </svg>
                      <span className="text-[11px] font-medium">Add photos</span>
                    </>
                  )}
                </button>
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                hidden
                onChange={e => handleAddPhotos(e.target.files)}
              />
            </section>
          )}

          {/* Edit fields */}
          <section className="space-y-4">
            <h3 className="text-[10px] font-semibold tracking-[0.2em] uppercase text-gold-light/80">Listing Details</h3>

            <div>
              <label className="block text-xs font-medium text-cream/60 mb-1.5">Title</label>
              <input type="text" value={form.title}
                onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                className={inputCls} />
            </div>

            <div>
              <label className="block text-xs font-medium text-cream/60 mb-1.5">Role</label>
              <select value={form.role}
                onChange={e => setForm(p => ({ ...p, role: e.target.value }))}
                className={`${inputCls} appearance-none cursor-pointer`}>
                {CREW_ROLES.map(r => (
                  <option key={r.value} value={r.value} className="bg-navy-mid">{r.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-cream/60 mb-1.5">Description</label>
              <textarea value={form.description}
                onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                rows={4}
                className={`${inputCls} resize-none`} />
            </div>

            <div className={type === 'job' ? 'grid grid-cols-1 sm:grid-cols-2 gap-4' : ''}>
              <div>
                <label className="block text-xs font-medium text-cream/60 mb-1.5">Location</label>
                <input type="text" value={form.location}
                  onChange={e => setForm(p => ({ ...p, location: e.target.value }))}
                  className={inputCls} />
              </div>
              {type === 'job' && (
                <div>
                  <label className="block text-xs font-medium text-cream/60 mb-1.5">
                    Salary <span className="text-cream/25">(EUR/month)</span>
                  </label>
                  <input type="number" min="0" step="50" value={form.salary}
                    onChange={e => setForm(p => ({ ...p, salary: e.target.value }))}
                    className={inputCls} />
                </div>
              )}
            </div>

            {fieldsMsg && (
              <p className={`text-sm ${fieldsMsg.type === 'success' ? 'text-teal-light' : 'text-red-400/85'}`}>
                {fieldsMsg.text}
              </p>
            )}

            <div className="flex justify-end">
              <button
                onClick={saveFields}
                disabled={!isDirty || savingFields}
                className="bg-gold/95 text-navy font-semibold text-sm px-5 py-2 rounded-lg hover:bg-gold-light transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {savingFields ? 'Saving…' : 'Save changes'}
              </button>
            </div>
          </section>

          {/* Schedule (read-only display) */}
          {schedule && (
            <section className="space-y-2">
              <h3 className="text-[10px] font-semibold tracking-[0.2em] uppercase text-gold-light/80">Availability</h3>
              <div className="flex flex-wrap gap-2 text-xs">
                <span className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-cream/70 capitalize">
                  {schedule.availability_type}
                </span>
                {schedule.start_date && (
                  <span className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-cream/70">
                    From {formatDate(schedule.start_date)}
                  </span>
                )}
                {schedule.end_date && (
                  <span className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-cream/70">
                    To {formatDate(schedule.end_date)}
                  </span>
                )}
                {schedule.recurring_days && schedule.recurring_days.length > 0 && (
                  <span className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-cream/70">
                    {schedule.recurring_days.map(d => DAY_LABELS[d]).join(', ')}
                  </span>
                )}
                {schedule.one_off_dates && schedule.one_off_dates.length > 0 && (
                  <span className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-cream/70">
                    {schedule.one_off_dates.length} specific date{schedule.one_off_dates.length !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
            </section>
          )}

          {/* Applications received */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-[10px] font-semibold tracking-[0.2em] uppercase text-gold-light/80">
                {type === 'job' ? 'Applications' : 'Inquiries'} Received
              </h3>
              <span className="text-[11px] text-cream/35">{applications.length}</span>
            </div>

            {appsLoading ? (
              <div className="flex justify-center py-6">
                <div className="w-5 h-5 border-2 border-gold border-t-transparent rounded-full animate-spin" />
              </div>
            ) : applications.length === 0 ? (
              <div className="bg-white/3 border border-dashed border-white/10 rounded-xl py-8 text-center">
                <p className="text-sm text-cream/40">
                  No {type === 'job' ? 'applications' : 'inquiries'} yet.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {applications.map(app => {
                  const senderId = type === 'job'
                    ? (app as JobApplication).crewmember_id
                    : (app as CrewInquiry).owner_id
                  const sender = users[senderId]
                  const cv = (app as JobApplication).cv_url
                  const initials = sender ? `${sender.first_name[0]}${sender.last_name[0]}`.toUpperCase() : '?'

                  return (
                    <div key={app.id} className="bg-white/3 border border-white/8 rounded-xl p-4">
                      <div className="flex items-start gap-3">
                        <button
                          type="button"
                          onClick={() => setProfileUserId(senderId)}
                          className="w-10 h-10 rounded-full overflow-hidden bg-gold/10 border border-gold/20 hover:ring-2 hover:ring-gold/35 flex items-center justify-center flex-shrink-0 transition-all"
                        >
                          {sender?.photo_url ? (
                            <img src={sender.photo_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <span className="font-display text-sm font-semibold text-gold">{initials}</span>
                          )}
                        </button>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <button
                              type="button"
                              onClick={() => setProfileUserId(senderId)}
                              className="text-sm font-medium text-cream hover:text-gold-light/95 transition-colors text-left"
                            >
                              {sender ? `${sender.first_name} ${sender.last_name}` : 'Unknown user'}
                            </button>
                            <span className={`text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full ${
                              app.status === 'accepted' ? 'bg-teal-light/12 text-teal-light border border-teal-light/30'
                              : app.status === 'rejected' ? 'bg-red-500/12 text-red-400/85 border border-red-500/25'
                              : 'bg-gold/8 text-gold-light/95 border border-gold/25'
                            }`}>
                              {app.status}
                            </span>
                          </div>
                          <p className="text-[11px] font-light tracking-wide text-cream/40 mb-2">{formatDate(app.created_at)}</p>
                          {app.message && (
                            <p className="text-sm text-cream/70 mb-2 whitespace-pre-wrap">{app.message}</p>
                          )}
                          {cv && (
                            <a href={cv} target="_blank" rel="noreferrer"
                              className="inline-flex items-center gap-1.5 text-xs font-medium text-gold hover:text-gold-light transition-colors mb-2">
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              View CV (PDF)
                            </a>
                          )}
                          {app.status === 'pending' && (
                            <div className="flex gap-2 mt-2">
                              <button
                                onClick={() => requestAccept(app.id)}
                                disabled={actingOn === app.id}
                                className="text-xs font-semibold px-3 py-1.5 rounded-md bg-teal-light/12 border border-teal-light/30 text-teal-light hover:bg-teal-light/20 transition-colors disabled:opacity-50"
                              >
                                {actingOn === app.id ? 'Accepting…' : 'Accept'}
                              </button>
                              <button
                                onClick={() => rejectApplication(app.id)}
                                disabled={actingOn === app.id}
                                className="text-xs font-medium px-3 py-1.5 rounded-md bg-white/5 border border-white/10 text-cream/60 hover:text-red-400/85 hover:border-red-400/30 transition-colors disabled:opacity-50"
                              >
                                Reject
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </section>
        </div>
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
    </div>
  )
}
