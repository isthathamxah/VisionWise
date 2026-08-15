import { useEffect, useRef, useState } from 'react'
import { FlipHorizontal2, Zap, ScanLine, Upload, RotateCcw } from 'lucide-react'
import Camera from '../components/Camera/Camera'
import ContextSelector from '../components/ContextSelector/ContextSelector'
import VerdictCard from '../components/VerdictCard/VerdictCard'
import { useCamera } from '../hooks/useCamera'
import { useDetection } from '../hooks/useDetection'
import { captureFrame } from '../utils/canvasOverlay'
import api from '../services/api'

function Corner({ pos }) {
  const s = {
    tl: { top: 12, left: 12, borderTop: '2px solid', borderLeft: '2px solid' },
    tr: { top: 12, right: 12, borderTop: '2px solid', borderRight: '2px solid' },
    bl: { bottom: 12, left: 12, borderBottom: '2px solid', borderLeft: '2px solid' },
    br: { bottom: 12, right: 12, borderBottom: '2px solid', borderRight: '2px solid' },
  }
  return <div style={{ position: 'absolute', width: 22, height: 22, borderRadius: 3, borderColor: 'rgb(var(--brand))', opacity: 0.8, ...s[pos] }} />
}

export default function Scanner() {
  const [context, setContext] = useState('health')
  const [isScanning, setIsScanning] = useState(false)
  const [scanResult, setScanResult] = useState(null)
  const [scanError, setScanError] = useState('')

  const { videoRef, isReady, error: camError, startCamera, stopCamera, flipCamera } = useCamera()
  const { predictions, isModelLoaded, detectedObject: liveObject, confidence: liveConfidence, detectImage } = useDetection(videoRef, isReady)

  const fileInputRef = useRef(null)
  const uploadImgRef = useRef(null)
  const [uploadedSrc, setUploadedSrc] = useState(null)
  const [uploadPrediction, setUploadPrediction] = useState(null)
  const [isDetectingUpload, setIsDetectingUpload] = useState(false)

  useEffect(() => {
    startCamera()
    return () => stopCamera()
  }, [])

  const detectedObject = uploadedSrc ? uploadPrediction?.class || null : liveObject
  const confidence = uploadedSrc ? (uploadPrediction ? Math.round(uploadPrediction.score * 100) : null) : liveConfidence

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0]
    e.target.value = '' // allow re-selecting the same file later
    if (!file) return
    setScanResult(null); setScanError(''); setUploadPrediction(null)
    const reader = new FileReader()
    reader.onload = () => setUploadedSrc(reader.result)
    reader.readAsDataURL(file)
  }

  const handleUploadImgLoad = async () => {
    if (!uploadImgRef.current) return
    setIsDetectingUpload(true)
    try {
      const preds = await detectImage(uploadImgRef.current)
      setUploadPrediction(preds[0] || null)
    } finally {
      setIsDetectingUpload(false)
    }
  }

  const useCameraInstead = () => {
    setUploadedSrc(null); setUploadPrediction(null); setScanResult(null); setScanError('')
  }

  const handleScan = async () => {
    if (!detectedObject || isScanning) return
    setScanError(''); setIsScanning(true); setScanResult(null)
    if (navigator.vibrate) navigator.vibrate(35)
    try {
      const imageBase64 = captureFrame(uploadedSrc ? uploadImgRef.current : videoRef.current)
      const { data } = await api.post('/scan', { imageBase64, objectLabel: detectedObject, context })
      setScanResult(data)
      if (navigator.vibrate) navigator.vibrate(data.verdict === 'Good' ? [25, 20, 25] : 55)
    } catch (err) {
      setScanError(err.response?.data?.error || 'Scan failed. Try again.')
    } finally { setIsScanning(false) }
  }

  const showSweep = !uploadedSrc && isReady && isModelLoaded && !scanResult && !isScanning
  const showLockOnHint = !detectedObject && !isDetectingUpload && !scanResult && (uploadedSrc ? true : (isModelLoaded && isReady))

  return (
    <div className="container-vw py-6 md:py-10">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6 flex items-end justify-between gap-4 flex-wrap">
          <div>
            <span className="eyebrow">Scanner</span>
            <h1 className="font-display font-extrabold text-2xl md:text-3xl text-text mt-2">Point &amp; scan</h1>
          </div>

          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} hidden />
          {uploadedSrc ? (
            <button onClick={useCameraInstead} className="btn-outline h-10 px-4">
              <RotateCcw size={15} /> Use camera instead
            </button>
          ) : (
            <button onClick={() => fileInputRef.current?.click()} disabled={!isModelLoaded} className="btn-outline h-10 px-4">
              <Upload size={15} /> Upload photo
            </button>
          )}
        </div>

        <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-6 items-start">
          {/* Left: camera / upload */}
          <div className="flex flex-col gap-5">
            <ContextSelector selected={context} onSelect={c => { setContext(c); setScanResult(null) }} />

            <div className="relative overflow-hidden rounded-xl2 border border-border bg-black" style={{ aspectRatio: '4/3' }}>
              {uploadedSrc ? (
                <img
                  ref={uploadImgRef}
                  src={uploadedSrc}
                  onLoad={handleUploadImgLoad}
                  alt="Uploaded scan"
                  className="w-full h-full object-cover"
                />
              ) : (
                <Camera videoRef={videoRef} predictions={predictions} verdict={scanResult?.verdict || null} />
              )}

              {(uploadedSrc || isReady) && <><Corner pos="tl" /><Corner pos="tr" /><Corner pos="bl" /><Corner pos="br" /></>}

              {showSweep && (
                <div className="pointer-events-none absolute left-0 right-0 h-px top-0"
                  style={{ background: 'rgb(var(--brand))', boxShadow: '0 0 14px rgb(var(--brand))', animation: 'scan 2.8s ease-in-out infinite' }} />
              )}

              {detectedObject && (
                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-black/70 backdrop-blur border border-white/10">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand animate-pulse-dot" />
                    <span className="font-mono text-xs text-white capitalize">{detectedObject}</span>
                  </div>
                  <span className="font-mono text-xs text-brand px-3 py-1.5 rounded-lg bg-black/70 backdrop-blur border border-white/10">{confidence}%</span>
                </div>
              )}

              {!uploadedSrc && (
                <button onClick={flipCamera}
                  className="absolute top-3 right-3 p-2.5 rounded-xl bg-black/60 backdrop-blur border border-white/10 text-white cursor-pointer hover:bg-black/80 transition-colors"
                  aria-label="Flip camera">
                  <FlipHorizontal2 size={17} />
                </button>
              )}

              {!uploadedSrc && !isModelLoaded && !camError && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/75">
                  <div className="w-7 h-7 border-2 border-white/20 border-t-brand rounded-full animate-spin" />
                  <span className="font-mono text-xs text-white/80 uppercase tracking-wider">Loading model</span>
                </div>
              )}

              {isDetectingUpload && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/75">
                  <div className="w-7 h-7 border-2 border-white/20 border-t-brand rounded-full animate-spin" />
                  <span className="font-mono text-xs text-white/80 uppercase tracking-wider">Detecting</span>
                </div>
              )}

              {!uploadedSrc && camError && (
                <div className="absolute inset-0 flex items-center justify-center p-6 bg-black/90 text-center">
                  <div>
                    <p className="text-bad text-sm font-medium mb-1">Camera unavailable</p>
                    <p className="text-white/60 text-xs leading-relaxed">{camError}</p>
                  </div>
                </div>
              )}
            </div>

            <button onClick={handleScan} disabled={!detectedObject || isScanning || (!uploadedSrc && !isReady)} className="btn-brand w-full h-12">
              {isScanning
                ? <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Analyzing…</>
                : <><Zap size={17} />Scan now</>}
            </button>

            {showLockOnHint && (
              <div className="flex items-center justify-center gap-2 text-sm text-muted">
                <ScanLine size={15} />
                {uploadedSrc ? "Couldn't identify an object in this photo — try another" : 'Point the camera at an object to lock on'}
              </div>
            )}
          </div>

          {/* Right: verdict / placeholder */}
          <div className="lg:sticky lg:top-24">
            {scanError && (
              <div className="rounded-xl2 px-4 py-3 mb-4 bg-bad/10 border border-bad/25">
                <p className="text-bad text-sm">{scanError}</p>
              </div>
            )}
            {scanResult ? (
              <VerdictCard result={scanResult} onScanAgain={() => setScanResult(null)} />
            ) : (
              <div className="card p-8 text-center hidden lg:flex flex-col items-center justify-center min-h-[340px]">
                <span className="flex items-center justify-center w-14 h-14 rounded-2xl bg-brandSoft text-brand mb-4">
                  <ScanLine size={26} />
                </span>
                <p className="font-display font-bold text-text mb-1.5">Your verdict appears here</p>
                <p className="text-muted text-sm max-w-xs">Lock onto an object and tap <span className="text-text font-medium">Scan now</span> to get a score, reason and tips.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
