"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import { Minimize, Monitor } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks"
import type { TheaterModeManagerProps } from "./types"

// Theater mode styles
const theaterModeStyles = `
.theater-mode-active {
  overflow: hidden !important;
}

.theater-mode-active body {
  overflow: hidden !important;
}

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

.video-player-container {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
}

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

.theater-mode .video-controls {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 10000;
}

@media (max-width: 1024px) {
  .video-player-theater-mode {
    flex-direction: column;
    align-items: center;
  }

  .playlist-container {
    width: 100%;
    order: 2;
    max-height: 30vh;
    overflow-y: auto;
  }

  .video-container {
    width: 100%;
    order: 1;
    flex: 1;
  }
}

@media (max-width: 768px) {
  .video-player-theater-mode {
    padding: 0.5rem;
  }

  .playlist-container {
    display: none;
  }
}

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

.theater-mode-active,
.theater-mode-active body,
.theater-mode-active html {
  overflow: hidden !important;
  height: 100vh !important;
}
`

const TheaterModeManager: React.FC<TheaterModeManagerProps> = ({ isTheaterMode, onToggle, onExit, className = "" }) => {
  const { toast } = useToast()
  const [isTransitioning, setIsTransitioning] = useState(false)

  const handleToggle = useCallback(async () => {
    if (isTransitioning) return

    setIsTransitioning(true)

    try {
      document.body.classList.add("theater-mode-transitioning")

      if (!isTheaterMode) {
        // Entering theater mode
        document.documentElement.classList.add("theater-mode-active")
        document.body.classList.add("theater-mode-active")

        // Prevent background scrolling
        const scrollY = window.scrollY
        document.body.style.position = "fixed"
        document.body.style.top = `-${scrollY}px`
        document.body.style.width = "100%"
        document.body.style.overflow = "hidden"

        toast({
          title: "Theater Mode",
          description: "Entered theater mode. Press T or ESC to exit.",
          duration: 2000,
        })
      } else {
        // Exiting theater mode
        document.documentElement.classList.remove("theater-mode-active")
        document.body.classList.remove("theater-mode-active")

        // Restore scroll position
        const scrollY = document.body.style.top
        document.body.style.position = ""
        document.body.style.top = ""
        document.body.style.width = ""
        document.body.style.overflow = ""

        if (scrollY) {
          window.scrollTo(0, Number.parseInt(scrollY || "0") * -1)
        }

        toast({
          title: "Theater Mode",
          description: "Exited theater mode.",
          duration: 1500,
        })
      }

      onToggle()
      await new Promise((resolve) => setTimeout(resolve, 300))
    } catch (error) {
      console.error("Theater mode toggle error:", error)
      toast({
        title: "Theater Mode Error",
        description: "Failed to toggle theater mode.",
        variant: "destructive",
      })
    } finally {
      document.body.classList.remove("theater-mode-transitioning")
      setIsTransitioning(false)
    }
  }, [isTheaterMode, onToggle, toast, isTransitioning])

  const handleExit = useCallback(() => {
    if (isTheaterMode) {
      handleToggle()
    }
    onExit()
  }, [isTheaterMode, handleToggle, onExit])

  // Keyboard event handling
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement
      if (target?.tagName === "INPUT" || target?.tagName === "TEXTAREA" || target?.isContentEditable) {
        return
      }

      switch (event.key) {
        case "t":
        case "T":
          event.preventDefault()
          handleToggle()
          break
        case "Escape":
          if (isTheaterMode) {
            event.preventDefault()
            handleExit()
          }
          break
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isTheaterMode, handleToggle, handleExit])

  // Handle browser back button
  useEffect(() => {
    if (!isTheaterMode) return

    const handlePopState = (event: PopStateEvent) => {
      event.preventDefault()
      handleExit()
    }

    window.history.pushState({ theaterMode: true }, "", window.location.href)
    window.addEventListener("popstate", handlePopState)

    return () => {
      window.removeEventListener("popstate", handlePopState)
    }
  }, [isTheaterMode, handleExit])

  // Inject styles
  useEffect(() => {
    const existingStyles = document.getElementById("theater-mode-styles")
    if (existingStyles) return

    const styleElement = document.createElement("style")
    styleElement.id = "theater-mode-styles"
    styleElement.textContent = theaterModeStyles
    document.head.appendChild(styleElement)

    return () => {
      const styles = document.getElementById("theater-mode-styles")
      if (styles) {
        styles.remove()
      }
    }
  }, [])

  return (
    <div className={`theater-mode-manager ${className}`}>
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

export { TheaterModeManager }
export type { TheaterModeManagerProps }
