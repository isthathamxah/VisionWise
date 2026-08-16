import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Mail, Lock } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import AuthAside from '../components/Auth/AuthAside'
import GoogleButton from '../components/Auth/GoogleButton'
import api, { getApiError } from '../services/api'

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { login } = useAuth()
  const navigate = useNavigate()

  const onChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const handleSubmit = async e => {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      const { data } = await api.post('/auth/login', form)
      login(data.accessToken, data.refreshToken, data.user)
      navigate('/scanner')
    } catch (err) {
      setError(getApiError(err, 'Those details don\'t match an account.'))
    } finally { setLoading(false) }
  }

  return (
    <div className="container-vw grid lg:grid-cols-2 gap-12 items-center min-h-[calc(100dvh-4rem)] py-10">
      <div className="w-full max-w-sm mx-auto lg:mx-0 animate-reveal">
        <span className="eyebrow">Welcome back</span>
        <h1 className="font-display font-extrabold text-3xl text-text mt-2 mb-1.5">Sign in</h1>
        <p className="text-muted text-sm mb-8">Pick up right where you left off.</p>

        <GoogleButton />

        {import.meta.env.DEV && (
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-border" />
            <span className="font-mono text-[11px] uppercase tracking-wider text-faint">or email</span>
            <div className="flex-1 h-px bg-border" />
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label htmlFor="email" className="text-sm font-medium text-text block mb-1.5">Email</label>
            <div className="relative">
              <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-faint pointer-events-none" />
              <input id="email" name="email" type="email" required autoComplete="email" inputMode="email"
                value={form.email} onChange={onChange} placeholder="you@example.com" className="field pl-10" />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="password" className="text-sm font-medium text-text">Password</label>
              <Link to="/forgot-password" className="text-xs text-brand hover:underline">Forgot password?</Link>
            </div>
            <div className="relative">
              <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-faint pointer-events-none" />
              <input id="password" name="password" type={showPw ? 'text' : 'password'} required autoComplete="current-password"
                value={form.password} onChange={onChange} placeholder="••••••••" className="field pl-10 pr-11" />
              <button type="button" onClick={() => setShowPw(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-faint hover:text-text cursor-pointer transition-colors"
                aria-label={showPw ? 'Hide password' : 'Show password'}>
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="rounded-xl px-3.5 py-3 bg-bad/10 border border-bad/25">
              <p role="alert" className="text-bad text-xs">{error}</p>
            </div>
          )}

          <button type="submit" disabled={loading} className="btn-brand w-full mt-1 h-12">
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="text-center text-sm text-muted mt-6">
          No account? <Link to="/register" className="text-brand font-medium hover:underline">Create one</Link>
        </p>
      </div>

      <AuthAside />
    </div>
  )
}
