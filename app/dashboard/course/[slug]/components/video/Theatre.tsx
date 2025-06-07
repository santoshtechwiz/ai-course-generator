// Enhanced Theatre Mode Functionality for Video Player
// This file contains comprehensive fixes for theatre mode implementation

import React, { useState, useEffect, useCallback } from 'react'
import { Maximize, Minimize, Monitor } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'

// FIXED: Enhanced theatre mode CSS (add to your global styles)
const theaterModeStyles = `
/* Enhanced Theatre Mode Styles */
.theater-mode-active {
  overflow: hidden !important;
}

.theater-mode-active body {
  overflow: hidden !important;
}

/* Theatre mode container */
.video-player-theater-mode {
  position: fixed !important;
  top: 0 !important;
  left: 0 !important;
  width: 100vw !important;
  height: 100vh !important;
  max-width: none !important;
  max-height: none !important;
  border-radius: 0 !important;
  z-index: 9999 !important;
  background: black !important;
  aspect-ratio: auto !important;
}

/* Theatre mode transitions */
.video-player-container {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
}

.video-player-theater-mode {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
}

/* Theatre mode backdrop */
.theater-mode-backdrop {
  position: fixed;
  inset: 0;
  background: black;
  z-index: 9998;
  opacity: 0;
  animation: fadeIn 0.3s ease-in-out forwards;
}

@keyframes fadeIn {
  to {
    opacity: 1;
  }
}

/* Theatre mode controls positioning */
.theater-mode .video-controls {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 10000;
}

/* Theatre mode responsive adjustments */
@media (max-width: 768px) {
  .video-player-theater-mode {
    /* Mobile theatre mode optimizations */
    position: fixed !important;
    inset: 0 !important;
  }
  
  .theater-mode .video-controls {
    padding: 0.5rem;
  }
  
  .theater-mode .video-controls-button {
    padding: 0.375rem;
    font-size: 0.875rem;
  }
}

@media (max-width: 640px) {
  .theater-mode .video-controls-secondary {
    display: none;
  }
  
  .theater-mode .video-indicator {
    top: 0.5rem;
    left: 0.5rem;
    right: 0.5rem;
    font-size: 0.75rem;
    padding: 0.25rem 0.5rem;
  }
}

/* Theatre mode exit button */
.theater-mode-exit-button {
  position: fixed;
  top: 1rem;
  right: 1rem;
  z-index: 10001;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: white;
  padding: 0.75rem;
  border-radius: 0.5rem;
  transition: all 0.2s ease-in-out;
}

.theater-mode-exit-button:hover {
  background: rgba(0, 0, 0, 0.9);
  border-color: rgba(255, 255, 255, 0.3);
  transform: scale(1.05);
}

@media (max-width: 640px) {
  .theater-mode-exit-button {
    top: 0.5rem;
    right: 0.5rem;
    padding: 0.5rem;
  }
}

/* Prevent scrolling when in theatre mode */
.theater-mode-active,
.theater-mode-active body,
.theater-mode-active html {
  overflow: hidden !important;
  height: 100vh !important;
}

/* Hide other page content in theatre mode */
.theater-mode-active .main-content:not(.video-player-container) {
  display: none;
}

/* Theatre mode indicator animation */
.theater-mode-indicator {
  animation: slideInFromTop 0.3s ease-out;
}

@keyframes slideInFromTop {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Theatre mode focus management */
.theater-mode-active *:focus {
  outline: 2px solid rgba(59, 130, 246, 0.5);
  outline-offset: 2px;
}
`

interface TheaterModeManagerProps {
  isTheaterMode: boolean
  onToggle: () => void
  onExit: () => void
  className?: string
}

// FIXED: Enhanced theatre mode manager component
const TheaterModeManager: React.FC<TheaterModeManagerProps> = ({
  isTheaterMode,
  onToggle,
  onExit,
  className = '',
}) => {
  const { toast } = useToast()
  const [isTransitioning, setIsTransitioning] = useState<boolean>(false)

  // FIXED: Enhanced theatre mode toggle with proper state management
  const handleToggle = useCallback(async () => {
    if (isTransitioning) return

    setIsTransitioning(true)

    try {
      // Add transition class
      document.body.classList.add('theater-mode-transitioning')

      if (!isTheaterMode) {
        // Type-safe document access
        if (typeof document !== 'undefined') {
          document.documentElement.classList.add('theater-mode-active')
        }
        document.body.classList.add('theater-mode-active')
        
        // Hide scrollbars
        document.body.style.overflow = 'hidden'
        if (typeof document !== 'undefined') {
          document.documentElement.style.overflow = 'hidden'
        }
        
        // Prevent background scrolling
        const scrollY = window.scrollY
        document.body.style.position = 'fixed'
        document.body.style.top = `-${scrollY}px`
        document.body.style.width = '100%'
        
        toast({
          title: "Theatre Mode",
          description: "Entered theatre mode. Press T or ESC to exit.",
          duration: 2000,
        })
      } else {
        // Exiting theatre mode
        if (typeof document !== 'undefined') {
          document.documentElement.classList.remove('theater-mode-active')
        }
        document.body.classList.remove('theater-mode-active')
        
        // Restore scrollbars
        document.body.style.overflow = ''
        if (typeof document !== 'undefined') {
          document.documentElement.style.overflow = ''
        }
        
        // Restore scroll position
        const scrollY = document.body.style.top
        document.body.style.position = ''
        document.body.style.top = ''
        document.body.style.width = ''
        if (scrollY) {
          window.scrollTo(0, parseInt(scrollY || '0') * -1)
        }
        
        toast({
          title: "Theatre Mode",
          description: "Exited theatre mode.",
          duration: 1500,
        })
      }

      // Call the toggle handler
      onToggle()

      // Wait for transition to complete
      await new Promise(resolve => setTimeout(resolve, 300))
    } catch (error) {
      console.error('Theatre mode toggle error:', error)
      toast({
        title: "Theatre Mode Error",
        description: "Failed to toggle theatre mode.",
        variant: "destructive",
      })
    } finally {
      document.body.classList.remove('theater-mode-transitioning')
      setIsTransitioning(false)
    }
  }, [isTheaterMode, isTransitioning, onToggle, toast])

  // FIXED: Enhanced exit handler
  const handleExit = useCallback(() => {
    if (isTheaterMode) {
      handleToggle()
    }
    onExit()
  }, [isTheaterMode, handleToggle, onExit])

  // FIXED: Enhanced keyboard event handling
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only handle if not in input fields
      const target = event.target as HTMLElement
      if (target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA' || target?.isContentEditable) {
        return
      }

      switch (event.key) {
        case 't':
        case 'T':
          event.preventDefault()
          handleToggle()
          break
        case 'Escape':
          if (isTheaterMode) {
            event.preventDefault()
            handleExit()
          }
          break
        case 'F11':
          // Prevent F11 fullscreen when in theatre mode
          if (isTheaterMode) {
            event.preventDefault()
          }
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isTheaterMode, handleToggle, handleExit])

  // FIXED: Handle browser back button in theatre mode
  useEffect(() => {
    if (!isTheaterMode) return

    const handlePopState = (event: PopStateEvent) => {
      event.preventDefault()
      handleExit()
    }

    // Add a history entry when entering theatre mode
    window.history.pushState({ theaterMode: true }, '', window.location.href)
    window.addEventListener('popstate', handlePopState)

    return () => {
      window.removeEventListener('popstate', handlePopState)
    }
  }, [isTheaterMode, handleExit])

  // FIXED: Handle window resize in theatre mode
  useEffect(() => {
    if (!isTheaterMode) return

    const handleResize = () => {
      // Ensure theatre mode container maintains full viewport
      const theaterContainer = document.querySelector('.video-player-theater-mode')
      if (theaterContainer) {
        const container = theaterContainer as HTMLElement
        container.style.width = '100vw'
        container.style.height = '100vh'
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [isTheaterMode])

  return (
    <div className={`theater-mode-manager ${className}`}>
      {/* Theatre Mode Toggle Button */}
      <Button
        onClick={handleToggle}
        variant="ghost"
        size="sm"
        className="flex items-center gap-2"
        disabled={isTransitioning}
        title={isTheaterMode ? "Exit Theatre Mode (T)" : "Enter Theatre Mode (T)"}
      >
        {isTheaterMode ? (
          <>
            <Minimize className="h-4 w-4" />
            <span className="hidden sm:inline">Exit Theatre</span>
          </>
        ) : (
          <>
            <Monitor className="h-4 w-4" />
            <span className="hidden sm:inline">Theatre Mode</span>
          </>
        )}
      </Button>

      {/* Theatre Mode Exit Button (shown when in theatre mode) */}
      {isTheaterMode && (
        <button
          onClick={handleExit}
          className="theater-mode-exit-button"
          title="Exit Theatre Mode (ESC)"
          aria-label="Exit Theatre Mode"
        >
          <Minimize className="h-5 w-5" />
        </button>
      )}
    </div>
  )
}

// FIXED: Enhanced theatre mode hook for better state management
export const useTheaterMode = (initialState = false) => {
  const [isTheaterMode, setIsTheaterMode] = useState(initialState)
  const [isSupported, setIsSupported] = useState(true)
  const { toast } = useToast()

  // Check if theatre mode is supported
  useEffect(() => {
    const checkSupport = () => {
      // Check if we're in a browser environment
      if (typeof window === 'undefined') {
        setIsSupported(false)
        return
      }

      // Check for required APIs
      const hasFullscreenAPI = !!(
        document.fullscreenEnabled ||
        (document as any).webkitFullscreenEnabled ||
        (document as any).mozFullScreenEnabled ||
        (document as any).msFullscreenEnabled
      )

      setIsSupported(hasFullscreenAPI)
    }

    checkSupport()
  }, [])

  const toggleTheaterMode = useCallback(() => {
    if (!isSupported) {
      toast({
        title: "Theatre Mode Not Supported",
        description: "Your browser doesn't support theatre mode.",
        variant: "destructive",
      })
      return
    }

    setIsTheaterMode(prev => !prev)
  }, [isSupported, toast])

  const exitTheaterMode = useCallback(() => {
    setIsTheaterMode(false)
  }, [])

  const enterTheaterMode = useCallback(() => {
    if (!isSupported) {
      toast({
        title: "Theatre Mode Not Supported",
        description: "Your browser doesn't support theatre mode.",
        variant: "destructive",
      })
      return
    }

    setIsTheaterMode(true)
  }, [isSupported, toast])

  return {
    isTheaterMode,
    isSupported,
    toggleTheaterMode,
    exitTheaterMode,
    enterTheaterMode,
  }
}

// FIXED: Theatre mode context for global state management
export const TheaterModeContext = React.createContext<{
  isTheaterMode: boolean
  toggleTheaterMode: () => void
  exitTheaterMode: () => void
  enterTheaterMode: () => void
  isSupported: boolean
} | null>(null)

export const TheaterModeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const theaterMode = useTheaterMode()

  return (
    <TheaterModeContext.Provider value={theaterMode}>
      {children}
    </TheaterModeContext.Provider>
  )
}

export const useTheaterModeContext = () => {
  const context = React.useContext(TheaterModeContext)
  if (!context) {
    throw new Error('useTheaterModeContext must be used within a TheaterModeProvider')
  }
  return context
}

// FIXED: Theatre mode utility functions
export const theaterModeUtils = {
  // Inject theatre mode styles
  injectStyles: () => {
    if (typeof document === 'undefined') return

    const existingStyles = document.getElementById('theater-mode-styles')
    if (existingStyles) return

    const styleElement = document.createElement('style')
    styleElement.id = 'theater-mode-styles'
    styleElement.textContent = theaterModeStyles
    document.head.appendChild(styleElement)
  },

  // Remove theatre mode styles
  removeStyles: () => {
    if (typeof document === 'undefined') return

    const existingStyles = document.getElementById('theater-mode-styles')
    if (existingStyles) {
      existingStyles.remove()
    }
  },

  // Check if currently in theatre mode
  isInTheaterMode: () => {
    if (typeof document === 'undefined') return false
    return document.documentElement.classList.contains('theater-mode-active')
  },

  // Force exit theatre mode (cleanup function)
  forceExit: () => {
    if (typeof document === 'undefined') return

    document.documentElement.classList.remove('theater-mode-active')
    document.body.classList.remove('theater-mode-active')
    document.body.style.overflow = ''
    document.documentElement.style.overflow = ''
    document.body.style.position = ''
    document.body.style.top = ''
    document.body.style.width = ''
  },
}

export { TheaterModeManager, theaterModeStyles }
export type { TheaterModeManagerProps }

