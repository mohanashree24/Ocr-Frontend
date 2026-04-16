// src/components/ui/AnimationEffects.jsx
import React, { useEffect, useState } from 'react'

/**
 * Particle Effect Component - Creates floating particles
 */
export const ParticleEffect = ({ count = 20, duration = 3 }) => {
  const [particles, setParticles] = useState([])

  useEffect(() => {
    const newParticles = Array.from({ length: count }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 0.5,
      duration: duration + Math.random() * 2,
    }))
    setParticles(newParticles)
  }, [count, duration])

  return (
    <div className="particle-container">
      {particles.map(particle => (
        <div
          key={particle.id}
          className="particle"
          style={{
            left: `${particle.left}%`,
            animation: `particleFloat ${particle.duration}s ease-in ${particle.delay}s infinite`,
          }}
        />
      ))}
    </div>
  )
}

/**
 * Shimmer Loading Component
 */
export const ShimmerLoader = ({ width = '100%', height = '20px', count = 3 }) => {
  return (
    <div className="shimmer-loader">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="shimmer-item"
          style={{
            width,
            height,
            marginBottom: '10px',
            animation: `shimmer 2s infinite`,
            animationDelay: `${i * 0.2}s`,
          }}
        />
      ))}
    </div>
  )
}

/**
 * Pulse Badge Component
 */
export const PulseBadge = ({ text, color = 'blue' }) => {
  return (
    <span
      className={`pulse-badge pulse-badge-${color}`}
      style={{
        animation: 'pulse 2s ease-in-out infinite',
      }}
    >
      {text}
    </span>
  )
}

/**
 * Bounce Button Component
 */
export const BounceButton = ({ children, onClick, className = '' }) => {
  return (
    <button
      className={`bounce-btn ${className}`}
      onClick={onClick}
      style={{
        animation: 'bounce 0.6s ease-in-out',
      }}
    >
      {children}
    </button>
  )
}

/**
 * Glow Text Component
 */
export const GlowText = ({ children, intensity = 'medium' }) => {
  return (
    <span
      className={`glow-text glow-${intensity}`}
      style={{
        animation: 'glowText 2s ease-in-out infinite',
      }}
    >
      {children}
    </span>
  )
}

/**
 * Fade In Component
 */
export const FadeIn = ({ children, delay = 0, duration = 0.6 }) => {
  return (
    <div
      style={{
        animation: `fadeInUp ${duration}s ease-out ${delay}s both`,
      }}
    >
      {children}
    </div>
  )
}

/**
 * Slide In Component
 */
export const SlideIn = ({ children, direction = 'up', delay = 0, duration = 0.6 }) => {
  const animationMap = {
    up: 'slideInUp',
    down: 'slideInDown',
    left: 'slideInLeft',
    right: 'slideInRight',
  }

  return (
    <div
      style={{
        animation: `${animationMap[direction]} ${duration}s ease-out ${delay}s both`,
      }}
    >
      {children}
    </div>
  )
}

/**
 * Scale In Component
 */
export const ScaleIn = ({ children, delay = 0, duration = 0.6 }) => {
  return (
    <div
      style={{
        animation: `scaleIn ${duration}s ease-out ${delay}s both`,
      }}
    >
      {children}
    </div>
  )
}

/**
 * Bounce In Component
 */
export const BounceIn = ({ children, delay = 0, duration = 0.6 }) => {
  return (
    <div
      style={{
        animation: `bounceIn ${duration}s ease-out ${delay}s both`,
      }}
    >
      {children}
    </div>
  )
}

/**
 * Rotate Component
 */
export const Rotate = ({ children, speed = 1, direction = 'clockwise' }) => {
  const animation = direction === 'clockwise' ? 'rotate360' : 'rotateReverse'
  return (
    <div
      style={{
        animation: `${animation} ${speed}s linear infinite`,
        display: 'inline-block',
      }}
    >
      {children}
    </div>
  )
}

/**
 * Pulse Component
 */
export const Pulse = ({ children, speed = 2 }) => {
  return (
    <div
      style={{
        animation: `pulse ${speed}s ease-in-out infinite`,
      }}
    >
      {children}
    </div>
  )
}

/**
 * Glow Component
 */
export const Glow = ({ children, speed = 1.5 }) => {
  return (
    <div
      style={{
        animation: `glow ${speed}s ease-in-out infinite`,
      }}
    >
      {children}
    </div>
  )
}

/**
 * Shake Component
 */
export const Shake = ({ children, trigger = false }) => {
  return (
    <div
      style={{
        animation: trigger ? 'shake 0.5s ease-in-out' : 'none',
      }}
    >
      {children}
    </div>
  )
}

/**
 * Wiggle Component
 */
export const Wiggle = ({ children, speed = 0.5 }) => {
  return (
    <div
      style={{
        animation: `wiggle ${speed}s ease-in-out infinite`,
        display: 'inline-block',
      }}
    >
      {children}
    </div>
  )
}

/**
 * Heartbeat Component
 */
export const Heartbeat = ({ children, speed = 1 }) => {
  return (
    <div
      style={{
        animation: `heartbeat ${speed}s ease-in-out infinite`,
      }}
    >
      {children}
    </div>
  )
}

/**
 * Wave Component
 */
export const Wave = ({ children, speed = 1 }) => {
  return (
    <div
      style={{
        animation: `wave ${speed}s ease-in-out infinite`,
        display: 'inline-block',
      }}
    >
      {children}
    </div>
  )
}

/**
 * Blur In Component
 */
export const BlurIn = ({ children, delay = 0, duration = 0.6 }) => {
  return (
    <div
      style={{
        animation: `blurIn ${duration}s ease-out ${delay}s both`,
      }}
    >
      {children}
    </div>
  )
}

/**
 * Neon Glow Component
 */
export const NeonGlow = ({ children, speed = 1.5 }) => {
  return (
    <div
      style={{
        animation: `neonGlow ${speed}s ease-in-out infinite`,
      }}
    >
      {children}
    </div>
  )
}

/**
 * Flip Component
 */
export const Flip = ({ children, axis = 'x', speed = 1 }) => {
  const animation = axis === 'x' ? 'flipX' : 'flipY'
  return (
    <div
      style={{
        animation: `${animation} ${speed}s ease-in-out infinite`,
        display: 'inline-block',
      }}
    >
      {children}
    </div>
  )
}

/**
 * Stagger Animation Wrapper
 */
export const StaggerContainer = ({ children, staggerDelay = 0.1 }) => {
  return (
    <div className="stagger-container">
      {React.Children.map(children, (child, index) => (
        <div
          style={{
            animation: `slideInUp 0.6s ease-out ${index * staggerDelay}s both`,
          }}
        >
          {child}
        </div>
      ))}
    </div>
  )
}

/**
 * Animated Counter Component
 */
export const AnimatedCounter = ({ from = 0, to = 100, duration = 2, suffix = '' }) => {
  const [count, setCount] = useState(from)

  useEffect(() => {
    let start = from
    const increment = (to - from) / (duration * 60)
    const interval = setInterval(() => {
      start += increment
      if (start >= to) {
        setCount(to)
        clearInterval(interval)
      } else {
        setCount(Math.floor(start))
      }
    }, 1000 / 60)

    return () => clearInterval(interval)
  }, [from, to, duration])

  return (
    <span style={{ animation: 'bounceUp 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)' }}>
      {count}
      {suffix}
    </span>
  )
}

/**
 * Animated Progress Bar
 */
export const AnimatedProgressBar = ({ progress = 0, duration = 1 }) => {
  return (
    <div className="animated-progress-bar">
      <div
        className="animated-progress-fill"
        style={{
          width: `${progress}%`,
          animation: `progressShine ${duration}s ease-in-out infinite`,
          transition: `width 0.5s ease-out`,
        }}
      />
    </div>
  )
}

/**
 * Animated List Item
 */
export const AnimatedListItem = ({ children, index = 0, staggerDelay = 0.1 }) => {
  return (
    <div
      style={{
        animation: `slideInLeft 0.5s ease-out ${index * staggerDelay}s both`,
      }}
    >
      {children}
    </div>
  )
}

export default {
  ParticleEffect,
  ShimmerLoader,
  PulseBadge,
  BounceButton,
  GlowText,
  FadeIn,
  SlideIn,
  ScaleIn,
  BounceIn,
  Rotate,
  Pulse,
  Glow,
  Shake,
  Wiggle,
  Heartbeat,
  Wave,
  BlurIn,
  NeonGlow,
  Flip,
  StaggerContainer,
  AnimatedCounter,
  AnimatedProgressBar,
  AnimatedListItem,
}
