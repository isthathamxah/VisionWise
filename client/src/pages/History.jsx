import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Trash2, ChevronLeft, ChevronRight, TrendingUp, Utensils, ScanLine, TriangleAlert, RefreshCw, Search, X } from 'lucide-react'
import InfographicChart from '../components/InfographicChart/InfographicChart'
import VerdictDonut from '../components/InfographicChart/VerdictDonut'
import StatCard from '../components/StatCard/StatCard'
import ScoreRing from '../components/StatCard/ScoreRing'
import BottomSheet from '../components/BottomSheet/BottomSheet'
import { useToast } from '../context/ToastContext'
import api from '../services/api'

const verdictText = { Good: 'text-good', Bad: 'text-bad', Neutral: 'text-neutral' }
const verdictBadge = { Good: 'bg-good/10 text-good', Bad: 'bg-bad/10 text-bad', Neutral: 'bg-neutral/10 text-neutral' }

const PULL_MAX = 90
const PULL_THRESHOLD = 60
const PULL_TRIGGER = PULL_THRESHOLD * 0.6 // distance that actually fires a refresh — indicator ramps to this same point

// Pulls the page's refresh gesture out of the component — a ref mirrors the drag
// state so the touch listeners don't need to re-subscribe on every pixel moved.
// Side effects (the refresh call, setRefreshing) live in the touchend handler,
// never inside a setState updater — StrictMode double-invokes updaters in dev,
// which would otherwise fire the refresh twice.
function usePullToRefresh(onRefresh) {
  const [pullDistance, setPullDistance] = useState(0)
  const [refreshing, setRefreshing] = useState(false)
  const drag = useRef({ startX: 0, startY: 0, dragging: false, refreshing: false, distance: 0 })

  useEffect(() => {
    const onStart = e => {
      if (window.scrollY > 0 || drag.current.refreshing || e.touches.length !== 1) return
      if (e.target.closest('[data-swipe-row]')) return // a row-swipe owns this gesture instead
      drag.current.startX = e.touches[0].clientX
      drag.current.startY = e.touches[0].clientY
      drag.current.dragging = true
    }
    const onMove = e => {
      if (!drag.current.dragging || e.touches.length !== 1) return
      const dy = e.touches[0].clientY - drag.current.startY
      const dx = e.touches[0].clientX - drag.current.startX
      if (dy > 0 && dy > Math.abs(dx) && window.scrollY === 0) {
        const next = Math.min(PULL_MAX, dy * 0.5)
        drag.current.distance = next
        setPullDistance(next)
      } else {
        drag.current.dragging = false
        drag.current.distance = 0
        setPullDistance(0)
      }
    }
    const settle = () => {
      if (!drag.current.dragging) return
      drag.current.dragging = false
      if (drag.current.distance > PULL_TRIGGER) {
        drag.current.refreshing = true
        drag.current.distance = PULL_TRIGGER
        setRefreshing(true)
        setPullDistance(PULL_TRIGGER)
        Promise.resolve(onRefresh()).finally(() => { drag.current.refreshing = false; setRefreshing(false) })
      } else {
        drag.current.distance = 0
        setPullDistance(0)
      }
    }
    window.addEventListener('touchstart', onStart, { passive: true })
    window.addEventListener('touchmove', onMove, { passive: true })
    window.addEventListener('touchend', settle)
    window.addEventListener('touchcancel', settle)
    return () => {
      window.removeEventListener('touchstart', onStart)
      window.removeEventListener('touchmove', onMove)
      window.removeEventListener('touchend', settle)
      window.removeEventListener('touchcancel', settle)
    }
  }, [onRefresh])

  return { pullDistance, refreshing }
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
    e.currentTarget.setPointerCapture(e.pointerId) // keeps the drag on this row even if the finger drifts onto a neighbor
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

  const revealed = translateX !== 0

  return (
    <div className="relative overflow-hidden rounded-xl2" data-swipe-row>
      <button onClick={() => { setTranslateX(0); onDeleteRequest(scan) }}
        tabIndex={revealed ? 0 : -1} aria-hidden={!revealed}
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
        className="relative bg-bg card p-4 flex items-center gap-3.5 cursor-pointer hover:border-brand hover:shadow-pop transition-all select-none">
        <span className={`flex items-center justify-center w-9 h-9 rounded-xl shrink-0 ${verdictBadge[scan.verdict]}`}>
          {scan.food?.isFood ? <Utensils size={15} /> : <ScanLine size={15} />}
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-text font-medium capitalize truncate">{scan.objectLabel}</p>
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
          onPointerUp={e => e.stopPropagation()}
          className="text-faint hover:text-bad transition-colors cursor-pointer p-2 -m-1 shrink-0" aria-label="Delete scan">
          <Trash2 size={15} />
        </button>
      </div>
    </div>
  )
}

export default function History() {
  const navigate = useNavigate()
  const showToast = useToast()
  const [scans, setScans] = useState([])
  const [analytics, setAnalytics] = useState(null)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [confirmDelete, setConfirmDelete] = useState(null) // the scan pending delete confirmation
  const [q, setQ] = useState('')
  const [debouncedQ, setDebouncedQ] = useState('')
  const [verdictFilter, setVerdictFilter] = useState('')

  // Debounce search text so it doesn't fire a request on every keystroke.
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q), 300)
    return () => clearTimeout(t)
  }, [q])

  // A changed filter invalidates whatever page you were on.
  useEffect(() => { setPage(1) }, [debouncedQ, verdictFilter])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [hist, ana] = await Promise.all([
        api.get('/history', { params: { page, limit: 8, q: debouncedQ || undefined, verdict: verdictFilter || undefined } }),
        api.get('/history/analytics'),
      ])
      setScans(hist.data.scans); setPages(hist.data.pages); setAnalytics(ana.data)
    } catch {
      showToast('Could not load your history. Pull down to try again.', 'error')
    } finally { setLoading(false) }
  }

  useEffect(() => { fetchData() }, [page, debouncedQ, verdictFilter])

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
      <div className="flex items-center justify-center overflow-hidden transition-[height] duration-150" style={{ height: refreshing ? PULL_TRIGGER : pullDistance }}>
        <RefreshCw size={18} className={`text-brand ${refreshing ? 'animate-spin' : ''}`}
          style={{ transform: refreshing ? undefined : `rotate(${pullDistance * 3}deg)`, opacity: Math.min(1, pullDistance / PULL_TRIGGER) }} />
      </div>

      <div className="mb-8">
        <span className="eyebrow">Dashboard</span>
        <h1 className="font-display font-extrabold text-2xl md:text-3xl text-text mt-2">Your scan history</h1>
      </div>

      {/* Hero stats — avg score gets a ring, the number that matters most shouldn't
          compete equally with the others for attention */}
      {analytics && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6">
          <ScoreRing score={analytics.weeklyScore} label="Avg score" sub="Past 7 days" />
          <StatCard icon={TrendingUp} label="Total scans" value={analytics.totalScans} sub="Past 7 days" />
          <StatCard icon={Utensils} label="Good scans" value={analytics.verdictBreakdown?.Good ?? 0} sub="Past 7 days" />
        </div>
      )}

      {/* Charts */}
      {analytics && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-8">
          <div className="card p-6">
            <p className="eyebrow mb-4">Weekly activity</p>
            <InfographicChart data={analytics.chartData} />
          </div>
          <div className="card p-6">
            <p className="eyebrow mb-4">Verdict split</p>
            <VerdictDonut breakdown={analytics.verdictBreakdown} />
          </div>
        </div>
      )}

      {/* Search + verdict filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-faint pointer-events-none" />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search by object…"
            className="field pl-10 pr-9" aria-label="Search scan history" />
          {q && (
            <button onClick={() => setQ('')} aria-label="Clear search"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-faint hover:text-text cursor-pointer">
              <X size={15} />
            </button>
          )}
        </div>
        <div className="flex gap-2 overflow-x-auto scrollbar-none">
          {['', 'Good', 'Neutral', 'Bad'].map(v => (
            <button key={v || 'all'} onClick={() => setVerdictFilter(v)}
              className={`px-3.5 h-11 sm:h-auto rounded-xl2 font-mono text-xs uppercase tracking-wider shrink-0 cursor-pointer transition-colors border ${
                verdictFilter === v ? 'bg-brand text-white border-brand' : 'bg-surface text-muted border-border hover:border-brand'}`}>
              {v || 'All'}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="grid sm:grid-cols-2 gap-3">
          {[...Array(6)].map((_, i) => <div key={i} className="h-[68px] card animate-pulse" />)}
        </div>
      ) : scans.length === 0 ? (
        <div className="card py-16 text-center">
          <p className="text-muted">
            {debouncedQ || verdictFilter ? 'No scans match this search.' : 'No scans logged yet. Go scan something!'}
          </p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-3">
          {scans.map(s => (
            <SwipeableRow key={s._id} scan={s} onOpen={s => navigate(`/history/${s._id}`)} onDeleteRequest={setConfirmDelete} />
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
