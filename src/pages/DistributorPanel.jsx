import { useState, useEffect } from 'react'
import { doc, getDoc, collection, query, where, getDocs, orderBy } from 'firebase/firestore'
import { db, updateBatchStatus, saveTransactionDetails } from '../services/firebase.js'
import { useAuth } from '../context/AuthContext.jsx'
import { useBlockchain } from '../context/BlockchainContext.jsx'
import { QRScanner } from '../components/QRScanner.jsx'
import { BatchCard } from '../components/BatchCard.jsx'
import { transferBatchOnChain } from '../services/web3Service.js'

export function DistributorPanel() {
  const { user } = useAuth()
  const { wallet, contract, connectWallet } = useBlockchain()
  const [connecting, setConnecting] = useState(false)
  const [scanned, setScanned] = useState(null)
  const [batchData, setBatchData] = useState(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const [batches, setBatches] = useState([])
  const [loadingBatches, setLoadingBatches] = useState(true)
  const isReceived = !!(
    scanned?.batchId &&
    batchData &&
    wallet &&
    batchData.currentOwnerWallet?.toLowerCase() === wallet.toLowerCase()
  )

  useEffect(() => {
    if (user?.uid) {
      fetchBatches()
    }
  }, [user])

  const fetchBatches = async () => {
    try {
      setLoadingBatches(true)
      console.log('Fetching batches for wallet:', wallet)
      
      if (!wallet) {
        console.warn('No wallet connected')
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
          where('currentOwnerWallet', '==', wallet),
          orderBy('createdAt', 'desc')
        )
        snapshot = await getDocs(q)
        console.log('Query with orderBy succeeded')
      } catch (orderError) {
        // If orderBy fails (missing index), try without orderBy
        console.warn('OrderBy failed, using fallback query:', orderError.message)
        if (orderError.code === 'failed-precondition' || orderError.message?.includes('index')) {
          console.warn('⚠️ Firestore composite index required for sorting')
        }
        
        try {
          const fallbackQ = query(
            collection(db, 'batches'),
            where('currentOwnerWallet', '==', wallet)
          )
          snapshot = await getDocs(fallbackQ)
          usedFallback = true
          console.log('Fallback query succeeded')
        } catch (fallbackError) {
          console.error('Both queries failed, fetching all and filtering:', fallbackError)
          const allBatchesSnapshot = await getDocs(collection(db, 'batches'))
          const filteredBatches = allBatchesSnapshot.docs
            .filter(doc => {
              const data = doc.data()
              return data.currentOwnerWallet?.toLowerCase() === wallet.toLowerCase()
            })
          snapshot = { docs: filteredBatches }
          usedFallback = true
          console.log('Fetched all batches and filtered in memory')
        }
      }
      
      const batchesList = snapshot.docs.map((doc) => {
        const data = doc.data()
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt,
          updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : data.updatedAt,
        }
      })
      
      // Sort manually if orderBy failed
      if (usedFallback && batchesList.length > 0) {
        batchesList.sort((a, b) => {
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
          
          return dateB - dateA // Descending order
        })
      }
      
      console.log(`✅ Fetched ${batchesList.length} batch(es) for wallet ${wallet}`)
      setBatches(batchesList)
    } catch (err) {
      console.error('Error fetching batches:', err)
      setBatches([])
    } finally {
      setLoadingBatches(false)
    }
  }

  const handleScan = async (data) => {
    setScanned(data)
    setError('')
    setSuccess('')
    setBatchData(null)

    if (!data.batchId) {
      setError('Invalid QR code. Missing batch information.')
      return
    }

    try {
      let snap = null
      if (data.pointer) {
        snap = await getDoc(doc(db, 'batches', data.pointer))
      } else {
        // Fallback: locate by batchId if pointer absent
        const found = await getDocs(
          query(collection(db, 'batches'), where('batchId', '==', data.batchId))
        )
        snap = found.docs?.[0]
      }

      if (!snap || !snap.exists()) {
        setError('Batch not found in database')
        return
      }

      const batchDoc = snap.data ? snap : { id: snap.id, data: () => snap.data() } // normalize
      const batch = { id: batchDoc.id, ...batchDoc.data() }
      // carry pointer forward for later transfer if missing in QR
      setScanned(prev => ({ ...prev, pointer: batch.id }))
      setBatchData(batch)
    } catch (err) {
      setError('Failed to fetch batch data: ' + err.message)
    }
  }

  const handleReceive = async () => {
    if (!wallet || !contract || !scanned?.batchId || !batchData) {
      setError('Please scan a valid batch QR code and ensure wallet is connected')
      return
    }

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      // Transfer ownership on blockchain to distributor
      const tx = await transferBatchOnChain(contract, scanned.batchId, wallet, scanned.pointer)
      await saveTransactionDetails(batchData.id, tx)

      // Update Firestore to mark received by distributor
      await updateBatchStatus(batchData.id, {
        currentOwnerRole: 'distributor',
        currentOwnerWallet: wallet,
        status: 'Received by Distributor',
        receivedAt: new Date().toISOString(),
      })

      setSuccess(`Batch received successfully! Transaction: ${tx.hash.substring(0, 10)}... Now dispatch to pharmacy when ready.`)
      await fetchBatches()
    } catch (err) {
      setError(err.message || 'Failed to receive batch')
    } finally {
      setLoading(false)
    }
  }

  const handleDispatch = async () => {
    if (!wallet || !scanned?.batchId || !batchData) {
      setError('Please scan a batch first')
      return
    }
    if (!isReceived) {
      setError('Receive the batch first to take custody before dispatching.')
      return
    }

    setLoading(true)
    setError('')
    setSuccess('')
    try {
      await updateBatchStatus(batchData.id, {
        status: 'In Transit to Pharmacy',
        dispatchedAt: new Date().toISOString(),
      })
      setSuccess('Batch dispatched to pharmacy. Await pharmacy receipt.')
      await fetchBatches()
    } catch (err) {
      setError(err.message || 'Failed to dispatch batch')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Distributor Dashboard</h1>
        <p className="mt-1 text-sm text-slate-400">
          Scan manufacturer QR codes, receive custody, then dispatch to pharmacies.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* QR Scanner & Batch Info */}
        <div className="space-y-4">
          <div className="rounded-xl border border-slate-700/50 bg-slate-800/50 p-6">
            <h2 className="mb-4 text-lg font-semibold text-white">Scan Batch QR</h2>
            <QRScanner onResult={handleScan} />
          </div>

          {scanned && (
            <div className="rounded-xl border border-slate-700/50 bg-slate-800/50 p-4">
              <h3 className="mb-2 text-sm font-semibold text-white">Scanned Batch</h3>
              <div className="space-y-1 text-xs">
                <p className="text-slate-300">
                  <span className="text-slate-400">Batch ID:</span> {scanned.batchId}
                </p>
                <p className="text-slate-300">
                  <span className="text-slate-400">Contract:</span>{' '}
                  <span className="font-mono">{scanned.contract?.substring(0, 10)}...</span>
                </p>
              </div>
            </div>
          )}

          {batchData && (
            <div className="rounded-xl border border-blue-500/50 bg-blue-500/10 p-4">
              <h3 className="mb-2 text-sm font-semibold text-white">Batch Information</h3>
              <div className="space-y-1 text-xs">
                <p className="text-slate-300">
                  <span className="text-slate-400">Drug:</span> {batchData.drugName}
                </p>
                <p className="text-slate-300">
                  <span className="text-slate-400">Expiry:</span> {batchData.expiry}
                </p>
                <p className="text-slate-300">
                  <span className="text-slate-400">Status:</span> {batchData.status}
                </p>
                <p className="text-slate-300">
                  <span className="text-slate-400">Current Owner:</span> {batchData.currentOwnerRole}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Actions & Received Batches */}
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-xl border border-slate-700/50 bg-slate-800/50 p-6">
            <h2 className="mb-4 text-lg font-semibold text-white">Actions</h2>

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
                  <p className="text-sm text-amber-200">Please connect your MetaMask wallet to receive batches.</p>
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

            <div className="grid gap-3 md:grid-cols-2">
              <button
                type="button"
                onClick={handleReceive}
                disabled={loading || !scanned || !batchData || !contract || !wallet}
                className="w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Processing...
                  </span>
                ) : (
                  'Receive from Manufacturer'
                )}
              </button>

              <button
                type="button"
                onClick={handleDispatch}
                disabled={loading || !isReceived || !scanned || !batchData || !wallet}
                className="w-full rounded-lg bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Processing...
                  </span>
                ) : (
                  'Dispatch to Pharmacy'
                )}
              </button>
            </div>

            <p className="mt-3 text-xs text-slate-400">
              Receive after scanning to take custody. Once received, dispatch to make it available for pharmacy receipt.
            </p>
          </div>

          {/* Received Batches */}
          <div className="rounded-xl border border-slate-700/50 bg-slate-800/50 p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Received Batches</h2>
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
              <p className="py-8 text-center text-sm text-slate-400">No batches received yet</p>
            ) : (
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {batches.map((batch) => (
                  <BatchCard key={batch.id} batch={batch} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
