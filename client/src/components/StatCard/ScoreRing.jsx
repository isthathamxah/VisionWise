import { useEffect, useState } from 'react'

// Same 0-33/34-66/67-100 tiering the backend uses to derive a verdict from a
// score, so the ring's color always agrees with what the app calls it elsewhere.
function tierColor(score) {
  if (score >= 67) return 'rgb(var(--good))'
  if (score >= 34) return 'rgb(var(--neutral))'
  return 'rgb(var(--bad))'
}

export default function ScoreRing({ score, label, sub, size = 108 }) {
  const [animated, setAnimated] = useState(0)
  useEffect(() => {
    const t = setTimeout(() => setAnimated(score), 50) // next tick, so the transition actually plays
    return () => clearTimeout(t)
  }, [score])

  const stroke = 10
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference * (1 - animated / 100)
  const color = tierColor(score)

  return (
    <div className="card p-5 flex items-center gap-4">
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgb(var(--surface2))" strokeWidth={stroke} />
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth={stroke}
            strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 900ms ease-out' }} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-display font-extrabold text-2xl text-text" style={{ fontVariantNumeric: 'tabular-nums' }}>{score}</span>
          <span className="font-mono text-[9px] text-faint uppercase">/ 100</span>
        </div>
      </div>
      <div className="min-w-0">
        <p className="font-mono text-[10px] uppercase tracking-wider text-faint mb-1">{label}</p>
        <p className="text-muted text-xs">{sub}</p>
      </div>
    </div>
  )
}
