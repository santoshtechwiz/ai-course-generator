"use client"

import AnimatedSVGPath from "@/components/animations/AnimatedSVGPath"
import { motion } from "framer-motion"

const HowItWorksSVG = () => {
  return (
    <svg
      width="100%"
      height="100%"
      viewBox="0 0 800 600"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="max-w-full max-h-full"
    >
      {/* Step path */}
      <AnimatedSVGPath
        d="M150,150 C150,150 250,100 400,100 C550,100 650,150 650,150 C650,150 700,200 700,300 C700,400 650,450 650,450 C650,450 550,500 400,500 C250,500 150,450 150,450 C150,450 100,400 100,300 C100,200 150,150 150,150 Z"
        stroke="url(#pathGradient)"
        strokeWidth={3}
        delay={0.5}
        duration={3}
      />

      {/* Step nodes */}
      <motion.g>
        {/* Step 1 */}
        <motion.circle
          cx="150"
          cy="150"
          r="40"
          fill="url(#step1Gradient)"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8, delay: 1, ease: [0.25, 0.1, 0.25, 1] }}
        />
        <motion.text
          x="150"
          y="155"
          textAnchor="middle"
          fill="white"
          fontWeight="bold"
          fontSize="24"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 1.3 }}
        >
          1
        </motion.text>

        {/* Step 2 */}
        <motion.circle
          cx="400"
          cy="100"
          r="40"
          fill="url(#step2Gradient)"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8, delay: 1.5, ease: [0.25, 0.1, 0.25, 1] }}
        />
        <motion.text
          x="400"
          y="105"
          textAnchor="middle"
          fill="white"
          fontWeight="bold"
          fontSize="24"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 1.8 }}
        >
          2
        </motion.text>

        {/* Step 3 */}
        <motion.circle
          cx="650"
          cy="150"
          r="40"
          fill="url(#step3Gradient)"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8, delay: 2, ease: [0.25, 0.1, 0.25, 1] }}
        />
        <motion.text
          x="650"
          y="155"
          textAnchor="middle"
          fill="white"
          fontWeight="bold"
          fontSize="24"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 2.3 }}
        >
          3
        </motion.text>

        {/* Step 4 */}
        <motion.circle
          cx="700"
          cy="300"
          r="40"
          fill="url(#step4Gradient)"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8, delay: 2.5, ease: [0.25, 0.1, 0.25, 1] }}
        />
        <motion.text
          x="700"
          y="305"
          textAnchor="middle"
          fill="white"
          fontWeight="bold"
          fontSize="24"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 2.8 }}
        >
          4
        </motion.text>
      </motion.g>

      {/* Moving dot along the path */}
      <motion.circle
        cx="0"
        cy="0"
        r="10"
        fill="url(#dotGradient)"
        filter="drop-shadow(0px 0px 8px rgba(var(--primary-rgb), 0.5))"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 3.5 }}
      >
        <animateMotion
          path="M150,150 C150,150 250,100 400,100 C550,100 650,150 650,150 C650,150 700,200 700,300 C700,400 650,450 650,450 C650,450 550,500 400,500 C250,500 150,450 150,450 C150,450 100,400 100,300 C100,200 150,150 150,150 Z"
          dur="10s"
          repeatCount="indefinite"
          rotate="auto"
        />
      </motion.circle>

      {/* Animated icons for each step */}
      <motion.g>
        {/* Icon for Step 1 */}
        <motion.path
          d="M130,140 L170,140 L170,160 L130,160 Z"
          fill="white"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, delay: 1.3, ease: [0.25, 0.1, 0.25, 1] }}
        />

        {/* Icon for Step 2 */}
        <motion.path
          d="M380,90 L420,90 L400,110 Z"
          fill="white"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, delay: 1.8, ease: [0.25, 0.1, 0.25, 1] }}
        />

        {/* Icon for Step 3 */}
        <motion.circle
          cx="650"
          cy="150"
          r="15"
          fill="white"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, delay: 2.3, ease: [0.25, 0.1, 0.25, 1] }}
        />

        {/* Icon for Step 4 */}
        <motion.path
          d="M685,285 L715,285 L715,315 L685,315 Z"
          fill="white"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, delay: 2.8, ease: [0.25, 0.1, 0.25, 1] }}
        />
      </motion.g>

      {/* Floating particles - reduced count for better performance */}
      {[...Array(8)].map((_, i) => (
        <motion.circle
          key={`how-particle-${i}`}
          cx={200 + Math.random() * 400}
          cy={150 + Math.random() * 300}
          r={2 + Math.random() * 3}
          fill="url(#howParticleGradient)"
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
        <linearGradient id="pathGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.3" />
          <stop offset="50%" stopColor="var(--color-primary)" stopOpacity="0.7" />
          <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0.3" />
        </linearGradient>

        <linearGradient id="step1Gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#4ECDC4" />
          <stop offset="100%" stopColor="#7EEEE7" />
        </linearGradient>

        <linearGradient id="step2Gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FF6B6B" />
          <stop offset="100%" stopColor="#FF8E8E" />
        </linearGradient>

        <linearGradient id="step3Gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFD166" />
          <stop offset="100%" stopColor="#FFE599" />
        </linearGradient>

        <linearGradient id="step4Gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6A0572" />
          <stop offset="100%" stopColor="#AB83A1" />
        </linearGradient>

        <linearGradient id="dotGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="var(--color-primary)" />
          <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0.7" />
        </linearGradient>

        <linearGradient id="howParticleGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="var(--color-primary)" />
          <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0.5" />
        </linearGradient>
      </defs>
    </svg>
  )
}

export default HowItWorksSVG
