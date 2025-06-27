"use client"

import { useCallback, useEffect, useState } from "react"
import { motion } from "framer-motion"

type ParticleProps = {
  children?: React.ReactNode
}

export function AppleStyleParticles({ children }: ParticleProps) {
  // Use clientOnly state to prevent hydration mismatches
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  // Generate random but consistent particles for both server and client
  const getParticles = useCallback(() => {
    // We'll use pseudo-random numbers with fixed seeds for server-client consistency
    const particleCount = 5
    const particles = []
    
    // Use fixed values for particles to avoid hydration mismatch
    const particleSettings = [
      { x: 25, y: 40, scale: 0.4, size: 24, opacity: 0.16, zIndex: 3, blur: 2 },
      { x: 50, y: 60, scale: 0.5, size: 30, opacity: 0.17, zIndex: 5, blur: 1 },
      { x: 75, y: 20, scale: 0.6, size: 32, opacity: 0.14, zIndex: 6, blur: 1 },
      { x: 40, y: 80, scale: 0.35, size: 26, opacity: 0.2, zIndex: 3, blur: 2 },
      { x: 85, y: 60, scale: 0.45, size: 28, opacity: 0.15, zIndex: 4, blur: 1.5 }
    ]

    for (let i = 0; i < particleCount; i++) {
      const settings = particleSettings[i]
      particles.push(
        <motion.div
          key={`particle-${i}`}
          className="absolute rounded-full"
          initial={{ 
            x: `${settings.x}%`, 
            y: `${settings.y}%`,
            scale: settings.scale,
            opacity: settings.opacity
          }}
          animate={{
            x: [
              `${settings.x}%`,
              `${settings.x + 5}%`,
              `${settings.x - 5}%`,
              `${settings.x}%`,
            ],
            y: [
              `${settings.y}%`,
              `${settings.y - 10}%`,
              `${settings.y + 5}%`,
              `${settings.y}%`,
            ],
          }}
          transition={{
            duration: 10 + i * 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          style={{
            width: settings.size,
            height: settings.size,
            zIndex: settings.zIndex,
            filter: `blur(${settings.blur}px)`,
            background: `radial-gradient(circle, rgba(var(--primary-rgb), ${settings.opacity}) 0%, rgba(var(--primary-rgb), 0) 70%)`,
            willChange: "transform, opacity"
          }}
        />
      )
    }
    
    return particles
  }, [])

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Only render particles on the client to avoid hydration mismatch */}
      {isClient && getParticles()}
      {children}
    </div>
  )
}

export default AppleStyleParticles
