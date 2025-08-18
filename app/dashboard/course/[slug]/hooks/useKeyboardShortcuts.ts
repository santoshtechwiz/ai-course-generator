"use client"

import { useEffect, useCallback } from 'react'

interface KeyboardShortcutsProps {
  showChapterTransition: boolean
  showAutoplayOverlay: boolean
  isPiPActive: boolean
  onCancelAutoplay: () => void
  onPIPToggle: (isPiPActive: boolean) => void
  onAutoplayToggle: () => void
}

export function useKeyboardShortcuts({
  showChapterTransition,
  showAutoplayOverlay,
  isPiPActive,
  onCancelAutoplay,
  onPIPToggle,
  onAutoplayToggle
}: KeyboardShortcutsProps) {
  
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Only handle shortcuts when not typing in input fields
    if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
      return
    }

    switch (event.key) {
      case 'Escape':
        if (showChapterTransition) {
          onCancelAutoplay()
        } else if (showAutoplayOverlay) {
          // Close autoplay overlay - this should be handled by the component
          return
        } else if (isPiPActive) {
          onPIPToggle(false)
        }
        break
      case 'p':
      case 'P':
        if (event.ctrlKey || event.metaKey) {
          event.preventDefault()
          onPIPToggle(!isPiPActive)
        }
        break
      case 'a':
      case 'A':
        if (event.ctrlKey || event.metaKey) {
          event.preventDefault()
          onAutoplayToggle()
        }
        break
    }
  }, [
    showChapterTransition,
    showAutoplayOverlay,
    isPiPActive,
    onCancelAutoplay,
    onPIPToggle,
    onAutoplayToggle
  ])

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])
}