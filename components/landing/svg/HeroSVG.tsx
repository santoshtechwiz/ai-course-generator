"use client"

import AnimatedSVGPath from "@/components/animations/AnimatedSVGPath"
import { motion } from "framer-motion"

const HeroSVG = () => {
  return (
    <svg
      width="100%"
      height="100%"
      viewBox="0 0 800 600"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="max-w-full max-h-full"
    >
      {/* Background elements */}
      <motion.circle
        cx="400"
        cy="300"
        r="250"
        fill="url(#heroGradient)"
        opacity="0.1"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 0.1 }}
        transition={{ duration: 1.5, ease: [0.25, 0.1, 0.25, 1] }}
      />

      <AnimatedSVGPath
        d="M400,50 C550,50 700,150 700,300 C700,450 550,550 400,550 C250,550 100,450 100,300 C100,150 250,50 400,50 Z"
        stroke="url(#heroStroke)"
        strokeWidth={2}
        delay={0.5}
        duration={2}
      />

      {/* Central icon */}
      <motion.g
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1, delay: 1, ease: [0.25, 0.1, 0.25, 1] }}
      >
        <circle cx="400" cy="300" r="80" fill="url(#iconGradient)" />
        <motion.path
          d="M370,270 L450,300 L370,330 Z"
          fill="white"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, delay: 1.5 }}
        />
      </motion.g>

      {/* Orbiting elements */}
      <motion.g
        animate={{
          rotate: 360,
        }}
        transition={{
          duration: 20,
          repeat: Number.POSITIVE_INFINITY,
          ease: "linear",
        }}
        style={{ transformOrigin: "400px 300px" }}
      >
        <motion.circle
          cx="600"
          cy="300"
          r="15"
          fill="url(#orbitGradient1)"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 1.8 }}
        />
      </motion.g>

      <motion.g
        animate={{
          rotate: -360,
        }}
        transition={{
          duration: 25,
          repeat: Number.POSITIVE_INFINITY,
          ease: "linear",
        }}
        style={{ transformOrigin: "400px 300px" }}
      >
        <motion.circle
          cx="400"
          cy="120"
          r="12"
          fill="url(#orbitGradient2)"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 2 }}
        />
      </motion.g>

      <motion.g
        animate={{
          rotate: 360,
        }}
        transition={{
          duration: 30,
          repeat: Number.POSITIVE_INFINITY,
          ease: "linear",
        }}
        style={{ transformOrigin: "400px 300px" }}
      >
        <motion.circle
          cx="250"
          cy="400"
          r="18"
          fill="url(#orbitGradient3)"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 2.2 }}
        />
      </motion.g>

      {/* Floating particles */}
      {[...Array(8)].map((_, i) => (
        <motion.circle
          key={`particle-${i}`}
          cx={300 + Math.random() * 200}
          cy={200 + Math.random() * 200}
          r={2 + Math.random() * 4}
          fill="url(#particleGradient)"
          initial={{ opacity: 0 }}
          animate={{
            opacity: [0, 0.7, 0],
            y: [0, -20 - Math.random() * 30, 0],
            x: [0, Math.random() * 20 - 10, 0],
          }}
          transition={{
            duration: 3 + Math.random() * 2,
            repeat: Number.POSITIVE_INFINITY,
            delay: i * 0.3,
            ease: "easeInOut",
          }}
        />
      ))}

      {/* Gradients */}
      <defs>
        <linearGradient id="heroGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.8" />
          <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0.2" />
        </linearGradient>

        <linearGradient id="heroStroke" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.1" />
          <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0.6" />
        </linearGradient>

        <linearGradient id="iconGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="var(--color-primary)" />
          <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0.7" />
        </linearGradient>

        <linearGradient id="orbitGradient1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FF6B6B" />
          <stop offset="100%" stopColor="#FF8E8E" />
        </linearGradient>

        <linearGradient id="orbitGradient2" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#4ECDC4" />
          <stop offset="100%" stopColor="#7EEEE7" />
        </linearGradient>

        <linearGradient id="orbitGradient3" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFD166" />
          <stop offset="100%" stopColor="#FFE599" />
        </linearGradient>

        <linearGradient id="particleGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="var(--color-primary)" />
          <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0.5" />
        </linearGradient>
      </defs>
    </svg>
  )
}

export default HeroSVG
