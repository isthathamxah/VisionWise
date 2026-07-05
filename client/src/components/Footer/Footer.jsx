import { Link } from 'react-router-dom'
import { Scan, Mail, ChevronUp, HeartPulse, Leaf, BriefcaseBusiness, Coins } from 'lucide-react'

const COLS = [
  { title: 'Product', links: [
    { label: 'Scanner', to: '/scanner' },
    { label: 'Dashboard', to: '/history' },
    { label: 'How it works', to: '/#how' },
  ]},
  { title: 'Lenses', links: [
    { label: 'Health', to: '/#lenses' },
    { label: 'Environment', to: '/#lenses' },
    { label: 'Productivity', to: '/#lenses' },
    { label: 'Finance', to: '/#lenses' },
  ]},
  { title: 'Account', links: [
    { label: 'Sign in', to: '/login' },
    { label: 'Create account', to: '/register' },
  ]},
]

function FooterLink({ to, children }) {
  const cls = 'text-sm text-muted hover:text-brand transition-colors w-fit'
  return to.includes('#')
    ? <a href={to} className={cls}>{children}</a>
    : <Link to={to} className={cls}>{children}</Link>
}

export default function Footer() {
  const scrollTop = () => window.scrollTo({ top: 0, behavior: 'smooth' })

  return (
    <footer className="relative mt-20 border-t border-border bg-surface2/50 overflow-hidden">
      <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[600px] h-48 brand-glow blur-3xl opacity-40 pointer-events-none" />

      <div className="container-vw relative pt-16 pb-10">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">

          {/* Brand */}
          <div>
            <Link to="/" className="flex items-center gap-2 mb-4">
              <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-brand text-white shadow-brand">
                <Scan size={17} strokeWidth={2.4} />
              </span>
              <span className="font-display font-extrabold text-lg text-text">VisionWise</span>
            </Link>
            <p className="text-sm text-muted leading-relaxed max-w-xs mb-5">
              Point your camera at anything and get an honest verdict — through the lens you choose.
            </p>
            <div className="flex items-center gap-2.5">
              {[
                { icon: HeartPulse, tone: 'text-good' },
                { icon: Leaf, tone: 'text-brand' },
                { icon: BriefcaseBusiness, tone: 'text-neutral' },
                { icon: Coins, tone: 'text-bad' },
              ].map(({ icon: Icon, tone }, i) => (
                <span key={i} className={`flex items-center justify-center w-9 h-9 rounded-lg bg-surface border border-border ${tone}`}>
                  <Icon size={16} strokeWidth={2} />
                </span>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {COLS.map(col => (
            <div key={col.title} className="flex flex-col gap-3">
              <span className="eyebrow mb-1">{col.title}</span>
              {col.links.map(l => <FooterLink key={l.label} to={l.to}>{l.label}</FooterLink>)}
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-14 pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="font-mono text-xs text-faint order-2 sm:order-1">
            © {new Date().getFullYear()} VisionWise — Final Year Project
          </p>
          <div className="flex items-center gap-3 order-1 sm:order-2">
            <span className="chip text-faint">Built with React · TensorFlow.js · Gemini</span>
            <a href="mailto:hello@visionwise.app"
              className="flex items-center justify-center w-9 h-9 rounded-full border border-border text-muted hover:text-brand hover:border-brand transition-colors" aria-label="Email">
              <Mail size={16} />
            </a>
            <button onClick={scrollTop}
              className="flex items-center justify-center w-9 h-9 rounded-full border border-border text-muted hover:text-brand hover:border-brand transition-colors cursor-pointer" aria-label="Back to top">
              <ChevronUp size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Watermark wordmark */}
      <div className="relative select-none pointer-events-none" aria-hidden="true">
        <p className="font-display font-extrabold text-center leading-none text-text/[0.03] px-4"
          style={{ fontSize: 'clamp(3rem, 15vw, 12rem)' }}>
          VisionWise
        </p>
      </div>
    </footer>
  )
}
