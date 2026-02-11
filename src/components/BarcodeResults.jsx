import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  RefreshCw,
  Download,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  Zap,
  DollarSign,
  Image as ImageIcon,
  ChevronDown,
  ChevronUp,
  Package,
  BarChart3,
  Loader2,
  AlertCircle,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://ohfnriyabohbvgxebllt.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9oZm5yaXlhYm9oYnZneGVibGx0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ2ODI2MTksImV4cCI6MjA1MDI1ODYxOX0.KI_E7vVgzDPpKj5Sh0fZvfaG7h5mq6c5NmqfvU7vU7c';
const supabase = createClient(supabaseUrl, supabaseKey);

function BarcodeResults() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [expandedRows, setExpandedRows] = useState(new Set());
  const [selectedImage, setSelectedImage] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [recordsPerPage] = useState(50);

  // Fetch real data from Supabase
  const fetchBarcodeData = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('barcode_extraction_results')
        .select('*')
        .order('id', { ascending: false });

      if (error) throw error;

      // Parse all_barcodes JSON if it's a string
      const parsedData = data.map(row => ({
        ...row,
        all_barcodes: typeof row.all_barcodes === 'string' 
          ? JSON.parse(row.all_barcodes) 
          : row.all_barcodes
      }));

      setResults(parsedData);
    } catch (error) {
      console.error('Error fetching barcode data:', error);
      alert('Failed to fetch barcode data: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBarcodeData();
  }, []);

  const filteredResults = results.filter(result => {
    const matchesSearch = 
      result.barcode_data?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      result.filename?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      result.job_id?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || result.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Calculate stats
  const stats = {
    total: results.length,
    success: results.filter(r => r.status === 'success').length,
    failed: results.filter(r => r.status === 'failed').length,
    totalBarcodes: results.reduce((sum, r) => 
      sum + (Array.isArray(r.all_barcodes) ? r.all_barcodes.length : 0), 0
    ),
    totalCost: results.reduce((sum, r) => sum + parseFloat(r.cost_usd || 0), 0),
    avgProcessingTime: results.length > 0 
      ? results.reduce((sum, r) => sum + (r.processing_time_ms || 0), 0) / results.length 
      : 0
  };

  // Pagination
  const totalPages = Math.ceil(filteredResults.length / recordsPerPage);
  const startIndex = (currentPage - 1) * recordsPerPage;
  const endIndex = startIndex + recordsPerPage;
  const paginatedData = filteredResults.slice(startIndex, endIndex);

  const toggleRow = (id) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  const handleExport = () => {
    const headers = ['ID', 'Job ID', 'Filename', 'Barcode Type', 'Barcode Data', 'Status', 'Confidence', 'Tokens Used', 'Cost (USD)', 'Processing Time (ms)', 'Total Barcodes', 'Created At'];
    const csvRows = [headers.join(',')];

    filteredResults.forEach(result => {
      const row = [
        result.id,
        result.job_id,
        result.filename,
        result.barcode_type,
        result.barcode_data,
        result.status,
        result.confidence,
        result.tokens_used,
        result.cost_usd,
        result.processing_time_ms,
        Array.isArray(result.all_barcodes) ? result.all_barcodes.length : 0,
        result.created_at
      ];
      csvRows.push(row.map(field => `"${field}"`).join(','));
    });

    const csvStr = csvRows.join('\n');
    const dataBlob = new Blob([csvStr], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `barcode-results-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(to bottom, #faf9fb 0%, #ffffff 100%)', padding: '0 0 40px 0' }}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          background: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)',
          padding: '48px 32px',
          marginBottom: '32px',
          borderRadius: '0 0 32px 32px',
          boxShadow: '0 20px 60px rgba(139, 92, 246, 0.3)',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <div style={{ position: 'absolute', top: '-50%', right: '-10%', width: '500px', height: '500px', background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)', borderRadius: '50%' }} />
        
        <div style={{ position: 'relative', zIndex: 1 }}>
          <motion.div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '12px' }}>
            <Package size={40} style={{ color: 'white' }} />
            <h1 style={{ margin: 0, fontSize: '36px', fontWeight: 900, color: 'white', letterSpacing: '-0.5px' }}>
              Barcode Extraction Results
            </h1>
          </motion.div>
          <p style={{ margin: 0, color: 'rgba(255,255,255,0.9)', fontSize: '16px', fontWeight: 500 }}>
            View and manage extracted barcode data with detailed analytics
          </p>
        </div>
      </motion.div>

      <div style={{ padding: '0 32px', maxWidth: '1600px', margin: '0 auto' }}>
        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '20px',
            marginBottom: '32px'
          }}
        >
          {[
            { icon: Package, label: 'Total Records', value: stats.total, color: '#8B5CF6', bg: 'rgba(139, 92, 246, 0.1)' },
            { icon: CheckCircle, label: 'Success', value: stats.success, color: '#10B981', bg: 'rgba(16, 185, 129, 0.1)' },
            { icon: XCircle, label: 'Failed', value: stats.failed, color: '#EF4444', bg: 'rgba(239, 68, 68, 0.1)' },
            { icon: BarChart3, label: 'Total Barcodes', value: stats.totalBarcodes, color: '#3B82F6', bg: 'rgba(59, 130, 246, 0.1)' },
            { icon: DollarSign, label: 'Total Cost', value: `${stats.totalCost.toFixed(4)}`, color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.1)' },
            { icon: Clock, label: 'Avg Time', value: `${(stats.avgProcessingTime / 1000).toFixed(2)}s`, color: '#EC4899', bg: 'rgba(236, 72, 153, 0.1)' }
          ].map((stat, idx) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              whileHover={{ y: -4, boxShadow: '0 12px 24px rgba(0,0,0,0.1)' }}
              style={{
                background: 'white',
                padding: '20px',
                borderRadius: '16px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                border: '1px solid rgba(0,0,0,0.05)',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              <div style={{ position: 'absolute', top: -15, right: -15, width: 80, height: 80, background: stat.bg, borderRadius: '50%', opacity: 0.6 }} />
              <div style={{ position: 'relative', zIndex: 1 }}>
                <stat.icon size={24} style={{ color: stat.color, marginBottom: '10px' }} />
                <div style={{ fontSize: '12px', color: '#64748B', fontWeight: 600, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  {stat.label}
                </div>
                <div style={{ fontSize: '26px', fontWeight: 900, color: '#1E293B' }}>
                  {stat.value}
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Action Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            background: 'white',
            padding: '20px',
            borderRadius: '16px',
            marginBottom: '24px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
            border: '1px solid rgba(0,0,0,0.05)',
            display: 'flex',
            gap: '16px',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          {/* Search */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: '250px', position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '14px', color: '#8B5CF6' }} />
            <input
              type="text"
              placeholder="Search by barcode, filename, or job ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                background: '#000000ff',
                padding: '10px 10px 10px 44px',
                borderRadius: '10px',
                border: '2px solid #E5E7EB',
                fontSize: '14px',
                outline: 'none',
                transition: 'all 0.3s'
              }}
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              padding: '10px 16px',
              borderRadius: '10px',
              border: '2px solid #E5E7EB',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              outline: 'none'
            }}
          >
            <option value="all">All Status</option>
            <option value="success">Success</option>
            <option value="failed">Failed</option>
            <option value="pending">Pending</option>
          </select>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '12px' }}>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={fetchBarcodeData}
              disabled={loading}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 18px',
                borderRadius: '10px',
                border: 'none',
                background: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)',
                color: 'white',
                fontWeight: 600,
                fontSize: '14px',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.6 : 1
              }}
            >
              <RefreshCw size={16} className={loading ? 'spin' : ''} />
              Refresh
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleExport}
              disabled={filteredResults.length === 0}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 18px',
                borderRadius: '10px',
                border: '2px solid #8B5CF6',
                background: 'white',
                color: '#8B5CF6',
                fontWeight: 600,
                fontSize: '14px',
                cursor: filteredResults.length === 0 ? 'not-allowed' : 'pointer',
                opacity: filteredResults.length === 0 ? 0.5 : 1
              }}
            >
              <Download size={16} />
              Export CSV
            </motion.button>
          </div>
        </motion.div>

        {/* Data Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            background: 'white',
            borderRadius: '16px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
            border: '1px solid rgba(0,0,0,0.05)',
            overflow: 'hidden',
            marginBottom: '24px'
          }}
        >
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 20px', gap: '16px' }}>
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
                <Loader2 size={48} style={{ color: '#8B5CF6' }} />
              </motion.div>
              <p style={{ color: '#64748B', fontSize: '16px', fontWeight: 600 }}>
                Loading barcode data...
              </p>
            </div>
          ) : filteredResults.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 20px', gap: '12px' }}>
              <AlertCircle size={48} style={{ color: '#94A3B8' }} />
              <p style={{ color: '#64748B', fontSize: '16px', fontWeight: 600 }}>
                No barcode data found
              </p>
              <p style={{ color: '#94A3B8', fontSize: '14px' }}>
                {searchTerm ? 'Try a different search query' : 'Process some images to see data here'}
              </p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ background: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)', color: 'white' }}>
                    <th style={{ padding: '14px 12px', textAlign: 'left', fontWeight: 700, fontSize: '11px', letterSpacing: '0.5px', textTransform: 'uppercase' }}>ID</th>
                    <th style={{ padding: '14px 12px', textAlign: 'left', fontWeight: 700, fontSize: '11px', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Filename</th>
                    <th style={{ padding: '14px 12px', textAlign: 'left', fontWeight: 700, fontSize: '11px', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Barcode</th>
                    <th style={{ padding: '14px 12px', textAlign: 'left', fontWeight: 700, fontSize: '11px', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Type</th>
                    <th style={{ padding: '14px 12px', textAlign: 'center', fontWeight: 700, fontSize: '11px', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Status</th>
                    <th style={{ padding: '14px 12px', textAlign: 'center', fontWeight: 700, fontSize: '11px', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Confidence</th>
                    <th style={{ padding: '14px 12px', textAlign: 'right', fontWeight: 700, fontSize: '11px', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Count</th>
                    <th style={{ padding: '14px 12px', textAlign: 'right', fontWeight: 700, fontSize: '11px', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Cost</th>
                    <th style={{ padding: '14px 12px', textAlign: 'right', fontWeight: 700, fontSize: '11px', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Time</th>
                    <th style={{ padding: '14px 8px', textAlign: 'center', fontWeight: 700, fontSize: '11px', width: '60px' }}>View</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedData.map((result, index) => {
                    const isExpanded = expandedRows.has(result.id);
                    const barcodeCount = Array.isArray(result.all_barcodes) ? result.all_barcodes.length : 0;
                    
                    return (
                      <>
                        <motion.tr
                          key={result.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: index * 0.02 }}
                          style={{
                            borderBottom: '1px solid #F1F5F9',
                            background: isExpanded ? 'rgba(139, 92, 246, 0.05)' : index % 2 === 0 ? 'white' : '#FAFBFC',
                            transition: 'all 0.2s'
                          }}
                        >
                          <td style={{ padding: '12px', fontFamily: 'monospace', color: '#64748B', fontWeight: 600 }}>
                            {result.id}
                          </td>
                          <td style={{ padding: '12px', color: '#1E293B', fontWeight: 500, maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {result.filename || 'N/A'}
                          </td>
                          <td style={{ padding: '12px', fontFamily: 'monospace', color: '#8B5CF6', fontWeight: 600 }}>
                            {result.barcode_data || 'N/A'}
                          </td>
                          <td style={{ padding: '12px', color: '#475569', fontWeight: 500 }}>
                            {result.barcode_type || 'N/A'}
                          </td>
                          <td style={{ padding: '12px', textAlign: 'center' }}>
                            <span style={{
                              padding: '4px 12px',
                              borderRadius: '12px',
                              fontSize: '11px',
                              fontWeight: 700,
                              textTransform: 'uppercase',
                              background: result.status === 'success' ? '#D1FAE5' : result.status === 'failed' ? '#FEE2E2' : '#FEF3C7',
                              color: result.status === 'success' ? '#065F46' : result.status === 'failed' ? '#991B1B' : '#92400E'
                            }}>
                              {result.status}
                            </span>
                          </td>
                          <td style={{ padding: '12px', textAlign: 'center' }}>
                            <span style={{
                              padding: '4px 12px',
                              borderRadius: '12px',
                              fontSize: '11px',
                              fontWeight: 700,
                              textTransform: 'uppercase',
                              background: result.confidence === 'high' ? '#DBEAFE' : result.confidence === 'medium' ? '#FEF3C7' : '#FEE2E2',
                              color: result.confidence === 'high' ? '#1E40AF' : result.confidence === 'medium' ? '#92400E' : '#991B1B'
                            }}>
                              {result.confidence || 'N/A'}
                            </span>
                          </td>
                          <td style={{ padding: '12px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 700, color: '#3B82F6' }}>
                            {barcodeCount}
                          </td>
                          <td style={{ padding: '12px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 600, color: '#F59E0B' }}>
                            ${result.cost_usd ? parseFloat(result.cost_usd).toFixed(6) : '0.000000'}
                          </td>
                          <td style={{ padding: '12px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 600, color: '#EC4899' }}>
                            {result.processing_time_ms ? `${(result.processing_time_ms / 1000).toFixed(2)}s` : 'N/A'}
                          </td>
                          <td style={{ padding: '12px', textAlign: 'center' }}>
                            <motion.button
                              whileHover={{ scale: 1.15 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => toggleRow(result.id)}
                              style={{
                                padding: '6px',
                                borderRadius: '8px',
                                border: 'none',
                                background: isExpanded ? 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)' : '#F8FAFC',
                                color: isExpanded ? 'white' : '#64748B',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                              }}
                            >
                              {isExpanded ? <ChevronUp size={16} /> : <Eye size={16} />}
                            </motion.button>
                          </td>
                        </motion.tr>

                        {/* Expanded Row */}
                        {isExpanded && (
                          <tr>
                            <td colSpan="10" style={{ padding: '0', background: '#fafbfc' }}>
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                style={{ padding: '24px' }}
                              >
                                <div style={{ display: 'grid', gridTemplateColumns: '400px 1fr', gap: '24px', alignItems: 'start' }}>
                                  {/* Image */}
                                  <div style={{ background: 'white', borderRadius: '12px', padding: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', paddingBottom: '10px', borderBottom: '2px solid #F3F4F6' }}>
                                      <ImageIcon size={18} style={{ color: '#8B5CF6' }} />
                                      <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#1E293B' }}>Source Image</h4>
                                    </div>
                                    {result.image_url ? (
                                      <img
                                        src={result.image_url}
                                        alt="Barcode"
                                        style={{ width: '100%', borderRadius: '8px', border: '2px solid #E5E7EB' }}
                                        onError={(e) => {
                                          e.target.style.display = 'none';
                                          e.target.nextSibling.style.display = 'flex';
                                        }}
                                      />
                                    ) : null}
                                    <div style={{ display: result.image_url ? 'none' : 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 20px', background: '#F8FAFC', borderRadius: '8px', gap: '8px' }}>
                                      <AlertCircle size={32} style={{ color: '#94A3B8' }} />
                                      <p style={{ color: '#64748B', fontSize: '13px', margin: 0 }}>Image not available</p>
                                    </div>
                                  </div>

                                  {/* All Barcodes */}
                                  <div style={{ background: 'white', borderRadius: '12px', padding: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', paddingBottom: '10px', borderBottom: '2px solid #F3F4F6' }}>
                                      <Package size={18} style={{ color: '#10B981' }} />
                                      <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#1E293B' }}>
                                        All Detected Barcodes ({barcodeCount})
                                      </h4>
                                    </div>
                                    <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                                      {Array.isArray(result.all_barcodes) && result.all_barcodes.length > 0 ? (
                                        <div style={{ display: 'grid', gap: '8px' }}>
                                          {result.all_barcodes.map((barcode, idx) => (
                                            <div
                                              key={idx}
                                              style={{
                                                padding: '12px',
                                                background: 'linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 100%)',
                                                borderRadius: '8px',
                                                border: '1px solid #E5E7EB',
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center'
                                              }}
                                            >
                                              <div>
                                                <div style={{ fontSize: '12px', color: '#64748B', fontWeight: 600, marginBottom: '4px' }}>
                                                  Barcode #{idx + 1}
                                                </div>
                                                <div style={{ fontSize: '14px', fontFamily: 'monospace', fontWeight: 700, color: '#8B5CF6' }}>
                                                  {barcode.data}
                                                </div>
                                              </div>
                                              <span style={{
                                                padding: '4px 10px',
                                                borderRadius: '6px',
                                                fontSize: '10px',
                                                fontWeight: 700,
                                                background: '#DBEAFE',
                                                color: '#1E40AF'
                                              }}>
                                                {barcode.type}
                                              </span>
                                            </div>
                                          ))}
                                        </div>
                                      ) : (
                                        <div style={{ textAlign: 'center', padding: '40px 20px', color: '#94A3B8' }}>
                                          No barcodes detected
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                {/* Additional Details */}
                                <div style={{ marginTop: '16px', padding: '16px', background: 'white', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
                                  <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: 700, color: '#1E293B' }}>Additional Details</h4>
                                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', fontSize: '13px' }}>
                                    <div>
                                      <span style={{ color: '#64748B', fontWeight: 600 }}>Job ID:</span>
                                      <span style={{ marginLeft: '8px', fontFamily: 'monospace', color: '#1E293B' }}>{result.job_id}</span>
                                    </div>
                                    <div>
                                      <span style={{ color: '#64748B', fontWeight: 600 }}>File ID:</span>
                                      <span style={{ marginLeft: '8px', fontFamily: 'monospace', color: '#1E293B' }}>{result.file_id}</span>
                                    </div>
                                    <div>
                                      <span style={{ color: '#64748B', fontWeight: 600 }}>Tokens Used:</span>
                                      <span style={{ marginLeft: '8px', fontWeight: 700, color: '#8B5CF6' }}>{result.tokens_used || 0}</span>
                                    </div>
                                    <div>
                                      <span style={{ color: '#64748B', fontWeight: 600 }}>Created At:</span>
                                      <span style={{ marginLeft: '8px', color: '#1E293B' }}>{new Date(result.created_at).toLocaleString()}</span>
                                    </div>
                                    {result.error_message && (
                                      <div style={{ gridColumn: '1 / -1' }}>
                                        <span style={{ color: '#EF4444', fontWeight: 600 }}>Error:</span>
                                        <span style={{ marginLeft: '8px', color: '#991B1B' }}>{result.error_message}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </motion.div>
                            </td>
                          </tr>
                        )}
                      </>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>

        {/* Pagination */}
        {totalPages > 1 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
              background: 'white',
              padding: '20px',
              borderRadius: '16px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '16px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.06)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '14px', color: '#64748B', fontWeight: 600 }}>
                Page {currentPage} of {totalPages}
              </span>
              <span style={{ fontSize: '13px', color: '#94A3B8' }}>
                ({startIndex + 1}-{Math.min(endIndex, filteredResults.length)} of {filteredResults.length})
              </span>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  border: 'none',
                  background: currentPage === 1 ? '#F1F5F9' : 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)',
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
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  border: 'none',
                  background: currentPage === totalPages ? '#F1F5F9' : 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)',
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
        .spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default BarcodeResults;