import { useEffect, useRef, useState } from 'react'
import { Html5Qrcode } from 'html5-qrcode'

export function QRScanner({ onResult }) {
  const scannerRef = useRef(null)
  const containerRef = useRef(null)
  const fileInputRef = useRef(null)
  const [scanning, setScanning] = useState(false)
  const [error, setError] = useState('')
  const [cameraId, setCameraId] = useState(null)
  const [availableCameras, setAvailableCameras] = useState([])
  const [initializing, setInitializing] = useState(true)
  const [permissionGranted, setPermissionGranted] = useState(false)
  const [lastResult, setLastResult] = useState(null)
  const [mode, setMode] = useState('camera') // camera | upload
  const [uploading, setUploading] = useState(false)

  // Request camera permission and load devices early so startScanning always has a camera to open
  useEffect(() => {
    const prepareCamera = async () => {
      try {
        if (navigator?.mediaDevices?.getUserMedia) {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true })
          stream.getTracks().forEach(track => track.stop())
          setPermissionGranted(true)
        }

        const devices = await Html5Qrcode.getCameras()
        if (devices && devices.length > 0) {
          setAvailableCameras(devices)
          const backCamera = devices.find(d => d.label.toLowerCase().includes('back') || d.label.toLowerCase().includes('rear'))
          const envCamera = devices.find(d => d.label.toLowerCase().includes('environment'))
          setCameraId(envCamera?.id || backCamera?.id || devices[0].id)
        } else {
          setError('No camera detected. Please connect a camera and refresh.')
          setInitializing(false)
        }
      } catch (err) {
        console.error('Error preparing camera:', err)
        setError('Camera permission denied or unavailable. Please allow access and retry.')
        setInitializing(false)
      }
    }
    prepareCamera()
  }, [])

  const processDecoded = (decodedText) => {
    try {
      const data = JSON.parse(decodedText)
      if (data.batchId && (data.pointer || data.contract)) {
        setLastResult(data)
        onResult?.(data)
        stopScanning()
        return
      }
      setError('Invalid QR code format. Missing batch information.')
    } catch (parseError) {
      console.warn('Failed to parse QR as JSON:', parseError)
      if (decodedText.includes('batchId') || decodedText.includes('BATCH')) {
        const fallback = { raw: decodedText, batchId: decodedText }
        setLastResult(fallback)
        onResult?.(fallback)
        stopScanning()
      } else {
        setError('Invalid QR code. Please scan a valid MediChain QR code.')
      }
    }
  }

  // Start scanning
  const startScanning = async (cameraIdToUse = null) => {
    if (!containerRef.current || !permissionGranted) {
      setError('Camera permission is required to start scanning.')
      return
    }

    // Stop any existing scanner first
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop()
        await scannerRef.current.clear()
      } catch (err) {
        console.warn('Error stopping existing scanner:', err)
      }
    }

    const id = `qr-reader-${Date.now()}`
    const container = containerRef.current
    
    // Clear any existing content and create new div
    container.innerHTML = ''
    const scannerDiv = document.createElement('div')
    scannerDiv.id = id
    scannerDiv.className = 'w-full'
    container.appendChild(scannerDiv)

    try {
      const scanner = new Html5Qrcode(id)
      scannerRef.current = scanner
      setScanning(true)
      setError('')
      setInitializing(true)

      const config = {
        fps: 10,
        qrbox: (viewfinderWidth, viewfinderHeight) => {
          const minEdgePercentage = 0.7
          const minEdgeSize = Math.min(viewfinderWidth, viewfinderHeight)
          const qrboxSize = Math.max(Math.floor(minEdgeSize * minEdgePercentage), 120) // html5-qrcode needs >=50px
          return {
            width: qrboxSize,
            height: qrboxSize
          }
        },
        aspectRatio: 1.0,
        disableFlip: false,
        videoConstraints: {
          facingMode: cameraIdToUse ? undefined : 'environment',
          deviceId: cameraIdToUse ? { exact: cameraIdToUse } : undefined,
        },
      }

      await scanner.start(
        cameraIdToUse || { facingMode: 'environment' },
        config,
        (decodedText) => {
          console.log('QR Code scanned:', decodedText)
          processDecoded(decodedText)
        },
        (errorMessage) => {
          // Ignore continuous scanning errors (these are normal)
          // Only log if it's a significant error
          if (!errorMessage.includes('NotFoundException') && !errorMessage.includes('No QR')) {
            // These are expected during scanning
          }
        }
      )
      setInitializing(false)
    } catch (err) {
      console.error('QR Scanner error:', err)
      setScanning(false)
      setInitializing(false)
      
      if (err.name === 'NotAllowedError' || err.message?.includes('permission')) {
        setError('Camera permission denied. Please allow camera access in your browser settings.')
      } else if (err.name === 'NotFoundError' || err.message?.includes('camera')) {
        setError('No camera found. Please connect a camera device.')
      } else if (err.message?.includes('already scanning')) {
        // Scanner already running, ignore
        return
      } else {
        setError(`Failed to start camera: ${err.message || 'Unknown error'}. Please try again.`)
      }
    }
  }

  // Stop scanning
  const stopScanning = async () => {
    if (!scannerRef.current) {
      setScanning(false)
      return
    }
    try {
      await scannerRef.current.stop()
      await scannerRef.current.clear()
    } catch (err) {
      // ignore stop errors; safe to clear
    } finally {
      scannerRef.current = null
      setScanning(false)
      if (containerRef.current) {
        containerRef.current.innerHTML = ''
      }
    }
  }

  // Auto-start scanning when component mounts
  useEffect(() => {
    if (mode !== 'camera') {
      return
    }
    if (cameraId && permissionGranted && !scanning && !scannerRef.current) {
      const timer = setTimeout(() => {
        startScanning(cameraId)
      }, 150)
      return () => clearTimeout(timer)
    }
  }, [cameraId, permissionGranted, mode])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopScanning()
    }
  }, [])

  const handleSwitchCamera = async () => {
    await stopScanning()
    if (availableCameras.length > 1) {
      const currentIndex = availableCameras.findIndex(cam => cam.id === cameraId)
      const nextIndex = (currentIndex + 1) % availableCameras.length
      setCameraId(availableCameras[nextIndex].id)
      setTimeout(() => {
        startScanning(availableCameras[nextIndex].id)
      }, 300)
    }
  }

  const handleRetry = () => {
    setError('')
    stopScanning().then(() => {
      if (mode === 'camera') {
        setTimeout(() => {
          startScanning(cameraId)
        }, 300)
      }
    })
  }

  const handleFileScan = async (file) => {
    if (!file) return
    setError('')
    setUploading(true)
    try {
      let decoded = null
      if (Html5Qrcode.scanFileV2) {
        const result = await Html5Qrcode.scanFileV2(file, false)
        decoded = result?.decodedText
      } else {
        // Fallback for older versions: create a temporary scanner
        const tempId = `qr-file-${Date.now()}`
        const tmpDiv = document.createElement('div')
        tmpDiv.id = tempId
        tmpDiv.style.display = 'none'
        document.body.appendChild(tmpDiv)
        const tempScanner = new Html5Qrcode(tempId)
        try {
          decoded = await tempScanner.scanFile(file, false)
        } finally {
          try {
            await tempScanner.clear()
          } catch (e) {
            // ignore
          }
          document.body.removeChild(tmpDiv)
        }
      }

      if (decoded) {
        processDecoded(decoded)
      } else {
        setError('Could not read QR code from image. Please try another image.')
      }
    } catch (err) {
      console.error('Image scan failed:', err)
      setError('Failed to read QR from image. Ensure the code is clear and well lit.')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <button
          className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${mode === 'camera' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-200'}`}
          onClick={() => {
            setMode('camera')
            setError('')
            setUploading(false)
            startScanning(cameraId)
          }}
        >
          Scan with Camera
        </button>
        <button
          className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${mode === 'upload' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-200'}`}
          onClick={() => {
            setMode('upload')
            setError('')
            stopScanning()
            if (fileInputRef.current) fileInputRef.current.click()
          }}
        >
          Upload QR Image
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handleFileScan(e.target.files?.[0])}
        />
      </div>

      <div className="relative rounded-lg border border-slate-600 bg-slate-900/50 p-4 overflow-hidden">
        <div
          ref={containerRef}
          className="w-full min-h-[300px] flex items-center justify-center bg-slate-900"
        />
        
        {initializing && !error && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900/90 backdrop-blur-sm z-10">
            <div className="text-center">
              <svg className="mx-auto h-8 w-8 animate-spin text-blue-500" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <p className="mt-2 text-xs text-slate-300">Initializing camera...</p>
            </div>
          </div>
        )}

        {scanning && !initializing && (
          <div className="absolute top-2 right-2 z-10 flex gap-2">
            {availableCameras.length > 1 && (
              <button
                onClick={handleSwitchCamera}
                className="rounded-lg bg-slate-800/90 backdrop-blur-sm px-3 py-1.5 text-xs text-white hover:bg-slate-700 transition-colors"
                title="Switch Camera"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            )}
            <button
              onClick={stopScanning}
              className="rounded-lg bg-red-600/90 backdrop-blur-sm px-3 py-1.5 text-xs text-white hover:bg-red-700 transition-colors"
              title="Stop Scanning"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {!scanning && !initializing && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900/90 backdrop-blur-sm z-10">
            <div className="text-center">
              <svg className="mx-auto h-12 w-12 text-slate-500 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
              </svg>
              <p className="text-sm text-slate-300 mb-3">Camera stopped</p>
              <button
                onClick={handleRetry}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
              >
                Start Scanning
              </button>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/50 bg-red-500/10 px-4 py-3">
          <div className="flex items-start gap-3">
            <svg className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div className="flex-1">
              <p className="text-sm font-semibold text-red-200 mb-1">Camera Error</p>
              <p className="text-xs text-red-300 mb-2">{error}</p>
              <button
                onClick={handleRetry}
                className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      )}

      {uploading && (
        <div className="rounded-lg border border-blue-500/50 bg-blue-500/10 px-3 py-2">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-yellow-300 animate-pulse"></div>
            <p className="text-xs text-blue-100">Reading QR from image...</p>
          </div>
        </div>
      )}

      {scanning && !error && mode === 'camera' && (
        <div className="rounded-lg border border-blue-500/50 bg-blue-500/10 px-3 py-2">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse"></div>
            <p className="text-xs text-blue-200">Scanning... Point camera at QR code</p>
          </div>
        </div>
      )}

      {lastResult && (
        <div className="rounded-lg border border-emerald-500/50 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-100">
          <div className="font-semibold text-emerald-200">Last scan</div>
          <p className="mt-1 break-all text-emerald-100/80">{JSON.stringify(lastResult)}</p>
        </div>
      )}

      {!error && (
        <p className="text-center text-xs text-slate-400">
          {mode === 'camera'
            ? 'Point your camera at a MediChain QR code to scan'
            : 'Upload a clear QR code image to scan'}
        </p>
      )}
    </div>
  )
}
