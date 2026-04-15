import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import type { UserRole } from '../types'

type Step = 1 | 2

export default function Register() {
  const [searchParams] = useSearchParams()
  const initialRole    = (searchParams.get('role') as UserRole) ?? null

  const [step, setStep]       = useState<Step>(initialRole ? 2 : 1)
  const [role, setRole]       = useState<UserRole | null>(initialRole)
  const [form, setForm]       = useState({ name: '', email: '', password: '' })
  const [showPw, setShowPw]   = useState(false)

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(prev => ({ ...prev, [k]: e.target.value }))

  const handleRoleSelect = (r: UserRole) => { setRole(r); setStep(2) }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // TODO: connect to auth API
  }

  return (
    <div className="min-h-screen bg-navy flex flex-col items-center justify-center px-6 py-16">

      <Link to="/" className="font-display text-xl font-bold text-cream tracking-wide mb-12">
        Crew<span className="text-gold">Deck</span>
      </Link>

      {/* ── Step 1: Choose role ───────────────────────────────────── */}
      {step === 1 && (
        <div className="w-full max-w-lg">
          <h1 className="font-display text-3xl font-semibold text-cream text-center mb-2">
            How will you use CrewDeck?
          </h1>
          <p className="text-sm text-cream/40 text-center mb-10">
            You can always switch roles later.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              {
                role: 'owner' as UserRole,
                icon: (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                ),
                label: 'I\'m a Yacht Owner',
                desc: 'I need to find professional crew for my voyages.',
              },
              {
                role: 'crew' as UserRole,
                icon: (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                ),
                label: 'I\'m a Crew Member',
                desc: 'I\'m looking for positions on yachts and vessels.',
              },
            ].map(item => (
              <button
                key={item.role}
                onClick={() => handleRoleSelect(item.role)}
                className="group text-left p-7 rounded-2xl border border-white/10 bg-navy-light hover:border-gold hover:shadow-[0_0_40px_rgba(196,151,58,0.1)] transition-all duration-300 hover:-translate-y-1"
              >
                <div className="w-11 h-11 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center text-gold mb-5">
                  {item.icon}
                </div>
                <h3 className="font-display text-lg font-semibold text-cream mb-2 group-hover:text-gold-light transition-colors">
                  {item.label}
                </h3>
                <p className="text-xs text-cream/40 leading-relaxed">{item.desc}</p>
              </button>
            ))}
          </div>

          <p className="text-center text-sm text-cream/30 mt-8">
            Already have an account?{' '}
            <Link to="/login" className="text-gold font-medium hover:text-gold-light transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      )}

      {/* ── Step 2: Account details ───────────────────────────────── */}
      {step === 2 && role && (
        <div className="w-full max-w-sm">

          {/* Back */}
          <button
            onClick={() => setStep(1)}
            className="flex items-center gap-1.5 text-xs text-cream/35 hover:text-cream/60 transition-colors mb-8"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
            </svg>
            Back
          </button>

          {/* Role badge */}
          <div className="flex items-center gap-2 mb-6">
            <span className="text-[10px] font-semibold tracking-[0.2em] uppercase px-2.5 py-1 rounded-full bg-gold/10 border border-gold/20 text-gold">
              {role === 'owner' ? 'Yacht Owner' : 'Crew Member'}
            </span>
          </div>

          <h1 className="font-display text-2xl font-semibold text-cream mb-1.5">Create your account</h1>
          <p className="text-sm text-cream/40 mb-8">Professional profile. No card required.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-cream/60 mb-1.5">Full name</label>
              <input
                type="text"
                required
                autoComplete="name"
                value={form.name}
                onChange={set('name')}
                placeholder="Your full name"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-cream placeholder-cream/20 focus:outline-none focus:border-gold/60 focus:bg-white/8 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-cream/60 mb-1.5">Email address</label>
              <input
                type="email"
                required
                autoComplete="email"
                value={form.email}
                onChange={set('email')}
                placeholder="you@example.com"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-cream placeholder-cream/20 focus:outline-none focus:border-gold/60 focus:bg-white/8 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-cream/60 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  required
                  autoComplete="new-password"
                  value={form.password}
                  onChange={set('password')}
                  placeholder="Min. 8 characters"
                  minLength={8}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pr-10 text-sm text-cream placeholder-cream/20 focus:outline-none focus:border-gold/60 focus:bg-white/8 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-cream/25 hover:text-cream/60 transition-colors"
                  tabIndex={-1}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-gold text-navy font-semibold text-sm py-3 rounded-xl hover:bg-gold-light transition-colors mt-2"
            >
              Create account
            </button>
          </form>

          <p className="text-[11px] text-cream/25 text-center mt-5 leading-relaxed">
            By creating an account, you agree to our{' '}
            <a href="#" className="text-cream/40 underline hover:text-cream/60">Terms of Service</a>{' '}
            and{' '}
            <a href="#" className="text-cream/40 underline hover:text-cream/60">Privacy Policy</a>.
          </p>

          <p className="text-center text-sm text-cream/30 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-gold font-medium hover:text-gold-light transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      )}
    </div>
  )
}
