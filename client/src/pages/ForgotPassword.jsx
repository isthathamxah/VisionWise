import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Mail, ArrowLeft, CheckCircle2 } from 'lucide-react'
import api, { getApiError } from '../services/api'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)

  const handleSubmit = async e => {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      await api.post('/auth/forgot-password', { email })
      setSent(true) // the backend always returns success here, whether or not the email exists — by design
    } catch (err) {
      setError(getApiError(err, 'Something went wrong. Try again.'))
    } finally { setLoading(false) }
  }

  return (
    <div className="container-vw flex items-center justify-center min-h-[calc(100dvh-4rem)] py-10">
      <div className="w-full max-w-sm animate-reveal">
        <Link to="/login" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-text transition-colors mb-6">
          <ArrowLeft size={15} /> Back to sign in
        </Link>

        {sent ? (
          <div className="card p-6 text-center">
            <span className="flex items-center justify-center w-12 h-12 rounded-full bg-good/10 text-good mx-auto mb-4">
              <CheckCircle2 size={24} />
            </span>
            <h1 className="font-display font-bold text-lg text-text mb-2">Check your email</h1>
            <p className="text-muted text-sm leading-relaxed">
              If <span className="text-text">{email}</span> is registered, a reset link is on its way — it expires in 30 minutes.
            </p>
          </div>
        ) : (
          <>
            <span className="eyebrow">Reset password</span>
            <h1 className="font-display font-extrabold text-3xl text-text mt-2 mb-1.5">Forgot password?</h1>
            <p className="text-muted text-sm mb-8">Enter your email and we'll send you a reset link.</p>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label htmlFor="email" className="text-sm font-medium text-text block mb-1.5">Email</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-faint pointer-events-none" />
                  <input id="email" type="email" required autoComplete="email" inputMode="email"
                    value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" className="field pl-10" />
                </div>
              </div>

              {error && (
                <div className="rounded-xl px-3.5 py-3 bg-bad/10 border border-bad/25">
                  <p role="alert" className="text-bad text-xs">{error}</p>
                </div>
              )}

              <button type="submit" disabled={loading} className="btn-brand w-full mt-1 h-12">
                {loading ? 'Sending…' : 'Send reset link'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
