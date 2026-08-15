import { useEffect } from 'react'

// Generic bottom sheet — slides up from the bottom edge instead of a centered
// overlay, matching the native mobile pattern. Used by History's scan detail
// and delete-confirm, and by the bottom nav's account menu.
export default function BottomSheet({ open, onClose, children, maxWidth = 'max-w-md' }) {
  useEffect(() => {
    if (!open) return
    const onKey = e => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className={`w-full ${maxWidth} max-h-[85dvh] overflow-y-auto bg-surface rounded-t-2xl sm:rounded-b-2xl border border-border sm:mb-6 animate-slide-up sm:animate-reveal`}
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        onClick={e => e.stopPropagation()}>
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <span className="w-10 h-1 rounded-full bg-border" />
        </div>
        {children}
      </div>
    </div>
  )
}
