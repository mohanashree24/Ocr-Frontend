import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  X, 
  Settings, 
  ArrowRight, 
  Check, 
  AlertCircle,
  Database,
  Upload,
  Loader2,
  ChevronRight,
  Sparkles
} from 'lucide-react'
import toast from 'react-hot-toast'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export default function ZohoConfigModal({ isOpen, onClose, selectedRecords, onSuccess }) {
  const [step, setStep] = useState(1) // 1: Config, 2: Field Mapping, 3: Preview & Push
  
  // Step 1: Zoho Configuration
  const [config, setConfig] = useState({
    owner_name: '',
    app_name: '',
    form_name: ''
  })
  
  // Step 2: Field Mapping
  const [fieldMapping, setFieldMapping] = useState({})
  const [zohoFields, setZohoFields] = useState([])
  const [isLoadingFields, setIsLoadingFields] = useState(false)
  
  // Step 3: Push Status
  const [isPushing, setIsPushing] = useState(false)
  const [pushProgress, setPushProgress] = useState(null)
  
  // Available source fields (from your extracted data)
  const sourceFields = [
    { key: 'scholar_name', label: 'Scholar Name', required: true },
    { key: 'scholar_id', label: 'Scholar ID', required: true },
    { key: 'Tracking_id', label: 'Tracking ID', required: false },
    { key: 'bank_data.account_number', label: 'Account Number', required: false },
    { key: 'bank_data.bank_name', label: 'Bank Name', required: false },
    { key: 'bank_data.account_holder_name', label: 'Account Holder Name', required: false },
    { key: 'bank_data.ifsc_code', label: 'IFSC Code', required: false },
    { key: 'bank_data.branch_name', label: 'Branch Name', required: false },
    { key: 'bill_data', label: 'Bill Data (Full)', required: false },
    { key: 'bill_data[0].amount', label: 'Bill 1 Amount', required: false },
    { key: 'bill_data[1].amount', label: 'Bill 2 Amount', required: false },
    { key: 'bill_data[2].amount', label: 'Bill 3 Amount', required: false },
    { key: 'bill_data[3].amount', label: 'Bill 4 Amount', required: false },
    { key: 'bill_data[4].amount', label: 'Bill 5 Amount', required: false }
    // Removed: tokens_used and status fields
  ].filter(field => field.key && field.key.trim() !== '') // Ensure no empty keys

  useEffect(() => {
    if (isOpen) {
      // Reset state when modal opens
      setStep(1)
      setConfig({ owner_name: '', app_name: '', form_name: '' })
      setFieldMapping({})
      setZohoFields([])
      
      // Prevent body scroll
      document.body.style.overflow = 'hidden'
    } else {
      // Restore body scroll
      document.body.style.overflow = 'unset'
    }
    
    // Cleanup on unmount
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  const fetchZohoFields = async () => {
    if (!config.owner_name || !config.app_name || !config.form_name) {
      toast.error('Please fill in all Zoho configuration fields')
      return
    }

    setIsLoadingFields(true)
    try {
      const response = await fetch(`${API_BASE_URL}/zoho/get-form-fields`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          owner_name: config.owner_name,
          app_name: config.app_name,
          form_name: config.form_name
        })
      })

      const data = await response.json()
      
      if (data.success) {
        setZohoFields(data.fields || [])
        toast.success(`✅ Loaded ${data.fields.length} Zoho fields`, {
          style: { background: '#10B981', color: 'white' }
        })
        setStep(2)
      } else {
        toast.error(data.error || 'Failed to fetch Zoho fields')
      }
    } catch (error) {
      toast.error(`Error: ${error.message}`)
    } finally {
      setIsLoadingFields(false)
    }
  }

  const handlePushToZoho = async () => {
    // Validate required mappings
    const requiredFields = sourceFields.filter(f => f.required)
    const missingMappings = requiredFields.filter(f => !fieldMapping[f.key])
    
    if (missingMappings.length > 0) {
      toast.error(`Please map required fields: ${missingMappings.map(f => f.label).join(', ')}`)
      return
    }

  setIsPushing(true)
  setPushProgress({ current: 0, total: selectedRecords.length })
  setStep(3)

  try {
    // Start the job
    const response = await fetch(`${API_BASE_URL}/zoho/dynamic-push`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        config: config,
        field_mapping: fieldMapping,
        record_ids: Array.from(selectedRecords)
      })
    })

    const result = await response.json()

    if (result.success && result.job_id) {
      // Poll for progress
      const pollInterval = setInterval(async () => {
        try {
          const statusResponse = await fetch(`${API_BASE_URL}/zoho/push-status/${result.job_id}`)
          const statusData = await statusResponse.json()
          
          if (statusData.success) {
            const progress = statusData.progress
            
            // Update progress UI
            setPushProgress({
              current: progress.processed_records,
              total: progress.total_records
            })
            
            // Check if completed
            if (statusData.status === 'completed' || statusData.status === 'failed') {
              clearInterval(pollInterval)
              setIsPushing(false)
              
              if (statusData.status === 'completed') {
                toast.success(
                  `🎉 Successfully pushed ${progress.successful_records}/${progress.total_records} records!`,
                  { duration: 5000, style: { background: '#10B981', color: 'white', fontWeight: 600 } }
                )
                onSuccess(progress)
                setTimeout(() => onClose(), 2000)
              } else {
                toast.error('Push failed. Check logs for details.')
              }
            }
          }
        } catch (pollError) {
          console.error('Polling error:', pollError)
        }
      }, 1000) // Poll every second
      
    } else {
      toast.error(result.error || 'Failed to start push job')
      setIsPushing(false)
    }
  } catch (error) {
    toast.error(`Error: ${error.message}`)
    setIsPushing(false)
  }
}

  const getValueFromPath = (obj, path) => {
    // Helper to get nested values like "bank_data.account_number"
    return path.split('.').reduce((current, key) => {
      const arrayMatch = key.match(/(\w+)\[(\d+)\]/)
      if (arrayMatch) {
        const [, arrayKey, index] = arrayMatch
        return current?.[arrayKey]?.[parseInt(index)]
      }
      return current?.[key]
    }, obj)
  }

  if (!isOpen) return null

  return (
    <>
      <style>{`
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        .spin {
          animation: spin 1s linear infinite;
        }
      `}</style>
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '16px',
            overflowY: 'auto',
            overflowX: 'hidden'
          }}
          onClick={onClose}
        >
        <motion.div
          initial={{ scale: 0.95, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.95, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          style={{
            background: 'white',
            borderRadius: '24px',
            width: '100%',
            maxWidth: '650px',
            maxHeight: '70vh',
            overflow: 'hidden',
            boxShadow: '0 25px 50px rgba(0, 0, 0, 0.3)',
            display: 'flex',
            flexDirection: 'column',
            margin: 'auto',
            position: 'relative'
          }}
        >
          {/* Header */}
          <div style={{
            background: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)',
            padding: '20px 24px',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{ position: 'absolute', top: '-50%', right: '-10%', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(255,255,255,0.15) 0%, transparent 70%)', borderRadius: '50%' }} />
            
            <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Database size={28} style={{ color: 'white' }} />
                <div>
                  <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 900, color: 'white' }}>
                    Push to Zoho Creator
                  </h2>
                  <p style={{ margin: '2px 0 0 0', color: 'rgba(255,255,255,0.9)', fontSize: '12px' }}>
                    Configure & map fields to sync {selectedRecords.length} records
                  </p>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                style={{
                  background: 'rgba(255,255,255,0.2)',
                  border: 'none',
                  color: 'white',
                  cursor: 'pointer',
                  borderRadius: '50%',
                  width: '36px',
                  height: '36px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <X size={20} />
              </motion.button>
            </div>

            {/* Progress Steps */}
            <div style={{ marginTop: '16px', display: 'flex', gap: '8px', position: 'relative', zIndex: 1 }}>
              {[
                { num: 1, label: 'Configure' },
                { num: 2, label: 'Map Fields' },
                { num: 3, label: 'Push' }
              ].map((s, idx) => (
                <div key={`step-${s.num}-${idx}`} style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    background: step >= s.num ? 'white' : 'rgba(255,255,255,0.3)',
                    color: step >= s.num ? '#8B5CF6' : 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 900,
                    fontSize: '12px'
                  }}>
                    {step > s.num ? <Check size={16} /> : s.num}
                  </div>
                  <span style={{ 
                    color: step >= s.num ? 'white' : 'rgba(255,255,255,0.6)', 
                    fontSize: '12px', 
                    fontWeight: 600 
                  }}>
                    {s.label}
                  </span>
                  {idx < 2 && (
                    <ChevronRight size={14} style={{ color: 'rgba(255,255,255,0.5)', marginLeft: 'auto' }} />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Content */}
          <div style={{ 
            flex: 1, 
            overflowY: 'auto', 
            padding: '20px',
            background: '#F8FAFC'
          }}>
            {/* STEP 1: Configuration */}
            {step === 1 && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <div style={{ 
                  background: 'white', 
                  padding: '20px', 
                  borderRadius: '12px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                    <Settings size={20} style={{ color: '#8B5CF6' }} />
                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#1E293B' }}>
                      Zoho Creator Configuration
                    </h3>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div>
                      <label style={{ 
                        display: 'block', 
                        fontSize: '13px', 
                        fontWeight: 600, 
                        color: '#1E293B', 
                        marginBottom: '6px' 
                      }}>
                        Owner Name <span style={{ color: '#EF4444' }}>*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="e.g., yourcompany"
                        value={config.owner_name}
                        onChange={(e) => setConfig({ ...config, owner_name: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          borderRadius: '10px',
                          border: '2px solid #E2E8F0',
                          fontSize: '14px',
                          fontWeight: 500,
                          outline: 'none',
                          transition: 'all 0.2s',
                          background: 'white',
                          color: '#1E293B'
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

                    <div>
                      <label style={{ 
                        display: 'block', 
                        fontSize: '13px', 
                        fontWeight: 600, 
                        color: '#1E293B', 
                        marginBottom: '6px' 
                      }}>
                        App Name <span style={{ color: '#EF4444' }}>*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="e.g., scholarship-app"
                        value={config.app_name}
                        onChange={(e) => setConfig({ ...config, app_name: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          borderRadius: '10px',
                          border: '2px solid #E2E8F0',
                          fontSize: '14px',
                          fontWeight: 500,
                          outline: 'none',
                          transition: 'all 0.2s',
                          background: 'white',
                          color: '#1E293B'
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

                    <div>
                      <label style={{ 
                        display: 'block', 
                        fontSize: '13px', 
                        fontWeight: 600, 
                        color: '#1E293B', 
                        marginBottom: '6px' 
                      }}>
                        Form Name <span style={{ color: '#EF4444' }}>*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="e.g., Student_Details"
                        value={config.form_name}
                        onChange={(e) => setConfig({ ...config, form_name: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          borderRadius: '10px',
                          border: '2px solid #E2E8F0',
                          fontSize: '14px',
                          fontWeight: 500,
                          outline: 'none',
                          transition: 'all 0.2s',
                          background: 'white',
                          color: '#1E293B'
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

                    <div style={{
                      background: '#FEF3C7',
                      border: '2px solid #FCD34D',
                      borderRadius: '10px',
                      padding: '12px',
                      display: 'flex',
                      gap: '10px'
                    }}>
                      <AlertCircle size={18} style={{ color: '#F59E0B', flexShrink: 0 }} />
                      <div style={{ fontSize: '12px', color: '#92400E', lineHeight: 1.5 }}>
                        <strong>Note:</strong> Make sure you have valid Zoho Creator API credentials configured in your backend (.env file).
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 2: Field Mapping */}
            {step === 2 && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <div style={{ 
                  background: 'white', 
                  padding: '20px', 
                  borderRadius: '12px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                    <ArrowRight size={20} style={{ color: '#8B5CF6' }} />
                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#1E293B' }}>
                      Map Your Fields
                    </h3>
                  </div>

                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: '1fr auto 1fr',
                    gap: '12px',
                    alignItems: 'center',
                    marginBottom: '12px',
                    padding: '10px',
                    background: '#F8FAFC',
                    borderRadius: '8px'
                  }}>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
                      Source Field (Your Data)
                    </div>
                    <div></div>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
                      Zoho Creator Field
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '320px', overflowY: 'auto' }}>
                    {sourceFields.map((sourceField, fieldIndex) => (
                      <div 
                        key={sourceField.key || `field-${fieldIndex}`}
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '1fr auto 1fr',
                          gap: '12px',
                          alignItems: 'center',
                          padding: '12px',
                          background: '#FAFAFA',
                          borderRadius: '10px',
                          border: '2px solid #E2E8F0'
                        }}
                      >
                        <div>
                          <div style={{ 
                            fontSize: '13px', 
                            fontWeight: 600, 
                            color: '#1E293B',
                            marginBottom: '3px'
                          }}>
                            {sourceField.label}
                            {sourceField.required && (
                              <span style={{ color: '#EF4444', marginLeft: '4px' }}>*</span>
                            )}
                          </div>
                          <div style={{ fontSize: '11px', color: '#94A3B8', fontFamily: 'monospace' }}>
                            {sourceField.key}
                          </div>
                        </div>

                        <ArrowRight size={18} style={{ color: '#8B5CF6' }} />

                        <select
                          value={fieldMapping[sourceField.key] || ''}
                          onChange={(e) => setFieldMapping({ 
                            ...fieldMapping, 
                            [sourceField.key]: e.target.value 
                          })}
                          style={{
                            width: '100%',
                            padding: '10px 12px',
                            borderRadius: '8px',
                            border: '2px solid #E2E8F0',
                            fontSize: '13px',
                            fontWeight: 500,
                            outline: 'none',
                            background: 'white',
                            color: '#1E293B',
                            cursor: 'pointer',
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
                        >
                          <option value="">-- Select Zoho Field --</option>
                          {zohoFields.map((zField, index) => (
                            <option key={`${zField}-${index}`} value={zField}>
                              {zField}
                            </option>
                          ))}
                        </select>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 3: Push Progress */}
            {step === 3 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <div style={{ 
                  background: 'white', 
                  padding: '40px 32px', 
                  borderRadius: '12px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                  textAlign: 'center',
                  minHeight: '320px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center'
                }}>
                  {isPushing ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      >
                        <Loader2 size={56} style={{ color: '#8B5CF6', marginBottom: '24px' }} />
                      </motion.div>
                      <h3 style={{ fontSize: '20px', fontWeight: 700, color: '#1E293B', marginBottom: '10px' }}>
                        Pushing to Zoho Creator...
                      </h3>
                      <p style={{ color: '#64748B', fontSize: '14px', marginBottom: '24px' }}>
                        Please wait while we sync your records
                      </p>
                      {pushProgress && (
                        <div style={{ width: '100%', maxWidth: '400px' }}>
                          <div style={{ 
                            width: '100%', 
                            height: '8px', 
                            background: '#E5E7EB', 
                            borderRadius: '999px', 
                            overflow: 'hidden',
                            marginBottom: '12px'
                          }}>
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${(pushProgress.current / pushProgress.total) * 100}%` }}
                              transition={{ duration: 0.3 }}
                              style={{
                                height: '100%',
                                background: 'linear-gradient(90deg, #8B5CF6 0%, #7C3AED 100%)',
                                borderRadius: '999px'
                              }}
                            />
                          </div>
                          <div style={{ 
                            fontSize: '15px', 
                            color: '#64748B',
                            fontWeight: 600
                          }}>
                            {pushProgress.current} / {pushProgress.total} records processed
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', duration: 0.6 }}
                      >
                        <Sparkles size={56} style={{ color: '#10B981', marginBottom: '24px' }} />
                      </motion.div>
                      <h3 style={{ fontSize: '20px', fontWeight: 700, color: '#1E293B', marginBottom: '10px' }}>
                        All Set!
                      </h3>
                      <p style={{ color: '#64748B', fontSize: '14px' }}>
                        Your records have been successfully pushed to Zoho Creator
                      </p>
                    </>
                  )}
                </div>
              </motion.div>
            )}
          </div>

          {/* Footer Actions */}
          <div style={{ 
            padding: '16px 20px', 
            borderTop: '1px solid #E2E8F0',
            background: 'white',
            display: 'flex',
            justifyContent: 'space-between',
            gap: '10px'
          }}>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => step > 1 && setStep(step - 1)}
              disabled={step === 1 || isPushing}
              style={{
                padding: '10px 20px',
                borderRadius: '10px',
                border: '2px solid #E2E8F0',
                background: 'white',
                color: '#64748B',
                fontWeight: 600,
                fontSize: '13px',
                cursor: step === 1 || isPushing ? 'not-allowed' : 'pointer',
                opacity: step === 1 || isPushing ? 0.5 : 1
              }}
            >
              Back
            </motion.button>

            <div style={{ display: 'flex', gap: '10px' }}>
              {step === 1 && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={fetchZohoFields}
                  disabled={isLoadingFields || !config.owner_name || !config.app_name || !config.form_name}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '10px 24px',
                    borderRadius: '10px',
                    border: 'none',
                    background: isLoadingFields || !config.owner_name || !config.app_name || !config.form_name
                      ? '#E5E7EB'
                      : 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)',
                    color: isLoadingFields || !config.owner_name || !config.app_name || !config.form_name ? '#94A3B8' : 'white',
                    fontWeight: 600,
                    fontSize: '13px',
                    cursor: isLoadingFields || !config.owner_name || !config.app_name || !config.form_name ? 'not-allowed' : 'pointer',
                    boxShadow: isLoadingFields || !config.owner_name || !config.app_name || !config.form_name ? 'none' : '0 4px 12px rgba(139, 92, 246, 0.3)'
                  }}
                >
                  {isLoadingFields ? (
                    <>
                      <Loader2 size={14} className="spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      Continue
                      <ChevronRight size={14} />
                    </>
                  )}
                </motion.button>
              )}

              {step === 2 && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handlePushToZoho}
                  disabled={isPushing}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '10px 24px',
                    borderRadius: '10px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                    color: 'white',
                    fontWeight: 600,
                    fontSize: '13px',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
                  }}
                >
                  <Upload size={14} />
                  Push to Zoho
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