import { useEffect, useState } from 'react'
import { Trash2, ChevronLeft, ChevronRight, TrendingUp, Target, X, Utensils, TriangleAlert } from 'lucide-react'
import InfographicChart from '../components/InfographicChart/InfographicChart'
import VerdictCard from '../components/VerdictCard/VerdictCard'
import api from '../services/api'

const verdictText = { Good: 'text-good', Bad: 'text-bad', Neutral: 'text-neutral' }
const verdictDot  = { Good: 'bg-good',  Bad: 'bg-bad',  Neutral: 'bg-neutral' }

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
  const [loading, setLoading] = useState(true)
  const [selectedScan, setSelectedScan] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null) // the scan pending delete confirmation

  useEffect(() => {
    if (!selectedScan && !confirmDelete) return
    const onKey = e => {
      if (e.key !== 'Escape') return
      confirmDelete ? setConfirmDelete(null) : setSelectedScan(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [selectedScan, confirmDelete])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [hist, ana] = await Promise.all([
        api.get('/history', { params: { page, limit: 8 } }),
        api.get('/history/analytics'),
      ])
      setScans(hist.data.scans); setPages(hist.data.pages); setAnalytics(ana.data)
    } catch { /* ignore */ } finally { setLoading(false) }
  }

  useEffect(() => { fetchData() }, [page])

  const handleDelete = async id => {
    setConfirmDelete(null)
    await api.delete(`/history/${id}`)
    fetchData()
  }

  return (
    <div className="container-vw py-8 md:py-10">
      <div className="mb-8">
        <span className="eyebrow">Dashboard</span>
        <h1 className="font-display font-extrabold text-2xl md:text-3xl text-text mt-2">Your scan history</h1>
      </div>

      {/* Stat cards */}
      {analytics && (
        <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-6">
          <StatCard icon={Target} label="Avg score" value={`${analytics.weeklyScore}`} sub="Past 7 days" />
          <StatCard icon={TrendingUp} label="Total scans" value={analytics.totalScans} sub="This week" />
          <StatCard icon={Target} label="Logged" value={scans.length ? `${scans.length}+` : '0'} sub="On this page" />
        </div>
      )}

      {/* Chart */}
      {analytics && (
        <div className="card p-6 mb-8">
          <p className="eyebrow mb-4">Weekly activity</p>
          <InfographicChart data={analytics.chartData} />
        </div>
      )}

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
            <div key={s._id} role="button" tabIndex={0}
              onClick={() => setSelectedScan(s)}
              onKeyDown={e => {
                if (e.key !== 'Enter' && e.key !== ' ') return
                e.preventDefault() // stop Space from also scrolling the page
                setSelectedScan(s)
              }}
              className="card p-4 flex items-center gap-3 cursor-pointer hover:border-brand transition-colors">
              <span className={`w-2 h-2 rounded-full shrink-0 ${verdictDot[s.verdict]}`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  {s.food?.isFood && <Utensils size={12} className="text-brand shrink-0" aria-label="Nutrition detail available" />}
                  <p className="text-text font-medium capitalize truncate">{s.objectLabel}</p>
                </div>
                <p className="font-mono text-[11px] text-faint mt-0.5">
                  {new Date(s.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className={`font-display font-bold ${verdictText[s.verdict]}`}>{s.score}</p>
                <p className={`font-mono text-[10px] ${verdictText[s.verdict]}`}>{s.verdict}</p>
              </div>
              <button onClick={e => { e.stopPropagation(); setConfirmDelete(s) }}
                onKeyDown={e => e.stopPropagation()}
                className="text-faint hover:text-bad transition-colors cursor-pointer p-2 -m-1 shrink-0" aria-label="Delete scan">
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

      {selectedScan && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 py-10 bg-black/60 backdrop-blur-sm"
          onClick={() => setSelectedScan(null)}>
          <div className="w-full max-w-md relative" onClick={e => e.stopPropagation()}>
            <button onClick={() => setSelectedScan(null)} aria-label="Close"
              className="absolute -top-3 -right-3 z-10 flex items-center justify-center w-8 h-8 rounded-full bg-surface border border-border text-muted hover:text-text cursor-pointer shadow-pop">
              <X size={16} />
            </button>
            <VerdictCard result={selectedScan} onScanAgain={() => setSelectedScan(null)} actionLabel="Close" />
          </div>
        </div>
      )}

      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setConfirmDelete(null)}>
          <div className="card w-full max-w-xs p-5" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-2.5 mb-2">
              <span className="flex items-center justify-center w-9 h-9 rounded-xl bg-bad/10 text-bad shrink-0">
                <TriangleAlert size={18} />
              </span>
              <p className="font-display font-bold text-text">Delete this scan?</p>
            </div>
            <p className="text-muted text-sm mb-5"><span className="capitalize">{confirmDelete.objectLabel}</span> — this can't be undone.</p>
            <div className="flex gap-2.5">
              <button onClick={() => setConfirmDelete(null)} className="btn-outline flex-1">Cancel</button>
              <button onClick={() => handleDelete(confirmDelete._id)} className="btn flex-1 text-white bg-bad hover:opacity-90">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
