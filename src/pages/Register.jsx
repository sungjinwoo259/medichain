import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { registerUser } from '../services/firebase.js'

export function Register() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    wallet: '',
    role: 'consumer', // Default to consumer for auto-approval
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate('/dashboard')
    }
  }, [user, navigate])

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
    setError('')
    setSuccess('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    // Validation
    if (!form.name || !form.email || !form.password || !form.confirmPassword) {
      setError('Please fill in all fields')
      setLoading(false)
      return
    }

    if (form.password.length < 6) {
      setError('Password must be at least 6 characters')
      setLoading(false)
      return
    }

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    if (form.wallet && (!form.wallet.startsWith('0x') || form.wallet.length !== 42)) {
      setError('Invalid wallet address. Must start with 0x and be 42 characters.')
      setLoading(false)
      return
    }

    try {
      const isConsumer = form.role === 'consumer'
      await registerUser({
        name: form.name,
        email: form.email,
        password: form.password,
        wallet: form.wallet || '',
        role: form.role,
      })
      
      if (isConsumer) {
        setSuccess('Registration successful! Your consumer account has been automatically approved. You can now login.')
        setTimeout(() => {
          navigate('/login')
        }, 2000)
      } else {
        setSuccess('Registration successful! Your account is pending admin approval. You will be notified once your role is assigned.')
        setTimeout(() => {
          navigate('/login')
        }, 3000)
      }
      
      setForm({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        wallet: '',
        role: 'consumer',
      })
    } catch (err) {
      if (err.code === 'auth/email-already-in-use') {
        setError('This email is already registered. Please login instead.')
      } else if (err.code === 'auth/invalid-email') {
        setError('Invalid email address')
      } else if (err.code === 'auth/weak-password') {
        setError('Password is too weak. Please use a stronger password.')
      } else {
        setError(err.message || 'Failed to register. Please try again.')
      }
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

        {/* Register Card */}
        <div className="rounded-2xl border border-[#D1E5F0] bg-white p-8 shadow-lg">
          <h2 className="mb-2 text-xl font-semibold text-[#1A1A1A]">Create Account</h2>
          <p className="mb-6 text-sm text-[#6B7280]">
            Register for MediChain. Your account will be pending until an admin assigns your role.
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

          {/* Register Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="mb-1 block text-sm font-medium text-[#1A1A1A]">
                Full Name *
              </label>
              <input
                id="name"
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="John Doe"
                className="w-full rounded-lg border border-[#D1E5F0] bg-white px-4 py-3 text-sm text-[#1A1A1A] placeholder-[#6B7280] focus:border-[#4A90E2] focus:outline-none focus:ring-2 focus:ring-[#4A90E2]/20"
                required
              />
            </div>

            <div>
              <label htmlFor="email" className="mb-1 block text-sm font-medium text-[#1A1A1A]">
                Email Address *
              </label>
              <input
                id="email"
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="your@email.com"
                className="w-full rounded-lg border border-[#D1E5F0] bg-white px-4 py-3 text-sm text-[#1A1A1A] placeholder-[#6B7280] focus:border-[#4A90E2] focus:outline-none focus:ring-2 focus:ring-[#4A90E2]/20"
                required
              />
            </div>

            <div>
              <label htmlFor="role" className="mb-1 block text-sm font-medium text-[#1A1A1A]">
                Account Type *
              </label>
              <select
                id="role"
                name="role"
                value={form.role}
                onChange={handleChange}
                className="w-full rounded-lg border border-[#D1E5F0] bg-white px-4 py-3 text-sm text-[#1A1A1A] focus:border-[#4A90E2] focus:outline-none focus:ring-2 focus:ring-[#4A90E2]/20"
                required
              >
                <option value="consumer">Consumer (Auto-approved)</option>
                <option value="manufacturer">Manufacturer (Requires Admin Approval)</option>
                <option value="distributor">Distributor (Requires Admin Approval)</option>
                <option value="pharmacy">Pharmacy (Requires Admin Approval)</option>
              </select>
              <p className="mt-1 text-xs text-[#6B7280]">
                {form.role === 'consumer' 
                  ? '✓ Consumer accounts are automatically approved and can login immediately.'
                  : '⚠ This role requires admin approval before you can access the system.'}
              </p>
            </div>

            <div>
              <label htmlFor="wallet" className="mb-1 block text-sm font-medium text-[#1A1A1A]">
                MetaMask Wallet Address (Optional)
              </label>
              <input
                id="wallet"
                type="text"
                name="wallet"
                value={form.wallet}
                onChange={handleChange}
                placeholder="0x..."
                className="w-full rounded-lg border border-[#D1E5F0] bg-white px-4 py-3 font-mono text-sm text-[#1A1A1A] placeholder-[#6B7280] focus:border-[#4A90E2] focus:outline-none focus:ring-2 focus:ring-[#4A90E2]/20"
              />
              <p className="mt-1 text-xs text-[#6B7280]">
                You can add your wallet address later. It's required for blockchain interactions.
              </p>
            </div>

            <div>
              <label htmlFor="password" className="mb-1 block text-sm font-medium text-[#1A1A1A]">
                Password *
              </label>
              <input
                id="password"
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Min. 6 characters"
                className="w-full rounded-lg border border-[#D1E5F0] bg-white px-4 py-3 text-sm text-[#1A1A1A] placeholder-[#6B7280] focus:border-[#4A90E2] focus:outline-none focus:ring-2 focus:ring-[#4A90E2]/20"
                required
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="mb-1 block text-sm font-medium text-[#1A1A1A]">
                Confirm Password *
              </label>
              <input
                id="confirmPassword"
                type="password"
                name="confirmPassword"
                value={form.confirmPassword}
                onChange={handleChange}
                placeholder="Re-enter password"
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
                  Creating account...
                </span>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          {/* Login Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-[#6B7280]">
              Already have an account?{' '}
              <Link
                to="/login"
                className="font-semibold text-[#4A90E2] hover:text-[#357ABD] hover:underline"
              >
                Sign in here
              </Link>
            </p>
          </div>

          {/* Info */}
          <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
            <p className="text-xs text-amber-700">
              <strong>Note:</strong> Consumer accounts are automatically approved. Other roles (Manufacturer, Distributor, Pharmacy) require admin approval before you can access the system.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

