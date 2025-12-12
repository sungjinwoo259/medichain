import { QRCodeCanvas } from 'qrcode.react'

export function QRGenerator({ value }) {
  if (!value) {
    return (
      <div className="flex h-64 items-center justify-center rounded-lg border border-slate-600 bg-slate-900/50">
        <p className="text-center text-sm text-slate-400">
          Create a batch to generate QR code
        </p>
      </div>
    )
  }

  const qrData = JSON.stringify(value)

  return (
    <div className="flex flex-col items-center gap-4 rounded-xl border border-slate-600 bg-slate-900/50 p-6">
      <div className="rounded-lg bg-white p-4">
        <QRCodeCanvas
          value={qrData}
          size={200}
          level="H"
          includeMargin={true}
          fgColor="#000000"
          bgColor="#ffffff"
        />
      </div>
      <div className="w-full space-y-2 text-center">
        <p className="text-xs font-medium text-slate-300">Batch QR Code</p>
        <p className="text-[10px] text-slate-400">
          Scan with MediChain app to verify authenticity
        </p>
        <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-2">
          <p className="break-all font-mono text-[10px] text-slate-400">
            {qrData}
          </p>
        </div>
        <button
          onClick={() => {
            const blob = new Blob([qrData], { type: 'application/json' })
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `medichain-qr-${value.batchId}.json`
            a.click()
            URL.revokeObjectURL(url)
          }}
          className="mt-2 rounded-lg border border-slate-600 bg-slate-800 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-700"
        >
          Download QR Data
        </button>
      </div>
    </div>
  )
}
