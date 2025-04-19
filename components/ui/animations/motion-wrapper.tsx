"use client"

import { motion, AnimatePresence } from "framer-motion"
import type { ReactNode } from "react"

type MotionDirection = "up" | "down" | "left" | "right" | "scale" | "opacity"
type MotionVariant = "reveal" | "slide" | "fade" | "bounce" | "spring"

interface MotionWrapperProps {
  children: ReactNode
  direction?: MotionDirection
  variant?: MotionVariant
  delay?: number
  duration?: number
  className?: string
  animate?: boolean
  viewport?: boolean
  viewportMargin?: string
  once?: boolean
  id?: string
}

export function MotionWrapper({
  children,
  direction = "up",
  variant = "reveal",
  delay = 0,
  duration = 0.5,
  className = "",
  animate = true,
  viewport = true,
  viewportMargin = "-50px",
  once = true,
  id,
}: MotionWrapperProps) {
  if (!animate) {
    return <div className={className}>{children}</div>
  }

  // Define animation variants based on direction and variant
  const getVariants = () => {
    const distance = 50
    const scale = 0.97

    // Base variants
    const baseVariants = {
      hidden: {
        opacity: 0,
        y: direction === "up" ? distance : direction === "down" ? -distance : 0,
        x: direction === "left" ? distance : direction === "right" ? -distance : 0,
        scale: direction === "scale" ? scale : 1,
      },
      visible: {
        opacity: 1,
        y: 0,
        x: 0,
        scale: 1,
      },
    }

    // Customize based on variant
    switch (variant) {
      case "slide":
        return {
          hidden: { ...baseVariants.hidden },
          visible: {
            ...baseVariants.visible,
            transition: {
              duration: duration,
              delay: delay,
              ease: [0.25, 0.1, 0.25, 1], // Apple-style easing
            },
          },
        }
      case "fade":
        return {
          hidden: { opacity: 0 },
          visible: {
            opacity: 1,
            transition: {
              duration: duration,
              delay: delay,
              ease: [0.25, 0.1, 0.25, 1],
            },
          },
        }
      case "bounce":
        return {
          hidden: { ...baseVariants.hidden },
          visible: {
            ...baseVariants.visible,
            transition: {
              type: "spring",
              stiffness: 300,
              damping: 20,
              delay: delay,
            },
          },
        }
      case "spring":
        return {
          hidden: { ...baseVariants.hidden },
          visible: {
            ...baseVariants.visible,
            transition: {
              type: "spring",
              stiffness: 100,
              damping: 10,
              delay: delay,
            },
          },
        }
      case "reveal":
      default:
        return {
          hidden: { ...baseVariants.hidden },
          visible: {
            ...baseVariants.visible,
            transition: {
              duration: duration,
              delay: delay,
              ease: [0.25, 0.1, 0.25, 1],
            },
          },
        }
    }
  }

  return (
    <motion.div
      id={id}
      className={className}
      initial="hidden"
      whileInView={viewport ? "visible" : undefined}
      animate={!viewport ? "visible" : undefined}
      viewport={viewport ? { once, margin: viewportMargin } : undefined}
      variants={getVariants()}
    >
      {children}
    </motion.div>
  )
}

export function MotionGroup({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <AnimatePresence mode="wait">
      <div className={className}>{children}</div>
    </AnimatePresence>
  )
}

export function MotionItem({
  children,
  className,
  delay = 0,
  index = 0,
  staggerDelay = 0.1,
}: {
  children: ReactNode
  className?: string
  delay?: number
  index?: number
  staggerDelay?: number
}) {
  const finalDelay = delay + index * staggerDelay

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.5,
        delay: finalDelay,
        ease: [0.25, 0.1, 0.25, 1],
      }}
    >
      {children}
    </motion.div>
  )
}

export function MotionTransition({
  children,
  className,
  motionKey,
}: {
  children: ReactNode
  className?: string
  motionKey: string | number
}) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={motionKey}
        className={className}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}
