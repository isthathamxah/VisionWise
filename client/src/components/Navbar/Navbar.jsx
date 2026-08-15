import { useState, useEffect } from 'react'
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { Scan, Sun, Moon, Menu, X } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'

function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2 shrink-0">
      <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-brand text-white shadow-brand">
        <Scan size={17} strokeWidth={2.4} />
      </span>
      <span className="font-display font-extrabold text-[17px] tracking-tight text-text">VisionWise</span>
    </Link>
  )
}

function ThemeToggle() {
  const { theme, toggle } = useTheme()
  return (
    <button onClick={toggle} aria-label="Toggle theme"
      className="flex items-center justify-center w-10 h-10 rounded-full border border-border text-muted hover:text-text hover:border-brand transition-colors cursor-pointer">
      {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
    </button>
  )
}

export default function Navbar() {
  const { isAuthenticated, user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => { setOpen(false) }, [location.pathname])

  const links = isAuthenticated
    ? [{ to: '/scanner', label: 'Scanner' }, { to: '/history', label: 'Dashboard' }]
    : [{ to: '/#how', label: 'How it works' }, { to: '/#detail', label: 'What you get' }, { to: '/#scan', label: 'What you can scan' }]

  const handleLogout = () => { logout(); navigate('/') }

  const isHashLink = to => to.includes('#')

  return (
    <header className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
      scrolled || open ? 'bg-bg/90 backdrop-blur-md border-b border-border' : 'bg-transparent border-b border-transparent'
    }`}>
      <div className="container-vw flex items-center justify-between h-16">
        <Logo />

        {/* Desktop links */}
        <nav className="hidden md:flex items-center gap-1">
          {links.map(l => isHashLink(l.to) ? (
            <a key={l.to} href={l.to} className="px-3.5 py-2 rounded-full text-sm font-medium text-muted hover:text-text hover:bg-surface2 transition-colors">
              {l.label}
            </a>
          ) : (
            <NavLink key={l.to} to={l.to} className={({ isActive }) =>
              `px-3.5 py-2 rounded-full text-sm font-medium transition-colors ${isActive ? 'text-brand bg-brandSoft' : 'text-muted hover:text-text hover:bg-surface2'}`
            }>
              {l.label}
            </NavLink>
          ))}
        </nav>

        {/* Desktop actions */}
        <div className="hidden md:flex items-center gap-2.5">
          <ThemeToggle />
          {isAuthenticated ? (
            <>
              <button onClick={handleLogout} className="btn-ghost h-10 px-4">Sign out</button>
              <div className="flex items-center justify-center w-9 h-9 rounded-full bg-brandSoft text-brand font-display font-bold text-sm">
                {user?.name?.[0]?.toUpperCase() || 'U'}
              </div>
            </>
          ) : (
            <>
              <Link to="/login" className="btn-ghost h-10 px-4">Sign in</Link>
              <Link to="/register" className="btn-brand h-10">Get started</Link>
            </>
          )}
        </div>

        {/* Mobile controls */}
        <div className="flex md:hidden items-center gap-2">
          <ThemeToggle />
          <button onClick={() => setOpen(o => !o)} aria-label="Menu"
            className="flex items-center justify-center w-10 h-10 rounded-full border border-border text-text cursor-pointer">
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden bg-bg border-b border-border container-vw pb-5 pt-1 animate-reveal">
          <nav className="flex flex-col gap-1 mb-4">
            {links.map(l => isHashLink(l.to) ? (
              <a key={l.to} href={l.to} className="px-4 py-3 rounded-xl text-sm font-medium text-text hover:bg-surface2 transition-colors">{l.label}</a>
            ) : (
              <Link key={l.to} to={l.to} className="px-4 py-3 rounded-xl text-sm font-medium text-text hover:bg-surface2 transition-colors">{l.label}</Link>
            ))}
          </nav>
          <div className="flex flex-col gap-2">
            {isAuthenticated ? (
              <button onClick={handleLogout} className="btn-outline w-full">Sign out</button>
            ) : (
              <>
                <Link to="/login" className="btn-outline w-full">Sign in</Link>
                <Link to="/register" className="btn-brand w-full">Get started</Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
