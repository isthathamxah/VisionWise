import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg px-3 py-2 bg-surface border border-border shadow-pop">
      <p className="font-mono text-[10px] text-faint uppercase">{label}</p>
      <p className="font-display font-bold text-sm text-text">{payload[0].value} scan{payload[0].value === 1 ? '' : 's'}</p>
    </div>
  )
}

const tick = { fill: 'rgb(var(--faint))', fontSize: 11, fontFamily: 'IBM Plex Mono' }

export default function InfographicChart({ data }) {
  if (!data || data.length === 0) {
    return <p className="text-muted text-sm text-center py-10">No data for this period yet.</p>
  }
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} margin={{ top: 6, right: 4, bottom: 0, left: -18 }}>
        <CartesianGrid vertical={false} stroke="rgb(var(--border))" strokeDasharray="3 4" />
        <XAxis dataKey="date" tick={tick} tickFormatter={d => d.slice(5)} axisLine={false} tickLine={false} />
        {/* Explicit domain — with only a couple of days of data, auto-scaling produces
            oddly-spaced ticks and one bar that dominates the whole chart. */}
        <YAxis tick={tick} allowDecimals={false} axisLine={false} tickLine={false} width={30}
          domain={[0, dataMax => Math.max(4, dataMax + 1)]} />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgb(var(--brand) / 0.08)' }} />
        <Bar dataKey="count" radius={[5, 5, 0, 0]} maxBarSize={36}>
          {data.map((_, i) => <Cell key={i} fill="rgb(var(--brand))" />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
