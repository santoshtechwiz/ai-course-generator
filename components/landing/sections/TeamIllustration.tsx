"use client"

import { motion } from "framer-motion"

const TeamIllustration = () => {
  // Apple-style animation variants with optimized values
  const svgVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.6, // Reduced from 0.8 for better performance
        ease: [0.25, 0.1, 0.25, 1], // Apple-style easing
        staggerChildren: 0.08, // Reduced from 0.1 for better performance
        delayChildren: 0.1, // Reduced from 0.2 for better performance
      },
    },
  }

  const circleVariants = {
    hidden: { scale: 0.9, opacity: 0 }, // Adjusted for better performance
    visible: {
      scale: 1,
      opacity: 1,
      transition: {
        duration: 0.6, // Reduced from 0.8 for better performance
        ease: [0.25, 0.1, 0.25, 1], // Apple-style easing
      },
    },
  }

  const pathVariants = {
    hidden: { pathLength: 0, opacity: 0 },
    visible: {
      pathLength: 1,
      opacity: 1,
      transition: {
        duration: 1.2, // Reduced from 1.5 for better performance
        ease: [0.25, 0.1, 0.25, 1], // Apple-style easing
      },
    },
  }

  const personVariants = {
    hidden: { scale: 0, opacity: 0 },
    visible: (delay: number) => ({
      scale: 1,
      opacity: 1,
      transition: {
        duration: 0.6, // Reduced from 0.8 for better performance
        delay: delay * 0.8, // Reduced delay multiplier for better performance
        ease: [0.25, 0.1, 0.25, 1], // Apple-style easing
      },
    }),
    hover: {
      scale: 1.03, // Reduced from 1.05 for better performance
      transition: {
        duration: 0.2, // Reduced from 0.3 for better performance
        ease: [0.25, 0.1, 0.25, 1], // Apple-style easing
      },
    },
  }

  return (
    <motion.svg
      width="100%"
      height="100%"
      viewBox="0 0 800 600"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="max-w-full max-h-full"
      preserveAspectRatio="xMidYMid meet"
      initial="hidden"
      animate="visible"
      variants={svgVariants}
      style={{ willChange: "transform, opacity" }}
    >
      {/* Background elements */}
      <motion.circle cx="400" cy="300" r="250" fill="url(#teamGradient)" opacity="0.1" variants={circleVariants} />

      <motion.circle
        cx="400"
        cy="300"
        r="200"
        stroke="url(#teamGradient)"
        strokeWidth="2"
        strokeDasharray="5 5"
        fill="none"
        variants={pathVariants}
      />

      {/* Team members */}
      <g>
        {/* Center person */}
        <motion.g variants={personVariants} custom={0} whileHover="hover">
          <circle cx="400" cy="300" r="60" fill="url(#personGradient1)" />
          <circle cx="400" cy="260" r="25" fill="#FFFFFF" />
          <rect x="370" y="290" width="60" height="70" rx="30" fill="#FFFFFF" />
        </motion.g>

        {/* Left person */}
        <motion.g variants={personVariants} custom={0.2} whileHover="hover">
          <circle cx="280" cy="300" r="50" fill="url(#personGradient2)" />
          <circle cx="280" cy="270" r="20" fill="#FFFFFF" />
          <rect x="255" y="295" width="50" height="55" rx="25" fill="#FFFFFF" />
        </motion.g>

        {/* Right person */}
        <motion.g variants={personVariants} custom={0.4} whileHover="hover">
          <circle cx="520" cy="300" r="50" fill="url(#personGradient3)" />
          <circle cx="520" cy="270" r="20" fill="#FFFFFF" />
          <rect x="495" y="295" width="50" height="55" rx="25" fill="#FFFFFF" />
        </motion.g>

        {/* Top person */}
        <motion.g variants={personVariants} custom={0.6} whileHover="hover">
          <circle cx="400" cy="180" r="45" fill="url(#personGradient4)" />
          <circle cx="400" cy="155" r="18" fill="#FFFFFF" />
          <rect x="378" y="175" width="45" height="50" rx="22.5" fill="#FFFFFF" />
        </motion.g>

        {/* Bottom person */}
        <motion.g variants={personVariants} custom={0.8} whileHover="hover">
          <circle cx="400" cy="420" r="45" fill="url(#personGradient5)" />
          <circle cx="400" cy="395" r="18" fill="#FFFFFF" />
          <rect x="378" y="415" width="45" height="50" rx="22.5" fill="#FFFFFF" />
        </motion.g>
      </g>

      {/* Connection lines with animation */}
      <motion.g variants={pathVariants}>
        <motion.line
          x1="340"
          y1="300"
          x2="280"
          y2="300"
          stroke="url(#lineGradient)"
          strokeWidth="2"
          variants={pathVariants}
        />
        <motion.line
          x1="460"
          y1="300"
          x2="520"
          y2="300"
          stroke="url(#lineGradient)"
          strokeWidth="2"
          variants={pathVariants}
        />
        <motion.line
          x1="400"
          y1="240"
          x2="400"
          y2="180"
          stroke="url(#lineGradient)"
          strokeWidth="2"
          variants={pathVariants}
        />
        <motion.line
          x1="400"
          y1="360"
          x2="400"
          y2="420"
          stroke="url(#lineGradient)"
          strokeWidth="2"
          variants={pathVariants}
        />
      </motion.g>

      {/* Floating particles with advanced animation */}
      <motion.circle
        cx="350"
        cy="220"
        r="5"
        fill="url(#particleGradient)"
        animate={{
          y: [0, -8, 0], // Reduced movement for better performance
          opacity: [0.6, 0.9, 0.6], // Adjusted opacity for better performance
          boxShadow: [
            "0 0 0 0 rgba(var(--primary-rgb), 0)",
            "0 0 0 2px rgba(var(--primary-rgb), 0.2)", // Reduced shadow for better performance
            "0 0 0 0 rgba(var(--primary-rgb), 0)",
          ],
        }}
        transition={{
          duration: 3,
          repeat: Number.POSITIVE_INFINITY,
          ease: [0.25, 0.1, 0.25, 1], // Apple-style easing
        }}
      />

      <motion.circle
        cx="450"
        cy="220"
        r="5"
        fill="url(#particleGradient)"
        animate={{
          y: [0, -12, 0], // Reduced movement for better performance
          opacity: [0.6, 0.9, 0.6], // Adjusted opacity for better performance
          boxShadow: [
            "0 0 0 0 rgba(var(--primary-rgb), 0)",
            "0 0 0 2px rgba(var(--primary-rgb), 0.2)", // Reduced shadow for better performance
            "0 0 0 0 rgba(var(--primary-rgb), 0)",
          ],
        }}
        transition={{
          duration: 4,
          repeat: Number.POSITIVE_INFINITY,
          ease: [0.25, 0.1, 0.25, 1], // Apple-style easing
          delay: 0.5,
        }}
      />

      <motion.circle
        cx="340"
        cy="300"
        r="4"
        fill="#FFFFFF"
        initial={{ opacity: 0 }}
        animate={{
          opacity: [0, 0.8, 0], // Reduced opacity for better performance
          x: [340, 290, 280],
        }}
        transition={{
          duration: 2,
          repeat: Number.POSITIVE_INFINITY,
          repeatDelay: 4, // Increased delay for better performance
          ease: [0.25, 0.1, 0.25, 1], // Apple-style easing
          delay: 2,
        }}
      />

      <motion.circle
        cx="460"
        cy="300"
        r="4"
        fill="#FFFFFF"
        initial={{ opacity: 0 }}
        animate={{
          opacity: [0, 0.8, 0], // Reduced opacity for better performance
          x: [460, 510, 520],
        }}
        transition={{
          duration: 2,
          repeat: Number.POSITIVE_INFINITY,
          repeatDelay: 4, // Increased delay for better performance
          ease: [0.25, 0.1, 0.25, 1], // Apple-style easing
          delay: 2.5,
        }}
      />

      <motion.circle
        cx="400"
        cy="240"
        r="4"
        fill="#FFFFFF"
        initial={{ opacity: 0 }}
        animate={{
          opacity: [0, 0.8, 0], // Reduced opacity for better performance
          y: [240, 200, 180],
        }}
        transition={{
          duration: 2,
          repeat: Number.POSITIVE_INFINITY,
          repeatDelay: 4, // Increased delay for better performance
          ease: [0.25, 0.1, 0.25, 1], // Apple-style easing
          delay: 3,
        }}
      />

      <motion.circle
        cx="400"
        cy="360"
        r="4"
        fill="#FFFFFF"
        initial={{ opacity: 0 }}
        animate={{
          opacity: [0, 0.8, 0], // Reduced opacity for better performance
          y: [360, 400, 420],
        }}
        transition={{
          duration: 2,
          repeat: Number.POSITIVE_INFINITY,
          repeatDelay: 4, // Increased delay for better performance
          ease: [0.25, 0.1, 0.25, 1], // Apple-style easing
          delay: 3.5,
        }}
      />

      {/* Gradients */}
      <defs>
        <linearGradient id="teamGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="var(--color-primary)" />
          <stop offset="100%" stopColor="var(--color-primary-light, hsl(var(--primary) / 0.5))" />
        </linearGradient>

        <linearGradient id="personGradient1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FF6B6B" />
          <stop offset="100%" stopColor="#FF8E8E" />
        </linearGradient>

        <linearGradient id="personGradient2" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#4ECDC4" />
          <stop offset="100%" stopColor="#7EEEE7" />
        </linearGradient>

        <linearGradient id="personGradient3" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFD166" />
          <stop offset="100%" stopColor="#FFE599" />
        </linearGradient>

        <linearGradient id="personGradient4" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6A0572" />
          <stop offset="100%" stopColor="#AB83A1" />
        </linearGradient>

        <linearGradient id="personGradient5" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1A936F" />
          <stop offset="100%" stopColor="#88D498" />
        </linearGradient>

        <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="var(--color-primary, hsl(var(--primary)))" stopOpacity="0.3" />
          <stop offset="100%" stopColor="var(--color-primary, hsl(var(--primary)))" stopOpacity="0.7" />
        </linearGradient>

        <linearGradient id="particleGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="var(--color-primary, hsl(var(--primary)))" />
          <stop offset="100%" stopColor="var(--color-primary, hsl(var(--primary)))" stopOpacity="0.5" />
        </linearGradient>
      </defs>
    </motion.svg>
  )
}

export default TeamIllustration
