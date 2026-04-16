import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import toast, { Toaster } from 'react-hot-toast'
import {
  DollarSign,
  RefreshCw,
  Search,
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  Loader2,
  AlertCircle,
  TrendingUp,
  Activity,
  Clock,
  CheckCircle,
  XCircle,
  Zap,
  Sparkles,
  BarChart3,
  FileText,
  PieChart,
  Calendar,
  IndianRupee,
  Filter,
  Grid,
  List
} from 'lucide-react'
import { createClient } from '@supabase/supabase-js'
import { LineChart, Line, BarChart, Bar, PieChart as RechartsPie, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from 'recharts'

// Initialize Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://ohfnriyabohbvgxebllt.supabase.co'
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9oZm5yaXlhYm9oYnZneGVibGx0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ2ODI2MTksImV4cCI6MjA1MDI1ODYxOX0.KI_E7vVgzDPpKj5Sh0fZvfaG7h5mq6c5NmqfvU7vU7c'
const supabase = createClient(supabaseUrl, supabaseKey)

const USD_TO_INR = 83 // Exchange rate

export default function EnhancedCostDashboard() {
  const [costData, setCostData] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [recordsPerPage] = useState(20)
  const [expandedRow, setExpandedRow] = useState(null)
  const [totalRecords, setTotalRecords] = useState(0)
  const [viewMode, setViewMode] = useState('table') // 'table' or 'charts'
  const [dateRange, setDateRange] = useState('all') // 'today', 'week', 'month', 'all'

  // Stats
  const [stats, setStats] = useState({
    totalCost: 0,
    totalCostINR: 0,
    totalTokens: 0,
    successRate: 0,
    avgProcessingTime: 0,
    totalProcessed: 0,
    bankCount: 0,
    billCount: 0
  })

  // Chart data
  const [chartData, setChartData] = useState({
    dailyCosts: [],
    docTypeDistribution: [],
    methodDistribution: [],
    hourlyActivity: []
  })

  useEffect(() => {
    fetchCostData()
    fetchStats()
  }, [currentPage, dateRange])

  const fetchCostData = async () => {
    setIsLoading(true)
    try {
      const from = (currentPage - 1) * recordsPerPage
      const to = from + recordsPerPage - 1

      let query = supabase
        .from('processing_logs')
        .select('*', { count: 'exact' })
        .order('timestamp', { ascending: false })

      // Apply date filter
      if (dateRange !== 'all') {
        const now = new Date()
        let startDate = new Date()

        if (dateRange === 'today') {
          startDate.setHours(0, 0, 0, 0)
        } else if (dateRange === 'week') {
          startDate.setDate(now.getDate() - 7)
        } else if (dateRange === 'month') {
          startDate.setDate(now.getDate() - 30)
        }

        query = query.gte('timestamp', startDate.toISOString())
      }

      const { data, error, count } = await query.range(from, to)

      if (error) throw error

      setCostData(data || [])
      setTotalRecords(count || 0)

      // Prepare chart data
      prepareChartData(data || [])

      toast.success(`✅ Loaded ${data?.length || 0} records`, {
        style: {
          borderRadius: '12px',
          background: '#F97316',
          color: '#fff'
        }
      })
    } catch (error) {
      console.error('Error fetching cost data:', error)
      toast.error('Failed to fetch data: ' + error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      let query = supabase
        .from('processing_logs')
        .select('cost_usd, total_tokens, success, processing_time_ms, doc_type')

      // Apply date filter
      if (dateRange !== 'all') {
        const now = new Date()
        let startDate = new Date()

        if (dateRange === 'today') {
          startDate.setHours(0, 0, 0, 0)
        } else if (dateRange === 'week') {
          startDate.setDate(now.getDate() - 7)
        } else if (dateRange === 'month') {
          startDate.setDate(now.getDate() - 30)
        }

        query = query.gte('timestamp', startDate.toISOString())
      }

      const { data, error } = await query

      if (error) throw error

      if (data && data.length > 0) {
        const totalCost = data.reduce((sum, record) => sum + (parseFloat(record.cost_usd) || 0), 0)
        const totalTokens = data.reduce((sum, record) => sum + (record.total_tokens || 0), 0)
        const successCount = data.filter(record => record.success).length
        const successRate = (successCount / data.length) * 100
        const avgTime = data.reduce((sum, record) => sum + (record.processing_time_ms || 0), 0) / data.length
        const bankCount = data.filter(r => r.doc_type === 'bank').length
        const billCount = data.filter(r => r.doc_type === 'bill').length

        setStats({
          totalCost: totalCost,
          totalCostINR: totalCost * USD_TO_INR,
          totalTokens: totalTokens,
          successRate: successRate,
          avgProcessingTime: avgTime,
          totalProcessed: data.length,
          bankCount: bankCount,
          billCount: billCount
        })
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  const prepareChartData = (data) => {
    // Daily costs
    const dailyMap = {}
    data.forEach(record => {
      const date = new Date(record.timestamp).toLocaleDateString('en-IN')
      if (!dailyMap[date]) {
        dailyMap[date] = { date, cost: 0, tokens: 0, count: 0 }
      }
      dailyMap[date].cost += parseFloat(record.cost_usd) || 0
      dailyMap[date].tokens += record.total_tokens || 0
      dailyMap[date].count += 1
    })
    const dailyCosts = Object.values(dailyMap).slice(0, 15).reverse()

    // Doc type distribution
    const docTypes = data.reduce((acc, r) => {
      const type = r.doc_type || 'unknown'
      acc[type] = (acc[type] || 0) + 1
      return acc
    }, {})
    const docTypeDistribution = Object.entries(docTypes).map(([name, value]) => ({ name, value }))

    // Method distribution
    const methods = data.reduce((acc, r) => {
      const method = r.method || 'unknown'
      acc[method] = (acc[method] || 0) + 1
      return acc
    }, {})
    const methodDistribution = Object.entries(methods).map(([name, value]) => ({ name, value }))

    // Hourly activity
    const hourlyMap = {}
    data.forEach(record => {
      const hour = new Date(record.timestamp).getHours()
      if (!hourlyMap[hour]) {
        hourlyMap[hour] = { hour: `${hour}:00`, count: 0 }
      }
      hourlyMap[hour].count += 1
    })
    const hourlyActivity = Object.values(hourlyMap).sort((a, b) =>
      parseInt(a.hour) - parseInt(b.hour)
    )

    setChartData({
      dailyCosts,
      docTypeDistribution,
      methodDistribution,
      hourlyActivity
    })
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

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    return date.toLocaleString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const filteredData = costData.filter(record => {
    if (!searchQuery) return true
    const searchLower = searchQuery.toLowerCase()
    return (
      record.filename?.toLowerCase().includes(searchLower) ||
      record.student_name?.toLowerCase().includes(searchLower) ||
      record.scholarship_id?.toLowerCase().includes(searchLower) ||
      record.doc_type?.toLowerCase().includes(searchLower)
    )
  })

  const totalPages = Math.ceil(totalRecords / recordsPerPage)

  const handleExport = () => {
    const headers = [
      'Timestamp',
      'Doc Type',
      'Filename',
      'Method',
      'Student Name',
      'Input Tokens',
      'Output Tokens',
      'Total Tokens',
      'Cost (USD)',
      'Cost (INR)',
      'Processing Time (ms)',
      'Success'
    ]

    const csvRows = [headers.join(',')]

    filteredData.forEach(record => {
      const row = [
        formatDate(record.timestamp),
        record.doc_type || '',
        (record.filename || '').replace(/,/g, ';'),
        record.method || '',
        (record.student_name || '').replace(/,/g, ';'),
        record.input_tokens || 0,
        record.output_tokens || 0,
        record.total_tokens || 0,
        record.cost_usd || 0,
        ((record.cost_usd || 0) * USD_TO_INR).toFixed(2),
        record.processing_time_ms || 0,
        record.success ? 'Yes' : 'No'
      ]

      csvRows.push(row.map(field => `"${field}"`).join(','))
    })

    const csvStr = csvRows.join('\n')
    const dataBlob = new Blob([csvStr], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `cost-analytics-${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    URL.revokeObjectURL(url)
    toast.success('📊 Data exported successfully!')
  }

  const COLORS = ['#F97316', '#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#EC4899']

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

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        .spinning {
          animation: spin 1s linear infinite;
        }
      `}</style>

      {/* Hero Header */}
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
          <BarChart3 size={28} color="#F97316" />
        </div>
        <div>
          <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.5px' }}>
            Cost Analytics Dashboard
          </h1>
          <p style={{ margin: '4px 0 0 0', color: '#64748B', fontSize: '14px', fontWeight: 500 }}>
            Real-time processing metrics, cost analysis, and performance insights
          </p>
        </div>
      </motion.div>

      {/* Filters & Actions Bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card"
        style={{ padding: '24px', marginBottom: '32px' }}
      >
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Date Range Filter */}
          <div style={{ display: 'flex', gap: '8px' }}>
            {['today', 'week', 'month', 'all'].map(range => (
              <button
                key={range}
                onClick={() => setDateRange(range)}
                style={{
                  padding: '10px 20px',
                  borderRadius: '12px',
                  border: dateRange === range ? '2px solid #F97316' : '2px solid #E2E8F0',
                  background: dateRange === range ? 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)' : 'white',
                  color: dateRange === range ? 'white' : '#475569',
                  fontWeight: 600,
                  fontSize: '14px',
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                  textTransform: 'capitalize'
                }}
              >
                {range === 'all' ? 'All Time' : range === 'week' ? 'Last 7 Days' : range === 'month' ? 'Last 30 Days' : 'Today'}
              </button>
            ))}
          </div>

          <div style={{ marginLeft: 'auto', display: 'flex', gap: '12px' }}>
            {/* View Mode Toggle */}
            <button
              onClick={() => setViewMode(viewMode === 'table' ? 'charts' : 'table')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 24px',
                borderRadius: '12px',
                border: '2px solid #E2E8F0',
                background: 'white',
                color: '#475569',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.3s'
              }}
            >
              {viewMode === 'table' ? <PieChart size={18} /> : <List size={18} />}
              {viewMode === 'table' ? 'Charts View' : 'Table View'}
            </button>

            <button
              onClick={() => {
                fetchCostData()
                fetchStats()
              }}
              disabled={isLoading}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 24px',
                borderRadius: '12px',
                border: 'none',
                background: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)',
                color: 'white',
                fontWeight: 600,
                cursor: isLoading ? 'not-allowed' : 'pointer',
                opacity: isLoading ? 0.7 : 1
              }}
            >
              <RefreshCw size={18} className={isLoading ? 'spinning' : ''} />
              Refresh
            </button>

            <button
              onClick={handleExport}
              disabled={filteredData.length === 0}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 24px',
                borderRadius: '12px',
                border: '2px solid #E2E8F0',
                background: 'white',
                color: '#475569',
                fontWeight: 600,
                cursor: filteredData.length === 0 ? 'not-allowed' : 'pointer',
                opacity: filteredData.length === 0 ? 0.5 : 1
              }}
            >
              <Download size={18} />
              Export CSV
            </button>
          </div>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '32px' }}>
        <div className="stat-card">
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ fontSize: '13px', opacity: 0.9, marginBottom: '8px', letterSpacing: '0.5px' }}>
              TOTAL COST (USD)
            </div>
            <div style={{ fontSize: '40px', fontWeight: 800, lineHeight: 1 }}>
              ${stats.totalCost.toFixed(4)}
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ fontSize: '13px', opacity: 0.9, marginBottom: '8px', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <IndianRupee size={14} />
              TOTAL COST (INR)
            </div>
            <div style={{ fontSize: '40px', fontWeight: 800, lineHeight: 1 }}>
  ₹{stats.totalCostINR.toFixed(4)}
</div>
          </div>
        </div>

        <div className="stat-card">
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ fontSize: '13px', opacity: 0.9, marginBottom: '8px', letterSpacing: '0.5px' }}>
              TOTAL TOKENS
            </div>
            <div style={{ fontSize: '40px', fontWeight: 800, lineHeight: 1 }}>
              {stats.totalTokens.toLocaleString()}
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ fontSize: '13px', opacity: 0.9, marginBottom: '8px', letterSpacing: '0.5px' }}>
              SUCCESS RATE
            </div>
            <div style={{ fontSize: '40px', fontWeight: 800, lineHeight: 1 }}>
              {stats.successRate.toFixed(1)}%
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ fontSize: '13px', opacity: 0.9, marginBottom: '8px', letterSpacing: '0.5px' }}>
              AVG TIME
            </div>
            <div style={{ fontSize: '40px', fontWeight: 800, lineHeight: 1 }}>
              {(stats.avgProcessingTime / 1000).toFixed(2)}s
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ fontSize: '13px', opacity: 0.9, marginBottom: '8px', letterSpacing: '0.5px' }}>
              PROCESSED
            </div>
            <div style={{ fontSize: '40px', fontWeight: 800, lineHeight: 1 }}>
              {stats.totalProcessed}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <AnimatePresence mode="wait">
        {viewMode === 'charts' ? (
          // Charts View
          <motion.div
            key="charts"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            {/* Daily Cost Trend */}
            <motion.div className="glass-card" style={{ padding: '32px', marginBottom: '24px' }}>
              <h3 style={{ margin: '0 0 24px 0', fontSize: '20px', fontWeight: 700, color: '#1E293B', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <TrendingUp size={24} color="#F97316" />
                Daily Cost Trend
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={chartData.dailyCosts}>
                  <defs>
                    <linearGradient id="costGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#F97316" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#F97316" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="date" stroke="#64748B" style={{ fontSize: '12px' }} />
                  <YAxis stroke="#64748B" style={{ fontSize: '12px' }} />
                  <Tooltip
                    contentStyle={{
                      background: 'white',
                      border: '1px solid #E2E8F0',
                      borderRadius: '12px',
                      padding: '12px'
                    }}
                  />
                  <Area type="monotone" dataKey="cost" stroke="#F97316" strokeWidth={3} fill="url(#costGradient)" />
                </AreaChart>
              </ResponsiveContainer>
            </motion.div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px', marginBottom: '24px' }}>
              {/* Doc Type Distribution */}
              <motion.div className="glass-card" style={{ padding: '32px' }}>
                <h3 style={{ margin: '0 0 24px 0', fontSize: '20px', fontWeight: 700, color: '#1E293B', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <PieChart size={24} color="#F97316" />
                  Document Type Distribution
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPie>
                    <Pie
                      data={chartData.docTypeDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {chartData.docTypeDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </RechartsPie>
                </ResponsiveContainer>
              </motion.div>

              {/* Method Distribution */}
              <motion.div className="glass-card" style={{ padding: '32px' }}>
                <h3 style={{ margin: '0 0 24px 0', fontSize: '20px', fontWeight: 700, color: '#1E293B', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Activity size={24} color="#F97316" />
                  Processing Methods
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData.methodDistribution}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                    <XAxis dataKey="name" stroke="#64748B" style={{ fontSize: '12px' }} />
                    <YAxis stroke="#64748B" style={{ fontSize: '12px' }} />
                    <Tooltip
                      contentStyle={{
                        background: 'white',
                        border: '1px solid #E2E8F0',
                        borderRadius: '12px'
                      }}
                    />
                    <Bar dataKey="value" fill="#F97316" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </motion.div>
            </div>

            {/* Hourly Activity */}
            <motion.div className="glass-card" style={{ padding: '32px' }}>
              <h3 style={{ margin: '0 0 24px 0', fontSize: '20px', fontWeight: 700, color: '#1E293B', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Clock size={24} color="#F97316" />
                Hourly Processing Activity
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData.hourlyActivity}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="hour" stroke="#64748B" style={{ fontSize: '12px' }} />
                  <YAxis stroke="#64748B" style={{ fontSize: '12px' }} />
                  <Tooltip
                    contentStyle={{
                      background: 'white',
                      border: '1px solid #E2E8F0',
                      borderRadius: '12px'
                    }}
                  />
                  <Line type="monotone" dataKey="count" stroke="#F97316" strokeWidth={3} dot={{ fill: '#F97316', r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            </motion.div>
          </motion.div>
        ) : (
          // Table View
          <motion.div
            key="table"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            {/* Search Bar */}
            <motion.div className="glass-card" style={{ padding: '20px', marginBottom: '24px' }}>
              <div style={{ position: 'relative' }}>
                <Search size={20} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#F97316' }} />
                <input
                  type="text"
                  placeholder="Search by filename, student name, scholarship ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '14px 14px 14px 48px',
                    background: 'white',
                    borderRadius: '12px',
                    border: '2px solid #E2E8F0',
                    fontSize: '14px',
                    fontWeight: 500,
                    outline: 'none',
                    transition: 'all 0.3s'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#F97316'}
                  onBlur={(e) => e.target.style.borderColor = '#E2E8F0'}
                />
              </div>
            </motion.div>

            {/* Table */}
            <motion.div className="glass-card" style={{ overflow: 'hidden' }}>
              {isLoading ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '100px 20px', gap: '20px' }}>
                  <Loader2 size={56} style={{ color: '#F97316' }} className="spinning" />
                  <p style={{ color: '#F97316', fontSize: '18px', fontWeight: 700 }}>Loading analytics...</p>
                </div>
              ) : filteredData.length === 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '100px 20px', gap: '20px' }}>
                  <AlertCircle size={56} style={{ color: '#94A3B8' }} />
                  <p style={{ color: '#64748B', fontSize: '18px', fontWeight: 700 }}>No data found</p>
                </div>
              ) : (
                <div style={{ maxHeight: '600px', overflow: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0 }}>
                    <thead>
                      <tr style={{ background: 'linear-gradient(135deg, #1E293B 0%, #334155 100%)', color: 'white' }}>
                        {['Timestamp', 'Type', 'Filename', 'Method', 'Student', 'Tokens', 'Cost (USD)', 'Cost (INR)', 'Time', 'Status', 'View'].map((header, i) => (
                          <th key={i} style={{ padding: '18px 20px', textAlign: header === 'Status' || header === 'View' ? 'center' : 'left', fontWeight: 700, fontSize: '12px', letterSpacing: '1px', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredData.map((record, index) => (
                        <tr key={record.id} style={{ borderBottom: '1px solid #F1F5F9', background: index % 2 === 0 ? 'white' : '#F8FAFC', transition: 'all 0.2s' }}>
                          <td style={{ padding: '18px 20px', color: '#64748B', fontSize: '12px', fontWeight: 600 }}>
                            {formatDate(record.timestamp)}
                          </td>
                          <td style={{ padding: '18px 20px' }}>
                            <span style={{ background: record.doc_type === 'bank' ? '#10B981' : '#F97316', padding: '6px 12px', borderRadius: '8px', color: 'white', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase' }}>
                              {record.doc_type || 'N/A'}
                            </span>
                          </td>
                          <td style={{ padding: '18px 20px', color: '#475569', fontSize: '13px', fontWeight: 600, maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {record.filename || 'N/A'}
                          </td>
                          <td style={{ padding: '18px 20px', color: '#F97316', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase' }}>
                            {record.method || 'N/A'}
                          </td>
                          <td style={{ padding: '18px 20px', color: '#1E293B', fontSize: '13px', fontWeight: 700, maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {record.student_name || 'N/A'}
                          </td>
                          <td style={{ padding: '18px 20px', color: '#F97316', fontWeight: 800, fontFamily: 'monospace' }}>
                            {(record.total_tokens || 0).toLocaleString()}
                          </td>
                          <td style={{ padding: '18px 20px' }}>
                            <span style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '6px 12px', borderRadius: '8px', color: '#10B981', fontWeight: 800, fontSize: '13px', fontFamily: 'monospace' }}>
                              ${(record.cost_usd || 0).toFixed(6)}
                            </span>
                          </td>
                          <td style={{ padding: '18px 20px' }}>
  <span style={{ background: 'rgba(249, 115, 22, 0.1)', padding: '6px 12px', borderRadius: '8px', color: '#F97316', fontWeight: 800, fontSize: '13px', fontFamily: 'monospace' }}>
    ₹{((record.cost_usd || 0) * USD_TO_INR).toFixed(4)}
  </span>
</td>
                          <td style={{ padding: '18px 20px', color: '#F59E0B', fontWeight: 800, fontFamily: 'monospace' }}>
                            {(record.processing_time_ms || 0).toLocaleString()}ms
                          </td>
                          <td style={{ padding: '18px 20px', textAlign: 'center' }}>
                            {record.success ? (
                              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(16, 185, 129, 0.1)', color: '#10B981', padding: '6px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: 800 }}>
                                <CheckCircle size={14} />
                                Success
                              </div>
                            ) : (
                              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(239, 68, 68, 0.1)', color: '#EF4444', padding: '6px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: 800 }}>
                                <XCircle size={14} />
                                Failed
                              </div>
                            )}
                          </td>
                          <td style={{ padding: '18px 20px', textAlign: 'center' }}>
                            <button
                              onClick={() => setExpandedRow(expandedRow === record.id ? null : record.id)}
                              style={{ width: '36px', height: '36px', borderRadius: '8px', border: 'none', background: expandedRow === record.id ? '#F97316' : 'rgba(249, 115, 22, 0.1)', color: expandedRow === record.id ? 'white' : '#F97316', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            >
                              <Eye size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </motion.div>

            {/* Pagination */}
            {totalPages > 1 && (
              <motion.div className="glass-card" style={{ padding: '20px', marginTop: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ color: '#64748B', fontSize: '14px', fontWeight: 600 }}>
                  Showing {((currentPage - 1) * recordsPerPage) + 1} to {Math.min(currentPage * recordsPerPage, totalRecords)} of {totalRecords} records
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '12px', border: 'none', background: currentPage === 1 ? '#E2E8F0' : 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)', color: currentPage === 1 ? '#94A3B8' : 'white', fontWeight: 600, cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}
                  >
                    <ChevronLeft size={16} />
                    Previous
                  </button>
                  <div style={{ padding: '10px 20px', fontWeight: 700, color: '#1E293B' }}>
                    Page {currentPage} of {totalPages}
                  </div>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '12px', border: 'none', background: currentPage === totalPages ? '#E2E8F0' : 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)', color: currentPage === totalPages ? '#94A3B8' : 'white', fontWeight: 600, cursor: currentPage === totalPages ? 'not-allowed' : 'pointer' }}
                  >
                    Next
                    <ChevronRight size={16} />
                  </button>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}