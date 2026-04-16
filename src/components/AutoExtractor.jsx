import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import toast, { Toaster } from 'react-hot-toast'
import {
  Play, CheckCircle2, XCircle, Activity, RefreshCw, Loader2, Search,
  ChevronLeft, ChevronRight, List, Plus, Trash2, Database, Zap, AlertCircle,
  TrendingUp, Clock, DollarSign, Sparkles, Filter, ArrowLeft, FileText,
  FileImage, BarChart3, X, SlidersHorizontal, MinusCircle, CheckSquare,
  Square, MousePointerClick, Layers, Eye, EyeOff, Columns, Settings
} from 'lucide-react'
import ZohoConfigModal from './ZohoConfigModal'

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

  // ✅ NEW: Selected fields for loading
  const [selectedFieldsForLoading, setSelectedFieldsForLoading] = useState(new Set())
  const [showFieldSelector, setShowFieldSelector] = useState(false)
  const [isLoadingFieldsList, setIsLoadingFieldsList] = useState(false)

  const [filters, setFilters] = useState([])
  const [allRecords, setAllRecords] = useState([])
  const [isLoadingRecords, setIsLoadingRecords] = useState(false)
  const [selectedRecords, setSelectedRecords] = useState(new Set())
  const [totalRecordsAvailable, setTotalRecordsAvailable] = useState(0)

  const [visibleFields, setVisibleFields] = useState(new Set(['student_name', 'record_id', 'has_bank_image', 'has_bill_image']))
  const [showFieldColumnSelector, setShowFieldColumnSelector] = useState(false)

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
  const [configuredFields, setConfiguredFields] = useState({
    hasBankField: false,
    hasBillField: false
  })

  // ✅ NEW: Push Modal State
  const [showPushModal, setShowPushModal] = useState(false)
  const [isPushing, setIsPushing] = useState(false)
  const [pushStats, setPushStats] = useState(null)

  // Real Zoho push form
  const [showZohoModal, setShowZohoModal] = useState(false)
  const [readyToPushIds, setReadyToPushIds] = useState([])

  // ✅ URL Parser State
  const [zohoUrl, setZohoUrl] = useState('')
  const [urlParseResult, setUrlParseResult] = useState(null)
  const [urlParseError, setUrlParseError] = useState('')
  const [urlParseSuccess, setUrlParseSuccess] = useState(false)

  // ✅ NEW: No Records Modal State
  const [showNoRecordsModal, setShowNoRecordsModal] = useState(false)
  const [noRecordsMessage, setNoRecordsMessage] = useState('')

  // ✅ URL Parser
  const parseZohoUrl = (url) => {
    setUrlParseError('')
    setUrlParseResult(null)
    setUrlParseSuccess(false)

    if (!url || url.trim() === '') {
      setUrlParseError('Please enter a Zoho Creator URL')
      return
    }

    try {
      // Accepts:
      // https://creatorapp.zoho.com/teameverest/iatc-scholarship#Report:Scholar_Fee_Request_OCR_View
      // https://creatorapp.zoho.in/teameverest/iatc-scholarship#Report:Scholar_Fee_Request_OCR_View
      const trimmed = url.trim()

      // Must be a Zoho Creator URL
      if (!trimmed.includes('creatorapp.zoho')) {
        setUrlParseError('Not a valid Zoho Creator URL (must contain creatorapp.zoho.com)')
        return
      }

      // Extract path after domain
      const withoutProtocol = trimmed.replace(/^https?:\/\//, '')
      const afterDomain = withoutProtocol.replace(/^creatorapp\.zoho\.(com|in)\//, '')

      // Split on # to get hash
      const [pathPart, hashPart] = afterDomain.split('#')

      // app_link_name is the path part (e.g. teameverest/iatc-scholarship)
      const appLinkName = pathPart ? pathPart.replace(/\/$/, '') : ''

      // report from hash: Report:Scholar_Fee_Request_OCR_View
      let reportLinkName = ''
      if (hashPart) {
        const reportMatch = hashPart.match(/Report:([^&?]+)/)
        if (reportMatch) {
          reportLinkName = reportMatch[1]
        }
      }

      if (!appLinkName) {
        setUrlParseError('Could not extract App Link Name from URL')
        return
      }

      if (!reportLinkName) {
        setUrlParseError('Could not extract Report Name — make sure URL contains #Report:ReportName')
        return
      }

      // Parse domain TLD
      const domainMatch = withoutProtocol.match(/^(creatorapp\.zoho\.(com|in))/)
      const domain = domainMatch ? domainMatch[1] : 'creatorapp.zoho.com'
      const [org, appName] = appLinkName.split('/')

      const result = {
        domain,
        org,
        appName,
        appLinkName,
        reportLinkName,
        originalUrl: trimmed
      }

      setUrlParseResult(result)
      setUrlParseSuccess(true)

      // Auto-fill the config
      setConfig(prev => ({
        ...prev,
        app_link_name: appLinkName,
        report_link_name: reportLinkName
      }))

      // ✅ Auto-trigger fetch fields after a short delay so state settles
      setTimeout(() => {
        fetchFieldsWithParams(appLinkName, reportLinkName)
      }, 100)

    } catch (err) {
      setUrlParseError(`Parse error: ${err.message}`)
    }
  }

  // ✅ Fetch fields with explicit params (used by URL parser auto-trigger)
  const fetchFieldsWithParams = async (appLink, reportLink) => {
    if (!appLink || !reportLink) return
    setIsLoadingFields(true)
    try {
      const formData = new FormData()
      formData.append('app_link_name', appLink)
      formData.append('report_link_name', reportLink)
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
        const defaultSelected = new Set(['student_name', 'record_id', 'Name', 'Student_Name', 'Scholar_Name', 'Scholar_ID', 'Tracking_ID'])
        setSelectedFieldsForLoading(defaultSelected)
        toast.success(`✅ Loaded ${data.total_fields} fields`, {
          icon: '🎯',
          style: { borderRadius: '12px', background: '#10B981', color: 'white' }
        })
      } else {
        if (data.error && (data.error.includes('No records') || data.error.includes('9220'))) {
          setNoRecordsMessage(data.error)
          setShowNoRecordsModal(true)
        } else {
          toast.error(`Error: ${data.error}`)
        }
      }
    } catch (error) {
      toast.error(`Failed to fetch fields: ${error.message}`)
    } finally {
      setIsLoadingFields(false)
    }
  }

  // ✅ NEW: Fetch available fields list
  const fetchAvailableFieldsList = async () => {
    if (!config.app_link_name || !config.report_link_name) {
      toast.error('Please enter App Link Name and Report Link Name first')
      return
    }

    setIsLoadingFieldsList(true)
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

        // Auto-select basic fields
        const defaultSelected = new Set(['student_name', 'record_id', 'Name', 'Student_Name', 'Scholar_Name', 'Scholar_ID', 'Tracking_ID'])
        setSelectedFieldsForLoading(defaultSelected)

        toast.success(`✅ Loaded ${data.total_fields} fields available`, {
          icon: '🎯',
          style: { borderRadius: '12px', background: '#10B981', color: 'white' }
        })
      } else {
        if (data.error && (data.error.includes('No records') || data.error.includes('9220'))) {
          setNoRecordsMessage(data.error)
          setShowNoRecordsModal(true)
        } else {
          toast.error(`Error: ${data.error}`)
        }
      }
    } catch (error) {
      toast.error(`Failed to fetch fields: ${error.message}`)
    } finally {
      setIsLoadingFieldsList(false)
    }
  }

  const flattenOCRData = (records, config) => {
    if (records.length === 0) return records

    const flattenedRecords = records.map(record => {
      const flattened = { ...record }

      if (config.bank_field_name && record[config.bank_field_name]) {
        const bankData = record[config.bank_field_name]
        if (typeof bankData === 'object') {
          flattened.bank_account_number = bankData.account_number || bankData.accountNumber || ''
          flattened.bank_ifsc = bankData.ifsc_code || bankData.ifscCode || bankData.ifsc || ''
          flattened.bank_name = bankData.bank_name || bankData.bankName || ''
          flattened.bank_holder_name = bankData.account_holder || bankData.accountHolder || ''
          flattened.bank_confidence = bankData.confidence || ''
        } else if (typeof bankData === 'string') {
          flattened.bank_raw_text = bankData
        }
      }

      if (config.bill_field_name && record[config.bill_field_name]) {
        const billData = record[config.bill_field_name]
        if (typeof billData === 'object') {
          flattened.bill_amount = billData.amount || billData.bill_amount || ''
          flattened.bill_date = billData.date || billData.bill_date || ''
          flattened.bill_provider = billData.provider || billData.provider_name || ''
          flattened.bill_reference = billData.reference_number || billData.referenceNumber || ''
          flattened.bill_confidence = billData.confidence || ''
        } else if (typeof billData === 'string') {
          flattened.bill_raw_text = billData
        }
      }

      return flattened
    })

    return flattenedRecords
  }

  const getCategorizedFields = () => {
    const categories = {
      'Basic Info': ['student_name', 'record_id', 'email', 'phone', 'name']
    }

    if (configuredFields.hasBankField) {
      categories['Bank OCR'] = ['bank_account_number', 'bank_ifsc', 'bank_name', 'bank_holder_name', 'bank_confidence', 'bank_raw_text']
    }

    if (configuredFields.hasBillField) {
      categories['Bill OCR'] = ['bill_amount', 'bill_date', 'bill_provider', 'bill_reference', 'bill_confidence', 'bill_raw_text']
    }

    categories['Image Flags'] = ['has_bank_image', 'has_bill_image']

    return categories
  }

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
        if (data.error && (data.error.includes('No records') || data.error.includes('9220'))) {
          setNoRecordsMessage(data.error)
          setShowNoRecordsModal(true)
        } else {
          toast.error(`Error: ${data.error}`)
        }
      }
    } catch (error) {
      toast.error(`Failed to fetch fields: ${error.message}`)
    } finally {
      setIsLoadingFields(false)
    }
  }

  // ✅ UPDATED: Load records with selected fields
  const loadRecords = async () => {
    setIsLoadingRecords(true)
    try {
      const formData = new FormData()
      formData.append('app_link_name', config.app_link_name)
      formData.append('report_link_name', config.report_link_name)
      if (config.bank_field_name) formData.append('bank_field_name', config.bank_field_name)
      if (config.bill_field_name) formData.append('bill_field_name', config.bill_field_name)

      // ✅ NEW: Pass exclude parameter
      formData.append('exclude_already_extracted', 'true')  // Always exclude by default
      formData.append('include_failed_retries', 'false')     // Don't retry failed by default

      if (selectedFieldsForLoading.size > 0) {
        formData.append('selected_fields', JSON.stringify([...selectedFieldsForLoading]))
      }

      formData.append('store_images', 'false')
      formData.append('fetch_all', 'true')
      formData.append('max_records_limit', '5000')

      const response = await fetch(`${API_BASE_URL}/ocr/auto-extract/preview`, {
        method: 'POST',
        body: formData
      })

      const data = await response.json()

      if (data.success) {
        let loadedRecords = data.sample_records || []

        setConfiguredFields({
          hasBankField: !!config.bank_field_name,
          hasBillField: !!config.bill_field_name
        })

        loadedRecords = flattenOCRData(loadedRecords, config)

        setAllRecords(loadedRecords)
        setTotalRecordsAvailable(data.total_records || loadedRecords.length)
        setSelectedRecords(new Set())
        setCurrentPage(1)

        if (loadedRecords.length > 0) {
          const firstRecord = loadedRecords[0]
          let detectedFields = Object.keys(firstRecord).filter(key =>
            !['has_bank_image', 'has_bill_image'].includes(key)
          )

          if (!config.bank_field_name) {
            detectedFields = detectedFields.filter(k => !k.startsWith('bank_'))
          }
          if (!config.bill_field_name) {
            detectedFields = detectedFields.filter(k => !k.startsWith('bill_'))
          }

          if (availableFields.all_fields.length === 0) {
            setAvailableFields(prev => ({
              ...prev,
              all_fields: detectedFields
            }))
          }

          const defaultVisible = new Set(['student_name', 'record_id'])
          if (config.bank_field_name) defaultVisible.add('has_bank_image')
          if (config.bill_field_name) defaultVisible.add('has_bill_image')

          // ✅ NEW: Add selected fields to visible fields
          selectedFieldsForLoading.forEach(field => {
            if (detectedFields.includes(field)) {
              defaultVisible.add(field)
            }
          })

          setVisibleFields(defaultVisible)
        }

        if (loadedRecords.length === 0) {
          setNoRecordsMessage(data.message || 'No records found matching your criteria in this Zoho report.')
          setShowNoRecordsModal(true)
        }
        
        toast.success(
          `✅ Loaded ${loadedRecords.length} records` +
          (data.already_extracted_count > 0 ? `\n(Excluded ${data.already_extracted_count} already processed)` : ''),
          {
            icon: '⚡',
            style: { borderRadius: '12px', background: '#F97316', color: 'white' },
            duration: 4000
          }
        )
      } else {
        if (data.error && (data.error.includes('No records') || data.error.includes('9220'))) {
          setNoRecordsMessage(data.error)
          setShowNoRecordsModal(true)
        } else {
          toast.error(`Error: ${data.error}`)
        }
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
            setTimeout(() => {
              setShowPushModal(true)
            }, 500)
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
    setShowPushModal(false)
    setPushStats(null)
    loadRecords()
  }

  const handlePushRecords = async () => {
    setIsPushing(true)
    setPushStats(null)
    try {
      const response = await fetch(`${API_BASE_URL}/ocr/auto-extract/results/${activeJob}?limit=5000`)
      const data = await response.json()

      const successIds = (data.results || []).filter(r => r.status === 'success' && !r.push_status).map(r => r.id)

      if (successIds.length === 0) {
        toast.error("No successful records available to push!")
        setIsPushing(false)
        setShowPushModal(false)
        return
      }

      setReadyToPushIds(successIds)
      setShowPushModal(false)
      setShowZohoModal(true)

    } catch (err) {
      toast.error(err.message)
    } finally {
      setIsPushing(false)
    }
  }

  const handleZohoPushSuccess = (details) => {
    setShowZohoModal(false)
    setPushStats(details)
    setShowPushModal(true) // show the success tiles
  }

  const addFilter = () => {
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
    const defaultFields = new Set(['student_name', 'record_id'])
    if (config.bank_field_name) defaultFields.add('has_bank_image')
    if (config.bill_field_name) defaultFields.add('has_bill_image')
    setVisibleFields(defaultFields)
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

  const filteredRecords = useMemo(() => {
    let filtered = [...allRecords]

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

    if (searchQuery) {
      filtered = filtered.filter(record => {
        const searchLower = searchQuery.toLowerCase()
        return Object.values(record).some(value =>
          String(value).toLowerCase().includes(searchLower)
        )
      })
    }

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

  const displayableFields = useMemo(() => {
    if (allRecords.length === 0) return []
    let fields = Object.keys(allRecords[0])

    if (!config.bank_field_name) {
      fields = fields.filter(f => !f.startsWith('bank_'))
    }
    if (!config.bill_field_name) {
      fields = fields.filter(f => !f.startsWith('bill_'))
    }

    return fields
  }, [allRecords, config.bank_field_name, config.bill_field_name])

  const totalPages = Math.ceil(filteredRecords.length / recordsPerPage)
  const startIndex = (currentPage - 1) * recordsPerPage
  const endIndex = startIndex + recordsPerPage
  const paginatedRecords = filteredRecords.slice(startIndex, endIndex)

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <Toaster position="top-right" toastOptions={{ duration: 4000 }} />

      <style>{`
        * { box-sizing: border-box; }
        .glass-card {
          background: rgba(255, 255, 255, 0.98);
          backdrop-filter: blur(40px);
          border-radius: 24px;
          border: 1px solid rgba(249, 115, 22, 0.1);
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
          border-color: #F97316;
          background: white;
          box-shadow: 0 0 0 4px rgba(249, 115, 22, 0.1);
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
          transition: all 0.3s ease;
          box-shadow: 0 8px 20px rgba(249, 115, 22, 0.3);
        }
        .btn-primary:hover:not(:disabled) {
          transform: translateY(-3px);
          box-shadow: 0 12px 32px rgba(249, 115, 22, 0.4);
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
          border-color: #F97316;
          background: #F5F3FF;
          color: #EA580C;
          transform: translateY(-2px);
        }
        .stat-card {
          background: linear-gradient(135deg, #F97316 0%, #EA580C 100%);
          color: white;
          padding: 24px;
          border-radius: 16px;
          box-shadow: 0 12px 32px rgba(249, 115, 22, 0.3);
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

        /* ✅ URL Parser Styles */
        .url-input-wrapper {
          position: relative;
          width: 100%;
        }
        .url-input {
          width: 100%;
          border: 2px solid #E2E8F0;
          border-radius: 16px;
          padding: 18px 160px 18px 56px;
          font-size: 14px;
          font-family: 'JetBrains Mono', 'Fira Code', monospace;
          font-weight: 500;
          background: #F8FAFC;
          color: #1E293B;
          transition: all 0.35s cubic-bezier(0.4,0,0.2,1);
          box-sizing: border-box;
        }
        .url-input::placeholder { color: #94A3B8; }
        .url-input:focus {
          outline: none;
          border-color: #6366F1;
          background: white;
          box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.12), 0 8px 32px rgba(99,102,241,0.08);
        }
        .url-input.success {
          border-color: #10B981;
          background: white;
          box-shadow: 0 0 0 4px rgba(16,185,129,0.1);
        }
        .url-input.error {
          border-color: #EF4444;
          background: white;
          box-shadow: 0 0 0 4px rgba(239,68,68,0.1);
        }
        .url-icon {
          position: absolute;
          left: 18px;
          top: 50%;
          transform: translateY(-50%);
          pointer-events: none;
        }
        .url-parse-btn {
          position: absolute;
          right: 8px;
          top: 50%;
          transform: translateY(-50%);
          background: linear-gradient(135deg, #F97316);
          color: white;
          border: none;
          border-radius: 10px;
          padding: 10px 20px;
          font-weight: 700;
          font-size: 13px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: all 0.3s cubic-bezier(0.4,0,0.2,1);
          box-shadow: 0 4px 14px rgba(99,102,241,0.35);
          white-space: nowrap;
        }
        .url-parse-btn:hover {
          transform: translateY(calc(-50% - 2px));
          box-shadow: 0 8px 24px rgba(99,102,241,0.45);
        }
        .url-parse-btn:active {
          transform: translateY(calc(-50% + 1px));
        }
        .url-breakdown {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 4px;
          padding: 16px 20px;
          background: linear-gradient(135deg, #F0FDF4, #ECFDF5);
          border: 1.5px solid #6EE7B7;
          border-radius: 14px;
          margin-top: 12px;
          font-family: 'JetBrains Mono', 'Fira Code', monospace;
          font-size: 13px;
          font-weight: 500;
          color: #064E3B;
          animation: slideDownFade 0.4s cubic-bezier(0.4,0,0.2,1);
        }
        @keyframes slideDownFade {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .url-seg-dim { color: #94A3B8; }
        .url-seg-org {
          background: linear-gradient(135deg, #DBEAFE, #EFF6FF);
          color: #1D4ED8;
          border: 1px solid #93C5FD;
          padding: 3px 10px;
          border-radius: 6px;
          font-weight: 700;
        }
        .url-seg-app {
          background: linear-gradient(135deg, #FEF3C7, #FFFBEB);
          color: #92400E;
          border: 1px solid #FCD34D;
          padding: 3px 10px;
          border-radius: 6px;
          font-weight: 700;
        }
        .url-seg-report {
          background: linear-gradient(135deg, #DCFCE7, #F0FDF4);
          color: #065F46;
          border: 1px solid #6EE7B7;
          padding: 3px 10px;
          border-radius: 6px;
          font-weight: 700;
        }
        .url-seg-hash {
          background: linear-gradient(135deg, #EDE9FE, #F5F3FF);
          color: #6D28D9;
          border: 1px solid #C4B5FD;
          padding: 3px 10px;
          border-radius: 6px;
          font-weight: 700;
        }
        .url-breakdown-label {
          font-size: 10px;
          font-weight: 700;
          color: #059669;
          background: rgba(16, 185, 129, 0.1);
          padding: 2px 8px;
          border-radius: 6px;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-left: 4px;
        }
        .parsed-fields-preview {
          display: flex;
          flex-direction: row;
          gap: 12px;
          margin-top: 12px;
          animation: slideDownFade 0.5s cubic-bezier(0.4,0,0.2,1) 0.1s both;
        }
        .parsed-field-chip {
          flex: 1;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 16px;
          border-radius: 12px;
          border: 1.5px solid;
        }
        .parsed-field-chip.app {
          background: linear-gradient(135deg, #EFF6FF, #DBEAFE);
          border-color: #93C5FD;
          color: #1E40AF;
        }
        .parsed-field-chip.report {
          background: linear-gradient(135deg, #F0FDF4, #DCFCE7);
          border-color: #6EE7B7;
          color: #065F46;
        }
        .url-error-msg {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: 10px;
          padding: 12px 16px;
          background: linear-gradient(135deg, #FEF2F2, #FFF1F2);
          border: 1.5px solid #FCA5A5;
          border-radius: 12px;
          color: #991B1B;
          font-size: 13px;
          font-weight: 500;
          animation: slideDownFade 0.3s ease;
        }
        .shimmer-line {
          display: inline-block;
          background: linear-gradient(90deg, #E2E8F0 25%, #F1F5F9 50%, #E2E8F0 75%);
          background-size: 400% 100%;
          animation: shimmer 1.5s ease-in-out infinite;
          border-radius: 4px;
        }
        @keyframes shimmer {
          0% { background-position: 100% 0; }
          100% { background-position: -100% 0; }
        }
        .divider-with-text {
          display: flex;
          align-items: center;
          gap: 12px;
          margin: 24px 0;
        }
        .divider-with-text::before, .divider-with-text::after {
          content: '';
          flex: 1;
          height: 1px;
          background: linear-gradient(90deg, transparent, #E2E8F0, transparent);
        }
        .divider-with-text span {
          font-size: 12px;
          font-weight: 700;
          color: #94A3B8;
          text-transform: uppercase;
          letter-spacing: 1.5px;
          white-space: nowrap;
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
          background: linear-gradient(90deg, #FFF7ED 0%, #FFEDD5 100%);
        }
        .table-modern tbody tr.selected {
          background: linear-gradient(90deg, #FFEDD5 0%, #FED7AA 100%);
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
          background: linear-gradient(135deg, #F97316 0%, #EA580C 100%);
          color: white;
          border-radius: 20px;
          font-size: 13px;
          font-weight: 600;
          box-shadow: 0 4px 12px rgba(249, 115, 22, 0.3);
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
          min-width: 350px;
          max-height: 500px;
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
          background: #FFF7ED;
        }
        .field-checkbox input[type="checkbox"] {
          width: 18px;
          height: 18px;
          cursor: pointer;
          accent-color: #F97316;
        }
        .category-header {
          font-size: 12px;
          font-weight: 700;
          color: #64748B;
          text-transform: uppercase;
          margin-top: 12px;
          margin-bottom: 8px;
          padding-left: 4px;
          letter-spacing: 0.5px;
        }
        .category-header:first-child {
          margin-top: 0;
        }
        .field-selector-modal {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2000;
        }
        .field-selector-content {
          background: white;
          border-radius: 24px;
          padding: 32px;
          max-width: 600px;
          max-height: 80vh;
          overflow-y: auto;
          box-shadow: 0 25px 50px rgba(0, 0, 0, 0.15);
        }
      `}</style>

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card"
        style={{
          padding: '32px 40px',
          background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.03) 0%, rgba(234, 88, 12, 0.05) 100%)',
          display: 'flex',
          alignItems: 'center',
          gap: '24px',
          borderLeft: '6px solid #F97316',
          marginBottom: '8px'
        }}
      >
        <div style={{
          width: 56, height: 56, borderRadius: 16, background: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 12px 24px rgba(249, 115, 22, 0.25)'
        }}>
          <Zap size={28} color="white" />
        </div>
        <div>
          <h1 style={{ margin: 0, fontSize: '26px', fontWeight: 800, color: '#1E293B', letterSpacing: '-0.5px' }}>
            Auto Extraction Engine
          </h1>
          <p style={{ margin: '6px 0 0 0', fontSize: '15px', color: '#64748B', maxWidth: '600px', lineHeight: 1.5 }}>
            Automate data entry by seamlessly pulling records from Zoho Creator and extracting structured data directly from bill and passbook images using Vision AI.
          </p>
        </div>
      </motion.div>

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
                      Paste a Zoho Creator URL or enter manually
                    </p>
                  </div>
                </div>

                {/* ✅ URL IMPORT BAR */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                  style={{
                    padding: '24px',
                    background: 'linear-gradient(135deg, #ffffffff 0%, #ffffffff 100%)',
                    borderRadius: '20px',
                    border: '2px solid rgba(99, 102, 241, 0.2)',
                    marginBottom: '0px',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                >
                  {/* Background glow */}
                  <div style={{
                    position: 'absolute', top: -40, right: -40, width: 160, height: 160,
                    background: 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)',
                    pointerEvents: 'none'
                  }} />

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: 10,
                      background: 'linear-gradient(135deg, #F97316 )',
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      <Zap size={16} color="white" />
                    </div>
                    <div>
                      <div style={{ fontSize: '15px', fontWeight: 700, color: '#312E81' }}>Smart URL Import</div>
                      <div style={{ fontSize: '12px', color: '#F97316', fontWeight: 500 }}>Paste your Zoho Creator report URL to auto-configure</div>
                    </div>
                    <div style={{
                      marginLeft: 'auto',
                      background: '#F97316',
                      border: '1px solid #F97316 ',
                      borderRadius: '20px',
                      padding: '4px 12px',
                      fontSize: '11px',
                      fontWeight: 700,
                      color: '#fcfcfcff',
                      letterSpacing: '0.5px'
                    }}>NEW</div>
                  </div>

                  {/* URL Input Row */}
                  <div className="url-input-wrapper">
                    <div className="url-icon">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6366F1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="11" cy="11" r="8"/>
                        <path d="m21 21-4.35-4.35"/>
                      </svg>
                    </div>
                    <input
                      type="url"
                      className={`url-input ${urlParseSuccess ? 'success' : ''} ${urlParseError ? 'error' : ''}`}
                      value={zohoUrl}
                      onChange={(e) => {
                        setZohoUrl(e.target.value)
                        setUrlParseError('')
                        setUrlParseResult(null)
                        setUrlParseSuccess(false)
                      }}
                      onKeyDown={(e) => { if (e.key === 'Enter') parseZohoUrl(zohoUrl) }}
                      placeholder="https://creatorapp.zoho.com/teameverest/app-name#Report:Report_Name"
                    />
                    <button
                      className="url-parse-btn"
                      onClick={() => parseZohoUrl(zohoUrl)}
                    >
                      <Sparkles size={14} />
                      Parse URL
                    </button>
                  </div>

                  {/* Error */}
                  <AnimatePresence>
                    {urlParseError && (
                      <motion.div
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        className="url-error-msg"
                      >
                        <XCircle size={16} color="#DC2626" />
                        {urlParseError}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Breakdown */}
                  <AnimatePresence>
                    {urlParseResult && (
                      <motion.div
                        initial={{ opacity: 0, y: -8, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                      >
                        {/* Visual URL breakdown */}
                        <div className="url-breakdown">
                          <span className="url-seg-dim">https://</span>
                          <span className="url-seg-dim">{urlParseResult.domain}/</span>
                          <span className="url-seg-org">{urlParseResult.org}</span>
                          <span className="url-seg-dim">/</span>
                          <span className="url-seg-app">{urlParseResult.appName}</span>
                          <span className="url-seg-dim">#Report:</span>
                          <span className="url-seg-report">{urlParseResult.reportLinkName}</span>
                          <span style={{ marginLeft: 'auto' }}>
                            <CheckCircle2 size={16} color="#059669" />
                          </span>
                        </div>

                        
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>

                {/* Divider */}
                <div className="divider-with-text">
                  <span>or configure manually</span>
                </div>

                {/* Manual Fields */}
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

              {/* ✅ NEW: Step 2 - Select Fields for Filtering */}
              {availableFields.all_fields.length > 0 && (
                <div style={{ marginBottom: '40px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
                    <div className="step-number">2</div>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: '#1E293B' }}>
                        Select Fields for Filtering
                      </h3>
                      <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#64748B' }}>
                        Choose which fields to fetch for advanced filtering
                      </p>
                    </div>
                  </div>

                  <div style={{
                    padding: '20px',
                    background: '#F8FAFC',
                    borderRadius: '12px',
                    border: '2px solid #E2E8F0',
                    display: 'flex',
                    gap: '12px',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <Settings size={20} color="#F97316" />
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: 600, color: '#1E293B' }}>
                          {selectedFieldsForLoading.size} fields selected
                        </div>
                        <div style={{ fontSize: '12px', color: '#64748B' }}>
                          {availableFields.text_fields.length} text fields • {availableFields.file_fields.length} file fields
                        </div>
                      </div>
                    </div>
                    <button
                      className="btn-secondary"
                      onClick={() => setShowFieldSelector(!showFieldSelector)}
                      style={{ padding: '10px 20px' }}
                    >
                      <Settings size={16} /> Customize
                    </button>
                  </div>

                  {/* ✅ NEW: Field Selector Modal */}
                  {showFieldSelector && (
                    <div style={{
                      position: 'fixed',
                      inset: 0,
                      background: 'rgba(0, 0, 0, 0.5)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      zIndex: 2000
                    }} onClick={() => setShowFieldSelector(false)}>
                      <div
                        className="glass-card"
                        style={{
                          padding: '32px',
                          maxWidth: '600px',
                          maxHeight: '80vh',
                          overflow: 'auto',
                          width: '90%'
                        }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                          <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: '#1E293B' }}>
                            Select Fields to Fetch
                          </h3>
                          <button
                            onClick={() => setShowFieldSelector(false)}
                            style={{
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              fontSize: '24px',
                              color: '#64748B'
                            }}
                          >
                            ✕
                          </button>
                        </div>

                        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
                          <button
                            onClick={() => setSelectedFieldsForLoading(new Set(availableFields.all_fields))}
                            style={{
                              padding: '8px 16px',
                              background: '#F97316',
                              color: 'white',
                              border: 'none',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              fontWeight: 600,
                              fontSize: '13px'
                            }}
                          >
                            Select All
                          </button>
                          <button
                            onClick={() => setSelectedFieldsForLoading(new Set())}
                            style={{
                              padding: '8px 16px',
                              background: '#F1F5F9',
                              color: '#475569',
                              border: 'none',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              fontWeight: 600,
                              fontSize: '13px'
                            }}
                          >
                            Clear All
                          </button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                          {/* Text Fields */}
                          <div>
                            <div className="category-header">Text Fields</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                              {availableFields.text_fields.map(field => (
                                <label key={field} className="field-checkbox">
                                  <input
                                    type="checkbox"
                                    checked={selectedFieldsForLoading.has(field)}
                                    onChange={(e) => {
                                      const newSelected = new Set(selectedFieldsForLoading)
                                      if (e.target.checked) {
                                        newSelected.add(field)
                                      } else {
                                        newSelected.delete(field)
                                      }
                                      setSelectedFieldsForLoading(newSelected)
                                    }}
                                  />
                                  <span style={{ fontSize: '14px', color: '#1E293B', fontWeight: 500 }}>
                                    {field.replace(/_/g, ' ')}
                                  </span>
                                </label>
                              ))}
                            </div>
                          </div>

                          {/* File Fields */}
                          <div>
                            <div className="category-header">File Fields</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                              {availableFields.file_fields.map(field => (
                                <label key={field} className="field-checkbox">
                                  <input
                                    type="checkbox"
                                    checked={selectedFieldsForLoading.has(field)}
                                    onChange={(e) => {
                                      const newSelected = new Set(selectedFieldsForLoading)
                                      if (e.target.checked) {
                                        newSelected.add(field)
                                      } else {
                                        newSelected.delete(field)
                                      }
                                      setSelectedFieldsForLoading(newSelected)
                                    }}
                                  />
                                  <span style={{ fontSize: '14px', color: '#1E293B', fontWeight: 500 }}>
                                    {field.replace(/_/g, ' ')} <FileImage size={12} style={{ display: 'inline' }} />
                                  </span>
                                </label>
                              ))}
                            </div>
                          </div>
                        </div>

                        <button
                          className="btn-primary"
                          onClick={() => setShowFieldSelector(false)}
                          style={{ width: '100%', marginTop: '24px', justifyContent: 'center' }}
                        >
                          Done
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Step 3: Select Extract Fields (bank/bill) */}
              {availableFields.all_fields.length > 0 && (
                <div style={{ marginBottom: '40px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
                    <div className="step-number">3</div>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: '#1E293B' }}>
                        Select OCR Fields
                      </h3>
                      <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#64748B' }}>
                        Choose fields to extract with Gemini Vision
                      </p>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '10px', fontSize: '14px', fontWeight: 600, color: '#475569' }}>
                        Bank Passbook Field {config.bank_field_name && <span style={{ color: '#10B981', fontWeight: 700 }}>✓</span>}
                      </label>
                      <select className="select-modern" value={config.bank_field_name} onChange={(e) => setConfig({ ...config, bank_field_name: e.target.value })}>
                        <option value="">-- None (skip bank extraction) --</option>
                        {availableFields.all_fields.map(field => <option key={field} value={field}>{field}</option>)}
                      </select>
                      {config.bank_field_name && (
                        <div style={{ fontSize: '12px', color: '#64748B', marginTop: '8px' }}>
                          ✓ Bank fields will be extracted
                        </div>
                      )}
                    </div>

                    <div>
                      <label style={{ display: 'block', marginBottom: '10px', fontSize: '14px', fontWeight: 600, color: '#475569' }}>
                        Bill/Receipt Field {config.bill_field_name && <span style={{ color: '#10B981', fontWeight: 700 }}>✓</span>}
                      </label>
                      <select className="select-modern" value={config.bill_field_name} onChange={(e) => setConfig({ ...config, bill_field_name: e.target.value })}>
                        <option value="">-- None (skip bill extraction) --</option>
                        {availableFields.all_fields.map(field => <option key={field} value={field}>{field}</option>)}
                      </select>
                      {config.bill_field_name && (
                        <div style={{ fontSize: '12px', color: '#64748B', marginTop: '8px' }}>
                          ✓ Bill fields will be extracted
                        </div>
                      )}
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
                <Database size={32} color="#F97316" />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: '#1E293B' }}>Ready to load records</div>
                  <div style={{ fontSize: '13px', color: '#64748B', marginTop: '4px' }}>
                    ✅ Fetches ALL records • Selected {selectedFieldsForLoading.size} fields for filtering • OCR: {config.bank_field_name ? '✓ Bank' : '✗ Bank'} {config.bill_field_name ? '✓ Bill' : '✗ Bill'}
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

            {/* Records Table Section */}
            {allRecords.length > 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                {/* Client-Side Filter Banner */}
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
                      All {allRecords.length} records loaded • {selectedFieldsForLoading.size} fields available for filtering
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
                      <Search size={20} color="#F97316" />
                      <input
                        type="text"
                        className="input-modern"
                        placeholder="Search all fields..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>

                    {/* Field Column Selector */}
                    <div style={{ position: 'relative' }}>
                      <button
                        className="btn-secondary"
                        onClick={() => setShowFieldColumnSelector(!showFieldColumnSelector)}
                        style={{ padding: '14px 24px' }}
                      >
                        <Columns size={18} />
                        Columns ({visibleFields.size})
                      </button>

                      {showFieldColumnSelector && (
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
                                  background: '#F97316',
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
                                  {field.replace(/_/g, ' ')}
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

                  {/* Filters Section */}
                  <div style={{ padding: '16px', background: '#F8FAFC', borderRadius: '12px', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <Filter size={18} color="#F97316" />
                        <span style={{ fontSize: '15px', fontWeight: 700, color: '#1E293B' }}>
                          Advanced Filters ({selectedFieldsForLoading.size} fields available)
                        </span>
                        {filters.length > 0 && (
                          <span style={{
                            padding: '4px 12px',
                            background: '#F97316',
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
                                <option key={field} value={field}>{field.replace(/_/g, ' ')}</option>
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
                      <MousePointerClick size={18} color="#F97316" />
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

                    {configuredFields.hasBankField && configuredFields.hasBillField && (
                      <button className="btn-secondary" onClick={() => selectByCondition('has_both')} style={{ padding: '8px 16px', fontSize: '13px' }}>
                        <CheckCircle2 size={14} /> Both Images
                      </button>
                    )}
                    {configuredFields.hasBankField && (
                      <>
                        <button className="btn-secondary" onClick={() => selectByCondition('has_bank')} style={{ padding: '8px 16px', fontSize: '13px' }}>
                          <FileImage size={14} /> Bank Only
                        </button>
                        <button className="btn-secondary" onClick={() => selectByCondition('missing_bank')} style={{ padding: '8px 16px', fontSize: '13px' }}>
                          <MinusCircle size={14} /> Missing Bank
                        </button>
                      </>
                    )}
                    {configuredFields.hasBillField && (
                      <>
                        <button className="btn-secondary" onClick={() => selectByCondition('has_bill')} style={{ padding: '8px 16px', fontSize: '13px' }}>
                          <FileImage size={14} /> Bill Only
                        </button>
                        <button className="btn-secondary" onClick={() => selectByCondition('missing_bill')} style={{ padding: '8px 16px', fontSize: '13px' }}>
                          <MinusCircle size={14} /> Missing Bill
                        </button>
                      </>
                    )}

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
                              style={{ width: '20px', height: '20px', cursor: 'pointer', accentColor: '#F97316' }}
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
                                style={{ width: '20px', height: '20px', cursor: 'pointer', accentColor: '#F97316' }}
                              />
                            </td>
                            {Array.from(visibleFields).map(field => {
                              const value = record[field]

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

                              return (
                                <td key={field}>
                                  {String(value || '').substring(0, 100)}
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
                  <Activity size={32} color="#F97316" />
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
                    background: 'linear-gradient(90deg, #F97316, #EC4899, #F97316)',
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
                  { label: 'Total', value: jobStatus?.progress?.total_records || 0, color: '#F97316', icon: Database },
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

              {jobStatus?.status === 'completed' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '32px' }}>
                  <button className="btn-secondary" onClick={handleBackToMain} style={{ padding: '18px', justifyContent: 'center' }}>
                    <ArrowLeft size={20} /> Back
                  </button>
                  <button className="btn-primary" onClick={() => { setShowPushModal(true) }} style={{ padding: '18px', justifyContent: 'center' }}>
                    <Database size={20} /> Push & Verify
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Push Confirm Modal */}
      {showPushModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3000 }}>
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="glass-card" style={{ padding: '40px', width: '100%', maxWidth: '500px' }}>
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#FFF7ED', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto', color: '#F97316' }}>
                <Activity size={32} />
              </div>
              <h2 style={{ fontSize: '24px', fontWeight: 800, margin: '0 0 8px 0', color: '#1E293B' }}>Extraction Complete!</h2>
              <p style={{ color: '#64748B', fontSize: '15px', margin: 0, lineHeight: 1.5 }}>
                Your {jobStatus?.progress?.successful_records || 0} successful records are ready. Would you like to automatically push them back to Zoho Creator?
              </p>
            </div>

            {pushStats ? (
              <div style={{ background: '#F0FDF4', padding: '24px', borderRadius: '16px', marginBottom: '24px', border: '1px solid #BBF7D0' }}>
                <div style={{ fontWeight: 700, color: '#166534', marginBottom: '12px', fontSize: '16px' }}>✅ Sync Successful</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div style={{ background: 'white', padding: '12px', borderRadius: '8px' }}>
                    <div style={{ fontSize: '12px', color: '#64748B' }}>INSERTED</div>
                    <div style={{ fontSize: '20px', fontWeight: 800, color: '#10B981' }}>{pushStats.inserted || 0}</div>
                  </div>
                  <div style={{ background: 'white', padding: '12px', borderRadius: '8px' }}>
                    <div style={{ fontSize: '12px', color: '#64748B' }}>UPDATED</div>
                    <div style={{ fontSize: '20px', fontWeight: 800, color: '#3B82F6' }}>{pushStats.updated || 0}</div>
                  </div>
                </div>
              </div>
            ) : null}

            <div style={{ display: 'flex', gap: '16px', flexDirection: 'column' }}>
              {!pushStats && (
                <button className="btn-primary" onClick={handlePushRecords} disabled={isPushing} style={{ width: '100%', justifyContent: 'center', padding: '16px' }}>
                  {isPushing ? <><Loader2 size={20} className="spinning" /> Pushing Records...</> : <><Database size={20} /> Push to Zoho Creator</>}
                </button>
              )}
              <button
                className="btn-secondary"
                onClick={() => {
                  setShowPushModal(false)
                  if (pushStats) {
                    handleBackToMain()
                  }
                }}
                style={{ width: '100%', justifyContent: 'center', background: pushStats ? '#F97316' : 'white', color: pushStats ? 'white' : '#475569', padding: '16px' }}
                disabled={isPushing}
              >
                {pushStats ? 'Done & Back to Main' : 'Close & Wait'}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Real Zoho Config Modal */}
      <ZohoConfigModal
        isOpen={showZohoModal}
        onClose={() => {
          setShowZohoModal(false)
          setShowPushModal(true) // Return to original modal
        }}
        selectedRecords={readyToPushIds}
        onSuccess={handleZohoPushSuccess}
      />


    {/* ✅ NEW: No Records Found Modal */}
    <AnimatePresence>
      {showNoRecordsModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.8)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3000,
          padding: '20px'
        }}>
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="glass-card"
            style={{ width: '100%', maxWidth: '500px', padding: '40px', textAlign: 'center' }}
          >
            <div style={{ 
              width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(249, 115, 22, 0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px'
            }}>
              <Search size={40} color="#F97316" />
            </div>
            
            <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#1E293B', marginBottom: '12px' }}>
              No Records Found
            </h2>
            
            <p style={{ color: '#64748B', fontSize: '16px', lineHeight: '1.6', marginBottom: '32px' }}>
              {noRecordsMessage || "We couldn't find any records in this Zoho report. Please check if the report name is correct and has data."}
            </p>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px' }}>
              <button 
                onClick={() => setShowNoRecordsModal(false)}
                className="btn-primary"
                style={{ width: '100%', justifyContent: 'center' }}
              >
                Got it
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>

    </div>
  )
}