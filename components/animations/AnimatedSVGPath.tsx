"use client"

import { useEffect, useState } from "react"
import { motion, useAnimation } from "framer-motion"
import { useInView } from "react-intersection-observer"

interface AnimatedSVGPathProps {
  d: string
  stroke?: string
  strokeWidth?: number
  fill?: string
  delay?: number
  duration?: number
  className?: string
  pathLength?: number
  repeat?: boolean
  repeatDelay?: number
  easing?: number[]
}

const AnimatedSVGPath = ({
  d,
  stroke = "currentColor",
  strokeWidth = 2,
  fill = "none",
  delay = 0,
  duration = 1.5,
  className = "",
  pathLength = 1,
  repeat = false,
  repeatDelay = 0,
  easing = [0.25, 0.1, 0.25, 1], // Apple-style easing
}: AnimatedSVGPathProps) => {
  const controls = useAnimation()
  const [ref, inView] = useInView({ triggerOnce: !repeat, threshold: 0.2 })
  const [isAnimated, setIsAnimated] = useState(false)

  useEffect(() => {
    if (inView) {
      controls.start({
        pathLength: pathLength,
        opacity: 1,
        transition: {
          pathLength: { delay, duration, ease: easing },
          opacity: { delay, duration: duration * 0.75, ease: easing },
        },
      })
      setIsAnimated(true)
    } else if (repeat && isAnimated) {
      controls
        .start({
          pathLength: 0,
          opacity: 0,
          transition: {
            pathLength: { duration: 0.3, ease: easing },
            opacity: { duration: 0.3, ease: easing },
          },
        })
        .then(() => {
          setIsAnimated(false)
        })
    }
  }, [inView, controls, delay, duration, pathLength, repeat, isAnimated, easing, repeatDelay])

  return (
    <motion.path
      ref={ref}
      d={d}
      stroke={stroke}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      initial={{ pathLength: 0, opacity: 0 }}
      animate={controls}
      fill={fill}
      className={className}
    />
  )
}

export default AnimatedSVGPath
