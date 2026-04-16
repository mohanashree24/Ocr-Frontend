// src/pages/AuthSuccess.jsx
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { motion } from 'framer-motion'
import { CheckCircle, Sparkles } from 'lucide-react'

export const AuthSuccess = () => {
  const navigate = useNavigate()
  const { checkAuth } = useAuth()

  useEffect(() => {
    const completeAuth = async () => {
      await checkAuth()
      setTimeout(() => {
        navigate('/')
      }, 2000)
    }
    
    completeAuth()
  }, [])

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Animated background */}
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3]
        }}
        transition={{ duration: 3, repeat: Infinity }}
        style={{
          position: 'absolute',
          width: 400,
          height: 400,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(236, 72, 153, 0.4) 0%, transparent 70%)',
          filter: 'blur(80px)'
        }}
      />

      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        style={{
          textAlign: 'center',
          color: 'white',
          position: 'relative',
          zIndex: 1
        }}
      >
        {/* Success Icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          style={{
            width: 120,
            height: 120,
            margin: '0 auto 32px',
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.2)',
            backdropFilter: 'blur(20px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.2)',
            border: '3px solid rgba(255, 255, 255, 0.3)',
            position: 'relative'
          }}
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            style={{
              position: 'absolute',
              inset: -4,
              borderRadius: '50%',
              background: 'conic-gradient(from 0deg, transparent, rgba(255, 255, 255, 0.5), transparent)',
              opacity: 0.6
            }}
          />
          <CheckCircle size={60} strokeWidth={2.5} style={{ position: 'relative', zIndex: 1 }} />
        </motion.div>

        {/* Text */}
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          style={{ 
            fontSize: 32, 
            fontWeight: 800, 
            marginBottom: 16,
            letterSpacing: '-0.5px'
          }}
        >
          Login Successful!
        </motion.h2>
        
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          style={{ 
            fontSize: 16, 
            opacity: 0.9,
            marginBottom: 32,
            fontWeight: 500
          }}
        >
          Welcome to TeamEverest AI
        </motion.p>

        {/* Loading indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12
          }}
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
          >
            <Sparkles size={20} />
          </motion.div>
          <span style={{ fontSize: 14, opacity: 0.8 }}>
            Redirecting to dashboard...
          </span>
        </motion.div>

        {/* Progress dots */}
        <div style={{ 
          display: 'flex', 
          gap: '8px', 
          justifyContent: 'center',
          marginTop: '32px'
        }}>
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.3, 1, 0.3]
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: i * 0.2
              }}
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: 'white'
              }}
            />
          ))}
        </div>
      </motion.div>
    </div>
  )
}