const CONCERN_STYLES = {
  Low:      { text: 'text-good',    chip: 'bg-good/10 border-good/25' },
  Moderate: { text: 'text-neutral', chip: 'bg-neutral/10 border-neutral/25' },
  High:     { text: 'text-bad',     chip: 'bg-bad/10 border-bad/25' },
}

export default function IngredientInfographic({ ingredients }) {
  if (!ingredients?.length) return null

  return (
    <div className="rounded-xl2 p-4 mb-5 bg-surface2 border border-border">
      <p className="eyebrow mb-3">Ingredients to know</p>
      <div className="flex flex-col gap-3">
        {ingredients.map((ing, i) => {
          const style = CONCERN_STYLES[ing.concern]
          return (
            <div key={i} className="rounded-xl p-3 bg-surface border border-border">
              <div className="flex items-center justify-between mb-1.5 gap-2">
                <span className="font-display font-bold text-sm text-text">{ing.name}</span>
                {ing.concern && (
                  <span className={`font-mono text-[10px] px-1.5 py-0.5 rounded-full border shrink-0 ${style.chip} ${style.text}`}>
                    {ing.concern} concern
                  </span>
                )}
              </div>
              {ing.whatItIs && <p className="text-xs text-muted leading-relaxed"><span className="text-faint">What: </span>{ing.whatItIs}</p>}
              {ing.whyUsed && <p className="text-xs text-muted leading-relaxed"><span className="text-faint">Why: </span>{ing.whyUsed}</p>}
              {ing.effect && <p className="text-xs text-muted leading-relaxed"><span className="text-faint">Effect: </span>{ing.effect}</p>}
            </div>
          )
        })}
      </div>
    </div>
  )
}
