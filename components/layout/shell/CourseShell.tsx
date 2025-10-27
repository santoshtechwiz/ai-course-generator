"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import { cn } from "@/lib/utils"

interface CourseShellProps {
  children: React.ReactNode
  className?: string
  onFullscreenChange?: (isFullscreen: boolean) => void
}

/**
 * CourseShell - Wrapper for course pages with fullscreen support
 *
 * Provides fullscreen functionality and responsive layout for course content.
 * Handles fullscreen state management and transitions.
 */
export function CourseShell({ children, className, onFullscreenChange }: CourseShellProps) {
  const [isFullscreen, setIsFullscreen] = useState(false)

  // Handle fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      const fullscreen = !!document.fullscreenElement
      setIsFullscreen(fullscreen)
      onFullscreenChange?.(fullscreen)
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [onFullscreenChange])

  const toggleFullscreen = useCallback(async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen()
      } else {
        await document.exitFullscreen()
      }
    } catch (error) {
      console.warn('Fullscreen not supported or failed:', error)
    }
  }, [])

  return (
    <div className={cn(
      "min-h-screen flex flex-col transition-all duration-300",
      isFullscreen && "bg-black",
      className
    )}>
      {/* Expose fullscreen state and toggle function via context or props */}
      <div
        className={cn(
          "flex-1 transition-all duration-300",
          isFullscreen && "bg-black"
        )}
        style={{
          ['--course-fullscreen' as any]: isFullscreen ? 'true' : 'false',
          ['--course-sticky-offset' as any]: '5.5rem'
        }}
      >
        {children}
      </div>
    </div>
  )
}