import { useState, useEffect, useRef } from 'react'
import { api, ApiError } from '../lib/api'

interface NewListingModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  type: 'job' | 'crew'
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

const AVAILABILITY_TYPES = [
  { value: 'permanent', label: 'Permanent', desc: 'Ongoing position' },
  { value: 'seasonal',  label: 'Seasonal',  desc: 'Tied to a season' },
  { value: 'temporary', label: 'Temporary', desc: 'Specific date range' },
  { value: 'custom',    label: 'Custom',    desc: 'Recurring days or specific dates' },
]

const WEEKDAYS = [
  { value: 0, label: 'Mon' },
  { value: 1, label: 'Tue' },
  { value: 2, label: 'Wed' },
  { value: 3, label: 'Thu' },
  { value: 4, label: 'Fri' },
  { value: 5, label: 'Sat' },
  { value: 6, label: 'Sun' },
]

const inputCls = 'w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm text-cream placeholder-cream/20 focus:outline-none focus:border-gold/60 transition-all'

const initialForm = {
  title: '',
  role: '',
  description: '',
  location: '',
  salary: '',
  availability_type: 'permanent',
  start_date: '',
  end_date: '',
  recurring_days: [] as number[],
  one_off_dates: [] as string[],
}

interface PhotoItem { file: File; preview: string }

export default function NewListingModal({ isOpen, onClose, onSuccess, type }: NewListingModalProps) {
  const [form, setForm] = useState(initialForm)
  const [oneOffInput, setOneOffInput] = useState('')
  const [photos, setPhotos] = useState<PhotoItem[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!isOpen) {
      setForm(initialForm)
      setOneOffInput('')
      setError(null)
      photos.forEach(p => URL.revokeObjectURL(p.preview))
      setPhotos([])
    }
  }, [isOpen])

  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  const toggleDay = (day: number) =>
    setForm(p => ({
      ...p,
      recurring_days: p.recurring_days.includes(day)
        ? p.recurring_days.filter(d => d !== day)
        : [...p.recurring_days, day].sort((a, b) => a - b),
    }))

  const addOneOffDate = () => {
    if (oneOffInput && !form.one_off_dates.includes(oneOffInput)) {
      setForm(p => ({ ...p, one_off_dates: [...p.one_off_dates, oneOffInput].sort() }))
      setOneOffInput('')
    }
  }

  const removeOneOffDate = (date: string) =>
    setForm(p => ({ ...p, one_off_dates: p.one_off_dates.filter(d => d !== date) }))

  const handleFiles = (files: FileList | null) => {
    if (!files || !files.length) return
    const items: PhotoItem[] = []
    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/')) continue
      items.push({ file, preview: URL.createObjectURL(file) })
    }
    setPhotos(p => [...p, ...items])
    if (fileRef.current) fileRef.current.value = ''
  }

  const removePhoto = (idx: number) => {
    setPhotos(p => {
      URL.revokeObjectURL(p[idx].preview)
      return p.filter((_, i) => i !== idx)
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim()) { setError('Title is required.'); return }
    if (!form.role) { setError('Please select a role.'); return }

    setError(null)
    setLoading(true)
    try {
      const schedulePayload: Record<string, unknown> = {
        availability_type: form.availability_type,
      }
      if (form.start_date)             schedulePayload.start_date     = form.start_date
      if (form.end_date)               schedulePayload.end_date       = form.end_date
      if (form.recurring_days.length)  schedulePayload.recurring_days = form.recurring_days
      if (form.one_off_dates.length)   schedulePayload.one_off_dates  = form.one_off_dates

      const schedule = await api.post<{ id: number }>('/api/v1/availability-schedules/', schedulePayload)

      const listingPayload: Record<string, unknown> = {
        schedule_id: schedule.id,
        title:       form.title.trim(),
        role:        form.role,
      }
      if (form.description.trim()) listingPayload.description = form.description.trim()
      if (form.location.trim())    listingPayload.location    = form.location.trim()
      if (type === 'job' && form.salary.trim()) {
        listingPayload.salary = Number(form.salary)
      }

      const path = type === 'job' ? '/api/v1/job-postings' : '/api/v1/crew-listings'
      const created = await api.post<{ id: number }>(path, listingPayload)

      // Upload photos for job postings
      if (type === 'job' && photos.length) {
        for (let i = 0; i < photos.length; i++) {
          try {
            const { url } = await api.postFile<{ url: string }>('/api/v1/uploads/posting-media', photos[i].file)
            await api.post(`/api/v1/job-postings/${created.id}/media`, { url, order: i })
          } catch {
            // continue with remaining photos; user can add later from edit
          }
        }
      }

      onSuccess()
      onClose()
    } catch (err) {
      setError((err as ApiError).detail ?? 'Failed to create listing.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className={`fixed inset-0 z-[60] transition-opacity duration-300 ${
        isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
      role="dialog"
      aria-modal="true"
    >
      <div onClick={onClose} className="absolute inset-0 bg-navy/80 backdrop-blur-md" />

      <div className="relative h-full lg:h-auto lg:my-8 mx-auto w-full lg:max-w-2xl lg:max-h-[calc(100vh-4rem)] flex flex-col bg-navy-mid lg:rounded-xl border border-white/10 shadow-2xl overflow-hidden">

        <div className="flex items-center justify-between px-6 py-4 border-b border-white/8 flex-shrink-0">
          <div>
            <h2 className="font-display text-xl font-semibold tracking-tight text-cream">
              New {type === 'job' ? 'Job Posting' : 'Crew Listing'}
            </h2>
            <p className="text-xs font-light tracking-wide text-cream/40 mt-0.5">
              {type === 'job' ? 'Find the right crew for your vessel.' : 'Showcase your availability to yacht owners.'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 -mr-2 text-cream/40 hover:text-cream/70 transition-colors"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-6 space-y-7">

          <section className="space-y-4">
            <h3 className="text-[10px] font-semibold tracking-[0.2em] uppercase text-gold-light/80">Listing Details</h3>

            <div>
              <label className="block text-xs font-medium text-cream/60 mb-1.5">Title <span className="text-red-400">*</span></label>
              <input type="text" required value={form.title}
                onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                placeholder={type === 'job' ? 'e.g. Captain for summer charter' : 'e.g. Experienced Captain available'}
                className={inputCls} />
            </div>

            <div>
              <label className="block text-xs font-medium text-cream/60 mb-1.5">Role <span className="text-red-400">*</span></label>
              <select required value={form.role}
                onChange={e => setForm(p => ({ ...p, role: e.target.value }))}
                className={`${inputCls} appearance-none cursor-pointer`}>
                <option value="" disabled>Select a role…</option>
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
                placeholder={type === 'job' ? 'Vessel details, expectations, requirements…' : 'Your skills, experience, what you bring on board…'}
                className={`${inputCls} resize-none`} />
            </div>

            <div className={type === 'job' ? 'grid grid-cols-1 sm:grid-cols-2 gap-4' : ''}>
              <div>
                <label className="block text-xs font-medium text-cream/60 mb-1.5">Location</label>
                <input type="text" value={form.location}
                  onChange={e => setForm(p => ({ ...p, location: e.target.value }))}
                  placeholder="e.g. Athens, Greece" className={inputCls} />
              </div>

              {type === 'job' && (
                <div>
                  <label className="block text-xs font-medium text-cream/60 mb-1.5">
                    Salary <span className="text-cream/25">(monthly, EUR)</span>
                  </label>
                  <input type="number" min="0" step="50" value={form.salary}
                    onChange={e => setForm(p => ({ ...p, salary: e.target.value }))}
                    placeholder="e.g. 4500" className={inputCls} />
                </div>
              )}
            </div>
          </section>

          {/* Photos (job only) */}
          {type === 'job' && (
            <>
              <hr className="border-white/8" />
              <section className="space-y-3">
                <div>
                  <h3 className="text-[10px] font-semibold tracking-[0.2em] uppercase text-gold-light/80">Vessel Photos</h3>
                  <p className="text-xs text-cream/35 mt-1">JPG, PNG or WebP — up to 5 MB each.</p>
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {photos.map((p, i) => (
                    <div key={p.preview} className="relative aspect-square rounded-xl overflow-hidden border border-white/10 group">
                      <img src={p.preview} alt="" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removePhoto(i)}
                        className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-navy/80 text-cream/80 hover:text-red-400 transition-colors flex items-center justify-center backdrop-blur-sm"
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
                    className="aspect-square rounded-xl border-2 border-dashed border-white/15 hover:border-gold/40 hover:bg-white/5 transition-all flex flex-col items-center justify-center gap-1 text-cream/40 hover:text-gold"
                  >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M12 4v16m8-8H4" />
                    </svg>
                    <span className="text-[11px] font-medium">Add photos</span>
                  </button>
                </div>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  hidden
                  onChange={e => handleFiles(e.target.files)}
                />
              </section>
            </>
          )}

          <hr className="border-white/8" />

          <section className="space-y-4">
            <h3 className="text-[10px] font-semibold tracking-[0.2em] uppercase text-gold-light/80">Availability</h3>

            <div>
              <label className="block text-xs font-medium text-cream/60 mb-2">Type <span className="text-red-400">*</span></label>
              <div className="grid grid-cols-2 gap-2">
                {AVAILABILITY_TYPES.map(t => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setForm(p => ({ ...p, availability_type: t.value }))}
                    className={`text-left p-3 rounded-lg border transition-all ${
                      form.availability_type === t.value
                        ? 'bg-gold/10 border-gold/45 text-gold-light/95'
                        : 'bg-white/5 border-white/10 text-cream/55 hover:border-white/25'
                    }`}
                  >
                    <p className="text-sm font-semibold">{t.label}</p>
                    <p className="text-[11px] opacity-70 mt-0.5">{t.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-cream/60 mb-1.5">Start date</label>
                <input type="date" value={form.start_date}
                  onChange={e => setForm(p => ({ ...p, start_date: e.target.value }))}
                  className={`${inputCls} [color-scheme:dark]`} />
              </div>
              <div>
                <label className="block text-xs font-medium text-cream/60 mb-1.5">End date</label>
                <input type="date" value={form.end_date}
                  onChange={e => setForm(p => ({ ...p, end_date: e.target.value }))}
                  className={`${inputCls} [color-scheme:dark]`} />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-cream/60 mb-2">
                Recurring days <span className="text-cream/25">(optional)</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {WEEKDAYS.map(d => (
                  <button
                    key={d.value}
                    type="button"
                    onClick={() => toggleDay(d.value)}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold border transition-all ${
                      form.recurring_days.includes(d.value)
                        ? 'bg-gold/10 border-gold/45 text-gold-light/95'
                        : 'bg-white/5 border-white/10 text-cream/50 hover:border-white/25'
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-cream/60 mb-2">
                One-off dates <span className="text-cream/25">(optional)</span>
              </label>
              <div className="flex gap-2 mb-2">
                <input type="date" value={oneOffInput}
                  onChange={e => setOneOffInput(e.target.value)}
                  className={`${inputCls} [color-scheme:dark] flex-1`} />
                <button
                  type="button"
                  onClick={addOneOffDate}
                  disabled={!oneOffInput}
                  className="px-4 rounded-lg bg-gold/10 border border-gold/30 text-gold-light/95 text-sm font-semibold hover:bg-gold/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Add
                </button>
              </div>
              {form.one_off_dates.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {form.one_off_dates.map(date => (
                    <span key={date} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/5 border border-white/10 text-xs text-cream/70">
                      {date}
                      <button type="button" onClick={() => removeOneOffDate(date)} className="text-cream/40 hover:text-red-400 transition-colors">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </section>

          {error && (
            <div className="px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400/85">
              {error}
            </div>
          )}
        </form>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-white/8 bg-navy-mid flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-lg text-sm font-medium text-cream/60 hover:text-cream hover:bg-white/5 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={loading}
            className="bg-gold/95 text-navy font-semibold text-sm px-5 py-2.5 rounded-lg hover:bg-gold-light transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating…' : 'Create listing'}
          </button>
        </div>
      </div>
    </div>
  )
}
