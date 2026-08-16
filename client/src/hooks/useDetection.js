import { useEffect, useRef, useState } from 'react'
import * as cocoSsd from '@tensorflow-models/coco-ssd'
import '@tensorflow/tfjs'
import { useToast } from '../context/ToastContext'

export function useDetection(videoRef, isVideoReady) {
  const showToast = useToast()
  const modelRef = useRef(null) // fast backbone — drives the real-time video loop, and the immediate fallback below
  const fullModelRef = useRef(null) // heavier, more accurate backbone — used for one-shot detection once ready, but never blocked on
  const rafRef = useRef(null)
  const mountedRef = useRef(true)
  const warnedRef = useRef(false) // only surface one toast per session, not one per failed frame
  const [isModelLoaded, setIsModelLoaded] = useState(false)
  const [predictions, setPredictions] = useState([])

  useEffect(() => {
    mountedRef.current = true
    const litePromise = cocoSsd.load({ base: 'lite_mobilenet_v2' })
      .then(model => {
        if (!mountedRef.current) return null
        modelRef.current = model
        setIsModelLoaded(true)
        return model
      })
      .catch(err => {
        console.error('[detection] model failed to load:', err)
        if (mountedRef.current) showToast('Could not load the detection model. Try reloading the page.', 'error')
        return null
      })
    // A one-shot scan of a static photo has no 30fps constraint, so the extra
    // accuracy is worth it — confirmed empirically: the lite backbone misses real
    // objects (e.g. a car at 0.37 confidence, just under the 0.5 cutoff) that the
    // full backbone catches (0.61). Chained after litePromise (not started in
    // parallel) so it never competes for bandwidth with the fast model that
    // unlocks the UI. detectImage() below only USES this if it has already
    // finished — never awaits/blocks on it, since that would mean every capture
    // taken before this ~27MB download completes hangs on "Detecting…" for it.
    litePromise.then(() => {
      if (!mountedRef.current) return
      cocoSsd.load({ base: 'mobilenet_v2' })
        .then(model => { if (mountedRef.current) fullModelRef.current = model })
        .catch(err => console.error('[detection] full-accuracy model failed to load, staying on the fast one:', err))
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

  // One-shot detection on a static image (upload/capture flow) — instead of the
  // video requestAnimationFrame loop above. Uses the accurate backbone if it has
  // already finished loading in the background; otherwise uses the fast one
  // immediately rather than waiting — modelRef.current is guaranteed set by now,
  // since Upload/Capture only render once isModelLoaded is true.
  const detectImage = async (imgEl) => {
    const model = fullModelRef.current || modelRef.current
    if (!model) return []
    try {
      const preds = await model.detect(imgEl)
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
