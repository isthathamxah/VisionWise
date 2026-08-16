import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Eye, EyeOff, Lock, Check, Circle } from 'lucide-react'
import { useToast } from '../context/ToastContext'
import api, { getApiError } from '../services/api'

// Must match the server rules in server/routes/auth.js
const pwRules = [
  { label: '8+ characters', test: v => v.length >= 8 },
  { label: 'One uppercase letter', test: v => /[A-Z]/.test(v) },
  { label: 'One number', test: v => /[0-9]/.test(v) },
]

export default function ResetPassword() {
  const [params] = useSearchParams()
  const token = params.get('token')
  const navigate = useNavigate()
  const showToast = useToast()
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const pwOk = pwRules.every(r => r.test(password))

  const handleSubmit = async e => {
    e.preventDefault()
    if (!pwOk) { setError('Please meet all the password requirements below.'); return }
    setLoading(true); setError('')
    try {
      await api.post('/auth/reset-password', { token, password })
      showToast('Password updated — sign in with your new password.', 'success')
      navigate('/login')
    } catch (err) {
      setError(getApiError(err, 'Could not reset your password.'))
    } finally { setLoading(false) }
  }

  if (!token) {
    return (
      <div className="container-vw flex items-center justify-center min-h-[calc(100dvh-4rem)] py-10 text-center">
        <div className="max-w-sm">
          <p className="text-muted mb-4">This reset link is missing its token — it may have been copied incorrectly.</p>
          <Link to="/forgot-password" className="text-brand font-medium hover:underline">Request a new link</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container-vw flex items-center justify-center min-h-[calc(100dvh-4rem)] py-10">
      <div className="w-full max-w-sm animate-reveal">
        <span className="eyebrow">Reset password</span>
        <h1 className="font-display font-extrabold text-3xl text-text mt-2 mb-1.5">Choose a new password</h1>
        <p className="text-muted text-sm mb-8">Make it something you haven't used before.</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label htmlFor="password" className="text-sm font-medium text-text block mb-1.5">New password</label>
            <div className="relative">
              <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-faint pointer-events-none" />
              <input id="password" type={showPw ? 'text' : 'password'} required autoComplete="new-password" minLength={8}
                value={password} onChange={e => setPassword(e.target.value)} placeholder="Create a new password" className="field pl-10 pr-11" />
              <button type="button" onClick={() => setShowPw(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-faint hover:text-text cursor-pointer transition-colors"
                aria-label={showPw ? 'Hide password' : 'Show password'}>
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <ul className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
              {pwRules.map(r => {
                const ok = r.test(password)
                return (
                  <li key={r.label} className={`flex items-center gap-1.5 text-xs transition-colors ${ok ? 'text-good' : 'text-faint'}`}>
                    {ok ? <Check size={13} /> : <Circle size={11} />}
                    {r.label}
                  </li>
                )
              })}
            </ul>
          </div>

          {error && (
            <div className="rounded-xl px-3.5 py-3 bg-bad/10 border border-bad/25">
              <p role="alert" className="text-bad text-xs">{error}</p>
            </div>
          )}

          <button type="submit" disabled={loading} className="btn-brand w-full mt-1 h-12">
            {loading ? 'Resetting…' : 'Reset password'}
          </button>
        </form>
      </div>
    </div>
  )
}
