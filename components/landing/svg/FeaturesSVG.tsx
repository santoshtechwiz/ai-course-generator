"use client"

import { motion } from "framer-motion"
import AnimatedSVGPath from "../animations/AnimatedSVGPath"

const FeaturesSVG = () => {
  return (
    <svg
      width="100%"
      height="100%"
      viewBox="0 0 800 600"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="max-w-full max-h-full"
    >
      {/* Central hub */}
      <motion.circle
        cx="400"
        cy="300"
        r="80"
        fill="url(#featuresGradient)"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 1, ease: [0.25, 0.1, 0.25, 1] }}
      />

      {/* Feature nodes */}
      <motion.g>
        {/* Feature 1 */}
        <motion.circle
          cx="200"
          cy="150"
          r="50"
          fill="url(#feature1Gradient)"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
        />
        <AnimatedSVGPath
          d="M400,300 L200,150"
          stroke="url(#connectionGradient)"
          strokeWidth={3}
          delay={1.1}
          duration={1}
        />

        {/* Feature 2 */}
        <motion.circle
          cx="600"
          cy="150"
          r="50"
          fill="url(#feature2Gradient)"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
        />
        <AnimatedSVGPath
          d="M400,300 L600,150"
          stroke="url(#connectionGradient)"
          strokeWidth={3}
          delay={1.3}
          duration={1}
        />

        {/* Feature 3 */}
        <motion.circle
          cx="200"
          cy="450"
          r="50"
          fill="url(#feature3Gradient)"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.7, ease: [0.25, 0.1, 0.25, 1] }}
        />
        <AnimatedSVGPath
          d="M400,300 L200,450"
          stroke="url(#connectionGradient)"
          strokeWidth={3}
          delay={1.5}
          duration={1}
        />

        {/* Feature 4 */}
        <motion.circle
          cx="600"
          cy="450"
          r="50"
          fill="url(#feature4Gradient)"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.9, ease: [0.25, 0.1, 0.25, 1] }}
        />
        <AnimatedSVGPath
          d="M400,300 L600,450"
          stroke="url(#connectionGradient)"
          strokeWidth={3}
          delay={1.7}
          duration={1}
        />
      </motion.g>

      {/* Animated icons inside feature nodes */}
      <motion.g>
        {/* Icon 1 */}
        <motion.path
          d="M180,140 L220,160 L180,180 Z"
          fill="white"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, delay: 1.2, ease: [0.25, 0.1, 0.25, 1] }}
        />

        {/* Icon 2 */}
        <motion.rect
          x="585"
          y="135"
          width="30"
          height="30"
          rx="5"
          fill="white"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, delay: 1.4, ease: [0.25, 0.1, 0.25, 1] }}
        />

        {/* Icon 3 */}
        <motion.circle
          cx="200"
          cy="450"
          r="20"
          fill="white"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, delay: 1.6, ease: [0.25, 0.1, 0.25, 1] }}
        />

        {/* Icon 4 */}
        <motion.path
          d="M585,435 L615,435 L600,465 Z"
          fill="white"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, delay: 1.8, ease: [0.25, 0.1, 0.25, 1] }}
        />
      </motion.g>

      {/* Pulsing effect on central hub */}
      <motion.circle
        cx="400"
        cy="300"
        r="80"
        stroke="var(--color-primary)"
        strokeWidth="2"
        fill="none"
        initial={{ scale: 1, opacity: 0 }}
        animate={{ scale: 1.2, opacity: [0, 0.5, 0] }}
        transition={{
          duration: 2,
          repeat: Number.POSITIVE_INFINITY,
          ease: "easeInOut",
        }}
      />

      {/* Floating particles */}
      {[...Array(12)].map((_, i) => (
        <motion.circle
          key={`feature-particle-${i}`}
          cx={300 + Math.random() * 200}
          cy={200 + Math.random() * 200}
          r={2 + Math.random() * 3}
          fill="url(#featureParticleGradient)"
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
        <linearGradient id="featuresGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="var(--color-primary)" />
          <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0.7" />
        </linearGradient>

        <linearGradient id="feature1Gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FF6B6B" />
          <stop offset="100%" stopColor="#FF8E8E" />
        </linearGradient>

        <linearGradient id="feature2Gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#4ECDC4" />
          <stop offset="100%" stopColor="#7EEEE7" />
        </linearGradient>

        <linearGradient id="feature3Gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFD166" />
          <stop offset="100%" stopColor="#FFE599" />
        </linearGradient>

        <linearGradient id="feature4Gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6A0572" />
          <stop offset="100%" stopColor="#AB83A1" />
        </linearGradient>

        <linearGradient id="connectionGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.3" />
          <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0.7" />
        </linearGradient>

        <linearGradient id="featureParticleGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="var(--color-primary)" />
          <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0.5" />
        </linearGradient>
      </defs>
    </svg>
  )
}

export default FeaturesSVG
