import { createContext, useContext, useState, useCallback } from 'react'
import { CheckCircle2, XCircle, Info } from 'lucide-react'

const ToastContext = createContext(null)

const ICONS = { success: CheckCircle2, error: XCircle, info: Info }
const TONES = { success: 'text-good', error: 'text-bad', info: 'text-brand' }

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const showToast = useCallback((message, type = 'info') => {
    const id = Date.now() + Math.random()
    setToasts(t => [...t, { id, message, type }])
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500)
  }, [])

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      <div className="fixed z-[60] left-1/2 -translate-x-1/2 bottom-20 md:bottom-6 w-[calc(100%-2rem)] max-w-sm flex flex-col gap-2 pointer-events-none">
        {toasts.map(t => {
          const Icon = ICONS[t.type] || Info
          return (
            <div key={t.id} className="animate-toast-in flex items-center gap-2.5 px-4 py-3 rounded-xl2 bg-surface border border-border shadow-pop pointer-events-auto">
              <Icon size={16} className={`shrink-0 ${TONES[t.type] || TONES.info}`} />
              <p className="text-sm text-text flex-1">{t.message}</p>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
