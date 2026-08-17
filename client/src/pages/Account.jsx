import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sun, Moon, LogOut, TrendingUp, Pencil, Check, X, Eye, EyeOff, Camera, Lock, CalendarDays } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { useToast } from '../context/ToastContext'
import StatCard from '../components/StatCard/StatCard'
import ScoreRing from '../components/StatCard/ScoreRing'
import api, { getApiError } from '../services/api'

const pwRules = [
  { label: '8+ characters', test: v => v.length >= 8 },
  { label: 'One uppercase letter', test: v => /[A-Z]/.test(v) },
  { label: 'One number', test: v => /[0-9]/.test(v) },
]

// Crops to a centered square and downscales before upload — keeps the
// stored data URL small since it's inlined on the user document (no S3).
function resizeToAvatar(file, size = 256, quality = 0.85) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const objectUrl = URL.createObjectURL(file)
    img.onload = () => {
      const side = Math.min(img.width, img.height)
      const canvas = document.createElement('canvas')
      canvas.width = size; canvas.height = size
      canvas.getContext('2d').drawImage(
        img, (img.width - side) / 2, (img.height - side) / 2, side, side, 0, 0, size, size
      )
      URL.revokeObjectURL(objectUrl)
      resolve(canvas.toDataURL('image/jpeg', quality))
    }
    img.onerror = () => { URL.revokeObjectURL(objectUrl); reject(new Error('Could not read that image.')) }
    img.src = objectUrl
  })
}

function AvatarUpload({ user, onSaved }) {
  const showToast = useToast()
  const fileRef = useRef(null)
  const [uploading, setUploading] = useState(false)

  const onPick = async e => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setUploading(true)
    try {
      const avatar = await resizeToAvatar(file)
      const { data } = await api.patch('/auth/avatar', { avatar })
      onSaved(data)
      showToast('Photo updated', 'success')
    } catch (err) {
      showToast(err.response ? getApiError(err, 'Could not update your photo.') : err.message, 'error')
    } finally { setUploading(false) }
  }

  return (
    <div className="relative shrink-0">
      {user?.avatar ? (
        <img src={user.avatar} alt="" className="w-14 h-14 rounded-full object-cover" />
      ) : (
        <div className="flex items-center justify-center w-14 h-14 rounded-full bg-brandSoft text-brand font-display font-bold text-xl">
          {user?.name?.[0]?.toUpperCase() || 'U'}
        </div>
      )}
      <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" onChange={onPick} hidden />
      <button onClick={() => fileRef.current?.click()} disabled={uploading} aria-label="Change photo"
        className="absolute -bottom-1 -right-1 flex items-center justify-center w-6 h-6 rounded-full bg-brand text-white border-2 border-surface cursor-pointer disabled:opacity-50">
        <Camera size={11} />
      </button>
    </div>
  )
}

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
        <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-brandSoft text-brand shrink-0"><Lock size={16} /></span>
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

  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
    : null

  return (
    <div className="container-vw py-8 md:py-10 max-w-xl">
      <div className="mb-8">
        <span className="eyebrow">Account</span>
        <h1 className="font-display font-extrabold text-2xl md:text-3xl text-text mt-2">Your profile</h1>
      </div>

      {/* Profile card — a soft brand wash behind the avatar gives the header some
          weight instead of just floating on the page background like plain text */}
      <div className="relative card overflow-hidden mb-6">
        <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-brand/10 to-transparent pointer-events-none" />
        <div className="relative p-6 flex items-center gap-4">
          <AvatarUpload user={user} onSaved={updateUser} />
          <div className="min-w-0 flex-1">
            <EditableName name={user?.name} onSaved={updateUser} />
            <p className="text-sm text-muted truncate">{user?.email}</p>
            {memberSince && (
              <p className="flex items-center gap-1.5 font-mono text-[11px] text-faint mt-1.5">
                <CalendarDays size={12} /> Member since {memberSince}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Stats — same visual language as the dashboard */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-6">
          <ScoreRing score={stats.weeklyScore} label="Avg score" sub="Past 7 days" />
          <StatCard icon={TrendingUp} label="Total scans" value={stats.totalScans} sub="Past 7 days" />
        </div>
      )}

      {/* Settings */}
      <span className="eyebrow block mb-2.5">Preferences</span>
      <div className="card p-2 mb-6 divide-y divide-border">
        <button onClick={toggle}
          className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl hover:bg-surface2 transition-colors cursor-pointer text-text">
          <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-brandSoft text-brand shrink-0">
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </span>
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
