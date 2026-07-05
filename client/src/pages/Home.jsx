import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight, HeartPulse, Leaf, BriefcaseBusiness, Coins,
  Apple, Coffee, Laptop, Smartphone, Wine, BookOpen, ShoppingBag, Cpu,
  ScanLine, Zap, ShieldCheck, Sparkles,
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, ResponsiveContainer, Cell,
  PieChart, Pie, Cell as PieCell,
} from 'recharts'
import { useAuth } from '../context/AuthContext'
import { useReveal } from '../hooks/useReveal'
import PhoneMockup from '../components/PhoneMockup/PhoneMockup'
import api from '../services/api'

const SCAN_ITEMS = [
  { icon: Apple, label: 'Food' }, { icon: Coffee, label: 'Drinks' },
  { icon: Laptop, label: 'Gadgets' }, { icon: Leaf, label: 'Plants' },
  { icon: Wine, label: 'Bottles' }, { icon: BookOpen, label: 'Books' },
  { icon: ShoppingBag, label: 'Products' }, { icon: Cpu, label: 'Electronics' },
]

const LENSES = [
  { icon: HeartPulse, name: 'Health', tone: 'good',    line: 'Sugar, calories and additives in what you eat and drink.' },
  { icon: Leaf,       name: 'Environment', tone: 'good', line: 'How recyclable or wasteful an object really is.' },
  { icon: BriefcaseBusiness, name: 'Productivity', tone: 'neutral', line: 'What in your space helps you focus — and what doesn\'t.' },
  { icon: Coins,      name: 'Finance', tone: 'neutral', line: 'Whether a thing is genuinely worth what it costs.' },
]

const STEPS = [
  { icon: ScanLine, k: '01', title: 'Choose a lens', line: 'Pick Health, Environment, Focus or Money — the angle you care about.' },
  { icon: Zap,      k: '02', title: 'Point your camera', line: 'The model detects the object live, right in your browser. Nothing uploaded.' },
  { icon: ShieldCheck, k: '03', title: 'Get the verdict', line: 'An instant score from 0–100, a plain-English reason, and one useful tip.' },
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

      {/* ═══ HERO ═══ */}
      <section className="relative overflow-hidden grid-bg">
        <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] brand-glow blur-3xl opacity-60 pointer-events-none" />
        <div className="container-vw pt-14 pb-16 md:pt-24 md:pb-24">
          <div className="grid lg:grid-cols-2 gap-14 items-center">

            {/* Copy */}
            <div className="animate-reveal">
              <span className="chip mb-6">
                <Sparkles size={12} className="text-brand" /> AI-powered contextual scanner
              </span>
              <h1 className="font-display font-extrabold tracking-tight text-text leading-[1.05] text-balance"
                style={{ fontSize: 'clamp(2.5rem, 6vw, 4rem)' }}>
                Point your camera.<br />
                Get a <span className="text-brand">straight answer.</span>
              </h1>
              <p className="text-muted text-lg leading-relaxed mt-6 max-w-lg">
                VisionWise reads any object through the lens you choose — health, environment,
                focus or money — and tells you plainly whether it&apos;s good, neutral or bad for you.
              </p>
              <div className="flex flex-wrap gap-3 mt-8">
                <Link to={isAuthenticated ? '/scanner' : '/register'} className="btn-brand">
                  {isAuthenticated ? 'Open scanner' : 'Start scanning free'} <ArrowRight size={16} />
                </Link>
                <a href="#how" className="btn-outline">See how it works</a>
              </div>
              <div className="flex items-center gap-6 mt-10">
                {[['80+', 'object types'], ['4', 'lenses'], ['0–100', 'verdict score']].map(([n, l]) => (
                  <div key={l}>
                    <p className="font-display font-extrabold text-2xl text-text">{n}</p>
                    <p className="font-mono text-[11px] text-faint uppercase tracking-wider mt-0.5">{l}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Phone */}
            <div className="animate-float lg:justify-self-end">
              <PhoneMockup />
            </div>
          </div>
        </div>
      </section>

      {/* ═══ WHAT YOU CAN SCAN ═══ */}
      <section id="scan" className="border-y border-border bg-surface2/40 overflow-hidden">
        <div className="container-vw py-10">
          <p className="text-center font-mono text-xs uppercase tracking-widest text-faint mb-7">
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

      {/* ═══ HOW IT WORKS ═══ */}
      <section id="how" className="container-vw py-20 md:py-28">
        <div className="max-w-2xl mb-14 reveal-on-scroll">
          <span className="eyebrow">How it works</span>
          <h2 className="font-display font-extrabold text-text mt-3 leading-tight" style={{ fontSize: 'clamp(1.9rem, 4vw, 2.6rem)' }}>
            From camera to verdict in three seconds.
          </h2>
        </div>
        <div className="grid md:grid-cols-3 gap-5">
          {STEPS.map((s, i) => {
            const Icon = s.icon
            return (
              <div key={s.k} className="card p-7 reveal-on-scroll" style={{ transitionDelay: `${i * 90}ms` }}>
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
        </div>
      </section>

      {/* ═══ LENSES ═══ */}
      <section id="lenses" className="bg-surface2/40 border-y border-border">
        <div className="container-vw py-20 md:py-28">
          <div className="grid lg:grid-cols-2 gap-14 items-start">
            <div className="lg:sticky lg:top-24 reveal-on-scroll">
              <span className="eyebrow">Four lenses</span>
              <h2 className="font-display font-extrabold text-text mt-3 leading-tight" style={{ fontSize: 'clamp(1.9rem, 4vw, 2.6rem)' }}>
                One object. Four ways to judge it.
              </h2>
              <p className="text-muted text-lg leading-relaxed mt-5 max-w-md">
                The same coffee cup is a different story to your body, the planet, your focus
                and your wallet. Choose the lens that matters right now.
              </p>
              <Link to={isAuthenticated ? '/scanner' : '/register'} className="btn-brand mt-8">
                Try it now <ArrowRight size={16} />
              </Link>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              {LENSES.map((l, i) => {
                const Icon = l.icon
                return (
                  <div key={l.name} className="card p-6 reveal-on-scroll hover:-translate-y-1 transition-transform" style={{ transitionDelay: `${i * 70}ms` }}>
                    <span className={`flex items-center justify-center w-11 h-11 rounded-xl mb-4 ${toneBg[l.tone]} ${toneText[l.tone]}`}>
                      <Icon size={20} strokeWidth={2} />
                    </span>
                    <h3 className="font-display font-bold text-text mb-1.5">{l.name}</h3>
                    <p className="text-muted text-sm leading-relaxed">{l.line}</p>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ═══ DASHBOARD / VISUALIZATION ═══ */}
      <section className="container-vw py-20 md:py-28">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="reveal-on-scroll">
            <span className="eyebrow">Your dashboard</span>
            <h2 className="font-display font-extrabold text-text mt-3 leading-tight" style={{ fontSize: 'clamp(1.9rem, 4vw, 2.6rem)' }}>
              Every scan, tracked and visualized.
            </h2>
            <p className="text-muted text-lg leading-relaxed mt-5 max-w-md">
              VisionWise remembers what you scan and turns it into trends — so you can see your
              habits shift over time, lens by lens.
            </p>
            <ul className="mt-7 flex flex-col gap-3">
              {['Weekly activity and average score', 'Verdict breakdown across all scans', 'Filter history by any lens'].map(t => (
                <li key={t} className="flex items-center gap-3 text-sm text-text">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-brandSoft text-brand shrink-0">
                    <ShieldCheck size={12} />
                  </span>
                  {t}
                </li>
              ))}
            </ul>
          </div>

          {/* Chart card */}
          <div className="card p-6 md:p-7 reveal-on-scroll">
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
              {/* bar trend */}
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
              {/* donut split */}
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
        </div>
      </section>

      {/* ═══ CTA ═══ */}
      <section className="container-vw pb-8">
        <div className="relative overflow-hidden rounded-xl2 border border-border p-10 md:p-16 text-center reveal-on-scroll"
          style={{ background: 'linear-gradient(135deg, rgb(var(--brand) / 0.12), rgb(var(--surface2)))' }}>
          <div className="absolute inset-0 grid-bg opacity-50 pointer-events-none" />
          <div className="relative">
            <h2 className="font-display font-extrabold text-text leading-tight max-w-2xl mx-auto" style={{ fontSize: 'clamp(2rem, 5vw, 3rem)' }}>
              Ready to see what you&apos;re really holding?
            </h2>
            <p className="text-muted text-lg mt-4 max-w-lg mx-auto">
              Free to use, works in your browser, no app to install.
            </p>
            <Link to={isAuthenticated ? '/scanner' : '/register'} className="btn-brand mt-8 h-12 px-8 text-base">
              {isAuthenticated ? 'Open scanner' : 'Get started free'} <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>

    </div>
  )
}
