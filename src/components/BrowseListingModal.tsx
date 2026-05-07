import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, ApiError } from '../lib/api'
import ProfileModal from './ProfileModal'

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

interface BrowseListingModalProps {
  isOpen: boolean
  onClose: () => void
  listing: Listing | null
  type: 'job' | 'crew'   // type of listing being viewed
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

const ROLE_LABELS: Record<string, string> = {
  captain: 'Captain', first_mate: 'First Mate', chef: 'Chef / Cook',
  engineer: 'Engineer', sailor: 'Sailor', steward: 'Steward / Stewardess', deckhand: 'Deckhand',
}
const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const inputCls = 'w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-cream placeholder-cream/20 focus:outline-none focus:border-gold/60 transition-all'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function BrowseListingModal({ isOpen, onClose, listing, type }: BrowseListingModalProps) {
  const navigate = useNavigate()
  const cvRef = useRef<HTMLInputElement>(null)

  const [schedule, setSchedule] = useState<Schedule | null>(null)
  const [media, setMedia] = useState<MediaItem[]>([])
  const [poster, setPoster] = useState<UserLite | null>(null)
  const [photoIdx, setPhotoIdx] = useState(0)

  const [showApply, setShowApply] = useState(false)
  const [message, setMessage] = useState('')
  const [cvFile, setCvFile] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitMsg, setSubmitMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [profileOpen, setProfileOpen] = useState(false)

  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen || !listing) return
    setShowApply(false)
    setMessage('')
    setCvFile(null)
    setSubmitMsg(null)
    setPhotoIdx(0)

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

    const posterId = type === 'job'
      ? (listing as JobPosting).owner_id
      : (listing as CrewListing).crew_member_id
    api.get<UserLite>(`/api/v1/users/${posterId}`)
      .then(setPoster)
      .catch(() => setPoster(null))
  }, [isOpen, listing?.id, type])

  const handleSubmit = async () => {
    if (!listing) return
    setSubmitting(true)
    setSubmitMsg(null)
    try {
      let cv_url: string | undefined
      if (type === 'job' && cvFile) {
        const res = await api.postFile<{ url: string }>('/api/v1/uploads/cv', cvFile)
        cv_url = res.url
      }
      if (type === 'job') {
        const body: Record<string, unknown> = { jobposting_id: listing.id }
        if (message.trim()) body.message = message.trim()
        if (cv_url) body.cv_url = cv_url
        await api.post('/api/v1/job-applications', body)
        setSubmitMsg({ type: 'success', text: 'Application sent! The owner will review it.' })
      } else {
        const body: Record<string, unknown> = { crew_listing_id: listing.id }
        if (message.trim()) body.message = message.trim()
        await api.post('/api/v1/crew-inquiries', body)
        setSubmitMsg({ type: 'success', text: 'Inquiry sent! The crew member will review it.' })
      }
      setMessage('')
      setCvFile(null)
      setTimeout(() => {
        onClose()
        navigate('/applications')
      }, 1500)
    } catch (err) {
      setSubmitMsg({ type: 'error', text: (err as ApiError).detail ?? 'Failed to submit.' })
    } finally {
      setSubmitting(false)
    }
  }

  if (!listing) return null

  const salary = type === 'job' ? (listing as JobPosting).salary : null
  const ownerLabel = type === 'job' ? 'Posted by' : 'Crew member'

  return (
    <div
      className={`fixed inset-0 z-[60] transition-opacity duration-300 ${
        isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
      role="dialog"
      aria-modal="true"
    >
      <div onClick={onClose} className="absolute inset-0 bg-navy/80 backdrop-blur-md" />

      <div className="relative h-full lg:h-auto lg:my-8 mx-auto w-full lg:max-w-3xl lg:max-h-[calc(100vh-4rem)] flex flex-col bg-navy-mid lg:rounded-2xl border border-white/10 shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-start justify-between px-6 py-4 border-b border-white/8 flex-shrink-0">
          <div className="min-w-0">
            <span className="text-[10px] font-semibold tracking-[0.15em] uppercase px-2 py-0.5 rounded-full bg-gold/10 border border-gold/20 text-gold inline-block mb-1.5">
              {ROLE_LABELS[listing.role] ?? listing.role}
            </span>
            <h2 className="font-display text-xl font-semibold text-cream truncate">{listing.title}</h2>
            <p className="text-xs text-cream/35 mt-0.5">Posted {formatDate(listing.created_at)}</p>
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
        <div className="flex-1 overflow-y-auto">

          {/* Photos carousel (jobs only) */}
          {type === 'job' && media.length > 0 && (
            <div className="relative bg-navy aspect-[16/9] sm:aspect-[2/1] overflow-hidden">
              <img src={media[photoIdx].url} alt="" className="w-full h-full object-cover" />
              {media.length > 1 && (
                <>
                  <button
                    onClick={() => setPhotoIdx(i => (i - 1 + media.length) % media.length)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-navy/70 hover:bg-navy text-cream backdrop-blur-sm flex items-center justify-center transition-colors"
                    aria-label="Previous"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setPhotoIdx(i => (i + 1) % media.length)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-navy/70 hover:bg-navy text-cream backdrop-blur-sm flex items-center justify-center transition-colors"
                    aria-label="Next"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                    {media.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setPhotoIdx(i)}
                        className={`w-2 h-2 rounded-full transition-all ${
                          i === photoIdx ? 'bg-gold w-6' : 'bg-cream/40 hover:bg-cream/60'
                        }`}
                        aria-label={`Photo ${i + 1}`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          <div className="px-6 py-6 space-y-6">

            {/* Meta */}
            <div className="flex flex-wrap gap-2 text-xs">
              {listing.location && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-cream/70">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {listing.location}
                </span>
              )}
              {salary != null && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gold/10 border border-gold/25 text-gold font-semibold">
                  €{Number(salary).toLocaleString()} / month
                </span>
              )}
            </div>

            {/* Description */}
            {listing.description && (
              <section>
                <h3 className="text-[10px] font-semibold tracking-[0.2em] uppercase text-gold/70 mb-2">Description</h3>
                <p className="text-sm text-cream/75 leading-relaxed whitespace-pre-wrap">{listing.description}</p>
              </section>
            )}

            {/* Schedule */}
            {schedule && (
              <section>
                <h3 className="text-[10px] font-semibold tracking-[0.2em] uppercase text-gold/70 mb-2">Availability</h3>
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

            {/* Poster info */}
            {poster && (
              <section>
                <h3 className="text-[10px] font-semibold tracking-[0.2em] uppercase text-gold/70 mb-2">{ownerLabel}</h3>
                <button
                  type="button"
                  onClick={() => setProfileOpen(true)}
                  className="flex items-center gap-3 group"
                >
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-gold/10 border border-gold/20 group-hover:ring-2 group-hover:ring-gold/40 flex items-center justify-center flex-shrink-0 transition-all">
                    {poster.photo_url ? (
                      <img src={poster.photo_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="font-display text-sm font-semibold text-gold">
                        {`${poster.first_name[0]}${poster.last_name[0]}`.toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium text-cream group-hover:text-gold transition-colors">{poster.first_name} {poster.last_name}</p>
                    <p className="text-[10px] text-cream/35 group-hover:text-gold/60 transition-colors">View profile</p>
                  </div>
                </button>
              </section>
            )}

            {/* Apply form */}
            {showApply ? (
              <section className="bg-white/3 border border-gold/25 rounded-2xl p-5 space-y-4">
                <div>
                  <h3 className="font-display text-base font-semibold text-cream">
                    {type === 'job' ? 'Apply for this position' : 'Send inquiry'}
                  </h3>
                  <p className="text-xs text-cream/45 mt-0.5">
                    {type === 'job'
                      ? 'Introduce yourself and attach your CV.'
                      : 'Let the crew member know why you’d like to work together.'}
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-medium text-cream/60 mb-1.5">Message</label>
                  <textarea
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    rows={4}
                    placeholder={type === 'job'
                      ? 'A short note about your experience and availability…'
                      : 'A short note about your vessel and what you’re looking for…'}
                    className={`${inputCls} resize-none`}
                  />
                </div>

                {type === 'job' && (
                  <div>
                    <label className="block text-xs font-medium text-cream/60 mb-1.5">
                      CV <span className="text-cream/30">(PDF — strongly recommended)</span>
                    </label>
                    {cvFile ? (
                      <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-white/5 border border-white/10">
                        <div className="flex items-center gap-2 min-w-0">
                          <svg className="w-4 h-4 text-gold flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <span className="text-sm text-cream/80 truncate">{cvFile.name}</span>
                        </div>
                        <button
                          onClick={() => setCvFile(null)}
                          className="text-xs text-cream/50 hover:text-red-400 transition-colors"
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => cvRef.current?.click()}
                        className="w-full px-4 py-3 rounded-xl border-2 border-dashed border-white/15 hover:border-gold/40 hover:bg-white/5 transition-all flex items-center justify-center gap-2 text-cream/50 hover:text-gold text-sm"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        Upload CV (PDF, up to 10 MB)
                      </button>
                    )}
                    <input
                      ref={cvRef}
                      type="file"
                      accept="application/pdf"
                      hidden
                      onChange={e => setCvFile(e.target.files?.[0] ?? null)}
                    />
                  </div>
                )}

                {submitMsg && (
                  <p className={`text-sm ${submitMsg.type === 'success' ? 'text-emerald-400' : 'text-red-400'}`}>
                    {submitMsg.text}
                  </p>
                )}

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    onClick={() => setShowApply(false)}
                    disabled={submitting}
                    className="px-4 py-2 rounded-xl text-sm font-medium text-cream/60 hover:text-cream hover:bg-white/5 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="bg-gold text-navy font-semibold text-sm px-5 py-2 rounded-xl hover:bg-gold-light transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {submitting
                      ? (type === 'job' ? 'Submitting…' : 'Sending…')
                      : (type === 'job' ? 'Submit application' : 'Send inquiry')}
                  </button>
                </div>
              </section>
            ) : (
              <div className="pt-2">
                <button
                  onClick={() => setShowApply(true)}
                  className="w-full sm:w-auto bg-gold text-navy font-semibold text-sm px-6 py-3 rounded-xl hover:bg-gold-light transition-colors"
                >
                  {type === 'job' ? 'Apply for this position' : 'Send inquiry'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <ProfileModal
        isOpen={profileOpen}
        onClose={() => setProfileOpen(false)}
        userId={poster?.id ?? null}
      />
    </div>
  )
}
