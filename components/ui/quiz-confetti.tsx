"use client"

import { useEffect, useState } from "react"
import confetti from "canvas-confetti"

interface QuizConfettiProps {
  score: number
  threshold?: number
  duration?: number
  particleCount?: number
  spread?: number
  origin?: { x: number; y: number }
  colors?: string[]
}

export function QuizConfetti({
  score,
  threshold = 80,
  duration = 3000,
  particleCount = 100,
  spread = 70,
  origin = { x: 0.5, y: 0.5 },
  colors = ["#26ccff", "#a25afd", "#ff5e7e", "#88ff5a", "#fcff42", "#ffa62d", "#ff36ff"],
}: QuizConfettiProps) {
  const [hasTriggered, setHasTriggered] = useState(false)

  useEffect(() => {
    if (score >= threshold && !hasTriggered) {
      const end = Date.now() + duration

      const frame = () => {
        confetti({
          particleCount: particleCount / 10,
          angle: 60,
          spread,
          origin: { x: 0.1, y: 0.5 },
          colors,
        })
        confetti({
          particleCount: particleCount / 10,
          angle: 120,
          spread,
          origin: { x: 0.9, y: 0.5 },
          colors,
        })

        if (Date.now() < end) {
          requestAnimationFrame(frame)
        }
      }

      // Initial burst
      confetti({
        particleCount,
        spread,
        origin,
        colors,
      })

      // Start the frame animation
      frame()
      setHasTriggered(true)
    }
  }, [score, threshold, duration, particleCount, spread, origin, colors, hasTriggered])

  return null
}

export function triggerConfetti(options?: Partial<QuizConfettiProps>) {
  const defaults = {
    particleCount: 100,
    spread: 70,
    origin: { x: 0.5, y: 0.5 },
    colors: ["#26ccff", "#a25afd", "#ff5e7e", "#88ff5a", "#fcff42", "#ffa62d", "#ff36ff"],
  }

  const config = { ...defaults, ...options }

  confetti({
    particleCount: config.particleCount,
    spread: config.spread,
    origin: config.origin,
    colors: config.colors,
  })
}
