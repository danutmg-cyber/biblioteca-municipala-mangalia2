import { Link } from '@tanstack/react-router'

const navLinks = [
  { to: '/', label: 'Acasă' },
  { to: '/collections', label: 'Colecții' },
  { to: '/events', label: 'Evenimente' },
  { to: '/cauta', label: 'Caută carte' },
  { to: '/contact', label: 'Contact' },
]

export function Header() {
  return (
    <header className="bg-[#1a3a5c] text-white shadow-lg">
      <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-full bg-[#c9962a] flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
            B
          </div>
          <div>
            <div className="font-bold text-lg leading-tight group-hover:text-[#c9962a] transition-colors">
              Biblioteca Municipală
            </div>
            <div className="text-[#c9962a] text-sm font-semibold tracking-wide">
              Mangalia
            </div>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="px-4 py-2 rounded-md text-sm font-medium hover:bg-white/10 hover:text-[#c9962a] transition-colors [&.active]:text-[#c9962a] [&.active]:bg-white/10"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Mobile nav */}
        <nav className="md:hidden flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="px-2 py-1 rounded text-xs font-medium hover:bg-white/10 hover:text-[#c9962a] transition-colors [&.active]:text-[#c9962a]"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  )
}
