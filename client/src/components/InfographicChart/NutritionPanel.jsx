const IMPACT_STYLES = {
  Low:      { text: 'text-good',    bar: 'rgb(var(--good))',    chip: 'bg-good/10 border-good/25' },
  Moderate: { text: 'text-neutral', bar: 'rgb(var(--neutral))', chip: 'bg-neutral/10 border-neutral/25' },
  High:     { text: 'text-bad',     bar: 'rgb(var(--bad))',     chip: 'bg-bad/10 border-bad/25' },
}

export default function NutritionPanel({ nutrients, servingNote, unclear }) {
  if (unclear) {
    return (
      <div className="rounded-xl2 p-4 mb-5 bg-surface2 border border-border">
        <p className="text-sm text-muted text-center py-2">
          Couldn't reliably read nutrition from this photo — try a clearer or closer shot.
        </p>
      </div>
    )
  }

  if (!nutrients?.length) return null

  return (
    <div className="rounded-xl2 p-4 mb-5 bg-surface2 border border-border">
      <p className="eyebrow mb-1">Nutrition</p>
      {servingNote && <p className="text-xs text-faint mb-4">{servingNote}</p>}
      <div className="grid grid-cols-2 gap-3">
        {nutrients.map((n, i) => {
          const style = IMPACT_STYLES[n.impact] || { text: 'text-muted', bar: 'rgb(var(--faint))', chip: 'bg-surface border-border' }
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
                {n.amount}<span className="text-xs font-normal text-faint ml-1">{n.unit}</span>
              </p>
              <div className="h-1.5 rounded-full overflow-hidden bg-surface2">
                <div className="h-full rounded-full transition-all duration-700" style={{ width: `${fillPct}%`, background: style.bar }} />
              </div>
              {n.note && <p className="text-xs text-muted mt-2 leading-relaxed">{n.note}</p>}
            </div>
          )
        })}
      </div>
    </div>
  )
}
