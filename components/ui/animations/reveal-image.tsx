"use client"

import { useRef } from "react"
import { motion, useInView } from "framer-motion"
import Image from "next/image"
import { cn } from "@/lib/tailwindUtils"

interface RevealImageProps extends React.HTMLAttributes<HTMLDivElement> {
  src: string
  alt: string
  width?: number
  height?: number
  direction?: "left" | "right" | "top" | "bottom"
  delay?: number
  priority?: boolean
  objectFit?: "contain" | "cover" | "fill" | "none" | "scale-down"
  quality?: number
  threshold?: number
}

/**
 * RevealImage - A component that reveals an image with an animation when it comes into view
 * 
 * Improved features:
 * - Better TypeScript integration with React.HTMLAttributes
 * - Uses cn utility for className merging
 * - Optional width/height for responsive use cases
 * - Configurable animation threshold
 * - Image quality control
 * - Object fit options
 * - Better performance with reduced re-renders
 */
export function RevealImage({
  src,
  alt,
  width,
  height,
  direction = "left",
  delay = 0,
  className = "",
  priority = false,
  objectFit = "cover",
  quality = 80,
  threshold = 0.3,
  ...props
}: RevealImageProps) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, amount: threshold })

  // Initial animation states based on direction
  const initial = {
    left: { x: -50, opacity: 0 },
    right: { x: 50, opacity: 0 },
    top: { y: -50, opacity: 0 },
    bottom: { y: 50, opacity: 0 },
  }

  // Final animation state - all directions resolve to the same end position
  const animate = {
    x: 0,
    y: 0,
    opacity: 1,
  }

  return (
    <motion.div
      ref={ref}
      initial={initial[direction]}
      animate={isInView ? animate : initial[direction]}
      transition={{
        type: "spring",
        stiffness: 50,
        damping: 20,
        delay,
      }}
      className={cn(
        "relative overflow-hidden",
        width && height ? "" : "w-full h-auto",
        className
      )}
      style={width && height ? { width, height } : {}}
      {...props}
    >
      <Image
        src={src || "/placeholder.svg"}
        alt={alt}
        fill={!(width && height)}
        width={width}
        height={height}
        sizes={`(max-width: 768px) 100vw, ${width ? `${width}px` : "50vw"}`}
        className={cn(`object-${objectFit}`, "transition-transform duration-300")}
        priority={priority}
        quality={quality}
      />
    </motion.div>
  )
}
