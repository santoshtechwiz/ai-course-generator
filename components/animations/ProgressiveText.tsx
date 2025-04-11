"use client"

import { useState, useEffect, useRef, createElement } from "react"
import { motion } from "framer-motion"

interface ProgressiveTextProps {
  text: string
  tag?: string
  className?: string
  delay?: number
  duration?: number
  staggerChildren?: number
}

const ProgressiveText = ({
  text,
  tag = "p",
  className = "",
  delay = 0,
  duration = 1.5,
  staggerChildren = 0.02,
}: ProgressiveTextProps) => {
  const [isVisible, setIsVisible] = useState(false)
  const containerRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true)
    }, delay * 1000)

    return () => clearTimeout(timer)
  }, [delay])

  // Split text into words for animation
  const words = text.split(" ")

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren,
        delayChildren: 0,
      },
    },
  }

  const wordVariants = {
    hidden: {
      opacity: 0,
      y: 20,
      filter: "blur(8px)",
    },
    visible: {
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      transition: {
        duration: duration / words.length,
        ease: [0.25, 0.1, 0.25, 1], // Apple-style easing
      },
    },
  }

  return createElement(
    tag,
    {
      ref: containerRef,
      className,
    },
    <motion.span
      initial="hidden"
      animate={isVisible ? "visible" : "hidden"}
      variants={containerVariants}
      style={{ display: "inline-block" }}
    >
      {words.map((word, index) => (
        <motion.span
          key={`${word}-${index}`}
          variants={wordVariants}
          style={{
            display: "inline-block",
            marginRight: index < words.length - 1 ? "0.3em" : 0,
            willChange: "transform, opacity, filter",
          }}
        >
          {word}
        </motion.span>
      ))}
    </motion.span>,
  )
}

export default ProgressiveText
