import { useEffect, useState } from 'react'
import { api } from '../lib/api'

interface ProfileModalProps {
  isOpen: boolean
  onClose: () => void
  userId: string | null
}

interface UserBase {
  id: string
  email: string
  first_name: string
  last_name: string
  phone: string | null
  photo_url: string | null
  account_type: 'owner' | 'crew' | 'admin'
  is_active: boolean
  created_at: string
}

interface CrewProfile {
  user_id: string
  roles: string[]
  experience_years: number | null
  location: string | null
  nationality: string | null
  bio: string | null
  looking_for_job: boolean
  rating: number | null
}

interface OwnerProfile {
  user_id: string
  company_name: string | null
  description: string | null
  location: string | null
  rating: number | null
}

const ROLE_LABELS: Record<string, string> = {
  captain: 'Captain', first_mate: 'First Mate', chef: 'Chef / Cook',
  engineer: 'Engineer', sailor: 'Sailor', steward: 'Steward / Stewardess', deckhand: 'Deckhand',
}

function StarRating({ value }: { value: number | null }) {
  if (value == null) {
    return <span className="text-xs text-cream/35">No ratings yet</span>
  }
  const full = Math.round(value)
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex">
        {[1, 2, 3, 4, 5].map(i => (
          <svg
            key={i}
            className={`w-4 h-4 ${i <= full ? 'text-gold' : 'text-cream/15'}`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.957a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.366 2.446a1 1 0 00-.364 1.118l1.287 3.957c.3.922-.755 1.688-1.54 1.118l-3.366-2.446a1 1 0 00-1.176 0l-3.366 2.446c-.784.57-1.838-.196-1.539-1.118l1.286-3.957a1 1 0 00-.364-1.118L2.05 9.384c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69l1.286-3.957z" />
          </svg>
        ))}
      </div>
      <span className="text-xs text-cream/55 font-medium">{value.toFixed(1)} / 5</span>
    </div>
  )
}

export default function ProfileModal({ isOpen, onClose, userId }: ProfileModalProps) {
  const [base, setBase] = useState<UserBase | null>(null)
  const [crew, setCrew] = useState<CrewProfile | null>(null)
  const [owner, setOwner] = useState<OwnerProfile | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen || !userId) return
    setBase(null); setCrew(null); setOwner(null); setError(null)
    setLoading(true)

    api.get<UserBase>(`/api/v1/users/${userId}`)
      .then(async u => {
        setBase(u)
        if (u.account_type === 'crew') {
          try {
            const c = await api.get<CrewProfile>(`/api/v1/users/${userId}/crew`)
            setCrew(c)
          } catch { /* missing profile is fine */ }
        } else if (u.account_type === 'owner') {
          try {
            const o = await api.get<OwnerProfile>(`/api/v1/users/${userId}/owner`)
            setOwner(o)
          } catch { /* missing profile is fine */ }
        }
      })
      .catch(() => setError('User not found.'))
      .finally(() => setLoading(false))
  }, [isOpen, userId])

  if (!userId) return null

  const initials = base ? `${base.first_name[0]}${base.last_name[0]}`.toUpperCase() : '?'
  const fullName = base ? `${base.first_name} ${base.last_name}` : 'User'
  const accountLabel =
    base?.account_type === 'owner' ? 'Yacht Owner' :
    base?.account_type === 'crew' ? 'Crew Member' : ''

  return (
    <div
      className={`fixed inset-0 z-[70] transition-opacity duration-300 ${
        isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
      role="dialog"
      aria-modal="true"
    >
      <div onClick={onClose} className="absolute inset-0 bg-navy/85 backdrop-blur-md" />

      <div className="relative h-full lg:h-auto lg:my-8 mx-auto w-full lg:max-w-lg lg:max-h-[calc(100vh-4rem)] flex flex-col bg-navy-mid lg:rounded-2xl border border-white/10 shadow-2xl overflow-hidden">

        {/* Close button overlay */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-navy/60 hover:bg-navy/90 text-cream/60 hover:text-cream transition-colors backdrop-blur-sm"
          aria-label="Close"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {loading ? (
          <div className="flex-1 flex items-center justify-center py-20">
            <div className="w-6 h-6 border-2 border-gold border-t-transparent rounded-full animate-spin" />
          </div>
        ) : error || !base ? (
          <div className="flex-1 flex items-center justify-center py-20 px-6 text-center">
            <p className="text-sm text-cream/50">{error ?? 'Could not load profile.'}</p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto">

            {/* Hero banner */}
            <div className="relative h-32 bg-gradient-to-br from-gold/20 via-teal/15 to-navy" />

            {/* Avatar */}
            <div className="px-6 -mt-14 mb-4">
              <div className="w-28 h-28 rounded-full overflow-hidden bg-navy-mid border-4 border-navy-mid shadow-xl">
                <div className="w-full h-full rounded-full overflow-hidden bg-gold/10 border border-gold/20 flex items-center justify-center">
                  {base.photo_url ? (
                    <img src={base.photo_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="font-display text-3xl font-semibold text-gold">{initials}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Name + role */}
            <div className="px-6 mb-5">
              <h2 className="font-display text-2xl font-semibold text-cream">{fullName}</h2>
              {accountLabel && (
                <p className="text-xs font-semibold tracking-[0.15em] uppercase text-gold/80 mt-1">{accountLabel}</p>
              )}
            </div>

            {/* Rating */}
            <div className="px-6 mb-6">
              <h3 className="text-[10px] font-semibold tracking-[0.2em] uppercase text-gold/70 mb-2">Rating</h3>
              <StarRating value={crew?.rating ?? owner?.rating ?? null} />
            </div>

            {/* Crew-specific details */}
            {crew && (
              <div className="px-6 pb-6 space-y-5">

                {crew.roles.length > 0 && (
                  <section>
                    <h3 className="text-[10px] font-semibold tracking-[0.2em] uppercase text-gold/70 mb-2">Roles</h3>
                    <div className="flex flex-wrap gap-1.5">
                      {crew.roles.map(r => (
                        <span key={r} className="text-[11px] font-semibold tracking-[0.1em] uppercase px-2.5 py-1 rounded-full bg-gold/10 border border-gold/20 text-gold">
                          {ROLE_LABELS[r] ?? r}
                        </span>
                      ))}
                    </div>
                  </section>
                )}

                <div className="grid grid-cols-2 gap-3">
                  {crew.experience_years != null && (
                    <div className="bg-white/3 border border-white/8 rounded-xl px-4 py-3">
                      <p className="text-[10px] font-semibold tracking-[0.15em] uppercase text-cream/40 mb-0.5">Experience</p>
                      <p className="text-sm font-medium text-cream">
                        {crew.experience_years} {crew.experience_years === 1 ? 'year' : 'years'}
                      </p>
                    </div>
                  )}
                  {crew.location && (
                    <div className="bg-white/3 border border-white/8 rounded-xl px-4 py-3">
                      <p className="text-[10px] font-semibold tracking-[0.15em] uppercase text-cream/40 mb-0.5">Location</p>
                      <p className="text-sm font-medium text-cream truncate">{crew.location}</p>
                    </div>
                  )}
                  {crew.nationality && (
                    <div className="bg-white/3 border border-white/8 rounded-xl px-4 py-3">
                      <p className="text-[10px] font-semibold tracking-[0.15em] uppercase text-cream/40 mb-0.5">Nationality</p>
                      <p className="text-sm font-medium text-cream truncate">{crew.nationality}</p>
                    </div>
                  )}
                  <div className="bg-white/3 border border-white/8 rounded-xl px-4 py-3">
                    <p className="text-[10px] font-semibold tracking-[0.15em] uppercase text-cream/40 mb-0.5">Status</p>
                    <p className={`text-sm font-medium ${crew.looking_for_job ? 'text-emerald-400' : 'text-cream/55'}`}>
                      {crew.looking_for_job ? 'Available' : 'Not available'}
                    </p>
                  </div>
                </div>

                {crew.bio && (
                  <section>
                    <h3 className="text-[10px] font-semibold tracking-[0.2em] uppercase text-gold/70 mb-2">About</h3>
                    <p className="text-sm text-cream/75 leading-relaxed whitespace-pre-wrap">{crew.bio}</p>
                  </section>
                )}
              </div>
            )}

            {/* Owner-specific details */}
            {owner && (
              <div className="px-6 pb-6 space-y-5">
                {owner.company_name && (
                  <section>
                    <h3 className="text-[10px] font-semibold tracking-[0.2em] uppercase text-gold/70 mb-2">Company</h3>
                    <p className="text-base font-medium text-cream">{owner.company_name}</p>
                  </section>
                )}

                {owner.location && (
                  <div className="bg-white/3 border border-white/8 rounded-xl px-4 py-3 inline-block">
                    <p className="text-[10px] font-semibold tracking-[0.15em] uppercase text-cream/40 mb-0.5">Location</p>
                    <p className="text-sm font-medium text-cream">{owner.location}</p>
                  </div>
                )}

                {owner.description && (
                  <section>
                    <h3 className="text-[10px] font-semibold tracking-[0.2em] uppercase text-gold/70 mb-2">About</h3>
                    <p className="text-sm text-cream/75 leading-relaxed whitespace-pre-wrap">{owner.description}</p>
                  </section>
                )}
              </div>
            )}

            {/* Fallback when there is no extended profile */}
            {!crew && !owner && (
              <div className="px-6 pb-6">
                <p className="text-sm text-cream/40 italic">No additional profile information.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
