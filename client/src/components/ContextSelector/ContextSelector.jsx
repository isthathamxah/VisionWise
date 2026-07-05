import { HeartPulse, Leaf, BriefcaseBusiness, Coins } from 'lucide-react'

const contexts = [
  { id: 'health',       label: 'Health',  icon: HeartPulse },
  { id: 'eco',          label: 'Eco',     icon: Leaf },
  { id: 'productivity', label: 'Focus',   icon: BriefcaseBusiness },
  { id: 'finance',      label: 'Money',   icon: Coins },
]

export default function ContextSelector({ selected, onSelect }) {
  return (
    <div>
      <p className="text-sm font-medium text-text mb-2">Choose a lens</p>
      <div className="grid grid-cols-4 gap-2">
        {contexts.map(({ id, label, icon: Icon }) => {
          const active = selected === id
          return (
            <button key={id} onClick={() => onSelect(id)}
              className={`flex flex-col items-center gap-1.5 py-3 rounded-xl border cursor-pointer transition-all duration-200 ${
                active
                  ? 'bg-brandSoft border-brand text-brand'
                  : 'bg-surface border-border text-muted hover:text-text hover:border-faint'
              }`}>
              <Icon size={18} strokeWidth={2} />
              <span className="text-xs font-medium">{label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
