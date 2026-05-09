import type { YachtJob } from '../types'

interface JobCardProps {
  job: YachtJob
  compact?: boolean
}

const vesselBg: Record<string, string> = {
  'job-1': 'from-[#0d2b3e] to-[#1a4a5e]',
  'job-2': 'from-[#1a2c1a] to-[#2d4a2d]',
  'job-3': 'from-[#2a1a0e] to-[#4a3020]',
  'job-4': 'from-[#1a1a2e] to-[#2d2d4a]',
  'job-5': 'from-[#0e2a2a] to-[#1a4040]',
  'job-6': 'from-[#1a0e2a] to-[#2d2040]',
}

const vesselEmoji: Record<string, string> = {
  sailing: '⛵',
  motor:   '🛥️',
}

export default function JobCard({ job, compact = false }: JobCardProps) {
  const bg = vesselBg[job.id] ?? 'from-navy-mid to-navy-light'
  const emoji = vesselEmoji[job.vesselType]

  return (
    <div className="group bg-navy-light border border-white/12 rounded-xl overflow-hidden transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-black/50 hover:border-gold/35 cursor-pointer flex flex-col">

      {/* Card image area */}
      {!compact && (
        <div className={`relative h-40 bg-gradient-to-br ${bg} flex items-center justify-center`}>
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-navy-light" />
          <span className="text-5xl relative z-10 opacity-80">{emoji}</span>
          {job.urgent && (
            <span className="absolute top-3 right-3 z-10 bg-gold/95 text-navy text-[10px] font-bold tracking-widest px-2.5 py-1 rounded-md uppercase">
              Urgent
            </span>
          )}
        </div>
      )}

      <div className="p-5 flex flex-col flex-1">
        {/* Title */}
        <div className="mb-1">
          <h3 className="font-display text-[1.05rem] font-semibold tracking-tight text-cream leading-tight group-hover:text-gold-light transition-colors">
            {job.vesselName}
          </h3>
          <p className="text-xs font-light tracking-wide text-cream/45 mt-0.5">
            {job.vesselLength}m &middot; {job.vesselType === 'sailing' ? 'Sailing Yacht' : 'Motor Yacht'}
          </p>
        </div>

        {/* Route */}
        <div className="flex items-center gap-1.5 my-3 text-xs font-light tracking-wide text-cream/60">
          <svg className="w-3 h-3 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          </svg>
          <span>{job.route.from}</span>
          <span className="text-gold/50 mx-0.5">→</span>
          <span>{job.route.to}</span>
        </div>

        {/* Roles needed */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {job.rolesNeeded.map(role => (
            <span
              key={role}
              className="text-[11px] font-medium px-2.5 py-0.5 rounded-md bg-teal/15 text-teal-light border border-teal/25"
            >
              {role}
            </span>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-auto flex items-center justify-between pt-3.5 border-t border-white/6">
          <div>
            <p className="text-[11px] font-light tracking-wide text-cream/40 mb-0.5">Departure window</p>
            <p className="text-xs font-medium text-gold-light/95">
              {job.dates.start} – {job.dates.end}
            </p>
          </div>
          <button className="text-xs font-semibold text-gold-light/95 border border-gold/30 px-3.5 py-1.5 rounded-md hover:bg-gold/95 hover:text-navy transition-all">
            Apply
          </button>
        </div>
      </div>
    </div>
  )
}
