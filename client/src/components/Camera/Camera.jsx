import { useEffect, useRef } from 'react'
import { drawOverlay } from '../../utils/canvasOverlay'

export default function Camera({ videoRef, predictions, verdict }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    if (!canvasRef.current || !videoRef.current) return
    const video = videoRef.current
    const w = video.videoWidth || 640
    const h = video.videoHeight || 480
    if (canvasRef.current.width !== w) canvasRef.current.width = w
    if (canvasRef.current.height !== h) canvasRef.current.height = h
    drawOverlay(canvasRef.current, predictions, verdict)
  }, [predictions, verdict, videoRef])

  return (
    <div className="relative w-full h-full">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full h-full object-cover"
      />
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ pointerEvents: 'none' }}
      />
    </div>
  )
}
