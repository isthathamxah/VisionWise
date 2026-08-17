import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'

const COLORS = { Good: 'rgb(var(--good))', Neutral: 'rgb(var(--neutral))', Bad: 'rgb(var(--bad))' }

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  const { name, value } = payload[0]
  return (
    <div className="rounded-lg px-3 py-2 bg-surface border border-border shadow-pop">
      <p className="font-display font-bold text-sm text-text">{name}</p>
      <p className="font-mono text-[10px] text-faint">{value} scan{value === 1 ? '' : 's'}</p>
    </div>
  )
}

export default function VerdictDonut({ breakdown }) {
  const data = ['Good', 'Neutral', 'Bad']
    .map(name => ({ name, value: breakdown?.[name] || 0 }))
    .filter(d => d.value > 0)
  const total = data.reduce((sum, d) => sum + d.value, 0)

  if (!total) {
    return <p className="text-muted text-sm text-center py-10">No data for this period yet.</p>
  }

  return (
    <div className="flex items-center gap-5">
      <div className="relative w-[132px] h-[132px] shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" innerRadius={42} outerRadius={62}
              paddingAngle={total > 1 ? 3 : 0} strokeWidth={0} startAngle={90} endAngle={-270}>
              {data.map(d => <Cell key={d.name} fill={COLORS[d.name]} />)}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="font-display font-extrabold text-xl text-text" style={{ fontVariantNumeric: 'tabular-nums' }}>{total}</span>
          <span className="font-mono text-[9px] text-faint uppercase">scans</span>
        </div>
      </div>
      <div className="flex flex-col gap-2.5 min-w-0">
        {data.map(d => (
          <div key={d.name} className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full shrink-0" style={{ background: COLORS[d.name] }} />
            <span className="text-sm text-muted flex-1">{d.name}</span>
            <span className="font-mono text-xs text-faint" style={{ fontVariantNumeric: 'tabular-nums' }}>
              {Math.round((d.value / total) * 100)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
