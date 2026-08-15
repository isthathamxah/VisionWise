import { useEffect, useRef, useState } from 'react'
import { FlipHorizontal2, Zap, ScanLine, Upload, RotateCcw, Aperture, Check } from 'lucide-react'
import Camera from '../components/Camera/Camera'
import VerdictCard from '../components/VerdictCard/VerdictCard'
import { useCamera } from '../hooks/useCamera'
import { useDetection } from '../hooks/useDetection'
import { captureFrame } from '../utils/canvasOverlay'
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

  const { videoRef, isReady, error: camError, startCamera, stopCamera, flipCamera } = useCamera()
  const { predictions, isModelLoaded, detectedObject: liveObject, confidence: liveConfidence, detectImage } = useDetection(videoRef, isReady)

  const fileInputRef = useRef(null)
  const uploadImgRef = useRef(null)
  const uploadTokenRef = useRef(0) // invalidates in-flight detection when superseded by a new upload or a switch back to camera
  const [uploadedSrc, setUploadedSrc] = useState(null)
  const [uploadPrediction, setUploadPrediction] = useState(null)
  const [isDetectingUpload, setIsDetectingUpload] = useState(false)
  const [capturedPreview, setCapturedPreview] = useState(null) // just-taken photo, awaiting retake/confirm

  useEffect(() => {
    startCamera()
    return () => stopCamera()
  }, [])

  // While reviewing a just-taken photo, ignore stale live-detection state entirely —
  // it belongs to the frame under the preview, not the frozen shot on top of it.
  const detectedObject = capturedPreview ? null : uploadedSrc ? uploadPrediction?.class || null : liveObject
  const confidence = capturedPreview ? null : uploadedSrc ? (uploadPrediction ? Math.round(uploadPrediction.score * 100) : null) : liveConfidence

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0]
    e.target.value = '' // allow re-selecting the same file later
    if (!file) return
    uploadTokenRef.current += 1
    setScanResult(null); setUploadPrediction(null); setIsDetectingUpload(true); setCapturedPreview(null)
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
    setScanResult(null); setUploadPrediction(null); setIsDetectingUpload(true)
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
      setUploadPrediction(preds[0] || null)
    } finally {
      if (uploadTokenRef.current === token) setIsDetectingUpload(false)
    }
  }

  const handleUploadImgError = () => {
    uploadTokenRef.current += 1
    setUploadedSrc(null); setUploadPrediction(null); setIsDetectingUpload(false)
    showToast('Could not load that image. Try a different file.', 'error')
    startCamera()
  }

  const useCameraInstead = () => {
    uploadTokenRef.current += 1
    setUploadedSrc(null); setUploadPrediction(null); setScanResult(null); setIsDetectingUpload(false); setCapturedPreview(null)
    startCamera()
  }

  const handleScan = async () => {
    if (!detectedObject || isScanning) return
    setIsScanning(true); setScanResult(null)
    if (navigator.vibrate) navigator.vibrate(35)
    try {
      const imageBase64 = captureFrame(uploadedSrc ? uploadImgRef.current : videoRef.current)
      const { data } = await api.post('/scan', { imageBase64, objectLabel: detectedObject })
      setScanResult(data)
      if (navigator.vibrate) navigator.vibrate(data.verdict === 'Good' ? [25, 20, 25] : 55)
    } catch (err) {
      showToast(err.response?.data?.error || 'Scan failed. Try again.', 'error')
    } finally { setIsScanning(false) }
  }

  const showSweep = !uploadedSrc && !capturedPreview && isReady && isModelLoaded && !scanResult && !isScanning
  const showLockOnHint = !capturedPreview && !detectedObject && !isDetectingUpload && !scanResult && (uploadedSrc ? true : (isModelLoaded && isReady))

  return (
    <div className="container-vw py-6 md:py-10">
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
                  className="w-full h-full object-cover"
                />
              ) : (
                <Camera videoRef={videoRef} predictions={predictions} verdict={scanResult?.verdict || null} />
              )}

              {capturedPreview && (
                <img src={capturedPreview} alt="Captured preview" className="absolute inset-0 w-full h-full object-cover" />
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
              ) : detectedObject && (
                <div className="absolute bottom-3 left-3 right-3 z-10 flex items-center justify-between">
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-black/70 backdrop-blur border border-white/10">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand animate-pulse-dot" />
                    <span className="font-mono text-xs text-white capitalize">{detectedObject}</span>
                  </div>
                  <span className="font-mono text-xs text-brand px-3 py-1.5 rounded-lg bg-black/70 backdrop-blur border border-white/10">{confidence}%</span>
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
                  {isModelLoaded && (
                    <button onClick={() => fileInputRef.current?.click()}
                      className="p-3 rounded-xl bg-black/60 backdrop-blur border border-white/10 text-white cursor-pointer hover:bg-black/80 transition-colors"
                      aria-label="Upload photo">
                      <Upload size={17} />
                    </button>
                  )}
                  {isReady && (
                    <button onClick={handleCapture} disabled={isScanning}
                      className="p-3 rounded-xl bg-black/60 backdrop-blur border border-white/10 text-white cursor-pointer hover:bg-black/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      aria-label="Take picture">
                      <Aperture size={17} />
                    </button>
                  )}
                  <button onClick={flipCamera}
                    className="p-3 rounded-xl bg-black/60 backdrop-blur border border-white/10 text-white cursor-pointer hover:bg-black/80 transition-colors"
                    aria-label="Flip camera">
                    <FlipHorizontal2 size={17} />
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
