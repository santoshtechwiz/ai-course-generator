"use client"

import { useState, useEffect, useRef } from "react"

interface CountUpProps {
  end: number
  start?: number
  duration?: number
  delay?: number
  separator?: string
  prefix?: string
  suffix?: string
  decimals?: number
  className?: string
}

const CountUp = ({
  end,
  start = 0,
  duration = 2,
  delay = 0,
  separator = "",
  prefix = "",
  suffix = "",
  decimals = 0,
  className = "",
}: CountUpProps) => {
  const [count, setCount] = useState(start)
  const countRef = useRef(start)
  const startTimeRef = useRef<number | null>(null)
  const requestIdRef = useRef<number | null>(null)

  useEffect(() => {
    // Delay start if needed
    const delayTimeout = setTimeout(() => {
      startTimeRef.current = null

      const animate = (timestamp: number) => {
        if (!startTimeRef.current) startTimeRef.current = timestamp
        const progress = Math.min((timestamp - startTimeRef.current) / (duration * 1000), 1)

        // Use easeOutExpo for smooth counting
        const easedProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress)
        const nextCount = start + easedProgress * (end - start)

        countRef.current = nextCount
        setCount(nextCount)

        if (progress < 1) {
          requestIdRef.current = requestAnimationFrame(animate)
        }
      }

      requestIdRef.current = requestAnimationFrame(animate)
    }, delay * 1000)

    return () => {
      clearTimeout(delayTimeout)
      if (requestIdRef.current) {
        cancelAnimationFrame(requestIdRef.current)
      }
    }
  }, [start, end, duration, delay])

  const formatNumber = (num: number) => {
    const fixed = num.toFixed(decimals)
    const parts = fixed.toString().split(".")

    if (separator) {
      parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, separator)
    }

    return `${prefix}${parts.join(".")}${suffix}`
  }

  return <span className={className}>{formatNumber(count)}</span>
}

export default CountUp
