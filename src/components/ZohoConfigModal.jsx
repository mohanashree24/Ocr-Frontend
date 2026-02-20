import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  X, Settings, AlertCircle, Database, Loader2, ChevronRight, Sparkles, Tag, RefreshCw, Trash2, GitCompare, Download, Eye
} from 'lucide-react'
import toast from 'react-hot-toast'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

// ✅ UPDATED: Field Mapping Component - Fetches from Report
function FieldMappingStep({ config, fieldMapping, setFieldMapping, reportFields, supabaseFields, isLoadingReportFields }) {
  const [expandedField, setExpandedField] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')

  // Filter fields based on search
  const filteredFields = reportFields.filter(field =>
    field.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleMapField = (reportField, supabaseField) => {
    setFieldMapping(prev => ({
      ...prev,
      [reportField]: supabaseField
    }))
    toast.success(`✅ Mapped "${reportField}" → "${supabaseField}"`, {
      style: { background: '#10B981', color: 'white' }
    })
  }

  const handleRemoveMapping = (reportField) => {
    setFieldMapping(prev => {
      const newMapping = { ...prev }
      delete newMapping[reportField]
      return newMapping
    })
    toast.success(`✅ Removed mapping for "${reportField}"`)
  }

  const getMappedField = (reportField) => {
    return fieldMapping[reportField] || null
  }

  const commonMappings = {
    'scholar_id': ['scholar_id', 'Scholar_ID', 'Actual_Scholar_ID'],
    'student_name': ['student_name', 'Scholar_Name', 'Name'],
    'account_number': ['account_number', 'Account_No'],
    'bank_name': ['bank_name', 'Bank_Name'],
    'account_holder': ['account_holder_name', 'Holder_Name'],
    'ifsc': ['ifsc_code', 'IFSC_Code'],
    'bill': ['bill_data', 'bill_amount', 'bill1_amount', 'bill2_amount'],
    'amount': ['bill1_amount', 'bill2_amount', 'total_amount'],
    'status': ['status', 'Status'],
  }

  const getSuggestedFields = (reportField) => {
    const fieldLower = reportField.toLowerCase()
    
    for (const [key, suggestions] of Object.entries(commonMappings)) {
      if (fieldLower.includes(key)) {
        return suggestions.filter(s => supabaseFields.includes(s))
      }
    }
    
    return supabaseFields.filter(sf =>
      fieldLower.includes(sf.split('_')[0]) ||
      sf.toLowerCase().includes(fieldLower.split('_')[0])
    )
  }

  return (
    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
      <div style={{ 
        background: 'white', 
        padding: '24px', 
        borderRadius: '16px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
          <GitCompare size={20} style={{ color: '#8B5CF6' }} />
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#1E293B' }}>
            Map Report Fields to Supabase Data
          </h3>
        </div>

        <div style={{
          background: '#F0F9FF',
          border: '2px solid #0EA5E9',
          borderRadius: '10px',
          padding: '12px',
          marginBottom: '20px',
          display: 'flex',
          gap: '10px'
        }}>
          <AlertCircle size={18} style={{ color: '#0284C7', flexShrink: 0 }} />
          <div style={{ fontSize: '12px', color: '#0C4A6E', lineHeight: 1.5 }}>
            <strong>📋 Report Field Mapping:</strong> Select which Zoho report fields should be populated with data from Supabase. Leave unmapped to skip updating that field.
          </div>
        </div>

        {isLoadingReportFields && (
          <div style={{
            background: '#F8FAFC',
            padding: '32px',
            borderRadius: '12px',
            textAlign: 'center',
            color: '#64748B'
          }}>
            <Loader2 size={32} style={{ margin: '0 auto 12px', animation: 'spin 1s linear infinite' }} />
            <div>Loading report fields from Zoho...</div>
          </div>
        )}

        {!isLoadingReportFields && reportFields.length === 0 && (
          <div style={{
            background: '#FEF3C7',
            border: '2px solid #FCD34D',
            borderRadius: '10px',
            padding: '16px',
            textAlign: 'center',
            color: '#92400E'
          }}>
            <AlertCircle size={20} style={{ margin: '0 auto 8px' }} />
            <div style={{ fontSize: '13px', fontWeight: 600 }}>
              No report fields loaded. Go back and check your configuration.
            </div>
          </div>
        )}

        {!isLoadingReportFields && reportFields.length > 0 && (
          <>
            {/* Search Box */}
            <div style={{ marginBottom: '16px' }}>
              <input
                type="text"
                placeholder="🔍 Search report fields..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  border: '2px solid #E2E8F0',
                  fontSize: '13px',
                  outline: 'none',
                  transition: 'all 0.2s'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#8B5CF6'
                  e.target.style.boxShadow = '0 0 0 3px rgba(139, 92, 246, 0.1)'
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#E2E8F0'
                  e.target.style.boxShadow = 'none'
                }}
              />
            </div>

            {/* Field List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '400px', overflowY: 'auto' }}>
              {filteredFields.map((reportField, idx) => {
                const mappedField = getMappedField(reportField)
                const suggestedFields = getSuggestedFields(reportField)
                const isMapped = mappedField !== null
                
                return (
                  <div key={`${reportField}-${idx}`} style={{
                    background: '#F8FAFC',
                    border: `2px solid ${isMapped ? '#10B981' : '#E2E8F0'}`,
                    borderRadius: '12px',
                    overflow: 'hidden'
                  }}>
                    {/* Header */}
                    <div 
                      onClick={() => setExpandedField(expandedField === reportField ? null : reportField)}
                      style={{
                        padding: '12px 14px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer',
                        backgroundColor: isMapped ? '#F0FDF4' : '#FAFAFA',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = isMapped ? '#ECFDF5' : '#F3F4F6'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = isMapped ? '#F0FDF4' : '#FAFAFA'}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
                        <div style={{
                          width: '10px',
                          height: '10px',
                          borderRadius: '50%',
                          background: isMapped ? '#10B981' : '#CBD5E1',
                          flexShrink: 0
                        }} />
                        <div style={{ minWidth: 0 }}>
                          <div style={{ 
                            fontWeight: 700, 
                            fontSize: '13px',
                            color: '#1E293B',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}>
                            {reportField}
                          </div>
                          {isMapped && (
                            <div style={{
                              fontSize: '11px',
                              color: '#10B981',
                              fontWeight: 600
                            }}>
                              ✓ Mapped to: {mappedField}
                            </div>
                          )}
                        </div>
                      </div>
                      <ChevronRight 
                        size={16} 
                        style={{
                          color: '#64748B',
                          transform: expandedField === reportField ? 'rotate(90deg)' : 'rotate(0deg)',
                          transition: 'transform 0.2s',
                          flexShrink: 0
                        }}
                      />
                    </div>

                    {/* Expanded Content */}
                    {expandedField === reportField && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        style={{
                          borderTop: '1px solid #E2E8F0',
                          padding: '12px 14px',
                          background: '#FAFAFA'
                        }}
                      >
                        {/* Current Mapping */}
                        {mappedField && (
                          <div style={{ marginBottom: '12px' }}>
                            <div style={{
                              background: '#D1FAE5',
                              border: '2px solid #10B981',
                              borderRadius: '8px',
                              padding: '10px 12px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between'
                            }}>
                              <div>
                                <div style={{ fontSize: '10px', color: '#065F46', fontWeight: 700, marginBottom: '2px', textTransform: 'uppercase' }}>
                                  Currently Mapped
                                </div>
                                <div style={{ fontSize: '12px', fontWeight: 700, color: '#047857' }}>
                                  → {mappedField}
                                </div>
                              </div>
                              <button
                                onClick={() => handleRemoveMapping(reportField)}
                                style={{
                                  background: '#FEE2E2',
                                  border: '2px solid #EF4444',
                                  color: '#DC2626',
                                  padding: '4px 10px',
                                  borderRadius: '6px',
                                  cursor: 'pointer',
                                  fontSize: '11px',
                                  fontWeight: 600,
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px'
                                }}
                              >
                                <Trash2 size={12} />
                                Remove
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Suggested Fields */}
                        {suggestedFields.length > 0 && (
                          <div style={{ marginBottom: '12px' }}>
                            <div style={{
                              fontSize: '10px',
                              fontWeight: 700,
                              color: '#64748B',
                              marginBottom: '6px',
                              textTransform: 'uppercase'
                            }}>
                              💡 Suggestions
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              {suggestedFields.map(suggestion => (
                                <button
                                  key={suggestion}
                                  onClick={() => handleMapField(reportField, suggestion)}
                                  disabled={mappedField === suggestion}
                                  style={{
                                    background: mappedField === suggestion ? '#E0F2FE' : 'white',
                                    border: '1px solid #E2E8F0',
                                    borderRadius: '6px',
                                    padding: '6px 10px',
                                    cursor: mappedField === suggestion ? 'default' : 'pointer',
                                    textAlign: 'left',
                                    fontSize: '11px',
                                    color: '#1E293B',
                                    fontWeight: 600,
                                    opacity: mappedField === suggestion ? 0.6 : 1,
                                    transition: 'all 0.2s'
                                  }}
                                >
                                  {mappedField === suggestion ? '✓ ' : ''} {suggestion}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* All Available Fields */}
                        <div>
                          <div style={{
                            fontSize: '10px',
                            fontWeight: 700,
                            color: '#64748B',
                            marginBottom: '6px',
                            textTransform: 'uppercase'
                          }}>
                            🔍 All Supabase Fields
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '4px' }}>
                            {supabaseFields.map(field => (
                              <button
                                key={field}
                                onClick={() => handleMapField(reportField, field)}
                                disabled={mappedField === field}
                                style={{
                                  background: mappedField === field ? '#E0F2FE' : 'white',
                                  border: '1px solid #E2E8F0',
                                  borderRadius: '6px',
                                  padding: '6px 8px',
                                  cursor: mappedField === field ? 'default' : 'pointer',
                                  textAlign: 'left',
                                  fontSize: '10px',
                                  color: '#1E293B',
                                  fontWeight: 500,
                                  opacity: mappedField === field ? 0.6 : 1,
                                  transition: 'all 0.2s',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap'
                                }}
                                title={field}
                              >
                                {mappedField === field ? '✓ ' : ''}{field}
                              </button>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Summary Stats */}
            <div style={{
              marginTop: '20px',
              padding: '12px 14px',
              background: 'linear-gradient(135deg, #F3E8FF 0%, #FAF5FF 100%)',
              border: '2px solid #E9D5FF',
              borderRadius: '10px',
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '12px'
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '20px', fontWeight: 900, color: '#8B5CF6' }}>
                  {Object.keys(fieldMapping).length}
                </div>
                <div style={{ fontSize: '10px', fontWeight: 600, color: '#6B21A8', textTransform: 'uppercase' }}>
                  Mapped
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '20px', fontWeight: 900, color: '#6B7280' }}>
                  {reportFields.length}
                </div>
                <div style={{ fontSize: '10px', fontWeight: 600, color: '#4B5563', textTransform: 'uppercase' }}>
                  Total Fields
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '20px', fontWeight: 900, color: '#EF4444' }}>
                  {reportFields.length - Object.keys(fieldMapping).length}
                </div>
                <div style={{ fontSize: '10px', fontWeight: 600, color: '#991B1B', textTransform: 'uppercase' }}>
                  Skipped
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </motion.div>
  )
}

// ============================================================
// ✅ Updated Main Modal with Report Field Fetching
// ============================================================

export default function ZohoSyncModal({ isOpen, onClose, selectedRecords, onSuccess }) {
  const [step, setStep] = useState(1)
  
  const [config, setConfig] = useState({
    owner_name: '',
    app_name: '',
    form_name: '',
    report_name: ''
  })
  
  const [fieldMapping, setFieldMapping] = useState({})
  const [reportFields, setReportFields] = useState([])
  const [supabaseFields, setSupabaseFields] = useState([
    'student_name', 'scholar_id', 'tracking_id', 'email',
    'account_number', 'bank_name', 'account_holder_name', 'ifsc_code', 'branch_name',
    'bill_amount', 'bill1_amount', 'bill2_amount', 'bill3_amount', 'bill4_amount', 'bill5_amount',
    'total_amount', 'status', 'tokens_used', 'cost_usd'
  ])
  
  const [syncMode, setSyncMode] = useState('insert')
  const [tag, setTag] = useState('')
  const [tagColor, setTagColor] = useState('blue')
  
  const [isLoadingFields, setIsLoadingFields] = useState(false)
  const [isPushing, setIsPushing] = useState(false)
  const [pushProgress, setPushProgress] = useState(null)
  
  const tagColors = {
    blue: '#3B82F6', green: '#10B981', red: '#EF4444', yellow: '#F59E0B', purple: '#8B5CF6', pink: '#EC4899'
  }

  useEffect(() => {
    if (isOpen) {
      setStep(1)
      setConfig({ owner_name: '', app_name: '', form_name: '', report_name: '' })
      setFieldMapping({})
      setReportFields([])
      setSyncMode('insert')
      setTag('')
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => { document.body.style.overflow = 'unset' }
  }, [isOpen])

const fetchReportFields = async () => {
  if (!config.owner_name || !config.app_name) {
    toast.error('Please fill in Owner Name and App Name')
    return
  }

  const reportName = config.report_name || `All_${config.form_name}`

  setIsLoadingFields(true)
  
  try {
    console.log('[FETCH] Requesting fields for:', { 
      owner_name: config.owner_name, 
      app_name: config.app_name, 
      report_name: reportName 
    })

    const response = await fetch(`${API_BASE_URL}/zoho/get-report-fields`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        owner_name: config.owner_name,
        app_name: config.app_name,
        form_name: config.form_name,  // ✅ Include form_name too
        report_name: reportName
      })
    })

    console.log('[FETCH] Response status:', response.status)

    const data = await response.json()
    
    console.log('[FETCH] Response data:', data)

    if (!response.ok) {
      toast.error(data.error || `Failed to fetch fields (Status: ${response.status})`)
      return
    }

    if (data.success) {
      // ✅ IMPORTANT: Ensure fields is an array
      const fields = Array.isArray(data.fields) ? data.fields : []
      
      console.log('[FETCH] Fields received:', fields)
      console.log('[FETCH] Fields count:', fields.length)
      console.log('[FETCH] Sample:', fields.slice(0, 3))

      if (fields.length === 0) {
        toast.error('No fields were returned from Zoho')
        return
      }

      // ✅ Update state
      setReportFields(fields)
      
      // Auto-map common fields
      const autoMapping = {}
      fields.forEach(field => {
        if (typeof field !== 'string') {
          console.warn('[FETCH] Non-string field:', field)
          return
        }

        const fieldLower = field.toLowerCase()
        const matching = supabaseFields.find(sf => 
          fieldLower.includes(sf.split('_')[0].toLowerCase()) ||
          sf.toLowerCase().includes(fieldLower.split('_')[0])
        )
        if (matching) {
          autoMapping[field] = matching
        }
      })
      
      console.log('[FETCH] Auto-mappings created:', Object.keys(autoMapping).length)
      setFieldMapping(autoMapping)
      
      toast.success(`✅ Loaded ${fields.length} fields from Zoho report`, {
        style: { background: '#10B981', color: 'white' }
      })
      
      // ✅ Move to step 2 AFTER state updates
      setTimeout(() => {
        setStep(2)
      }, 100)
      
    } else {
      toast.error(data.error || 'Failed to fetch report fields')
      console.error('[FETCH] Error:', data)
    }
  } catch (error) {
    console.error('[FETCH] Exception:', error)
    toast.error(`Error: ${error.message}`)
  } finally {
    setIsLoadingFields(false)
  }
}

  const handleSync = async () => {
    setIsPushing(true)
    const totalRecords = selectedRecords.size
    
    setPushProgress({ 
      current: 0, total: totalRecords, successful: 0, updated: 0, inserted: 0, failed: 0,
      status: 'Initializing sync...'
    })
    setStep(5)

    let progressInterval = null
    
    try {
      progressInterval = setInterval(() => {
        setPushProgress(prev => {
          if (!prev || prev.current >= prev.total) return prev
          const increment = Math.max(1, Math.floor(prev.total / 50))
          const newCurrent = Math.min(prev.current + increment, prev.total - 1)
          return { ...prev, current: newCurrent, status: `Syncing record ${newCurrent} of ${prev.total}...` }
        })
      }, 1000)
      
      const response = await fetch(`${API_BASE_URL}/zoho/sync-records`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          config: config,
          record_ids: Array.from(selectedRecords),
          sync_mode: syncMode,
          tag: tag,
          tag_color: tagColor,
          field_mapping: fieldMapping,
          report_name: config.report_name
        })
      })

      clearInterval(progressInterval)
      const result = await response.json()

      if (result.success) {
        setPushProgress({
          current: result.details.total_records,
          total: result.details.total_records,
          successful: result.details.successful || 0,
          updated: result.details.updated || 0,
          inserted: result.details.inserted || 0,
          failed: result.details.failed || 0,
          status: 'Completed!'
        })
        
        toast.success(`✅ Inserted: ${result.details.inserted} | Updated: ${result.details.updated} | Failed: ${result.details.failed}`, {
          duration: 5000, style: { background: '#10B981', color: 'white', fontWeight: 600 }
        })
        
        onSuccess(result.details)
        setTimeout(() => { onClose() }, 3000)
      } else {
        setPushProgress(prev => ({ ...prev, status: 'Failed', failed: prev.total }))
        toast.error(result.error || 'Sync failed')
      }
    } catch (error) {
      setPushProgress(prev => ({ ...prev, status: 'Error occurred', failed: prev.total }))
      toast.error(`Error: ${error.message}`)
    } finally {
      if (progressInterval) clearInterval(progressInterval)
      setIsPushing(false)
      setTimeout(() => { setPushProgress(null) }, 3000)
    }
  }

  if (!isOpen) return null

  // Render steps...
  return (
    <>
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .spin { animation: spin 1s linear infinite; }
      `}</style>
      
      <AnimatePresence>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0, 0, 0, 0.7)', backdropFilter: 'blur(10px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 9999, padding: '16px', overflowY: 'auto'
          }} onClick={onClose}
        >
          <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'white', borderRadius: '24px', width: '100%', maxWidth: '800px',
              maxHeight: '85vh', overflow: 'hidden', boxShadow: '0 25px 50px rgba(0, 0, 0, 0.3)',
              display: 'flex', flexDirection: 'column'
            }}
          >
            {/* Header */}
            <div style={{
              background: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)',
              padding: '24px', position: 'relative', overflow: 'hidden'
            }}>
              <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Database size={28} style={{ color: 'white' }} />
                  <div>
                    <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 900, color: 'white' }}>
                      Sync to Zoho Creator
                    </h2>
                    <p style={{ margin: '2px 0 0 0', color: 'rgba(255,255,255,0.9)', fontSize: '12px' }}>
                      Map report fields and sync data
                    </p>
                  </div>
                </div>
                <motion.button whileHover={{ scale: 1.1, rotate: 90 }} whileTap={{ scale: 0.9 }}
                  onClick={onClose}
                  style={{
                    background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white',
                    cursor: 'pointer', borderRadius: '50%', width: '36px', height: '36px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}
                >
                  <X size={20} />
                </motion.button>
              </div>

              {/* Progress Steps */}
              <div style={{ marginTop: '20px', display: 'flex', gap: '8px', position: 'relative', zIndex: 1 }}>
                {[
                  { num: 1, label: 'Config' },
                  { num: 2, label: 'Map Fields' },
                  { num: 3, label: 'Tag & Mode' },
                  { num: 4, label: 'Review' },
                  { num: 5, label: 'Sync' }
                ].map((s, idx) => (
                  <div key={`step-${s.num}`} style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{
                      width: '28px', height: '28px', borderRadius: '50%',
                      background: step >= s.num ? 'white' : 'rgba(255,255,255,0.3)',
                      color: step >= s.num ? '#8B5CF6' : 'white',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 900, fontSize: '12px'
                    }}>
                      {step > s.num ? '✓' : s.num}
                    </div>
                    <span style={{
                      color: step >= s.num ? 'white' : 'rgba(255,255,255,0.6)',
                      fontSize: '12px', fontWeight: 600
                    }}>
                      {s.label}
                    </span>
                    {idx < 4 && <ChevronRight size={14} style={{ color: 'rgba(255,255,255,0.5)', marginLeft: 'auto' }} />}
                  </div>
                ))}
              </div>
            </div>

            {/* Content */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '24px', background: '#F8FAFC' }}>
              {/* STEP 1: Configuration */}
              {step === 1 && (
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                  <div style={{ background: 'white', padding: '24px', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                      <Settings size={20} style={{ color: '#8B5CF6' }} />
                      <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#1E293B' }}>
                        Zoho Creator Configuration
                      </h3>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      {[
                        { key: 'owner_name', label: 'Owner Name', placeholder: 'e.g., yourcompany' },
                        { key: 'app_name', label: 'App Name', placeholder: 'e.g., scholarship-app' },
                        { key: 'form_name', label: 'Form Name', placeholder: 'e.g., Student_Details' },
                        { key: 'report_name', label: 'Report Name (Optional)', placeholder: 'e.g., All_Student_Details' }
                      ].map(field => (
                        <div key={field.key}>
                          <label style={{
                            display: 'block', fontSize: '13px', fontWeight: 600,
                            color: '#1E293B', marginBottom: '8px'
                          }}>
                            {field.label} {!field.placeholder.includes('Optional') && <span style={{ color: '#EF4444' }}>*</span>}
                          </label>
                          <input
                            type="text" placeholder={field.placeholder}
                            value={config[field.key]}
                            onChange={(e) => setConfig({ ...config, [field.key]: e.target.value })}
                            style={{
                              width: '100%', padding: '12px 14px', borderRadius: '10px',
                              border: '2px solid #E2E8F0', fontSize: '14px', fontWeight: 500,
                              outline: 'none', transition: 'all 0.2s'
                            }}
                            onFocus={(e) => {
                              e.target.style.borderColor = '#8B5CF6'
                              e.target.style.boxShadow = '0 0 0 3px rgba(139, 92, 246, 0.1)'
                            }}
                            onBlur={(e) => {
                              e.target.style.borderColor = '#E2E8F0'
                              e.target.style.boxShadow = 'none'
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* STEP 2: Field Mapping */}
              {step === 2 && (
                <FieldMappingStep 
                  config={config}
                  fieldMapping={fieldMapping}
                  setFieldMapping={setFieldMapping}
                  reportFields={reportFields}
                  supabaseFields={supabaseFields}
                  isLoadingReportFields={isLoadingFields}
                />
              )}

              {/* STEP 3-5: Tag & Mode, Review, Progress */}
              {/* ... (same as before) ... */}
            </div>

            {/* Footer Actions */}
            <div style={{
              padding: '16px 20px', borderTop: '1px solid #E2E8F0',
              background: 'white', display: 'flex', justifyContent: 'space-between', gap: '10px'
            }}>
              <motion.button
                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                onClick={() => step > 1 && setStep(step - 1)}
                disabled={step === 1 || isPushing}
                style={{
                  padding: '10px 20px', borderRadius: '10px', border: '2px solid #E2E8F0',
                  background: 'white', color: '#64748B', fontWeight: 600, fontSize: '13px',
                  cursor: step === 1 || isPushing ? 'not-allowed' : 'pointer',
                  opacity: step === 1 || isPushing ? 0.5 : 1
                }}
              >
                ← Back
              </motion.button>

              <div style={{ display: 'flex', gap: '10px' }}>
                {step === 1 && (
                  <motion.button
                    whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                    onClick={fetchReportFields}
                    disabled={isLoadingFields || !config.owner_name || !config.app_name}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 24px',
                      borderRadius: '10px', border: 'none',
                      background: !config.owner_name || !config.app_name ? '#E5E7EB' : 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)',
                      color: !config.owner_name || !config.app_name ? '#94A3B8' : 'white',
                      fontWeight: 600, fontSize: '13px',
                      cursor: !config.owner_name || !config.app_name ? 'not-allowed' : 'pointer',
                      boxShadow: !config.owner_name || !config.app_name ? 'none' : '0 4px 12px rgba(139, 92, 246, 0.3)'
                    }}
                  >
                    {isLoadingFields ? (
                      <>
                        <Loader2 size={14} className="spin" />
                        Fetching...
                      </>
                    ) : (
                      <>
                        <Download size={14} />
                        Fetch Fields
                      </>
                    )}
                  </motion.button>
                )}

                {step === 2 && (
                  <motion.button
                    whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                    onClick={() => setStep(3)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 24px',
                      borderRadius: '10px', border: 'none',
                      background: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)',
                      color: 'white', fontWeight: 600, fontSize: '13px', cursor: 'pointer',
                      boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)'
                    }}
                  >
                    Next
                    <ChevronRight size={14} />
                  </motion.button>
                )}

                {step === 3 && (
                  <motion.button
                    whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                    onClick={() => setStep(4)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 24px',
                      borderRadius: '10px', border: 'none',
                      background: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)',
                      color: 'white', fontWeight: 600, fontSize: '13px', cursor: 'pointer',
                      boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)'
                    }}
                  >
                    Review
                  </motion.button>
                )}

                {step === 4 && (
                  <motion.button
                    whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                    onClick={handleSync}
                    disabled={isPushing}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 24px',
                      borderRadius: '10px', border: 'none',
                      background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                      color: 'white', fontWeight: 600, fontSize: '13px', cursor: 'pointer',
                      boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
                    }}
                  >
                    <RefreshCw size={14} />
                    Start Sync
                  </motion.button>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    </>
  )
}