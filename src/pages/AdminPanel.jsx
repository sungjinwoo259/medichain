import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { collection, getDocs, query, orderBy } from 'firebase/firestore'
import { createUserRole, assignUserRole } from '../services/firebase.js'
import { db } from '../services/firebase.js'
import { useAuth } from '../context/AuthContext.jsx'
import { useBlockchain } from '../context/BlockchainContext.jsx'
import { grantRoleOnChain } from '../services/web3Service.js'

export function AdminPanel() {
  const { user, initializing } = useAuth()
  const { contract, wallet } = useBlockchain()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    wallet: '',
    role: 'manufacturer',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [users, setUsers] = useState([])
  const [pendingUsers, setPendingUsers] = useState([])
  const [loadingUsers, setLoadingUsers] = useState(true)
  const [assigningRole, setAssigningRole] = useState(null)
  // Store role form state for each user individually
  const [userRoleForms, setUserRoleForms] = useState({})

  // Redirect if not authenticated
  useEffect(() => {
    if (!initializing && !user) {
      navigate('/login')
    }
  }, [user, initializing, navigate])

  // Fetch users list
  useEffect(() => {
    if (user?.role === 'admin') {
      console.log('Admin user detected, fetching users...')
      fetchUsers()
    } else {
      console.log('User role:', user?.role, 'Not admin, skipping fetch')
    }
  }, [user])

  const fetchUsers = async () => {
    try {
      setLoadingUsers(true)
      // Try to get all users, with fallback if createdAt doesn't exist
      let snapshot
      try {
        const allUsersQuery = query(collection(db, 'users'), orderBy('createdAt', 'desc'))
        snapshot = await getDocs(allUsersQuery)
      } catch (orderError) {
        // If orderBy fails, just get all users without ordering
        console.warn('Could not order by createdAt, fetching all users:', orderError)
        snapshot = await getDocs(collection(db, 'users'))
      }
      
      const usersList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
      
      console.log('All users fetched:', usersList.length)
      console.log('Users data:', usersList.map(u => ({ id: u.id, role: u.role, status: u.status })))
      
      // Separate pending and active users
      const pending = usersList.filter((u) => {
        const isPending = u.role === 'pending' || u.status === 'pending'
        return isPending
      })
      const active = usersList.filter((u) => {
        const isActive = u.role !== 'pending' && u.status !== 'pending' && u.role !== undefined
        return isActive
      })
      
      console.log('Pending users:', pending.length, pending)
      console.log('Active users:', active.length)
      
      setPendingUsers(pending)
      setUsers(active)
      
      // Initialize role forms for each pending user
      const forms = {}
      pending.forEach((u) => {
        forms[u.id] = { role: 'consumer', wallet: u.wallet || '' }
      })
      setUserRoleForms(forms)
    } catch (err) {
      console.error('Error fetching users:', err)
      setError('Failed to fetch users: ' + err.message)
    } finally {
      setLoadingUsers(false)
    }
  }

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
    setError('')
    setSuccess('')
  }

  const handleRoleFormChange = (userId, field, value) => {
    setUserRoleForms((prev) => ({
      ...prev,
      [userId]: {
        ...prev[userId],
        [field]: value,
      },
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    // Validation
    if (!form.name || !form.email || !form.password) {
      setError('Please fill in all required fields')
      setLoading(false)
      return
    }

    if (form.password.length < 6) {
      setError('Password must be at least 6 characters')
      setLoading(false)
      return
    }

    if (form.wallet && (!form.wallet.startsWith('0x') || form.wallet.length !== 42)) {
      setError('Invalid wallet address. Must start with 0x and be 42 characters.')
      setLoading(false)
      return
    }

    try {
      const uid = await createUserRole(form)
      setSuccess(`User created successfully! UID: ${uid}`)
      setForm({
        name: '',
        email: '',
        password: '',
        wallet: '',
        role: 'manufacturer',
      })
      await fetchUsers() // Refresh users list
    } catch (err) {
      if (err.code === 'auth/email-already-in-use') {
        setError('This email is already registered')
      } else if (err.code === 'auth/invalid-email') {
        setError('Invalid email address')
      } else {
        setError(err.message || 'Failed to create user')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleAssignRole = async (userId) => {
    const roleForm = userRoleForms[userId] || { role: 'consumer', wallet: '' }
    
    if (!roleForm.role) {
      setError('Please select a role')
      return
    }

    // Validate wallet address format if provided
    if (roleForm.wallet && (!roleForm.wallet.startsWith('0x') || roleForm.wallet.length !== 42)) {
      setError('Invalid wallet address. Must start with 0x and be 42 characters.')
      return
    }

    // Require wallet for blockchain roles
    const blockchainRoles = ['manufacturer', 'distributor', 'pharmacy']
    if (blockchainRoles.includes(roleForm.role) && !roleForm.wallet) {
      setError(`Wallet address is required for ${roleForm.role} role to grant blockchain access.`)
      return
    }

    // Require contract connection for blockchain roles
    if (blockchainRoles.includes(roleForm.role) && !contract) {
      setError('Please connect your MetaMask wallet (as admin) to grant blockchain roles.')
      return
    }

    setAssigningRole(userId)
    setError('')
    setSuccess('')

    try {
      // Assign Firebase role first
      await assignUserRole(userId, roleForm.role, roleForm.wallet)
      
      // Grant blockchain role for manufacturer, distributor, and pharmacy
      if (blockchainRoles.includes(roleForm.role) && roleForm.wallet && contract) {
        try {
          console.log('Granting blockchain role:', { role: roleForm.role, wallet: roleForm.wallet, contractAddress: contract.target })
          const tx = await grantRoleOnChain(contract, roleForm.role, roleForm.wallet)
          if (tx.hash) {
            setSuccess(`✅ Success! User approved as ${roleForm.role}. Firebase role assigned. Blockchain role granted (Tx: ${tx.hash.substring(0, 10)}...). View on Etherscan: https://sepolia.etherscan.io/tx/${tx.hash}`)
            
            // Verify the role was actually granted
            setTimeout(async () => {
              try {
                const { hasRoleOnChain } = await import('../services/web3Service.js')
                const hasRole = await hasRoleOnChain(contract, roleForm.role, roleForm.wallet)
                if (hasRole) {
                  console.log('✅ Role verification successful after grant')
                } else {
                  console.warn('⚠️ Role verification failed after grant - may need to wait for block confirmation')
                }
              } catch (verifyErr) {
                console.error('Error verifying role after grant:', verifyErr)
              }
            }, 2000)
          } else {
            setSuccess(`✅ Success! User approved as ${roleForm.role}. ${tx.message || 'Blockchain role already granted'}`)
          }
        } catch (blockchainErr) {
          // Firebase role was assigned, but blockchain role failed
          console.error('Blockchain role grant failed:', blockchainErr)
          setError(`⚠️ Firebase role assigned, but blockchain role grant failed: ${blockchainErr.message || blockchainErr.reason || 'Unknown error'}. User can use the system but may need blockchain role granted manually. Check browser console for details.`)
        }
      } else if (roleForm.role === 'consumer') {
        // Consumer doesn't need blockchain role
        setSuccess(`✅ Success! User approved as ${roleForm.role}.`)
      } else {
        // Should not reach here due to validation above, but just in case
        setSuccess(`✅ Firebase role assigned. Blockchain role grant skipped.`)
      }
      
      await fetchUsers() // Refresh users list
    } catch (err) {
      setError(err.message || 'Failed to assign role')
    } finally {
      setAssigningRole(null)
    }
  }

  // Show loading while checking auth
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

  // Redirect if not logged in (handled by useEffect, but show message while redirecting)
  if (!user) {
    return null
  }

  // Check admin access
  if (user.role !== 'admin') {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <div className="w-full max-w-md rounded-2xl border border-red-500/50 bg-red-500/10 p-8 text-center">
          <div className="mb-4 flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-500/20">
              <svg className="h-8 w-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
          </div>
          <h2 className="mb-2 text-xl font-bold text-white">Access Denied</h2>
          <p className="mb-4 text-red-200">Admin role required to access this panel.</p>
          <p className="mb-6 text-sm text-slate-400">Your current role: <span className="font-semibold capitalize text-slate-300">{user.role}</span></p>
          <button
            onClick={() => navigate('/dashboard')}
            className="rounded-lg bg-blue-600 px-6 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Admin Panel</h1>
        <p className="mt-1 text-sm text-slate-400">
          Create and manage MediChain users. Assign roles to pending registrations.
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="rounded-lg border border-red-500/50 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="rounded-lg border border-green-500/50 bg-green-500/10 px-4 py-3 text-sm text-green-200">
          {success}
        </div>
      )}

      {/* Pending Users Section - ALWAYS VISIBLE - PROMINENT */}
      {/* This section should always be visible - if you don't see it, check browser console */}
      <div className="relative rounded-xl border-2 border-amber-500 bg-gradient-to-br from-amber-500/30 via-amber-600/20 to-amber-500/10 p-6 shadow-2xl ring-2 ring-amber-500/50" style={{ minHeight: '200px' }}>
        {/* Pulsing indicator when there are pending users */}
        {pendingUsers.length > 0 && (
          <div className="absolute -top-2 -right-2 flex h-8 w-8 items-center justify-center rounded-full bg-red-500 shadow-lg animate-pulse">
            <span className="text-sm font-bold text-white">{pendingUsers.length}</span>
          </div>
        )}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-500/40 ring-2 ring-amber-400/50">
              <svg className="h-7 w-7 text-amber-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                ⚠️ Pending User Approvals
                {pendingUsers.length > 0 && (
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-red-500 text-sm font-bold text-white shadow-lg">
                    {pendingUsers.length}
                  </span>
                )}
              </h2>
              <p className="text-base text-amber-100 mt-2 font-medium">
                {pendingUsers.length > 0
                  ? `🚨 ${pendingUsers.length} user(s) waiting for role assignment - Action Required!`
                  : '✅ No pending users at the moment'}
              </p>
              {pendingUsers.length > 0 && (
                <p className="text-sm text-amber-200/80 mt-2">
                  💡 <strong>Note:</strong> When approving Manufacturer, Distributor, or Pharmacy roles, both Firebase and blockchain roles will be granted automatically. Wallet address is required for blockchain access.
                </p>
              )}
            </div>
          </div>
          <button
            onClick={fetchUsers}
            className="rounded-lg border border-slate-600 bg-slate-900/50 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 transition-colors"
          >
            <span className="flex items-center gap-2">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </span>
          </button>
        </div>

        {loadingUsers ? (
          <div className="flex items-center justify-center py-8">
            <svg className="h-6 w-6 animate-spin text-blue-500" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </div>
        ) : pendingUsers.length === 0 ? (
          <div className="rounded-lg border border-slate-700/50 bg-slate-900/50 p-8 text-center">
            <svg className="mx-auto h-12 w-12 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="mt-4 text-sm font-medium text-slate-300">All caught up!</p>
            <p className="mt-1 text-xs text-slate-500">No pending user registrations at this time.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pendingUsers.map((u) => {
              const roleForm = userRoleForms[u.id] || { role: 'consumer', wallet: u.wallet || '' }
              return (
                <div
                  key={u.id}
                  className="rounded-lg border border-amber-500/30 bg-slate-900/70 p-5 shadow-lg"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/20">
                          <svg className="h-5 w-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-white">{u.name}</h3>
                            <span className="rounded-full bg-amber-500/20 px-2.5 py-0.5 text-xs font-medium text-amber-300">
                              Pending Approval
                            </span>
                          </div>
                          <p className="mt-1 text-sm text-slate-400">{u.email}</p>
                          {u.wallet && (
                            <p className="mt-1 font-mono text-xs text-slate-500">
                              Wallet: {u.wallet.substring(0, 10)}...{u.wallet.substring(u.wallet.length - 8)}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                      <select
                        value={roleForm.role}
                        onChange={(e) => handleRoleFormChange(u.id, 'role', e.target.value)}
                        className="rounded-lg border border-slate-600 bg-slate-800 px-4 py-2 text-sm text-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      >
                        <option value="manufacturer">Manufacturer</option>
                        <option value="distributor">Distributor</option>
                        <option value="pharmacy">Pharmacy</option>
                        <option value="consumer">Consumer</option>
                      </select>
                      <div className="w-full sm:w-48">
                        <input
                          type="text"
                          placeholder={
                            ['manufacturer', 'distributor', 'pharmacy'].includes(roleForm.role)
                              ? 'Wallet (required)'
                              : 'Wallet (optional)'
                          }
                          value={roleForm.wallet}
                          onChange={(e) => handleRoleFormChange(u.id, 'wallet', e.target.value)}
                          className={`w-full rounded-lg border ${
                            ['manufacturer', 'distributor', 'pharmacy'].includes(roleForm.role) && !roleForm.wallet
                              ? 'border-amber-500/50'
                              : 'border-slate-600'
                          } bg-slate-800 px-3 py-2 font-mono text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
                          required={['manufacturer', 'distributor', 'pharmacy'].includes(roleForm.role)}
                        />
                        {['manufacturer', 'distributor', 'pharmacy'].includes(roleForm.role) && !roleForm.wallet && (
                          <p className="mt-1 text-xs text-amber-400">
                            ⚠️ Wallet required for blockchain access
                          </p>
                        )}
                        {['manufacturer', 'distributor', 'pharmacy'].includes(roleForm.role) && roleForm.wallet && !contract && (
                          <p className="mt-1 text-xs text-amber-400">
                            ⚠️ Connect admin wallet to grant blockchain role
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => handleAssignRole(u.id)}
                        disabled={assigningRole === u.id}
                        className="rounded-lg bg-blue-600 px-6 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {assigningRole === u.id ? (
                          <span className="flex items-center gap-2">
                            <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                            Assigning...
                          </span>
                        ) : (
                          'Approve & Assign Role'
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Create User Form */}
        <div className="rounded-xl border border-slate-700/50 bg-slate-800/50 p-6">
          <h2 className="mb-4 text-lg font-semibold text-white">Create New User</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-300">
                  Full Name *
                </label>
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="John Doe"
                  className="w-full rounded-lg border border-slate-600 bg-slate-900/50 px-4 py-2 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-300">
                  Wallet Address (Optional)
                </label>
                <input
                  name="wallet"
                  value={form.wallet}
                  onChange={handleChange}
                  placeholder="0x..."
                  className="w-full rounded-lg border border-slate-600 bg-slate-900/50 px-4 py-2 font-mono text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-300">
                  Email Address *
                </label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="user@example.com"
                  className="w-full rounded-lg border border-slate-600 bg-slate-900/50 px-4 py-2 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-300">
                  Password *
                </label>
                <input
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Min. 6 characters"
                  className="w-full rounded-lg border border-slate-600 bg-slate-900/50 px-4 py-2 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  required
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-300">
                Role *
              </label>
              <select
                name="role"
                value={form.role}
                onChange={handleChange}
                className="w-full rounded-lg border border-slate-600 bg-slate-900/50 px-4 py-2 text-sm text-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                required
              >
                <option value="admin">Admin</option>
                <option value="manufacturer">Manufacturer</option>
                <option value="distributor">Distributor</option>
                <option value="pharmacy">Pharmacy</option>
                <option value="consumer">Consumer</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Creating User...
                </span>
              ) : (
                'Create User'
              )}
            </button>
          </form>
        </div>

        {/* Active Users List */}
        <div className="rounded-xl border border-slate-700/50 bg-slate-800/50 p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Active Users</h2>
            <button
              onClick={fetchUsers}
              className="rounded-lg border border-slate-600 bg-slate-900/50 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800"
            >
              Refresh
            </button>
          </div>

          {loadingUsers ? (
            <div className="flex items-center justify-center py-8">
              <svg className="h-6 w-6 animate-spin text-blue-500" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            </div>
          ) : users.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-400">No active users found</p>
          ) : (
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {users.map((u) => (
                <div
                  key={u.id}
                  className="rounded-lg border border-slate-700/50 bg-slate-900/50 p-4"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-white">{u.name}</h3>
                        <span className="rounded-full bg-blue-500/20 px-2 py-0.5 text-xs font-medium capitalize text-blue-300">
                          {u.role}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-slate-400">{u.email}</p>
                      <p className="mt-1 font-mono text-xs text-slate-500">
                        {u.wallet ? `${u.wallet.substring(0, 10)}...${u.wallet.substring(u.wallet.length - 8)}` : 'No wallet'}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
