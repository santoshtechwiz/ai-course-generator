"use client"

import { createContext, useContext, useState, type ReactNode, useEffect } from "react"

interface AnimationContextType {
  animationsEnabled: boolean
  toggleAnimations: () => void
  setAnimationsEnabled: (enabled: boolean) => void
  reducedMotion: boolean
}

const AnimationContext = createContext<AnimationContextType | undefined>(undefined)

export function useAnimation() {
  const context = useContext(AnimationContext)
  if (!context) {
    throw new Error("useAnimation must be used within an AnimationProvider")
  }
  return context
}

interface AnimationProviderProps {
  children: ReactNode
  initialState?: boolean
}

export function AnimationProvider({ children, initialState = true }: AnimationProviderProps) {
  const [animationsEnabled, setAnimationsEnabled] = useState(initialState)
  const [reducedMotion, setReducedMotion] = useState(false)

  // Check for reduced motion preference
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)")
    setReducedMotion(mediaQuery.matches)

    const handleChange = (e: MediaQueryListEvent) => {
      setReducedMotion(e.matches)
    }

    mediaQuery.addEventListener("change", handleChange)
    return () => mediaQuery.removeEventListener("change", handleChange)
  }, [])

  // If user has reduced motion preference, disable animations regardless of setting
  const effectiveAnimationsEnabled = reducedMotion ? false : animationsEnabled

  const toggleAnimations = () => {
    const newState = !animationsEnabled
    setAnimationsEnabled(newState)

    // Save preference to localStorage
    try {
      localStorage.setItem("animationsEnabled", newState.toString())
    } catch (error) {
      console.error("Failed to save animation preference:", error)
    }
  }

  // Load preference from localStorage on mount
  useEffect(() => {
    try {
      const savedPreference = localStorage.getItem("animationsEnabled")
      if (savedPreference !== null) {
        setAnimationsEnabled(savedPreference === "true")
      }
    } catch (error) {
      console.error("Failed to load animation preference:", error)
    }
  }, [])

  return (
    <AnimationContext.Provider
      value={{
        animationsEnabled: effectiveAnimationsEnabled,
        toggleAnimations,
        setAnimationsEnabled,
        reducedMotion,
      }}
    >
      {children}
    </AnimationContext.Provider>
  )
}
