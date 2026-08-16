import { useEffect, useRef, useState } from 'react'
import * as cocoSsd from '@tensorflow-models/coco-ssd'
import '@tensorflow/tfjs'
import { useToast } from '../context/ToastContext'

export function useDetection(videoRef, isVideoReady) {
  const showToast = useToast()
  const modelRef = useRef(null)
  const rafRef = useRef(null)
  const mountedRef = useRef(true)
  const warnedRef = useRef(false) // only surface one toast per session, not one per failed frame
  const [isModelLoaded, setIsModelLoaded] = useState(false)
  const [predictions, setPredictions] = useState([])

  useEffect(() => {
    mountedRef.current = true
    cocoSsd.load()
      .then(model => {
        if (!mountedRef.current) return
        modelRef.current = model
        setIsModelLoaded(true)
      })
      .catch(err => {
        console.error('[detection] model failed to load:', err)
        if (mountedRef.current) showToast('Could not load the detection model. Try reloading the page.', 'error')
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
        } catch (err) {
          // A track ending mid-detection is expected and harmless; anything
          // else was previously swallowed with zero trace, which made a
          // silently-failing detection loop indistinguishable from "nothing
          // in frame yet" — now it's logged, and surfaced once so it's not
          // an invisible dead end on a device we can't attach a debugger to.
          console.error('[detection] frame detection failed:', err)
          if (active && !warnedRef.current) {
            warnedRef.current = true
            showToast('Object detection hit an error and may not work on this device.', 'error')
          }
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
    try {
      const preds = await modelRef.current.detect(imgEl)
      return preds.filter(p => p.score > 0.5)
    } catch (err) {
      console.error('[detection] image detection failed:', err)
      showToast('Could not analyze that photo on this device.', 'error')
      return []
    }
  }

  return {
    predictions,
    isModelLoaded,
    detectedObject: topPrediction?.class || null,
    confidence: topPrediction ? Math.round(topPrediction.score * 100) : null,
    detectImage,
  }
}
