import { HeartPulse, Leaf, BriefcaseBusiness, Coins } from 'lucide-react'

const POINTS = [
  { icon: HeartPulse, tone: 'text-good', text: 'Know what\'s really in your food and drink' },
  { icon: Leaf, tone: 'text-good', text: 'Check the environmental cost of anything' },
  { icon: BriefcaseBusiness, tone: 'text-neutral', text: 'Spot what\'s breaking your focus' },
  { icon: Coins, tone: 'text-neutral', text: 'Decide if it\'s worth the money' },
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
            One camera. Four ways to understand the world around you.
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
