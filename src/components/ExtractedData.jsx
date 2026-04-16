import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import toast, { Toaster } from 'react-hot-toast'
import * as XLSX from 'xlsx'
import {
  Database,
  RefreshCw,
  Search,
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  Upload,
  CheckCircle,
  XCircle,
  Check,
  X,
  TrendingUp,
  FileText,
  Building,
  CreditCard,
  Sparkles,
  Filter
} from 'lucide-react'
import { createClient } from '@supabase/supabase-js'
import ZohoConfigModal from './ZohoConfigModal'

// Initialize Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://ohfnriyabohbvgxebllt.supabase.co'
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9oZm5yaXlhYm9oYnZneGVibGx0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ2ODI2MTksImV4cCI6MjA1MDI1ODYxOX0.KI_E7vVgzDPpKj5Sh0fZvfaG7h5mq6c5NmqfvU7vU7c'
const supabase = createClient(supabaseUrl, supabaseKey)

// Confetti animation component
const Confetti = () => {
  const particles = Array.from({ length: 50 })
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 9999 }}>
      {particles.map((_, i) => (
        <motion.div
          key={i}
          initial={{
            x: window.innerWidth / 2,
            y: window.innerHeight / 2,
            scale: 0,
            rotate: 0
          }}
          animate={{
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight,
            scale: [0, 1, 0],
            rotate: Math.random() * 360
          }}
          transition={{
            duration: 2,
            delay: Math.random() * 0.5,
            ease: "easeOut"
          }}
          style={{
            position: 'absolute',
            width: '10px',
            height: '10px',
            background: ['#F97316', '#10B981', '#EC4899', '#F59E0B', '#3B82F6'][i % 5],
            borderRadius: '50%'
          }}
        />
      ))}
    </div>
  )
}

export default function ExtractedData() {
  const [extractedData, setExtractedData] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [recordsPerPage, setRecordsPerPage] = useState(50) // Changed from 20 to 50 and made it mutable
  const [expandedRow, setExpandedRow] = useState(null)
  const [totalRecords, setTotalRecords] = useState(0)
  const [hoveredRow, setHoveredRow] = useState(null)
  const [selectedView, setSelectedView] = useState({})
  const [selectedBillIndex, setSelectedBillIndex] = useState({}) // Track which bill image to show

  // Tab state
  const [activeTab, setActiveTab] = useState('need_to_push') // 'need_to_push' or 'pushed'

  // Selection & Sync states
  const [selectedRecords, setSelectedRecords] = useState(new Set())
  const [isSyncing, setIsSyncing] = useState(false)
  const [syncProgress, setSyncProgress] = useState(null)
  const [syncResult, setSyncResult] = useState(null)
  const [showConfetti, setShowConfetti] = useState(false)

  // Zoho Modal state
  const [showZohoModal, setShowZohoModal] = useState(false)

  // Report Link Filter state
  const [reportLinkFilter, setReportLinkFilter] = useState('')
  const [reportLinkOptions, setReportLinkOptions] = useState([])
  const [isLoadingReportLinks, setIsLoadingReportLinks] = useState(false)
  
  // Date Filter state
  const [dateFilter, setDateFilter] = useState('all') // 'all', 'today', 'yesterday', 'last7days', 'last30days'
  const [isTableVisible, setIsTableVisible] = useState(true)

  useEffect(() => {
    fetchExtractedData()
  }, []) // Fetch all data once on mount

  const fetchExtractedData = async () => {
    setIsLoading(true)
    try {
      let allRecords = []
      let from = 0
      const limit = 1000 // Supabase max per query
      let hasMore = true

      console.log('📊 Fetching all records with pagination...')

      // Fetch in batches of 1000 until we get all records
      while (hasMore) {
        const { data, error } = await supabase
          .from('auto_extraction_results')
          .select('*')
          .order('id', { ascending: false })
          .range(from, from + limit - 1)

        if (error) {
          throw error
        }

        if (data && data.length > 0) {
          allRecords = [...allRecords, ...data]
          console.log(`📦 Batch ${Math.floor(from / limit) + 1}: Fetched ${data.length} records (Total: ${allRecords.length})`)

          // Check if there are more records
          if (data.length < limit) {
            hasMore = false
          } else {
            from += limit
          }
        } else {
          hasMore = false
        }

        // Safety check to prevent infinite loops
        if (allRecords.length > 50000) {
          console.warn('⚠️ Reached 50k records limit, stopping pagination')
          break
        }
      }

      console.log('✅ Total fetched:', allRecords.length, 'records')
      
      // Debug: Check tracking_id in first record
      if (allRecords.length > 0) {
        const firstRecord = allRecords[0]
        console.log('🔍 SUPABASE FETCH - First Record tracking_id check:')
        console.log('  tracking_id (lowercase):', firstRecord.tracking_id)
        console.log('  Tracking_id (mixed):', firstRecord.Tracking_id)
        console.log('  Tracking_ID (caps):', firstRecord.Tracking_ID)
        console.log('  All keys:', Object.keys(firstRecord))
      }
      
      console.log('🔍 Push_status distribution:', {
        pushed: allRecords.filter(r => r.Push_status === true || r.Push_status === 'true' || r.Push_status === 'pushed').length,
        notPushed: allRecords.filter(r => !r.Push_status || r.Push_status === false).length
      })

      setExtractedData(allRecords)
      setTotalRecords(allRecords.length)
      setCurrentPage(1)

      // Derive distinct report link names from loaded data
      const uniqueReportLinks = [...new Set(
        allRecords.map(r => r.report_link_name).filter(v => v && v.trim() !== '')
      )].sort()
      setReportLinkOptions(uniqueReportLinks)
      console.log('📋 Report link options:', uniqueReportLinks)

      toast.success(`✨ Loaded ${allRecords.length.toLocaleString()} records`, {
        style: {
          background: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)',
          color: 'white',
          fontWeight: 600
        }
      })
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('Failed to fetch extracted data: ' + error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const parseJsonField = (field) => {
    if (!field) return null
    if (typeof field === 'string') {
      try {
        return JSON.parse(field)
      } catch {
        return field
      }
    }
    return field
  }

  const formatBillDataText = (data) => {
    if (!data) return 'N/A'
    const items = Array.isArray(data) ? data : [data]
    if (items.length === 0) return 'N/A'

    return items.map((item, index) => {
      const prefix = items.length > 1 ? `Bill ${index + 1}: ` : ''
      return `${prefix}Student: ${item.student_name || 'N/A'} | College: ${item.college_name || 'N/A'} | Receipt: ${item.receipt_number || 'N/A'} | Roll: ${item.roll_number || 'N/A'} | Class: ${item.class_course || 'N/A'} | Date: ${item.bill_date || 'N/A'} | Amount: ₹${item.amount || 0}`
    }).join(' || ')
  }

  // Helper function to parse image URLs from JSON string format
  const parseImageUrl = (imageField, index = 0) => {
    if (!imageField) return null

    // If it's already a plain URL string, return it
    if (typeof imageField === 'string' && imageField.startsWith('http')) {
      return imageField
    }

    // If it's a JSON string like '["https://..."]', parse it
    if (typeof imageField === 'string') {
      try {
        const parsed = JSON.parse(imageField)
        // If it's an array, get the element at index (default 0)
        if (Array.isArray(parsed) && parsed.length > index) {
          console.log('✅ Parsed image URL:', parsed[index])
          return parsed[index]
        }
        // If it's a string after parsing, return it
        if (typeof parsed === 'string') {
          return parsed
        }
      } catch (e) {
        console.log('⚠️ Failed to parse image field:', imageField, e)
        // If parsing fails, return the original string
        return imageField
      }
    }

    // If it's already an array, get the element at index
    if (Array.isArray(imageField) && imageField.length > index) {
      return imageField[index]
    }

    return null
  }

  // Helper to get all image URLs from a field (for multiple bills)
  const parseAllImageUrls = (imageField) => {
    if (!imageField) return []

    // If it's a JSON string like '["url1", "url2"]', parse it
    if (typeof imageField === 'string') {
      try {
        const parsed = JSON.parse(imageField)
        if (Array.isArray(parsed)) {
          return parsed
        }
        return [parsed]
      } catch {
        return [imageField]
      }
    }

    // If it's already an array
    if (Array.isArray(imageField)) {
      return imageField
    }

    return [imageField]
  }

  const filteredData = extractedData.filter(record => {
    // First filter by tab (Push_status)
    // Handle boolean true, string "true", string "pushed", or any truthy value
    const isPushed = record.Push_status === true ||
      record.Push_status === 'true' ||
      record.Push_status === 'pushed' ||
      record.Push_status === 'TRUE'

    if (activeTab === 'need_to_push' && isPushed) return false
    if (activeTab === 'pushed' && !isPushed) return false

    // Filter by report link name
    if (reportLinkFilter && record.report_link_name !== reportLinkFilter) return false
    
    // Filter by date
    if (dateFilter !== 'all') {
      // Use processed_at as primary date field (when extraction completed)
      const dateField = record.processed_at || record.created_at
      
      // Skip if no date field exists
      if (!dateField) {
        return false
      }
      
      const recordDate = new Date(dateField)
      
      // Skip if invalid date
      if (isNaN(recordDate.getTime())) {
        return false
      }
      
      // Get current date in local timezone
      const now = new Date()
      const currentYear = now.getFullYear()
      const currentMonth = now.getMonth()
      const currentDay = now.getDate()
      
      // Get record date in local timezone
      const recordYear = recordDate.getFullYear()
      const recordMonth = recordDate.getMonth()
      const recordDay = recordDate.getDate()
      
      switch (dateFilter) {
        case 'today':
          // Exact match: same year, month, and day
          if (recordYear !== currentYear || recordMonth !== currentMonth || recordDay !== currentDay) {
            return false
          }
          break
        case 'yesterday':
          const yesterday = new Date(now)
          yesterday.setDate(yesterday.getDate() - 1)
          const yesterdayYear = yesterday.getFullYear()
          const yesterdayMonth = yesterday.getMonth()
          const yesterdayDay = yesterday.getDate()
          if (recordYear !== yesterdayYear || recordMonth !== yesterdayMonth || recordDay !== yesterdayDay) {
            return false
          }
          break
        case 'last7days':
          const sevenDaysAgo = new Date(currentYear, currentMonth, currentDay)
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
          const recordDateOnly = new Date(recordYear, recordMonth, recordDay)
          if (recordDateOnly < sevenDaysAgo) return false
          break
        case 'last30days':
          const thirtyDaysAgo = new Date(currentYear, currentMonth, currentDay)
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
          const recordDateOnly30 = new Date(recordYear, recordMonth, recordDay)
          if (recordDateOnly30 < thirtyDaysAgo) return false
          break
      }
    }

    // Then filter by search query
    if (!searchQuery) return true
    const searchLower = searchQuery.toLowerCase()
    return (
      record.record_id?.toLowerCase().includes(searchLower) ||
      record.job_id?.toLowerCase().includes(searchLower) ||
      record.report_link_name?.toLowerCase().includes(searchLower) ||
      JSON.stringify(record.bill_data || {}).toLowerCase().includes(searchLower) ||
      JSON.stringify(record.bank_data || {}).toLowerCase().includes(searchLower)
    )
  })

  // Debug logging
  console.log('🎯 Active Tab:', activeTab)
  console.log('📦 Total extracted data:', extractedData.length)
  console.log('🔍 Filtered data:', filteredData.length)
  console.log('📅 Date filter:', dateFilter)
  console.log('📋 Report filter:', reportLinkFilter)
  
  // Debug date filtering
  if (dateFilter === 'today') {
    const now = new Date()
    const todayDateOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    
    console.log('📅 Today (local date only):', todayDateOnly.toISOString())
    console.log('📅 Current time:', now.toISOString())
    
    // Check how many records actually match today
    const todayRecords = extractedData.filter(r => {
      const dateField = r.processed_at || r.created_at
      if (!dateField) return false
      const recordDate = new Date(dateField)
      if (isNaN(recordDate.getTime())) return false
      const recordDateOnly = new Date(recordDate.getFullYear(), recordDate.getMonth(), recordDate.getDate())
      return recordDateOnly.getTime() === todayDateOnly.getTime()
    })
    
    console.log('📅 Records with today\'s date (date-only comparison):', todayRecords.length)
    
    // Sample some dates
    const samples = extractedData.slice(0, 10).map(r => {
      const dateField = r.processed_at || r.created_at
      const recordDate = new Date(dateField)
      const recordDateOnly = new Date(recordDate.getFullYear(), recordDate.getMonth(), recordDate.getDate())
      return {
        id: r.id,
        processed_at: r.processed_at,
        created_at: r.created_at,
        recordDate: recordDate.toISOString(),
        recordDateOnly: recordDateOnly.toISOString(),
        isToday: recordDateOnly.getTime() === todayDateOnly.getTime()
      }
    })
    console.log('📅 Sample dates with comparison:', samples)
  }

  // Client-side pagination
  const totalPages = Math.ceil(filteredData.length / recordsPerPage)
  const startIndex = (currentPage - 1) * recordsPerPage
  const endIndex = startIndex + recordsPerPage
  const paginatedData = filteredData.slice(startIndex, endIndex)

  // Count records by push status from FILTERED data (respects report name and date filters)
  const needToPushCount = filteredData.filter(r => {
    const isPushed = r.Push_status === true ||
      r.Push_status === 'true' ||
      r.Push_status === 'pushed' ||
      r.Push_status === 'TRUE'
    return !isPushed
  }).length

  const pushedCount = filteredData.filter(r => {
    const isPushed = r.Push_status === true ||
      r.Push_status === 'true' ||
      r.Push_status === 'pushed' ||
      r.Push_status === 'TRUE'
    return isPushed
  }).length
  
  // Total filtered records count
  const totalFilteredRecords = filteredData.length

  console.log('📊 Filtered Counts - Total:', totalFilteredRecords, '| Need to Push:', needToPushCount, '| Pushed:', pushedCount)

  const toggleSelectRecord = (recordId) => {
    setSelectedRecords(prev => {
      const newSet = new Set(prev)
      if (newSet.has(recordId)) {
        newSet.delete(recordId)
      } else {
        newSet.add(recordId)
      }
      return newSet
    })
  }

  const toggleSelectAll = () => {
    // Check if all records on current page are selected
    const currentPageIds = paginatedData.map(r => r.id)
    const allCurrentPageSelected = currentPageIds.every(id => selectedRecords.has(id))

    if (allCurrentPageSelected) {
      // Deselect all on current page
      setSelectedRecords(prev => {
        const newSet = new Set(prev)
        currentPageIds.forEach(id => newSet.delete(id))
        return newSet
      })
    } else {
      // Select all on current page
      setSelectedRecords(prev => {
        const newSet = new Set(prev)
        currentPageIds.forEach(id => newSet.add(id))
        return newSet
      })
    }
  }

  const selectAllFiltered = () => {
    setSelectedRecords(new Set(filteredData.map(r => r.id)))
    toast.success(`✅ Selected all ${filteredData.length} filtered records`, {
      style: {
        background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
        color: 'white',
        fontWeight: 600
      }
    })
  }

  const deselectAll = () => {
    setSelectedRecords(new Set())
    toast.success('Cleared all selections', {
      style: {
        background: 'linear-gradient(135deg, #64748B 0%, #475569 100%)',
        color: 'white',
        fontWeight: 600
      }
    })
  }

  const handleBulkPushToZoho = async () => {
    if (selectedRecords.size === 0) {
      toast.error('Please select at least one record to sync', {
        icon: '⚠️',
        style: {
          background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
          color: 'white',
          fontWeight: 600
        }
      })
      return
    }

    console.log('🚀 Opening Zoho config modal for records:', Array.from(selectedRecords))

    // Open the Zoho configuration modal
    setShowZohoModal(true)
  }

  const handleZohoPushSuccess = async (result) => {
    console.log('✅ Push success callback received:', result)

    // Show confetti animation
    setShowConfetti(true)
    setTimeout(() => setShowConfetti(false), 3000)

    // Update Push_status in Supabase for successfully synced records
    if (result.successful > 0) {
      const syncedRecordIds = Array.from(selectedRecords)

      try {
        console.log('📝 Updating Push_status for records:', syncedRecordIds)

        const { error: updateError } = await supabase
          .from('auto_extraction_results')
          .update({ Push_status: true })
          .in('id', syncedRecordIds)

        if (updateError) {
          console.error('❌ Error updating Push_status:', updateError)
          toast.error('Failed to update record status', {
            icon: '⚠️'
          })
        } else {
          console.log('✅ Successfully updated Push_status')

          // Refresh data to show updated status
          await fetchExtractedData()

          toast.success(`✅ ${result.successful} records moved to "Pushed Data" tab`, {
            duration: 3000,
            style: {
              background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
              color: 'white',
              fontWeight: 600
            }
          })
        }
      } catch (updateErr) {
        console.error('❌ Error updating records:', updateErr)
        toast.error(`Error: ${updateErr.message}`, {
          icon: '⚠️'
        })
      }
    }

    // Clear selections
    setSelectedRecords(new Set())
    console.log('🧹 Cleared selections')
  }


  const handleExport = () => {
    // Deduplicate by record_id
    const seen = new Set()
    const dedupedData = filteredData.filter(record => {
      if (seen.has(record.record_id)) return false
      seen.add(record.record_id)
      return true
    })

    // Build rows as plain objects
    const rows = dedupedData.map(record => {
      const rawBillData = parseJsonField(record.bill_data)
      const billDataArray = Array.isArray(rawBillData) ? rawBillData : (rawBillData ? [rawBillData] : [])
      const bankData = parseJsonField(record.bank_data) || {}

      return {
        'Record ID': record.record_id || '',
        'Scholar Name': billDataArray[0]?.student_name || '',
        'Scholar ID': billDataArray[0]?.scholar_id || record.scholar_id || '',
        'Tracking ID': record.tracking_id || record.Tracking_id || record.Tracking_ID || '',
        'Email': record.email || '',
        'Account No': bankData.account_number ? String(bankData.account_number) : '',
        'Bank Name': bankData.bank_name || '',
        'Holder Name': bankData.account_holder_name || '',
        'IFSC Code': bankData.ifsc_code || '',
        'Branch Name': bankData.branch_name || '',
        'Bill Data': formatBillDataText(billDataArray),
        'Bill1_AMT': billDataArray[0]?.amount || '',
        'Bill2_AMT': billDataArray[1]?.amount || '',
        'Bill3_AMT': billDataArray[2]?.amount || '',
        'Bill4_AMT': billDataArray[3]?.amount || '',
        'Bill5_AMT': billDataArray[4]?.amount || '',
        'Bill6_AMT': billDataArray[5]?.amount || '',  // ← NEW
        'Bill7_AMT': billDataArray[6]?.amount || '',  // ← NEW
        'Bill8_AMT': billDataArray[7]?.amount || '',
      }
    })

    // Create worksheet from rows
    const ws = XLSX.utils.json_to_sheet(rows)

    // ✅ Force 'Account No' column to TEXT type for every row
    // Column F = index 5 (Record ID=A, Scholar Name=B, Scholar ID=C, Tracking ID=D, Email=E, Account No=F)
    const accountColLetter = 'F'
    dedupedData.forEach((_, rowIdx) => {
      const cellRef = `${accountColLetter}${rowIdx + 2}` // +2 because row 1 is header
      if (ws[cellRef]) {
        ws[cellRef].t = 's'  // force type = string
        ws[cellRef].z = '@'  // format = text
      }
    })

    // Set column widths
    ws['!cols'] = [
      { wch: 12 }, // Record ID
      { wch: 22 }, // Scholar Name
      { wch: 15 }, // Scholar ID
      { wch: 14 }, // Tracking ID
      { wch: 28 }, // Email
      { wch: 20 }, // Account No
      { wch: 24 }, // Bank Name
      { wch: 24 }, // Holder Name
      { wch: 13 }, // IFSC Code
      { wch: 20 }, // Branch Name
      { wch: 50 }, // Bill Data
      { wch: 10 }, // Bill1_AMT
      { wch: 10 }, // Bill2_AMT
      { wch: 10 }, // Bill3_AMT
      { wch: 10 }, // Bill4_AMT
      { wch: 10 }, // Bill5_AMT
    ]

    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Extracted Data')

    XLSX.writeFile(wb, `extracted-data-${new Date().toISOString().split('T')[0]}.xlsx`)

    toast.success(`📥 Exported ${dedupedData.length} unique records!`, {
      style: {
        background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
        color: 'white',
        fontWeight: 600
      }
    })
  }


  return (
    <div style={{ position: 'relative', minHeight: '100vh', background: 'transparent' }}>
      <Toaster position="top-right" />
      {showConfetti && <Confetti />}

      {/* Header Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          marginBottom: '32px',
        }}
      >
        <div style={{ padding: '12px', background: 'rgba(249, 115, 22, 0.1)', borderRadius: '16px' }}>
          <Database size={28} color="#F97316" />
        </div>
        <div>
          <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.5px' }}>
            Extracted Data Hub
          </h1>
          <p style={{ margin: '4px 0 0 0', color: '#64748B', fontSize: '14px', fontWeight: 500 }}>
            Manage, search, and sync your extracted bill and bank data seamlessly.
          </p>
        </div>
      </motion.div>

      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '24px',
            marginBottom: '32px'
          }}
        >
          {[
            { icon: FileText, label: 'Total Records', value: totalFilteredRecords, color: '#F97316', bg: 'rgba(249, 115, 22, 0.1)' },
            { icon: Upload, label: 'Need to Push', value: needToPushCount, color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.1)' },
            { icon: CheckCircle, label: 'Pushed', value: pushedCount, color: '#10B981', bg: 'rgba(16, 185, 129, 0.1)' },
            { icon: Search, label: 'Selected', value: selectedRecords.size, color: '#EC4899', bg: 'rgba(236, 72, 153, 0.1)' }
          ].map((stat, idx) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + idx * 0.05 }}
              whileHover={{ y: -8, boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}
              style={{
                background: 'white',
                padding: '24px',
                borderRadius: '20px',
                boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
                border: '1px solid rgba(0,0,0,0.05)',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              <div style={{ position: 'absolute', top: -20, right: -20, width: 100, height: 100, background: stat.bg, borderRadius: '50%', opacity: 0.5 }} />
              <div style={{ position: 'relative', zIndex: 1 }}>
                <stat.icon size={28} style={{ color: stat.color, marginBottom: '12px' }} />
                <div style={{ fontSize: '13px', color: '#64748B', fontWeight: 600, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  {stat.label}
                </div>
                <div style={{ fontSize: '32px', fontWeight: 900, color: '#1E293B' }}>
                  {typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Action Bar */}
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ delay: 0.2 }}
  style={{
    background: 'white',
    padding: '20px 24px',
    borderRadius: '20px',
    marginBottom: '24px',
    boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
    border: '1px solid rgba(0,0,0,0.05)',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  }}
>
  {/* Row 1: Search + Filters + Action Buttons */}
  <div style={{
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flexWrap: 'wrap'
  }}>
    {/* Search Box */}
    <div style={{
      position: 'relative',
      flex: '1',
      minWidth: '220px',
      maxWidth: '360px'
    }}>
      <Search size={18} style={{
        position: 'absolute', left: '14px', top: '50%',
        transform: 'translateY(-50%)', color: '#F97316', zIndex: 1
      }} />
      <input
        type="text"
        placeholder="Search by student name..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        style={{
          width: '100%',
          padding: '10px 14px 10px 42px',
          borderRadius: '12px',
          border: '2px solid #E5E7EB',
          fontSize: '14px',
          fontWeight: 500,
          outline: 'none',
          background: 'white',
          color: '#1E293B',
          caretColor: '#F97316',
          boxSizing: 'border-box'
        }}
        onFocus={(e) => {
          e.target.style.borderColor = '#F97316'
          e.target.style.boxShadow = '0 0 0 3px rgba(249, 115, 22, 0.1)'
        }}
        onBlur={(e) => {
          e.target.style.borderColor = '#E5E7EB'
          e.target.style.boxShadow = 'none'
        }}
      />
    </div>

    {/* Report Link Filter */}
    <div style={{ position: 'relative', minWidth: '180px', maxWidth: '240px' }}>
      <Filter size={15} style={{
        position: 'absolute', left: '11px', top: '50%',
        transform: 'translateY(-50%)',
        color: reportLinkFilter ? '#F97316' : '#94A3B8',
        pointerEvents: 'none', zIndex: 1
      }} />
      <select
        value={reportLinkFilter}
        onChange={(e) => {
          const selected = e.target.value
          setReportLinkFilter(selected)
          setCurrentPage(1)
          if (selected) {
            const matchingIds = extractedData
              .filter(record => {
                const isPushed = record.Push_status === true || record.Push_status === 'true' ||
                  record.Push_status === 'pushed' || record.Push_status === 'TRUE'
                if (activeTab === 'need_to_push' && isPushed) return false
                if (activeTab === 'pushed' && !isPushed) return false
                return record.report_link_name === selected
              })
              .map(r => r.id)
            setSelectedRecords(new Set(matchingIds))
          } else {
            setSelectedRecords(new Set())
          }
        }}
        style={{
          width: '100%',
          padding: '10px 30px 10px 32px',
          borderRadius: '12px',
          border: `2px solid ${reportLinkFilter ? '#F97316' : '#E5E7EB'}`,
          fontSize: '13px', fontWeight: 500, outline: 'none',
          background: reportLinkFilter ? 'rgba(249, 115, 22, 0.05)' : 'white',
          color: reportLinkFilter ? '#EA580C' : '#64748B',
          cursor: 'pointer', appearance: 'none', WebkitAppearance: 'none'
        }}
        disabled={isLoadingReportLinks}
      >
        <option value="">{isLoadingReportLinks ? 'Loading…' : `All Reports (${reportLinkOptions.length})`}</option>
        {reportLinkOptions.map(link => <option key={link} value={link}>{link}</option>)}
      </select>
      {reportLinkFilter && (
        <button onClick={() => { setReportLinkFilter(''); setCurrentPage(1) }}
          style={{
            position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)',
            background: '#F97316', border: 'none', borderRadius: '50%',
            width: '16px', height: '16px', display: 'flex', alignItems: 'center',
            justifyContent: 'center', cursor: 'pointer', color: 'white', fontSize: '10px', fontWeight: 700, padding: 0
          }}>✕</button>
      )}
    </div>

    {/* Date Filter */}
    <div style={{ position: 'relative', minWidth: '150px', maxWidth: '180px' }}>
      <select
        value={dateFilter}
        onChange={(e) => { setDateFilter(e.target.value); setCurrentPage(1) }}
        style={{
          width: '100%',
          padding: '10px 28px 10px 14px',
          borderRadius: '12px',
          border: `2px solid ${dateFilter !== 'all' ? '#10B981' : '#E5E7EB'}`,
          fontSize: '13px', fontWeight: 600, outline: 'none',
          background: dateFilter !== 'all' ? 'rgba(16, 185, 129, 0.05)' : 'white',
          color: dateFilter !== 'all' ? '#059669' : '#64748B',
          cursor: 'pointer', appearance: 'none', WebkitAppearance: 'none'
        }}
      >
        <option value="all">📅 All Dates</option>
        <option value="today">📅 Today</option>
        <option value="yesterday">📅 Yesterday</option>
        <option value="last7days">📅 Last 7 Days</option>
        <option value="last30days">📅 Last 30 Days</option>
      </select>
      {dateFilter !== 'all' && (
        <button onClick={() => { setDateFilter('all'); setCurrentPage(1) }}
          style={{
            position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)',
            background: '#10B981', border: 'none', borderRadius: '50%',
            width: '16px', height: '16px', display: 'flex', alignItems: 'center',
            justifyContent: 'center', cursor: 'pointer', color: 'white', fontSize: '10px', fontWeight: 700, padding: 0
          }}>✕</button>
      )}
    </div>

    {/* Spacer pushes action buttons to the right */}
    <div style={{ flex: 1 }} />

    {/* Action Buttons */}
    <div style={{ display: 'flex', gap: '10px', flexShrink: 0 }}>
      <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
        onClick={fetchExtractedData} disabled={isLoading}
        style={{
          display: 'flex', alignItems: 'center', gap: '7px',
          padding: '10px 18px', borderRadius: '12px', border: 'none',
          background: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)',
          color: 'white', fontWeight: 600, fontSize: '14px',
          cursor: isLoading ? 'not-allowed' : 'pointer',
          boxShadow: '0 4px 12px rgba(249, 115, 22, 0.3)',
          opacity: isLoading ? 0.6 : 1, flexShrink: 0
        }}>
        <RefreshCw size={15} className={isLoading ? 'spin' : ''} />
        Refresh
      </motion.button>

      <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
        onClick={handleExport} disabled={filteredData.length === 0}
        style={{
          display: 'flex', alignItems: 'center', gap: '7px',
          padding: '10px 18px', borderRadius: '12px',
          border: '2px solid #F97316', background: 'white', color: '#F97316',
          fontWeight: 600, fontSize: '14px',
          cursor: filteredData.length === 0 ? 'not-allowed' : 'pointer',
          opacity: filteredData.length === 0 ? 0.5 : 1, flexShrink: 0
        }}>
        <Download size={15} />
        Export
      </motion.button>

      <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
        onClick={handleBulkPushToZoho}
        disabled={selectedRecords.size === 0 || isSyncing}
        style={{
          display: 'flex', alignItems: 'center', gap: '7px',
          padding: '10px 18px', borderRadius: '12px', border: 'none',
          background: selectedRecords.size === 0 || isSyncing
            ? '#E5E7EB'
            : 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
          color: selectedRecords.size === 0 || isSyncing ? '#94A3B8' : 'white',
          fontWeight: 600, fontSize: '14px',
          cursor: selectedRecords.size === 0 || isSyncing ? 'not-allowed' : 'pointer',
          boxShadow: selectedRecords.size === 0 ? 'none' : '0 4px 12px rgba(16, 185, 129, 0.3)',
          flexShrink: 0
        }}>
        {isSyncing ? (
          <><Loader2 size={15} className="spin" />Syncing {syncProgress?.current || 0}/{syncProgress?.total || 0}</>
        ) : (
          <><Upload size={15} />Push to Zoho ({selectedRecords.size})</>
        )}
      </motion.button>
    </div>
  </div>

  {/* Row 2: Quick Selection Buttons */}
  <div style={{
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    paddingTop: '4px',
    borderTop: '1px solid #F1F5F9'
  }}>
    <span style={{ fontSize: '12px', color: '#94A3B8', fontWeight: 600, marginRight: '4px' }}>Quick select:</span>
    {[
      { label: 'First 50', count: 50 },
      { label: 'First 100', count: 100 },
      { label: 'First 200', count: 200 },
    ].map(({ label, count }) => (
      <motion.button key={label}
        whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
        onClick={() => setSelectedRecords(new Set(filteredData.slice(0, count).map(r => r.id)))}
        disabled={filteredData.length === 0}
        style={{
          padding: '7px 14px', fontSize: '13px', fontWeight: 600,
          borderRadius: '8px', border: '2px solid #E5E7EB',
          background: 'white', color: '#64748B',
          cursor: filteredData.length === 0 ? 'not-allowed' : 'pointer',
          opacity: filteredData.length === 0 ? 0.5 : 1
        }}>
        {label}
      </motion.button>
    ))}
    <motion.button
      whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
      onClick={deselectAll} disabled={selectedRecords.size === 0}
      style={{
        display: 'flex', alignItems: 'center', gap: '5px',
        padding: '7px 14px', fontSize: '13px', fontWeight: 600,
        borderRadius: '8px', border: '2px solid #EF4444',
        background: 'white', color: '#EF4444',
        cursor: selectedRecords.size === 0 ? 'not-allowed' : 'pointer',
        opacity: selectedRecords.size === 0 ? 0.5 : 1
      }}>
      <XCircle size={13} />
      Clear
    </motion.button>
  </div>
</motion.div>

        {/* Sync Progress Bar */}
        <AnimatePresence>
          {isSyncing && syncProgress && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              style={{
                background: 'white',
                padding: '24px',
                borderRadius: '20px',
                marginBottom: '24px',
                boxShadow: '0 4px 16px rgba(16, 185, 129, 0.15)',
                border: '2px solid #10B981'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '12px' }}>
                <Loader2 size={24} className="spin" style={{ color: '#10B981' }} />
                <div>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: '#1E293B' }}>
                    Syncing to Zoho Creator...
                  </div>
                  <div style={{ fontSize: '14px', color: '#64748B' }}>
                    {syncProgress.current} of {syncProgress.total} records processed
                  </div>
                </div>
              </div>
              <div style={{ width: '100%', height: '8px', background: '#E5E7EB', borderRadius: '999px', overflow: 'hidden' }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(syncProgress.current / syncProgress.total) * 100}%` }}
                  transition={{ duration: 0.5 }}
                  style={{
                    height: '100%',
                    background: 'linear-gradient(90deg, #10B981 0%, #059669 100%)',
                    borderRadius: '999px'
                  }}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Sync Result */}
        <AnimatePresence>
          {syncResult && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              style={{
                background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                padding: '32px',
                borderRadius: '20px',
                marginBottom: '24px',
                boxShadow: '0 20px 40px rgba(16, 185, 129, 0.2)',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              <div style={{ position: 'absolute', top: -50, right: -50, width: 200, height: 200, background: 'rgba(255,255,255,0.1)', borderRadius: '50%' }} />

              <div style={{ position: 'relative', zIndex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Sparkles size={32} style={{ color: 'white' }} />
                    <h3 style={{ fontSize: '24px', fontWeight: 800, color: 'white', margin: 0 }}>
                      Sync Complete!
                    </h3>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setSyncResult(null)}
                    style={{
                      background: 'rgba(255,255,255,0.2)',
                      border: 'none',
                      color: 'white',
                      cursor: 'pointer',
                      borderRadius: '50%',
                      width: '32px',
                      height: '32px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <X size={20} />
                  </motion.button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px' }}>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    style={{
                      background: 'rgba(255,255,255,0.15)',
                      backdropFilter: 'blur(10px)',
                      padding: '20px',
                      borderRadius: '16px',
                      border: '1px solid rgba(255,255,255,0.2)'
                    }}
                  >
                    <FileText size={24} style={{ color: 'white', marginBottom: '8px' }} />
                    <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.9)', fontWeight: 600, marginBottom: '4px' }}>
                      Total Records
                    </div>
                    <div style={{ fontSize: '32px', fontWeight: 900, color: 'white' }}>
                      {syncResult.total_records}
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    style={{
                      background: 'rgba(255,255,255,0.15)',
                      backdropFilter: 'blur(10px)',
                      padding: '20px',
                      borderRadius: '16px',
                      border: '1px solid rgba(255,255,255,0.2)'
                    }}
                  >
                    <CheckCircle size={24} style={{ color: 'white', marginBottom: '8px' }} />
                    <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.9)', fontWeight: 600, marginBottom: '4px' }}>
                      Successful
                    </div>
                    <div style={{ fontSize: '32px', fontWeight: 900, color: 'white' }}>
                      {syncResult.successful}
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    style={{
                      background: syncResult.failed > 0 ? 'rgba(239, 68, 68, 0.3)' : 'rgba(255,255,255,0.15)',
                      backdropFilter: 'blur(10px)',
                      padding: '20px',
                      borderRadius: '16px',
                      border: syncResult.failed > 0 ? '1px solid rgba(239, 68, 68, 0.5)' : '1px solid rgba(255,255,255,0.2)'
                    }}
                  >
                    <XCircle size={24} style={{ color: 'white', marginBottom: '8px' }} />
                    <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.9)', fontWeight: 600, marginBottom: '4px' }}>
                      Failed
                    </div>
                    <div style={{ fontSize: '32px', fontWeight: 900, color: 'white' }}>
                      {syncResult.failed}
                    </div>
                  </motion.div>
                </div>

                {syncResult.errors && syncResult.errors.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    style={{
                      marginTop: '20px',
                      padding: '20px',
                      background: 'rgba(239, 68, 68, 0.2)',
                      borderRadius: '12px',
                      border: '1px solid rgba(239, 68, 68, 0.3)'
                    }}
                  >
                    <div style={{ fontSize: '14px', fontWeight: 700, color: 'white', marginBottom: '12px' }}>
                      ⚠️ Errors ({syncResult.errors.length}):
                    </div>
                    <div style={{ maxHeight: '150px', overflowY: 'auto' }}>
                      {syncResult.errors.slice(0, 5).map((error, idx) => (
                        <div key={idx} style={{ fontSize: '13px', color: 'rgba(255,255,255,0.9)', marginBottom: '8px', paddingLeft: '12px', borderLeft: '2px solid rgba(255,255,255,0.3)' }}>
                          {error.record}: {error.error}
                        </div>
                      ))}
                      {syncResult.errors.length > 5 && (
                        <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)', fontStyle: 'italic', marginTop: '8px' }}>
                          ... and {syncResult.errors.length - 5} more errors
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Selection Banner */}
        <AnimatePresence>
          {selectedRecords.size > 0 && !isSyncing && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              style={{
                background: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)',
                padding: '20px 24px',
                borderRadius: '16px',
                marginBottom: '24px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                boxShadow: '0 8px 24px rgba(249, 115, 22, 0.3)',
                color: 'white'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <CheckCircle size={24} />
                <span style={{ fontSize: '16px', fontWeight: 600 }}>
                  {selectedRecords.size} record{selectedRecords.size !== 1 ? 's' : ''} selected
                </span>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={deselectAll}
                style={{
                  background: 'rgba(255,255,255,0.2)',
                  border: 'none',
                  color: 'white',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Clear Selection
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tab Navigation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          style={{
            background: 'white',
            padding: '8px',
            borderRadius: '20px 20px 0 0',
            boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
            border: '1px solid rgba(0,0,0,0.05)',
            borderBottom: 'none',
            display: 'flex',
            gap: '8px'
          }}
        >
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              setActiveTab('need_to_push')
              setCurrentPage(1)
              setSelectedRecords(new Set())
            }}
            style={{
              flex: 1,
              padding: '16px 24px',
              borderRadius: '14px',
              border: 'none',
              background: activeTab === 'need_to_push'
                ? 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)'
                : 'transparent',
              color: activeTab === 'need_to_push' ? 'white' : '#64748B',
              fontWeight: 700,
              fontSize: '15px',
              cursor: 'pointer',
              transition: 'all 0.3s',
              boxShadow: activeTab === 'need_to_push'
                ? '0 4px 12px rgba(249, 115, 22, 0.3)'
                : 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px'
            }}
          >
            <Upload size={20} />
            <span>Need to Push</span>
            <span style={{
              background: activeTab === 'need_to_push' ? 'rgba(255,255,255,0.2)' : 'rgba(249, 115, 22, 0.1)',
              padding: '4px 12px',
              borderRadius: '12px',
              fontSize: '13px',
              fontWeight: 800
            }}>
              {needToPushCount}
            </span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              setActiveTab('pushed')
              setCurrentPage(1)
              setSelectedRecords(new Set())
            }}
            style={{
              flex: 1,
              padding: '16px 24px',
              borderRadius: '14px',
              border: 'none',
              background: activeTab === 'pushed'
                ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)'
                : 'transparent',
              color: activeTab === 'pushed' ? 'white' : '#64748B',
              fontWeight: 700,
              fontSize: '15px',
              cursor: 'pointer',
              transition: 'all 0.3s',
              boxShadow: activeTab === 'pushed'
                ? '0 4px 12px rgba(16, 185, 129, 0.3)'
                : 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px'
            }}
          >
            <CheckCircle size={20} />
            <span>Pushed Data</span>
            <span style={{
              background: activeTab === 'pushed' ? 'rgba(255,255,255,0.2)' : 'rgba(16, 185, 129, 0.1)',
              padding: '4px 12px',
              borderRadius: '12px',
              fontSize: '13px',
              fontWeight: 800
            }}>
              {pushedCount}
            </span>
          </motion.button>
          
          <motion.div style={{ width: '2px', background: '#E2E8F0', margin: '8px' }} />

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsTableVisible(!isTableVisible)}
            style={{
              padding: '16px 24px',
              borderRadius: '14px',
              border: 'none',
              background: isTableVisible ? 'rgba(249, 115, 22, 0.05)' : 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)',
              color: isTableVisible ? '#F97316' : 'white',
              fontWeight: 700,
              fontSize: '15px',
              cursor: 'pointer',
              transition: 'all 0.3s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              boxShadow: isTableVisible ? 'none' : '0 4px 12px rgba(249, 115, 22, 0.3)'
            }}
          >
            {isTableVisible ? <EyeOff size={20} /> : <Eye size={20} />}
            <span>{isTableVisible ? 'Hide Table' : 'Show Table'}</span>
          </motion.button>
        </motion.div>

        {/* Enhanced Data Table */}
        <AnimatePresence>
          {isTableVisible && (
            <motion.div
              initial={{ opacity: 0, y: -20, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: -20, height: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              style={{
                background: 'white',
                borderRadius: '0 0 20px 20px',
                boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
                border: '1px solid rgba(0,0,0,0.05)',
                borderTop: 'none',
                overflow: 'hidden',
                marginBottom: '24px'
              }}
            >
          {isLoading ? (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '80px 20px',
              gap: '20px'
            }}>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              >
                <Loader2 size={56} style={{ color: '#F97316' }} />
              </motion.div>
              <p style={{ color: '#64748B', fontSize: '18px', fontWeight: 600 }}>
                Loading extracted data...
              </p>
            </div>
          ) : filteredData.length === 0 ? (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '80px 20px',
              gap: '16px'
            }}>
              <AlertCircle size={56} style={{ color: '#94A3B8' }} />
              <p style={{ color: '#64748B', fontSize: '18px', fontWeight: 600 }}>
                No extracted data found
              </p>
              <p style={{ color: '#94A3B8', fontSize: '14px' }}>
                {searchQuery ? 'Try a different search query' : 'Process some documents to see data here'}
              </p>
            </div>
          ) : (
            <div style={{
              overflowX: 'auto',
              borderRadius: '16px',
              border: '1px solid #E5E7EB',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.04)'
            }}>
              <table style={{
                width: '100%',
                borderCollapse: 'separate',
                borderSpacing: 0,
                fontSize: '12px',
                tableLayout: 'fixed',
                background: 'white'
              }}>
                <thead>
                  <tr style={{
                    background: '#1E293B',
                    color: 'white'
                  }}>
                    <th style={{ padding: '18px 16px', textAlign: 'center', fontWeight: 700, width: '60px', position: 'sticky', left: 0, background: 'inherit', zIndex: 2 }}>
                      <input
                        type="checkbox"
                        checked={paginatedData.length > 0 && paginatedData.every(r => selectedRecords.has(r.id))}
                        onChange={toggleSelectAll}
                        style={{
                          width: '18px',
                          height: '18px',
                          cursor: 'pointer',
                          accentColor: '#10B981'
                        }}
                      />
                    </th>
                    <th style={{ padding: '16px 12px', textAlign: 'left', fontWeight: 700, fontSize: '11px', letterSpacing: '0.5px', textTransform: 'uppercase', width: '130px', borderRight: '1px solid rgba(255, 255, 255, 0.1)' }}>Record & Tracking</th>
                    <th style={{ padding: '16px 12px', textAlign: 'left', fontWeight: 700, fontSize: '11px', letterSpacing: '0.5px', textTransform: 'uppercase', width: '180px', borderRight: '1px solid rgba(255, 255, 255, 0.1)' }}>Scholar Details</th>
                    <th style={{ padding: '16px 12px', textAlign: 'left', fontWeight: 700, fontSize: '11px', letterSpacing: '0.5px', textTransform: 'uppercase', width: '200px', borderRight: '1px solid rgba(255, 255, 255, 0.1)' }}>Bank Details</th>
                    <th style={{ padding: '16px 12px', textAlign: 'left', fontWeight: 700, fontSize: '11px', letterSpacing: '0.5px', textTransform: 'uppercase', width: '180px', borderRight: '1px solid rgba(255, 255, 255, 0.1)' }}>Account Info</th>
                    <th style={{ padding: '16px 12px', textAlign: 'left', fontWeight: 700, fontSize: '11px', letterSpacing: '0.5px', textTransform: 'uppercase', width: '160px', borderRight: '1px solid rgba(255, 255, 255, 0.1)' }}>Bill Summary</th>
                    <th style={{ padding: '16px 12px', textAlign: 'right', fontWeight: 700, fontSize: '11px', letterSpacing: '0.5px', textTransform: 'uppercase', width: '120px', borderRight: '1px solid rgba(255, 255, 255, 0.1)' }}>Total Amount</th>
                    <th style={{ padding: '16px 8px', textAlign: 'center', fontWeight: 700, fontSize: '11px', width: '60px' }}>View</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedData.map((record, index) => {
                    const rawBillData = parseJsonField(record.bill_data)
                    const billDataArray = Array.isArray(rawBillData) ? rawBillData : (rawBillData ? [rawBillData] : [])
                    const bankData = parseJsonField(record.bank_data) || {}

                    // Debug logging
                    if (index === 0) {
                      console.log('🔍 First Record Debug:')
                      console.log('  record_id:', record.record_id)
                      console.log('  tracking_id (lowercase):', record.tracking_id)
                      console.log('  Tracking_id (mixed):', record.Tracking_id)
                      console.log('  Tracking_ID (caps):', record.Tracking_ID)
                      console.log('  All record keys:', Object.keys(record))
                      console.log('  Full record object:', record)
                      console.log('  Display value:', record.tracking_id || record.Tracking_id || record.Tracking_ID || 'N/A')
                    }

                    const isExpanded = expandedRow === record.id
                    const isHovered = hoveredRow === record.id
                    const isSelected = selectedRecords.has(record.id)

                    return (
                      <React.Fragment key={record.id}>
                        <motion.tr
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.02 }}
                          onMouseEnter={() => setHoveredRow(record.id)}
                          onMouseLeave={() => setHoveredRow(null)}
                          style={{
                            borderBottom: '1px solid #F1F5F9',
                            background: isSelected
                              ? 'linear-gradient(90deg, rgba(16, 185, 129, 0.12) 0%, rgba(16, 185, 129, 0.04) 100%)'
                              : isExpanded
                                ? 'linear-gradient(90deg, rgba(249, 115, 22, 0.12) 0%, rgba(249, 115, 22, 0.04) 100%)'
                                : isHovered
                                  ? 'linear-gradient(90deg, rgba(249, 115, 22, 0.06) 0%, transparent 100%)'
                                  : index % 2 === 0
                                    ? 'white'
                                    : '#FAFBFC',
                            transition: 'all 0.2s ease',
                            cursor: 'pointer'
                          }}
                        >
                          <td style={{ padding: '16px', textAlign: 'center', position: 'sticky', left: 0, background: 'inherit', zIndex: 1 }}>
                            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleSelectRecord(record.id)}
                                onClick={(e) => e.stopPropagation()}
                                style={{
                                  width: '18px',
                                  height: '18px',
                                  cursor: 'pointer',
                                  accentColor: '#10B981'
                                }}
                              />
                            </motion.div>
                          </td>
                          <td style={{ padding: '14px 12px', borderRight: '1px solid #F1F5F9' }}>
                            <div style={{ fontWeight: 700, color: '#1E293B', fontSize: '12px' }}>
                              <span style={{
                                background: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)',
                                padding: '4px 8px',
                                borderRadius: '6px',
                                color: 'white',
                                fontSize: '10px',
                                display: 'inline-block'
                              }}>
                                {record.record_id}
                              </span>
                            </div>
                            <div style={{ fontSize: '11px', color: '#F97316', marginTop: '6px', fontWeight: 600, fontFamily: '"JetBrains Mono", monospace' }}>
                              {record.tracking_id || record.Tracking_id || record.Tracking_ID || 'N/A'}
                            </div>
                          </td>
                          <td style={{ padding: '14px 12px', borderRight: '1px solid #F1F5F9' }}>
                            <div style={{ fontWeight: 600, color: '#1E293B', fontSize: '13px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {billDataArray[0]?.student_name || <span style={{ color: '#CBD5E1' }}>N/A</span>}
                            </div>
                            <div style={{ fontSize: '11px', color: '#64748B', marginTop: '4px', fontFamily: '"JetBrains Mono", monospace' }}>
                              ID: {billDataArray[0]?.scholar_id || record.scholar_id || 'N/A'}
                            </div>
                          </td>
                          <td style={{ padding: '14px 12px', borderRight: '1px solid #F1F5F9' }}>
                            <div style={{ fontWeight: 600, color: '#10B981', fontSize: '13px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {bankData.bank_name || <span style={{ color: '#CBD5E1' }}>N/A</span>}
                            </div>
                            <div style={{ fontSize: '11px', color: '#64748B', marginTop: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {bankData.branch_name || 'N/A'} &bull; {bankData.ifsc_code || 'N/A'}
                            </div>
                          </td>
                          <td style={{ padding: '14px 12px', borderRight: '1px solid #F1F5F9' }}>
                            <div style={{ fontWeight: 600, color: '#1E293B', fontSize: '13px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {bankData.account_holder_name || <span style={{ color: '#CBD5E1' }}>N/A</span>}
                            </div>
                            <div style={{ fontSize: '11px', color: '#475569', marginTop: '4px', fontFamily: '"JetBrains Mono", monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              Acc: {bankData.account_number || 'N/A'}
                            </div>
                          </td>
                          <td style={{ padding: '14px 12px', borderRight: '1px solid #F1F5F9' }}>
                            <div style={{ fontSize: '13px', color: '#334155', fontWeight: 600 }}>
                              {billDataArray.length > 0 ? `${billDataArray.length} Bill${billDataArray.length > 1 ? 's' : ''} Record` : 'No Bills'}
                            </div>
                            <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '140px' }} title={billDataArray[0]?.college_name || 'N/A'}>
                              {billDataArray[0]?.college_name || 'N/A'}
                            </div>
                          </td>
                          <td style={{ padding: '14px 12px', borderRight: '1px solid #F1F5F9', textAlign: 'right' }}>
                            {(() => {
                              const totalAmt = billDataArray.reduce((sum, bill) => sum + (Number(bill.amount) || 0), 0)
                              return totalAmt > 0 ? (
                                <span style={{
                                  background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.1) 100%)',
                                  padding: '6px 10px',
                                  borderRadius: '8px',
                                  display: 'inline-block',
                                  color: '#059669',
                                  fontWeight: 700,
                                  fontFamily: '"JetBrains Mono", monospace',
                                  fontSize: '13px',
                                  boxShadow: 'inset 0 1px 2px rgba(16, 185, 129, 0.05)'
                                }}>
                                  ₹ {totalAmt.toLocaleString('en-IN', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                                </span>
                              ) : <span style={{ color: '#CBD5E1', fontWeight: 700, fontSize: '13px' }}>₹ 0</span>
                            })()}
                          </td>
                          <td style={{ padding: '14px 8px', textAlign: 'center' }}>
                            <motion.button
                              whileHover={{ scale: 1.15 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => setExpandedRow(expandedRow === record.id ? null : record.id)}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                padding: '6px',
                                borderRadius: '8px',
                                border: 'none',
                                background: expandedRow === record.id
                                  ? 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)'
                                  : isHovered
                                    ? 'linear-gradient(135deg, rgba(249, 115, 22, 0.1) 0%, rgba(234, 88, 12, 0.1) 100%)'
                                    : '#F8FAFC',
                                color: expandedRow === record.id ? 'white' : '#64748B',
                                cursor: 'pointer',
                                transition: 'all 0.3s',
                                boxShadow: expandedRow === record.id
                                  ? '0 4px 12px rgba(249, 115, 22, 0.3)'
                                  : '0 2px 4px rgba(0, 0, 0, 0.05)'
                              }}
                            >
                              <Eye size={14} />
                            </motion.button>
                          </td>
                        </motion.tr>

                        {/* Expanded Row */}
                        {expandedRow === record.id && (
                          <tr>
                            <td colSpan="16" style={{ padding: '0', background: 'linear-gradient(to bottom, #faf9fb 0%, #f8f7fa 100%)' }}>
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.3 }}
                                style={{ padding: '32px' }}
                              >
                                {/* Toggle Buttons */}
                                <div style={{
                                  display: 'flex',
                                  gap: '16px',
                                  marginBottom: '32px',
                                  justifyContent: 'center'
                                }}>
                                  <motion.button
                                    whileHover={{ scale: 1.05, y: -2 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => {
                                      const newView = { ...selectedView };
                                      newView[record.id] = 'bill';
                                      setSelectedView(newView);
                                    }}
                                    style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '10px',
                                      padding: '14px 36px',
                                      borderRadius: '14px',
                                      border: 'none',
                                      background: (!selectedView[record.id] || selectedView[record.id] === 'bill')
                                        ? 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)'
                                        : 'white',
                                      color: (!selectedView[record.id] || selectedView[record.id] === 'bill') ? 'white' : '#64748B',
                                      fontWeight: 700,
                                      fontSize: '15px',
                                      cursor: 'pointer',
                                      boxShadow: (!selectedView[record.id] || selectedView[record.id] === 'bill')
                                        ? '0 8px 24px rgba(249, 115, 22, 0.4)'
                                        : '0 4px 12px rgba(0, 0, 0, 0.08)',
                                      transition: 'all 0.3s',
                                      letterSpacing: '0.3px'
                                    }}
                                  >
                                    <Database size={20} />
                                    View Bill Data
                                  </motion.button>

                                  <motion.button
                                    whileHover={{ scale: 1.05, y: -2 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => {
                                      // Open Zoho modal for single record push
                                      setSelectedRecords(new Set([record.id]))
                                      setShowZohoModal(true)
                                    }}
                                    style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '10px',
                                      padding: '14px 36px',
                                      borderRadius: '14px',
                                      border: 'none',
                                      background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                                      color: 'white',
                                      fontWeight: 700,
                                      fontSize: '15px',
                                      cursor: 'pointer',
                                      boxShadow: '0 8px 24px rgba(16, 185, 129, 0.4)',
                                      transition: 'all 0.3s',
                                      letterSpacing: '0.3px'
                                    }}
                                  >
                                    <Upload size={18} />
                                    Push This Record
                                  </motion.button>

                                  <motion.button
                                    whileHover={{ scale: 1.05, y: -2 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => {
                                      const newView = { ...selectedView };
                                      newView[record.id] = 'bank';
                                      setSelectedView(newView);
                                    }}
                                    style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '10px',
                                      padding: '14px 36px',
                                      borderRadius: '14px',
                                      border: 'none',
                                      background: (selectedView[record.id] === 'bank')
                                        ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)'
                                        : 'white',
                                      color: (selectedView[record.id] === 'bank') ? 'white' : '#64748B',
                                      fontWeight: 700,
                                      fontSize: '15px',
                                      cursor: 'pointer',
                                      boxShadow: (selectedView[record.id] === 'bank')
                                        ? '0 8px 24px rgba(16, 185, 129, 0.4)'
                                        : '0 4px 12px rgba(0, 0, 0, 0.08)',
                                      transition: 'all 0.3s',
                                      letterSpacing: '0.3px'
                                    }}
                                  >
                                    <Database size={20} />
                                    View Bank Data
                                  </motion.button>
                                </div>

                                {/* Content Area */}
                                <motion.div
                                  key={selectedView[record.id] || 'bill'}
                                  initial={{ opacity: 0, y: 20 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ duration: 0.3 }}
                                  style={{
                                    display: 'grid',
                                    gridTemplateColumns: '450px 550px',
                                    gap: '24px',
                                    alignItems: 'start',
                                    justifyContent: 'center'
                                  }}
                                >
                                  {/* Left Side - Document Image */}
                                  <div style={{
                                    background: 'white',
                                    borderRadius: '16px',
                                    padding: '20px',
                                    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.1)',
                                    border: '1px solid #E5E7EB',
                                    maxWidth: '450px',
                                    overflow: 'hidden'
                                  }}>
                                    <div style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '10px',
                                      marginBottom: '16px',
                                      paddingBottom: '12px',
                                      borderBottom: '2px solid #F3F4F6'
                                    }}>
                                      <Eye size={20} style={{
                                        color: (!selectedView[record.id] || selectedView[record.id] === 'bill') ? '#F97316' : '#10B981'
                                      }} />
                                      <h4 style={{
                                        margin: 0,
                                        fontSize: '15px',
                                        fontWeight: 700,
                                        color: '#1E293B',
                                        letterSpacing: '0.3px'
                                      }}>
                                        {(!selectedView[record.id] || selectedView[record.id] === 'bill')
                                          ? 'Bill Image'
                                          : 'Bank Passbook Image'}
                                      </h4>
                                    </div>

                                    {(!selectedView[record.id] || selectedView[record.id] === 'bill') ? (
                                      (() => {
                                        const billImages = parseAllImageUrls(record.bill_image_supabase)
                                        const currentBillIndex = selectedBillIndex[record.id] || 0
                                        const currentImageUrl = billImages[currentBillIndex]

                                        return billImages.length > 0 && currentImageUrl ? (
                                          <div style={{ position: 'relative', width: '100%', maxWidth: '418px' }}>
                                            {/* Image Navigation for Multiple Bills */}
                                            {billImages.length > 1 && (
                                              <div style={{
                                                display: 'flex',
                                                gap: '8px',
                                                marginBottom: '12px',
                                                flexWrap: 'wrap'
                                              }}>
                                                {billImages.map((_, idx) => (
                                                  <motion.button
                                                    key={idx}
                                                    whileHover={{ scale: 1.05 }}
                                                    whileTap={{ scale: 0.95 }}
                                                    onClick={() => setSelectedBillIndex(prev => ({ ...prev, [record.id]: idx }))}
                                                    style={{
                                                      padding: '8px 16px',
                                                      borderRadius: '8px',
                                                      border: currentBillIndex === idx ? '2px solid #F97316' : '2px solid #E5E7EB',
                                                      background: currentBillIndex === idx ? '#F97316' : 'white',
                                                      color: currentBillIndex === idx ? 'white' : '#64748B',
                                                      fontSize: '12px',
                                                      fontWeight: 600,
                                                      cursor: 'pointer',
                                                      transition: 'all 0.2s'
                                                    }}
                                                  >
                                                    Bill {idx + 1}
                                                  </motion.button>
                                                ))}
                                              </div>
                                            )}

                                            <img
                                              src={currentImageUrl}
                                              alt={`Bill ${currentBillIndex + 1}`}
                                              style={{
                                                width: '100%',
                                                height: 'auto',
                                                maxHeight: '500px',
                                                objectFit: 'contain',
                                                borderRadius: '12px',
                                                border: '2px solid #E5E7EB',
                                                display: 'block',
                                                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)'
                                              }}
                                              onError={(e) => {
                                                console.error('❌ Failed to load bill image:', currentImageUrl)
                                                e.target.style.display = 'none'
                                                e.target.nextSibling.style.display = 'flex'
                                              }}
                                            />
                                            <div style={{
                                              display: 'none',
                                              flexDirection: 'column',
                                              alignItems: 'center',
                                              justifyContent: 'center',
                                              padding: '40px 20px',
                                              background: '#F8FAFC',
                                              borderRadius: '12px',
                                              border: '2px dashed #CBD5E1',
                                              gap: '12px'
                                            }}>
                                              <AlertCircle size={32} style={{ color: '#94A3B8' }} />
                                              <p style={{ color: '#64748B', fontSize: '13px', margin: 0, fontWeight: 600 }}>
                                                Image not available
                                              </p>
                                              <a
                                                href={currentImageUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                style={{
                                                  color: '#F97316',
                                                  textDecoration: 'underline',
                                                  fontSize: '12px'
                                                }}
                                              >
                                                Try opening in new tab
                                              </a>
                                            </div>
                                          </div>
                                        ) : (
                                          <div style={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            padding: '60px 20px',
                                            background: '#F8FAFC',
                                            borderRadius: '12px',
                                            border: '2px dashed #CBD5E1',
                                            gap: '12px'
                                          }}>
                                            <AlertCircle size={48} style={{ color: '#94A3B8' }} />
                                            <p style={{ color: '#64748B', fontSize: '14px', margin: 0, fontWeight: 600 }}>
                                              No bill image available
                                            </p>
                                          </div>
                                        )
                                      })()
                                    ) : (
                                      (() => {
                                        const bankImageUrl = parseImageUrl(record.bank_image_supabase)
                                        console.log('🏦 Bank image field:', record.bank_image_supabase)
                                        console.log('🏦 Parsed bank URL:', bankImageUrl)

                                        return bankImageUrl ? (
                                          <div style={{ position: 'relative', width: '100%', maxWidth: '418px' }}>
                                            <img
                                              src={bankImageUrl}
                                              alt="Bank Passbook"
                                              style={{
                                                width: '100%',
                                                height: 'auto',
                                                maxHeight: '500px',
                                                objectFit: 'contain',
                                                borderRadius: '12px',
                                                border: '2px solid #E5E7EB',
                                                display: 'block',
                                                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)'
                                              }}
                                              onError={(e) => {
                                                console.error('❌ Failed to load bank image:', bankImageUrl)
                                                e.target.style.display = 'none'
                                                e.target.nextSibling.style.display = 'flex'
                                              }}
                                              onLoad={() => {
                                                console.log('✅ Bank image loaded successfully:', bankImageUrl)
                                              }}
                                            />
                                            <div style={{
                                              display: 'none',
                                              flexDirection: 'column',
                                              alignItems: 'center',
                                              justifyContent: 'center',
                                              padding: '60px 20px',
                                              background: '#F8FAFC',
                                              borderRadius: '12px',
                                              border: '2px dashed #CBD5E1',
                                              gap: '12px'
                                            }}>
                                              <AlertCircle size={48} style={{ color: '#94A3B8' }} />
                                              <p style={{ color: '#64748B', fontSize: '14px', margin: 0, fontWeight: 600 }}>
                                                Image not available
                                              </p>
                                              <a
                                                href={bankImageUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                style={{
                                                  color: '#10B981',
                                                  textDecoration: 'underline',
                                                  fontSize: '13px'
                                                }}
                                              >
                                                Try opening in new tab
                                              </a>
                                            </div>
                                          </div>
                                        ) : (
                                          <div style={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            padding: '60px 20px',
                                            background: '#F8FAFC',
                                            borderRadius: '12px',
                                            border: '2px dashed #CBD5E1',
                                            gap: '12px'
                                          }}>
                                            <AlertCircle size={48} style={{ color: '#94A3B8' }} />
                                            <p style={{ color: '#64748B', fontSize: '14px', margin: 0, fontWeight: 600 }}>
                                              No bank passbook image available
                                            </p>
                                            <p style={{ color: '#94A3B8', fontSize: '12px', margin: 0 }}>
                                              Field value: {record.bank_image_supabase ? 'present but failed to parse' : 'null'}
                                            </p>
                                          </div>
                                        )
                                      })()
                                    )}
                                  </div>

                                  {/* Right Side - JSON Data */}
                                  <div style={{
                                    background: 'white',
                                    borderRadius: '16px',
                                    padding: '20px',
                                    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.1)',
                                    border: '1px solid #E5E7EB',
                                    overflow: 'hidden',
                                    maxWidth: '550px'
                                  }}>
                                    <div style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '10px',
                                      marginBottom: '16px',
                                      paddingBottom: '12px',
                                      borderBottom: '2px solid #F3F4F6'
                                    }}>
                                      <Database size={20} style={{
                                        color: (!selectedView[record.id] || selectedView[record.id] === 'bill') ? '#F97316' : '#10B981'
                                      }} />
                                      <h4 style={{
                                        margin: 0,
                                        fontSize: '15px',
                                        fontWeight: 700,
                                        color: '#1E293B',
                                        letterSpacing: '0.3px'
                                      }}>
                                        {(!selectedView[record.id] || selectedView[record.id] === 'bill')
                                          ? 'Bill Data (JSON)'
                                          : 'Bank Data (JSON)'}
                                      </h4>
                                    </div>

                                    <pre style={{
                                      background: 'linear-gradient(135deg, #fafbfc 0%, #f5f7fa 100%)',
                                      padding: '18px',
                                      borderRadius: '12px',
                                      border: '2px solid #E5E7EB',
                                      fontSize: '12px',
                                      fontFamily: '"JetBrains Mono", "Courier New", Courier, monospace',
                                      overflowX: 'auto',
                                      maxHeight: '500px',
                                      overflowY: 'auto',
                                      color: '#1E293B',
                                      margin: 0,
                                      whiteSpace: 'pre',
                                      wordWrap: 'normal',
                                      lineHeight: '1.7',
                                      tabSize: 2,
                                      boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.06)'
                                    }}>
                                      {(!selectedView[record.id] || selectedView[record.id] === 'bill')
                                        ? JSON.stringify(billDataArray, null, 2)
                                        : JSON.stringify(bankData, null, 2)}
                                    </pre>
                                  </div>
                                </motion.div>
                              </motion.div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Pagination */}
        {totalPages > 1 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            style={{
              background: 'white',
              padding: '24px',
              borderRadius: '20px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '20px',
              boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
              border: '1px solid rgba(0,0,0,0.05)',
              marginBottom: '32px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
              <div style={{ fontSize: '14px', color: '#64748B', fontWeight: 600 }}>
                Page {currentPage} of {totalPages}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '13px', color: '#64748B', fontWeight: 600 }}>
                  Records per page:
                </span>
                <select
                  value={recordsPerPage}
                  onChange={(e) => {
                    setRecordsPerPage(Number(e.target.value))
                    setCurrentPage(1) // Reset to first page when changing records per page
                  }}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '2px solid #E5E7EB',
                    background: 'white',
                    color: '#1E293B',
                    fontWeight: 600,
                    fontSize: '13px',
                    cursor: 'pointer',
                    outline: 'none'
                  }}
                >
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                  <option value={200}>200</option>
                  <option value={500}>500</option>
                </select>
              </div>
              <div style={{ fontSize: '13px', color: '#94A3B8' }}>
                Showing {startIndex + 1}-{Math.min(endIndex, filteredData.length)} of {filteredData.length} records
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                style={{
                  padding: '10px 16px',
                  borderRadius: '10px',
                  border: 'none',
                  background: currentPage === 1 ? '#F1F5F9' : 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)',
                  color: currentPage === 1 ? '#CBD5E1' : 'white',
                  cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <ChevronLeft size={16} />
                Previous
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                style={{
                  padding: '10px 16px',
                  borderRadius: '10px',
                  border: 'none',
                  background: currentPage === totalPages ? '#F1F5F9' : 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)',
                  color: currentPage === totalPages ? '#CBD5E1' : 'white',
                  cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                Next
                <ChevronRight size={16} />
              </motion.button>
            </div>
          </motion.div>
        )}
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700;800&display=swap');
        
        .spin {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        *::-webkit-scrollbar {
          width: 10px;
          height: 10px;
        }

        *::-webkit-scrollbar-track {
          background: #F1F5F9;
          border-radius: 10px;
        }

        *::-webkit-scrollbar-thumb {
          background: linear-gradient(135deg, #F97316 0%, #EA580C 100%);
          border-radius: 10px;
        }

        *::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(135deg, #EA580C 0%, #C2410C 100%);
        }

        input[type="checkbox"] {
          transition: all 0.2s ease;
        }

        input[type="checkbox"]:hover {
          transform: scale(1.1);
        }
      `}</style>

      {/* Zoho Configuration Modal */}
      <ZohoConfigModal
        isOpen={showZohoModal}
        onClose={() => setShowZohoModal(false)}
        selectedRecords={Array.from(selectedRecords)}
        onSuccess={handleZohoPushSuccess}
      />
    </div>
  )
}