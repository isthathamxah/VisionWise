import { useEffect, useRef, useState } from 'react'
import { Trash2, ChevronLeft, ChevronRight, TrendingUp, Target, Utensils, TriangleAlert, RefreshCw } from 'lucide-react'
import InfographicChart from '../components/InfographicChart/InfographicChart'
import VerdictCard from '../components/VerdictCard/VerdictCard'
import BottomSheet from '../components/BottomSheet/BottomSheet'
import { useToast } from '../context/ToastContext'
import api from '../services/api'

const verdictText = { Good: 'text-good', Bad: 'text-bad', Neutral: 'text-neutral' }
const verdictDot  = { Good: 'bg-good',  Bad: 'bg-bad',  Neutral: 'bg-neutral' }

const PULL_MAX = 90
const PULL_THRESHOLD = 60

// Pulls the page's refresh gesture out of the component — a ref mirrors the drag
// state so the touch listeners don't need to re-subscribe on every pixel moved.
function usePullToRefresh(onRefresh) {
  const [pullDistance, setPullDistance] = useState(0)
  const [refreshing, setRefreshing] = useState(false)
  const drag = useRef({ startY: 0, dragging: false })

  useEffect(() => {
    const onStart = e => {
      if (window.scrollY > 0 || drag.current.refreshing) return
      drag.current.startY = e.touches[0].clientY
      drag.current.dragging = true
    }
    const onMove = e => {
      if (!drag.current.dragging) return
      const delta = e.touches[0].clientY - drag.current.startY
      if (delta > 0 && window.scrollY === 0) {
        setPullDistance(Math.min(PULL_MAX, delta * 0.5))
      } else {
        drag.current.dragging = false
        setPullDistance(0)
      }
    }
    const onEnd = async () => {
      if (!drag.current.dragging) return
      drag.current.dragging = false
      setPullDistance(current => {
        if (current > PULL_THRESHOLD * 0.6) {
          drag.current.refreshing = true
          setRefreshing(true)
          Promise.resolve(onRefresh()).finally(() => { drag.current.refreshing = false; setRefreshing(false) })
          return PULL_THRESHOLD * 0.6
        }
        return 0
      })
    }
    window.addEventListener('touchstart', onStart, { passive: true })
    window.addEventListener('touchmove', onMove, { passive: true })
    window.addEventListener('touchend', onEnd)
    return () => {
      window.removeEventListener('touchstart', onStart)
      window.removeEventListener('touchmove', onMove)
      window.removeEventListener('touchend', onEnd)
    }
  }, [onRefresh])

  return { pullDistance, refreshing }
}

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

// Wraps a row with a touch/mouse-draggable reveal — dragging left exposes a
// full-height delete action behind it, same as iOS/Android list rows. The
// existing tap-to-open and the small delete icon both still work unchanged;
// this is a layered-on affordance, not a replacement.
function SwipeableRow({ scan, onOpen, onDeleteRequest }) {
  const OPEN_X = -84
  const [translateX, setTranslateX] = useState(0)
  const drag = useRef({ startX: 0, baseX: 0, dragging: false, moved: false })

  const onPointerDown = e => {
    drag.current = { startX: e.clientX, baseX: translateX, dragging: true, moved: false }
  }
  const onPointerMove = e => {
    const d = drag.current
    if (!d.dragging) return
    const delta = e.clientX - d.startX
    if (Math.abs(delta) > 4) d.moved = true
    setTranslateX(Math.max(OPEN_X, Math.min(0, d.baseX + delta)))
  }
  const endDrag = () => {
    const d = drag.current
    if (!d.dragging) return
    d.dragging = false
    setTranslateX(t => (t < OPEN_X / 2 ? OPEN_X : 0))
  }
  const handleTap = () => {
    if (drag.current.moved) return // a real drag, not a tap — the pointerup already settled the open/closed state
    if (translateX !== 0) { setTranslateX(0); return } // tapping an open row closes it instead of opening detail
    onOpen(scan)
  }

  return (
    <div className="relative overflow-hidden rounded-xl2">
      <button onClick={() => { setTranslateX(0); onDeleteRequest(scan) }}
        className="absolute inset-y-0 right-0 w-20 flex items-center justify-center bg-bad text-white cursor-pointer" aria-label={`Delete ${scan.objectLabel} scan`}>
        <Trash2 size={18} />
      </button>
      <div role="button" tabIndex={0}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={() => { endDrag(); handleTap() }}
        onPointerCancel={endDrag}
        onKeyDown={e => {
          if (e.key !== 'Enter' && e.key !== ' ') return
          e.preventDefault()
          onOpen(scan)
        }}
        style={{ transform: `translateX(${translateX}px)`, transition: drag.current.dragging ? 'none' : 'transform 0.2s ease-out', touchAction: 'pan-y' }}
        className="relative bg-bg card p-4 flex items-center gap-3 cursor-pointer hover:border-brand transition-colors select-none">
        <span className={`w-2 h-2 rounded-full shrink-0 ${verdictDot[scan.verdict]}`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            {scan.food?.isFood && <Utensils size={12} className="text-brand shrink-0" aria-label="Nutrition detail available" />}
            <p className="text-text font-medium capitalize truncate">{scan.objectLabel}</p>
          </div>
          <p className="font-mono text-[11px] text-faint mt-0.5">
            {new Date(scan.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
          </p>
        </div>
        <div className="text-right shrink-0">
          <p className={`font-display font-bold ${verdictText[scan.verdict]}`}>{scan.score}</p>
          <p className={`font-mono text-[10px] ${verdictText[scan.verdict]}`}>{scan.verdict}</p>
        </div>
        <button onClick={e => { e.stopPropagation(); onDeleteRequest(scan) }}
          onKeyDown={e => e.stopPropagation()}
          onPointerDown={e => e.stopPropagation()}
          className="text-faint hover:text-bad transition-colors cursor-pointer p-2 -m-1 shrink-0" aria-label="Delete scan">
          <Trash2 size={15} />
        </button>
      </div>
    </div>
  )
}

export default function History() {
  const showToast = useToast()
  const [scans, setScans] = useState([])
  const [analytics, setAnalytics] = useState(null)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [selectedScan, setSelectedScan] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null) // the scan pending delete confirmation

  const fetchData = async () => {
    setLoading(true)
    try {
      const [hist, ana] = await Promise.all([
        api.get('/history', { params: { page, limit: 8 } }),
        api.get('/history/analytics'),
      ])
      setScans(hist.data.scans); setPages(hist.data.pages); setAnalytics(ana.data)
    } catch {
      showToast('Could not load your history. Pull down to try again.', 'error')
    } finally { setLoading(false) }
  }

  useEffect(() => { fetchData() }, [page])

  const { pullDistance, refreshing } = usePullToRefresh(fetchData)

  const handleDelete = async id => {
    setConfirmDelete(null)
    try {
      await api.delete(`/history/${id}`)
      showToast('Scan deleted', 'success')
      fetchData()
    } catch {
      showToast('Could not delete that scan. Try again.', 'error')
    }
  }

  return (
    <div className="container-vw py-8 md:py-10">
      <div className="flex items-center justify-center overflow-hidden transition-[height] duration-150" style={{ height: refreshing ? PULL_THRESHOLD * 0.6 : pullDistance }}>
        <RefreshCw size={18} className={`text-brand ${refreshing ? 'animate-spin' : ''}`}
          style={{ transform: refreshing ? undefined : `rotate(${pullDistance * 3}deg)`, opacity: Math.min(1, pullDistance / PULL_THRESHOLD) }} />
      </div>

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
            <SwipeableRow key={s._id} scan={s} onOpen={setSelectedScan} onDeleteRequest={setConfirmDelete} />
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

      <BottomSheet open={!!selectedScan} onClose={() => setSelectedScan(null)}>
        {selectedScan && <VerdictCard result={selectedScan} onScanAgain={() => setSelectedScan(null)} actionLabel="Close" />}
      </BottomSheet>

      <BottomSheet open={!!confirmDelete} onClose={() => setConfirmDelete(null)} maxWidth="max-w-xs">
        {confirmDelete && (
          <div className="p-5">
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
        )}
      </BottomSheet>
    </div>
  )
}
