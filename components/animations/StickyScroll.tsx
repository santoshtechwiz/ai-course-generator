"use client"

import type React from "react"

import { useRef, useState, useEffect } from "react"
import { motion, useScroll, useTransform, useSpring } from "framer-motion"

interface StickyScrollProps {
  children: React.ReactNode
  className?: string
  stickyClassName?: string
  contentClassName?: string
  start?: string
  end?: string
}

const StickyScroll = ({
  children,
  className = "",
  stickyClassName = "",
  contentClassName = "",
  start = "top top",
  end = "bottom top",
}: StickyScrollProps) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const [containerHeight, setContainerHeight] = useState(0)

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: [start, end],
  })

  // Smoother progress with spring physics
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  })

  // Update container height on resize
  useEffect(() => {
    const updateHeight = () => {
      if (containerRef.current) {
        const contentHeight = containerRef.current.scrollHeight
        setContainerHeight(contentHeight)
      }
    }

    updateHeight()
    window.addEventListener("resize", updateHeight)
    return () => window.removeEventListener("resize", updateHeight)
  }, [])

  // Apple-style opacity and scale transforms
  const opacity = useTransform(smoothProgress, [0, 0.1, 0.9, 1], [0.4, 1, 1, 0.4])
  const scale = useTransform(smoothProgress, [0, 0.1, 0.9, 1], [0.8, 1, 1, 0.8])

  return (
    <div ref={containerRef} className={`relative ${className}`} style={{ height: containerHeight }}>
      <motion.div
        className={`sticky ${stickyClassName}`}
        style={{
          opacity,
          scale,
          willChange: "transform, opacity",
        }}
      >
        <div className={contentClassName}>{children}</div>
      </motion.div>
    </div>
  )
}

export default StickyScroll
