import { useState } from 'react'
import { doc, getDoc } from 'firebase/firestore'
import { QRScanner } from '../components/QRScanner.jsx'
import { useBlockchain } from '../context/BlockchainContext.jsx'
import { db } from '../services/firebase.js'
import { getHistory } from '../services/web3Service.js'

export function VerifyDrug() {
  const { contract } = useBlockchain()
  const [scanned, setScanned] = useState(null)
  const [batchData, setBatchData] = useState(null)
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [verified, setVerified] = useState(false)

  const handleScan = async (data) => {
    setScanned(data)
    setError('')
    setBatchData(null)
    setEvents([])
    setVerified(false)

    if (!data.batchId) {
      setError('Invalid QR code. Missing batch information.')
      return
    }

    setLoading(true)

    try {
      // Fetch batch data from Firestore if pointer is provided
      if (data.pointer) {
        const snap = await getDoc(doc(db, 'batches', data.pointer))
        if (!snap.exists()) {
          setError('Batch not found in database')
          setLoading(false)
          return
        }
        const batch = { id: snap.id, ...snap.data() }
        setBatchData(batch)
      } else {
        setBatchData(null) // No off-chain record; still allow on-chain verify
      }

      // Fetch blockchain history
      if (contract && data.batchId) {
        const history = await getHistory(contract, data.batchId)
        setEvents(history)
        setVerified(history.length > 0)
      }
    } catch (err) {
      setError('Failed to verify drug: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Verify Drug Authenticity</h1>
        <p className="mt-1 text-sm text-slate-400">
          Quick verification tool for point-of-care or regulatory checks. Scan QR code to verify drug authenticity.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* QR Scanner */}
        <div className="space-y-4">
          <div className="rounded-xl border border-slate-700/50 bg-slate-800/50 p-6">
            <h2 className="mb-4 text-lg font-semibold text-white">Scan QR Code</h2>
            <QRScanner onResult={handleScan} />
          </div>

          {scanned && (
            <div className="rounded-xl border border-slate-700/50 bg-slate-800/50 p-4">
              <h3 className="mb-2 text-sm font-semibold text-white">Scanned Information</h3>
              <div className="space-y-1 text-xs">
                <p className="text-slate-300">
                  <span className="text-slate-400">Batch ID:</span> {scanned.batchId}
                </p>
                <p className="text-slate-300">
                  <span className="text-slate-400">Network:</span> {scanned.chain || 'Sepolia'}
                </p>
              </div>
            </div>
          )}

          {/* Verification Status */}
          {batchData && (
            <div
              className={`rounded-xl border p-6 ${
                verified
                  ? 'border-green-500/50 bg-green-500/10'
                  : 'border-amber-500/50 bg-amber-500/10'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-full ${
                    verified ? 'bg-green-500/20' : 'bg-amber-500/20'
                  }`}
                >
                  {verified ? (
                    <svg className="h-6 w-6 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="h-6 w-6 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                <div>
                  <p className={`font-semibold ${verified ? 'text-green-300' : 'text-amber-300'}`}>
                    {verified ? 'Verified Authentic' : 'Verification Pending'}
                  </p>
                  <p className="text-xs text-slate-400">
                    {verified
                      ? 'Drug batch verified on blockchain'
                      : 'No blockchain records found'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Verification Details */}
        <div className="space-y-4">
          {error && (
            <div className="rounded-lg border border-red-500/50 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {error}
            </div>
          )}

          {loading && (
            <div className="flex items-center justify-center rounded-xl border border-slate-700/50 bg-slate-800/50 p-8">
              <svg className="h-8 w-8 animate-spin text-blue-500" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            </div>
          )}

          {batchData && (
            <div className="rounded-xl border border-slate-700/50 bg-slate-800/50 p-6">
              <h2 className="mb-4 text-lg font-semibold text-white">Drug Information</h2>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-slate-400">Drug Name</p>
                  <p className="text-sm font-semibold text-white">{batchData.drugName}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Batch ID</p>
                  <p className="font-mono text-sm text-white">{batchData.batchId}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Expiry Date</p>
                  <p className="text-sm text-white">{batchData.expiry || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Current Owner</p>
                  <p className="text-sm capitalize text-white">{batchData.currentOwnerRole || 'Unknown'}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Status</p>
                  <span className="inline-block rounded-full bg-blue-500/20 px-3 py-1 text-xs font-medium text-blue-300">
                    {batchData.status || 'Unknown'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Blockchain Events */}
          {events.length > 0 && (
            <div className="rounded-xl border border-slate-700/50 bg-slate-800/50 p-6">
              <h2 className="mb-4 text-lg font-semibold text-white">Blockchain Events</h2>
              <div className="space-y-2">
                {events.map((event, idx) => (
                  <div
                    key={idx}
                    className="rounded-lg border border-slate-700/50 bg-slate-900/50 p-3"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500/20 text-xs font-semibold text-blue-300">
                        {idx + 1}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold capitalize text-white">{event.eventType}</p>
                        <p className="mt-1 text-xs text-slate-400">
                          {new Date(event.timestamp * 1000).toLocaleString()}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          <span className="font-mono">{event.actor?.substring(0, 12)}...</span>
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!scanned && !loading && (
            <div className="rounded-xl border border-slate-700/50 bg-slate-800/50 p-8 text-center">
              <p className="text-sm text-slate-400">
                Scan a MediChain QR code to verify drug authenticity
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
