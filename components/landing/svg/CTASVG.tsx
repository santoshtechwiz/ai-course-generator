"use client"

import { motion } from "framer-motion"
const AnimatedSVGPath = ({ d, stroke, strokeWidth = 2, delay = 0, duration = 1.2 }: { d: string; stroke: string; strokeWidth?: number; delay?: number; duration?: number }) => (
  <motion.path
    d={d}
    stroke={stroke}
    strokeWidth={strokeWidth}
    fill="none"
    initial={{ pathLength: 0 }}
    animate={{ pathLength: 1 }}
    transition={{ duration, delay, ease: [0.25, 0.1, 0.25, 1] }}
  />
)

// Optimize the CTASVG component for better performance
const CTASVG = () => {
  return (
    <svg
      width="100%"
      height="100%"
      viewBox="0 0 800 400"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="max-w-full max-h-full"
    >
      {/* Background elements - optimize animations */}
      <motion.rect
        x="100"
        y="50"
        width="600"
        height="300"
        rx="20"
        fill="url(#ctaBgGradient)"
        opacity="0.1"
        initial={{ opacity: 0, scale: 0.95 }} // Adjusted for better performance
        animate={{ opacity: 0.1, scale: 1 }}
        transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }} // Reduced duration for better performance
      />

      <AnimatedSVGPath
        d="M120,70 L680,70 L680,330 L120,330 Z"
        stroke="url(#ctaStrokeGradient)"
        strokeWidth={2}
        delay={0.3}
        duration={1.2} // Reduced from 1.5 for better performance
      />

      {/* Central icon - optimize animations */}
      <motion.g
        initial={{ opacity: 0, scale: 0.9 }} // Adjusted for better performance
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, delay: 0.6, ease: [0.25, 0.1, 0.25, 1] }} // Reduced duration and delay for better performance
      >
        <circle cx="400" cy="200" r="60" fill="url(#ctaIconGradient)" />
        <motion.path
          d="M380,180 L430,200 L380,220 Z"
          fill="white"
          initial={{ scale: 0.9, opacity: 0 }} // Adjusted for better performance
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.9 }} // Reduced duration and delay for better performance
        />
      </motion.g>

      {/* Pulsing effect - optimize animation */}
      <motion.circle
        cx="400"
        cy="200"
        r="60"
        stroke="var(--color-primary)"
        strokeWidth="2"
        fill="none"
        initial={{ scale: 1, opacity: 0 }}
        animate={{ scale: 1.3, opacity: [0, 0.2, 0] }} // Reduced scale and opacity for better performance
        transition={{
          duration: 2.5, // Increased duration for smoother animation
          repeat: Number.POSITIVE_INFINITY,
          ease: "easeInOut",
        }}
      />

      {/* Reduce the number of animated checkmarks for better performance */}
      <motion.g>
        <motion.g
          initial={{ opacity: 0, x: -15 }} // Reduced x-offset for better performance
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 1.2 }} // Reduced duration and delay for better performance
        >
          <circle cx="250" cy="150" r="15" fill="url(#checkGradient)" />
          <motion.path
            d="M245,150 L250,155 L260,145"
            stroke="white"
            strokeWidth="3"
            fill="none"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.4, delay: 1.3 }} // Reduced duration and delay for better performance
          />
        </motion.g>

        <motion.g
          initial={{ opacity: 0, x: -15 }} // Reduced x-offset for better performance
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 1.4 }} // Reduced duration and delay for better performance
        >
          <circle cx="250" cy="250" r="15" fill="url(#checkGradient)" />
          <motion.path
            d="M245,250 L250,255 L260,245"
            stroke="white"
            strokeWidth="3"
            fill="none"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.4, delay: 1.5 }} // Reduced duration and delay for better performance
          />
        </motion.g>
      </motion.g>

      {/* Button animation - optimize for better performance */}
      <motion.g
        initial={{ opacity: 0, y: 15 }} // Reduced y-offset for better performance
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 1.8, ease: [0.25, 0.1, 0.25, 1] }} // Reduced duration and delay for better performance
      >
        <motion.rect
          x="500"
          y="180"
          width="150"
          height="40"
          rx="20"
          fill="url(#buttonGradient)"
          whileHover={{ scale: 1.03 }} // Reduced scale for better performance
          whileTap={{ scale: 0.98 }}
          transition={{ duration: 0.2 }}
        />
        <motion.text x="575" y="205" textAnchor="middle" fill="white" fontWeight="bold" fontSize="16">
          Start Free Trial
        </motion.text>
      </motion.g>

      {/* Reduce the number of floating particles for better performance */}
      {[...Array(5)].map(
        (
          _,
          i, // Reduced from 10 to 5 for better performance
        ) => (
          <motion.circle
            key={`cta-particle-${i}`}
            cx={300 + Math.random() * 200}
            cy={100 + Math.random() * 200}
            r={2 + Math.random() * 2} // Reduced size for better performance
            fill="url(#ctaParticleGradient)"
            initial={{ opacity: 0 }}
            animate={{
              opacity: [0, 0.5, 0], // Reduced opacity for better performance
              y: [0, -15 - Math.random() * 20, 0], // Reduced movement for better performance
              x: [0, Math.random() * 15 - 7, 0], // Reduced movement for better performance
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Number.POSITIVE_INFINITY,
              delay: i * 0.4, // Increased delay between animations for better performance
              ease: "easeInOut",
            }}
          />
        ),
      )}

      {/* Gradients remain the same */}
      <defs>
        <linearGradient id="ctaBgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.8" />
          <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0.2" />
        </linearGradient>

        <linearGradient id="ctaStrokeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.3" />
          <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0.8" />
        </linearGradient>

        <linearGradient id="ctaIconGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="var(--color-primary)" />
          <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0.7" />
        </linearGradient>

        <linearGradient id="checkGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#4ECDC4" />
          <stop offset="100%" stopColor="#7EEEE7" />
        </linearGradient>

        <linearGradient id="buttonGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="var(--color-primary)" />
          <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0.8" />
        </linearGradient>

        <linearGradient id="ctaParticleGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="var(--color-primary)" />
          <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0.5" />
        </linearGradient>
      </defs>
    </svg>
  )
}

export default CTASVG
