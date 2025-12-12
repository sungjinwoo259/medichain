import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { useBlockchain } from '../context/BlockchainContext.jsx'

export function Dashboard() {
  const { user, initializing } = useAuth()
  const { wallet, connectWallet } = useBlockchain()
  const navigate = useNavigate()
  const [connecting, setConnecting] = useState(false)

  useEffect(() => {
    if (!initializing && !user) {
      navigate('/login')
    }
  }, [user, initializing, navigate])

  if (initializing) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <svg className="mx-auto h-8 w-8 animate-spin text-blue-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="mt-4 text-sm text-slate-400">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  // Show pending message if user role is pending
  if (user.role === 'pending' || user.status === 'pending') {
    return (
      <div className="space-y-6 p-6">
        <div className="rounded-2xl border border-amber-500/50 bg-amber-500/10 p-8">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/20">
              <svg className="h-8 w-8 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Account Pending Approval</h1>
              <p className="mt-2 text-slate-300">
                Your account registration is complete, but it's currently pending admin approval.
              </p>
              <p className="mt-2 text-sm text-slate-400">
                An administrator will review your registration and assign you a role (Manufacturer, Distributor, Pharmacy, or Consumer).
                You'll be able to access the system once your role is assigned.
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const roleConfig = {
    admin: {
      title: 'Admin Dashboard',
      description: 'Manage users, roles, and system settings',
      color: 'purple',
      icon: '👑',
      actions: [
        { label: 'Manage Users', path: '/admin', icon: '👥' },
        { label: 'View All Batches', path: '/verify', icon: '📦' },
      ],
    },
    manufacturer: {
      title: 'Manufacturer Dashboard',
      description: 'Create drug batches and generate QR codes',
      color: 'blue',
      icon: '🏭',
      actions: [
        { label: 'Create Batch', path: '/manufacturer', icon: '➕' },
        { label: 'Verify Drugs', path: '/verify', icon: '🔍' },
      ],
    },
    distributor: {
      title: 'Distributor Dashboard',
      description: 'Receive batches and manage shipments',
      color: 'green',
      icon: '🚚',
      actions: [
        { label: 'Receive Batches', path: '/distributor', icon: '📥' },
        { label: 'Verify Drugs', path: '/verify', icon: '🔍' },
      ],
    },
    pharmacy: {
      title: 'Pharmacy Dashboard',
      description: 'Receive batches and manage prescriptions',
      color: 'orange',
      icon: '💊',
      actions: [
        { label: 'Receive Batches', path: '/pharmacy', icon: '📥' },
        { label: 'Verify Drugs', path: '/verify', icon: '🔍' },
      ],
    },
    consumer: {
      title: 'Consumer Dashboard',
      description: 'Verify drug authenticity and view history',
      color: 'teal',
      icon: '👤',
      actions: [
        { label: 'Verify Drug', path: '/consumer', icon: '🔍' },
        { label: 'Quick Verify', path: '/verify', icon: '⚡' },
      ],
    },
  }

  const config = roleConfig[user.role] || roleConfig.consumer

  return (
    <div className="space-y-6 p-6">
      {/* Welcome Section */}
      <div className="rounded-2xl border border-slate-700/50 bg-gradient-to-br from-slate-800/50 to-slate-900/50 p-8 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="mb-2 text-3xl font-bold text-white">
              Welcome back, {user.name}!
            </h1>
            <p className="text-slate-400">
              {config.description}
            </p>
          </div>
          <div className="text-6xl">{config.icon}</div>
        </div>

        {/* User Info Cards */}
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-lg border border-slate-700/50 bg-slate-800/50 p-4">
            <p className="text-xs font-medium text-slate-400">Role</p>
            <p className="mt-1 text-lg font-semibold capitalize text-white">{user.role}</p>
          </div>
          <div className="rounded-lg border border-slate-700/50 bg-slate-800/50 p-4">
            <p className="text-xs font-medium text-slate-400">Email</p>
            <p className="mt-1 truncate text-sm text-white">{user.email}</p>
          </div>
          <div className="rounded-lg border border-slate-700/50 bg-slate-800/50 p-4">
            <p className="text-xs font-medium text-slate-400">Wallet</p>
            <div className="mt-1">
              {wallet ? (
                <span className="font-mono text-sm text-white">{wallet.substring(0, 6)}...{wallet.substring(wallet.length - 4)}</span>
              ) : (
                <button
                  onClick={async () => {
                    setConnecting(true)
                    try {
                      await connectWallet()
                    } catch (err) {
                      console.error('Failed to connect wallet:', err)
                    } finally {
                      setConnecting(false)
                    }
                  }}
                  disabled={connecting}
                  className="flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {connecting ? (
                    <>
                      <svg className="h-3 w-3 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Connecting...
                    </>
                  ) : (
                    <>
                      <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                      </svg>
                      Connect MetaMask
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="mb-4 text-xl font-semibold text-white">Quick Actions</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {config.actions.map((action, idx) => (
            <button
              key={idx}
              onClick={() => navigate(action.path)}
              className="group rounded-xl border border-slate-700/50 bg-slate-800/50 p-6 text-left transition-all hover:border-blue-500/50 hover:bg-slate-800"
            >
              <div className="mb-3 text-3xl">{action.icon}</div>
              <h3 className="font-semibold text-white group-hover:text-blue-400">{action.label}</h3>
            </button>
          ))}
        </div>
      </div>

      {/* Features Grid */}
      <div>
        <h2 className="mb-4 text-xl font-semibold text-white">System Features</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-slate-700/50 bg-slate-800/50 p-6">
            <div className="mb-3 text-3xl">🔗</div>
            <h3 className="mb-2 font-semibold text-white">Blockchain Traceability</h3>
            <p className="text-sm text-slate-400">
              All drug batches are immutably recorded on Sepolia blockchain, with each transfer captured as an on-chain event.
            </p>
          </div>
          <div className="rounded-xl border border-slate-700/50 bg-slate-800/50 p-6">
            <div className="mb-3 text-3xl">📱</div>
            <h3 className="mb-2 font-semibold text-white">QR Code Verification</h3>
            <p className="text-sm text-slate-400">
              Scan QR codes on medicine packs to verify authenticity and see the complete custody chain from manufacturer to consumer.
            </p>
          </div>
          <div className="rounded-xl border border-slate-700/50 bg-slate-800/50 p-6">
            <div className="mb-3 text-3xl">📋</div>
            <h3 className="mb-2 font-semibold text-white">Prescription Validation</h3>
            <p className="text-sm text-slate-400">
              Pharmacies can upload and link prescriptions to batches for compliant dispensing of prescription-only medicines.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
