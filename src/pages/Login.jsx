import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

export function Login() {
  const { login, user } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate('/dashboard')
    }
  }, [user, navigate])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    if (!email || !password) {
      setError('Please fill in all fields')
      setLoading(false)
      return
    }

    try {
      await login(email, password)
      setSuccess('Login successful! Redirecting...')
      setTimeout(() => {
        navigate('/dashboard')
      }, 500)
    } catch (err) {
      setError(err.message || 'Failed to sign in. Please check your credentials.')
    } finally {
      setLoading(false)
    }
  }


  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F7FBFF] px-4 py-12">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-3xl font-bold text-[#1A1A1A]">MediChain</h1>
          <p className="text-sm text-[#6B7280]">
            Decentralized Prescription Drug Tracking System
          </p>
        </div>

        {/* Login Card */}
        <div className="rounded-2xl border border-[#D1E5F0] bg-white p-8 shadow-lg">
          <h2 className="mb-2 text-xl font-semibold text-[#1A1A1A]">Sign In</h2>
          <p className="mb-6 text-sm text-[#6B7280]">
            Securely manage prescription-only drug batches on Sepolia blockchain
          </p>

          {/* Error Message */}
          {error && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <div className="flex items-center gap-2">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span>{error}</span>
              </div>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="mb-4 rounded-lg border border-[#36C48E] bg-[#E0F8F0] px-4 py-3 text-sm text-[#36C48E]">
              <div className="flex items-center gap-2">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>{success}</span>
              </div>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="mb-1 block text-sm font-medium text-[#1A1A1A]">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full rounded-lg border border-[#D1E5F0] bg-white px-4 py-3 text-sm text-[#1A1A1A] placeholder-[#6B7280] focus:border-[#4A90E2] focus:outline-none focus:ring-2 focus:ring-[#4A90E2]/20"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-1 block text-sm font-medium text-[#1A1A1A]">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-lg border border-[#D1E5F0] bg-white px-4 py-3 text-sm text-[#1A1A1A] placeholder-[#6B7280] focus:border-[#4A90E2] focus:outline-none focus:ring-2 focus:ring-[#4A90E2]/20"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-[#4A90E2] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#357ABD] focus:outline-none focus:ring-2 focus:ring-[#4A90E2]/50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Signing in...
                </span>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Register Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-[#6B7280]">
              Don't have an account?{' '}
              <Link
                to="/register"
                className="font-semibold text-[#4A90E2] hover:text-[#357ABD] hover:underline"
              >
                Register here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
