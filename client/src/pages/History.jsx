import { useEffect, useMemo, useState } from 'react'
import { Trash2, ChevronLeft, ChevronRight, TrendingUp, Layers, Target } from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'
import InfographicChart from '../components/InfographicChart/InfographicChart'
import api from '../services/api'

const verdictText = { Good: 'text-good', Bad: 'text-bad', Neutral: 'text-neutral' }
const verdictDot  = { Good: 'bg-good',  Bad: 'bg-bad',  Neutral: 'bg-neutral' }
const contextLabel = { health: 'Health', eco: 'Eco', productivity: 'Focus', finance: 'Money' }
const FILTERS = ['', 'health', 'eco', 'productivity', 'finance']

function StatCard({ icon: Icon, label, value, sub }) {
  return (
    <div className="card p-5">
      <div className="flex items-center gap-2 mb-3">
        <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-brandSoft text-brand"><Icon size={16} /></span>
        <span className="font-mono text-[10px] uppercase tracking-wider text-faint">{label}</span>
      </div>
      <p className="font-display font-extrabold text-3xl text-text leading-none">{value}</p>
      {sub && <p className="text-muted text-xs mt-1.5">{sub}</p>}
    </div>
  )
}

export default function History() {
  const [scans, setScans] = useState([])
  const [analytics, setAnalytics] = useState(null)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [filter, setFilter] = useState('')
  const [loading, setLoading] = useState(true)

  const fetchData = async () => {
    setLoading(true)
    try {
      const [hist, ana] = await Promise.all([
        api.get('/history', { params: { page, limit: 8, ...(filter && { context: filter }) } }),
        api.get('/history/analytics'),
      ])
      setScans(hist.data.scans); setPages(hist.data.pages); setAnalytics(ana.data)
    } catch { /* ignore */ } finally { setLoading(false) }
  }

  useEffect(() => { fetchData() }, [page, filter])

  const handleDelete = async id => {
    if (!confirm('Delete this scan?')) return
    await api.delete(`/history/${id}`)
    fetchData()
  }

  const contextData = useMemo(() => {
    const b = analytics?.contextBreakdown || {}
    const palette = { health: 'rgb(var(--good))', eco: 'rgb(var(--brand))', productivity: 'rgb(var(--neutral))', finance: 'rgb(var(--bad))' }
    return Object.entries(b).map(([k, v]) => ({ name: contextLabel[k] || k, value: v, fill: palette[k] || 'rgb(var(--muted))' }))
  }, [analytics])

  return (
    <div className="container-vw py-8 md:py-10">
      <div className="mb-8">
        <span className="eyebrow">Dashboard</span>
        <h1 className="font-display font-extrabold text-2xl md:text-3xl text-text mt-2">Your scan history</h1>
      </div>

      {/* Stat cards */}
      {analytics && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard icon={Target} label="Avg score" value={`${analytics.weeklyScore}`} sub="Past 7 days" />
          <StatCard icon={TrendingUp} label="Total scans" value={analytics.totalScans} sub="This week" />
          <StatCard icon={Layers} label="Lenses used" value={Object.keys(analytics.contextBreakdown || {}).length} sub="Of 4 available" />
          <StatCard icon={Target} label="Logged" value={scans.length ? `${scans.length}+` : '0'} sub="On this page" />
        </div>
      )}

      {/* Charts row */}
      {analytics && (
        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          <div className="card p-6 lg:col-span-2">
            <p className="eyebrow mb-4">Weekly activity</p>
            <InfographicChart data={analytics.chartData} />
          </div>
          <div className="card p-6">
            <p className="eyebrow mb-4">By lens</p>
            {contextData.length === 0 ? (
              <p className="text-muted text-sm text-center py-10">No scans yet.</p>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={150}>
                  <PieChart>
                    <Pie data={contextData} dataKey="value" innerRadius={40} outerRadius={62} paddingAngle={3} stroke="none">
                      {contextData.map((d, i) => <Cell key={i} fill={d.fill} />)}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap justify-center gap-x-4 gap-y-1.5 mt-3">
                  {contextData.map(d => (
                    <span key={d.name} className="flex items-center gap-1.5 font-mono text-[10px] text-muted">
                      <span className="w-2 h-2 rounded-full" style={{ background: d.fill }} />{d.name} {d.value}
                    </span>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Filter */}
      <div className="flex gap-2 overflow-x-auto scrollbar-none mb-4">
        {FILTERS.map(c => (
          <button key={c} onClick={() => { setFilter(c); setPage(1) }}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap cursor-pointer transition-colors border ${
              filter === c ? 'bg-brandSoft border-brand text-brand' : 'bg-surface border-border text-muted hover:text-text'
            }`}>
            {c ? contextLabel[c] : 'All'}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="grid sm:grid-cols-2 gap-3">
          {[...Array(6)].map((_, i) => <div key={i} className="h-[68px] card animate-pulse" />)}
        </div>
      ) : scans.length === 0 ? (
        <div className="card py-16 text-center">
          <p className="text-muted">No scans logged yet. Go scan something!</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-3">
          {scans.map(s => (
            <div key={s._id} className="card p-4 flex items-center gap-3">
              <span className={`w-2 h-2 rounded-full shrink-0 ${verdictDot[s.verdict]}`} />
              <div className="flex-1 min-w-0">
                <p className="text-text font-medium capitalize truncate">{s.objectLabel}</p>
                <p className="font-mono text-[11px] text-faint mt-0.5">
                  {contextLabel[s.context]} · {new Date(s.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className={`font-display font-bold ${verdictText[s.verdict]}`}>{s.score}</p>
                <p className={`font-mono text-[10px] ${verdictText[s.verdict]}`}>{s.verdict}</p>
              </div>
              <button onClick={() => handleDelete(s._id)}
                className="text-faint hover:text-bad transition-colors cursor-pointer p-1 shrink-0" aria-label="Delete scan">
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-center gap-5 mt-8">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            className="flex items-center justify-center w-10 h-10 rounded-full card cursor-pointer disabled:opacity-30 hover:border-brand transition-colors" aria-label="Previous page">
            <ChevronLeft size={16} className="text-muted" />
          </button>
          <span className="font-mono text-sm text-muted">{page} / {pages}</span>
          <button onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages}
            className="flex items-center justify-center w-10 h-10 rounded-full card cursor-pointer disabled:opacity-30 hover:border-brand transition-colors" aria-label="Next page">
            <ChevronRight size={16} className="text-muted" />
          </button>
        </div>
      )}
    </div>
  )
}
