import { useState, useEffect, useRef } from 'react'
import { Outlet, NavLink } from 'react-router-dom'
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
  Package,
  Menu,
  X
} from 'lucide-react'

function Layout() {
  const [stats, setStats] = useState({
    processed: 1282,
    success: 98.7,
    avgTime: 2.2
  })
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
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
    { path: '/cost', label: 'Cost Data', icon: DollarSign },
    { path: '/bar', label: 'Barcode Scanner', icon: Zap },
    { path: '/barcode-results', label: 'Barcode Results', icon: Package },
  ]

  const user = { name: 'authentik', email: 'root@example.com' }

  return (
    <div style={{ minHeight: '100vh', background: '#FAFBFC' }}>
      <style>{`
        * { box-sizing: border-box; }
        
        @media (max-width: 1024px) {
          .desktop-nav { display: none !important; }
          .mobile-nav-btn { display: flex !important; }
        }
        
        @media (min-width: 1025px) {
          .desktop-nav { display: flex !important; }
          .mobile-nav-btn { display: none !important; }
        }
        
        @media (max-width: 900px) {
          .stats-compact { display: none !important; }
        }
        
        @media (max-width: 640px) {
          .user-email { display: none !important; }
        }

        .nav-scroll::-webkit-scrollbar { display: none; }
      `}</style>

      {/* Header */}
      <header style={{
        background: 'rgba(255, 255, 255, 0.98)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
        boxShadow: '0 4px 24px rgba(0, 0, 0, 0.04)',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <div style={{
          maxWidth: '1600px',
          margin: '0 auto',
          padding: '0 16px'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 0',
            gap: '12px'
          }}>
            {/* Logo */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              minWidth: 'fit-content'
            }}>
              <div style={{
                width: 42,
                height: 42,
                borderRadius: 12,
                background: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 16px rgba(139, 92, 246, 0.3)'
              }}>
                <Sparkles size={20} color="white" strokeWidth={2.5} />
              </div>
              <div>
                <h1 style={{
                  margin: 0,
                  fontSize: '18px',
                  fontWeight: 800,
                  background: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  lineHeight: 1
                }}>
                  TeamEverest
                </h1>
                <p style={{
                  fontSize: '8px',
                  color: '#64748B',
                  margin: 0,
                  marginTop: 2,
                  letterSpacing: '1.2px',
                  fontWeight: 700,
                  textTransform: 'uppercase'
                }}>
                  AI DOCUMENT INTELLIGENCE
                </p>
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="desktop-nav" style={{
              display: 'flex',
              gap: '6px',
              background: '#F1F5F9',
              padding: '5px',
              borderRadius: '12px',
              boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.06)',
              flex: '1 1 auto',
              maxWidth: '700px',
              margin: '0 auto'
            }}>
              {tabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <NavLink
                    key={tab.path}
                    to={tab.path}
                    style={({ isActive }) => ({
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      background: isActive
                        ? 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)'
                        : 'transparent',
                      color: isActive ? 'white' : '#475569',
                      fontWeight: 600,
                      fontSize: '12px',
                      cursor: 'pointer',
                      textDecoration: 'none',
                      transition: 'all 0.2s',
                      boxShadow: isActive ? '0 4px 12px rgba(139, 92, 246, 0.3)' : 'none',
                      whiteSpace: 'nowrap',
                      border: 'none'
                    })}
                  >
                    <Icon size={14} />
                    {tab.label}
                  </NavLink>
                )
              })}
            </nav>

            {/* Mobile Menu Button */}
            <button 
              className="mobile-nav-btn"
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              style={{
                display: 'none',
                alignItems: 'center',
                justifyContent: 'center',
                width: 40,
                height: 40,
                borderRadius: 10,
                background: '#F1F5F9',
                border: 'none',
                cursor: 'pointer',
                color: '#8B5CF6'
              }}
            >
              {showMobileMenu ? <X size={20} /> : <Menu size={20} />}
            </button>

            {/* Stats + User */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              minWidth: 'fit-content'
            }}>
              {/* Compact Stats */}
              <div className="stats-compact" style={{
                display: 'flex',
                gap: '10px',
                padding: '6px 12px',
                background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.08) 0%, rgba(124, 58, 237, 0.08) 100%)',
                borderRadius: '10px',
                border: '1px solid rgba(139, 92, 246, 0.15)'
              }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '14px', fontWeight: 800, color: '#8B5CF6', lineHeight: 1 }}>
                    {stats.processed.toLocaleString()}
                  </div>
                  <div style={{ fontSize: '8px', color: '#64748B', marginTop: 2, fontWeight: 600 }}>
                    PROCESSED
                  </div>
                </div>
                <div style={{ width: '1px', background: 'rgba(139, 92, 246, 0.2)' }} />
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '14px', fontWeight: 800, color: '#10B981', lineHeight: 1 }}>
                    {stats.success.toFixed(1)}%
                  </div>
                  <div style={{ fontSize: '8px', color: '#64748B', marginTop: 2, fontWeight: 600 }}>
                    SUCCESS
                  </div>
                </div>
              </div>

              {/* User Menu */}
              <div style={{ position: 'relative' }} ref={menuRef}>
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '6px 10px',
                    borderRadius: '10px',
                    border: '2px solid rgba(139, 92, 246, 0.2)',
                    background: showUserMenu
                      ? 'linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(124, 58, 237, 0.15) 100%)'
                      : 'linear-gradient(135deg, rgba(139, 92, 246, 0.08) 0%, rgba(124, 58, 237, 0.08) 100%)',
                    cursor: 'pointer',
                    transition: 'all 0.3s'
                  }}
                >
                  <div style={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontWeight: 700,
                    fontSize: '13px',
                    boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)'
                  }}>
                    A
                  </div>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: '#1E293B', lineHeight: 1 }}>
                      {user.name}
                    </div>
                    <div className="user-email" style={{ fontSize: '9px', color: '#64748B', marginTop: 2 }}>
                      {user.email}
                    </div>
                  </div>
                  <ChevronDown size={14} color="#8B5CF6" style={{
                    transform: showUserMenu ? 'rotate(180deg)' : 'rotate(0)',
                    transition: 'transform 0.3s'
                  }} />
                </button>

                {/* User Dropdown */}
                {showUserMenu && (
                  <div style={{
                    position: 'absolute',
                    top: 'calc(100% + 8px)',
                    right: 0,
                    background: 'white',
                    borderRadius: '12px',
                    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.2)',
                    minWidth: '200px',
                    overflow: 'hidden',
                    zIndex: 1000
                  }}>
                    <div style={{
                      padding: '14px',
                      borderBottom: '1px solid #F1F5F9',
                      background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.05) 0%, rgba(124, 58, 237, 0.05) 100%)'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                          width: 36,
                          height: 36,
                          borderRadius: '50%',
                          background: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          fontWeight: 700,
                          fontSize: '14px'
                        }}>
                          A
                        </div>
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: 700, color: '#1E293B' }}>
                            {user.name}
                          </div>
                          <div style={{ fontSize: '10px', color: '#64748B' }}>
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div style={{ padding: '6px' }}>
                      {[
                        { icon: User, label: 'View Profile' },
                        { icon: Settings, label: 'Settings' }
                      ].map((item, i) => (
                        <button key={i} style={{
                          width: '100%',
                          padding: '10px 12px',
                          border: 'none',
                          background: 'transparent',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          fontWeight: 500,
                          color: '#475569',
                          borderRadius: '8px',
                          textAlign: 'left',
                          transition: 'background 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#F8FAFC'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                        >
                          <item.icon size={15} />
                          {item.label}
                        </button>
                      ))}
                    </div>

                    <div style={{ height: '1px', background: '#F1F5F9', margin: '4px 0' }} />

                    <div style={{ padding: '6px' }}>
                      <button style={{
                        width: '100%',
                        padding: '10px 12px',
                        border: 'none',
                        background: 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: 600,
                        color: '#DC2626',
                        borderRadius: '8px',
                        textAlign: 'left',
                        transition: 'background 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'linear-gradient(135deg, #FEE2E2 0%, #FECACA 100%)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                      >
                        <LogOut size={15} />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Mobile Navigation Menu */}
          {showMobileMenu && (
            <div style={{
              padding: '12px 0',
              borderTop: '1px solid #F1F5F9',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px'
            }}>
              {tabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <NavLink
                    key={tab.path}
                    to={tab.path}
                    onClick={() => setShowMobileMenu(false)}
                    style={({ isActive }) => ({
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '12px 16px',
                      borderRadius: '10px',
                      background: isActive
                        ? 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)'
                        : '#F8FAFC',
                      color: isActive ? 'white' : '#475569',
                      fontWeight: 600,
                      fontSize: '13px',
                      cursor: 'pointer',
                      textDecoration: 'none',
                      transition: 'all 0.2s',
                      boxShadow: isActive ? '0 4px 12px rgba(139, 92, 246, 0.3)' : 'none'
                    })}
                  >
                    <Icon size={16} />
                    {tab.label}
                  </NavLink>
                )
              })}
            </div>
          )}
        </div>
      </header>

      {/* Feature Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)',
        padding: '14px 0',
        boxShadow: '0 4px 24px rgba(139, 92, 246, 0.3)'
      }}>
        <div style={{
          maxWidth: '1600px',
          margin: '0 auto',
          padding: '0 16px'
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: '16px'
          }}>
            {[
              { icon: Zap, label: '3x Faster', value: 'Streaming Mode' },
              { icon: Shield, label: '99.9% Accurate', value: 'AI-Powered' },
              { icon: TrendingUp, label: '80% Cost Cut', value: 'Smart Tokens' },
              { icon: Clock, label: `${stats.avgTime.toFixed(1)}s Avg`, value: 'Real-time' }
            ].map((feature, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  color: 'white'
                }}
              >
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: 'rgba(255, 255, 255, 0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backdropFilter: 'blur(10px)',
                  flexShrink: 0
                }}>
                  <feature.icon size={18} />
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{
                    fontSize: '13px',
                    fontWeight: 700,
                    lineHeight: 1,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {feature.label}
                  </div>
                  <div style={{
                    fontSize: '10px',
                    opacity: 0.9,
                    marginTop: '3px',
                    fontWeight: 500
                  }}>
                    {feature.value}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main style={{
        padding: '32px 16px',
        maxWidth: '1600px',
        margin: '0 auto',
        minHeight: 'calc(100vh - 260px)'
      }}>
        <Outlet />
      </main>
    </div>
  )
}

export default Layout