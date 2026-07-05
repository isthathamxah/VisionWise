import { useEffect, useState } from 'react'
import { Apple, Coffee, Laptop, Leaf } from 'lucide-react'

// Cycles through sample detections to show the product in motion.
const SCENES = [
  { obj: 'Apple',        icon: Apple,  context: 'HEALTH', verdict: 'Good',    score: 92, tone: 'good',    conf: 96 },
  { obj: 'Coffee cup',   icon: Coffee, context: 'ECO',    verdict: 'Neutral', score: 54, tone: 'neutral', conf: 89 },
  { obj: 'Laptop',       icon: Laptop, context: 'FOCUS',  verdict: 'Good',    score: 81, tone: 'good',    conf: 93 },
  { obj: 'Plastic bottle',icon: Leaf,  context: 'ECO',    verdict: 'Bad',     score: 24, tone: 'bad',     conf: 91 },
]

const toneColor = {
  good:    'rgb(var(--good))',
  neutral: 'rgb(var(--neutral))',
  bad:     'rgb(var(--bad))',
}

export default function PhoneMockup() {
  const [i, setI] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setI(v => (v + 1) % SCENES.length), 3000)
    return () => clearInterval(t)
  }, [])
  const s = SCENES[i]
  const Icon = s.icon
  const color = toneColor[s.tone]

  return (
    <div className="relative w-[268px] mx-auto select-none" aria-hidden="true">
      {/* ambient glow */}
      <div className="absolute -inset-10 brand-glow blur-2xl opacity-70" />

      {/* phone body */}
      <div className="relative rounded-[2.6rem] p-3 bg-surface border border-border shadow-pop">
        <div className="relative rounded-[2rem] overflow-hidden" style={{ aspectRatio: '9/19' }}>

          {/* camera scene */}
          <div className="absolute inset-0" style={{
            background: 'linear-gradient(160deg, rgb(var(--surface2)) 0%, rgb(var(--bg)) 60%, rgb(var(--surface2)) 100%)',
          }}>
            <div className="absolute inset-0 grid-bg opacity-60" />
          </div>

          {/* status bar */}
          <div className="absolute top-0 left-0 right-0 h-8 flex items-center justify-between px-4 z-20">
            <span className="font-mono text-[9px] text-muted">9:41</span>
            <span className="flex items-center gap-1 font-mono text-[8px] text-brand">
              <span className="w-1.5 h-1.5 rounded-full bg-brand animate-pulse-dot" /> LIVE
            </span>
          </div>

          {/* object in frame */}
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <div key={i} className="relative animate-reveal">
              {/* pulse rings */}
              <span className="absolute inset-0 rounded-full" style={{ border: `2px solid ${color}`, animation: 'ring 2.4s ease-out infinite' }} />
              <div className="w-28 h-28 rounded-full flex items-center justify-center"
                style={{ background: `rgb(var(--surface))`, border: `2px solid ${color}`, boxShadow: `0 0 40px ${color}44` }}>
                <Icon size={44} strokeWidth={1.6} style={{ color }} />
              </div>
              {/* bounding label */}
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap px-2 py-0.5 rounded-md font-mono text-[9px] text-white"
                style={{ background: color }}>
                {s.obj} · {s.conf}%
              </div>
            </div>
          </div>

          {/* scan line */}
          <div className="absolute left-0 right-0 h-px z-10" style={{ background: color, boxShadow: `0 0 12px ${color}`, animation: 'scan 2.6s ease-in-out infinite' }} />

          {/* verdict card */}
          <div className="absolute bottom-0 left-0 right-0 p-3 z-20">
            <div key={`v${i}`} className="rounded-xl2 p-3 bg-surface/95 border border-border backdrop-blur animate-reveal"
              style={{ boxShadow: '0 8px 30px rgb(var(--shadow) / 0.18)' }}>
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-[9px] tracking-widest" style={{ color }}>{s.context}</span>
                <span className="font-mono text-[9px] text-faint">{s.score}/100</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-display font-bold text-lg" style={{ color }}>{s.verdict}</span>
                <div className="flex gap-1">
                  {SCENES.map((_, k) => (
                    <span key={k} className="w-1.5 h-1.5 rounded-full transition-colors"
                      style={{ background: k === i ? color : 'rgb(var(--border))' }} />
                  ))}
                </div>
              </div>
              {/* score bar */}
              <div className="mt-2 h-1 rounded-full overflow-hidden" style={{ background: 'rgb(var(--border))' }}>
                <div className="h-full rounded-full transition-all duration-700" style={{ width: `${s.score}%`, background: color }} />
              </div>
            </div>
          </div>

          {/* notch */}
          <div className="absolute top-2 left-1/2 -translate-x-1/2 w-16 h-4 rounded-full bg-surface border border-border z-30" />
        </div>
      </div>
    </div>
  )
}
