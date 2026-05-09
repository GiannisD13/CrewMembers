interface Props {
  className?: string
}

export default function TopographicBackground({ className = '' }: Props) {
  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute inset-0 overflow-hidden text-cream ${className}`}
      style={{ opacity: 0.11 }}
    >
      <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="topo-tile" x="0" y="0" width="320" height="320" patternUnits="userSpaceOnUse">
            {/* Long horizontal contours */}
            <path d="M-40,60 Q60,30 160,70 T380,60" stroke="currentColor" fill="none" strokeWidth="0.8" />
            <path d="M-40,100 Q40,70 140,110 T380,100" stroke="currentColor" fill="none" strokeWidth="0.8" />
            <path d="M-40,150 Q80,110 200,160 T380,150" stroke="currentColor" fill="none" strokeWidth="0.8" />
            <path d="M-40,210 Q70,170 180,220 T380,210" stroke="currentColor" fill="none" strokeWidth="0.8" />
            <path d="M-40,270 Q90,230 220,280 T380,270" stroke="currentColor" fill="none" strokeWidth="0.8" />

            {/* Concentric "island" rings — top-left */}
            <ellipse cx="80" cy="80" rx="38" ry="24" stroke="currentColor" fill="none" strokeWidth="0.7" />
            <ellipse cx="80" cy="80" rx="22" ry="14" stroke="currentColor" fill="none" strokeWidth="0.7" />
            <ellipse cx="80" cy="80" rx="9"  ry="5"  stroke="currentColor" fill="none" strokeWidth="0.7" />

            {/* Concentric rings — bottom-right */}
            <ellipse cx="240" cy="230" rx="48" ry="30" stroke="currentColor" fill="none" strokeWidth="0.7" />
            <ellipse cx="240" cy="230" rx="32" ry="20" stroke="currentColor" fill="none" strokeWidth="0.7" />
            <ellipse cx="240" cy="230" rx="16" ry="10" stroke="currentColor" fill="none" strokeWidth="0.7" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#topo-tile)" />
      </svg>
    </div>
  )
}
