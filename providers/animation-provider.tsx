"use client"

import { createContext, useContext, useState, type ReactNode, useEffect } from "react"
import { migratedStorage } from "@/lib/storage"

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
    if (typeof window !== "undefined") {
      const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)")
      setReducedMotion(mediaQuery.matches)

      const handleChange = (e: MediaQueryListEvent) => {
        setReducedMotion(e.matches)
      }

      mediaQuery.addEventListener("change", handleChange)
      return () => mediaQuery.removeEventListener("change", handleChange)
    }
  }, [])

  // If user has reduced motion preference, disable animations regardless of setting
  const effectiveAnimationsEnabled = !reducedMotion && animationsEnabled

  const toggleAnimations = () => {
    if (!reducedMotion) {
      const newState = !animationsEnabled
      setAnimationsEnabled(newState)

      // Save preference to storage
      migratedStorage.setPreference("animations_enabled", newState)
    }
  }

  // Load preference from storage on mount
  useEffect(() => {
    const savedPreference = migratedStorage.getPreference("animations_enabled", !reducedMotion)
    if (typeof savedPreference === "boolean") {
      setAnimationsEnabled(savedPreference)
    }
  }, [reducedMotion])

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
