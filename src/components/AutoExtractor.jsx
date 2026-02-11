import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import toast, { Toaster } from 'react-hot-toast'
import {
  Play, CheckCircle2, XCircle, Activity, RefreshCw, Loader2, Search,
  ChevronLeft, ChevronRight, List, Plus, Trash2, Database, Zap, AlertCircle,
  TrendingUp, Clock, DollarSign, Sparkles, Filter, ArrowLeft, FileText,
  FileImage, BarChart3, X, SlidersHorizontal, MinusCircle, CheckSquare,
  Square, MousePointerClick, Layers, Eye, EyeOff, Columns
} from 'lucide-react'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export default function AutoExtractor() {
  const [config, setConfig] = useState({
    app_link_name: 'teameverest/iatc-scholarship',
    report_link_name: 'Active_Scholar_Fee_Request_Signup_Report',
    bank_field_name: '',
    bill_field_name: ''
  })

  const [isLoadingFields, setIsLoadingFields] = useState(false)
  const [availableFields, setAvailableFields] = useState({
    file_fields: [],
    text_fields: [],
    all_fields: []
  })

  const [filters, setFilters] = useState([])
  const [allRecords, setAllRecords] = useState([])
  const [isLoadingRecords, setIsLoadingRecords] = useState(false)
  const [selectedRecords, setSelectedRecords] = useState(new Set())
  const [totalRecordsAvailable, setTotalRecordsAvailable] = useState(0)

  // ✅ NEW: Field visibility management
  const [visibleFields, setVisibleFields] = useState(new Set(['student_name', 'record_id', 'has_bank_image', 'has_bill_image']))
  const [showFieldSelector, setShowFieldSelector] = useState(false)

  const [currentPage, setCurrentPage] = useState(1)
  const [recordsPerPage, setRecordsPerPage] = useState(50)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' })

  const [activeJob, setActiveJob] = useState(null)
  const [jobStatus, setJobStatus] = useState(null)
  const [isPolling, setIsPolling] = useState(false)
  const [jobResults, setJobResults] = useState([])

  const [processingSpeed, setProcessingSpeed] = useState(0)
  const [lastProcessedCount, setLastProcessedCount] = useState(0)
  const [lastUpdateTime, setLastUpdateTime] = useState(Date.now())
  const [estimatedTimeRemaining, setEstimatedTimeRemaining] = useState(null)

  const [selectionMode, setSelectionMode] = useState('manual')

  useEffect(() => {
    let interval
    if (isPolling && activeJob) {
      interval = setInterval(() => fetchJobStatus(activeJob), 1000)
    }
    return () => clearInterval(interval)
  }, [isPolling, activeJob])

  useEffect(() => {
    if (jobStatus && processingSpeed > 0) {
      const remaining = jobStatus.progress?.total_records - jobStatus.progress?.processed_records
      setEstimatedTimeRemaining(remaining / processingSpeed)
    }
  }, [jobStatus, processingSpeed])

  const fetchFields = async () => {
    if (!config.app_link_name || !config.report_link_name) {
      toast.error('Please enter App Link Name and Report Link Name first')
      return
    }

    setIsLoadingFields(true)
    try {
      const formData = new FormData()
      formData.append('app_link_name', config.app_link_name)
      formData.append('report_link_name', config.report_link_name)

      const response = await fetch(`${API_BASE_URL}/ocr/auto-extract/fetch-fields`, {
        method: 'POST',
        body: formData
      })

      const data = await response.json()
      if (data.success) {
        setAvailableFields({
          file_fields: data.file_fields || [],
          text_fields: data.text_fields || [],
          all_fields: data.all_fields || []
        })
        toast.success(`✅ Loaded ${data.total_fields} fields`, {
          icon: '🎯',
          style: { borderRadius: '12px', background: '#10B981', color: 'white' }
        })
      } else {
        toast.error(`Error: ${data.error}`)
      }
    } catch (error) {
      toast.error(`Failed to fetch fields: ${error.message}`)
    } finally {
      setIsLoadingFields(false)
    }
  }

  // ✅ UPDATED: Load ALL records without filters
  const loadRecords = async () => {
    setIsLoadingRecords(true)
    try {
      const formData = new FormData()
      formData.append('app_link_name', config.app_link_name)
      formData.append('report_link_name', config.report_link_name)
      if (config.bank_field_name) formData.append('bank_field_name', config.bank_field_name)
      if (config.bill_field_name) formData.append('bill_field_name', config.bill_field_name)

      // ✅ NO FILTERS - Always fetch ALL
      formData.append('store_images', 'false')
      formData.append('fetch_all', 'true')
      formData.append('max_records_limit', '5000')

      const response = await fetch(`${API_BASE_URL}/ocr/auto-extract/preview`, {
        method: 'POST',
        body: formData
      })

      const data = await response.json()

      if (data.success) {
        const loadedRecords = data.sample_records || []
        
        // Store ALL records with ALL fields
        setAllRecords(loadedRecords)
        setTotalRecordsAvailable(data.total_records || loadedRecords.length)
        setSelectedRecords(new Set())
        setCurrentPage(1)
        
        // ✅ Auto-detect available fields from first record
        if (loadedRecords.length > 0) {
          const firstRecord = loadedRecords[0]
          const detectedFields = Object.keys(firstRecord).filter(key => 
            !['has_bank_image', 'has_bill_image'].includes(key)
          )
          
          // Update available fields if not already set
          if (availableFields.all_fields.length === 0) {
            setAvailableFields(prev => ({
              ...prev,
              all_fields: detectedFields
            }))
          }
        }
        
        console.log('✅ Loaded records:', loadedRecords.length)
        console.log('✅ Sample record fields:', loadedRecords[0] ? Object.keys(loadedRecords[0]) : [])
        
        toast.success(
          `✅ Loaded ${loadedRecords.length} records` + 
          (data.already_extracted_count > 0 ? `\n(Excluded ${data.already_extracted_count} already processed)` : ''),
          {
            icon: '⚡',
            style: { borderRadius: '12px', background: '#8B5CF6', color: 'white' },
            duration: 4000
          }
        )
      } else {
        toast.error(`Error: ${data.error}`)
      }
    } catch (error) {
      console.error('❌ Load records error:', error)
      toast.error(`Failed to load records: ${error.message}`)
    } finally {
      setIsLoadingRecords(false)
    }
  }

  const startExtraction = async () => {
    if (selectedRecords.size === 0) {
      toast.error('Please select at least one record to process')
      return
    }

    try {
      const formData = new FormData()
      formData.append('app_link_name', config.app_link_name)
      formData.append('report_link_name', config.report_link_name)
      if (config.bank_field_name) formData.append('bank_field_name', config.bank_field_name)
      if (config.bill_field_name) formData.append('bill_field_name', config.bill_field_name)

      // ✅ NO FILTERS - just send selected IDs
      formData.append('selected_record_ids', JSON.stringify([...selectedRecords]))

      const response = await fetch(`${API_BASE_URL}/ocr/auto-extract/start`, {
        method: 'POST',
        body: formData
      })

      const data = await response.json()

      if (response.status === 409) {
        toast.error(`⚠️ ${data.message}`, { duration: 6000 })
        if (data.active_job_id) {
          setActiveJob(data.active_job_id)
          setIsPolling(true)
        }
        return
      }

      if (data.success) {
        setActiveJob(data.job_id)
        setIsPolling(true)
        setLastProcessedCount(0)
        setLastUpdateTime(Date.now())
        setProcessingSpeed(0)
        setJobResults([])
        toast.success('🚀 Processing started!')
      } else {
        toast.error(`Error: ${data.error}`)
      }
    } catch (error) {
      toast.error(`Failed to start: ${error.message}`)
    }
  }

  const fetchJobStatus = async (jobId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/ocr/auto-extract/status/${jobId}`)
      const data = await response.json()

      if (data.success) {
        setJobStatus(data)
        const now = Date.now()
        const processed = data.progress?.processed_records || 0

        if (processed > lastProcessedCount) {
          const timeDiff = (now - lastUpdateTime) / 1000 / 60
          const recordsDiff = processed - lastProcessedCount
          setProcessingSpeed(recordsDiff / timeDiff)
          setLastProcessedCount(processed)
          setLastUpdateTime(now)
        }

        if (data.status === 'completed' || data.status === 'failed') {
          setIsPolling(false)
          fetchJobResults(jobId)
          if (data.status === 'completed') {
            toast.success('✅ Extraction completed!', { icon: '🎉' })
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
      const response = await fetch(`${API_BASE_URL}/ocr/auto-extract/results/${jobId}?limit=10`)
      const data = await response.json()
      if (data.success) setJobResults(data.results || [])
    } catch (error) {
      console.error('Failed to fetch results:', error)
    }
  }

  const handleBackToMain = () => {
    setActiveJob(null)
    setJobStatus(null)
    setIsPolling(false)
    setJobResults([])
    loadRecords()
  }

  const addFilter = () => {
    // Get available fields from records
    const fieldOptions = allRecords.length > 0 
      ? Object.keys(allRecords[0]).filter(key => !['has_bank_image', 'has_bill_image'].includes(key))
      : availableFields.all_fields

    setFilters([...filters, {
      id: Date.now(),
      field: fieldOptions[0] || '',
      operator: '==',
      value: ''
    }])
  }

  const removeFilter = (id) => setFilters(filters.filter(f => f.id !== id))

  const updateFilter = (id, key, value) => {
    setFilters(filters.map(f => f.id === id ? { ...f, [key]: value } : f))
  }

  const clearAllFilters = () => {
    setFilters([])
    setSearchQuery('')
    toast.success('All filters cleared')
  }

  // ✅ NEW: Field visibility functions
  const toggleFieldVisibility = (fieldName) => {
    const newVisible = new Set(visibleFields)
    if (newVisible.has(fieldName)) {
      newVisible.delete(fieldName)
    } else {
      newVisible.add(fieldName)
    }
    setVisibleFields(newVisible)
  }

  const showAllFields = () => {
    const allFieldNames = allRecords.length > 0 
      ? Object.keys(allRecords[0])
      : availableFields.all_fields
    setVisibleFields(new Set(allFieldNames))
    toast.success(`Showing all ${allFieldNames.length} fields`)
  }

  const showDefaultFields = () => {
    setVisibleFields(new Set(['student_name', 'record_id', 'has_bank_image', 'has_bill_image']))
    toast.success('Reset to default fields')
  }

  const selectFiltered = () => {
    const allFilteredIds = new Set(filteredRecords.map(r => r.record_id))
    setSelectedRecords(allFilteredIds)
    setSelectionMode('filtered')
    toast.success(`✅ Selected ${allFilteredIds.size} filtered records`, {
      duration: 3000,
      style: { borderRadius: '12px', background: '#10B981', color: 'white' }
    })
  }

  const selectAll = () => {
    const allRecordIds = new Set(allRecords.map(r => r.record_id))
    setSelectedRecords(allRecordIds)
    setSelectionMode('all')
    toast.success(`✅ Selected all ${allRecordIds.size} records`, {
      duration: 3000,
      style: { borderRadius: '12px', background: '#10B981', color: 'white' }
    })
  }

  const selectNone = () => {
    setSelectedRecords(new Set())
    setSelectionMode('manual')
    toast.success('Selection cleared')
  }

  const selectRange = (count) => {
    setSelectedRecords(new Set(filteredRecords.slice(0, count).map(r => r.record_id)))
    setSelectionMode('manual')
    toast.success(`Selected first ${count} records`)
  }

  const selectByCondition = (condition) => {
    let selected
    switch (condition) {
      case 'has_bank':
        selected = filteredRecords.filter(r => r.has_bank_image)
        break
      case 'has_bill':
        selected = filteredRecords.filter(r => r.has_bill_image)
        break
      case 'has_both':
        selected = filteredRecords.filter(r => r.has_bank_image && r.has_bill_image)
        break
      case 'missing_bank':
        selected = filteredRecords.filter(r => !r.has_bank_image)
        break
      case 'missing_bill':
        selected = filteredRecords.filter(r => !r.has_bill_image)
        break
      default:
        selected = []
    }
    setSelectedRecords(new Set(selected.map(r => r.record_id)))
    setSelectionMode('manual')
    toast.success(`Selected ${selected.length} records`)
  }

  const toggleRecord = (recordId) => {
    const newSelected = new Set(selectedRecords)
    if (newSelected.has(recordId)) {
      newSelected.delete(recordId)
    } else {
      newSelected.add(recordId)
    }
    setSelectedRecords(newSelected)
    setSelectionMode('manual')
  }

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }))
  }

  // ✅ CLIENT-SIDE FILTERING - Applied to all records
  const filteredRecords = useMemo(() => {
    let filtered = [...allRecords]

    // Apply custom filters
    if (filters.length > 0) {
      filtered = filtered.filter(record => {
        return filters.every(filter => {
          const fieldValue = String(record[filter.field] || '').toLowerCase()
          const filterValue = String(filter.value || '').toLowerCase()
          
          switch (filter.operator) {
            case '==':
              return fieldValue === filterValue
            case '!=':
              return fieldValue !== filterValue
            case 'contains':
              return fieldValue.includes(filterValue)
            case 'not_contains':
              return !fieldValue.includes(filterValue)
            case '>':
              return parseFloat(fieldValue) > parseFloat(filterValue)
            case '<':
              return parseFloat(fieldValue) < parseFloat(filterValue)
            case '>=':
              return parseFloat(fieldValue) >= parseFloat(filterValue)
            case '<=':
              return parseFloat(fieldValue) <= parseFloat(filterValue)
            case 'is_null':
              return !fieldValue || fieldValue === ''
            case 'is_not_null':
              return fieldValue && fieldValue !== ''
            default:
              return true
          }
        })
      })
    }

    // Apply search query
    if (searchQuery) {
      filtered = filtered.filter(record => {
        const searchLower = searchQuery.toLowerCase()
        return Object.values(record).some(value => 
          String(value).toLowerCase().includes(searchLower)
        )
      })
    }

    // Apply sorting
    if (sortConfig.key) {
      filtered.sort((a, b) => {
        const aVal = a[sortConfig.key]
        const bVal = b[sortConfig.key]
        
        if (typeof aVal === 'boolean') {
          return sortConfig.direction === 'asc' 
            ? (aVal === bVal ? 0 : aVal ? -1 : 1)
            : (aVal === bVal ? 0 : aVal ? 1 : -1)
        }
        
        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1
        return 0
      })
    }

    return filtered
  }, [allRecords, filters, searchQuery, sortConfig])

  // Get displayable fields
  const displayableFields = useMemo(() => {
    if (allRecords.length === 0) return []
    return Object.keys(allRecords[0])
  }, [allRecords])

  const totalPages = Math.ceil(filteredRecords.length / recordsPerPage)
  const startIndex = (currentPage - 1) * recordsPerPage
  const endIndex = startIndex + recordsPerPage
  const paginatedRecords = filteredRecords.slice(startIndex, endIndex)

  return (
    <div style={{ maxWidth: '1800px', margin: '0 auto', padding: '24px' }}>
      <Toaster position="top-right" toastOptions={{ duration: 4000 }} />

      <style>{`
        * { box-sizing: border-box; }
        .glass-card {
          background: rgba(255, 255, 255, 0.98);
          backdrop-filter: blur(40px);
          border-radius: 24px;
          border: 1px solid rgba(139, 92, 246, 0.1);
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.05);
          transition: all 0.3s ease;
        }
        .input-modern, .select-modern {
          background: #F8FAFC;
          border: 2px solid #E2E8F0;
          border-radius: 12px;
          padding: 14px 18px;
          font-size: 15px;
          font-weight: 500;
          transition: all 0.3s ease;
          width: 100%;
          color: #1E293B;
        }
        .input-modern:focus, .select-modern:focus {
          outline: none;
          border-color: #8B5CF6;
          background: white;
          box-shadow: 0 0 0 4px rgba(139, 92, 246, 0.1);
        }
        .btn-primary {
          background: linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%);
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
          transition: all 0.3s ease;
          box-shadow: 0 8px 20px rgba(139, 92, 246, 0.3);
        }
        .btn-primary:hover:not(:disabled) {
          transform: translateY(-3px);
          box-shadow: 0 12px 32px rgba(139, 92, 246, 0.4);
        }
        .btn-primary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
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
          transition: all 0.3s ease;
        }
        .btn-secondary:hover {
          border-color: #8B5CF6;
          background: #F5F3FF;
          color: #7C3AED;
          transform: translateY(-2px);
        }
        .stat-card {
          background: linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%);
          color: white;
          padding: 24px;
          border-radius: 16px;
          box-shadow: 0 12px 32px rgba(139, 92, 246, 0.3);
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
          position: sticky;
          top: 0;
          z-index: 10;
          cursor: pointer;
          user-select: none;
        }
        .table-modern th:hover {
          background: linear-gradient(135deg, #334155 0%, #475569 100%);
        }
        .table-modern th:first-child { border-top-left-radius: 12px; }
        .table-modern th:last-child { border-top-right-radius: 12px; }
        .table-modern td {
          padding: 18px 20px;
          border-bottom: 1px solid #F1F5F9;
          color: #1E293B;
          font-size: 14px;
          font-weight: 500;
        }
        .table-modern tbody tr {
          transition: all 0.2s ease;
          cursor: pointer;
        }
        .table-modern tbody tr:hover {
          background: linear-gradient(90deg, #F8F9FF 0%, #F5F3FF 100%);
        }
        .table-modern tbody tr.selected {
          background: linear-gradient(90deg, #EDE9FE 0%, #DDD6FE 100%);
          border-left: 4px solid #8B5CF6;
        }
        .badge-modern {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 14px;
          border-radius: 10px;
          font-size: 12px;
          font-weight: 600;
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
        .filter-chip {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          background: linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%);
          color: white;
          border-radius: 20px;
          font-size: 13px;
          font-weight: 600;
          box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
        }
        .filter-chip button {
          background: rgba(255, 255, 255, 0.2);
          border: none;
          border-radius: 50%;
          width: 20px;
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .filter-chip button:hover { background: rgba(255, 255, 255, 0.3); }
        .spinning { animation: spin 1s linear infinite; }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .step-number {
          width: 40px;
          height: 40px;
          border-radius: 12px;
          background: linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 18px;
          box-shadow: 0 6px 16px rgba(139, 92, 246, 0.4);
        }
        .field-selector-dropdown {
          position: absolute;
          top: 100%;
          right: 0;
          margin-top: 8px;
          background: white;
          border: 2px solid #E2E8F0;
          border-radius: 12px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
          padding: 16px;
          z-index: 1000;
          min-width: 300px;
          max-height: 400px;
          overflow-y: auto;
        }
        .field-checkbox {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 12px;
          border-radius: 8px;
          transition: all 0.2s ease;
          cursor: pointer;
        }
        .field-checkbox:hover {
          background: #F5F3FF;
        }
        .field-checkbox input[type="checkbox"] {
          width: 18px;
          height: 18px;
          cursor: pointer;
          accent-color: #8B5CF6;
        }
      `}</style>

      <AnimatePresence mode="wait">
        {!activeJob ? (
          <motion.div key="config" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="glass-card" style={{ padding: '40px', marginBottom: '32px' }}>
              {/* Step 1: Configure Source */}
              <div style={{ marginBottom: '40px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
                  <div className="step-number">1</div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: '#1E293B' }}>
                      Configure Source
                    </h3>
                    <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#64748B' }}>
                      Connect to your Zoho Creator report
                    </p>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 240px', gap: '20px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '10px', fontSize: '14px', fontWeight: 600, color: '#475569' }}>
                      App Link Name
                    </label>
                    <input
                      type="text"
                      className="input-modern"
                      value={config.app_link_name}
                      onChange={(e) => setConfig({ ...config, app_link_name: e.target.value })}
                      placeholder="teameverest/app-name"
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '10px', fontSize: '14px', fontWeight: 600, color: '#475569' }}>
                      Report Link Name
                    </label>
                    <input
                      type="text"
                      className="input-modern"
                      value={config.report_link_name}
                      onChange={(e) => setConfig({ ...config, report_link_name: e.target.value })}
                      placeholder="Report_Name"
                    />
                  </div>

                  <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                    <button className="btn-primary" onClick={fetchFields} disabled={isLoadingFields} style={{ width: '100%', justifyContent: 'center' }}>
                      {isLoadingFields ? <><Loader2 size={18} className="spinning" /> Loading...</> : <><List size={18} /> Fetch Fields</>}
                    </button>
                  </div>
                </div>

                {availableFields.all_fields.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{
                      marginTop: '20px',
                      padding: '16px 20px',
                      background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                      borderRadius: '12px',
                      color: 'white',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px'
                    }}
                  >
                    <CheckCircle2 size={20} />
                    Loaded {availableFields.all_fields.length} fields
                  </motion.div>
                )}
              </div>

              {/* Step 2: Select Extract Fields */}
              {availableFields.all_fields.length > 0 && (
                <div style={{ marginBottom: '40px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
                    <div className="step-number">2</div>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: '#1E293B' }}>
                        Select Extract Fields
                      </h3>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '10px', fontSize: '14px', fontWeight: 600, color: '#475569' }}>
                        Bank Passbook Field
                      </label>
                      <select className="select-modern" value={config.bank_field_name} onChange={(e) => setConfig({ ...config, bank_field_name: e.target.value })}>
                        <option value="">-- None --</option>
                        {availableFields.all_fields.map(field => <option key={field} value={field}>{field}</option>)}
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', marginBottom: '10px', fontSize: '14px', fontWeight: 600, color: '#475569' }}>
                        Bill/Receipt Field
                      </label>
                      <select className="select-modern" value={config.bill_field_name} onChange={(e) => setConfig({ ...config, bill_field_name: e.target.value })}>
                        <option value="">-- None --</option>
                        {availableFields.all_fields.map(field => <option key={field} value={field}>{field}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Load Records Button */}
              <div style={{
                display: 'flex',
                gap: '16px',
                alignItems: 'center',
                padding: '24px',
                background: 'linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 100%)',
                borderRadius: '16px',
                border: '2px dashed #CBD5E1'
              }}>
                <Database size={32} color="#8B5CF6" />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: '#1E293B' }}>Ready to load records</div>
                  <div style={{ fontSize: '13px', color: '#64748B', marginTop: '4px' }}>
                    ✅ Fetches ALL records (no server-side filters)
                  </div>
                </div>
                <button
                  className="btn-primary"
                  onClick={loadRecords}
                  disabled={isLoadingRecords || (!config.bank_field_name && !config.bill_field_name)}
                  style={{ fontSize: '16px', padding: '16px 32px' }}
                >
                  {isLoadingRecords ? <><Loader2 size={20} className="spinning" /> Loading...</> : <><Zap size={20} /> Load All Records</>}
                </button>
              </div>
            </motion.div>

            {/* Records Table */}
            {allRecords.length > 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                {/* ✅ NEW: Client-Side Filter Banner */}
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{
                    marginBottom: '20px',
                    padding: '20px 24px',
                    background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
                    borderRadius: '12px',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px'
                  }}
                >
                  <Sparkles size={24} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '18px', fontWeight: 700, marginBottom: '4px' }}>
                      ✅ Client-Side Filtering Active
                    </div>
                    <div style={{ fontSize: '14px', opacity: 0.9 }}>
                      All {allRecords.length} records loaded • Filters apply instantly in browser
                      {(filters.length > 0 || searchQuery) && ` • Showing ${filteredRecords.length} filtered`}
                    </div>
                  </div>
                </motion.div>

                {/* Stats */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '24px' }}>
                  <div className="stat-card">
                    <div style={{ fontSize: '13px', opacity: 0.9, marginBottom: '8px' }}>LOADED RECORDS</div>
                    <div style={{ fontSize: '40px', fontWeight: 800 }}>{allRecords.length}</div>
                  </div>
                  <div className="stat-card">
                    <div style={{ fontSize: '13px', opacity: 0.9, marginBottom: '8px' }}>AFTER FILTER</div>
                    <div style={{ fontSize: '40px', fontWeight: 800 }}>{filteredRecords.length}</div>
                  </div>
                  <div className="stat-card">
                    <div style={{ fontSize: '13px', opacity: 0.9, marginBottom: '8px' }}>SELECTED</div>
                    <div style={{ fontSize: '40px', fontWeight: 800 }}>{selectedRecords.size}</div>
                  </div>
                  <div className="stat-card">
                    <div style={{ fontSize: '13px', opacity: 0.9, marginBottom: '8px' }}>EST. COST</div>
                    <div style={{ fontSize: '40px', fontWeight: 800 }}>${(selectedRecords.size * 0.003).toFixed(2)}</div>
                  </div>
                </div>

                {/* Toolbar */}
                <div className="glass-card" style={{ padding: '20px', marginBottom: '20px' }}>
                  <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <Search size={20} color="#8B5CF6" />
                      <input 
                        type="text" 
                        className="input-modern" 
                        placeholder="Search all fields..." 
                        value={searchQuery} 
                        onChange={(e) => setSearchQuery(e.target.value)} 
                      />
                    </div>
                    
                    {/* ✅ NEW: Field Selector Button */}
                    <div style={{ position: 'relative' }}>
                      <button 
                        className="btn-secondary" 
                        onClick={() => setShowFieldSelector(!showFieldSelector)}
                        style={{ padding: '14px 24px' }}
                      >
                        <Columns size={18} /> 
                        Columns ({visibleFields.size})
                      </button>
                      
                      {showFieldSelector && (
                        <div className="field-selector-dropdown">
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', paddingBottom: '12px', borderBottom: '2px solid #E2E8F0' }}>
                            <span style={{ fontSize: '14px', fontWeight: 700, color: '#1E293B' }}>
                              Select Columns
                            </span>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button 
                                onClick={showAllFields}
                                style={{ 
                                  padding: '6px 12px', 
                                  fontSize: '12px', 
                                  background: '#8B5CF6', 
                                  color: 'white', 
                                  border: 'none', 
                                  borderRadius: '6px',
                                  cursor: 'pointer',
                                  fontWeight: 600
                                }}
                              >
                                All
                              </button>
                              <button 
                                onClick={showDefaultFields}
                                style={{ 
                                  padding: '6px 12px', 
                                  fontSize: '12px', 
                                  background: '#F1F5F9', 
                                  color: '#475569', 
                                  border: 'none', 
                                  borderRadius: '6px',
                                  cursor: 'pointer',
                                  fontWeight: 600
                                }}
                              >
                                Reset
                              </button>
                            </div>
                          </div>
                          
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            {displayableFields.map(field => (
                              <label key={field} className="field-checkbox">
                                <input
                                  type="checkbox"
                                  checked={visibleFields.has(field)}
                                  onChange={() => toggleFieldVisibility(field)}
                                />
                                <span style={{ fontSize: '14px', color: '#1E293B', fontWeight: 500 }}>
                                  {field}
                                </span>
                              </label>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <button className="btn-primary" onClick={startExtraction} disabled={selectedRecords.size === 0}>
                      <Play size={20} /> Process {selectedRecords.size}
                    </button>
                  </div>

                  {/* ✅ NEW: Filters Section */}
                  <div style={{ padding: '16px', background: '#F8FAFC', borderRadius: '12px', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <Filter size={18} color="#8B5CF6" />
                        <span style={{ fontSize: '15px', fontWeight: 700, color: '#1E293B' }}>
                          Client-Side Filters
                        </span>
                        {filters.length > 0 && (
                          <span style={{ 
                            padding: '4px 12px', 
                            background: '#8B5CF6', 
                            color: 'white', 
                            borderRadius: '12px', 
                            fontSize: '12px', 
                            fontWeight: 700 
                          }}>
                            {filters.length} active
                          </span>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        {filters.length > 0 && (
                          <button className="btn-secondary" onClick={clearAllFilters} style={{ padding: '8px 16px', fontSize: '13px' }}>
                            <X size={14} /> Clear
                          </button>
                        )}
                        <button className="btn-primary" onClick={addFilter} style={{ padding: '8px 16px', fontSize: '13px' }}>
                          <Plus size={14} /> Add Filter
                        </button>
                      </div>
                    </div>

                    {filters.length > 0 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {filters.map((filter) => (
                          <div key={filter.id} style={{
                            background: 'white',
                            borderRadius: '12px',
                            padding: '16px',
                            display: 'grid',
                            gridTemplateColumns: '1fr 160px 1fr 44px',
                            gap: '12px',
                            border: '2px solid #E2E8F0'
                          }}>
                            <select 
                              className="select-modern" 
                              value={filter.field} 
                              onChange={(e) => updateFilter(filter.id, 'field', e.target.value)}
                              style={{ padding: '10px 14px' }}
                            >
                              {displayableFields.map(field => (
                                <option key={field} value={field}>{field}</option>
                              ))}
                            </select>

                            <select 
                              className="select-modern" 
                              value={filter.operator} 
                              onChange={(e) => updateFilter(filter.id, 'operator', e.target.value)}
                              style={{ padding: '10px 14px' }}
                            >
                              <option value="==">equals</option>
                              <option value="!=">not equals</option>
                              <option value="contains">contains</option>
                              <option value="not_contains">not contains</option>
                              <option value=">">greater than</option>
                              <option value="<">less than</option>
                              <option value=">=">≥</option>
                              <option value="<=">≤</option>
                              <option value="is_null">is empty</option>
                              <option value="is_not_null">is not empty</option>
                            </select>

                            {!['is_null', 'is_not_null'].includes(filter.operator) && (
                              <input
                                type="text"
                                className="input-modern"
                                value={filter.value}
                                onChange={(e) => updateFilter(filter.id, 'value', e.target.value)}
                                placeholder="Enter value..."
                                style={{ padding: '10px 14px' }}
                              />
                            )}

                            <button
                              onClick={() => removeFilter(filter.id)}
                              style={{
                                background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '10px',
                                width: '44px',
                                height: '44px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer'
                              }}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Selection Actions */}
                  <div style={{ display: 'flex', gap: '12px', padding: '16px', background: '#F8FAFC', borderRadius: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginRight: '12px' }}>
                      <MousePointerClick size={18} color="#8B5CF6" />
                      <span style={{ fontSize: '14px', fontWeight: 600, color: '#475569' }}>Quick Select:</span>
                    </div>

                    <button className="btn-secondary" onClick={selectFiltered} style={{ padding: '8px 16px', fontSize: '13px' }}>
                      <Layers size={14} /> Filtered ({filteredRecords.length})
                    </button>
                    <button className="btn-secondary" onClick={selectAll} style={{ padding: '8px 16px', fontSize: '13px' }}>
                      <CheckSquare size={14} /> All ({allRecords.length})
                    </button>
                    <button className="btn-secondary" onClick={() => selectRange(50)} style={{ padding: '8px 16px', fontSize: '13px' }}>First 50</button>
                    <button className="btn-secondary" onClick={() => selectRange(100)} style={{ padding: '8px 16px', fontSize: '13px' }}>First 100</button>
                    <button className="btn-secondary" onClick={() => selectRange(200)} style={{ padding: '8px 16px', fontSize: '13px' }}>First 200</button>

                    <div style={{ width: '2px', height: '32px', background: '#E2E8F0', margin: '0 8px' }} />

                    <button className="btn-secondary" onClick={() => selectByCondition('has_both')} style={{ padding: '8px 16px', fontSize: '13px' }}>
                      <CheckCircle2 size={14} /> Both Images
                    </button>
                    <button className="btn-secondary" onClick={() => selectByCondition('has_bank')} style={{ padding: '8px 16px', fontSize: '13px' }}>
                      <FileImage size={14} /> Bank Only
                    </button>
                    <button className="btn-secondary" onClick={() => selectByCondition('missing_bank')} style={{ padding: '8px 16px', fontSize: '13px' }}>
                      <MinusCircle size={14} /> Missing Bank
                    </button>

                    <div style={{ width: '2px', height: '32px', background: '#E2E8F0', margin: '0 8px' }} />

                    <button className="btn-secondary" onClick={selectNone} style={{ padding: '8px 16px', fontSize: '13px', borderColor: '#EF4444', color: '#EF4444' }}>
                      <Square size={14} /> Clear
                    </button>

                    <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '13px', color: '#64748B', fontWeight: 600 }}>Per page:</span>
                      <select className="select-modern" value={recordsPerPage} onChange={(e) => { setRecordsPerPage(Number(e.target.value)); setCurrentPage(1) }} style={{ width: '100px', padding: '8px 12px' }}>
                        <option value={25}>25</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                        <option value={200}>200</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Selection Info */}
                {selectedRecords.size > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{
                      marginBottom: '16px',
                      padding: '16px 24px',
                      background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
                      borderRadius: '12px',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px'
                    }}
                  >
                    <Sparkles size={20} />
                    <div style={{ flex: 1 }}>
                      <strong style={{ fontSize: '16px' }}>{selectedRecords.size} records selected</strong>
                      <div style={{ fontSize: '13px', marginTop: '4px', opacity: 0.9 }}>
                        Est. Time: {Math.ceil(selectedRecords.size * 3 / 60)}m • Est. Cost: ${(selectedRecords.size * 0.003).toFixed(2)}
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Table */}
                <div className="glass-card" style={{ overflow: 'hidden' }}>
                  <div style={{ maxHeight: '600px', overflow: 'auto' }}>
                    <table className="table-modern">
                      <thead>
                        <tr>
                          <th style={{ width: '60px', textAlign: 'center' }}>
                            <input
                              type="checkbox"
                              checked={selectedRecords.size === filteredRecords.length && filteredRecords.length > 0}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  selectFiltered()
                                } else {
                                  selectNone()
                                }
                              }}
                              style={{ width: '20px', height: '20px', cursor: 'pointer', accentColor: '#8B5CF6' }}
                            />
                          </th>
                          {Array.from(visibleFields).map(field => (
                            <th key={field} onClick={() => handleSort(field)}>
                              {field.replace(/_/g, ' ')} {sortConfig.key === field && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedRecords.map(record => (
                          <tr 
                            key={record.record_id} 
                            className={selectedRecords.has(record.record_id) ? 'selected' : ''} 
                            onClick={() => toggleRecord(record.record_id)}
                          >
                            <td style={{ textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                              <input 
                                type="checkbox" 
                                checked={selectedRecords.has(record.record_id)} 
                                onChange={() => toggleRecord(record.record_id)} 
                                style={{ width: '20px', height: '20px', cursor: 'pointer', accentColor: '#8B5CF6' }} 
                              />
                            </td>
                            {Array.from(visibleFields).map(field => {
                              const value = record[field]
                              
                              // Special rendering for boolean fields
                              if (typeof value === 'boolean') {
                                return (
                                  <td key={field} style={{ textAlign: 'center' }}>
                                    {value ? (
                                      <span className="badge-modern badge-success">
                                        <CheckCircle2 size={14} /> Yes
                                      </span>
                                    ) : (
                                      <span className="badge-modern badge-warning">
                                        <XCircle size={14} /> No
                                      </span>
                                    )}
                                  </td>
                                )
                              }
                              
                              // Regular text rendering
                              return (
                                <td key={field}>
                                  {String(value || '')}
                                </td>
                              )
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  <div style={{ padding: '20px', borderTop: '2px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <button className="btn-secondary" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>
                      <ChevronLeft size={16} /> Previous
                    </button>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <span style={{ fontSize: '14px', color: '#64748B' }}>
                        Showing {startIndex + 1}-{Math.min(endIndex, filteredRecords.length)} of {filteredRecords.length}
                      </span>
                      <span style={{ fontWeight: 700, color: '#475569' }}>Page {currentPage} of {totalPages}</span>
                    </div>
                    <button className="btn-secondary" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
                      Next <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>
        ) : (
          <motion.div key="processing" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="glass-card" style={{ padding: '48px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '32px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <Activity size={32} color="#8B5CF6" />
                  <div>
                    <h2 style={{ margin: 0, fontSize: '28px', fontWeight: 800 }}>Processing Job</h2>
                    <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#64748B', fontFamily: 'monospace' }}>{activeJob}</p>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <span style={{
                    padding: '12px 24px',
                    borderRadius: '12px',
                    background: jobStatus?.status === 'running' ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)' : 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
                    color: 'white',
                    fontSize: '14px',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    {jobStatus?.status === 'running' && <Loader2 size={16} className="spinning" />}
                    {jobStatus?.status || 'Loading'}
                  </span>
                  {jobStatus?.status === 'completed' && (
                    <button className="btn-secondary" onClick={handleBackToMain}><ArrowLeft size={18} /> Back</button>
                  )}
                </div>
              </div>

              {/* Progress */}
              <div style={{ background: '#F1F5F9', height: '48px', borderRadius: '24px', overflow: 'hidden', marginBottom: '32px' }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${jobStatus?.progress?.progress_percent || 0}%` }}
                  style={{
                    background: 'linear-gradient(90deg, #8B5CF6, #EC4899, #8B5CF6)',
                    backgroundSize: '200% 100%',
                    animation: jobStatus?.status === 'running' ? 'gradient 3s ease infinite' : 'none',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontWeight: 800,
                    fontSize: '18px'
                  }}
                >
                  {(jobStatus?.progress?.progress_percent || 0).toFixed(1)}%
                </motion.div>
              </div>

              {/* Stats */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '20px', marginBottom: '32px' }}>
                {[
                  { label: 'Total', value: jobStatus?.progress?.total_records || 0, color: '#8B5CF6', icon: Database },
                  { label: 'Processed', value: jobStatus?.progress?.processed_records || 0, color: '#3B82F6', icon: Activity },
                  { label: 'Success', value: jobStatus?.progress?.successful_records || 0, color: '#10B981', icon: CheckCircle2 },
                  { label: 'Failed', value: jobStatus?.progress?.failed_records || 0, color: '#EF4444', icon: XCircle },
                  { label: 'Speed', value: processingSpeed > 0 ? `${processingSpeed.toFixed(1)}/min` : '—', color: '#F59E0B', icon: TrendingUp },
                  { label: 'ETA', value: estimatedTimeRemaining ? `${Math.ceil(estimatedTimeRemaining)}m` : '—', color: '#EC4899', icon: Clock }
                ].map((stat, i) => (
                  <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} style={{ background: 'white', padding: '24px', borderRadius: '16px', textAlign: 'center', border: '2px solid #F1F5F9' }}>
                    <stat.icon size={24} color={stat.color} style={{ marginBottom: '8px' }} />
                    <div style={{ fontSize: '36px', fontWeight: 800, color: stat.color }}>{stat.value}</div>
                    <div style={{ fontSize: '12px', color: '#64748B', fontWeight: 600, textTransform: 'uppercase' }}>{stat.label}</div>
                  </motion.div>
                ))}
              </div>

              {/* Cost */}
              <div style={{ background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', padding: '24px 32px', borderRadius: '16px', display: 'flex', justifyContent: 'space-between', marginBottom: '32px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <DollarSign size={28} color="white" />
                  <span style={{ fontSize: '18px', fontWeight: 600, color: 'white' }}>Total Cost</span>
                </div>
                <span style={{ fontSize: '36px', fontWeight: 800, color: 'white' }}>${(jobStatus?.cost?.total_cost_usd || 0).toFixed(4)}</span>
              </div>

              {/* Results */}
              {jobResults.length > 0 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <BarChart3 size={24} color="#8B5CF6" /> Recent Extractions
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                    {jobResults.slice(0, 6).map((result, idx) => (
                      <div key={idx} style={{ background: 'white', borderRadius: '16px', padding: '20px', border: '2px solid #F1F5F9' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                          <div>
                            <div style={{ fontSize: '16px', fontWeight: 700 }}>{result.student_name || 'Unknown'}</div>
                            <div style={{ fontSize: '12px', color: '#64748B', fontFamily: 'monospace' }}>{result.record_id}</div>
                          </div>
                          <span style={{
                            padding: '6px 12px',
                            borderRadius: '8px',
                            fontSize: '11px',
                            fontWeight: 700,
                            background: result.status === 'success' ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)' : 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
                            color: 'white'
                          }}>{result.status}</span>
                        </div>
                        <div style={{ display: 'flex', gap: '12px', fontSize: '13px', color: '#64748B' }}>
                          <span>{result.bank_image_supabase ? '✓' : '✗'} Bank</span>
                          <span>{result.bill_image_supabase?.length > 0 ? `✓ ${result.bill_image_supabase.length} Bill(s)` : '✗ Bill'}</span>
                          <span style={{ marginLeft: 'auto', color: '#8B5CF6', fontWeight: 600 }}>${(result.cost_usd || 0).toFixed(4)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {jobStatus?.status === 'completed' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '32px' }}>
                  <button className="btn-secondary" onClick={handleBackToMain} style={{ padding: '18px', justifyContent: 'center' }}>
                    <ArrowLeft size={20} /> Back
                  </button>
                  <button className="btn-primary" onClick={() => { setActiveJob(null); setJobStatus(null); setRecords([]); setSelectedRecords(new Set()) }} style={{ padding: '18px', justifyContent: 'center' }}>
                    <RefreshCw size={20} /> New Extraction
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}