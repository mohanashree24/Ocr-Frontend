import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Lock, User, AlertCircle, Sparkles, Shield, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import NeuralBackground from './ui/NeuralBackground'
import InteractiveInput from './ui/InteractiveInput'

function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const { login } = useAuth()
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'


  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const result = await login(username, password)

      if (result.success) {
        console.log('✅ Login successful, redirecting...')
        navigate('/auto')
      } else {
        setError(result.message || 'Login failed. Please try again.')
      }
    } catch (err) {
      setError('Connection error. Please try again.')
      console.error('Login error:', err)
    } finally {
      setLoading(false)
    }
  }


  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      width: '100vw',
      height: '100vh',
      margin: 0,
      padding: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden'
    }}>
      {/* Neural Flow Field Background */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100%',
        height: '100%',
        margin: 0,
        padding: 0,
        zIndex: 0
      }}>
        <NeuralBackground
          color="#F97316" // Purple to match your theme
          trailOpacity={0.12}
          particleCount={700}
          speed={0.9}
        />
      </div>

      {/* Login Card */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        style={{
          width: '100%',
          maxWidth: 480,
          margin: '0 20px',
          position: 'relative',
          zIndex: 1
        }}
      >
        <div style={{
          background: 'rgba(255, 255, 255, 0.98)',
          backdropFilter: 'blur(40px)',
          borderRadius: 32,
          padding: '56px 48px',
          boxShadow: '0 40px 100px rgba(0, 0, 0, 0.2)',
          border: '1px solid rgba(255, 255, 255, 0.5)'
        }}>
          {/* Logo */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ duration: 0.8, delay: 0.2, type: 'spring' }}
            style={{
              width: 80,
              height: 80,
              margin: '0 auto 32px',
              borderRadius: 24,
              background: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 20px 60px rgba(249, 115, 22, 0.5)',
              border: '3px solid rgba(255, 255, 255, 0.5)',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            <div style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.4), transparent)',
              opacity: 0.8
            }} />
            <Sparkles size={40} color="white" strokeWidth={2.5} style={{ position: 'relative', zIndex: 1 }} />
          </motion.div>

          {/* Title */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            style={{ textAlign: 'center', marginBottom: 40 }}
          >
            <h1 style={{
              fontSize: 32,
              fontWeight: 800,
              background: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              marginBottom: 12,
              letterSpacing: '-0.5px'
            }}>
              Welcome Back
            </h1>
            <p style={{
              fontSize: 16,
              color: '#64748B',
              margin: 0,
              fontWeight: 500
            }}>
              Sign in to TeamEverest AI
            </p>
          </motion.div>

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              style={{
                background: 'linear-gradient(135deg, #FEE2E2 0%, #FECACA 100%)',
                border: '1px solid #FCA5A5',
                borderRadius: 16,
                padding: '16px 20px',
                marginBottom: 24,
                display: 'flex',
                alignItems: 'center',
                gap: 12
              }}
            >
              <AlertCircle size={20} color="#DC2626" />
              <span style={{ color: '#DC2626', fontSize: 14, fontWeight: 500 }}>
                {error}
              </span>
            </motion.div>
          )}

          {/* Login Form */}
          <form onSubmit={handleLogin}>
            {/* Username Field */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              style={{ marginBottom: 20 }}
            >
              <InteractiveInput
                label="Username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                required
                disabled={loading}
                icon={{
                  element: <User size={20} />,
                  position: 'left'
                }}
              />
            </motion.div>

            {/* Password Field */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
              style={{ marginBottom: 24 }}
            >
              <InteractiveInput
                label="Password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                disabled={loading}
                icon={{
                  element: <Lock size={20} />,
                  position: 'left'
                }}
                rightButton={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#94A3B8',
                      padding: 4,
                      display: 'flex',
                      alignItems: 'center'
                    }}
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                }
              />
            </motion.div>

            {/* Login Button */}
            <motion.button
              whileHover={{ scale: loading ? 1 : 1.02, boxShadow: loading ? 'none' : '0 20px 60px rgba(249, 115, 22, 0.4)' }}
              whileTap={{ scale: loading ? 1 : 0.98 }}
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '18px 32px',
                borderRadius: 16,
                border: 'none',
                background: loading
                  ? 'linear-gradient(135deg, #A78BFA 0%, #9333EA 100%)'
                  : 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)',
                color: 'white',
                fontSize: 16,
                fontWeight: 700,
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 12,
                boxShadow: '0 12px 40px rgba(249, 115, 22, 0.3)',
                transition: 'all 0.3s ease',
                opacity: loading ? 0.7 : 1
              }}
            >
              {loading ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    style={{
                      width: 20,
                      height: 20,
                      border: '3px solid rgba(255, 255, 255, 0.3)',
                      borderTopColor: 'white',
                      borderRadius: '50%'
                    }}
                  />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <Shield size={20} />
                  <span>Sign In</span>
                </>
              )}
            </motion.button>
          </form>
        </div>

        {/* Footer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          style={{
            textAlign: 'center',
            marginTop: 24,
            color: 'rgba(255, 255, 255, 0.9)',
            fontSize: 14,
            fontWeight: 500
          }}
        >
          Protected by TeamEverest
        </motion.p>
      </motion.div>
    </div>
  )
}

export default Login