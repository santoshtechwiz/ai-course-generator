"use client"

import type React from "react"

// hooks/use-ripple.ts
import { useState } from "react"

export const useRipple = () => {
  const [rippleStyles, setRippleStyles] = useState<React.CSSProperties | null>(null)

  const addRipple = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect()
    setRippleStyles({
      left: e.clientX - rect.left - 5,
      top: e.clientY - rect.top - 5,
      width: "10px",
      height: "10px",
    })
    setTimeout(() => setRippleStyles(null), 600)
  }

  return { rippleStyles, addRipple }
}
