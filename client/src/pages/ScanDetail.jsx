import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import VerdictCard from '../components/VerdictCard/VerdictCard'
import { useToast } from '../context/ToastContext'
import api from '../services/api'

export default function ScanDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const showToast = useToast()
  const [scan, setScan] = useState(null)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    let active = true
    setScan(null); setNotFound(false)
    api.get(`/history/${id}`)
      .then(({ data }) => { if (active) setScan(data) })
      .catch(() => {
        if (!active) return
        setNotFound(true)
        showToast('Could not find that scan.', 'error')
      })
    return () => { active = false }
  }, [id])

  return (
    <div className="container-vw py-6 md:py-10 max-w-lg">
      <Link to="/history" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-text transition-colors mb-6">
        <ChevronLeft size={16} /> Back to history
      </Link>

      {notFound ? (
        <div className="card py-16 text-center">
          <p className="text-muted">That scan doesn&apos;t exist, or isn&apos;t yours.</p>
        </div>
      ) : scan ? (
        <VerdictCard result={scan} onScanAgain={() => navigate('/history')} actionLabel="Back to history" />
      ) : (
        <div className="h-[420px] card animate-pulse" />
      )}
    </div>
  )
}
