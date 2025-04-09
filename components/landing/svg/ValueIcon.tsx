"use client"

import { motion } from "framer-motion"

const ValueIcon = ({ index = 0, className = "w-6 h-6" }: { index?: number; className?: string }) => {
  // Apple-style animation variants
  const pathVariants = {
    hidden: { pathLength: 0, opacity: 0 },
    visible: (delay: number) => ({
      pathLength: 1,
      opacity: 1,
      transition: {
        duration: 0.8,
        delay: delay,
        ease: [0.25, 0.1, 0.25, 1], // Apple-style easing
      },
    }),
  }

  const circleVariants = {
    hidden: { scale: 0, opacity: 0 },
    visible: (delay: number) => ({
      scale: 1,
      opacity: 1,
      transition: {
        duration: 0.8,
        delay: delay,
        ease: [0.25, 0.1, 0.25, 1], // Apple-style easing
      },
    }),
  }

  // Different icons based on index
  const renderIcon = () => {
    switch (index) {
      case 0: // Innovation
        return (
          <>
            <motion.path d="M12 2v8" variants={pathVariants} custom={0} initial="hidden" animate="visible" />
            <motion.path
              d="m4.93 10.93 1.41 1.41"
              variants={pathVariants}
              custom={0.1}
              initial="hidden"
              animate="visible"
            />
            <motion.path d="M2 18h2" variants={pathVariants} custom={0.2} initial="hidden" animate="visible" />
            <motion.path d="M20 18h2" variants={pathVariants} custom={0.3} initial="hidden" animate="visible" />
            <motion.path
              d="m19.07 10.93-1.41 1.41"
              variants={pathVariants}
              custom={0.4}
              initial="hidden"
              animate="visible"
            />
            <motion.path d="M22 22H2" variants={pathVariants} custom={0.5} initial="hidden" animate="visible" />
            <motion.path d="m16 6-4 4-4-4" variants={pathVariants} custom={0.6} initial="hidden" animate="visible" />
            <motion.path
              d="M16 18a4 4 0 0 0-8 0"
              variants={pathVariants}
              custom={0.7}
              initial="hidden"
              animate="visible"
            />
          </>
        )
      case 1: // Accessibility
        return (
          <>
            <motion.circle
              cx="12"
              cy="12"
              r="10"
              variants={pathVariants}
              custom={0}
              initial="hidden"
              animate="visible"
            />
            <motion.path
              d="m4.93 4.93 14.14 14.14"
              variants={pathVariants}
              custom={0.3}
              initial="hidden"
              animate="visible"
            />
            <motion.path
              d="M12 17a5 5 0 0 0 5-5"
              variants={pathVariants}
              custom={0.6}
              initial="hidden"
              animate="visible"
            />
            <motion.path
              d="M12 7a5 5 0 0 1 5 5"
              variants={pathVariants}
              custom={0.9}
              initial="hidden"
              animate="visible"
            />
          </>
        )
      case 2: // Excellence
        return (
          <>
            <motion.path d="M12 2v4" variants={pathVariants} custom={0} initial="hidden" animate="visible" />
            <motion.path d="M12 18v4" variants={pathVariants} custom={0.1} initial="hidden" animate="visible" />
            <motion.path
              d="m4.93 4.93 2.83 2.83"
              variants={pathVariants}
              custom={0.2}
              initial="hidden"
              animate="visible"
            />
            <motion.path
              d="m16.24 16.24 2.83 2.83"
              variants={pathVariants}
              custom={0.3}
              initial="hidden"
              animate="visible"
            />
            <motion.path d="M2 12h4" variants={pathVariants} custom={0.4} initial="hidden" animate="visible" />
            <motion.path d="M18 12h4" variants={pathVariants} custom={0.5} initial="hidden" animate="visible" />
            <motion.path
              d="m4.93 19.07 2.83-2.83"
              variants={pathVariants}
              custom={0.6}
              initial="hidden"
              animate="visible"
            />
            <motion.path
              d="m16.24 7.76 2.83-2.83"
              variants={pathVariants}
              custom={0.7}
              initial="hidden"
              animate="visible"
            />
            <motion.circle
              cx="12"
              cy="12"
              r="3"
              variants={circleVariants}
              custom={0.8}
              initial="hidden"
              animate="visible"
            />
          </>
        )
      default:
        return (
          <>
            <motion.path
              d="M18 8V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v12c0 1.1.9 2 2 2h12a2 2 0 0 0 2-2v-2"
              variants={pathVariants}
              custom={0}
              initial="hidden"
              animate="visible"
            />
            <motion.path d="M18 8h4v4h-4z" variants={pathVariants} custom={0.3} initial="hidden" animate="visible" />
            <motion.path
              d="m15 12-5.5 5.5-3-3L5 16"
              variants={pathVariants}
              custom={0.6}
              initial="hidden"
              animate="visible"
            />
          </>
        )
    }
  }

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={{ willChange: "transform, opacity" }}
    >
      {renderIcon()}
    </svg>
  )
}

export default ValueIcon
