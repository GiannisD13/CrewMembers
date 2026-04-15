import { useEffect, useRef, useState } from 'react'

type Phase = 'drawing' | 'sailing' | 'docked' | 'gone'

interface Props {
  onPageReveal: () => void   // called when overlay fades → page can appear
  onUnmount:    () => void   // called when everything is done
}

export default function LoadingScreen({ onPageReveal, onUnmount }: Props) {
  const svgRef   = useRef<SVGSVGElement>(null)
  const [phase, setPhase] = useState<Phase>('drawing')

  useEffect(() => {
    // Draw the boat paths
    const svg = svgRef.current
    if (svg) {
      const els = svg.querySelectorAll<SVGGeometryElement>('path, line, circle')
      els.forEach((el, i) => {
        try {
          const len = el.getTotalLength()
          el.style.strokeDasharray  = `${len}`
          el.style.strokeDashoffset = `${len}`
          el.style.animation = `cdDraw 0.8s cubic-bezier(0.4,0,0.2,1) ${i * 0.11}s forwards`
        } catch { /* elements without getTotalLength */ }
      })
    }

    // Timeline
    const t1 = setTimeout(() => { setPhase('sailing'); onPageReveal() }, 1700)
    const t2 = setTimeout(() => setPhase('docked'), 2900)
    const t3 = setTimeout(() => { setPhase('gone'); onUnmount() }, 4400)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [onPageReveal, onUnmount])

  // Overlay: visible during drawing, fades during sailing
  const overlayOpacity = phase === 'drawing' ? 1 : 0

  // Boat position & scale
  const boatStyle: React.CSSProperties = (() => {
    const base: React.CSSProperties = {
      position: 'fixed',
      zIndex: 9998,
      pointerEvents: 'none',
      transformOrigin: 'center center',
    }
    if (phase === 'drawing') {
      return { ...base,
        left: '50%', top: '50%',
        transform: 'translate(-50%, -50%) scale(1)',
        opacity: 1,
        transition: 'none',
      }
    }
    if (phase === 'sailing') {
      return { ...base,
        left: '72%', top: '68%',
        transform: 'translate(-50%, -50%) scale(0.48)',
        opacity: 0.55,
        transition: 'all 1.15s cubic-bezier(0.25,0.46,0.45,0.94)',
      }
    }
    if (phase === 'docked') {
      return { ...base,
        left: '72%', top: '68%',
        transform: 'translate(-50%, -50%) scale(0.48)',
        opacity: 0.22,
        transition: 'opacity 0.6s ease',
        animation: 'cdFloat 3s ease-in-out infinite',
      }
    }
    // gone
    return { ...base,
      left: '72%', top: '68%',
      transform: 'translate(-50%, -50%) scale(0.48)',
      opacity: 0,
      transition: 'opacity 0.8s ease',
    }
  })()

  return (
    <>
      <style>{`
        @keyframes cdDraw  { to { stroke-dashoffset: 0; } }
        @keyframes cdFloat {
          0%,100% { transform: translate(-50%,-50%) scale(0.48) translateY(0); }
          50%      { transform: translate(-50%,-50%) scale(0.48) translateY(-6px); }
        }
      `}</style>

      {/* Dark overlay */}
      <div
        className="fixed inset-0 bg-navy"
        style={{
          zIndex: 9997,
          opacity: overlayOpacity,
          transition: phase === 'sailing' ? 'opacity 0.55s ease' : 'none',
          pointerEvents: phase === 'drawing' ? 'auto' : 'none',
        }}
      />

      {/* Wordmark — only during drawing phase */}
      {phase === 'drawing' && (
        <div className="fixed inset-0 flex flex-col items-center justify-center" style={{ zIndex: 9999, pointerEvents: 'none' }}>
          <div style={{ height: 120 }} /> {/* spacer so boat appears above wordmark */}
          <p style={{
            fontFamily: 'Fraunces, serif',
            color: 'rgba(242,235,224,0.5)',
            fontSize: '0.75rem',
            letterSpacing: '0.3em',
            animation: 'cdDraw 0s', // just shows it
            opacity: 1,
            marginTop: 24,
          }}>
            CREWDECK
          </p>
        </div>
      )}

      {/* Boat — travels from center to hero corner */}
      <div style={boatStyle}>
        <svg
          ref={svgRef}
          viewBox="0 0 220 130"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{ width: 180, height: 110 }}
        >
          <line x1="15"  y1="92" x2="205" y2="92"
            stroke="rgba(242,235,224,0.15)" strokeWidth="1" />
          <path d="M45 84 Q110 92 175 84 L168 90 Q110 98 52 90 Z"
            stroke="rgba(242,235,224,0.75)" strokeWidth="1.4" strokeLinejoin="round" />
          <path d="M52 84 Q110 82 168 84"
            stroke="rgba(242,235,224,0.50)" strokeWidth="1.2" strokeLinecap="round" />
          <line x1="102" y1="82" x2="102" y2="8"
            stroke="rgba(242,235,224,0.80)" strokeWidth="1.4" strokeLinecap="round" />
          <line x1="102" y1="64" x2="60" y2="74"
            stroke="rgba(242,235,224,0.50)" strokeWidth="1.2" strokeLinecap="round" />
          <path d="M102 12 L102 80 L55 72 Z"
            stroke="rgba(242,235,224,0.70)" strokeWidth="1.4" strokeLinejoin="round" />
          <path d="M102 22 L102 78 L148 70 Z"
            stroke="rgba(242,235,224,0.48)" strokeWidth="1.2" strokeLinejoin="round" />
          <path d="M102 8 L113 12 L102 16"
            stroke="rgba(168,130,58,0.75)" strokeWidth="1.1" strokeLinejoin="round" />
          <circle cx="110" cy="87" r="2.5"
            stroke="rgba(242,235,224,0.28)" strokeWidth="1" />
        </svg>
      </div>
    </>
  )
}
