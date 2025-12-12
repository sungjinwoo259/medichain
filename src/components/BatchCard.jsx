export function BatchCard({ batch }) {
  if (!batch) return null

  const statusColors = {
    Created: 'bg-blue-500/20 text-blue-300',
    'In Transit to Pharmacy': 'bg-yellow-500/20 text-yellow-300',
    'Received by Pharmacy': 'bg-green-500/20 text-green-300',
    'Dispensed': 'bg-purple-500/20 text-purple-300',
  }

  const statusColor = statusColors[batch.status] || 'bg-slate-500/20 text-slate-300'

  return (
    <div className="rounded-lg border border-slate-700/50 bg-slate-900/50 p-4 transition-all hover:border-slate-600">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-white">{batch.drugName || 'Unknown Drug'}</h3>
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColor}`}>
              {batch.status || 'Unknown'}
            </span>
          </div>
          <div className="space-y-1 text-xs">
            <p className="text-slate-400">
              <span className="text-slate-500">Batch ID:</span>{' '}
              <span className="font-mono text-slate-300">{batch.batchId}</span>
            </p>
            {batch.expiry && (
              <p className="text-slate-400">
                <span className="text-slate-500">Expiry:</span>{' '}
                <span className="text-slate-300">{batch.expiry}</span>
              </p>
            )}
            <p className="text-slate-400">
              <span className="text-slate-500">Owner:</span>{' '}
              <span className="capitalize text-slate-300">{batch.currentOwnerRole || 'Unknown'}</span>
            </p>
            {batch.shipment && (
              <div className="mt-2 rounded border border-slate-700 bg-slate-800/50 p-2">
                <p className="text-[10px] text-slate-500">Shipment Info</p>
                {batch.shipment.vehicleNo && (
                  <p className="text-[10px] text-slate-400">Vehicle: {batch.shipment.vehicleNo}</p>
                )}
                {batch.shipment.destination && (
                  <p className="text-[10px] text-slate-400">To: {batch.shipment.destination}</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      {batch.onChainTxHash && (
        <div className="mt-3 pt-3 border-t border-slate-700">
          <a
            href={`https://sepolia.etherscan.io/tx/${batch.onChainTxHash}`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 hover:underline"
          >
            <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            View Transaction
          </a>
        </div>
      )}
    </div>
  )
}
