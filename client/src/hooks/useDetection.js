import { useEffect, useRef, useState } from 'react'
import * as cocoSsd from '@tensorflow-models/coco-ssd'
import '@tensorflow/tfjs'

export function useDetection(videoRef, isVideoReady) {
  const modelRef = useRef(null)
  const rafRef = useRef(null)
  const mountedRef = useRef(true)
  const [isModelLoaded, setIsModelLoaded] = useState(false)
  const [predictions, setPredictions] = useState([])

  useEffect(() => {
    mountedRef.current = true
    cocoSsd.load().then(model => {
      if (!mountedRef.current) return
      modelRef.current = model
      setIsModelLoaded(true)
    })
    return () => {
      mountedRef.current = false
      cancelAnimationFrame(rafRef.current)
    }
  }, [])

  useEffect(() => {
    if (!isVideoReady || !isModelLoaded) return

    let active = true

    const detect = async () => {
      if (!active) return
      const video = videoRef.current
      if (video && modelRef.current && video.readyState >= 2) {
        try {
          const preds = await modelRef.current.detect(video)
          if (active) setPredictions(preds.filter(p => p.score > 0.5))
        } catch {
          // model can throw if video track ends during detection
        }
      }
      if (active) rafRef.current = requestAnimationFrame(detect)
    }

    rafRef.current = requestAnimationFrame(detect)

    return () => {
      active = false
      cancelAnimationFrame(rafRef.current)
    }
  }, [isVideoReady, isModelLoaded, videoRef])

  const topPrediction = predictions[0] || null

  // One-shot detection on a static image (upload flow) — reuses the already-loaded
  // model instead of the video requestAnimationFrame loop above.
  const detectImage = async (imgEl) => {
    if (!modelRef.current) return []
    const preds = await modelRef.current.detect(imgEl)
    return preds.filter(p => p.score > 0.5)
  }

  return {
    predictions,
    isModelLoaded,
    detectedObject: topPrediction?.class || null,
    confidence: topPrediction ? Math.round(topPrediction.score * 100) : null,
    detectImage,
  }
}
