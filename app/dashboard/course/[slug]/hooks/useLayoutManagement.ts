"use client"

import { useState, useCallback, useEffect, useMemo } from 'react'
import { useToast } from '@/components/ui/use-toast'

export function useLayoutManagement(courseId: string) {
  const { toast } = useToast()
  const [wideMode, setWideMode] = useState(false)
  const [isPiPActive, setIsPiPActive] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isTheaterMode, setIsTheaterMode] = useState(false)

  // Load wide mode preference from localStorage
  useEffect(() => {
    try {
      const savedWideMode = localStorage.getItem(`wide_mode_course_${courseId}`)
      if (savedWideMode !== null) {
        setWideMode(savedWideMode === 'true')
      }
    } catch {}
  }, [courseId])

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  // PIP toggle handler
  const handlePIPToggle = useCallback((isPiPActive: boolean) => {
    setIsPiPActive(isPiPActive)
    
    // If PIP is activated in wide mode, smoothly scroll to top
    if (isPiPActive && wideMode) {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }, [wideMode])

  // Wide mode toggle handler
  const handleWideModeToggle = useCallback(() => {
    const newWideMode = !wideMode
    setWideMode(newWideMode)
    
    // Save preference to localStorage
    try {
      localStorage.setItem(`wide_mode_course_${courseId}`, String(newWideMode))
    } catch {}
    
    // Show feedback toast
    toast({
      title: newWideMode ? "Wide Mode Enabled" : "Wide Mode Disabled",
      description: newWideMode 
        ? "Video player now uses full width" 
        : "Video player now uses standard width",
    })
  }, [wideMode, courseId, toast])

  // Fullscreen toggle handler
  const handleFullscreenToggle = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen()
    } else {
      document.exitFullscreen()
    }
  }, [])

  // Theater mode toggle handler
  const handleTheaterModeToggle = useCallback(() => {
    setIsTheaterMode(!isTheaterMode)
  }, [isTheaterMode])

  // Grid layout classes based on PIP state
  const gridLayoutClasses = useMemo(() => {
    if (isPiPActive) {
      return "grid-cols-1"
    }
    return wideMode 
      ? "md:grid-cols-[1.2fr_360px] xl:grid-cols-[1.5fr_420px]"
      : "md:grid-cols-[1fr_360px] xl:grid-cols-[1fr_420px]"
  }, [isPiPActive, wideMode])

  return {
    // State
    wideMode,
    isPiPActive,
    isFullscreen,
    isTheaterMode,
    
    // Actions
    handlePIPToggle,
    handleWideModeToggle,
    handleFullscreenToggle,
    handleTheaterModeToggle,
    
    // Computed
    gridLayoutClasses
  }
}