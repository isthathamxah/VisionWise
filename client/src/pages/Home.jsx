import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight, Leaf, Utensils, ScanBarcode,
  Apple, Coffee, Laptop, Wine, BookOpen, ShoppingBag, Cpu,
  ShieldCheck, Sparkles,
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, ResponsiveContainer, Cell,
  PieChart, Pie, Cell as PieCell,
} from 'recharts'
import { useAuth } from '../context/AuthContext'
import { useReveal } from '../hooks/useReveal'
import PhoneMockup from '../components/PhoneMockup/PhoneMockup'
import { STEPS } from '../data/steps'
import api from '../services/api'

const SCAN_ITEMS = [
  { icon: Apple, label: 'Food' }, { icon: Coffee, label: 'Drinks' },
  { icon: Laptop, label: 'Gadgets' }, { icon: Leaf, label: 'Plants' },
  { icon: Wine, label: 'Bottles' }, { icon: BookOpen, label: 'Books' },
  { icon: ShoppingBag, label: 'Products' }, { icon: Cpu, label: 'Electronics' },
]

const CAPABILITIES = [
  { icon: Utensils,    name: 'Nutrition estimate',  tone: 'good',    line: 'Calories, fiber, sugar and more — estimated straight from a photo of your plate.' },
  { icon: ScanBarcode, name: 'Label reading',        tone: 'good',    line: 'Point it at packaging and it reads the real ingredients and nutrition facts.' },
  { icon: Sparkles,    name: 'Ingredient breakdown', tone: 'neutral', line: 'What each ingredient is, why it\'s there, and what it does in your body.' },
  { icon: ShieldCheck, name: 'Honest framing',       tone: 'neutral', line: 'Low, moderate or high impact — never a blanket healthy or unhealthy label.' },
]

const TREND = [
  { d: 'Mon', v: 4 }, { d: 'Tue', v: 7 }, { d: 'Wed', v: 3 },
  { d: 'Thu', v: 9 }, { d: 'Fri', v: 6 }, { d: 'Sat', v: 11 }, { d: 'Sun', v: 8 },
]
const SPLIT = [
  { name: 'Good', value: 58, fill: 'rgb(var(--good))' },
  { name: 'Neutral', value: 27, fill: 'rgb(var(--neutral))' },
  { name: 'Bad', value: 15, fill: 'rgb(var(--bad))' },
]
const toneText = { good: 'text-good', neutral: 'text-neutral', bad: 'text-bad' }
const toneBg   = { good: 'bg-good/10', neutral: 'bg-neutral/10', bad: 'bg-bad/10' }

// Horizontal swipe-carousel of cards — peeks the next card at the edge so it
// reads as "swipe me" rather than a stacked website feature grid.
function Carousel({ label, children }) {
  return (
    <div tabIndex={0} role="group" aria-label={label}
      className="flex gap-4 overflow-x-auto scrollbar-none snap-x snap-mandatory -mx-5 px-5 sm:mx-0 sm:px-0
                     md:grid md:grid-cols-3 md:overflow-visible md:gap-5 focus-visible:outline-2 focus-visible:outline-brand focus-visible:outline-offset-2 rounded-xl2">
      {children}
    </div>
  )
}

export default function Home() {
  const { isAuthenticated } = useAuth()
  const [stats, setStats] = useState(null)
  const reveal = useReveal()

  useEffect(() => {
    if (!isAuthenticated) return
    api.get('/history/analytics').then(r => setStats(r.data)).catch(() => {})
  }, [isAuthenticated])

  return (
    <div ref={reveal}>

      {/* ═══ HERO — visual first, like an app-store listing, not a website banner ═══ */}
      <section className="relative overflow-hidden grid-bg">
        <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] brand-glow blur-3xl opacity-60 pointer-events-none" />
        <div className="container-vw pt-8 pb-10 md:pt-24 md:pb-24">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-14 items-center">

            {/* Phone — shown first on mobile, right-aligned column on desktop.
                Static, not floating — the screen content already animates
                internally (cycling scenes, pulse rings), so the device
                itself doesn't need to drift too; a bobbing phone read more
                like a SaaS marketing hero than an app screen. */}
            <div className="order-1 lg:order-2 lg:justify-self-end">
              <PhoneMockup />
            </div>

            {/* Copy */}
            <div className="order-2 lg:order-1 animate-reveal text-center lg:text-left">
              <span className="chip mb-5 mx-auto lg:mx-0">
                <Sparkles size={12} className="text-brand" /> AI-powered object scanner
              </span>
              <h1 className="font-display font-extrabold tracking-tight text-text leading-[1.05] text-balance"
                style={{ fontSize: 'clamp(2.25rem, 7vw, 4rem)' }}>
                Point your camera.<br />
                Know what&apos;s <span className="text-brand">really in it.</span>
              </h1>
              <p className="text-muted leading-relaxed mt-4 max-w-lg mx-auto lg:mx-0">
                Real nutrition data, honest ingredient breakdowns, no guessing.
              </p>
              <div className="flex flex-wrap justify-center lg:justify-start gap-3 mt-7">
                <Link to={isAuthenticated ? '/scanner' : '/register'} className="btn-brand">
                  {isAuthenticated ? 'Open scanner' : 'Start scanning free'} <ArrowRight size={16} />
                </Link>
                <a href="#how" className="btn-outline">See how it works</a>
              </div>
              <div className="flex items-center justify-center lg:justify-start gap-5 mt-8">
                {[['80+', 'object types'], ['7+', 'nutrients'], ['0–100', 'score']].map(([n, l]) => (
                  <div key={l} className="text-center lg:text-left">
                    <p className="font-display font-extrabold text-xl text-text">{n}</p>
                    <p className="font-mono text-[10px] text-faint uppercase tracking-wider mt-0.5">{l}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ WHAT YOU CAN SCAN ═══ */}
      <section id="scan" className="border-y border-border bg-surface2/40 overflow-hidden">
        <div className="container-vw py-8">
          <p className="text-center font-mono text-xs uppercase tracking-widest text-faint mb-6">
            Point it at almost anything
          </p>
          <div className="relative">
            <div className="flex gap-3 animate-marquee w-max">
              {[...SCAN_ITEMS, ...SCAN_ITEMS].map((it, idx) => {
                const Icon = it.icon
                return (
                  <div key={idx} className="flex items-center gap-2.5 px-5 py-3 rounded-full border border-border bg-surface shrink-0">
                    <Icon size={18} className="text-brand" strokeWidth={2} />
                    <span className="font-medium text-sm text-text">{it.label}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ═══ HOW IT WORKS — swipeable, not a stacked grid ═══ */}
      <section id="how" className="py-12 md:py-24">
        <div className="container-vw max-w-2xl mb-6 md:mb-14 reveal-on-scroll">
          <span className="eyebrow">How it works</span>
          <h2 className="font-display font-extrabold text-text mt-3 leading-tight" style={{ fontSize: 'clamp(1.7rem, 4vw, 2.6rem)' }}>
            From camera to verdict in three seconds.
          </h2>
        </div>
        <div className="container-vw">
          <Carousel label="How it works">
            {STEPS.map((s, i) => {
              const Icon = s.icon
              return (
                <div key={s.k} className="snap-center shrink-0 w-[78%] sm:w-72 md:w-auto card p-6 reveal-on-scroll" style={{ transitionDelay: `${i * 90}ms` }}>
                  <div className="flex items-center justify-between mb-5">
                    <span className="flex items-center justify-center w-11 h-11 rounded-xl bg-brandSoft text-brand">
                      <Icon size={20} strokeWidth={2} />
                    </span>
                    <span className="font-mono text-sm text-faint">{s.k}</span>
                  </div>
                  <h3 className="font-display font-bold text-lg text-text mb-2">{s.title}</h3>
                  <p className="text-muted text-sm leading-relaxed">{s.line}</p>
                </div>
              )
            })}
          </Carousel>
        </div>
      </section>

      {/* ═══ CAPABILITIES — swipeable, not a stacked grid ═══ */}
      <section id="detail" className="bg-surface2/40 border-y border-border py-12 md:py-24">
        <div className="container-vw max-w-2xl mb-6 md:mb-14 reveal-on-scroll">
          <span className="eyebrow">What you get</span>
          <h2 className="font-display font-extrabold text-text mt-3 leading-tight" style={{ fontSize: 'clamp(1.7rem, 4vw, 2.6rem)' }}>
            Not just a score. The real picture.
          </h2>
        </div>
        <div className="container-vw">
          <Carousel label="What you get">
            {CAPABILITIES.map((l, i) => {
              const Icon = l.icon
              return (
                <div key={l.name} className="snap-center shrink-0 w-[78%] sm:w-72 md:w-auto card p-6 reveal-on-scroll" style={{ transitionDelay: `${i * 70}ms` }}>
                  <span className={`flex items-center justify-center w-11 h-11 rounded-xl mb-4 ${toneBg[l.tone]} ${toneText[l.tone]}`}>
                    <Icon size={20} strokeWidth={2} />
                  </span>
                  <h3 className="font-display font-bold text-text mb-1.5">{l.name}</h3>
                  <p className="text-muted text-sm leading-relaxed">{l.line}</p>
                </div>
              )
            })}
          </Carousel>
        </div>
        <div className="container-vw mt-8 text-center md:text-left reveal-on-scroll">
          <Link to={isAuthenticated ? '/scanner' : '/register'} className="btn-brand">
            Try it now <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      {/* ═══ DASHBOARD PREVIEW — one teaser card, not a marketing feature block ═══ */}
      <section className="container-vw py-12 md:py-24">
        <div className="max-w-md mx-auto text-center mb-6 reveal-on-scroll">
          <span className="eyebrow">Your dashboard</span>
          <h2 className="font-display font-extrabold text-text mt-3 leading-tight" style={{ fontSize: 'clamp(1.7rem, 4vw, 2.6rem)' }}>
            Every scan, tracked and visualized.
          </h2>
        </div>

        <div className="max-w-md mx-auto card p-6 md:p-7 reveal-on-scroll">
          <div className="flex items-start justify-between mb-6">
            <div>
              <p className="eyebrow mb-1.5">This week</p>
              <p className="font-display font-extrabold text-3xl text-text">
                {stats?.weeklyScore ?? 74}<span className="text-faint text-lg font-mono"> /100</span>
              </p>
              <p className="text-muted text-sm mt-1">Average verdict score</p>
            </div>
            <div className="chip text-brand"><span className="w-1.5 h-1.5 rounded-full bg-brand animate-pulse-dot" /> live</div>
          </div>

          <div className="grid grid-cols-3 gap-5 items-center">
            <div className="col-span-2">
              <p className="font-mono text-[10px] uppercase tracking-wider text-faint mb-2">Scans / day</p>
              <ResponsiveContainer width="100%" height={130}>
                <BarChart data={TREND} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
                  <XAxis dataKey="d" tick={{ fill: 'rgb(var(--faint))', fontSize: 10, fontFamily: 'IBM Plex Mono' }} axisLine={false} tickLine={false} />
                  <Bar dataKey="v" radius={[4, 4, 0, 0]}>
                    {TREND.map((_, i) => <Cell key={i} fill="rgb(var(--brand))" />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="relative">
              <p className="font-mono text-[10px] uppercase tracking-wider text-faint mb-2 text-center">Split</p>
              <ResponsiveContainer width="100%" height={110}>
                <PieChart>
                  <Pie data={SPLIT} dataKey="value" innerRadius={30} outerRadius={48} paddingAngle={3} stroke="none">
                    {SPLIT.map((s, i) => <PieCell key={i} fill={s.fill} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="flex items-center justify-center gap-4 mt-3">
            {SPLIT.map(s => (
              <span key={s.name} className="flex items-center gap-1.5 font-mono text-[10px] text-muted">
                <span className="w-2 h-2 rounded-full" style={{ background: s.fill }} />
                {s.name} {s.value}%
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ CTA — plain, direct, no boxed marketing banner ═══ */}
      <section className="container-vw pb-16 text-center reveal-on-scroll">
        <h2 className="font-display font-extrabold text-text leading-tight max-w-xl mx-auto" style={{ fontSize: 'clamp(1.8rem, 5vw, 2.75rem)' }}>
          Ready to see what you&apos;re really holding?
        </h2>
        <Link to={isAuthenticated ? '/scanner' : '/register'} className="btn-brand mt-6 h-12 px-8 text-base">
          {isAuthenticated ? 'Open scanner' : 'Get started free'} <ArrowRight size={18} />
        </Link>
      </section>

    </div>
  )
}
