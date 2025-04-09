"use client"

import { useState, useEffect, useRef } from "react"
import { useInView } from "react-intersection-observer"

interface CountUpProps {
  end: number
  start?: number
  duration?: number
  delay?: number
  prefix?: string
  suffix?: string
  decimals?: number
  separator?: string
  className?: string
}

const CountUp = ({
  end,
  start = 0,
  duration = 2,
  delay = 0,
  prefix = "",
  suffix = "",
  decimals = 0,
  separator = ",",
  className = "",
}: CountUpProps) => {
  const [count, setCount] = useState(start)
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.1 })
  const countRef = useRef<number>(start)
  const startTimeRef = useRef<number | null>(null)
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    if (!inView) return

    const delayTimeout = setTimeout(() => {
      const animate = (timestamp: number) => {
        if (startTimeRef.current === null) {
          startTimeRef.current = timestamp
        }

        const progress = Math.min((timestamp - startTimeRef.current) / (duration * 1000), 1)
        const currentCount = progress * (end - start) + start

        countRef.current = currentCount
        setCount(currentCount)

        if (progress < 1) {
          rafRef.current = requestAnimationFrame(animate)
        }
      }

      rafRef.current = requestAnimationFrame(animate)
    }, delay * 1000)

    return () => {
      clearTimeout(delayTimeout)
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
      }
    }
  }, [inView, start, end, duration, delay])

  const formatNumber = (num: number) => {
    return prefix + num.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, separator) + suffix
  }

  return (
    <span ref={ref} className={className}>
      {formatNumber(count)}
    </span>
  )
}

export default CountUp
