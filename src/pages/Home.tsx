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
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
    label: 'Availability That Works Both Ways',
    body: "Owners post the exact dates they need crew. Crew set the days they're free. Onboard shows you only what fits — no scrolling through listings that don't match your calendar.",
  },
  {
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
    ),
    label: 'Your Next Job Finds You',
    body: 'Set your role, certifications, and preferred dates once. When a new position matches your profile, you get notified instantly — so the right opportunities reach you before someone else takes them.',
  },
  {
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
      </svg>
    ),
    label: 'Ratings That Actually Mean Something',
    body: "After every trip, owners and crew rate each other. A captain who's shown up reliably across 20 charters carries that reputation with them — and owners who treat crew well attract better applicants.",
  },
  {
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    ),
    label: 'From Match to Message in Minutes',
    body: "No emails, no agencies, no waiting. When there's a fit, both sides connect and confirm the details directly with built-in messaging that keeps everything in one place.",
  },
]

// ── Feature card (reused for orbit + mobile slots + wipe overlay) ─
function FeatureCard({
  feature: f,
  variant = 'cream',
}: { feature: typeof FEATURES[number], variant?: 'cream' | 'dark' }) {
  const isDark = variant === 'dark'
  return (
    <div className={
      isDark
        ? 'h-full p-5'
        : 'h-full bg-cream border border-navy/8 rounded-xl shadow-md transition-all overflow-hidden hover:shadow-xl hover:border-navy/16'
    }>
      {!isDark && (
        <div className="h-[3px] w-full"
             style={{ background: 'linear-gradient(to right, rgba(168,130,58,0.7), rgba(168,130,58,0.25))' }} />
      )}
      <div className={isDark ? '' : 'p-5'}>
        <div className="flex items-start gap-3 mb-3">
          <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
               style={{
                 background: isDark ? 'rgba(201,165,96,0.18)' : 'rgba(168,130,58,0.10)',
                 border:    isDark ? '1px solid rgba(201,165,96,0.45)' : '1px solid rgba(168,130,58,0.28)',
               }}>
            <span style={{ color: isDark ? 'rgba(201,165,96,0.95)' : 'rgba(168,130,58,0.9)' }}>{f.icon}</span>
          </div>
          <h4 className={`font-display text-[14px] font-semibold tracking-tight leading-snug pt-1.5 ${isDark ? 'text-cream' : ''}`}
              style={isDark ? undefined : { color: 'rgba(20,25,37,0.85)' }}>
            {f.label}
          </h4>
        </div>
        <p className={`text-[11.5px] font-light tracking-wide leading-relaxed ${isDark ? 'text-cream/60' : ''}`}
           style={isDark ? undefined : { color: 'var(--stone)' }}>
          {f.body}
        </p>
      </div>
    </div>
  )
}

// ── Orbit section ─────────────────────────────────────────────────
function OrbitSection({ angleRef }: { angleRef: React.MutableRefObject<number> }) {
  const ORBIT_R    = 290
  const cardRefs   = useRef<(HTMLDivElement | null)[]>([])
  const topRefs    = useRef<(HTMLDivElement | null)[]>([null, null, null, null])
  const botRefs    = useRef<(HTMLDivElement | null)[]>([null, null, null, null])
  const topWipeContentRefs = useRef<(HTMLDivElement | null)[]>([null, null, null, null])
  const botWipeContentRefs = useRef<(HTMLDivElement | null)[]>([null, null, null, null])
  const topWipeRef = useRef<HTMLDivElement>(null)
  const botWipeRef = useRef<HTMLDivElement>(null)
  const hintRef    = useRef<HTMLParagraphElement>(null)
  const interacted = useRef(false)
  const prevRawIdx = useRef(0)
  const cycleDir   = useRef(1)   // 1 = forward, -1 = backward

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

      // Desktop: orbit cards follow wheel
      FEATURES.forEach((_, i) => {
        const card = cardRefs.current[i]
        if (!card) return
        const base = (i * 90 - 90) * (Math.PI / 180)
        const a    = base + rad
        const x    = Math.cos(a) * ORBIT_R
        const y    = Math.sin(a) * ORBIT_R
        card.style.transform = `translate(calc(${x}px - 50%), calc(${y}px - 50%))`
      })

      // Mobile cycle tracking
      const featurePos = angle / 90
      const rawIdx     = Math.floor(featurePos)
      const frac       = featurePos - rawIdx

      if (rawIdx !== prevRawIdx.current) {
        cycleDir.current  = rawIdx > prevRawIdx.current ? 1 : -1
        prevRawIdx.current = rawIdx
      }

      const cur    = ((rawIdx % 4) + 4) % 4
      const nxt    = (cur + 1) % 4
      const botCur = (cur + 2) % 4
      const botNxt = (cur + 3) % 4

      // Underlying card: snap-swaps under the wipe at frac=0.5 (invisible to user)
      const topShown = frac < 0.5 ? cur : nxt
      const botShown = frac < 0.5 ? botCur : botNxt

      // Wipe carries the incoming feature (depends on direction of spin)
      const topWipeIdx = cycleDir.current > 0 ? nxt : cur
      const botWipeIdx = cycleDir.current > 0 ? botNxt : botCur

      for (let i = 0; i < 4; i++) {
        const top = topRefs.current[i]
        const bot = botRefs.current[i]
        if (top) top.style.opacity = String(i === topShown ? 1 : 0)
        if (bot) bot.style.opacity = String(i === botShown ? 1 : 0)

        const topWipeContent = topWipeContentRefs.current[i]
        const botWipeContent = botWipeContentRefs.current[i]
        if (topWipeContent) topWipeContent.style.opacity = String(i === topWipeIdx ? 1 : 0)
        if (botWipeContent) botWipeContent.style.opacity = String(i === botWipeIdx ? 1 : 0)
      }

      // Wipe sweep: enters from direction of spin, exits the other side
      const wipeTx = cycleDir.current > 0
        ? (0.5 - frac) * 200
        : (frac - 0.5) * 200
      if (topWipeRef.current) topWipeRef.current.style.transform = `translateX(${wipeTx}%)`
      if (botWipeRef.current) botWipeRef.current.style.transform = `translateX(${wipeTx}%)`

      if (isMobileRef.current && !interacted.current && Math.abs(angle) > 40) {
        interacted.current = true
        if (hintRef.current) hintRef.current.style.opacity = '0'
      }
    }
    animate()
    return () => cancelAnimationFrame(rafId)
  }, [angleRef])

  return (
    <section className="relative bg-cream-dim py-24 md:py-28 overflow-hidden">

      {/* Section heading */}
      <div className="text-center mb-14 md:mb-16 px-6 max-w-2xl mx-auto">
        <p className="text-[10px] font-semibold tracking-[0.32em] uppercase mb-5"
           style={{ color: 'rgba(168,130,58,0.85)' }}>
          The Difference
        </p>
        <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-semibold text-navy leading-[1.05] tracking-tight mb-5">
          Why owners and crew<br />
          <em className="not-italic italic font-light" style={{ color: 'rgba(20,25,37,0.42)' }}>
            choose us.
          </em>
        </h2>
        <p className="text-sm leading-relaxed max-w-md mx-auto" style={{ color: 'var(--stone)' }}>
          Four reasons we're built differently from agencies and group chats.
        </p>
      </div>

      {/* Desktop orbit */}
      {!isMobile && (
        <>
          <div className="relative mx-auto" style={{ width: 760, height: 760, maxWidth: '100vw' }}>
            <div className="absolute rounded-full pointer-events-none" style={{
              top: `calc(50% - ${ORBIT_R}px)`, left: `calc(50% - ${ORBIT_R}px)`,
              width: ORBIT_R * 2, height: ORBIT_R * 2,
              border: '1px dashed rgba(20,25,37,0.10)', borderRadius: '50%',
            }} />
            {FEATURES.map((f, i) => (
              <div key={i} ref={el => { cardRefs.current[i] = el }}
                className="absolute" style={{ top: '50%', left: '50%', width: 240, willChange: 'transform' }}>
                <FeatureCard feature={f} />
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

      {/* Mobile */}
      {isMobile && (
        <div className="flex flex-col items-center px-6 gap-6">

          {/* Top slot */}
          <div className="w-full relative overflow-hidden rounded-xl" style={{ height: 220 }}>
            {/* Underlying cream cards — opacity-toggled under the wipe */}
            {FEATURES.map((f, i) => (
              <div key={`top-${i}`} ref={el => { topRefs.current[i] = el }}
                className="absolute inset-0 z-10"
                style={{ opacity: i === 0 ? 1 : 0, willChange: 'opacity' }}>
                <FeatureCard feature={f} />
              </div>
            ))}
            {/* Navy wipe carrying the incoming feature */}
            <div ref={topWipeRef}
              className="absolute inset-0 z-20 pointer-events-none overflow-hidden rounded-xl"
              style={{ background: '#141925', transform: 'translateX(100%)', willChange: 'transform' }}>
              <div className="h-[3px] w-full"
                   style={{ background: 'linear-gradient(to right, rgba(201,165,96,0.85), rgba(168,130,58,0.35))' }} />
              {FEATURES.map((f, i) => (
                <div key={`wipe-top-${i}`} ref={el => { topWipeContentRefs.current[i] = el }}
                  className="absolute inset-x-0 top-[3px] bottom-0"
                  style={{ opacity: i === 1 ? 1 : 0 }}>
                  <FeatureCard feature={f} variant="dark" />
                </div>
              ))}
            </div>
          </div>

          <HelmWheel angleRef={angleRef} size={180} variant="light" autoSpinSpeed={0} />

          {/* Bottom slot */}
          <div className="w-full relative overflow-hidden rounded-xl" style={{ height: 220 }}>
            {FEATURES.map((f, i) => (
              <div key={`bot-${i}`} ref={el => { botRefs.current[i] = el }}
                className="absolute inset-0 z-10"
                style={{ opacity: i === 2 ? 1 : 0, willChange: 'opacity' }}>
                <FeatureCard feature={f} />
              </div>
            ))}
            <div ref={botWipeRef}
              className="absolute inset-0 z-20 pointer-events-none overflow-hidden rounded-xl"
              style={{ background: '#141925', transform: 'translateX(100%)', willChange: 'transform' }}>
              <div className="h-[3px] w-full"
                   style={{ background: 'linear-gradient(to right, rgba(201,165,96,0.85), rgba(168,130,58,0.35))' }} />
              {FEATURES.map((f, i) => (
                <div key={`wipe-bot-${i}`} ref={el => { botWipeContentRefs.current[i] = el }}
                  className="absolute inset-x-0 top-[3px] bottom-0"
                  style={{ opacity: i === 3 ? 1 : 0 }}>
                  <FeatureCard feature={f} variant="dark" />
                </div>
              ))}
            </div>
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
