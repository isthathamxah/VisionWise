import { Utensils, ScanBarcode, Sparkles, ShieldCheck } from 'lucide-react'

const POINTS = [
  { icon: Utensils, tone: 'text-good', text: 'Estimate nutrition straight from a photo of your plate' },
  { icon: ScanBarcode, tone: 'text-good', text: 'Read real ingredients and facts off packaging' },
  { icon: Sparkles, tone: 'text-neutral', text: 'Understand what each ingredient actually does' },
  { icon: ShieldCheck, tone: 'text-neutral', text: 'Get an honest impact reading, not a blanket label' },
]

export default function AuthAside() {
  return (
    <div className="hidden lg:block">
      <div className="relative overflow-hidden rounded-xl2 border border-border p-10 grid-bg h-full min-h-[520px] flex flex-col justify-center"
        style={{ background: 'linear-gradient(150deg, rgb(var(--brand) / 0.10), rgb(var(--surface2)))' }}>
        <div className="absolute top-[-20%] right-[-10%] w-80 h-80 brand-glow blur-3xl opacity-70 pointer-events-none" />
        <div className="relative">
          <span className="eyebrow">Why VisionWise</span>
          <h2 className="font-display font-extrabold text-3xl text-text mt-3 mb-8 leading-tight max-w-sm">
            Point your camera. Know what&apos;s really in it.
          </h2>
          <ul className="flex flex-col gap-5">
            {POINTS.map(({ icon: Icon, tone, text }) => (
              <li key={text} className="flex items-center gap-4">
                <span className={`flex items-center justify-center w-10 h-10 rounded-xl bg-surface border border-border shrink-0 ${tone}`}>
                  <Icon size={18} strokeWidth={2} />
                </span>
                <span className="text-text font-medium">{text}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
