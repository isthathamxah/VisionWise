import { useEffect, useState } from 'react'
import { CheckCircle2, XCircle, AlertTriangle, RefreshCw, Share2, WifiOff, Sparkles, Tag } from 'lucide-react'
import BreakdownChart from '../InfographicChart/BreakdownChart'
import NutritionPanel from '../InfographicChart/NutritionPanel'
import IngredientInfographic from '../InfographicChart/IngredientInfographic'

const cfg = {
  Good:    { icon: CheckCircle2,  text: 'text-good',    bar: 'rgb(var(--good))',    soft: 'bg-good/10 border-good/25' },
  Bad:     { icon: XCircle,       text: 'text-bad',     bar: 'rgb(var(--bad))',     soft: 'bg-bad/10 border-bad/25' },
  Neutral: { icon: AlertTriangle, text: 'text-neutral', bar: 'rgb(var(--neutral))', soft: 'bg-neutral/10 border-neutral/25' },
}

export default function VerdictCard({ result, onScanAgain, actionLabel = 'Scan again' }) {
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
  const isFood = result.food?.isFood && (result.food.unclear || result.food.nutrients?.length)
  const isLabelRead = result.food?.source === 'label'
  // Only history-sourced scans carry a timestamp — a just-scanned result's "now" is implied.
  const dateLabel = result.createdAt
    ? new Date(result.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
    : null

  const handleShare = async () => {
    const text = `VisionWise — ${result.verdict} (${result.score}/100): ${result.reason}`
    // A fresh scan carries scanLogId; one loaded from history carries _id — either way,
    // if we have an id the scan has a real page to link to.
    const id = result.scanLogId || result._id
    const url = id ? `${window.location.origin}/history/${id}` : undefined
    if (navigator.share) await navigator.share({ title: 'VisionWise verdict', text, url }).catch(() => {})
    else await navigator.clipboard.writeText(url ? `${text}\n${url}` : text).catch(() => {})
  }

  return (
    <div className={`card p-6 animate-reveal border ${c.soft}`}>
      {/* Shown first and impossible to miss — a rule-based guess (used only when the AI
          couldn't be reached) must never look or feel like a real analysis. */}
      {isFallback && (
        <div className="flex items-start gap-2.5 rounded-xl px-3.5 py-3 mb-4 bg-neutral/10 border border-neutral/25">
          <WifiOff size={16} className="text-neutral shrink-0 mt-0.5" />
          <p className="text-sm text-neutral leading-relaxed">
            <span className="font-semibold">Couldn't reach the AI just now.</span> This is a rough, rule-based guess, not a real analysis — try scanning again in a moment.
          </p>
        </div>
      )}
      {isFood ? (
        <>
          {result.food.productName && (
            <p className="font-display font-bold text-lg text-text mb-1.5">{result.food.productName}</p>
          )}
          {/* Nutrition is the primary content for a food scan — the headline verdict stays
              visible but compact instead of competing with it for attention. */}
          <div className="flex items-center gap-2 mb-4">
            <Icon size={18} className={c.text} strokeWidth={2} />
            <span className={`font-display font-bold text-base ${c.text}`}>{result.verdict}</span>
            <span className="font-mono text-xs text-faint" style={{ fontVariantNumeric: 'tabular-nums' }}>
              · {score}/100 overall{dateLabel && ` · ${dateLabel}`}
            </span>
          </div>
        </>
      ) : (
        <>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <Icon size={26} className={c.text} strokeWidth={2} />
              <span className={`font-display font-extrabold text-2xl ${c.text}`}>{result.verdict}</span>
            </div>
            <div className="text-right">
              <span className={`font-display font-extrabold text-4xl ${c.text}`} style={{ fontVariantNumeric: 'tabular-nums' }}>{score}</span>
              <span className="font-mono text-xs text-faint"> /100</span>
              {dateLabel && <p className="font-mono text-[10px] text-faint mt-0.5">{dateLabel}</p>}
            </div>
          </div>

          <div className="h-1.5 rounded-full mb-5 overflow-hidden bg-surface2">
            <div className="h-full rounded-full transition-all duration-700" style={{ width: `${score}%`, background: c.bar }} />
          </div>
        </>
      )}

      <p className="text-text leading-relaxed mb-5">{result.reason}</p>

      {isFood ? (
        <>
          <div className="flex items-center gap-2 rounded-xl px-3 py-2.5 mb-4 bg-surface2 border border-border">
            {isLabelRead ? <Tag size={13} className="text-faint shrink-0" /> : <Sparkles size={13} className="text-faint shrink-0" />}
            <span className="font-mono text-[10px] text-faint uppercase">
              {isLabelRead ? 'Read from package label' : 'Estimated from photo'}
            </span>
          </div>
          <NutritionPanel nutrients={result.food.nutrients} servingNote={result.food.servingNote} unclear={result.food.unclear} source={result.food.source} />
          <IngredientInfographic ingredients={result.food.ingredients} />
          {!result.food.unclear && (
            <p className="text-[11px] text-faint leading-relaxed mb-5">
              General educational information, not medical advice — portion size and frequency matter.
            </p>
          )}
        </>
      ) : (
        <BreakdownChart breakdown={result.breakdown} />
      )}

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

      <div className="flex gap-2.5">
        <button onClick={onScanAgain} className="btn-outline flex-1"><RefreshCw size={15} /> {actionLabel}</button>
        <button onClick={handleShare} className="btn-outline px-4" aria-label="Share verdict"><Share2 size={15} /></button>
      </div>
    </div>
  )
}
