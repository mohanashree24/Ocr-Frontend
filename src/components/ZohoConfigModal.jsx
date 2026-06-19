import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, Settings, ArrowRight, Check, AlertCircle,
  Database, Upload, Loader2, ChevronRight, Sparkles
} from 'lucide-react'
import toast from 'react-hot-toast'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const SOURCE_FIELDS = [
  { key: 'scholar_name',               label: 'Scholar name',        required: true  },
  { key: 'scholar_id',                 label: 'Scholar ID',          required: true  },
  { key: 'tracking_id',                label: 'Tracking ID',         required: false },
  { key: 'bank_data.account_number',   label: 'Account number',      required: false },
  { key: 'bank_data.bank_name',        label: 'Bank name',           required: false },
  { key: 'bank_data.account_holder_name', label: 'Account holder',   required: false },
  { key: 'bank_data.ifsc_code',        label: 'IFSC code',           required: false },
  { key: 'bank_data.branch_name',      label: 'Branch name',         required: false },
  { key: 'bill_data',                  label: 'Bill data (full)',     required: false },
  ...Array.from({ length: 8 }, (_, i) => ({
    key:      `bill_data[${i}].amount`,
    label:    `Bill ${i + 1} amount`,
    required: false,
  })),
]

const SYNC_MODES = [
  { id: 'auto',   label: 'Auto',         sub: 'Insert + update'  },
  { id: 'insert', label: 'Insert only',  sub: 'Create new'       },
  { id: 'update', label: 'Update only',  sub: 'Modify existing'  },
]

const STEPS = [
  { num: 1, label: 'Configure'  },
  { num: 2, label: 'Map fields' },
  { num: 3, label: 'Push'       },
]

/* ─── tiny helpers ──────────────────────────────────────────── */
const inputBase = {
  width: '100%',
  boxSizing: 'border-box',
  padding: '9px 12px',
  borderRadius: 8,
  border: '0.5px solid var(--color-border-secondary, #d1d5db)',
  fontSize: 13,
  fontFamily: 'inherit',
  background: 'var(--color-background-secondary, #f9fafb)',
  color: 'var(--color-text-primary, #111827)',
  outline: 'none',
  transition: 'border-color 0.15s, box-shadow 0.15s',
}

function TextInput({ id, placeholder, value, onChange }) {
  return (
    <input
      id={id}
      type="text"
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      style={inputBase}
      onFocus={e => {
        e.target.style.borderColor = '#F97316'
        e.target.style.boxShadow  = '0 0 0 3px rgba(249,115,22,.12)'
      }}
      onBlur={e => {
        e.target.style.borderColor = ''
        e.target.style.boxShadow   = ''
      }}
    />
  )
}

function Label({ children }) {
  return (
    <label style={{ fontSize: 12, color: 'var(--color-text-secondary,#6b7280)', display: 'block', marginBottom: 6 }}>
      {children}
    </label>
  )
}

function Required() {
  return <span style={{ color: 'var(--color-text-danger,#ef4444)', marginLeft: 3 }}>*</span>
}

/* ─── main component ─────────────────────────────────────────── */
export default function ZohoConfigModal({
  isOpen,
  onClose,
  selectedRecords,
  onSuccess,
  todayOnly = true,
}) {
  const [step,        setStep]        = useState(1)
  const [config,      setConfig]      = useState({ owner_name: '', app_name: '', form_name: '', report_name: '' })
  const [syncMode,    setSyncMode]    = useState('auto')
  const [fieldMapping, setFieldMapping] = useState({})
  const [zohoFields,  setZohoFields]  = useState([])
  const [isLoading,   setIsLoading]   = useState(false)
  const [isPushing,   setIsPushing]   = useState(false)
  const [pushResult,  setPushResult]  = useState(null)

  /* lock body scroll */
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : ''
    if (isOpen) {
      // Reset state when modal opens
      setStep(1)
      setConfig({ owner_name: '', app_name: '', form_name: '' })
      setFieldMapping({})
      setZohoFields([])
      setPushResult(null)
    }
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  const setField = useCallback((key, val) => setConfig(c => ({ ...c, [key]: val })), [])

  /* derived config validity */
  const needsForm   = syncMode === 'auto' || syncMode === 'insert'
  const needsReport = syncMode === 'auto' || syncMode === 'update'
  const step1Valid  =
    config.owner_name.trim() &&
    config.app_name.trim()   &&
    (!needsForm   || config.form_name.trim())   &&
    (!needsReport || config.report_name.trim())

  /* fetch zoho fields */
  async function fetchFields() {
    setIsLoading(true)
    try {
      const res  = await fetch(`${API_BASE_URL}/zoho/get-form-fields`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          owner_name: config.owner_name,
          app_name:   config.app_name,
          form_name:  config.form_name,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setZohoFields(data.fields || [])
        toast.success(`Loaded ${data.fields.length} Zoho fields`)
        setStep(2)
      } else {
        toast.error(data.error || 'Failed to fetch Zoho fields')
      }
    } catch (err) {
      toast.error(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  /* push records */
  async function handlePush() {
    const missing = SOURCE_FIELDS.filter(f => f.required && !fieldMapping[f.key])
    if (missing.length) {
      toast.error(`Map required fields: ${missing.map(f => f.label).join(', ')}`)
      return
    }
    setIsPushing(true)
    setStep(3)
    try {
      const res    = await fetch(`${API_BASE_URL}/zoho/sync-records?today_only=${todayOnly}`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          config,
          field_mapping: fieldMapping,
          record_ids:    Array.from(selectedRecords),
          sync_mode:     syncMode,
        }),
      })
      const result = await res.json()
      if (result.success && result.details) {
        setPushResult(result.details)
        toast.success(`Pushed ${result.details.successful ?? result.details.inserted ?? 0} records!`)
        onSuccess(result.details)
        setTimeout(onClose, 2500)
      } else {
        toast.error(result.error || 'Failed to push records')
        setStep(2)
      }
    } catch (err) {
      toast.error(err.message)
      setStep(2)
    } finally {
      setIsPushing(false)
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
    // Start the job (server endpoint: sync-records) with today_only param
    const response = await fetch(`${API_BASE_URL}/zoho/sync-records?today_only=${todayOnly}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        config: config,
        field_mapping: fieldMapping,
        record_ids: Array.from(selectedRecords)
      })
    })

    const result = await response.json()

    if (result.success && result.details) {
      // Server returns sync details immediately for sync-records
      const details = result.details
      setPushProgress({ current: details.total_records || (details.inserted || 0), total: details.total_records || (details.inserted || 0) })
      setIsPushing(false)
      toast.success(
        `🎉 Successfully pushed ${details.successful || details.inserted || 0}/${details.total_records || details.inserted || 0} records!`,
        { duration: 5000, style: { background: '#10B981', color: 'white', fontWeight: 600 } }
      )
      onSuccess(details)
      setTimeout(() => onClose(), 2000)
    } else {
      toast.error(result.error || 'Failed to push records')
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
    <AnimatePresence>
      <motion.div
        key="backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        style={{
          position:       'fixed', inset: 0,
          background:     'rgba(0,0,0,0.55)',
          backdropFilter: 'blur(8px)',
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'center',
          zIndex:         9999,
          padding:        16,
          overflowY:      'auto',
        }}
      >
        <motion.div
          key="modal"
          initial={{ scale: 0.96, y: 16, opacity: 0 }}
          animate={{ scale: 1,    y: 0,  opacity: 1 }}
          exit={{    scale: 0.96, y: 16, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 340, damping: 30 }}
          onClick={e => e.stopPropagation()}
          style={{
            background:   'var(--color-background-primary, #fff)',
            borderRadius: 20,
            width:        '100%',
            maxWidth:     640,
            maxHeight:    '88vh',
            overflow:     'hidden',
            display:      'flex',
            flexDirection:'column',
            border:       '0.5px solid var(--color-border-tertiary, #e5e7eb)',
            boxShadow:    '0 24px 48px rgba(0,0,0,0.18)',
            margin:       'auto',
          }}
        >
          {/* ── Header ─────────────────────────────────────────── */}
          <div style={{ background: '#F97316', padding: '20px 24px 0', position: 'relative', overflow: 'hidden' }}>
            {/* decorative blobs */}
            <div style={{ position:'absolute', top:-60, right:-40, width:200, height:200, background:'rgba(255,255,255,.08)', borderRadius:'50%' }} />
            <div style={{ position:'absolute', bottom:-30, left:20, width:110, height:110, background:'rgba(255,255,255,.06)', borderRadius:'50%' }} />

            <div style={{ position:'relative', zIndex:1, display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:18 }}>
              <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                <div style={{ width:40, height:40, background:'rgba(255,255,255,.2)', borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <Database size={20} color="white" />
                </div>
                <div>
                  <h2 style={{ margin:0, fontSize:17, fontWeight:500, color:'white' }}>Push to Zoho Creator</h2>
                  <p style={{ margin:'2px 0 0', fontSize:12, color:'rgba(255,255,255,.8)' }}>
                    Sync {selectedRecords.length} selected records
                  </p>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.92 }}
                onClick={onClose}
                aria-label="Close"
                style={{ width:32, height:32, borderRadius:'50%', background:'rgba(255,255,255,.18)', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'white' }}
              >
                <X size={15} />
              </motion.button>
            </div>

            {/* step tabs */}
            <div style={{ position:'relative', zIndex:1, display:'flex' }}>
              {STEPS.map((s, i) => {
                const active = step === s.num
                const done   = step > s.num
                return (
                  <button
                    key={s.num}
                    onClick={() => done && setStep(s.num)}
                    style={{
                      flex:1, padding:'10px 8px', background:'transparent', border:'none',
                      borderBottom: active ? '3px solid white' : '3px solid rgba(255,255,255,.3)',
                      cursor: done ? 'pointer' : 'default', textAlign:'center',
                      transition: 'border-color 0.2s',
                    }}
                  >
                    <div style={{
                      width:22, height:22, borderRadius:'50%', margin:'0 auto 5px',
                      background: (active || done) ? 'white' : 'rgba(255,255,255,.3)',
                      color: (active || done) ? '#F97316' : 'white',
                      fontSize:11, fontWeight:500, display:'flex', alignItems:'center', justifyContent:'center',
                    }}>
                      {done ? <Check size={12} /> : s.num}
                    </div>
                    <div style={{ fontSize:11, color: active ? 'white' : 'rgba(255,255,255,.65)', fontWeight:500 }}>
                      {s.label}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* ── Body ───────────────────────────────────────────── */}
          <div style={{ flex:1, overflowY:'auto', padding:20, background:'var(--color-background-tertiary, #f9fafb)' }}>
            <AnimatePresence mode="wait">
              {/* STEP 1 */}
              {step === 1 && (
                <motion.div key="s1" initial={{ opacity:0, x:-16 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-16 }} transition={{ duration:.18 }}>
                  <Card>
                    <SectionTitle>Zoho configuration</SectionTitle>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:16 }}>
                      <div>
                        <Label>Owner name <Required /></Label>
                        <TextInput placeholder="yourcompany" value={config.owner_name} onChange={e => setField('owner_name', e.target.value)} />
                      </div>
                      <div>
                        <Label>App name <Required /></Label>
                        <TextInput placeholder="scholarship-app" value={config.app_name} onChange={e => setField('app_name', e.target.value)} />
                      </div>
                    </div>

                    <Label>Sync mode</Label>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8, marginBottom:16 }}>
                      {SYNC_MODES.map(m => (
                        <button
                          key={m.id}
                          onClick={() => setSyncMode(m.id)}
                          style={{
                            padding: '10px 8px', borderRadius:8, textAlign:'center', cursor:'pointer',
                            border:      syncMode === m.id ? '2px solid #F97316' : '0.5px solid var(--color-border-tertiary)',
                            background:  syncMode === m.id ? 'rgba(249,115,22,.06)' : 'var(--color-background-secondary)',
                            transition: 'all 0.15s',
                          }}
                        >
                          <div style={{ fontSize:12, fontWeight:500, color: syncMode === m.id ? '#F97316' : 'var(--color-text-primary)' }}>{m.label}</div>
                          <div style={{ fontSize:10, color:'var(--color-text-secondary)', marginTop:2 }}>{m.sub}</div>
                        </button>
                      ))}
                    </div>

                    {needsForm && (
                      <motion.div key="form" initial={{ opacity:0, y:-6 }} animate={{ opacity:1, y:0 }} style={{ marginBottom:12 }}>
                        <Label>Form name <Required /></Label>
                        <TextInput placeholder="Student_Details" value={config.form_name} onChange={e => setField('form_name', e.target.value)} />
                        <FieldHint>Required for creating new records via Zoho V2 API</FieldHint>
                      </motion.div>
                    )}
                    {needsReport && (
                      <motion.div key="report" initial={{ opacity:0, y:-6 }} animate={{ opacity:1, y:0 }}>
                        <Label>Report link name <Required /></Label>
                        <TextInput placeholder="All_Student_Details" value={config.report_name} onChange={e => setField('report_name', e.target.value)} />
                        <FieldHint>Required for querying and updating existing records</FieldHint>
                      </motion.div>
                    )}
                  </Card>

                  <InfoBox icon={<AlertCircle size={14} color="#D97706" style={{ flexShrink:0, marginTop:1 }} />} bg="rgba(245,158,11,.08)" border="rgba(245,158,11,.3)">
                    Ensure valid Zoho Creator API credentials are configured in your backend{' '}
                    <code style={{ fontSize:11, background:'var(--color-background-secondary)', padding:'1px 5px', borderRadius:4 }}>.env</code> file.
                  </InfoBox>
                </motion.div>
              )}

              {/* STEP 2 */}
              {step === 2 && (
                <motion.div key="s2" initial={{ opacity:0, x:16 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:16 }} transition={{ duration:.18 }}>
                  <Card>
                    <SectionTitle>Field mapping</SectionTitle>
                    <p style={{ fontSize:12, color:'var(--color-text-secondary)', margin:'0 0 14px' }}>
                      Map your source fields to Zoho Creator form fields
                    </p>

                    <div style={{ display:'grid', gridTemplateColumns:'1fr 20px 1fr', gap:8, padding:'0 4px', marginBottom:8 }}>
                      <ColHead>Source field</ColHead>
                      <div />
                      <ColHead>Zoho field</ColHead>
                    </div>

                    <div style={{ display:'flex', flexDirection:'column', gap:8, maxHeight:380, overflowY:'auto', paddingRight:2 }}>
                      {SOURCE_FIELDS.map(sf => (
                        <div
                          key={sf.key}
                          style={{
                            display:'grid', gridTemplateColumns:'1fr 20px 1fr', gap:8, alignItems:'center',
                            padding:'10px 12px', background:'var(--color-background-secondary)',
                            borderRadius:8, border:'0.5px solid var(--color-border-tertiary)',
                          }}
                        >
                          <div>
                            <div style={{ fontSize:12, fontWeight:500, color:'var(--color-text-primary)' }}>
                              {sf.label}{sf.required && <Required />}
                            </div>
                            <div style={{ fontSize:10, color:'var(--color-text-tertiary)', fontFamily:'monospace', marginTop:2 }}>
                              {sf.key}
                            </div>
                          </div>
                          <ArrowRight size={13} color="#F97316" />
                          <select
                            value={fieldMapping[sf.key] || ''}
                            onChange={e => setFieldMapping(m => ({ ...m, [sf.key]: e.target.value }))}
                            style={{
                              ...inputBase, padding:'7px 10px', cursor:'pointer',
                              background:'var(--color-background-primary)',
                            }}
                            onFocus={e  => { e.target.style.borderColor='#F97316' }}
                            onBlur={e   => { e.target.style.borderColor='' }}
                          >
                            <option value="">Select field…</option>
                            {zohoFields.map(zf => <option key={zf} value={zf}>{zf}</option>)}
                          </select>
                        </div>
                      ))}
                    </div>
                  </Card>
                </motion.div>
              )}

              {/* STEP 3 */}
              {step === 3 && (
                <motion.div key="s3" initial={{ opacity:0, scale:.97 }} animate={{ opacity:1, scale:1 }} transition={{ duration:.2 }}>
                  <Card centered minHeight={320}>
                    {isPushing ? (
                      <>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration:.9, repeat: Infinity, ease:'linear' }}
                          style={{ marginBottom:20 }}
                        >
                          <Loader2 size={52} color="#F97316" />
                        </motion.div>
                        <h3 style={{ fontSize:17, fontWeight:500, color:'var(--color-text-primary)', margin:'0 0 8px' }}>
                          Syncing records…
                        </h3>
                        <p style={{ fontSize:13, color:'var(--color-text-secondary)', margin:0 }}>
                          This may take a moment
                        </p>
                      </>
                    ) : pushResult ? (
                      <>
                        <motion.div
                          initial={{ scale:0 }}
                          animate={{ scale:1 }}
                          transition={{ type:'spring', stiffness:280, damping:22 }}
                          style={{
                            width:60, height:60, borderRadius:'50%', background:'rgba(16,185,129,.12)',
                            display:'flex', alignItems:'center', justifyContent:'center', marginBottom:20,
                          }}
                        >
                          <Check size={28} color="#10B981" />
                        </motion.div>
                        <h3 style={{ fontSize:18, fontWeight:500, color:'var(--color-text-primary)', margin:'0 0 8px' }}>
                          All done!
                        </h3>
                        <p style={{ fontSize:13, color:'var(--color-text-secondary)', margin:'0 0 20px' }}>
                          Records pushed successfully
                        </p>
                        <div style={{ display:'flex', gap:10, flexWrap:'wrap', justifyContent:'center' }}>
                          <Pill color="#10B981" bg="rgba(16,185,129,.1)">{pushResult.inserted ?? 0} inserted</Pill>
                          <Pill color="#F97316"  bg="rgba(249,115,22,.1)" >{pushResult.updated  ?? 0} updated</Pill>
                          <Pill color="#EF4444"  bg="rgba(239,68,68,.1)"  >{pushResult.failed   ?? 0} failed</Pill>
                        </div>
                      </>
                    ) : null}
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ── Footer ─────────────────────────────────────────── */}
          <div style={{
            padding: '14px 20px',
            borderTop: '0.5px solid var(--color-border-tertiary)',
            background: 'var(--color-background-primary)',
            display: 'flex', justifyContent:'space-between', alignItems:'center',
          }}>
            <motion.button
              whileHover={step > 1 && !isPushing ? { scale:1.03 } : {}}
              whileTap={ step > 1 && !isPushing ? { scale:.97 } : {}}
              onClick={() => step > 1 && !isPushing && setStep(s => s - 1)}
              disabled={step === 1 || isPushing}
              style={{
                padding:'8px 18px', borderRadius:8, border:'0.5px solid var(--color-border-secondary)',
                background:'transparent', fontSize:13, color:'var(--color-text-secondary)',
                cursor: step === 1 || isPushing ? 'not-allowed' : 'pointer',
                opacity: step === 1 || isPushing ? 0.4 : 1, transition:'opacity .2s',
              }}
            >
              ← Back
            </motion.button>

            {/* step dots */}
            <div style={{ display:'flex', gap:6, alignItems:'center' }}>
              {STEPS.map(s => (
                <div
                  key={s.num}
                  style={{
                    width:  step === s.num ? 18 : 6,
                    height: 6, borderRadius:999,
                    background: step === s.num ? '#F97316' : step > s.num ? '#F9C3A0' : 'var(--color-border-tertiary)',
                    transition: 'all .25s',
                  }}
                />
              ))}
            </div>

            {/* right action */}
            {step === 1 && (
              <motion.button
                whileHover={step1Valid && !isLoading ? { scale:1.03 } : {}}
                whileTap={ step1Valid && !isLoading ? { scale:.97 } : {}}
                onClick={fetchFields}
                disabled={!step1Valid || isLoading}
                style={{
                  display:'flex', alignItems:'center', gap:6, padding:'8px 20px',
                  borderRadius:8, border:'none', fontSize:13, fontWeight:500,
                  cursor: !step1Valid || isLoading ? 'not-allowed' : 'pointer',
                  background: !step1Valid || isLoading ? 'var(--color-background-secondary)' : '#F97316',
                  color:      !step1Valid || isLoading ? 'var(--color-text-tertiary)'   : 'white',
                  transition: 'background .15s',
                  boxShadow:  !step1Valid || isLoading ? 'none' : '0 4px 12px rgba(249,115,22,.28)',
                }}
              >
                {isLoading
                  ? <><Loader2 size={13} style={{ animation:'spin 1s linear infinite' }} /> Loading…</>
                  : <>Load fields <ChevronRight size={13} /></>
                }
              </motion.button>
            )}

            {step === 2 && (
              <motion.button
                whileHover={{ scale:1.03 }}
                whileTap={{ scale:.97 }}
                onClick={handlePush}
                style={{
                  display:'flex', alignItems:'center', gap:6, padding:'8px 20px',
                  borderRadius:8, border:'none', fontSize:13, fontWeight:500,
                  background:'#10B981', color:'white', cursor:'pointer',
                  boxShadow:'0 4px 12px rgba(16,185,129,.28)',
                }}
              >
                <Upload size={13} /> Push to Zoho
              </motion.button>
            )}

            {step === 3 && !isPushing && pushResult && (
              <motion.button
                whileHover={{ scale:1.03 }}
                whileTap={{ scale:.97 }}
                onClick={onClose}
                style={{
                  display:'flex', alignItems:'center', gap:6, padding:'8px 20px',
                  borderRadius:8, border:'none', fontSize:13, fontWeight:500,
                  background:'#10B981', color:'white', cursor:'pointer',
                }}
              >
                <Sparkles size={13} /> Close
              </motion.button>
            )}
          </div>
        </motion.div>
      </motion.div>

      <style key="modal-css">{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </AnimatePresence>
  )
}

/* ─── micro sub-components ───────────────────────────────────── */
function Card({ children, centered, minHeight }) {
  return (
    <div style={{
      background: 'var(--color-background-primary)',
      borderRadius: 14,
      padding: 20,
      border: '0.5px solid var(--color-border-tertiary)',
      marginBottom: 12,
      ...(centered ? { display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', textAlign:'center' } : {}),
      ...(minHeight ? { minHeight } : {}),
    }}>
      {children}
    </div>
  )
}

function SectionTitle({ children }) {
  return (
    <div style={{ fontSize:11, fontWeight:500, color:'var(--color-text-tertiary)', textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:14 }}>
      {children}
    </div>
  )
}

function ColHead({ children }) {
  return (
    <div style={{ fontSize:10, fontWeight:500, color:'var(--color-text-tertiary)', textTransform:'uppercase', letterSpacing:'0.07em' }}>
      {children}
    </div>
  )
}

function FieldHint({ children }) {
  return (
    <div style={{ fontSize:11, color:'var(--color-text-tertiary)', marginTop:4, marginBottom:0 }}>
      {children}
    </div>
  )
}

function InfoBox({ children, icon, bg, border }) {
  return (
    <div style={{
      background: bg, border: `0.5px solid ${border}`,
      borderRadius: 8, padding:'11px 14px', display:'flex', gap:10, alignItems:'flex-start',
    }}>
      {icon}
      <div style={{ fontSize:12, color:'var(--color-text-secondary)', lineHeight:1.6 }}>{children}</div>
    </div>
  )
}

function Pill({ children, color, bg }) {
  return (
    <div style={{ padding:'6px 14px', borderRadius:6, background:bg, fontSize:12, fontWeight:500, color }}>
      {children}
    </div>
  )
}