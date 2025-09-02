"use client"

import { useState, useCallback, useEffect } from 'react'
import { useToast } from '@/components/ui/use-toast'
import type { FullChapterType } from '@/app/types/types'
import { storageManager } from "@/utils/storage-manager"

interface NextChapterInfo {
  title: string
  description?: string
  thumbnail?: string
  duration?: number
}

export function useAutoplay() {
  const { toast } = useToast()
  const [autoplayMode, setAutoplayMode] = useState(false)
  const [autoplayCountdown, setAutoplayCountdown] = useState(5)
  const [nextChapterInfo, setNextChapterInfo] = useState<NextChapterInfo | null>(null)
  const [showChapterTransition, setShowChapterTransition] = useState(false)
  const [showAutoplayOverlay, setShowAutoplayOverlay] = useState(false)

  // Load autoplay mode preference from StorageManager
  useEffect(() => {
    try {
      const userPrefs = storageManager.getUserPreferences()
      if (typeof userPrefs.autoplay === 'boolean') {
        setAutoplayMode(userPrefs.autoplay)
      }
    } catch {}
  }, [])

  // Toggle autoplay mode
  const handleAutoplayToggle = useCallback(() => {
    const newMode = !autoplayMode
    setAutoplayMode(newMode)
    
    // Save preference to StorageManager
    try {
      storageManager.saveUserPreferences({ autoplay: newMode })
    } catch {}
    
    toast({
      title: newMode ? "Auto-play Mode Enabled" : "Auto-play Mode Disabled",
      description: newMode 
        ? "Videos will automatically advance to the next chapter" 
        : "Videos will pause at the end of each chapter",
    })
  }, [autoplayMode, toast])

  // Start chapter transition with countdown
  const startChapterTransition = useCallback((nextChapter: { chapter: FullChapterType; duration: number }) => {
    setShowChapterTransition(true)
    setNextChapterInfo({
      title: nextChapter.chapter.title,
      description: nextChapter.chapter.description,
      thumbnail: nextChapter.chapter.thumbnail || undefined,
      duration: nextChapter.duration,
    })
    
    // Start countdown
    const countdown = setInterval(() => {
      setAutoplayCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdown)
          setShowChapterTransition(false)
          setNextChapterInfo(null)
          setAutoplayCountdown(5)
          return 5
        }
        return prev - 1
      })
    }, 1000)
  }, [])

  // Cancel autoplay
  const handleCancelAutoplay = useCallback(() => {
    setShowChapterTransition(false)
    setShowAutoplayOverlay(false)
    setNextChapterInfo(null)
    setAutoplayCountdown(5)
  }, [])

  // Show autoplay overlay
  const showAutoplayPrompt = useCallback(() => {
    setShowAutoplayOverlay(true)
  }, [])

  // Handle video end
  const handleVideoEnd = useCallback((nextChapter: { chapter: FullChapterType; duration: number } | null, onNextChapter: () => void) => {
    if (autoplayMode && nextChapter) {
      startChapterTransition(nextChapter)
      // Auto-advance after countdown
      setTimeout(() => {
        onNextChapter()
      }, 5000)
    } else {
      showAutoplayPrompt()
    }
  }, [autoplayMode, startChapterTransition, showAutoplayPrompt])

  return {
    // State
    autoplayMode,
    autoplayCountdown,
    nextChapterInfo,
    showChapterTransition,
    showAutoplayOverlay,
    
    // Actions
    handleAutoplayToggle,
    handleCancelAutoplay,
    handleVideoEnd,
    showAutoplayPrompt
  }
}