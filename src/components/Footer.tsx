import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="bg-navy border-t border-white/5 py-12 px-6 lg:px-10">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-8">

        <div>
          <Link to="/" className="font-display text-xl font-bold text-cream tracking-wide">
            Crew<span className="text-gold">Deck</span>
          </Link>
          <p className="text-xs text-cream/40 mt-2 max-w-xs leading-relaxed">
            The professional maritime crew placement platform for yacht owners and freelance seafarers.
          </p>
        </div>

        <div className="flex flex-wrap gap-x-10 gap-y-3">
          {[
            { label: 'Browse Positions', to: '/browse?tab=jobs' },
            { label: 'Find Crew', to: '/browse?tab=crew' },
            { label: 'How It Works', to: '/#how' },
            { label: 'Privacy Policy', to: '#' },
            { label: 'Terms of Service', to: '#' },
          ].map(link => (
            <Link key={link.label} to={link.to} className="text-xs text-cream/40 hover:text-cream/70 transition-colors">
              {link.label}
            </Link>
          ))}
        </div>

        <p className="text-xs text-cream/25 whitespace-nowrap">
          © 2026 CrewDeck
        </p>
      </div>
    </footer>
  )
}
