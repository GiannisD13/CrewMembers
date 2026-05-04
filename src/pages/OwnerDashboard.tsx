import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api, ApiError } from '../lib/api'
import { useAuth } from '../context/AuthContext'

interface OwnerProfile {
  user_id: string
  company_name: string | null
  description: string | null
  location: string | null
  rating: number | null
}

type Msg = { type: 'success' | 'error'; text: string }

const inputCls = 'w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-cream placeholder-cream/20 focus:outline-none focus:border-gold/60 transition-all'

export default function OwnerDashboard() {
  const { user, refreshUser, logout } = useAuth()
  const navigate = useNavigate()
  const fileRef = useRef<HTMLInputElement>(null)

  const [photoLoading, setPhotoLoading] = useState(false)

  const [personal, setPersonal] = useState({ first_name: '', last_name: '', phone: '' })
  const [personalLoading, setPersonalLoading] = useState(false)
  const [personalMsg, setPersonalMsg] = useState<Msg | null>(null)

  const [ownerForm, setOwnerForm] = useState({ company_name: '', description: '', location: '' })
  const [ownerLoading, setOwnerLoading] = useState(false)
  const [ownerMsg, setOwnerMsg] = useState<Msg | null>(null)

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
    api.get<OwnerProfile>('/api/v1/users/me/owner')
      .then(p => setOwnerForm({
        company_name: p.company_name ?? '',
        description:  p.description  ?? '',
        location:     p.location     ?? '',
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
      // silent — photo upload failure shouldn't disrupt
    } finally {
      setPhotoLoading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

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

  const saveOwner = async (e: React.FormEvent) => {
    e.preventDefault()
    setOwnerLoading(true)
    setOwnerMsg(null)
    try {
      const body: Record<string, string> = {}
      if (ownerForm.company_name.trim()) body.company_name = ownerForm.company_name.trim()
      if (ownerForm.description.trim())  body.description  = ownerForm.description.trim()
      if (ownerForm.location.trim())     body.location     = ownerForm.location.trim()
      await api.patch('/api/v1/users/me/owner', body)
      setOwnerMsg({ type: 'success', text: 'Company profile updated.' })
    } catch (err) {
      setOwnerMsg({ type: 'error', text: (err as ApiError).detail ?? 'Save failed.' })
    } finally {
      setOwnerLoading(false)
    }
  }

  const handleLogout = () => { logout(); navigate('/') }

  const initials = user ? `${user.first_name[0]}${user.last_name[0]}`.toUpperCase() : '?'

  return (
    <div className="px-4 sm:px-6 lg:px-10 py-6 lg:py-10">
      <div className="max-w-4xl mx-auto space-y-6">

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
                <span className="text-[10px] font-semibold tracking-[0.2em] uppercase px-2 py-0.5 rounded-full bg-gold/10 border border-gold/20 text-gold">
                  Yacht Owner
                </span>
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

        {/* Company profile */}
        <div className="bg-navy-light border border-white/8 rounded-2xl p-6">
          <h3 className="font-display text-lg font-semibold text-cream mb-1">Company Profile</h3>
          <p className="text-xs text-cream/35 mb-5">Visible to crew members browsing your listings.</p>

          <form onSubmit={saveOwner} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-cream/60 mb-1.5">Company name</label>
              <input type="text" value={ownerForm.company_name}
                onChange={e => setOwnerForm(p => ({ ...p, company_name: e.target.value }))}
                placeholder="Your company or vessel name" className={inputCls} />
            </div>

            <div>
              <label className="block text-xs font-medium text-cream/60 mb-1.5">Location</label>
              <input type="text" value={ownerForm.location}
                onChange={e => setOwnerForm(p => ({ ...p, location: e.target.value }))}
                placeholder="e.g. Athens, Greece" className={inputCls} />
            </div>

            <div>
              <label className="block text-xs font-medium text-cream/60 mb-1.5">Description</label>
              <textarea
                value={ownerForm.description}
                onChange={e => setOwnerForm(p => ({ ...p, description: e.target.value }))}
                placeholder="Tell crew members about you and your vessel…"
                rows={4}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-cream placeholder-cream/20 focus:outline-none focus:border-gold/60 transition-all resize-none"
              />
            </div>

            {ownerMsg && (
              <p className={`text-sm ${ownerMsg.type === 'success' ? 'text-emerald-400' : 'text-red-400'}`}>
                {ownerMsg.text}
              </p>
            )}

            <button type="submit" disabled={ownerLoading}
              className="bg-gold text-navy font-semibold text-sm px-6 py-2.5 rounded-xl hover:bg-gold-light transition-colors disabled:opacity-60 disabled:cursor-not-allowed">
              {ownerLoading ? 'Saving…' : 'Save changes'}
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
              <p className="text-xs text-cream/35 mt-0.5">Manage your job postings</p>
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
