import { useState, useEffect, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import HelmWheel from '../components/HelmWheel'
import JobCard from '../components/JobCard'
import Footer from '../components/Footer'
import LoadingScreen from '../components/LoadingScreen'
import { mockJobs } from '../data/mockData'

// ── Orbit features ────────────────────────────────────────────────
const FEATURES = [
  {
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    label: 'Verified Crew',
    body: 'Every crew member is verified for STCW, RYA, MCA, and role-specific certifications.',
  },
  {
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064" />
      </svg>
    ),
    label: 'Global Coverage',
    body: 'Active listings across 32 countries — Mediterranean, Atlantic, Caribbean, and Pacific.',
  },
  {
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    label: 'Fast Placement',
    body: 'Most positions are filled within 48 hours. Urgent listings are prioritised automatically.',
  },
  {
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
    ),
    label: 'Secure & Private',
    body: 'Contact details stay private until you choose to share them outside the platform.',
  },
]

// ── Orbit section ─────────────────────────────────────────────────
function OrbitSection({ angleRef }: { angleRef: React.MutableRefObject<number> }) {
  const ORBIT_R    = 285
  const cardRefs   = useRef<(HTMLDivElement | null)[]>([])
  const topRefs    = useRef<(HTMLDivElement | null)[]>([null, null, null, null])
  const botRefs    = useRef<(HTMLDivElement | null)[]>([null, null, null, null])
  const topWipeRef = useRef<HTMLDivElement>(null)
  const botWipeRef = useRef<HTMLDivElement>(null)
  const hintRef    = useRef<HTMLParagraphElement>(null)
  const interacted = useRef(false)
  const prevRawIdx = useRef(0)
  const cycleDir   = useRef(1)   // 1 = forward, -1 = backward

  // Single source of truth: only one HelmWheel in DOM at a time
  const [isMobile, setIsMobile] = useState(() => window.matchMedia('(max-width: 767px)').matches)
  const isMobileRef = useRef(isMobile)
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)')
    const handler = (e: MediaQueryListEvent) => {
      setIsMobile(e.matches)
      isMobileRef.current = e.matches
    }
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  useEffect(() => {
    let rafId: number
    const animate = () => {
      rafId = requestAnimationFrame(animate)
      const angle = angleRef.current
      const rad   = angle * (Math.PI / 180)

      // ── Desktop: orbit cards follow wheel ────────────────────
      FEATURES.forEach((_, i) => {
        const card = cardRefs.current[i]
        if (!card) return
        const base = (i * 90 - 90) * (Math.PI / 180)
        const a    = base + rad
        const x    = Math.cos(a) * ORBIT_R
        const y    = Math.sin(a) * ORBIT_R
        card.style.transform = `translate(calc(${x}px - 50%), calc(${y}px - 50%))`
      })

      // ── Mobile: continuous fade+slide + navy wipe ─────────────
      const featurePos = angle / 90
      const rawIdx     = Math.floor(featurePos)
      const frac       = featurePos - rawIdx   // 0..1

      // Track which direction the current cycle is going
      if (rawIdx !== prevRawIdx.current) {
        cycleDir.current  = rawIdx > prevRawIdx.current ? 1 : -1
        prevRawIdx.current = rawIdx
      }

      const cur    = ((rawIdx % 4) + 4) % 4
      const nxt    = (cur + 1) % 4
      const botCur = (cur + 2) % 4
      const botNxt = (cur + 3) % 4
      const SLIDE  = 20

      for (let i = 0; i < 4; i++) {
        const top = topRefs.current[i]
        const bot = botRefs.current[i]
        let tOp = 0, tTx = SLIDE, bOp = 0, bTx = SLIDE

        if (i === cur)      { tOp = 1 - frac; tTx = -frac * SLIDE }
        else if (i === nxt) { tOp = frac;      tTx = (1 - frac) * SLIDE }
        if (i === botCur)      { bOp = 1 - frac; bTx = -frac * SLIDE }
        else if (i === botNxt) { bOp = frac;      bTx = (1 - frac) * SLIDE }

        if (top) { top.style.opacity = String(tOp); top.style.transform = `translateX(${tTx}px)` }
        if (bot) { bot.style.opacity = String(bOp); bot.style.transform = `translateX(${bTx}px)` }
      }

      // Navy wipe overlay: sweeps in from the direction of spin, exits the other side
      // Forward (cycleDir=1):  100% → 0% → -100%  (enters right, exits left)
      // Backward (cycleDir=-1): -100% → 0% → 100%  (enters left, exits right)
      const wipeTx = cycleDir.current > 0
        ? (0.5 - frac) * 200
        : (frac - 0.5) * 200
      if (topWipeRef.current) topWipeRef.current.style.transform = `translateX(${wipeTx}%)`
      if (botWipeRef.current) botWipeRef.current.style.transform = `translateX(${wipeTx}%)`

      // Hide hint only after real manual spin on mobile (angle moved >40° with no auto-spin)
      if (isMobileRef.current && !interacted.current && Math.abs(angle) > 40) {
        interacted.current = true
        if (hintRef.current) hintRef.current.style.opacity = '0'
      }
    }
    animate()
    return () => cancelAnimationFrame(rafId)
  }, [angleRef])

  return (
    <section className="relative bg-cream-dim py-16 overflow-hidden">
      <div className="text-center mb-6 px-6">
        <p className="text-[10px] font-semibold tracking-[0.28em] uppercase" style={{ color: 'var(--gold)' }}>
          Why CrewDeck
        </p>
      </div>

      {/* ── Desktop orbit (single HelmWheel, no auto-spin conflict) ── */}
      {!isMobile && (
        <>
          <div className="relative mx-auto" style={{ width: 700, height: 700, maxWidth: '100vw' }}>
            <div className="absolute rounded-full pointer-events-none" style={{
              top: `calc(50% - ${ORBIT_R}px)`, left: `calc(50% - ${ORBIT_R}px)`,
              width: ORBIT_R * 2, height: ORBIT_R * 2,
              border: '1px dashed rgba(20,25,37,0.10)', borderRadius: '50%',
            }} />
            {FEATURES.map((f, i) => (
              <div key={i} ref={el => { cardRefs.current[i] = el }}
                className="absolute" style={{ top: '50%', left: '50%', width: 192, willChange: 'transform' }}>
                <div className="bg-cream border border-navy/8 rounded-xl p-5 shadow-sm hover:shadow-md hover:border-navy/16 transition-all">
                  <div className="flex items-center gap-2.5 mb-2.5">
                    <span style={{ color: 'rgba(20,25,37,0.40)' }}>{f.icon}</span>
                    <h4 className="text-xs font-semibold tracking-wide" style={{ color: 'rgba(20,25,37,0.70)' }}>{f.label}</h4>
                  </div>
                  <p className="text-[11px] leading-relaxed" style={{ color: 'var(--stone)' }}>{f.body}</p>
                </div>
              </div>
            ))}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
              <HelmWheel angleRef={angleRef} size={210} variant="light" autoSpinSpeed={0.03} />
            </div>
          </div>
          <p className="text-center text-[10px] tracking-[0.2em] uppercase -mt-6"
            style={{ color: 'rgba(20,25,37,0.18)' }}>
            Drag to explore
          </p>
        </>
      )}

      {/* ── Mobile: static slots + wheel (no auto-spin) ── */}
      {isMobile && (
        <div className="flex flex-col items-center px-6 gap-5">

          {/* Top card slot */}
          <div className="w-full relative overflow-hidden rounded-xl" style={{ height: 110 }}>
            {/* Navy wipe overlay — sits above feature cards */}
            <div ref={topWipeRef} className="absolute inset-0 rounded-xl z-20 pointer-events-none"
              style={{ background: '#141925', transform: 'translateX(100%)' }} />
            {FEATURES.map((f, i) => (
              <div key={i} ref={el => { topRefs.current[i] = el }}
                className="absolute inset-x-0 top-0 bg-cream border border-navy/8 rounded-xl p-5 shadow-sm z-10"
                style={{ opacity: i === 0 ? 1 : 0, willChange: 'opacity, transform' }}>
                <div className="flex items-center gap-2.5 mb-2">
                  <span style={{ color: 'rgba(20,25,37,0.40)' }}>{f.icon}</span>
                  <h4 className="text-xs font-semibold tracking-wide" style={{ color: 'rgba(20,25,37,0.70)' }}>{f.label}</h4>
                </div>
                <p className="text-[11px] leading-relaxed" style={{ color: 'var(--stone)' }}>{f.body}</p>
              </div>
            ))}
          </div>

          <HelmWheel angleRef={angleRef} size={180} variant="light" autoSpinSpeed={0} />

          {/* Bottom card slot */}
          <div className="w-full relative overflow-hidden rounded-xl" style={{ height: 110 }}>
            <div ref={botWipeRef} className="absolute inset-0 rounded-xl z-20 pointer-events-none"
              style={{ background: '#141925', transform: 'translateX(100%)' }} />
            {FEATURES.map((f, i) => (
              <div key={i} ref={el => { botRefs.current[i] = el }}
                className="absolute inset-x-0 top-0 bg-cream border border-navy/8 rounded-xl p-5 shadow-sm z-10"
                style={{ opacity: i === 2 ? 1 : 0, willChange: 'opacity, transform' }}>
                <div className="flex items-center gap-2.5 mb-2">
                  <span style={{ color: 'rgba(20,25,37,0.40)' }}>{f.icon}</span>
                  <h4 className="text-xs font-semibold tracking-wide" style={{ color: 'rgba(20,25,37,0.70)' }}>{f.label}</h4>
                </div>
                <p className="text-[11px] leading-relaxed" style={{ color: 'var(--stone)' }}>{f.body}</p>
              </div>
            ))}
          </div>

          <p ref={hintRef}
            className="text-[10px] tracking-[0.22em] uppercase"
            style={{ color: 'rgba(20,25,37,0.28)', opacity: 1, transition: 'opacity 0.8s ease' }}>
            ↻ &nbsp;spin me
          </p>
        </div>
      )}
    </section>
  )
}

// ── Home ──────────────────────────────────────────────────────────
export default function Home() {
  const [showLoading, setShowLoading] = useState(true)
  const [visible,     setVisible]     = useState(false)
  const wheelAngleRef                 = useRef(0)

  const onPageReveal = useCallback(() => {
    setTimeout(() => setVisible(true), 60)
  }, [])

  const onLoadingUnmount = useCallback(() => {
    setShowLoading(false)
  }, [])

  useEffect(() => {
    if (!visible) return
    const els = document.querySelectorAll('.reveal')
    const obs = new IntersectionObserver(
      es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target) } }),
      { threshold: 0.1 }
    )
    els.forEach(el => obs.observe(el))
    return () => obs.disconnect()
  }, [visible])

  return (
    <>
      {showLoading && <LoadingScreen onPageReveal={onPageReveal} onUnmount={onLoadingUnmount} />}

      <div style={{ opacity: visible ? 1 : 0, transition: 'opacity 0.5s ease' }}>

        {/* ── Hero ────────────────────────────────────────────────── */}
        <section className="relative min-h-screen bg-navy flex items-center overflow-hidden">
          <div className="absolute inset-0 pointer-events-none"
            style={{ background: 'radial-gradient(ellipse 70% 50% at 12% 55%, rgba(168,130,58,0.05) 0%, transparent 60%)' }} />

          <div className="relative z-10 w-full max-w-7xl mx-auto px-8 lg:px-14 pt-24 pb-16">
            <div className="flex items-stretch gap-0 min-h-[72vh]">

              {/* Left — headline */}
              <div className="flex-1 flex flex-col justify-center pr-10 lg:pr-20">
                <p className="text-[10px] font-semibold tracking-[0.32em] uppercase mb-8"
                  style={{ color: 'rgba(168,130,58,0.75)', animation: visible ? 'fadeUp 0.6s 0.1s both' : 'none' }}>
                  Maritime Crew Placement
                </p>

                <h1 className="font-display font-bold text-cream leading-[0.96] mb-8"
                  style={{ fontSize: 'clamp(3.2rem, 7vw, 6rem)', animation: visible ? 'fadeUp 0.75s 0.2s both' : 'none' }}>
                  The Professional<br />
                  Crew Network<br />
                  <em className="not-italic font-light" style={{ color: 'rgba(242,235,224,0.32)' }}>
                    for Yachts.
                  </em>
                </h1>

                <p className="text-sm leading-relaxed max-w-xs mb-12"
                  style={{ color: 'rgba(242,235,224,0.40)', animation: visible ? 'fadeUp 0.65s 0.32s both' : 'none' }}>
                  Connecting yacht owners with certified captains, officers, and crew — worldwide.
                </p>

                <div className="flex gap-10"
                  style={{ animation: visible ? 'fadeUp 0.65s 0.45s both' : 'none' }}>
                  {[
                    { val: '1,240', label: 'Crew Members'   },
                    { val: '487',   label: 'Voyages Filled' },
                    { val: '32',    label: 'Countries'      },
                  ].map(s => (
                    <div key={s.label}>
                      <p className="font-display text-[1.65rem] font-semibold text-cream leading-none">{s.val}</p>
                      <p className="text-[10px] tracking-widest uppercase mt-1.5"
                        style={{ color: 'rgba(242,235,224,0.26)' }}>{s.label}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Vertical divider */}
              <div className="hidden lg:block w-px self-stretch flex-shrink-0"
                style={{
                  background: 'linear-gradient(to bottom, transparent, rgba(242,235,224,0.12) 22%, rgba(242,235,224,0.12) 78%, transparent)',
                  animation:  visible ? 'fadeIn 0.8s 0.5s both' : 'none',
                }} />

              {/* Right — role selection */}
              <div className="hidden lg:flex flex-col justify-center pl-12 lg:pl-16 flex-shrink-0"
                style={{ width: '40%', animation: visible ? 'fadeUp 0.65s 0.38s both' : 'none' }}>

                <p className="text-[10px] font-semibold tracking-[0.24em] uppercase mb-5"
                  style={{ color: 'rgba(242,235,224,0.20)' }}>
                  Select your role
                </p>

                <div className="flex flex-col gap-5">
                  {[
                    {
                      role: 'owner', to: '/register?role=owner',
                      label: 'Yacht Owner',
                      sub: 'I need professional crew',
                      desc: 'Post your voyage dates and find certified captains, officers, and crew for your vessel.',
                      cta:  'Post a position',
                      icon: (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        </svg>
                      ),
                    },
                    {
                      role: 'crew', to: '/register?role=crew',
                      label: 'Crew Member',
                      sub: 'I\'m looking for work at sea',
                      desc: 'Create a professional profile, set your availability, and be discovered by owners worldwide.',
                      cta:  'Create a profile',
                      icon: (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      ),
                    },
                  ].map(item => (
                    <Link key={item.role} to={item.to}
                      className="group block rounded-xl border transition-all duration-200 overflow-hidden"
                      style={{ borderColor: 'rgba(242,235,224,0.12)', background: 'rgba(242,235,224,0.03)' }}
                      onMouseEnter={e => {
                        const el = e.currentTarget as HTMLElement
                        el.style.borderColor = 'rgba(242,235,224,0.25)'
                        el.style.background  = 'rgba(242,235,224,0.06)'
                      }}
                      onMouseLeave={e => {
                        const el = e.currentTarget as HTMLElement
                        el.style.borderColor = 'rgba(242,235,224,0.12)'
                        el.style.background  = 'rgba(242,235,224,0.03)'
                      }}
                    >
                      {/* Gold top accent bar */}
                      <div className="h-[2px] w-full" style={{ background: 'rgba(168,130,58,0.5)' }} />

                      <div className="p-7">
                        {/* Header */}
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <div className="flex items-center gap-2.5 mb-1">
                              <span style={{ color: 'rgba(242,235,224,0.65)' }}>{item.icon}</span>
                              <span className="font-display text-lg font-semibold"
                                style={{ color: 'rgba(242,235,224,0.90)' }}>
                                {item.label}
                              </span>
                            </div>
                            <p className="text-xs font-medium" style={{ color: 'rgba(168,130,58,0.65)' }}>
                              {item.sub}
                            </p>
                          </div>
                          <svg className="w-4 h-4 mt-1 flex-shrink-0 transition-transform group-hover:translate-x-1"
                            style={{ color: 'rgba(242,235,224,0.22)' }}
                            fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                          </svg>
                        </div>

                        {/* Description */}
                        <p className="text-[13px] leading-relaxed mb-5"
                          style={{ color: 'rgba(242,235,224,0.48)' }}>
                          {item.desc}
                        </p>

                        {/* CTA */}
                        <p className="text-xs font-semibold tracking-wide" style={{ color: 'rgba(168,130,58,0.70)' }}>
                          {item.cta} →
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Scroll indicator */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2"
            style={{ animation: visible ? 'fadeIn 1s 1.2s both' : 'none' }}>
            <div className="w-px h-10 animate-[scrollPulse_2.5s_ease-in-out_infinite]"
              style={{ background: 'linear-gradient(to bottom, rgba(242,235,224,0.22), transparent)' }} />
          </div>
        </section>

        {/* ── Mobile role cards (shown below hero on small screens) ── */}
        <section className="lg:hidden bg-navy px-6 pb-14 pt-2">
          <p className="text-[10px] font-semibold tracking-[0.24em] uppercase mb-4"
            style={{ color: 'rgba(242,235,224,0.20)' }}>
            Select your role
          </p>
          <div className="flex flex-col gap-4">
            {[
              {
                role: 'owner', to: '/register?role=owner',
                label: 'Yacht Owner',
                sub: 'I need professional crew',
                desc: 'Post your voyage dates and find certified captains, officers, and crew for your vessel.',
                cta: 'Post a position',
                icon: (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                ),
              },
              {
                role: 'crew', to: '/register?role=crew',
                label: 'Crew Member',
                sub: "I'm looking for work at sea",
                desc: 'Create a professional profile, set your availability, and be discovered by owners worldwide.',
                cta: 'Create a profile',
                icon: (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                ),
              },
            ].map(item => (
              <a key={item.role} href={item.to}
                className="block rounded-xl border overflow-hidden"
                style={{ borderColor: 'rgba(242,235,224,0.12)', background: 'rgba(242,235,224,0.04)' }}>
                <div className="h-[2px] w-full" style={{ background: 'rgba(168,130,58,0.5)' }} />
                <div className="p-5">
                  <div className="flex items-center gap-2.5 mb-1">
                    <span style={{ color: 'rgba(242,235,224,0.65)' }}>{item.icon}</span>
                    <span className="font-display text-base font-semibold" style={{ color: 'rgba(242,235,224,0.90)' }}>
                      {item.label}
                    </span>
                  </div>
                  <p className="text-xs font-medium mb-3" style={{ color: 'rgba(168,130,58,0.65)' }}>{item.sub}</p>
                  <p className="text-[12px] leading-relaxed mb-4" style={{ color: 'rgba(242,235,224,0.45)' }}>{item.desc}</p>
                  <p className="text-xs font-semibold tracking-wide" style={{ color: 'rgba(168,130,58,0.70)' }}>{item.cta} →</p>
                </div>
              </a>
            ))}
          </div>
        </section>

        {/* Gradient bridge: navy → cream-dim */}
        <div style={{ height: 72, background: 'linear-gradient(to bottom, #141925, #E9E0D4)', flexShrink: 0 }} />

        {/* ── Orbit / Wheel ─────────────────────────────────────── */}
        <OrbitSection angleRef={wheelAngleRef} />

        {/* ── How It Works ──────────────────────────────────────── */}
        <section className="bg-cream-dim py-28 px-8 lg:px-14" id="how">
          <div className="max-w-7xl mx-auto">
            <p className="section-label reveal mb-4">How it works</p>
            <h2 className="font-display text-3xl md:text-4xl font-semibold text-navy mb-16 reveal max-w-md leading-tight">
              Two ways to<br />
              <em className="italic font-light" style={{ color: 'var(--teal)' }}>come aboard.</em>
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
              <div className="bg-cream border border-navy/6 rounded-2xl p-10 reveal">
                <p className="text-[10px] font-semibold tracking-[0.22em] uppercase mb-1"
                  style={{ color: 'rgba(168,130,58,0.7)' }}>For Owners</p>
                <h3 className="font-display text-xl font-semibold text-navy mb-8">Fill your crew roster</h3>
                <div className="space-y-7">
                  {[
                    { n: '01', t: 'Post your voyage',    b: 'Add vessel details, departure dates, and which positions need filling.' },
                    { n: '02', t: 'Review applications', b: 'Qualified crew apply directly. Browse profiles, certifications, and voyage history.' },
                    { n: '03', t: 'Set sail',            b: 'Confirm your crew, finalise terms, and focus on the voyage.' },
                  ].map(s => (
                    <div key={s.n} className="flex gap-5">
                      <span className="text-[10px] font-bold w-6 flex-shrink-0 mt-0.5"
                        style={{ color: 'rgba(168,130,58,0.5)' }}>{s.n}</span>
                      <div>
                        <h4 className="text-sm font-semibold text-navy mb-1">{s.t}</h4>
                        <p className="text-xs leading-relaxed" style={{ color: 'var(--stone)' }}>{s.b}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-navy border border-white/5 rounded-2xl p-10 reveal reveal-d2">
                <p className="text-[10px] font-semibold tracking-[0.22em] uppercase mb-1"
                  style={{ color: 'rgba(168,130,58,0.6)' }}>For Crew</p>
                <h3 className="font-display text-xl font-semibold text-cream mb-8">Build your career at sea</h3>
                <div className="space-y-7">
                  {[
                    { n: '01', t: 'Build your profile',    b: 'Showcase certifications, past vessels, and the roles you specialise in.' },
                    { n: '02', t: 'Set your availability', b: "Mark when you're free. Owners searching those dates will find you first." },
                    { n: '03', t: 'Apply or be invited',   b: 'Browse open positions or wait for owners to reach out directly.' },
                  ].map(s => (
                    <div key={s.n} className="flex gap-5">
                      <span className="text-[10px] font-bold w-6 flex-shrink-0 mt-0.5"
                        style={{ color: 'rgba(168,130,58,0.45)' }}>{s.n}</span>
                      <div>
                        <h4 className="text-sm font-semibold text-cream mb-1">{s.t}</h4>
                        <p className="text-xs leading-relaxed"
                          style={{ color: 'rgba(242,235,224,0.38)' }}>{s.b}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Recent positions ──────────────────────────────────── */}
        <section className="bg-cream py-24 px-8 lg:px-14">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-end justify-between mb-12 flex-wrap gap-6 reveal">
              <div>
                <p className="section-label mb-3">Live board</p>
                <h2 className="font-display text-3xl font-semibold text-navy leading-tight">Recent positions</h2>
              </div>
              <Link to="/browse"
                className="text-xs font-medium transition-colors flex items-center gap-1.5 border-b pb-0.5"
                style={{ color: 'rgba(20,25,37,0.42)', borderColor: 'rgba(20,25,37,0.16)' }}>
                View all listings
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {mockJobs.slice(0, 3).map((job, i) => (
                <div key={job.id} className={`reveal reveal-d${i + 1}`}>
                  <JobCard job={job} />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Gradient bridge: cream → navy */}
        <div style={{ height: 72, background: 'linear-gradient(to bottom, #F2EBE0, #141925)', flexShrink: 0 }} />

        {/* ── CTA ───────────────────────────────────────────────── */}
        <section className="bg-navy py-28 px-8 lg:px-14">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="font-display text-4xl md:text-5xl font-bold text-cream leading-tight mb-5 reveal">
              Your next voyage<br />
              <em className="not-italic font-light" style={{ color: 'rgba(242,235,224,0.32)' }}>
                starts here.
              </em>
            </h2>
            <p className="text-sm mb-10 reveal max-w-sm mx-auto leading-relaxed"
              style={{ color: 'rgba(242,235,224,0.32)' }}>
              Join hundreds of owners and crew who have found their match through CrewDeck.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center reveal">
              <Link to="/register?role=owner"
                className="px-8 py-3.5 text-sm font-semibold rounded-lg transition-all hover:-translate-y-0.5 hover:shadow-lg"
                style={{ background: 'rgba(242,235,224,0.92)', color: '#141925' }}>
                Post a Crew Position
              </Link>
              <Link to="/register?role=crew"
                className="px-8 py-3.5 text-sm font-semibold rounded-lg border transition-all hover:-translate-y-0.5"
                style={{ borderColor: 'rgba(242,235,224,0.16)', color: 'rgba(242,235,224,0.62)' }}>
                Create a Crew Profile
              </Link>
            </div>
          </div>
        </section>

        <Footer />
      </div>
    </>
  )
}
