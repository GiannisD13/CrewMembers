import type { CrewMember } from '../types'

interface CrewCardProps {
  member: CrewMember
}

const avatarColors = [
  'from-teal/30 to-teal/10',
  'from-gold/20 to-gold/5',
  'from-[#3a1b6b]/30 to-[#3a1b6b]/10',
  'from-[#1b3a6b]/30 to-[#1b3a6b]/10',
  'from-[#6b1b3a]/20 to-[#6b1b3a]/5',
  'from-[#3a6b1b]/20 to-[#3a6b1b]/5',
]

const roleInitials = (name: string) =>
  name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

export default function CrewCard({ member }: CrewCardProps) {
  const idx = parseInt(member.id.split('-')[1]) - 1
  const gradient = avatarColors[idx % avatarColors.length]

  return (
    <div className="group bg-navy-light border border-white/6 rounded-2xl p-5 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-black/50 hover:border-gold/25 cursor-pointer flex flex-col">

      {/* Header */}
      <div className="flex items-center gap-3.5 mb-4">
        <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${gradient} border border-white/10 flex items-center justify-center flex-shrink-0`}>
          <span className="font-display text-sm font-semibold text-cream/80">
            {roleInitials(member.name)}
          </span>
        </div>
        <div className="min-w-0">
          <h3 className="font-display text-[1rem] font-semibold text-cream leading-tight truncate group-hover:text-gold-light transition-colors">
            {member.name}
          </h3>
          <p className="text-xs text-gold/80 font-medium mt-0.5">{member.primaryRole}</p>
        </div>
        <div className="ml-auto flex-shrink-0">
          <span className={`inline-flex items-center gap-1.5 text-[10px] font-semibold px-2 py-0.5 rounded-full ${member.available ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-white/5 text-cream/30 border border-white/10'}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${member.available ? 'bg-green-400' : 'bg-cream/20'}`} />
            {member.available ? 'Available' : 'Booked'}
          </span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {[
          { val: `${member.voyages}`,    label: 'Voyages' },
          { val: `${member.experience}yr`, label: 'Experience' },
          { val: `${member.rating}★`,    label: 'Rating' },
        ].map(stat => (
          <div key={stat.label} className="bg-navy/50 rounded-lg px-2 py-2 text-center">
            <p className="font-display text-sm font-semibold text-cream">{stat.val}</p>
            <p className="text-[10px] text-cream/35 mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Bio */}
      <p className="text-xs text-cream/50 leading-relaxed line-clamp-2 mb-4">
        {member.bio}
      </p>

      {/* Certifications */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {member.certifications.slice(0, 3).map(cert => (
          <span key={cert} className="text-[10px] px-2 py-0.5 rounded bg-gold/8 text-gold-light/70 border border-gold/15">
            {cert}
          </span>
        ))}
        {member.certifications.length > 3 && (
          <span className="text-[10px] px-2 py-0.5 rounded bg-white/4 text-cream/35">
            +{member.certifications.length - 3}
          </span>
        )}
      </div>

      {/* Footer */}
      <div className="mt-auto flex items-center justify-between pt-3.5 border-t border-white/6">
        <div>
          <p className="text-[11px] text-cream/35 mb-0.5">Available</p>
          <p className="text-xs font-medium text-cream/70">
            {member.availability.start} – {member.availability.end}
          </p>
        </div>
        <button className="text-xs font-semibold text-gold border border-gold/30 px-3.5 py-1.5 rounded-lg hover:bg-gold hover:text-navy transition-all">
          Contact
        </button>
      </div>
    </div>
  )
}
