import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api, ApiError } from '../lib/api'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const navigate = useNavigate()
  const { saveToken } = useAuth()

  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw]     = useState(false)
  const [error, setError]       = useState<string | null>(null)
  const [loading, setLoading]   = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await api.postForm<{ access_token: string; token_type: string }>(
        '/api/v1/auth/login',
        { username: email, password },
      )
      const user = await saveToken(res.access_token)
      navigate(user.account_type === 'owner' ? '/dashboard/owner' : '/dashboard/crew', { replace: true })
    } catch (err) {
      setError((err as ApiError).detail ?? 'Login failed. Please check your credentials.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-navy flex">

      {/* Left panel — branding */}
      <div className="hidden lg:flex flex-col justify-between w-[45%] bg-navy-light border-r border-white/5 p-12 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(196,151,58,0.06) 0%, transparent 65%)' }} />

        <Link to="/" className="font-display text-2xl font-bold text-cream tracking-wide relative z-10">
          Crew<span className="text-gold">Deck</span>
        </Link>

        <div className="relative z-10">
          <blockquote className="font-display text-2xl font-light italic text-cream/70 leading-relaxed mb-6">
            "Found our captain within 24 hours. Highest professional standards, seamless process."
          </blockquote>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gold/15 border border-gold/25 flex items-center justify-center font-display text-sm font-semibold text-gold">
              A
            </div>
            <div>
              <p className="text-sm font-medium text-cream/80">A. Stavros</p>
              <p className="text-xs text-cream/35">Owner, S/Y Artemis</p>
            </div>
          </div>
        </div>

        <p className="text-xs text-cream/20 relative z-10">© 2026 CrewDeck</p>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">

        <Link to="/" className="lg:hidden font-display text-xl font-bold text-cream tracking-wide mb-10">
          Crew<span className="text-gold">Deck</span>
        </Link>

        <div className="w-full max-w-sm">
          <h1 className="font-display text-2xl font-semibold text-cream mb-1.5">Welcome back</h1>
          <p className="text-sm text-cream/40 mb-8">Sign in to your account to continue.</p>

          {error && (
            <div className="mb-4 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-cream/60 mb-1.5">Email address</label>
              <input
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-cream placeholder-cream/20 focus:outline-none focus:border-gold/60 focus:bg-white/8 transition-all"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-cream/60">Password</label>
                <a href="#" className="text-xs text-gold/70 hover:text-gold transition-colors">Forgot password?</a>
              </div>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pr-10 text-sm text-cream placeholder-cream/20 focus:outline-none focus:border-gold/60 focus:bg-white/8 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-cream/25 hover:text-cream/60 transition-colors"
                  tabIndex={-1}
                >
                  {showPw ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gold text-navy font-semibold text-sm py-3 rounded-xl hover:bg-gold-light transition-colors mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <div className="relative my-6">
            <hr className="border-white/8" />
            <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-navy px-3 text-xs text-cream/25">
              or
            </span>
          </div>

          <p className="text-center text-sm text-cream/35">
            Don't have an account?{' '}
            <Link to="/register" className="text-gold font-medium hover:text-gold-light transition-colors">
              Join CrewDeck
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
