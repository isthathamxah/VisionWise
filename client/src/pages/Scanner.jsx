import { useEffect, useRef, useState } from 'react'
import { FlipHorizontal2, Zap, ScanLine, Upload, RotateCcw, Aperture, Check } from 'lucide-react'
import Camera from '../components/Camera/Camera'
import VerdictCard from '../components/VerdictCard/VerdictCard'
import Onboarding from '../components/Onboarding/Onboarding'
import { useCamera } from '../hooks/useCamera'
import { useDetection } from '../hooks/useDetection'
import { captureFrame } from '../utils/canvasOverlay'
import { dedupeDetections } from '../utils/detections'
import { useToast } from '../context/ToastContext'
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
  const showToast = useToast()
  const [isScanning, setIsScanning] = useState(false)
  const [scanResult, setScanResult] = useState(null)
  const [manualSelection, setManualSelection] = useState(null) // object class tapped from the chip row, overriding the top detection

  const { videoRef, isReady, error: camError, startCamera, stopCamera, flipCamera } = useCamera()
  const { predictions: livePredictions, isModelLoaded, detectImage } = useDetection(videoRef, isReady)

  const fileInputRef = useRef(null)
  const uploadImgRef = useRef(null)
  const uploadTokenRef = useRef(0) // invalidates in-flight detection when superseded by a new upload or a switch back to camera
  const [uploadedSrc, setUploadedSrc] = useState(null)
  const [uploadPredictions, setUploadPredictions] = useState([])
  const [isDetectingUpload, setIsDetectingUpload] = useState(false)
  const [capturedPreview, setCapturedPreview] = useState(null) // just-taken photo, awaiting retake/confirm

  useEffect(() => {
    startCamera()
    return () => stopCamera()
  }, [])

  // While reviewing a just-taken photo, ignore stale live-detection state entirely —
  // it belongs to the frame under the preview, not the frozen shot on top of it.
  const rawPredictions = capturedPreview ? [] : uploadedSrc ? uploadPredictions : livePredictions
  const detections = dedupeDetections(rawPredictions) // one chip per distinct object class
  const selected = detections.find(d => d.class === manualSelection) || detections[0] || null
  const detectedObject = selected?.class || null

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0]
    e.target.value = '' // allow re-selecting the same file later
    if (!file) return
    uploadTokenRef.current += 1
    setScanResult(null); setUploadPredictions([]); setIsDetectingUpload(true); setCapturedPreview(null); setManualSelection(null)
    stopCamera() // release the camera while a static photo is shown
    const reader = new FileReader()
    reader.onload = () => setUploadedSrc(reader.result)
    reader.readAsDataURL(file)
  }

  const handleCapture = () => {
    if (!videoRef.current) return
    setScanResult(null) // matches every other mode transition — don't leave a stale verdict showing
    setCapturedPreview(captureFrame(videoRef.current))
  }

  const retakePhoto = () => setCapturedPreview(null)

  const confirmCapture = () => {
    if (!capturedPreview) return
    uploadTokenRef.current += 1
    setScanResult(null); setUploadPredictions([]); setIsDetectingUpload(true); setManualSelection(null)
    stopCamera() // same handoff as a file upload — this is now a static image to scan
    setUploadedSrc(capturedPreview)
    setCapturedPreview(null)
  }

  const handleUploadImgLoad = async () => {
    const token = uploadTokenRef.current
    if (!uploadImgRef.current) { setIsDetectingUpload(false); return }
    try {
      const preds = await detectImage(uploadImgRef.current)
      if (uploadTokenRef.current !== token) return // a newer upload or a camera switch happened meanwhile
      setUploadPredictions(preds)
    } finally {
      if (uploadTokenRef.current === token) setIsDetectingUpload(false)
    }
  }

  const handleUploadImgError = () => {
    uploadTokenRef.current += 1
    setUploadedSrc(null); setUploadPredictions([]); setIsDetectingUpload(false); setManualSelection(null)
    showToast('Could not load that image. Try a different file.', 'error')
    startCamera()
  }

  const useCameraInstead = () => {
    uploadTokenRef.current += 1
    setUploadedSrc(null); setUploadPredictions([]); setScanResult(null); setIsDetectingUpload(false); setCapturedPreview(null); setManualSelection(null)
    startCamera()
  }

  const handleScan = async () => {
    if (isScanning || (!uploadedSrc && !detectedObject)) return // live camera still needs a lock-on; a fixed photo doesn't
    setIsScanning(true); setScanResult(null)
    if (navigator.vibrate) navigator.vibrate(35)
    try {
      const imageBase64 = captureFrame(uploadedSrc ? uploadImgRef.current : videoRef.current)
      // COCO-SSD's fixed 80-class vocabulary misses plenty of real food (eggs, flour,
      // butter...) — when it finds nothing, Gemini still analyzes the actual photo, it
      // just doesn't get a hint label to go on.
      const { data } = await api.post('/scan', { imageBase64, objectLabel: detectedObject || 'item in photo' })
      setScanResult(data)
      if (navigator.vibrate) navigator.vibrate(data.verdict === 'Good' ? [25, 20, 25] : 55)
    } catch (err) {
      showToast(err.response?.data?.error || 'Scan failed. Try again.', 'error')
    } finally { setIsScanning(false) }
  }

  // Scans every distinct detected object against the same frame, one Gemini call
  // each, in sequence — a toast per result as they land, the last one shown in
  // the verdict panel, the rest waiting in History.
  const handleScanAll = async () => {
    if (isScanning || detections.length < 2) return
    setIsScanning(true); setScanResult(null)
    const imageBase64 = captureFrame(uploadedSrc ? uploadImgRef.current : videoRef.current)
    let lastResult = null
    for (const d of detections) {
      try {
        const { data } = await api.post('/scan', { imageBase64, objectLabel: d.class })
        lastResult = data
        showToast(`${d.class}: ${data.verdict} · ${data.score}/100`, 'success')
      } catch {
        showToast(`Could not scan ${d.class}.`, 'error')
      }
    }
    if (lastResult) setScanResult(lastResult)
    if (navigator.vibrate) navigator.vibrate(40)
    setIsScanning(false)
    showToast(`Scanned ${detections.length} items — see them all in your dashboard.`, 'info')
  }

  const showSweep = !uploadedSrc && !capturedPreview && isReady && isModelLoaded && !scanResult && !isScanning
  const showLockOnHint = !capturedPreview && !detectedObject && !isDetectingUpload && !scanResult && (uploadedSrc ? true : (isModelLoaded && isReady))

  return (
    <div className="container-vw py-6 md:py-10">
      <Onboarding />
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <span className="eyebrow">Scanner</span>
          <h1 className="font-display font-extrabold text-2xl md:text-3xl text-text mt-2">Point &amp; scan</h1>
        </div>

        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} hidden />

        <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-6 items-start">
          {/* Left: camera / upload */}
          <div className="flex flex-col gap-5">
            <div className="relative overflow-hidden rounded-xl2 border border-border bg-black" style={{ aspectRatio: '4/3' }}>
              {uploadedSrc ? (
                <img
                  ref={uploadImgRef}
                  src={uploadedSrc}
                  onLoad={handleUploadImgLoad}
                  onError={handleUploadImgError}
                  alt="Uploaded scan"
                  className="w-full h-full object-contain"
                />
              ) : (
                <Camera videoRef={videoRef} predictions={livePredictions} verdict={scanResult?.verdict || null} />
              )}

              {capturedPreview && (
                <img src={capturedPreview} alt="Captured preview" className="absolute inset-0 w-full h-full object-contain" />
              )}

              {(uploadedSrc || isReady) && <><Corner pos="tl" /><Corner pos="tr" /><Corner pos="bl" /><Corner pos="br" /></>}

              {showSweep && (
                <div className="pointer-events-none absolute left-0 right-0 h-px top-0"
                  style={{ background: 'rgb(var(--brand))', boxShadow: '0 0 14px rgb(var(--brand))', animation: 'scan 2.8s ease-in-out infinite' }} />
              )}

              {capturedPreview ? (
                <div className="absolute bottom-3 left-3 right-3 z-10 flex items-center gap-2">
                  <button onClick={retakePhoto} className="btn-outline flex-1 h-11 bg-black/70 backdrop-blur text-white border-white/20 hover:bg-black/80">
                    <RotateCcw size={15} /> Retake
                  </button>
                  <button onClick={confirmCapture} className="btn-brand flex-1 h-11">
                    <Check size={15} /> Use this photo
                  </button>
                </div>
              ) : detections.length > 0 && (
                <div className="absolute bottom-3 left-3 right-3 z-10 flex items-center gap-2 overflow-x-auto scrollbar-none">
                  {detections.map(d => (
                    <button key={d.class} onClick={() => setManualSelection(d.class)}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg backdrop-blur border shrink-0 cursor-pointer transition-colors ${
                        d.class === detectedObject ? 'bg-brand/90 border-brand text-white' : 'bg-black/70 border-white/10 text-white hover:border-white/30'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${d.class === detectedObject ? 'bg-white animate-pulse-dot' : 'bg-brand'}`} />
                      <span className="font-mono text-xs capitalize">{d.class}</span>
                      <span className="font-mono text-[10px] opacity-70">{Math.round(d.score * 100)}%</span>
                    </button>
                  ))}
                </div>
              )}

              {/* One control cluster, one physical spot, for however the image gets there */}
              {uploadedSrc ? (
                <button onClick={useCameraInstead}
                  className="absolute top-3 right-3 z-10 btn-outline h-10 px-3 bg-black/60 backdrop-blur text-white border-white/20 hover:bg-black/80">
                  <RotateCcw size={15} /> Use camera
                </button>
              ) : !capturedPreview && (
                <div className="absolute top-3 right-3 z-10 flex items-center gap-2">
                  {/* Icon-only buttons tested confusing for first-time users — matched to the
                      already-established "Use camera" pill style: icon plus a visible label. */}
                  {isModelLoaded && (
                    <button onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-1.5 h-10 pl-2.5 pr-3 rounded-xl bg-black/60 backdrop-blur border border-white/10 text-white text-xs font-medium cursor-pointer hover:bg-black/80 transition-colors"
                      aria-label="Upload photo">
                      <Upload size={15} /> Upload
                    </button>
                  )}
                  {isReady && (
                    <button onClick={handleCapture} disabled={isScanning}
                      className="flex items-center gap-1.5 h-10 pl-2.5 pr-3 rounded-xl bg-black/60 backdrop-blur border border-white/10 text-white text-xs font-medium cursor-pointer hover:bg-black/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      aria-label="Take picture">
                      <Aperture size={15} /> Capture
                    </button>
                  )}
                  <button onClick={flipCamera}
                    className="flex items-center justify-center h-10 w-10 rounded-xl bg-black/60 backdrop-blur border border-white/10 text-white cursor-pointer hover:bg-black/80 transition-colors"
                    aria-label="Flip camera" title="Flip camera">
                    <FlipHorizontal2 size={15} />
                  </button>
                </div>
              )}

              {!uploadedSrc && !capturedPreview && !isModelLoaded && !camError && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/75">
                  <div className="w-7 h-7 border-2 border-white/20 border-t-brand rounded-full animate-spin" />
                  <span className="font-mono text-xs text-white/80 uppercase tracking-wider">Loading model</span>
                </div>
              )}

              {uploadedSrc && isDetectingUpload && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/75">
                  <div className="w-7 h-7 border-2 border-white/20 border-t-brand rounded-full animate-spin" />
                  <span className="font-mono text-xs text-white/80 uppercase tracking-wider">Detecting</span>
                </div>
              )}

              {!uploadedSrc && !capturedPreview && camError && (
                <div className="absolute inset-0 flex items-center justify-center p-6 bg-black/90 text-center">
                  <div>
                    <p className="text-bad text-sm font-medium mb-1">Camera unavailable</p>
                    <p className="text-white/60 text-xs leading-relaxed">{camError}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-2.5">
              <button onClick={handleScan}
                disabled={isScanning || (uploadedSrc ? isDetectingUpload : (!detectedObject || !isReady))}
                className="btn-brand flex-1 h-12">
                {isScanning
                  ? <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Analyzing…</>
                  : <><Zap size={17} />Scan now</>}
              </button>
              {detections.length > 1 && (
                <button onClick={handleScanAll} disabled={isScanning || (!uploadedSrc && !isReady)}
                  className="btn-outline h-12 px-4 shrink-0" aria-label={`Scan all ${detections.length} detected items`}>
                  Scan all {detections.length}
                </button>
              )}
            </div>

            {showLockOnHint && (
              <div className="flex items-center justify-center gap-2 text-sm text-muted">
                <ScanLine size={15} />
                {uploadedSrc ? "Didn't recognize a specific item — tap Scan now and we'll analyze the whole photo" : 'Point the camera at an object to lock on'}
              </div>
            )}
          </div>

          {/* Right: verdict / placeholder */}
          <div className="lg:sticky lg:top-24">
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
