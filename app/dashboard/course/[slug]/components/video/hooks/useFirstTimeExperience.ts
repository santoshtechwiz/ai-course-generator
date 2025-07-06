"use client"

import { useState, useEffect, useCallback } from "react"
import { useAuth } from "@/modules/auth"

interface FirstTimeExperienceOptions {
  videoId: string
}

export function useFirstTimeExperience({ videoId }: FirstTimeExperienceOptions) {
  const [showKeyboardShortcutHelp, setShowKeyboardShortcutHelp] = useState(false)
  const [hasInteracted, setHasInteracted] = useState(false)
  const [hasShownTutorial, setHasShownTutorial] = useState(false)
  const { isAuthenticated, user } = useAuth()
  const userId = user?.id

  // Get or create guest ID for unauthenticated users
  const getGuestId = useCallback(() => {
    if (typeof window === "undefined") return null
    
    const existing = sessionStorage.getItem("guest-id")
    if (existing?.startsWith("guest-")) return existing
    
    const newId = `guest-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`
    sessionStorage.setItem("guest-id", newId)
    return newId
  }, [])

  // Check if first time user
  useEffect(() => {
    try {
      let key: string
      
      if (isAuthenticated && userId) {
        key = `video-tutorial-shown-${userId}`
      } else {
        const guestId = getGuestId()
        key = `video-tutorial-shown-guest-${guestId}`
      }
      
      const hasShown = localStorage.getItem(key) === 'true'
      setHasShownTutorial(hasShown)
      
      // Show keyboard shortcut help if first time
      setShowKeyboardShortcutHelp(!hasShown)
    } catch (err) {
      console.error("Error checking tutorial status:", err)
    }
  }, [isAuthenticated, userId, getGuestId])

  // Mark tutorial as shown
  const markTutorialShown = useCallback(() => {
    try {
      let key: string
      
      if (isAuthenticated && userId) {
        key = `video-tutorial-shown-${userId}`
      } else {
        const guestId = getGuestId()
        key = `video-tutorial-shown-guest-${guestId}`
      }
      
      localStorage.setItem(key, 'true')
      setHasShownTutorial(true)
      setShowKeyboardShortcutHelp(false)
    } catch (err) {
      console.error("Error marking tutorial as shown:", err)
    }
  }, [isAuthenticated, userId, getGuestId])

  // Record user interaction
  const handleInteraction = useCallback(() => {
    setHasInteracted(true)
    
    // Hide keyboard help after interaction
    if (showKeyboardShortcutHelp) {
      setTimeout(() => {
        setShowKeyboardShortcutHelp(false)
      }, 3000)
    }
  }, [showKeyboardShortcutHelp])

  return {
    showKeyboardShortcutHelp,
    hasInteracted,
    hasShownTutorial,
    markTutorialShown,
    handleInteraction
  }
}
