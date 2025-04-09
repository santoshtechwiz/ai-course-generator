"use client"

import AnimatedSVGPath from "@/components/animations/AnimatedSVGPath"
import { motion } from "framer-motion"


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
      {/* Background elements */}
      <motion.rect
        x="100"
        y="50"
        width="600"
        height="300"
        rx="20"
        fill="url(#ctaBgGradient)"
        opacity="0.1"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 0.1, scale: 1 }}
        transition={{ duration: 1, ease: [0.25, 0.1, 0.25, 1] }}
      />

      <AnimatedSVGPath
        d="M120,70 L680,70 L680,330 L120,330 Z"
        stroke="url(#ctaStrokeGradient)"
        strokeWidth={2}
        delay={0.3}
        duration={1.5}
      />

      {/* Central icon */}
      <motion.g
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1, delay: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
      >
        <circle cx="400" cy="200" r="60" fill="url(#ctaIconGradient)" />
        <motion.path
          d="M380,180 L430,200 L380,220 Z"
          fill="white"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, delay: 1.2 }}
        />
      </motion.g>

      {/* Pulsing effect */}
      <motion.circle
        cx="400"
        cy="200"
        r="60"
        stroke="var(--color-primary)"
        strokeWidth="2"
        fill="none"
        initial={{ scale: 1, opacity: 0 }}
        animate={{ scale: 1.5, opacity: [0, 0.3, 0] }}
        transition={{
          duration: 2,
          repeat: Number.POSITIVE_INFINITY,
          ease: "easeInOut",
        }}
      />

      {/* Animated checkmarks */}
      <motion.g>
        <motion.g
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 1.5 }}
        >
          <circle cx="250" cy="150" r="15" fill="url(#checkGradient)" />
          <motion.path
            d="M245,150 L250,155 L260,145"
            stroke="white"
            strokeWidth="3"
            fill="none"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.5, delay: 1.7 }}
          />
        </motion.g>

        <motion.g
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 1.8 }}
        >
          <circle cx="250" cy="200" r="15" fill="url(#checkGradient)" />
          <motion.path
            d="M245,200 L250,205 L260,195"
            stroke="white"
            strokeWidth="3"
            fill="none"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.5, delay: 2 }}
          />
        </motion.g>

        <motion.g
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 2.1 }}
        >
          <circle cx="250" cy="250" r="15" fill="url(#checkGradient)" />
          <motion.path
            d="M245,250 L250,255 L260,245"
            stroke="white"
            strokeWidth="3"
            fill="none"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.5, delay: 2.3 }}
          />
        </motion.g>
      </motion.g>

      {/* Button animation */}
      <motion.g
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 2.5, ease: [0.25, 0.1, 0.25, 1] }}
      >
        <motion.rect
          x="500"
          y="180"
          width="150"
          height="40"
          rx="20"
          fill="url(#buttonGradient)"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.98 }}
          transition={{ duration: 0.2 }}
        />
        <motion.text x="575" y="205" textAnchor="middle" fill="white" fontWeight="bold" fontSize="16">
          Start Free Trial
        </motion.text>
      </motion.g>

      {/* Floating particles */}
      {[...Array(10)].map((_, i) => (
        <motion.circle
          key={`cta-particle-${i}`}
          cx={300 + Math.random() * 200}
          cy={100 + Math.random() * 200}
          r={2 + Math.random() * 3}
          fill="url(#ctaParticleGradient)"
          initial={{ opacity: 0 }}
          animate={{
            opacity: [0, 0.7, 0],
            y: [0, -20 - Math.random() * 30, 0],
            x: [0, Math.random() * 20 - 10, 0],
          }}
          transition={{
            duration: 3 + Math.random() * 2,
            repeat: Number.POSITIVE_INFINITY,
            delay: i * 0.2,
            ease: "easeInOut",
          }}
        />
      ))}

      {/* Gradients */}
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
