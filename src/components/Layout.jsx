import { useState, useEffect, useRef } from 'react'
import { Outlet, NavLink } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Zap,
  Sparkles,
  TrendingUp,
  Shield,
  Clock,
  Database,
  DollarSign,
  LogOut,
  User,
  Settings,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Package,
  Menu,
  X,
  LayoutDashboard
} from 'lucide-react'

function Layout() {
  const [stats, setStats] = useState({
    processed: 1282,
    success: 98.7,
    avgTime: 2.2
  })
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowUserMenu(false)
      }
    }
    if (showUserMenu) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showUserMenu])

  const tabs = [
    { path: '/auto-extract', label: 'Auto Extractor', icon: Zap },
    { path: '/extracted-data', label: 'Extracted Data', icon: Database },
    { path: '/cost', label: 'Cost Analytics', icon: DollarSign },
    { path: '/bar', label: 'Barcode Scanner', icon: Package },
    { path: '/barcode-results', label: 'Barcode Results', icon: LayoutDashboard },
  ]

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-secondary)', fontFamily: 'inherit' }}>
      <style>{`
        * { box-sizing: border-box; }
        
        body { margin: 0; padding: 0; }

        .sidebar {
          width: ${isSidebarCollapsed ? '85px' : '270px'};
          background: #ffffff;
          border-right: 1px solid #E2E8F0;
          display: flex;
          flex-direction: column;
          position: fixed;
          top: 0;
          bottom: 0;
          left: 0;
          z-index: 50;
          transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1), transform 0.3s ease;
        }

        .main-content {
          flex: 1;
          margin-left: ${isSidebarCollapsed ? '85px' : '270px'};
          display: flex;
          flex-direction: column;
          min-height: 100vh;
          transition: margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          overflow-x: hidden;
        }

        @media (max-width: 1024px) {
          .sidebar {
            transform: translateX(-100%);
          }
          .sidebar.open {
            transform: translateX(0);
          }
          .main-content {
            margin-left: 0;
          }
          .mobile-menu-btn { display: flex !important; }
          .mobile-overlay {
            display: block !important;
            position: fixed;
            inset: 0;
            background: rgba(15, 23, 42, 0.4);
            backdrop-filter: blur(4px);
            z-index: 40;
          }
        }
        
        @media (max-width: 768px) {
           .stats-banner { display: none !important; }
        }

        .nav-link {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          margin: 4px 16px;
          border-radius: 12px;
          color: #64748B;
          font-weight: 500;
          font-size: 14px;
          text-decoration: none;
          transition: all 0.2s ease;
        }

        .nav-link:hover {
          background: #F1F5F9;
          color: #0F172A;
        }

        .nav-link.active {
          background: linear-gradient(135deg, #EFECFF 0%, #F5F3FF 100%);
          color: #EA580C;
          font-weight: 600;
          box-shadow: inset 2px 0 0 #EA580C;
        }

        .user-menu-btn {
          width: 100%;
          background: transparent;
          border: none;
          padding: 12px 16px;
          display: flex;
          align-items: center;
          gap: 12px;
          cursor: pointer;
          border-top: 1px solid #E2E8F0;
          transition: background 0.2s;
        }
        .user-menu-btn:hover {
          background: #F8FAFC;
        }
      `}</style>

      {/* Mobile Overlay */}
      {showMobileMenu && (
        <div className="mobile-overlay" onClick={() => setShowMobileMenu(false)}></div>
      )}

      {/* Sidebar */}
      <aside className={`sidebar ${showMobileMenu ? 'open' : ''}`}>
        {/* Toggle Button for Desktop */}
        <button 
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          className="sidebar-toggle"
          style={{
            position: 'absolute',
            right: '-14px',
            top: '32px',
            background: 'white',
            border: '2px solid #E2E8F0',
            borderRadius: '50%',
            width: '28px',
            height: '28px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            zIndex: 100,
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            color: '#64748B',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.1)';
            e.currentTarget.style.color = '#F97316';
            e.currentTarget.style.borderColor = '#F97316';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.color = '#64748B';
            e.currentTarget.style.borderColor = '#E2E8F0';
          }}
        >
          {isSidebarCollapsed ? <ChevronRight size={16} strokeWidth={2.5} /> : <ChevronLeft size={16} strokeWidth={2.5} />}
        </button>

        {/* Logo Area */}
        <div style={{ padding: '24px 20px', display: 'flex', alignItems: 'center', gap: '12px', overflow: 'hidden' }}>
          <div style={{
            width: 40, height: 40, minWidth: 40, borderRadius: 12,
            background: 'linear-gradient(135deg, #F97316 0%, #C2410C 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 8px 16px rgba(249, 115, 22, 0.25)'
          }}>
            <Sparkles size={20} color="white" strokeWidth={2.5} />
          </div>
          {!isSidebarCollapsed && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ overflow: 'hidden' }}>
              <h1 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.5px', whiteSpace: 'nowrap' }}>
                TeamEverest
              </h1>
              <p style={{ margin: 0, fontSize: '10px', color: '#64748B', fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                Intelligence Hub
              </p>
            </motion.div>
          )}
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, overflowY: 'auto', padding: '12px 0', display: 'flex', flexDirection: 'column', gap: '4px', overflowX: 'hidden' }}>
          {!isSidebarCollapsed && (
            <div style={{ padding: '0 20px 8px', fontSize: '11px', fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>
              Main Menu
            </div>
          )}
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <NavLink key={tab.path} to={tab.path} onClick={() => setShowMobileMenu(false)}
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                style={{
                  justifyContent: isSidebarCollapsed ? 'center' : 'flex-start',
                  padding: isSidebarCollapsed ? '12px' : '12px 16px',
                  margin: isSidebarCollapsed ? '4px 12px' : '4px 16px'
                }}
                title={isSidebarCollapsed ? tab.label : ''}
              >
                <Icon size={18} strokeWidth={2} style={{ minWidth: '18px' }} />
                {!isSidebarCollapsed && <span style={{ whiteSpace: 'nowrap' }}>{tab.label}</span>}
              </NavLink>
            )
          })}
        </nav>

        
      </aside>

      {/* Main Content Area */}
      <div className="main-content">
        {/* Top Header */}
        <header style={{
          background: 'rgba(255, 255, 255, 0.8)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid #E2E8F0',
          position: 'sticky',
          top: 0,
          zIndex: 30,
          padding: '12px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          {/* Mobile menu toggle */}
          <button className="mobile-menu-btn" onClick={() => setShowMobileMenu(true)} style={{
            display: 'none', alignItems: 'center', justifyContent: 'center',
            width: 40, height: 40, borderRadius: 10, background: '#F1F5F9', border: 'none', cursor: 'pointer', color: '#475569'
          }}>
            <Menu size={20} />
          </button>
          
          <div style={{ flex: 1 }}></div>

          {/* Top Right Stats Banner */}
          <div className="stats-banner" style={{ display: 'flex', gap: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3B82F6' }}>
                <Shield size={16} />
              </div>
              <div>
                <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 600, textTransform: 'uppercase' }}>Success Rate</div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#0F172A' }}>{stats.success.toFixed(1)}%</div>
              </div>
            </div>
            <div style={{ width: 1, background: '#E2E8F0' }}></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: '#F5F3FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#F97316' }}>
                <Clock size={16} />
              </div>
              <div>
                <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 600, textTransform: 'uppercase' }}>Avg Time</div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#0F172A' }}>{stats.avgTime.toFixed(1)}s</div>
              </div>
            </div>
          </div>
        </header>

        {/* Dynamic Page Content */}
        <main style={{ padding: '32px', maxWidth: '1400px', margin: '0 auto', width: '100%', overflowX: 'hidden' }}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default Layout