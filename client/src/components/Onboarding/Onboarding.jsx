import { useState } from 'react'
import { ArrowRight } from 'lucide-react'
import BottomSheet from '../BottomSheet/BottomSheet'
import { STEPS } from '../../data/steps'

const SEEN_KEY = 'vw_onboarded'

// Shown once, the first time a signed-in user opens the Scanner — after
// that, localStorage remembers and it never shows again.
export default function Onboarding() {
  const [open, setOpen] = useState(() => {
    try { return !localStorage.getItem(SEEN_KEY) } catch { return false }
  })

  const dismiss = () => {
    try { localStorage.setItem(SEEN_KEY, '1') } catch { /* ignore */ }
    setOpen(false)
  }

  return (
    <BottomSheet open={open} onClose={dismiss} maxWidth="max-w-sm">
      <div className="p-6">
        <span className="eyebrow">Welcome</span>
        <h2 className="font-display font-extrabold text-xl text-text mt-2 mb-5">How VisionWise works</h2>
        <div className="flex flex-col gap-4 mb-6">
          {STEPS.map(s => {
            const Icon = s.icon
            return (
              <div key={s.k} className="flex items-start gap-3">
                <span className="flex items-center justify-center w-9 h-9 rounded-xl bg-brandSoft text-brand shrink-0">
                  <Icon size={16} strokeWidth={2} />
                </span>
                <div>
                  <p className="font-display font-bold text-sm text-text">{s.title}</p>
                  <p className="text-muted text-xs leading-relaxed mt-0.5">{s.line}</p>
                </div>
              </div>
            )
          })}
        </div>
        <button onClick={dismiss} className="btn-brand w-full">Let's go <ArrowRight size={16} /></button>
      </div>
    </BottomSheet>
  )
}
