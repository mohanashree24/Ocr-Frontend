import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import toast, { Toaster } from 'react-hot-toast'
import {
  Play,
  CheckCircle2,
  XCircle,
  Activity,
  RefreshCw,
  Loader2,
  Search,
  ChevronLeft,
  ChevronRight,
  Folder,
  Image,
  AlertCircle,
  TrendingUp,
  Clock,
  DollarSign,
  ArrowLeft,
  FileText,
  BarChart3,
  ScanBarcode,
  Download,
  Database,
  Copy,
  Upload,
  Cloud,
  HardDrive
} from 'lucide-react'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export default function BarcodeExtractor() {
  // Mode selection: 'workdrive' or 'local'
  const [extractionMode, setExtractionMode] = useState('workdrive')

  // Workdrive state
  const [config, setConfig] = useState({
    folder_id: 'gzrjifb529f116bf44f1e94b6d005a6bf0e71'
  })

  // Local files state
  const [localFiles, setLocalFiles] = useState([])
  const [dragActive, setDragActive] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  // Common state
  const [isLoadingFiles, setIsLoadingFiles] = useState(false)
  const [files, setFiles] = useState([])
  const [selectedFiles, setSelectedFiles] = useState(new Set())

  const [currentPage, setCurrentPage] = useState(1)
  const [filesPerPage] = useState(50)
  const [searchQuery, setSearchQuery] = useState('')

  const [activeJob, setActiveJob] = useState(null)
  const [jobStatus, setJobStatus] = useState(null)
  const [isPolling, setIsPolling] = useState(false)
  const [jobResults, setJobResults] = useState([])

  const [processingSpeed, setProcessingSpeed] = useState(0)
  const [lastProcessedCount, setLastProcessedCount] = useState(0)
  const [lastUpdateTime, setLastUpdateTime] = useState(Date.now())
  const [estimatedTimeRemaining, setEstimatedTimeRemaining] = useState(null)

  // Polling effect
  useEffect(() => {
    let interval
    if (isPolling && activeJob) {
      interval = setInterval(() => {
        fetchJobStatus(activeJob)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isPolling, activeJob])

  // Calculate estimated time
  useEffect(() => {
    if (jobStatus && processingSpeed > 0) {
      const remaining = jobStatus.progress?.total_files - jobStatus.progress?.processed_files
      const minutesRemaining = remaining / processingSpeed
      setEstimatedTimeRemaining(minutesRemaining)
    }
  }, [jobStatus, processingSpeed])

  // Workdrive file loading
  const loadFiles = async () => {
    if (!config.folder_id) {
      toast.error('Please enter Folder ID')
      return
    }

    setIsLoadingFiles(true)
    try {
      const formData = new FormData()
      formData.append('folder_id', config.folder_id)

      const response = await fetch(`${API_BASE_URL}/barcode/workdrive/list-files`, {
        method: 'POST',
        body: formData
      })

      const data = await response.json()

      if (data.success) {
        setFiles(data.files || [])
        setSelectedFiles(new Set())
        setCurrentPage(1)

        toast.success(`✅ Loaded ${data.total_files} files`, {
          icon: '📁',
          style: { borderRadius: '12px', background: '#F97316', color: 'white' }
        })
      } else {
        toast.error(`Error: ${data.error}`)
      }
    } catch (error) {
      toast.error(`Failed to load files: ${error.message}`)
    } finally {
      setIsLoadingFiles(false)
    }
  }

  // Local file handling
  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    const droppedFiles = e.dataTransfer.files
    handleLocalFiles(droppedFiles)
  }

  const handleFileInput = (e) => {
    const selectedFileList = e.target.files
    handleLocalFiles(selectedFileList)
  }

  const handleLocalFiles = (fileList) => {
    const newFiles = []
    
    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i]
      const isImage = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'].includes(file.type)
      
      if (!isImage) {
        toast.error(`❌ ${file.name} is not a supported file type`)
        continue
      }

      newFiles.push({
        file_id: `local_${Date.now()}_${Math.random()}`,
        filename: file.name,
        size: file.size,
        extension: file.name.split('.').pop().toLowerCase(),
        file: file,
        local: true
      })
    }

    setLocalFiles([...localFiles, ...newFiles])
    setFiles([...files, ...newFiles])
    
    if (newFiles.length > 0) {
      toast.success(`✅ Added ${newFiles.length} file(s)`, {
        icon: '📁',
        style: { borderRadius: '12px', background: '#F97316', color: 'white' }
      })
    }
  }

  const removeLocalFile = (fileId) => {
    setLocalFiles(localFiles.filter(f => f.file_id !== fileId))
    setFiles(files.filter(f => f.file_id !== fileId))
    setSelectedFiles(prev => {
      const newSet = new Set(prev)
      newSet.delete(fileId)
      return newSet
    })
  }

  const startExtraction = async () => {
    if (selectedFiles.size === 0) {
      toast.error('Please select at least one file')
      return
    }

    try {
      if (extractionMode === 'local') {
        // Handle local file extraction
        const selectedLocalFiles = localFiles.filter(f => selectedFiles.has(f.file_id))
        
        const formData = new FormData()
        selectedLocalFiles.forEach(f => {
          formData.append('files', f.file)
        })

        const response = await fetch(`${API_BASE_URL}/barcode/local/start`, {
          method: 'POST',
          body: formData
        })

        const data = await response.json()

        if (data.success) {
          setActiveJob(data.job_id)
          setIsPolling(true)
          setLastProcessedCount(0)
          setLastUpdateTime(Date.now())
          setProcessingSpeed(0)
          setJobResults([])
          toast.success(`🚀 Processing started!`, {
            duration: 5000,
            style: { borderRadius: '12px', background: '#F97316', color: 'white' }
          })
        } else {
          toast.error(`Error: ${data.error}`)
        }
      } else {
        // Handle Workdrive extraction
        const formData = new FormData()
        formData.append('folder_id', config.folder_id)
        formData.append('selected_file_ids', JSON.stringify([...selectedFiles]))

        const response = await fetch(`${API_BASE_URL}/barcode/workdrive/start`, {
          method: 'POST',
          body: formData
        })

        const data = await response.json()

        if (data.success) {
          setActiveJob(data.job_id)
          setIsPolling(true)
          setLastProcessedCount(0)
          setLastUpdateTime(Date.now())
          setProcessingSpeed(0)
          setJobResults([])
          toast.success(`🚀 Processing started!`, {
            duration: 5000,
            style: { borderRadius: '12px', background: '#F97316', color: 'white' }
          })
        } else {
          toast.error(`Error: ${data.error}`)
        }
      }
    } catch (error) {
      toast.error(`Failed to start: ${error.message}`)
    }
  }

  const fetchJobStatus = async (jobId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/barcode/workdrive/status/${jobId}`)
      const data = await response.json()

      if (data.success) {
        setJobStatus(data)

        const now = Date.now()
        const processed = data.progress?.processed_files || 0

        if (processed > lastProcessedCount) {
          const timeDiff = (now - lastUpdateTime) / 1000 / 60
          const filesDiff = processed - lastProcessedCount
          const speed = filesDiff / timeDiff
          setProcessingSpeed(speed)
          setLastProcessedCount(processed)
          setLastUpdateTime(now)
        }

        if (data.status === 'completed' || data.status === 'failed') {
          setIsPolling(false)
          fetchJobResults(jobId)

          if (data.status === 'completed') {
            toast.success('✅ Extraction completed!', {
              icon: '🎉',
              style: { borderRadius: '12px', background: '#10B981', color: 'white' }
            })
          } else {
            toast.error('❌ Extraction failed')
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch status:', error)
    }
  }

  const fetchJobResults = async (jobId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/barcode/workdrive/results/${jobId}?limit=100`)
      const data = await response.json()

      if (data.success) {
        setJobResults(data.results || [])
      }
    } catch (error) {
      console.error('Failed to fetch results:', error)
    }
  }

  const handleBackToMain = () => {
    setActiveJob(null)
    setJobStatus(null)
    setIsPolling(false)
    setJobResults([])
    
    if (extractionMode === 'workdrive') {
      loadFiles()
    }
  }

  const toggleSelectAll = () => {
    if (selectedFiles.size > 0) {
      setSelectedFiles(new Set())
    } else {
      setSelectedFiles(new Set(files.map(f => f.file_id)))
    }
  }

  const toggleSelectFile = (fileId) => {
    const newSelected = new Set(selectedFiles)
    if (newSelected.has(fileId)) {
      newSelected.delete(fileId)
    } else {
      newSelected.add(fileId)
    }
    setSelectedFiles(newSelected)
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
    toast.success('Copied to clipboard!', {
      icon: '📋',
      duration: 2000
    })
  }

  const downloadResults = () => {
    const headers = ['Filename', 'Barcode Type', 'Barcode Data', 'Status', 'Cost (USD)']
    const rows = jobResults.map(r => [
      r.filename || '',
      r.barcode_type || '',
      r.barcode_data || '',
      r.status || '',
      (r.cost_usd || 0).toFixed(6)
    ])

    const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `barcode_extraction_${activeJob}.csv`
    a.click()
    URL.revokeObjectURL(url)

    toast.success('Downloaded results as CSV', {
      icon: '📥',
      duration: 3000
    })
  }

  const filteredFiles = useMemo(() => {
    return files.filter(file =>
      file.filename?.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [files, searchQuery])

  const totalPages = Math.ceil(filteredFiles.length / filesPerPage)
  const startIndex = (currentPage - 1) * filesPerPage
  const endIndex = startIndex + filesPerPage
  const paginatedFiles = filteredFiles.slice(startIndex, endIndex)

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <Toaster
        position="top-right"
        toastOptions={{ duration: 4000 }}
        containerStyle={{ zIndex: 9999 }}
      />

      <style>{`
        * {
          box-sizing: border-box;
        }
        
        .glass-card {
          background: rgba(255, 255, 255, 0.98);
          backdrop-filter: blur(40px);
          border-radius: 24px;
          border: 1px solid rgba(249, 115, 22, 0.1);
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.05), 0 0 1px rgba(0, 0, 0, 0.1);
          transition: all 0.3s ease;
        }
        
        .glass-card:hover {
          box-shadow: 0 30px 90px rgba(249, 115, 22, 0.12);
          transform: translateY(-2px);
        }
        
        .input-modern, .select-modern {
          background: #F8FAFC;
          border: 2px solid #E2E8F0;
          border-radius: 12px;
          padding: 14px 18px;
          font-size: 15px;
          font-weight: 500;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          width: 100%;
          color: #1E293B;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }
        
        .input-modern:focus, .select-modern:focus {
          outline: none;
          border-color: #F97316;
          background: white;
          box-shadow: 0 0 0 4px rgba(249, 115, 22, 0.1), 0 8px 16px rgba(249, 115, 22, 0.08);
          transform: translateY(-1px);
        }
        
        .btn-primary {
          background: linear-gradient(135deg, #F97316 0%, #EA580C 100%);
          color: white;
          border: none;
          padding: 14px 28px;
          border-radius: 12px;
          font-weight: 600;
          font-size: 15px;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 10px;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 8px 20px rgba(249, 115, 22, 0.3), 0 4px 8px rgba(0, 0, 0, 0.1);
          position: relative;
          overflow: hidden;
        }
        
        .btn-primary::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
          transition: left 0.5s;
        }
        
        .btn-primary:hover::before {
          left: 100%;
        }
        
        .btn-primary:hover:not(:disabled) {
          transform: translateY(-3px);
          box-shadow: 0 12px 32px rgba(249, 115, 22, 0.4), 0 8px 16px rgba(0, 0, 0, 0.15);
        }
        
        .btn-primary:active:not(:disabled) {
          transform: translateY(-1px);
        }
        
        .btn-primary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }
        
        .btn-secondary {
          background: white;
          color: #475569;
          border: 2px solid #E2E8F0;
          padding: 12px 24px;
          border-radius: 12px;
          font-weight: 600;
          font-size: 14px;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .btn-secondary:hover:not(:disabled) {
          border-color: #F97316;
          background: #F5F3FF;
          color: #EA580C;
          transform: translateY(-2px);
          box-shadow: 0 8px 16px rgba(249, 115, 22, 0.15);
        }

        .btn-secondary:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .btn-danger {
          background: #FEE2E2;
          color: #DC2626;
          border: 2px solid #FECACA;
          padding: 8px 16px;
          border-radius: 8px;
          font-weight: 600;
          font-size: 13px;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          transition: all 0.2s ease;
        }

        .btn-danger:hover {
          background: #FCA5A5;
          border-color: #DC2626;
        }
        
        .stat-card {
          background: linear-gradient(135deg, #F97316 0%, #EA580C 100%);
          color: white;
          padding: 24px;
          border-radius: 16px;
          box-shadow: 0 12px 32px rgba(249, 115, 22, 0.3);
          position: relative;
          overflow: hidden;
        }
        
        .stat-card::before {
          content: '';
          position: absolute;
          top: -50%;
          right: -50%;
          width: 200%;
          height: 200%;
          background: radial-gradient(circle, rgba(255,255,255,0.15) 0%, transparent 70%);
          animation: pulse 4s ease-in-out infinite;
        }
        
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 0.5; }
          50% { transform: scale(1.1); opacity: 0.8; }
        }
        
        .table-modern {
          width: 100%;
          border-collapse: separate;
          border-spacing: 0;
        }
        
        .table-modern th {
          background: linear-gradient(135deg, #1E293B 0%, #334155 100%);
          color: white;
          padding: 18px 20px;
          text-align: left;
          font-weight: 600;
          font-size: 13px;
          text-transform: uppercase;
          letter-spacing: 1px;
          white-space: nowrap;
          position: sticky;
          top: 0;
          z-index: 10;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }
        
        .table-modern th:first-child {
          border-top-left-radius: 12px;
        }
        
        .table-modern th:last-child {
          border-top-right-radius: 12px;
        }
        
        .table-modern td {
          padding: 18px 20px;
          border-bottom: 1px solid #F1F5F9;
          color: #1E293B;
          font-size: 14px;
          font-weight: 500;
        }
        
        .table-modern tbody tr {
          transition: all 0.2s ease;
        }
        
        .table-modern tbody tr:hover {
          background: linear-gradient(90deg, #F8F9FF 0%, #F5F3FF 100%);
          transform: scale(1.01);
          box-shadow: 0 4px 12px rgba(249, 115, 22, 0.08);
        }
        
        .table-modern tbody tr.selected {
          background: linear-gradient(90deg, #EDE9FE 0%, #DDD6FE 100%);
          border-left: 4px solid #F97316;
        }
        
        .badge-modern {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 14px;
          border-radius: 10px;
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.3px;
        }
        
        .badge-success {
          background: linear-gradient(135deg, #10B981 0%, #059669 100%);
          color: white;
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
        }
        
        .badge-warning {
          background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%);
          color: white;
          box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
        }

        .badge-error {
          background: linear-gradient(135deg, #EF4444 0%, #DC2626 100%);
          color: white;
          box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
        }

        .badge-info {
          background: linear-gradient(135deg, #3B82F6 0%, #2563EB 100%);
          color: white;
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
        }
        
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        .spinning {
          animation: spin 1s linear infinite;
        }
        
        .step-number {
          width: 40px;
          height: 40px;
          border-radius: 12px;
          background: linear-gradient(135deg, #F97316 0%, #EA580C 100%);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 18px;
          box-shadow: 0 6px 16px rgba(249, 115, 22, 0.4);
        }

        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        .result-card {
          background: white;
          border-radius: 16px;
          padding: 20px;
          border: 2px solid #F1F5F9;
          transition: all 0.3s ease;
        }

        .result-card:hover {
          border-color: #F97316;
          box-shadow: 0 8px 24px rgba(249, 115, 22, 0.15);
          transform: translateY(-2px);
        }

        .barcode-data-display {
          background: #F8FAFC;
          border: 2px solid #E2E8F0;
          border-radius: 10px;
          padding: 12px 16px;
          font-family: 'Courier New', monospace;
          font-size: 15px;
          font-weight: 600;
          color: #1E293B;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          transition: all 0.2s ease;
        }

        .barcode-data-display:hover {
          border-color: #F97316;
          background: white;
        }

        .copy-button {
          background: transparent;
          border: none;
          padding: 6px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 6px;
          transition: all 0.2s ease;
          color: #64748B;
        }

        .copy-button:hover {
          background: #F1F5F9;
          color: #F97316;
          transform: scale(1.1);
        }

        .mode-tabs {
          display: flex;
          gap: 12px;
          margin-bottom: 24px;
          border-bottom: 2px solid #F1F5F9;
        }

        .mode-tab {
          padding: 14px 24px;
          border: none;
          background: transparent;
          cursor: pointer;
          font-weight: 600;
          font-size: 15px;
          color: #64748B;
          transition: all 0.3s ease;
          border-bottom: 3px solid transparent;
          margin-bottom: -2px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .mode-tab.active {
          color: #F97316;
          border-bottom-color: #F97316;
        }

        .mode-tab:hover {
          color: #F97316;
        }

        .drag-zone {
          border: 2px dashed #F97316;
          border-radius: 16px;
          padding: 40px;
          text-align: center;
          transition: all 0.3s ease;
          background: rgba(249, 115, 22, 0.02);
          cursor: pointer;
        }

        .drag-zone.active {
          background: rgba(249, 115, 22, 0.1);
          border-color: #EA580C;
        }

        .file-list {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 16px;
          margin-top: 20px;
        }

        .file-item {
          background: white;
          border: 2px solid #E2E8F0;
          border-radius: 12px;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          transition: all 0.3s ease;
          position: relative;
        }

        .file-item.selected {
          border-color: #F97316;
          background: #F5F3FF;
        }

        .file-item:hover {
          border-color: #F97316;
          box-shadow: 0 8px 16px rgba(249, 115, 22, 0.15);
        }

        .file-checkbox {
          position: absolute;
          top: 12px;
          right: 12px;
          width: 20px;
          height: 20px;
          cursor: pointer;
          accent-color: #F97316;
        }

        .file-info {
          padding-right: 32px;
        }

        .file-name {
          font-weight: 600;
          color: #1E293B;
          word-break: break-word;
          font-size: 14px;
        }

        .file-size {
          font-size: 12px;
          color: #64748B;
        }

        .file-remove {
          background: #FEE2E2;
          color: #DC2626;
          border: none;
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .file-remove:hover {
          background: #FECACA;
        }
      `}</style>

      <AnimatePresence mode="wait">
        {!activeJob ? (
          <motion.div
            key="config"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
          >
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card"
              style={{ padding: '40px', marginBottom: '32px' }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                marginBottom: '32px'
              }}>
                <ScanBarcode size={40} color="#F97316" />
                <div>
                  <h2 style={{ margin: 0, fontSize: '32px', fontWeight: 800, color: '#1E293B' }}>
                    Barcode Extractor
                  </h2>
                  <p style={{ margin: '4px 0 0 0', fontSize: '16px', color: '#64748B' }}>
                    Extract barcodes from images using AI
                  </p>
                </div>
              </div>

              {/* Mode Selection Tabs */}
              <div className="mode-tabs">
                <button
                  className={`mode-tab ${extractionMode === 'workdrive' ? 'active' : ''}`}
                  onClick={() => {
                    setExtractionMode('workdrive')
                    setSelectedFiles(new Set())
                    setSearchQuery('')
                  }}
                >
                  <Cloud size={18} />
                  Workdrive
                </button>
                <button
                  className={`mode-tab ${extractionMode === 'local' ? 'active' : ''}`}
                  onClick={() => {
                    setExtractionMode('local')
                    setSelectedFiles(new Set())
                    setSearchQuery('')
                  }}
                >
                  <HardDrive size={18} />
                  Local Files
                </button>
              </div>
            </motion.div>

            {/* Workdrive Mode */}
            {extractionMode === 'workdrive' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass-card"
                  style={{ padding: '40px', marginBottom: '32px' }}
                >
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    marginBottom: '24px'
                  }}>
                    <div className="step-number">1</div>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: '#1E293B' }}>
                        Connect to Workdrive
                      </h3>
                      <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#64748B' }}>
                        Enter your Workdrive folder ID
                      </p>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 240px', gap: '20px' }}>
                    <div>
                      <label style={{
                        display: 'block',
                        marginBottom: '10px',
                        fontSize: '14px',
                        fontWeight: 600,
                        color: '#475569'
                      }}>Folder ID *</label>
                      <input
                        type="text"
                        className="input-modern"
                        value={config.folder_id}
                        onChange={(e) => setConfig({ ...config, folder_id: e.target.value })}
                        placeholder="Enter Workdrive folder ID"
                      />
                    </div>

                    <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                      <button
                        className="btn-primary"
                        onClick={loadFiles}
                        disabled={isLoadingFiles || !config.folder_id}
                        style={{ width: '100%', justifyContent: 'center' }}
                      >
                        {isLoadingFiles ? (
                          <>
                            <Loader2 size={18} className="spinning" />
                            Loading...
                          </>
                        ) : (
                          <>
                            <Folder size={18} />
                            Load Files
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </motion.div>

                {/* Workdrive Files Table */}
                {files.length > 0 && extractionMode === 'workdrive' && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    {/* Stats Cards */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '24px' }}>
                      <div className="stat-card">
                        <div style={{ position: 'relative', zIndex: 1 }}>
                          <div style={{ fontSize: '13px', opacity: 0.9, marginBottom: '8px', letterSpacing: '0.5px' }}>
                            TOTAL FILES
                          </div>
                          <div style={{ fontSize: '40px', fontWeight: 800, lineHeight: 1 }}>
                            {filteredFiles.length}
                          </div>
                        </div>
                      </div>

                      <div className="stat-card">
                        <div style={{ position: 'relative', zIndex: 1 }}>
                          <div style={{ fontSize: '13px', opacity: 0.9, marginBottom: '8px', letterSpacing: '0.5px' }}>
                            SELECTED
                          </div>
                          <div style={{ fontSize: '40px', fontWeight: 800, lineHeight: 1 }}>
                            {selectedFiles.size}
                          </div>
                        </div>
                      </div>

                      <div className="stat-card">
                        <div style={{ position: 'relative', zIndex: 1 }}>
                          <div style={{ fontSize: '13px', opacity: 0.9, marginBottom: '8px', letterSpacing: '0.5px' }}>
                            EST. TIME
                          </div>
                          <div style={{ fontSize: '40px', fontWeight: 800, lineHeight: 1 }}>
                            {Math.ceil(selectedFiles.size * 2 / 60)}m
                          </div>
                        </div>
                      </div>

                      <div className="stat-card">
                        <div style={{ position: 'relative', zIndex: 1 }}>
                          <div style={{ fontSize: '13px', opacity: 0.9, marginBottom: '8px', letterSpacing: '0.5px' }}>
                            EST. COST
                          </div>
                          <div style={{ fontSize: '40px', fontWeight: 800, lineHeight: 1 }}>
                            ${(selectedFiles.size * 0.002).toFixed(2)}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Toolbar */}
                    <div className="glass-card" style={{
                      padding: '20px',
                      marginBottom: '20px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                        <Search size={20} color="#F97316" />
                        <input
                          type="text"
                          className="input-modern"
                          placeholder="Search files..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          style={{ maxWidth: '400px' }}
                        />
                      </div>

                      <button
                        className="btn-primary"
                        onClick={startExtraction}
                        disabled={selectedFiles.size === 0}
                        style={{ fontSize: '16px', padding: '14px 32px' }}
                      >
                        <Play size={20} />
                        Process {selectedFiles.size} Files
                      </button>
                    </div>

                    {/* Table */}
                    <div className="glass-card" style={{ overflow: 'hidden' }}>
                      <div style={{ maxHeight: '600px', overflow: 'auto' }}>
                        <table className="table-modern">
                          <thead>
                            <tr>
                              <th style={{ width: '80px', textAlign: 'center' }}>
                                <input
                                  type="checkbox"
                                  checked={selectedFiles.size > 0 && selectedFiles.size === filteredFiles.length}
                                  onChange={toggleSelectAll}
                                  style={{
                                    width: '20px',
                                    height: '20px',
                                    cursor: 'pointer',
                                    accentColor: '#F97316'
                                  }}
                                />
                              </th>
                              <th>Filename</th>
                              <th style={{ width: '150px' }}>Type</th>
                              <th style={{ width: '150px', textAlign: 'right' }}>Size</th>
                            </tr>
                          </thead>
                          <tbody>
                            {paginatedFiles.map(file => (
                              <tr
                                key={file.file_id}
                                className={selectedFiles.has(file.file_id) ? 'selected' : ''}
                                onClick={() => toggleSelectFile(file.file_id)}
                                style={{ cursor: 'pointer' }}
                              >
                                <td style={{ textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                                  <input
                                    type="checkbox"
                                    checked={selectedFiles.has(file.file_id)}
                                    onChange={() => toggleSelectFile(file.file_id)}
                                    style={{
                                      width: '20px',
                                      height: '20px',
                                      cursor: 'pointer',
                                      accentColor: '#F97316'
                                    }}
                                  />
                                </td>
                                <td style={{ fontWeight: 600, fontSize: '15px' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <Image size={18} color="#F97316" />
                                    {file.filename}
                                  </div>
                                </td>
                                <td style={{ fontFamily: 'monospace', fontSize: '13px', color: '#64748B', textTransform: 'uppercase' }}>
                                  {file.extension}
                                </td>
                                <td style={{ textAlign: 'right', fontSize: '14px', color: '#64748B' }}>
                                  {(file.size / 1024).toFixed(1)} KB
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Pagination */}
                      <div style={{
                        padding: '20px',
                        borderTop: '2px solid #F1F5F9',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <button
                          className="btn-secondary"
                          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                          disabled={currentPage === 1}
                        >
                          <ChevronLeft size={16} />
                          Previous
                        </button>

                        <span style={{ fontWeight: 700, fontSize: '15px', color: '#475569' }}>
                          Page {currentPage} of {totalPages}
                        </span>

                        <button
                          className="btn-secondary"
                          onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                          disabled={currentPage === totalPages}
                        >
                          Next
                          <ChevronRight size={16} />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* Local Files Mode */}
            {extractionMode === 'local' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass-card"
                  style={{ padding: '40px', marginBottom: '32px' }}
                >
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    marginBottom: '24px'
                  }}>
                    <div className="step-number">1</div>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: '#1E293B' }}>
                        Upload Local Files
                      </h3>
                      <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#64748B' }}>
                        Drag & drop or click to upload images
                      </p>
                    </div>
                  </div>

                  {/* Drag and Drop Zone */}
                  <div
                    className={`drag-zone ${dragActive ? 'active' : ''}`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    onClick={() => document.getElementById('file-input').click()}
                  >
                    <input
                      id="file-input"
                      type="file"
                      multiple
                      accept="image/*,.pdf"
                      onChange={handleFileInput}
                      style={{ display: 'none' }}
                    />
                    <Upload size={40} color="#F97316" style={{ margin: '0 auto 16px' }} />
                    <div style={{ fontSize: '16px', fontWeight: 600, color: '#1E293B', marginBottom: '8px' }}>
                      {dragActive ? 'Drop files here' : 'Drag files here or click to browse'}
                    </div>
                    <div style={{ fontSize: '13px', color: '#64748B' }}>
                      Supported formats: JPG, PNG, GIF, WebP, PDF
                    </div>
                  </div>
                </motion.div>

                {/* Local Files Grid */}
                {localFiles.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    {/* Stats Cards */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '24px' }}>
                      <div className="stat-card">
                        <div style={{ position: 'relative', zIndex: 1 }}>
                          <div style={{ fontSize: '13px', opacity: 0.9, marginBottom: '8px', letterSpacing: '0.5px' }}>
                            TOTAL FILES
                          </div>
                          <div style={{ fontSize: '40px', fontWeight: 800, lineHeight: 1 }}>
                            {localFiles.length}
                          </div>
                        </div>
                      </div>

                      <div className="stat-card">
                        <div style={{ position: 'relative', zIndex: 1 }}>
                          <div style={{ fontSize: '13px', opacity: 0.9, marginBottom: '8px', letterSpacing: '0.5px' }}>
                            SELECTED
                          </div>
                          <div style={{ fontSize: '40px', fontWeight: 800, lineHeight: 1 }}>
                            {selectedFiles.size}
                          </div>
                        </div>
                      </div>

                      <div className="stat-card">
                        <div style={{ position: 'relative', zIndex: 1 }}>
                          <div style={{ fontSize: '13px', opacity: 0.9, marginBottom: '8px', letterSpacing: '0.5px' }}>
                            EST. TIME
                          </div>
                          <div style={{ fontSize: '40px', fontWeight: 800, lineHeight: 1 }}>
                            {Math.ceil(selectedFiles.size * 2 / 60)}m
                          </div>
                        </div>
                      </div>

                      <div className="stat-card">
                        <div style={{ position: 'relative', zIndex: 1 }}>
                          <div style={{ fontSize: '13px', opacity: 0.9, marginBottom: '8px', letterSpacing: '0.5px' }}>
                            EST. COST
                          </div>
                          <div style={{ fontSize: '40px', fontWeight: 800, lineHeight: 1 }}>
                            ${(selectedFiles.size * 0.002).toFixed(2)}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Files Grid */}
                    <div className="file-list">
                      {localFiles.map(file => (
                        <div
                          key={file.file_id}
                          className={`file-item ${selectedFiles.has(file.file_id) ? 'selected' : ''}`}
                          onClick={() => toggleSelectFile(file.file_id)}
                        >
                          <input
                            type="checkbox"
                            className="file-checkbox"
                            checked={selectedFiles.has(file.file_id)}
                            onChange={() => toggleSelectFile(file.file_id)}
                          />
                          <div className="file-info">
                            <Image size={24} color="#F97316" style={{ marginBottom: '8px' }} />
                            <div className="file-name">{file.filename}</div>
                            <div className="file-size">{(file.size / 1024).toFixed(1)} KB</div>
                          </div>
                          <button
                            className="file-remove"
                            onClick={(e) => {
                              e.stopPropagation()
                              removeLocalFile(file.file_id)
                            }}
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* Action Buttons */}
                    <div style={{
                      display: 'flex',
                      gap: '12px',
                      marginTop: '24px',
                      justifyContent: 'flex-end'
                    }}>
                      <button
                        className="btn-secondary"
                        onClick={() => {
                          setLocalFiles([])
                          setFiles([])
                          setSelectedFiles(new Set())
                        }}
                      >
                        Clear All
                      </button>
                      <button
                        className="btn-primary"
                        onClick={startExtraction}
                        disabled={selectedFiles.size === 0}
                        style={{ fontSize: '16px', padding: '14px 32px' }}
                      >
                        <Play size={20} />
                        Process {selectedFiles.size} Files
                      </button>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}
          </motion.div>
        ) : (
          // Processing Monitor View
          <motion.div
            key="processing"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass-card"
              style={{ padding: '48px' }}
            >
              {/* Header with Back Button */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '32px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <Activity size={32} color="#F97316" />
                  <div>
                    <h2 style={{ margin: 0, fontSize: '28px', fontWeight: 800, color: '#1E293B' }}>
                      Processing Barcodes
                    </h2>
                    <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#64748B', fontFamily: 'monospace' }}>
                      {activeJob}
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <span style={{
                    padding: '12px 24px',
                    borderRadius: '12px',
                    background: jobStatus?.status === 'running'
                      ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)'
                      : jobStatus?.status === 'completed'
                        ? 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)'
                        : 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
                    color: 'white',
                    fontSize: '14px',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    letterSpacing: '0.5px',
                    textTransform: 'uppercase',
                    boxShadow: jobStatus?.status === 'running'
                      ? '0 8px 20px rgba(16, 185, 129, 0.4)'
                      : '0 8px 20px rgba(59, 130, 246, 0.4)'
                  }}>
                    {jobStatus?.status === 'running' && <Loader2 size={16} className="spinning" />}
                    {jobStatus?.status || 'Loading'}
                  </span>

                  {jobStatus?.status === 'completed' && (
                    <button
                      className="btn-secondary"
                      onClick={handleBackToMain}
                      style={{ gap: '8px' }}
                    >
                      <ArrowLeft size={18} />
                      Back to Main
                    </button>
                  )}
                </div>
              </div>

              {/* Progress Bar */}
              <div style={{
                background: '#F1F5F9',
                height: '48px',
                borderRadius: '24px',
                overflow: 'hidden',
                marginBottom: '32px',
                position: 'relative',
                boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.1)'
              }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${jobStatus?.progress?.progress_percent || 0}%` }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                  style={{
                    background: 'linear-gradient(90deg, #F97316, #EC4899, #F97316)',
                    backgroundSize: '200% 100%',
                    animation: jobStatus?.status === 'running' ? 'gradient 3s ease infinite' : 'none',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontWeight: 800,
                    fontSize: '18px',
                    letterSpacing: '1px'
                  }}
                >
                  {(jobStatus?.progress?.progress_percent || 0).toFixed(1)}%
                </motion.div>
              </div>

              {/* Stats Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '20px', marginBottom: '32px' }}>
                {[
                  { label: 'Total', value: jobStatus?.progress?.total_files || 0, color: '#F97316', icon: Database },
                  { label: 'Processed', value: jobStatus?.progress?.processed_files || 0, color: '#3B82F6', icon: Activity },
                  { label: 'Success', value: jobStatus?.progress?.successful_files || 0, color: '#10B981', icon: CheckCircle2 },
                  { label: 'Failed', value: jobStatus?.progress?.failed_files || 0, color: '#EF4444', icon: XCircle },
                  { label: 'Speed', value: processingSpeed > 0 ? `${processingSpeed.toFixed(1)}/min` : '—', color: '#F59E0B', icon: TrendingUp },
                  { label: 'ETA', value: estimatedTimeRemaining ? `${Math.ceil(estimatedTimeRemaining)}m` : '—', color: '#EC4899', icon: Clock }
                ].map((stat, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    style={{
                      background: 'white',
                      padding: '24px',
                      borderRadius: '16px',
                      textAlign: 'center',
                      border: '2px solid #F1F5F9',
                      transition: 'all 0.3s ease'
                    }}
                    whileHover={{
                      borderColor: stat.color,
                      transform: 'translateY(-4px)',
                      boxShadow: `0 12px 24px ${stat.color}20`
                    }}
                  >
                    <stat.icon size={24} color={stat.color} style={{ marginBottom: '8px' }} />
                    <div style={{
                      fontSize: '36px',
                      fontWeight: 800,
                      color: stat.color,
                      lineHeight: 1,
                      marginBottom: '8px'
                    }}>
                      {stat.value}
                    </div>
                    <div style={{
                      fontSize: '12px',
                      color: '#64748B',
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>
                      {stat.label}
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Cost Banner */}
              <div style={{
                background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                padding: '24px 32px',
                borderRadius: '16px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                boxShadow: '0 12px 32px rgba(16, 185, 129, 0.3)',
                marginBottom: '32px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <DollarSign size={28} color="white" />
                  <span style={{ fontSize: '18px', fontWeight: 600, color: 'white' }}>
                    Total Processing Cost
                  </span>
                </div>
                <span style={{ fontSize: '36px', fontWeight: 800, color: 'white' }}>
                  ${(jobStatus?.cost?.total_cost_usd || 0).toFixed(4)}
                </span>
              </div>

              {/* Recent Results Preview */}
              {jobResults.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{ marginBottom: '32px' }}
                >
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '16px'
                  }}>
                    <h3 style={{
                      margin: 0,
                      fontSize: '20px',
                      fontWeight: 700,
                      color: '#1E293B',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px'
                    }}>
                      <BarChart3 size={24} color="#F97316" />
                      Extracted Barcodes
                    </h3>
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <span style={{
                        fontSize: '14px',
                        color: '#64748B',
                        fontWeight: 600
                      }}>
                        Showing {jobResults.length} results
                      </span>
                      {jobStatus?.status === 'completed' && (
                        <button
                          className="btn-secondary"
                          onClick={downloadResults}
                          style={{ fontSize: '13px', padding: '8px 16px' }}
                        >
                          <Download size={16} />
                          Export CSV
                        </button>
                      )}
                    </div>
                  </div>

                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: '16px'
                  }}>
                    {jobResults.slice(0, 10).map((result, idx) => (
                      <motion.div
                        key={result.id || idx}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: idx * 0.05 }}
                        className="result-card"
                      >
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                          marginBottom: '12px'
                        }}>
                          <div style={{ flex: 1 }}>
                            <div style={{
                              fontSize: '14px',
                              fontWeight: 700,
                              color: '#1E293B',
                              marginBottom: '4px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px'
                            }}>
                              <Image size={16} color="#F97316" />
                              {result.filename || 'Unknown File'}
                            </div>
                            <div style={{
                              fontSize: '11px',
                              color: '#64748B',
                              fontFamily: 'monospace'
                            }}>
                              File ID: {result.file_id}
                            </div>
                          </div>
                          <span className={`badge-modern ${result.status === 'success' ? 'badge-success' : 'badge-error'}`}>
                            {result.status === 'success' ? (
                              <>
                                <CheckCircle2 size={12} />
                                Success
                              </>
                            ) : (
                              <>
                                <XCircle size={12} />
                                Failed
                              </>
                            )}
                          </span>
                        </div>

                        {result.status === 'success' && result.barcode_data ? (
                          <>
                            {result.barcode_type && (
                              <div style={{ marginBottom: '10px' }}>
                                <span className="badge-modern badge-info">
                                  <ScanBarcode size={12} />
                                  {result.barcode_type}
                                </span>
                                {result.all_barcodes && result.all_barcodes.length > 1 && (
                                  <span className="badge-modern badge-success" style={{ marginLeft: '8px' }}>
                                    {result.all_barcodes.length} barcodes found
                                  </span>
                                )}
                              </div>
                            )}

                            <div className="barcode-data-display">
                              <div style={{
                                flex: 1,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                              }}>
                                {result.barcode_data}
                              </div>
                              <button
                                className="copy-button"
                                onClick={() => copyToClipboard(result.barcode_data)}
                                title="Copy barcode data"
                              >
                                <Copy size={16} />
                              </button>
                            </div>

                            {result.all_barcodes && result.all_barcodes.length > 1 && (
                              <details style={{ marginTop: '12px' }}>
                                <summary style={{
                                  cursor: 'pointer',
                                  fontSize: '12px',
                                  fontWeight: 600,
                                  color: '#F97316',
                                  padding: '8px',
                                  borderRadius: '6px',
                                  background: '#F5F3FF'
                                }}>
                                  View all {result.all_barcodes.length} barcodes
                                </summary>
                                <div style={{
                                  marginTop: '8px',
                                  maxHeight: '200px',
                                  overflowY: 'auto',
                                  padding: '8px',
                                  background: '#FAFAFA',
                                  borderRadius: '8px'
                                }}>
                                  {result.all_barcodes.map((bc, idx) => (
                                    <div key={idx} style={{
                                      padding: '6px 8px',
                                      fontSize: '11px',
                                      fontFamily: 'monospace',
                                      borderBottom: idx < result.all_barcodes.length - 1 ? '1px solid #E5E7EB' : 'none',
                                      display: 'flex',
                                      justifyContent: 'space-between',
                                      alignItems: 'center'
                                    }}>
                                      <span>{bc.data}</span>
                                      <button
                                        className="copy-button"
                                        onClick={() => copyToClipboard(bc.data)}
                                        style={{ padding: '4px' }}
                                      >
                                        <Copy size={12} />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              </details>
                            )}
                          </>
                        ) : (
                          <div style={{
                            padding: '12px',
                            background: '#FEF2F2',
                            borderRadius: '8px',
                            fontSize: '13px',
                            color: '#DC2626',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                          }}>
                            <AlertCircle size={16} />
                            {result.error_message || 'No barcode detected'}
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </div>

                  {jobResults.length > 10 && (
                    <div style={{
                      marginTop: '16px',
                      textAlign: 'center'
                    }}>
                      <button
                        className="btn-secondary"
                        onClick={() => {
                          toast.success('Showing first 10 results. Export CSV for full data.')
                        }}
                      >
                        <FileText size={16} />
                        Viewing 10 of {jobResults.length} results
                      </button>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Completion Actions */}
              {jobStatus?.status === 'completed' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '16px'
                  }}
                >
                  <button
                    className="btn-secondary"
                    onClick={handleBackToMain}
                    style={{
                      fontSize: '16px',
                      padding: '18px',
                      justifyContent: 'center'
                    }}
                  >
                    <ArrowLeft size={20} />
                    Back to Files
                  </button>

                  <button
                    className="btn-primary"
                    onClick={() => {
                      setActiveJob(null)
                      setJobStatus(null)
                      setIsPolling(false)
                      setJobResults([])
                      setLocalFiles([])
                      setFiles([])
                      setSelectedFiles(new Set())
                      setSearchQuery('')
                      setConfig({ folder_id: '' })
                    }}
                    style={{
                      fontSize: '16px',
                      padding: '18px',
                      justifyContent: 'center'
                    }}
                  >
                    <RefreshCw size={20} />
                    Start New Extraction
                  </button>
                </motion.div>
              )}

              {jobStatus?.status === 'failed' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{
                    background: 'linear-gradient(135deg, #FEE2E2 0%, #FECACA 100%)',
                    padding: '24px',
                    borderRadius: '16px',
                    marginBottom: '16px'
                  }}
                >
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    marginBottom: '12px'
                  }}>
                    <AlertCircle size={24} color="#DC2626" />
                    <h4 style={{
                      margin: 0,
                      fontSize: '18px',
                      fontWeight: 700,
                      color: '#DC2626'
                    }}>
                      Job Failed
                    </h4>
                  </div>
                  <p style={{
                    margin: 0,
                    fontSize: '14px',
                    color: '#991B1B',
                    lineHeight: 1.6
                  }}>
                    The barcode extraction job encountered an error. You can try again or contact support if the issue persists.
                  </p>
                </motion.div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}