import { useState } from 'react'
import { doc, getDoc, getDocs, collection, query, where } from 'firebase/firestore'
import { QRScanner } from '../components/QRScanner.jsx'
import { useBlockchain } from '../context/BlockchainContext.jsx'
import { db } from '../services/firebase.js'
import { getHistory } from '../services/web3Service.js'

export function ConsumerView() {
  const { contract, wallet, connectWallet } = useBlockchain()
  const [connecting, setConnecting] = useState(false)
  const [scanned, setScanned] = useState(null)
  const [batchData, setBatchData] = useState(null)
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleScan = async (data) => {
    setScanned(data)
    setError('')
    setBatchData(null)
    setEvents([])

    if (!data.batchId) {
      setError('Invalid QR code. Missing batch information.')
      return
    }

    setLoading(true)

    try {
      // Fetch batch data from Firestore (pointer preferred, batchId fallback)
      let snap = null
      if (data.pointer) {
        snap = await getDoc(doc(db, 'batches', data.pointer))
      } else {
        const found = await getDocs(
          query(collection(db, 'batches'), where('batchId', '==', data.batchId))
        )
        snap = found.docs?.[0]
      }

      if (snap && snap.exists()) {
        const batchDoc = snap.data ? snap : { id: snap.id, data: () => snap.data() }
        const batch = { id: batchDoc.id, ...batchDoc.data() }
        setScanned(prev => ({ ...prev, pointer: batch.id }))
        setBatchData(batch)
      } else {
        setError('Batch not found in database')
      }

      // Fetch blockchain history
      if (contract && data.batchId) {
        const history = await getHistory(contract, data.batchId)
        setEvents(history)
      }
    } catch (err) {
      setError('Failed to fetch batch data: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Consumer Verification</h1>
        <p className="mt-1 text-sm text-slate-600">
          Scan the QR code on your medicine pack to verify authenticity and view its complete journey.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* QR Scanner */}
        <div className="space-y-4">
          {!wallet && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
              <div className="flex items-center justify-between">
                <p className="text-sm text-amber-700">Connect MetaMask to view blockchain history.</p>
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
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-6">
            <h2 className="mb-4 text-lg font-semibold text-slate-900">Scan QR Code</h2>
            <QRScanner onResult={handleScan} />
          </div>

          {scanned && (
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-4">
              <h3 className="mb-2 text-sm font-semibold text-slate-900">Scanned Information</h3>
              <div className="space-y-1 text-xs text-slate-700">
                <p>
                  <span className="text-slate-500">Batch ID:</span> {scanned.batchId}
                </p>
                <p>
                  <span className="text-slate-500">Network:</span> {scanned.chain || 'Sepolia'}
                </p>
                <p>
                  <span className="text-slate-500">Contract:</span>{' '}
                  <a
                    href={`https://sepolia.etherscan.io/address/${scanned.contract}`}
                    target="_blank"
                    rel="noreferrer"
                    className="font-mono text-blue-600 hover:underline"
                  >
                    {scanned.contract?.substring(0, 10)}...
                  </a>
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Batch Info & History */}
        <div className="space-y-4">
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {loading && (
            <div className="flex items-center justify-center rounded-xl border border-slate-200 bg-white shadow-sm p-8">
              <svg className="h-8 w-8 animate-spin text-blue-600" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            </div>
          )}

          {batchData && (
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="mb-1 text-lg font-semibold text-slate-900">Batch Information</h2>
                  <p className="text-xs text-slate-500">Authenticity status below</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-blue-50 text-blue-700 px-3 py-1 text-xs font-semibold">
                    {events.length > 0 ? 'Verified on-chain' : 'No on-chain history'}
                  </span>
                </div>
              </div>
              <div className="space-y-3 mt-4">
                <div>
                  <p className="text-xs text-slate-500">Drug Name</p>
                  <p className="text-sm font-semibold text-slate-900">{batchData.drugName}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Batch ID</p>
                  <p className="font-mono text-sm text-slate-900">{batchData.batchId}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Expiry Date</p>
                  <p className="text-sm text-slate-800">{batchData.expiry || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Current Status</p>
                  <span className="inline-block rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 border border-blue-100">
                    {batchData.status || 'Unknown'}
                  </span>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                    <p className="text-[11px] uppercase tracking-wide text-slate-500">Manufacturer</p>
                    <p className="font-mono text-xs text-slate-800 break-all">
                      {batchData.manufacturerWallet || 'N/A'}
                    </p>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                    <p className="text-[11px] uppercase tracking-wide text-slate-500">Current Owner</p>
                    <p className="text-xs text-slate-800 capitalize">
                      {batchData.currentOwnerRole || 'unknown'}
                    </p>
                    <p className="font-mono text-[11px] text-slate-700 break-all">
                      {batchData.currentOwnerWallet || 'N/A'}
                    </p>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                    <p className="text-[11px] uppercase tracking-wide text-slate-500">Database Pointer</p>
                    <p className="font-mono text-[11px] text-slate-700 break-all">
                      {batchData.id || scanned?.pointer || 'N/A'}
                    </p>
                  </div>
                </div>
                {batchData.onChainTxHash && (
                  <div>
                    <p className="text-xs text-slate-500">Blockchain Transaction</p>
                    <a
                      href={`https://sepolia.etherscan.io/tx/${batchData.onChainTxHash}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-blue-600 hover:underline"
                    >
                      View on Etherscan →
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Traceability History */}
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Traceability History</h2>
              {events.length > 0 && (
                <span className="text-[11px] text-slate-500">Newest first</span>
              )}
            </div>
            {events.length === 0 && !loading && (
              <p className="py-8 text-center text-sm text-slate-500">
                {scanned
                  ? 'No blockchain events found for this batch'
                  : 'Scan a valid MediChain QR code to see the custody chain'}
              </p>
            )}
            {events.length > 0 && (
              <div className="space-y-3">
                {events.map((event, idx) => (
                  <div
                    key={idx}
                    className="rounded-lg border border-slate-200 bg-slate-50 p-4"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-semibold text-slate-900 capitalize">{event.eventType}</p>
                        <p className="mt-1 text-xs text-slate-600">
                          Actor: <span className="font-mono">{event.actor?.substring(0, 10)}...</span>
                        </p>
                        <p className="mt-1 text-xs text-slate-600">
                          Time: {new Date(event.timestamp * 1000).toLocaleString()}
                        </p>
                        {event.pointer && (
                          <p className="mt-1 break-all text-xs text-slate-500">
                            Pointer: {event.pointer}
                          </p>
                        )}
                      </div>
                      <div className="ml-4 flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-700">
                        {idx + 1}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
