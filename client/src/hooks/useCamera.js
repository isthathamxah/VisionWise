import { useRef, useState, useCallback } from 'react'

export function useCamera() {
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const [isReady, setIsReady] = useState(false)
  const [error, setError] = useState(null)
  const [facingMode, setFacingMode] = useState('environment')

  const startCamera = useCallback(async (mode = facingMode) => {
    setIsReady(false)
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: mode, width: { ideal: 1280 }, height: { ideal: 720 } }
      })
      streamRef.current = stream
      if (videoRef.current) {
        const video = videoRef.current
        video.srcObject = stream
        // Attach the handler before awaiting play() — on fast hardware (most
        // phones) 'loadedmetadata' can fire while play() is still pending, and a
        // handler attached after that await misses the event forever. isReady
        // then never flips true, which silently disables the detection loop,
        // the capture button, and the scan button — while the video itself
        // keeps playing natively via autoPlay, making it look like "it works".
        video.onloadedmetadata = () => setIsReady(true)
        await video.play().catch(() => {})
        if (video.readyState >= 1) setIsReady(true) // metadata already there by the time play() resolved
      }
      setError(null)
    } catch (err) {
      setError(err.name === 'NotAllowedError'
        ? 'Camera access denied. Please allow camera permission in your browser settings.'
        : 'Could not access camera. Check that no other app is using it.')
    }
  }, [facingMode])

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop())
    setIsReady(false)
  }, [])

  const flipCamera = useCallback(() => {
    const next = facingMode === 'environment' ? 'user' : 'environment'
    setFacingMode(next)
    startCamera(next)
  }, [facingMode, startCamera])

  return { videoRef, isReady, error, startCamera, stopCamera, flipCamera }
}
