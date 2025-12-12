import { useState, useEffect } from 'react'
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore'
import { addBatch, saveTransactionDetails, updateBatchStatus } from '../services/firebase.js'
import { db } from '../services/firebase.js'
import { useAuth } from '../context/AuthContext.jsx'
import { useBlockchain } from '../context/BlockchainContext.jsx'
import { QRGenerator } from '../components/QRGenerator.jsx'
import { BatchCard } from '../components/BatchCard.jsx'
import { createBatchOnChain, hasRoleOnChain } from '../services/web3Service.js'

export function ManufacturerPanel() {
  const { user } = useAuth()
  const { contract, wallet, connectWallet } = useBlockchain()
  const [connecting, setConnecting] = useState(false)
  const [form, setForm] = useState({
    batchId: '',
    drugName: '',
    expiry: '',
    description: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [created, setCreated] = useState(null)
  const [batches, setBatches] = useState([])
  const [loadingBatches, setLoadingBatches] = useState(true)
  const [hasManufacturerRole, setHasManufacturerRole] = useState(false)
  const [checkingRole, setCheckingRole] = useState(false)

  useEffect(() => {
    if (user?.uid) {
      fetchBatches()
    }
  }, [user])

  // Manual role check function
  const checkRoleManually = async () => {
    if (!contract || !wallet) {
      setError('Please connect your MetaMask wallet first')
      return
    }
    setCheckingRole(true)
    setError('')
    try {
      const hasRole = await hasRoleOnChain(contract, 'manufacturer', wallet)
      setHasManufacturerRole(hasRole)
      if (hasRole) {
        setSuccess('✅ Role verified! You have MANUFACTURER_ROLE.')
      } else {
        setError(`❌ Your wallet ${wallet} does not have MANUFACTURER_ROLE. Please contact an admin.`)
      }
    } catch (err) {
      console.error('Error checking role:', err)
      setError(`Error checking role: ${err.message}`)
      setHasManufacturerRole(false)
    } finally {
      setCheckingRole(false)
    }
  }

  // Check if wallet has manufacturer role
  useEffect(() => {
    const checkRole = async () => {
      if (contract && wallet && user?.role === 'manufacturer') {
        setCheckingRole(true)
        try {
          const hasRole = await hasRoleOnChain(contract, 'manufacturer', wallet)
          setHasManufacturerRole(hasRole)
          console.log('Role check result:', { wallet, hasRole, contractAddress: contract.target })
        } catch (err) {
          console.error('Error checking role:', err)
          setHasManufacturerRole(false)
        } finally {
          setCheckingRole(false)
        }
      } else {
        setHasManufacturerRole(false)
      }
    }
    checkRole()
  }, [contract, wallet, user])

  const fetchBatches = async () => {
    try {
      setLoadingBatches(true)
      console.log('Fetching batches for manufacturerId:', user?.uid, 'User:', user)
      
      if (!user?.uid) {
        console.warn('No user UID available')
        setBatches([])
        setLoadingBatches(false)
        return
      }
      
      let snapshot
      let usedFallback = false
      
      try {
        // Try with orderBy first (requires composite index)
        const q = query(
          collection(db, 'batches'),
          where('manufacturerId', '==', user.uid),
          orderBy('createdAt', 'desc')
        )
        snapshot = await getDocs(q)
        console.log('✅ Query with orderBy succeeded')
      } catch (orderError) {
        // If orderBy fails (missing index), try without orderBy
        console.warn('⚠️ OrderBy failed (index required), using fallback query:', orderError.message)
        
        if (orderError.code === 'failed-precondition' || orderError.message?.includes('index')) {
          const indexLink = orderError.message?.match(/https:\/\/[^\s]+/)?.[0]
          if (indexLink) {
            console.warn('📋 Create index here:', indexLink)
          }
          console.warn('💡 Tip: Click the link above to create the index, or batches will work without sorting')
        }
        
        // Fallback: Query without orderBy (this should always work)
        try {
          const fallbackQ = query(
            collection(db, 'batches'),
            where('manufacturerId', '==', user.uid)
          )
          snapshot = await getDocs(fallbackQ)
          usedFallback = true
          console.log('✅ Fallback query (without orderBy) succeeded')
        } catch (fallbackError) {
          console.error('❌ Both queries failed. Fallback error:', fallbackError)
          // If even the fallback fails, try getting all batches and filter in memory
          console.log('Attempting to fetch all batches and filter in memory...')
          const allBatchesSnapshot = await getDocs(collection(db, 'batches'))
          const filteredBatches = allBatchesSnapshot.docs
            .filter(doc => {
              const data = doc.data()
              return data.manufacturerId === user.uid
            })
          
          // Use the filtered documents directly
          snapshot = {
            docs: filteredBatches
          }
          usedFallback = true
          console.log(`✅ Fetched all batches and filtered in memory. Found ${filteredBatches.length} matching batch(es)`)
        }
      }
      
      const batchesList = snapshot.docs.map((doc) => {
        const data = doc.data()
        return {
          id: doc.id,
          ...data,
          // Ensure dates are properly formatted
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt,
          updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : data.updatedAt,
        }
      })
      
      // Sort manually if orderBy failed (used fallback query)
      if (usedFallback && batchesList.length > 0) {
        batchesList.sort((a, b) => {
          // Handle different date formats
          let dateA = 0
          let dateB = 0
          
          if (a.createdAt) {
            if (a.createdAt instanceof Date) {
              dateA = a.createdAt.getTime()
            } else if (a.createdAt.toDate) {
              dateA = a.createdAt.toDate().getTime()
            } else if (typeof a.createdAt === 'number') {
              dateA = a.createdAt
            } else if (a.createdAt.seconds) {
              dateA = a.createdAt.seconds * 1000
            }
          }
          
          if (b.createdAt) {
            if (b.createdAt instanceof Date) {
              dateB = b.createdAt.getTime()
            } else if (b.createdAt.toDate) {
              dateB = b.createdAt.toDate().getTime()
            } else if (typeof b.createdAt === 'number') {
              dateB = b.createdAt
            } else if (b.createdAt.seconds) {
              dateB = b.createdAt.seconds * 1000
            }
          }
          
          return dateB - dateA // Descending order (newest first)
        })
        console.log('✅ Sorted batches manually (newest first)')
      }
      
      console.log(`✅ Fetched ${batchesList.length} batch(es) for user ${user.uid}:`, batchesList)
      
      if (batchesList.length === 0) {
        console.log('No batches found. Checking if any batches exist in database...')
        // Debug: Check all batches to see what manufacturerIds exist
        const allBatchesSnapshot = await getDocs(collection(db, 'batches'))
        const allBatches = allBatchesSnapshot.docs.map(doc => ({
          id: doc.id,
          manufacturerId: doc.data().manufacturerId,
          batchId: doc.data().batchId,
        }))
        console.log('All batches in database:', allBatches)
        if (allBatches.length > 0) {
          console.warn(`⚠️ Found ${allBatches.length} batch(es) in database, but none match manufacturerId: ${user.uid}`)
          console.warn('This might mean batches were created with a different user account.')
        }
      }
      
      setBatches(batchesList)
    } catch (err) {
      console.error('Error fetching batches:', err)
      // Show error to user
      setError(`Failed to fetch batches: ${err.message}. Check browser console for details.`)
      setBatches([])
    } finally {
      setLoadingBatches(false)
    }
  }

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
    setError('')
    setSuccess('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!user || !wallet || !contract) {
      setError('Please connect your MetaMask wallet first')
      return
    }

    if (!form.batchId || !form.drugName || !form.expiry) {
      setError('Please fill in all required fields')
      return
    }

    setSubmitting(true)
    setError('')
    setSuccess('')

    try {
      // Verify contract is ready
      if (!contract) {
        setError('Contract not initialized. Please reconnect your wallet.')
        setSubmitting(false)
        return
      }

      // Check if wallet has MANUFACTURER_ROLE before proceeding
      const hasRole = await hasRoleOnChain(contract, 'manufacturer', wallet)
      if (!hasRole) {
        setError(
          `❌ Your wallet (${wallet.substring(0, 6)}...${wallet.substring(wallet.length - 4)}) does not have MANUFACTURER_ROLE on the blockchain. ` +
          `Please contact an admin to grant you the manufacturer role. ` +
          `Your wallet address: ${wallet}`
        )
        setSubmitting(false)
        return
      }

      // Create batch in Firestore first
      let batchDoc
      try {
        batchDoc = await addBatch({
          batchId: form.batchId,
          drugName: form.drugName,
          expiry: form.expiry,
          description: form.description || '',
          manufacturerId: user.uid,
          manufacturerWallet: wallet,
          currentOwnerRole: 'manufacturer',
          currentOwnerWallet: wallet,
          pointer: '', // will be doc id
          status: 'Creating...', // Initial status
        })
      } catch (firestoreErr) {
        setError(`Failed to create batch in database: ${firestoreErr.message}`)
        setSubmitting(false)
        return
      }

      const pointer = batchDoc.id

      // Update pointer in Firestore immediately
      await updateBatchStatus(batchDoc.id, {
        pointer: pointer,
      })

      // Register on blockchain
      let tx
      try {
        tx = await createBatchOnChain(contract, form.batchId, pointer)
        await saveTransactionDetails(batchDoc.id, tx)
        
        // Update status to Created
        await updateBatchStatus(batchDoc.id, {
          status: 'Created',
          onChainTxHash: tx.hash,
        })
      } catch (blockchainErr) {
        // Blockchain transaction failed - update Firestore to reflect this
        await updateBatchStatus(batchDoc.id, {
          status: 'Blockchain Error',
          error: blockchainErr.message,
        })
        
        // Check if it's a role error
        if (blockchainErr.message?.includes('Not manufacturer') || blockchainErr.reason === 'Not manufacturer') {
          throw new Error(
            `❌ Blockchain transaction failed: Your wallet does not have MANUFACTURER_ROLE. ` +
            `Batch was created in database but not on blockchain. ` +
            `Please contact an admin to grant you the manufacturer role for wallet: ${wallet}`
          )
        }
        throw blockchainErr
      }

      setSuccess(`✅ Batch created successfully! Transaction: ${tx.hash.substring(0, 10)}...`)
      setCreated({
        ...form,
        pointer,
        onChainTxHash: tx.hash,
      })
      setForm({
        batchId: '',
        drugName: '',
        expiry: '',
        description: '',
      })
      
      // Refresh batches list after a short delay to ensure Firestore is updated
      setTimeout(() => {
        fetchBatches()
      }, 1000)
    } catch (err) {
      setError(err.message || 'Failed to create batch')
    } finally {
      setSubmitting(false)
    }
  }

  const qrValue = created
    ? {
        chain: 'sepolia',
        chainId: 11155111,
        contract: import.meta.env.VITE_MEDICHAIN_ADDRESS,
        batchId: created.batchId,
      }
    : null

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Manufacturer Dashboard</h1>
        <p className="mt-1 text-sm text-slate-400">
          Register new drug batches on-chain and generate QR codes to attach to shipments.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Create Batch Form */}
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-xl border border-slate-700/50 bg-slate-800/50 p-6">
            <h2 className="mb-4 text-lg font-semibold text-white">Create New Batch</h2>

            {error && (
              <div className="mb-4 rounded-lg border border-red-500/50 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {error}
              </div>
            )}

            {success && (
              <div className="mb-4 rounded-lg border border-green-500/50 bg-green-500/10 px-4 py-3 text-sm text-green-200">
                {success}
              </div>
            )}

            {!wallet && (
              <div className="mb-4 rounded-lg border border-amber-500/50 bg-amber-500/10 px-4 py-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-amber-200">Please connect your MetaMask wallet to create batches.</p>
                  <button
                    onClick={async () => {
                      setConnecting(true)
                      try {
                        await connectWallet()
                      } catch (err) {
                        setError(err.message || 'Failed to connect wallet')
                      } finally {
                        setConnecting(false)
                      }
                    }}
                    disabled={connecting}
                    className="ml-4 flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {connecting ? (
                      <>
                        <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Connecting...
                      </>
                    ) : (
                      <>
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                        </svg>
                        Connect MetaMask
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {wallet && contract && !checkingRole && !hasManufacturerRole && (
              <div className="mb-4 rounded-lg border border-red-500/50 bg-red-500/10 px-4 py-3">
                <div className="flex items-start gap-3">
                  <svg className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-red-200 mb-1">⚠️ Missing Blockchain Role</p>
                    <p className="text-xs text-red-300 mb-2">
                      Your wallet <span className="font-mono">{wallet.substring(0, 6)}...{wallet.substring(wallet.length - 4)}</span> does not have MANUFACTURER_ROLE on the blockchain.
                    </p>
                    <p className="text-xs text-red-300 mb-3">
                      Please contact an admin to grant you the manufacturer role. Your wallet address: <span className="font-mono break-all">{wallet}</span>
                    </p>
                    <button
                      onClick={checkRoleManually}
                      disabled={checkingRole}
                      className="flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Refresh Role Check
                    </button>
                  </div>
                </div>
              </div>
            )}

            {wallet && contract && checkingRole && (
              <div className="mb-4 rounded-lg border border-blue-500/50 bg-blue-500/10 px-4 py-3">
                <div className="flex items-center gap-2">
                  <svg className="h-4 w-4 animate-spin text-blue-400" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <p className="text-sm text-blue-200">Checking blockchain role...</p>
                </div>
              </div>
            )}

            {wallet && contract && hasManufacturerRole && (
              <div className="mb-4 rounded-lg border border-green-500/50 bg-green-500/10 px-4 py-3">
                <div className="flex items-center gap-2">
                  <svg className="h-5 w-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm text-green-200">
                    ✅ Your wallet has MANUFACTURER_ROLE. You can create batches on the blockchain.
                  </p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-300">
                    Drug Name *
                  </label>
                  <input
                    name="drugName"
                    value={form.drugName}
                    onChange={handleChange}
                    placeholder="Paracetamol 500mg"
                    className="w-full rounded-lg border border-slate-600 bg-slate-900/50 px-4 py-2 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    required
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-300">
                    Batch ID *
                  </label>
                  <input
                    name="batchId"
                    value={form.batchId}
                    onChange={handleChange}
                    placeholder="BATCH-0001"
                    className="w-full rounded-lg border border-slate-600 bg-slate-900/50 px-4 py-2 font-mono text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-300">
                  Expiry Date *
                </label>
                <input
                  type="date"
                  name="expiry"
                  value={form.expiry}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-slate-600 bg-slate-900/50 px-4 py-2 text-sm text-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-300">
                  Description
                </label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Additional batch information..."
                  className="w-full rounded-lg border border-slate-600 bg-slate-900/50 px-4 py-2 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <button
                type="submit"
                disabled={submitting || !contract || !wallet}
                className="w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Creating batch...
                  </span>
                ) : (
                  'Create Batch & Register On-Chain'
                )}
              </button>
            </form>
          </div>

          {/* QR Code Preview */}
          {qrValue && (
            <div className="rounded-xl border border-slate-700/50 bg-slate-800/50 p-6">
              <h3 className="mb-4 text-lg font-semibold text-white">QR Code</h3>
              <div className="flex justify-center">
                <QRGenerator value={qrValue} />
              </div>
              <p className="mt-4 text-center text-xs text-slate-400">
                Print this QR code and attach it to the drug batch packaging
              </p>
            </div>
          )}
        </div>

        {/* Batches List */}
        <div className="rounded-xl border border-slate-700/50 bg-slate-800/50 p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Your Batches</h2>
            <button
              onClick={fetchBatches}
              className="rounded-lg border border-slate-600 bg-slate-900/50 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800"
            >
              Refresh
            </button>
          </div>

          {loadingBatches ? (
            <div className="flex items-center justify-center py-8">
              <svg className="h-6 w-6 animate-spin text-blue-500" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            </div>
          ) : batches.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-400">No batches created yet</p>
          ) : (
            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {batches.map((batch) => (
                <BatchCard key={batch.id} batch={batch} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
