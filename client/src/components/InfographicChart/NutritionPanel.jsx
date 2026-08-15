// Color reflects whether more of this nutrient is something to watch (limit) or welcome
// (beneficial) — not just how much is present. A "Moderate" amount of fiber and a "Moderate"
// amount of sugar mean opposite things, so they shouldn't share a color.
function nutrientStyle(direction, impact) {
  if (direction === 'beneficial') {
    return impact === 'Low'
      ? { text: 'text-muted', bar: 'rgb(var(--faint))', chip: 'bg-surface border-border' }
      : { text: 'text-good', bar: 'rgb(var(--good))', chip: 'bg-good/10 border-good/25' }
  }
  if (direction === 'limit') {
    if (impact === 'High') return { text: 'text-bad', bar: 'rgb(var(--bad))', chip: 'bg-bad/10 border-bad/25' }
    if (impact === 'Moderate') return { text: 'text-neutral', bar: 'rgb(var(--neutral))', chip: 'bg-neutral/10 border-neutral/25' }
    if (impact === 'Low') return { text: 'text-good', bar: 'rgb(var(--good))', chip: 'bg-good/10 border-good/25' }
  }
  return { text: 'text-muted', bar: 'rgb(var(--faint))', chip: 'bg-surface border-border' }
}

export default function NutritionPanel({ nutrients, servingNote, unclear, source }) {
  const estimated = source === 'estimated'
  const borderStyle = estimated ? 'border-dashed' : ''

  if (unclear) {
    return (
      <div className={`rounded-xl2 p-4 mb-5 bg-surface2 border border-border ${borderStyle}`}>
        <p className="text-sm text-muted text-center py-2">
          Couldn't reliably read nutrition from this photo — try a clearer or closer shot.
        </p>
      </div>
    )
  }

  if (!nutrients?.length) return null

  return (
    <div className={`rounded-xl2 p-4 mb-5 bg-surface2 border border-border ${borderStyle}`}>
      <p className="eyebrow mb-1">Nutrition</p>
      {servingNote && <p className="text-xs text-faint mb-4">{estimated && '~ '}{servingNote}</p>}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {nutrients.map((n, i) => {
          const style = nutrientStyle(n.direction, n.impact)
          const fillPct = Math.min(n.percentDV, 100)
          return (
            <div key={i} className="rounded-xl p-3 bg-surface border border-border">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs text-muted truncate">{n.label}</span>
                {n.impact && (
                  <span className={`font-mono text-[10px] px-1.5 py-0.5 rounded-full border shrink-0 ${style.chip} ${style.text}`}>
                    {n.impact}
                  </span>
                )}
              </div>
              <p className="font-display font-bold text-lg text-text mb-1.5" style={{ fontVariantNumeric: 'tabular-nums' }}>
                {estimated && <span className="text-faint font-normal mr-0.5">~</span>}
                {n.amount}<span className="text-xs font-normal text-faint ml-1">{n.unit}</span>
              </p>
              <div className="flex items-center gap-2">
                <div className="h-1.5 rounded-full overflow-hidden bg-surface2 flex-1">
                  <div className="h-full rounded-full transition-all duration-700" style={{ width: `${fillPct}%`, background: style.bar }} />
                </div>
                {n.percentDV > 0 && (
                  <span className="text-[10px] text-faint shrink-0">{n.percentDV}% DV</span>
                )}
              </div>
              {n.note && <p className="text-xs text-muted mt-2 leading-relaxed">{n.note}</p>}
            </div>
          )
        })}
      </div>
    </div>
  )
}
