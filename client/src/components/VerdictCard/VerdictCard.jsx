import { useEffect, useState } from 'react'
import { CheckCircle2, XCircle, AlertTriangle, RefreshCw, Share2, Wifi } from 'lucide-react'
import BreakdownChart from '../InfographicChart/BreakdownChart'

const cfg = {
  Good:    { icon: CheckCircle2,  text: 'text-good',    bar: 'rgb(var(--good))',    soft: 'bg-good/10 border-good/25' },
  Bad:     { icon: XCircle,       text: 'text-bad',     bar: 'rgb(var(--bad))',     soft: 'bg-bad/10 border-bad/25' },
  Neutral: { icon: AlertTriangle, text: 'text-neutral', bar: 'rgb(var(--neutral))', soft: 'bg-neutral/10 border-neutral/25' },
}

export default function VerdictCard({ result, onScanAgain }) {
  const [score, setScore] = useState(0)

  useEffect(() => {
    if (!result) return
    setScore(0)
    let cur = 0
    const step = Math.max(1, Math.ceil(result.score / 32))
    const t = setInterval(() => {
      cur = Math.min(cur + step, result.score)
      setScore(cur)
      if (cur >= result.score) clearInterval(t)
    }, 18)
    return () => clearInterval(t)
  }, [result?.score])

  if (!result) return null
  const c = cfg[result.verdict] || cfg.Neutral
  const Icon = c.icon
  const isFallback = result.fallback === true

  const handleShare = async () => {
    const text = `VisionWise — ${result.verdict} (${result.score}/100): ${result.reason}`
    if (navigator.share) await navigator.share({ title: 'VisionWise verdict', text }).catch(() => {})
    else await navigator.clipboard.writeText(text).catch(() => {})
  }

  return (
    <div className={`card p-6 animate-reveal border ${c.soft}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <Icon size={26} className={c.text} strokeWidth={2} />
          <span className={`font-display font-extrabold text-2xl ${c.text}`}>{result.verdict}</span>
        </div>
        <div className="text-right">
          <span className={`font-display font-extrabold text-4xl ${c.text}`} style={{ fontVariantNumeric: 'tabular-nums' }}>{score}</span>
          <span className="font-mono text-xs text-faint"> /100</span>
        </div>
      </div>

      <div className="h-1.5 rounded-full mb-5 overflow-hidden bg-surface2">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${score}%`, background: c.bar }} />
      </div>

      <p className="text-text leading-relaxed mb-5">{result.reason}</p>

      <BreakdownChart breakdown={result.breakdown} />

      {result.tips?.length > 0 && (
        <div className="rounded-xl2 p-4 mb-5 bg-surface2 border border-border">
          <p className="eyebrow mb-3">What to do</p>
          <ul className="flex flex-col gap-2.5">
            {result.tips.map((tip, i) => (
              <li key={i} className="text-sm text-muted flex gap-3 leading-relaxed">
                <span className="font-mono text-xs text-brand shrink-0 mt-0.5">{String(i + 1).padStart(2, '0')}</span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {isFallback && (
        <div className="flex items-center gap-2 rounded-xl px-3 py-2.5 mb-4 bg-surface2 border border-border">
          <Wifi size={13} className="text-faint shrink-0" />
          <p className="text-xs text-muted">Rule-based reading — full AI analysis resumes when the model is available.</p>
        </div>
      )}

      <div className="flex gap-2.5">
        <button onClick={onScanAgain} className="btn-outline flex-1"><RefreshCw size={15} /> Scan again</button>
        <button onClick={handleShare} className="btn-outline px-4" aria-label="Share verdict"><Share2 size={15} /></button>
      </div>
    </div>
  )
}
