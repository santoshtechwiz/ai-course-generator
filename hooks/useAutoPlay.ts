"use client"

import { useState, useEffect, useRef } from "react"

interface UseAutoPlayOptions {
  initialDelay?: number
  interval?: number
  pauseOnHover?: boolean
}

export function useAutoPlay(
  itemCount: number,
  onIndexChange: (index: number) => void,
  options: UseAutoPlayOptions = {},
) {
  const { initialDelay = 0, interval = 5000, pauseOnHover = true } = options

  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(true)
  const [progress, setProgress] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const startTimeRef = useRef<number>(0)
  const frameIdRef = useRef<number | null>(null)

  // Handle auto-play functionality
  useEffect(() => {
    if (initialDelay > 0) {
      const initialDelayTimer = setTimeout(() => {
        startTimeRef.current = Date.now()
        setIsPlaying(true)
      }, initialDelay)

      return () => clearTimeout(initialDelayTimer)
    } else {
      startTimeRef.current = Date.now()
    }
  }, [initialDelay])

  useEffect(() => {
    if (!isPlaying || isPaused) {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
      if (frameIdRef.current) {
        cancelAnimationFrame(frameIdRef.current)
      }
      return
    }

    const updateProgress = () => {
      const elapsed = Date.now() - startTimeRef.current
      const newProgress = Math.min((elapsed / interval) * 100, 100)
      setProgress(newProgress)

      if (elapsed >= interval) {
        const nextIndex = (currentIndex + 1) % itemCount
        setCurrentIndex(nextIndex)
        onIndexChange(nextIndex)
        startTimeRef.current = Date.now()
      }

      frameIdRef.current = requestAnimationFrame(updateProgress)
    }

    frameIdRef.current = requestAnimationFrame(updateProgress)

    return () => {
      if (frameIdRef.current) {
        cancelAnimationFrame(frameIdRef.current)
      }
    }
  }, [isPlaying, isPaused, currentIndex, interval, itemCount, onIndexChange])

  const play = () => {
    startTimeRef.current = Date.now() - (progress / 100) * interval
    setIsPlaying(true)
  }

  const pause = () => {
    setIsPlaying(false)
  }

  const goTo = (index: number) => {
    if (index >= 0 && index < itemCount) {
      setCurrentIndex(index)
      onIndexChange(index)
      startTimeRef.current = Date.now()
      setProgress(0)
    }
  }

  const next = () => {
    const nextIndex = (currentIndex + 1) % itemCount
    goTo(nextIndex)
  }

  const prev = () => {
    const prevIndex = (currentIndex - 1 + itemCount) % itemCount
    goTo(prevIndex)
  }

  const handleMouseEnter = () => {
    if (pauseOnHover) {
      setIsPaused(true)
    }
  }

  const handleMouseLeave = () => {
    if (pauseOnHover) {
      setIsPaused(false)
      startTimeRef.current = Date.now() - (progress / 100) * interval
    }
  }

  return {
    currentIndex,
    progress,
    isPlaying,
    play,
    pause,
    goTo,
    next,
    prev,
    handleMouseEnter,
    handleMouseLeave,
  }
}

