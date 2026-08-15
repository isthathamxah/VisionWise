const PALETTE = ['#059669', '#10b981', '#34d399', '#6ee7b7', '#a7f3d0']

// ponytail: sequential emerald palette, not per-item sentiment — Gemini doesn't classify
// each factor as good/bad, only weights them. Add sentiment coloring if that's ever needed.
export default function BreakdownChart({ breakdown }) {
  if (!breakdown?.length) return null

  let acc = 0
  const stops = breakdown
    .map((b, i) => {
      const start = acc
      acc += b.percent
      return `${PALETTE[i % PALETTE.length]} ${start}% ${acc}%`
    })
    .join(', ')

  return (
    <div className="rounded-xl2 p-4 mb-5 bg-surface2 border border-border">
      <p className="eyebrow mb-4">Breakdown</p>
      <div className="flex items-center gap-5">
        <div className="shrink-0 rounded-full" style={{ width: 96, height: 96, background: `conic-gradient(${stops})` }}>
          <div
            className="w-full h-full rounded-full"
            style={{ background: 'radial-gradient(closest-side, rgb(var(--surface2)) 58%, transparent 59%)' }}
          />
        </div>
        <ul className="flex-1 flex flex-col gap-2 min-w-0">
          {breakdown.map((b, i) => (
            <li key={i} className="flex items-center gap-2 text-sm">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: PALETTE[i % PALETTE.length] }} />
              <span className="flex-1 text-muted truncate">{b.label}</span>
              <span className="font-mono text-xs text-text shrink-0">{b.percent}%</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
