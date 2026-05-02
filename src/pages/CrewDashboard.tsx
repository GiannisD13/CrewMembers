import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api, ApiError } from '../lib/api'
import { useAuth } from '../context/AuthContext'

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

type Msg = { type: 'success' | 'error'; text: string }

const CREW_ROLES = [
  { value: 'captain',    label: 'Captain' },
  { value: 'first_mate', label: 'First Mate' },
  { value: 'chef',       label: 'Chef / Cook' },
  { value: 'engineer',   label: 'Engineer' },
  { value: 'sailor',     label: 'Sailor' },
  { value: 'steward',    label: 'Steward / Stewardess' },
  { value: 'deckhand',   label: 'Deckhand' },
]

const inputCls = 'w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-cream placeholder-cream/20 focus:outline-none focus:border-gold/60 transition-all'

export default function CrewDashboard() {
  const { user, refreshUser, logout } = useAuth()
  const navigate = useNavigate()
  const fileRef = useRef<HTMLInputElement>(null)

  const [photoLoading, setPhotoLoading] = useState(false)

  const [personal, setPersonal] = useState({ first_name: '', last_name: '', phone: '' })
  const [personalLoading, setPersonalLoading] = useState(false)
  const [personalMsg, setPersonalMsg] = useState<Msg | null>(null)

  const [crewForm, setCrewForm] = useState({
    roles: [] as string[],
    experience_years: '',
    location: '',
    nationality: '',
    bio: '',
    looking_for_job: true,
  })
  const [crewLoading, setCrewLoading] = useState(false)
  const [crewMsg, setCrewMsg] = useState<Msg | null>(null)

  useEffect(() => {
    if (user) {
      setPersonal({
        first_name: user.first_name,
        last_name:  user.last_name,
        phone:      user.phone ?? '',
      })
    }
  }, [user])

  useEffect(() => {
    api.get<CrewProfile>('/api/v1/users/me/crew')
      .then(p => setCrewForm({
        roles:           p.roles ?? [],
        experience_years: p.experience_years != null ? String(p.experience_years) : '',
        location:        p.location      ?? '',
        nationality:     p.nationality   ?? '',
        bio:             p.bio           ?? '',
        looking_for_job: p.looking_for_job,
      }))
      .catch(() => {})
  }, [])

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPhotoLoading(true)
    try {
      const { url } = await api.postFile<{ url: string }>('/api/v1/uploads/photo', file)
      await api.patch('/api/v1/users/me', { photo_url: url })
      await refreshUser()
    } catch {
      // silent
    } finally {
      setPhotoLoading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const toggleRole = (r: string) =>
    setCrewForm(p => ({
      ...p,
      roles: p.roles.includes(r) ? p.roles.filter(x => x !== r) : [...p.roles, r],
    }))

  const savePersonal = async (e: React.FormEvent) => {
    e.preventDefault()
    setPersonalLoading(true)
    setPersonalMsg(null)
    try {
      const body: Record<string, string> = {
        first_name: personal.first_name,
        last_name:  personal.last_name,
      }
      if (personal.phone.trim()) body.phone = personal.phone.trim()
      await api.patch('/api/v1/users/me', body)
      await refreshUser()
      setPersonalMsg({ type: 'success', text: 'Personal info updated.' })
    } catch (err) {
      setPersonalMsg({ type: 'error', text: (err as ApiError).detail ?? 'Save failed.' })
    } finally {
      setPersonalLoading(false)
    }
  }

  const saveCrew = async (e: React.FormEvent) => {
    e.preventDefault()
    if (crewForm.roles.length === 0) {
      setCrewMsg({ type: 'error', text: 'Please select at least one role.' })
      return
    }
    setCrewLoading(true)
    setCrewMsg(null)
    try {
      const body: Record<string, unknown> = {
        roles:           crewForm.roles,
        looking_for_job: crewForm.looking_for_job,
      }
      if (crewForm.experience_years.trim()) body.experience_years = Number(crewForm.experience_years)
      if (crewForm.location.trim())    body.location    = crewForm.location.trim()
      if (crewForm.nationality.trim()) body.nationality = crewForm.nationality.trim()
      if (crewForm.bio.trim())         body.bio         = crewForm.bio.trim()
      await api.patch('/api/v1/users/me/crew', body)
      setCrewMsg({ type: 'success', text: 'Crew profile updated.' })
    } catch (err) {
      setCrewMsg({ type: 'error', text: (err as ApiError).detail ?? 'Save failed.' })
    } finally {
      setCrewLoading(false)
    }
  }

  const handleLogout = () => { logout(); navigate('/') }

  const initials = user ? `${user.first_name[0]}${user.last_name[0]}`.toUpperCase() : '?'

  return (
    <div className="min-h-screen bg-navy pt-16">
      <div className="max-w-2xl mx-auto px-6 py-10 space-y-6">

        {/* Profile header card */}
        <div className="bg-navy-light border border-white/8 rounded-2xl p-6">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-5">

              {/* Avatar */}
              <div className="relative flex-shrink-0">
                <div className="w-20 h-20 rounded-full overflow-hidden bg-gold/10 border border-gold/20 flex items-center justify-center">
                  {user?.photo_url ? (
                    <img src={user.photo_url} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <span className="font-display text-2xl font-semibold text-gold">{initials}</span>
                  )}
                  {photoLoading && (
                    <div className="absolute inset-0 bg-navy/60 rounded-full flex items-center justify-center">
                      <div className="w-5 h-5 border-2 border-gold border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                </div>
                <button
                  onClick={() => fileRef.current?.click()}
                  disabled={photoLoading}
                  className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-gold flex items-center justify-center hover:bg-gold-light transition-colors disabled:opacity-50"
                  title="Upload photo"
                >
                  <svg className="w-3.5 h-3.5 text-navy" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </button>
                <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={handlePhotoUpload} />
              </div>

              <div>
                <h2 className="font-display text-xl font-semibold text-cream">
                  {user?.first_name} {user?.last_name}
                </h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] font-semibold tracking-[0.2em] uppercase px-2 py-0.5 rounded-full bg-gold/10 border border-gold/20 text-gold">
                    Crew Member
                  </span>
                  <div className="flex items-center gap-1.5">
                    <div className={`w-1.5 h-1.5 rounded-full ${crewForm.looking_for_job ? 'bg-emerald-400' : 'bg-white/20'}`} />
                    <span className="text-[10px] text-cream/40">
                      {crewForm.looking_for_job ? 'Available' : 'Not available'}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-cream/35 mt-1">{user?.email}</p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="text-xs text-cream/35 hover:text-cream/60 transition-colors flex items-center gap-1.5"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Sign out
            </button>
          </div>
        </div>

        {/* Personal info */}
        <div className="bg-navy-light border border-white/8 rounded-2xl p-6">
          <h3 className="font-display text-lg font-semibold text-cream mb-1">Personal Information</h3>
          <p className="text-xs text-cream/35 mb-5">Update your name and contact details.</p>

          <form onSubmit={savePersonal} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-cream/60 mb-1.5">First name</label>
                <input type="text" required value={personal.first_name}
                  onChange={e => setPersonal(p => ({ ...p, first_name: e.target.value }))}
                  className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-medium text-cream/60 mb-1.5">Last name</label>
                <input type="text" required value={personal.last_name}
                  onChange={e => setPersonal(p => ({ ...p, last_name: e.target.value }))}
                  className={inputCls} />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-cream/60 mb-1.5">Email address</label>
              <div className="w-full bg-white/3 border border-white/8 rounded-xl px-4 py-3 text-sm text-cream/40 cursor-not-allowed">
                {user?.email}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-cream/60 mb-1.5">
                Phone <span className="text-cream/25">(optional)</span>
              </label>
              <input type="tel" value={personal.phone}
                onChange={e => setPersonal(p => ({ ...p, phone: e.target.value }))}
                placeholder="+30 690 000 0000" className={inputCls} />
            </div>

            {personalMsg && (
              <p className={`text-sm ${personalMsg.type === 'success' ? 'text-emerald-400' : 'text-red-400'}`}>
                {personalMsg.text}
              </p>
            )}

            <button type="submit" disabled={personalLoading}
              className="bg-gold text-navy font-semibold text-sm px-6 py-2.5 rounded-xl hover:bg-gold-light transition-colors disabled:opacity-60 disabled:cursor-not-allowed">
              {personalLoading ? 'Saving…' : 'Save changes'}
            </button>
          </form>
        </div>

        {/* Crew profile */}
        <div className="bg-navy-light border border-white/8 rounded-2xl p-6">
          <h3 className="font-display text-lg font-semibold text-cream mb-1">Crew Profile</h3>
          <p className="text-xs text-cream/35 mb-5">Visible to yacht owners browsing available crew.</p>

          <form onSubmit={saveCrew} className="space-y-5">

            {/* Looking for job toggle — prominent at top */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-white/3 border border-white/8">
              <div>
                <p className="text-sm font-medium text-cream">Available for hire</p>
                <p className="text-xs text-cream/35 mt-0.5">Owners can see you in search results</p>
              </div>
              <button
                type="button"
                onClick={() => setCrewForm(p => ({ ...p, looking_for_job: !p.looking_for_job }))}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${crewForm.looking_for_job ? 'bg-gold' : 'bg-white/10'}`}
              >
                <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${crewForm.looking_for_job ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </button>
            </div>

            {/* Roles */}
            <div>
              <label className="block text-xs font-medium text-cream/60 mb-2">
                Roles on board <span className="text-red-400">*</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {CREW_ROLES.map(r => (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => toggleRole(r.value)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${
                      crewForm.roles.includes(r.value)
                        ? 'bg-gold/15 border-gold/50 text-gold'
                        : 'bg-white/5 border-white/10 text-cream/50 hover:border-white/25 hover:text-cream/70'
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-cream/60 mb-1.5">Years of experience</label>
                <input type="number" min="0" max="50" value={crewForm.experience_years}
                  onChange={e => setCrewForm(p => ({ ...p, experience_years: e.target.value }))}
                  placeholder="e.g. 5" className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-medium text-cream/60 mb-1.5">Nationality</label>
                <input type="text" value={crewForm.nationality}
                  onChange={e => setCrewForm(p => ({ ...p, nationality: e.target.value }))}
                  placeholder="e.g. Greek" className={inputCls} />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-cream/60 mb-1.5">Location</label>
              <input type="text" value={crewForm.location}
                onChange={e => setCrewForm(p => ({ ...p, location: e.target.value }))}
                placeholder="e.g. Athens, Greece" className={inputCls} />
            </div>

            <div>
              <label className="block text-xs font-medium text-cream/60 mb-1.5">Bio</label>
              <textarea
                value={crewForm.bio}
                onChange={e => setCrewForm(p => ({ ...p, bio: e.target.value }))}
                placeholder="Tell owners about your experience and what makes you a great crew member…"
                rows={4}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-cream placeholder-cream/20 focus:outline-none focus:border-gold/60 transition-all resize-none"
              />
            </div>

            {crewMsg && (
              <p className={`text-sm ${crewMsg.type === 'success' ? 'text-emerald-400' : 'text-red-400'}`}>
                {crewMsg.text}
              </p>
            )}

            <button type="submit" disabled={crewLoading}
              className="bg-gold text-navy font-semibold text-sm px-6 py-2.5 rounded-xl hover:bg-gold-light transition-colors disabled:opacity-60 disabled:cursor-not-allowed">
              {crewLoading ? 'Saving…' : 'Save changes'}
            </button>
          </form>
        </div>

        {/* My Listings */}
        <Link
          to="/my-listings"
          className="block bg-navy-light border border-white/8 rounded-2xl p-6 hover:border-gold/30 transition-colors group"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-display text-lg font-semibold text-cream group-hover:text-gold-light transition-colors">
                My Listings
              </h3>
              <p className="text-xs text-cream/35 mt-0.5">Manage your crew listings</p>
            </div>
            <svg className="w-5 h-5 text-cream/30 group-hover:text-gold/60 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </Link>

      </div>
    </div>
  )
}
