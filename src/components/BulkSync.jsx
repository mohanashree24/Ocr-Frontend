import { useState } from 'react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { Upload, RefreshCw, Database, CheckCircle, XCircle, Loader2, AlertCircle } from 'lucide-react'
import ZohoConfigModal from './ZohoConfigModal'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export default function BulkSync({ selectedRecords = [] }) {
  const [isSyncing, setIsSyncing] = useState(false)
  const [syncResult, setSyncResult] = useState(null)
  const [syncProgress, setSyncProgress] = useState(null)
  const [showZohoModal, setShowZohoModal] = useState(false)
  const [todayOnly, setTodayOnly] = useState(true)
  const [isRetryingFailed, setIsRetryingFailed] = useState(false)
  const [failedCount, setFailedCount] = useState(0)

  const handleBulkSync = async () => {
    setIsSyncing(true)
    setSyncResult(null)
    
    try {
      const dateFilter = todayOnly ? " (Today's data only)" : ""
      toast.loading(`Starting bulk sync to Zoho Creator${dateFilter}...`, { id: 'bulk-sync' })
      
      const response = await fetch(
        `${API_BASE_URL}/sync/bulk-push-to-zoho?limit=1000&today_only=${todayOnly}`, 
        { method: 'POST' }
      )
      
      const result = await response.json()
      
      if (result.success) {
        setSyncResult(result.details)
        
        let message = `Sync complete! ${result.details.successful}/${result.details.total_records} records synced`
        if (result.failed_extractions && result.failed_extractions.length > 0) {
          message += `\n⚠️ ${result.failed_extractions.length} records need re-extraction`
          setFailedCount(result.failed_extractions.length)
        }
        
        toast.success(message, { id: 'bulk-sync', duration: 5000 })
      } else {
        toast.error('Sync failed: ' + (result.error || result.message), { id: 'bulk-sync' })
      }
    } catch (error) {
      toast.error('Error: ' + error.message, { id: 'bulk-sync' })
    } finally {
      setIsSyncing(false)
    }
  }

  const handleRetryFailedExtractions = async () => {
    setIsRetryingFailed(true)
    
    try {
      toast.loading('Retrying failed extractions...', { id: 'retry-failed' })
      
      const formData = new FormData()
      formData.append('app_link_name', 'teameverest/iatc-scholarship')
      formData.append('report_link_name', 'Active_Scholar_Fee_Request_Signup_Report')
      formData.append('bank_field_name', 'Bank_Passbook')
      formData.append('bill_field_name', 'Bill')
      formData.append('today_only', todayOnly)
      
      const response = await fetch(`${API_BASE_URL}/ocr/auto-extract/retry-failed`, {
        method: 'POST',
        body: formData
      })
      
      const result = await response.json()
      
      if (result.success) {
        toast.success(
          `🔄 Retrying ${result.failed_count} failed records. Job ID: ${result.job_id}`,
          { id: 'retry-failed', duration: 5000 }
        )
        setFailedCount(0)
      } else {
        toast.error('Retry failed: ' + (result.error || result.message), { id: 'retry-failed' })
      }
    } catch (error) {
      toast.error('Error: ' + error.message, { id: 'retry-failed' })
    } finally {
      setIsRetryingFailed(false)
    }
  }

  return (
    <div className="glass-card" style={{ padding: '32px', marginBottom: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
        <Database size={28} style={{ color: '#F97316' }} />
        <h2 style={{ 
          margin: 0, 
          fontSize: '24px', 
          fontWeight: 800,
          background: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          Bulk Sync to Zoho Creator
        </h2>
      </div>

      <p style={{ color: '#64748B', marginBottom: '24px' }}>
        Sync successfully extracted results from Supabase to Zoho Creator. Failed extractions will be paused and must be re-run before pushing.
      </p>

      {failedCount > 0 && (
        <div style={{
          padding: '16px',
          marginBottom: '20px',
          background: 'rgba(245, 158, 11, 0.1)',
          border: '2px solid #F59E0B',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <AlertCircle size={24} style={{ color: '#F59E0B', flexShrink: 0 }} />
          <div>
            <div style={{ fontWeight: 700, color: '#92400E', marginBottom: '4px' }}>
              ⚠️ {failedCount} Failed Extractions Found
            </div>
            <div style={{ fontSize: '14px', color: '#78350F' }}>
              These records need to be re-extracted before they can be pushed to Zoho. Click "Retry Failed Extractions" to re-run them.
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: '16px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <label style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '8px', 
          cursor: 'pointer',
          padding: '12px 16px',
          borderRadius: '8px',
          background: todayOnly ? 'rgba(249, 115, 22, 0.1)' : 'rgba(100, 116, 139, 0.05)',
          border: `2px solid ${todayOnly ? '#F97316' : '#E2E8F0'}`,
          transition: 'all 0.2s'
        }}>
          <input 
            type="checkbox" 
            checked={todayOnly}
            onChange={(e) => setTodayOnly(e.target.checked)}
            style={{ width: '18px', height: '18px', cursor: 'pointer' }}
          />
          <span style={{ fontWeight: 600, color: todayOnly ? '#F97316' : '#64748B' }}>
            📅 Today's Data Only
          </span>
        </label>
      </div>

      <div style={{ display: 'flex', gap: '12px', marginBottom: '12px', flexWrap: 'wrap' }}>
        {failedCount > 0 && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleRetryFailedExtractions}
            disabled={isRetryingFailed}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '16px 32px',
              borderRadius: '12px',
              border: 'none',
              background: isRetryingFailed 
                ? 'linear-gradient(135deg, #94A3B8 0%, #64748B 100%)'
                : 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
              color: 'white',
              fontWeight: 700,
              fontSize: '16px',
              cursor: isRetryingFailed ? 'not-allowed' : 'pointer',
              boxShadow: '0 8px 24px rgba(245, 158, 11, 0.4)',
              transition: 'all 0.3s'
            }}
          >
            {isRetryingFailed ? (
              <>
                <Loader2 size={20} className="spin" />
                Retrying...
              </>
            ) : (
              <>
                <RefreshCw size={20} />
                Retry {failedCount} Failed Extractions
              </>
            )}
          </motion.button>
        )}
        
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowZohoModal(true)}
          disabled={isSyncing || (Array.isArray(selectedRecords) ? selectedRecords.length === 0 : Array.from(selectedRecords || []).length === 0)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '16px 32px',
            borderRadius: '12px',
            border: 'none',
            background: isSyncing 
              ? 'linear-gradient(135deg, #94A3B8 0%, #64748B 100%)'
              : 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
            color: 'white',
            fontWeight: 700,
            fontSize: '16px',
            cursor: isSyncing ? 'not-allowed' : 'pointer',
            boxShadow: '0 8px 24px rgba(249, 115, 22, 0.4)',
            transition: 'all 0.3s'
          }}
        >
          {isSyncing ? (
            <>
              <Loader2 size={20} className="spin" />
              Syncing...
            </>
          ) : (
            <>
              <Upload size={20} />
              Push Selected to Zoho
            </>
          )}
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleBulkSync}
          disabled={isSyncing}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '16px 24px',
            borderRadius: '12px',
            border: 'none',
            background: isSyncing 
              ? 'linear-gradient(135deg, #94A3B8 0%, #64748B 100%)'
              : 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)',
            color: 'white',
            fontWeight: 700,
            fontSize: '16px',
            cursor: isSyncing ? 'not-allowed' : 'pointer',
            boxShadow: '0 8px 24px rgba(249, 115, 22, 0.4)',
            transition: 'all 0.3s'
          }}
        >
          {isSyncing ? (
            <>
              <Loader2 size={20} className="spin" />
              Syncing...
            </>
          ) : (
            <>
              <Database size={18} />
              Start Full Bulk Sync
            </>
          )}
        </motion.button>
      </div>

      {syncResult && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            marginTop: '24px',
            padding: '24px',
            background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.05) 0%, rgba(255, 255, 255, 1) 100%)',
            borderRadius: '12px',
            border: '1px solid rgba(249, 115, 22, 0.2)'
          }}
        >
          <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px', color: '#1E293B' }}>
            Sync Results
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '20px' }}>
            <div style={{ padding: '16px', background: 'white', borderRadius: '12px', border: '2px solid #E5E7EB' }}>
              <div style={{ fontSize: '12px', color: '#64748B', fontWeight: 600, marginBottom: '4px' }}>
                Total Records
              </div>
              <div style={{ fontSize: '32px', fontWeight: 800, color: '#F97316' }}>
                {syncResult.total_records}
              </div>
            </div>

            <div style={{ padding: '16px', background: 'white', borderRadius: '12px', border: '2px solid #10B981' }}>
              <div style={{ fontSize: '12px', color: '#64748B', fontWeight: 600, marginBottom: '4px' }}>
                <CheckCircle size={14} style={{ display: 'inline', marginRight: '4px' }} />
                Successful
              </div>
              <div style={{ fontSize: '32px', fontWeight: 800, color: '#10B981' }}>
                {syncResult.successful}
              </div>
            </div>

            <div style={{ padding: '16px', background: 'white', borderRadius: '12px', border: '2px solid #EF4444' }}>
              <div style={{ fontSize: '12px', color: '#64748B', fontWeight: 600, marginBottom: '4px' }}>
                <XCircle size={14} style={{ display: 'inline', marginRight: '4px' }} />
                Failed
              </div>
              <div style={{ fontSize: '32px', fontWeight: 800, color: '#EF4444' }}>
                {syncResult.failed}
              </div>
            </div>
          </div>

          {syncResult.errors && syncResult.errors.length > 0 && (
            <div style={{
              padding: '16px',
              background: 'rgba(239, 68, 68, 0.05)',
              borderRadius: '8px',
              border: '1px solid rgba(239, 68, 68, 0.2)'
            }}>
              <div style={{ fontSize: '14px', fontWeight: 600, color: '#DC2626', marginBottom: '8px' }}>
                Errors:
              </div>
              {syncResult.errors.map((error, idx) => (
                <div key={idx} style={{ fontSize: '13px', color: '#64748B', marginBottom: '4px' }}>
                  Batch {error.batch}: {error.error}
                </div>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* Zoho Config / Mapping Modal for selected push */}
      <ZohoConfigModal
        isOpen={showZohoModal}
        onClose={() => setShowZohoModal(false)}
        selectedRecords={Array.isArray(selectedRecords) ? selectedRecords : Array.from(selectedRecords || [])}
        todayOnly={todayOnly}
        onSuccess={(progress) => {
          // Show results in the panel and toast
          setSyncResult({
            total_records: progress.total_records || (progress.total || 0),
            successful: progress.successful_records || (progress.successful || 0),
            failed: (progress.total_records || progress.total || 0) - (progress.successful_records || progress.successful || 0),
            errors: progress.errors || []
          })
          toast.success(`Pushed ${progress.successful_records || progress.successful || 0} records`) 
          setShowZohoModal(false)
        }}
      />
    </div>
  )
}