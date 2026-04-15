import { useRef, useEffect } from 'react'

interface HelmWheelProps {
  angleRef?:      React.MutableRefObject<number>
  size?:          number
  variant?:       'dark' | 'light'
  autoSpinSpeed?: number   // deg/frame target velocity; 0 = no auto-spin
}

export default function HelmWheel({ angleRef, size = 240, variant = 'dark', autoSpinSpeed = 0.07 }: HelmWheelProps) {
  const svgRef     = useRef<SVGSVGElement>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)

  const stateRef = useRef({
    angle:          0,
    velocity:       0.07,
    isDragging:     false,
    dragStartAngle: 0,
    dragStartHelm:  0,
  })

  useEffect(() => {
    const svg     = svgRef.current
    const wrapper = wrapperRef.current
    if (!svg || !wrapper) return

    const s = stateRef.current
    let rafId = 0

    const getAngle = (cx: number, cy: number) => {
      const r = wrapper.getBoundingClientRect()
      return Math.atan2(cy - (r.top + r.height / 2), cx - (r.left + r.width / 2)) * (180 / Math.PI)
    }

    const frame = () => {
      rafId = requestAnimationFrame(frame)
      if (!s.isDragging) {
        s.velocity += (autoSpinSpeed - s.velocity) * 0.025
        s.angle    += s.velocity
      }
      svg.style.transform = `rotate(${s.angle}deg)`
      if (angleRef) angleRef.current = s.angle
    }

    const onDown = (cx: number, cy: number) => {
      s.isDragging     = true
      s.dragStartAngle = getAngle(cx, cy)
      s.dragStartHelm  = s.angle
    }
    const onMove = (cx: number, cy: number) => {
      if (!s.isDragging) return
      const next = s.dragStartHelm + (getAngle(cx, cy) - s.dragStartAngle)
      s.velocity = next - s.angle
      s.angle    = next
    }
    const onUp = () => { s.isDragging = false }

    const md = (e: MouseEvent) => { onDown(e.clientX, e.clientY); e.preventDefault() }
    const mm = (e: MouseEvent) => onMove(e.clientX, e.clientY)
    const ts = (e: TouchEvent) => onDown(e.touches[0].clientX, e.touches[0].clientY)
    const tm = (e: TouchEvent) => onMove(e.touches[0].clientX, e.touches[0].clientY)

    wrapper.addEventListener('mousedown', md)
    window.addEventListener('mousemove',  mm)
    window.addEventListener('mouseup',    onUp)
    wrapper.addEventListener('touchstart', ts, { passive: true })
    window.addEventListener('touchmove',   tm, { passive: true })
    window.addEventListener('touchend',    onUp)

    frame()
    return () => {
      cancelAnimationFrame(rafId)
      wrapper.removeEventListener('mousedown', md)
      window.removeEventListener('mousemove',  mm)
      window.removeEventListener('mouseup',    onUp)
    }
  }, [angleRef])

  // Colour tokens per variant
  const rim      = variant === 'light' ? 'rgba(20,25,37,0.55)'  : 'rgba(242,235,224,0.60)'
  const rimFaint = variant === 'light' ? 'rgba(20,25,37,0.12)'  : 'rgba(242,235,224,0.12)'
  const spoke    = variant === 'light' ? 'rgba(20,25,37,0.40)'  : 'rgba(242,235,224,0.38)'
  const knob     = variant === 'light' ? 'rgba(20,25,37,0.55)'  : 'rgba(242,235,224,0.60)'
  const dot      = variant === 'light' ? 'rgba(20,25,37,0.50)'  : 'rgba(242,235,224,0.55)'
  const accent   = variant === 'light' ? 'rgba(168,130,58,0.40)': 'rgba(168,130,58,0.38)'

  return (
    <div
      ref={wrapperRef}
      style={{ width: size, height: size, position: 'relative', flexShrink: 0 }}
      className="cursor-grab active:cursor-grabbing select-none"
    >
      {/* Faint guide ring */}
      <div
        className="absolute rounded-full pointer-events-none"
        style={{ inset: -14, border: `1px solid ${rimFaint}`, borderRadius: '50%' }}
      />

      <svg
        ref={svgRef}
        viewBox="0 0 200 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ width: '100%', height: '100%' }}
      >
        {/* Outer rim */}
        <circle cx="100" cy="100" r="90" stroke={rim}      strokeWidth="2"   />
        <circle cx="100" cy="100" r="84" stroke={rimFaint} strokeWidth="0.8" />

        {/* 8 Spokes */}
        {[0, 45, 90, 135, 180, 225, 270, 315].map(deg => (
          <g key={deg} transform={`rotate(${deg} 100 100)`}>
            <line x1="100" y1="18" x2="100" y2="76"
              stroke={spoke} strokeWidth="1.8" strokeLinecap="round" />
            {/* Knob — open circle + centre dot */}
            <circle cx="100" cy="12" r="5"   stroke={knob} strokeWidth="1.4" fill="none" />
            <circle cx="100" cy="12" r="1.8" fill={dot} />
          </g>
        ))}

        {/* Inner structural rings */}
        <circle cx="100" cy="100" r="30"   stroke={rimFaint} strokeWidth="0.8" />
        <circle cx="100" cy="100" r="23"   stroke={spoke}    strokeWidth="1.4" />
        {/* Gold accent ring */}
        <circle cx="100" cy="100" r="26.5" stroke={accent}   strokeWidth="0.8" />

        {/* Hub */}
        <circle cx="100" cy="100" r="11" stroke={rim}   strokeWidth="1.4" fill="none" />
        <circle cx="100" cy="100" r="4"  stroke={spoke} strokeWidth="1"   fill="none" />
        <circle cx="100" cy="100" r="1.8" fill={dot} />
      </svg>
    </div>
  )
}
