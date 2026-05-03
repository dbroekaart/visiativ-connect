import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'

export default function Login() {
  const { signInWithEmail } = useAuth()
  const [email, setEmail]     = useState('')
  const [sent, setSent]       = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    if (!email.trim()) return
    setLoading(true)
    setError('')
    const { error } = await signInWithEmail(email.trim().toLowerCase())
    setLoading(false)
    if (error) {
      if (error.status === 429 || error.message?.toLowerCase().includes('rate limit')) {
        setError('Too many attempts. Please wait a few minutes and try again.')
      } else {
        setError('This email is not registered for this event. Please contact the organiser.')
      }
    } else {
      setSent(true)
    }
  }

  if (sent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-brand-800 via-brand-700 to-indigo-900 flex items-center justify-center p-6">
        {/* Decorative circles */}
        <div className="absolute top-16 left-8 w-40 h-40 rounded-full bg-white/5 blur-2xl" />
        <div className="absolute bottom-24 right-6 w-52 h-52 rounded-full bg-brand-400/10 blur-3xl" />

        <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-card-lg p-8 max-w-sm w-full text-center relative">
          <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <path d="M20 4H4C2.9 4 2 4.9 2 6v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" fill="#16a34a"/>
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2 tracking-tight">Check your email</h2>
          <p className="text-gray-500 text-sm mb-4 leading-relaxed">
            We sent a magic login link to<br />
            <strong className="text-gray-800">{email}</strong>
          </p>
          <p className="text-gray-400 text-xs leading-relaxed">
            Tap the link in the email to sign in instantly. No password needed.
          </p>
          <button
            onClick={() => setSent(false)}
            className="mt-6 text-brand-600 text-sm font-semibold hover:text-brand-700 transition-colors"
          >
            Use a different email
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-800 via-brand-700 to-indigo-900 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute top-16 left-8 w-48 h-48 rounded-full bg-white/5 blur-3xl" />
        <div className="absolute top-1/3 right-4 w-32 h-32 rounded-full bg-brand-400/15 blur-2xl" />
        <div className="absolute bottom-24 left-12 w-56 h-56 rounded-full bg-indigo-400/10 blur-3xl" />
      </div>

      <div className="w-full max-w-sm relative">
        {/* Logo & branding */}
        <div className="text-center mb-8">
          <img
            src={`${import.meta.env.BASE_URL}logo.svg`}
            alt="Visiativ"
            className="h-10 mb-5 mx-auto"
            style={{ filter: 'brightness(0) invert(1)' }}
          />
          <h1 className="text-3xl font-bold text-white mb-1.5 tracking-tight">
            Visiativ Connect
          </h1>
          <p className="text-brand-200 text-sm font-medium">Your event networking companion</p>
        </div>

        {/* Login card */}
        <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-card-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-1 tracking-tight">Welcome!</h2>
          <p className="text-gray-400 text-sm mb-5 leading-relaxed">
            Enter your registration email to receive a one-click login link.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                Email address
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="input-field"
                required
                autoComplete="email"
                inputMode="email"
              />
            </div>

            {error && (
              <div className="bg-red-50 text-red-700 text-sm rounded-xl px-4 py-3 border border-red-100">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !email.trim()}
              className="w-full bg-brand-600 hover:bg-brand-700 disabled:bg-gray-200 disabled:text-gray-400 text-white font-semibold py-3.5 rounded-xl transition-all shadow-lift disabled:shadow-none"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Sending…
                </span>
              ) : 'Send login link'}
            </button>
          </form>

          <p className="text-center text-xs text-gray-300 mt-5">
            Only registered event attendees can sign in.
          </p>
        </div>
      </div>
    </div>
  )
}
