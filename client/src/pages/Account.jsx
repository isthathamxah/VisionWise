import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sun, Moon, LogOut, Target, TrendingUp, Pencil, Check, X, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { useToast } from '../context/ToastContext'
import StatCard from '../components/StatCard/StatCard'
import api, { getApiError } from '../services/api'

const pwRules = [
  { label: '8+ characters', test: v => v.length >= 8 },
  { label: 'One uppercase letter', test: v => /[A-Z]/.test(v) },
  { label: 'One number', test: v => /[0-9]/.test(v) },
]

function EditableName({ name, onSaved }) {
  const showToast = useToast()
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(name || '')
  const [saving, setSaving] = useState(false)

  const startEdit = () => { setValue(name || ''); setEditing(true) }
  const cancel = () => setEditing(false)

  const save = async () => {
    const trimmed = value.trim()
    if (trimmed.length < 2) { showToast('Name needs to be at least 2 characters.', 'error'); return }
    setSaving(true)
    try {
      const { data } = await api.patch('/auth/profile', { name: trimmed })
      onSaved(data)
      setEditing(false)
      showToast('Profile updated', 'success')
    } catch (err) {
      showToast(getApiError(err, 'Could not update your profile.'), 'error')
    } finally { setSaving(false) }
  }

  if (editing) {
    return (
      <div className="flex items-center gap-2 min-w-0">
        <input autoFocus value={value} onChange={e => setValue(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') cancel() }}
          className="field h-9 px-3 text-sm font-display font-bold" maxLength={50} />
        <button onClick={save} disabled={saving} aria-label="Save name"
          className="flex items-center justify-center w-8 h-8 rounded-full bg-brandSoft text-brand cursor-pointer disabled:opacity-50 shrink-0">
          <Check size={15} />
        </button>
        <button onClick={cancel} disabled={saving} aria-label="Cancel"
          className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-surface2 text-muted cursor-pointer shrink-0">
          <X size={15} />
        </button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2 min-w-0">
      <p className="font-display font-bold text-lg text-text truncate">{name || 'Account'}</p>
      <button onClick={startEdit} aria-label="Edit name"
        className="flex items-center justify-center w-7 h-7 rounded-full hover:bg-surface2 text-faint hover:text-brand transition-colors cursor-pointer shrink-0">
        <Pencil size={13} />
      </button>
    </div>
  )
}

function ChangePassword() {
  const showToast = useToast()
  const [open, setOpen] = useState(false)
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [saving, setSaving] = useState(false)
  const nextOk = pwRules.every(r => r.test(next))

  const reset = () => { setOpen(false); setCurrent(''); setNext('') }

  const save = async () => {
    if (!current) { showToast('Enter your current password.', 'error'); return }
    if (!nextOk) { showToast('New password needs to meet all the requirements below.', 'error'); return }
    setSaving(true)
    try {
      await api.patch('/auth/password', { currentPassword: current, newPassword: next })
      showToast('Password updated', 'success')
      reset()
    } catch (err) {
      showToast(getApiError(err, 'Could not update your password.'), 'error')
    } finally { setSaving(false) }
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)}
        className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl hover:bg-surface2 transition-colors cursor-pointer text-text">
        <span className="text-sm font-medium">Change password</span>
      </button>
    )
  }

  return (
    <div className="p-4">
      <p className="text-sm font-medium text-text mb-3">Change password</p>
      <div className="flex flex-col gap-3">
        <input type={showPw ? 'text' : 'password'} value={current} onChange={e => setCurrent(e.target.value)}
          placeholder="Current password" autoComplete="current-password" className="field" />
        <div className="relative">
          <input type={showPw ? 'text' : 'password'} value={next} onChange={e => setNext(e.target.value)}
            placeholder="New password" autoComplete="new-password" className="field pr-11" />
          <button type="button" onClick={() => setShowPw(v => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-faint hover:text-text cursor-pointer transition-colors"
            aria-label={showPw ? 'Hide passwords' : 'Show passwords'}>
            {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        <ul className="flex flex-wrap gap-x-4 gap-y-1">
          {pwRules.map(r => {
            const ok = r.test(next)
            return (
              <li key={r.label} className={`flex items-center gap-1.5 text-xs transition-colors ${ok ? 'text-good' : 'text-faint'}`}>
                {ok ? <Check size={13} /> : <X size={11} />}
                {r.label}
              </li>
            )
          })}
        </ul>
        <div className="flex gap-2.5 mt-1">
          <button onClick={reset} className="btn-outline flex-1" disabled={saving}>Cancel</button>
          <button onClick={save} className="btn-brand flex-1" disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
        </div>
      </div>
    </div>
  )
}

export default function Account() {
  const { user, updateUser, logout } = useAuth()
  const { theme, toggle } = useTheme()
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)

  useEffect(() => {
    api.get('/history/analytics').then(r => setStats(r.data)).catch(() => {})
    // Refreshes the cached profile — picks up fields added since the user last
    // logged in (e.g. hasPassword) and any edits made from another session.
    api.get('/auth/me').then(r => updateUser(r.data)).catch(() => {})
  }, [])

  const handleLogout = () => { logout(); navigate('/') }

  return (
    <div className="container-vw py-8 md:py-10 max-w-lg">
      <div className="mb-8">
        <span className="eyebrow">Account</span>
        <h1 className="font-display font-extrabold text-2xl md:text-3xl text-text mt-2">Your profile</h1>
      </div>

      {/* Profile card */}
      <div className="card p-6 flex items-center gap-4 mb-6">
        {user?.avatar ? (
          <img src={user.avatar} alt="" className="w-14 h-14 rounded-full object-cover shrink-0" />
        ) : (
          <div className="flex items-center justify-center w-14 h-14 rounded-full bg-brandSoft text-brand font-display font-bold text-xl shrink-0">
            {user?.name?.[0]?.toUpperCase() || 'U'}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <EditableName name={user?.name} onSaved={updateUser} />
          <p className="text-sm text-muted truncate">{user?.email}</p>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-6">
          <StatCard icon={Target} label="Avg score" value={`${stats.weeklyScore}`} sub="Past 7 days" />
          <StatCard icon={TrendingUp} label="Total scans" value={stats.totalScans} sub="This week" />
        </div>
      )}

      {/* Settings */}
      <div className="card p-2 mb-6 divide-y divide-border">
        <button onClick={toggle}
          className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl hover:bg-surface2 transition-colors cursor-pointer text-text">
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          <span className="text-sm font-medium">{theme === 'dark' ? 'Light mode' : 'Dark mode'}</span>
        </button>
        {user?.hasPassword && <ChangePassword />}
      </div>

      <button onClick={handleLogout}
        className="w-full flex items-center justify-center gap-3 px-4 py-3.5 rounded-xl2 border border-border hover:bg-bad/10 hover:border-bad/25 transition-colors cursor-pointer text-bad font-medium">
        <LogOut size={18} /> Sign out
      </button>
    </div>
  )
}
