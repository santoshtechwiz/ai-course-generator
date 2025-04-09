"use client"

import { useRef } from "react"
import { motion, useInView } from "framer-motion"
import Image from "next/image"

interface RevealImageProps {
  src: string
  alt: string
  width: number
  height: number
  direction?: "left" | "right" | "top" | "bottom"
  delay?: number
  className?: string
  priority?: boolean
}

const RevealImage = ({
  src,
  alt,
  width,
  height,
  direction = "left",
  delay = 0,
  className = "",
  priority = false,
}: RevealImageProps) => {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, amount: 0.3 })

  // Define the initial and animate states based on direction
  const getInitialPosition = () => {
    switch (direction) {
      case "left":
        return { x: -100, opacity: 0 }
      case "right":
        return { x: 100, opacity: 0 }
      case "top":
        return { y: -100, opacity: 0 }
      case "bottom":
        return { y: 100, opacity: 0 }
      default:
        return { x: -100, opacity: 0 }
    }
  }

  const getFinalPosition = () => {
    switch (direction) {
      case "left":
      case "right":
        return { x: 0, opacity: 1 }
      case "top":
      case "bottom":
        return { y: 0, opacity: 1 }
      default:
        return { x: 0, opacity: 1 }
    }
  }

  return (
    <motion.div
      ref={ref}
      initial={getInitialPosition()}
      animate={isInView ? getFinalPosition() : getInitialPosition()}
      transition={{
        type: "spring",
        stiffness: 50,
        damping: 20,
        delay,
      }}
      className={`relative overflow-hidden ${className}`}
      style={{ width, height }}
    >
      <Image
        src={src || "/placeholder.svg"}
        alt={alt}
        fill
        sizes={`(max-width: 768px) 100vw, ${width}px`}
        className="object-cover"
        priority={priority}
      />
    </motion.div>
  )
}

export default RevealImage
