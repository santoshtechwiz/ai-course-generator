"use client"

import type React from "react"

import { useInView, motion } from "framer-motion"
import { useRef } from "react"
const APPLE_EASING = [0.22, 0.61, 0.36, 1]
// Optimize the RevealAnimation component for better performance
const RevealAnimation: React.FC<{
  children: React.ReactNode
  delay?: number
  direction?: "up" | "down" | "left" | "right"
  distance?: number
  duration?: number
  className?: string
}> = ({
  children,
  delay = 0,
  direction = "up",
  distance = 30,
  duration = 0.8, // Reduced from 1.0 for better performance
  className = "",
}) => {
  const ref = useRef(null)
  const isInView = useInView(ref, {
    once: true,
    amount: 0.15,
    margin: "-50px 0px",
  })

  const getInitialPosition = () => {
    switch (direction) {
      case "up":
        return { opacity: 0, y: distance }
      case "down":
        return { opacity: 0, y: -distance }
      case "left":
        return { opacity: 0, x: distance }
      case "right":
        return { opacity: 0, x: -distance }
      default:
        return { opacity: 0, y: distance }
    }
  }

  const variants = {
    hidden: getInitialPosition(),
    visible: direction === "up" || direction === "down" ? { opacity: 1, y: 0 } : { opacity: 1, x: 0 },
  }

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={variants}
      transition={{
        duration,
        delay,
        ease: APPLE_EASING,
      }}
      className={className}
      style={{ willChange: "transform, opacity" }}
    >
      {children}
    </motion.div>
  )
}
export default RevealAnimation
