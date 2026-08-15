export function drawOverlay(canvas, predictions, verdict = null) {
  const ctx = canvas.getContext('2d')
  ctx.clearRect(0, 0, canvas.width, canvas.height)

  if (!predictions || predictions.length === 0) return

  const color = verdict === 'Good' ? '#35C46B'
    : verdict === 'Bad' ? '#E5484D'
    : verdict === 'Neutral' ? '#E0A93B'
    : '#35C46B'

  predictions.forEach(pred => {
    const [x, y, w, h] = pred.bbox

    ctx.shadowColor = color
    ctx.shadowBlur = verdict ? 30 : 10
    ctx.strokeStyle = color
    ctx.lineWidth = 3
    ctx.strokeRect(x, y, w, h)
    ctx.shadowBlur = 0

    const label = `${pred.class} ${Math.round(pred.score * 100)}%`
    ctx.font = '600 12px "IBM Plex Mono", monospace'
    const textWidth = ctx.measureText(label).width
    const labelAbove = y >= 28
    const labelY = labelAbove ? y - 26 : y + h + 4

    ctx.fillStyle = color
    ctx.fillRect(x, labelY, textWidth + 10, 20)
    ctx.fillStyle = '#0A0B0D'
    ctx.fillText(label, x + 5, labelY + 14)
  })
}

// Accepts a <video> (live camera) or <img> (uploaded photo) element.
export function captureFrame(el) {
  const w = el.videoWidth || el.naturalWidth || 640
  const h = el.videoHeight || el.naturalHeight || 480
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  ctx.drawImage(el, 0, 0, w, h)
  return canvas.toDataURL('image/jpeg', 0.8)
}
