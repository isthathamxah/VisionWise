export default function StatCard({ icon: Icon, label, value, sub }) {
  return (
    <div className="card p-5">
      <div className="flex items-center gap-2 mb-3">
        <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-brandSoft text-brand"><Icon size={16} /></span>
        <span className="font-mono text-[10px] uppercase tracking-wider text-faint">{label}</span>
      </div>
      <p className="font-display font-extrabold text-3xl text-text leading-none">{value}</p>
      {sub && <p className="text-muted text-xs mt-1.5">{sub}</p>}
    </div>
  )
}
