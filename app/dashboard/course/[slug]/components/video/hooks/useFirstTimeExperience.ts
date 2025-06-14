"use client"

import { useState, useEffect, useCallback } from "react"
import useAuth from "../../../../../../../hooks/use-auth"

interface FirstTimeExperienceOptions {
  videoId: string
}

export function useFirstTimeExperience({ videoId }: FirstTimeExperienceOptions) {
  const [showKeyboardShortcutHelp, setShowKeyboardShortcutHelp] = useState(false)
  const [hasInteracted, setHasInteracted] = useState(false)
  const [hasShownTutorial, setHasShownTutorial] = useState(false)
  const { isAuthenticated, userId, getGuestId } = useAuth()

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
