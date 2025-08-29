"use client"

import { useState, useEffect, useCallback } from "react"

interface AIModalState {
  shouldShow: boolean
  lastShown: number | null
  showCount: number
  dismissed: boolean
  userPreference: 'never' | 'less' | 'normal' | null
  engagementScore: number // Track user engagement (0-100)
  lastEngagementCheck: number | null
}

interface UseAIModalOptions {
  minTimeBetweenShows?: number // milliseconds
  maxShowsPerSession?: number
  maxShowsPerDay?: number
  triggerEvents?: string[]
}

const STORAGE_KEY = 'ai-quiz-modal-state'
const SESSION_KEY = 'ai-quiz-modal-session'

export function useAIModal(options: UseAIModalOptions = {}) {
  const {
    minTimeBetweenShows = 24 * 60 * 60 * 1000, // 24 hours
    maxShowsPerSession = 2,
    maxShowsPerDay = 3,
    triggerEvents = ['search', 'filter', 'browse']
  } = options

  const [modalState, setModalState] = useState<AIModalState>({
    shouldShow: false,
    lastShown: null,
    showCount: 0,
    dismissed: false,
    userPreference: null,
    engagementScore: 50, // Start with neutral engagement
    lastEngagementCheck: null
  })

  const [sessionShows, setSessionShows] = useState(0)
  const [todayShows, setTodayShows] = useState(0)

  // Load state from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      const session = sessionStorage.getItem(SESSION_KEY)

      if (stored) {
        const parsed = JSON.parse(stored)
        setModalState(parsed)
      }

      if (session) {
        const sessionData = JSON.parse(session)
        setSessionShows(sessionData.shows || 0)
        setTodayShows(sessionData.todayShows || 0)
      }
    } catch (error) {
      console.warn('Failed to load AI modal state:', error)
    }
  }, [])

  // Save state to localStorage
  const saveState = useCallback((newState: Partial<AIModalState>) => {
    try {
      const updated = { ...modalState, ...newState }
      setModalState(updated)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
    } catch (error) {
      console.warn('Failed to save AI modal state:', error)
    }
  }, [modalState])

  // Save session data
  const saveSessionData = useCallback((shows: number, todayShows: number) => {
    try {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify({
        shows,
        todayShows,
        date: new Date().toDateString()
      }))
    } catch (error) {
      console.warn('Failed to save session data:', error)
    }
  }, [])

  // Track user engagement patterns
  const trackEngagement = useCallback((action: 'search' | 'filter' | 'browse' | 'create' | 'dismiss') => {
    const now = Date.now()
    let scoreChange = 0

    switch (action) {
      case 'search':
        scoreChange = 5 // Searching shows interest
        break
      case 'filter':
        scoreChange = 3 // Filtering shows engagement
        break
      case 'browse':
        scoreChange = 2 // Browsing shows mild interest
        break
      case 'create':
        scoreChange = 10 // Creating content shows high engagement
        break
      case 'dismiss':
        scoreChange = -5 // Dismissing reduces engagement
        break
    }

    setModalState(prev => {
      const newScore = Math.max(0, Math.min(100, prev.engagementScore + scoreChange))
      const updated = {
        ...prev,
        engagementScore: newScore,
        lastEngagementCheck: now
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
      return updated
    })
  }, [])

  // Check if modal should be shown based on adaptive logic
  const shouldShowModal = useCallback((triggerType?: string): boolean => {
    const now = Date.now()
    const today = new Date().toDateString()

    // Check user preference
    if (modalState.userPreference === 'never') return false
    if (modalState.dismissed && modalState.userPreference === 'less') {
      // For 'less' preference, only show after longer intervals
      if (modalState.lastShown && (now - modalState.lastShown) < minTimeBetweenShows * 2) {
        return false
      }
    }

    // Check time constraints
    if (modalState.lastShown && (now - modalState.lastShown) < minTimeBetweenShows) {
      return false
    }

    // Check session limits
    if (sessionShows >= maxShowsPerSession) return false

    // Check daily limits
    if (todayShows >= maxShowsPerDay) return false

    // Check if trigger type is relevant
    if (triggerType && !triggerEvents.includes(triggerType)) return false

    // Adaptive logic based on user behavior and engagement
    const timeSinceLastShow = modalState.lastShown ? now - modalState.lastShown : Infinity
    const engagementMultiplier = modalState.engagementScore / 50 // 0.5 to 2.0

    // Show more frequently for highly engaged users, less for disengaged users
    if (modalState.engagementScore > 70) {
      // Highly engaged - show more often
      if (timeSinceLastShow > minTimeBetweenShows * 0.5) {
        return Math.random() < 0.6 * engagementMultiplier
      }
    } else if (modalState.engagementScore < 30) {
      // Disengaged - show less often
      if (timeSinceLastShow > minTimeBetweenShows * 2) {
        return Math.random() < 0.2 / engagementMultiplier
      }
    } else {
      // Normal engagement - use standard logic
      if (modalState.showCount === 0) return true
      if (modalState.showCount < 3) return Math.random() < 0.7
      if (timeSinceLastShow > 7 * 24 * 60 * 60 * 1000) return Math.random() < 0.5
      if (timeSinceLastShow > 3 * 24 * 60 * 60 * 1000) return Math.random() < 0.3
      return Math.random() < 0.1
    }

    return false
  }, [modalState, sessionShows, todayShows, minTimeBetweenShows, maxShowsPerSession, maxShowsPerDay, triggerEvents])

  // Show modal with trigger tracking
  const showModal = useCallback((triggerType?: string) => {
    if (shouldShowModal(triggerType)) {
      const now = Date.now()
      const today = new Date().toDateString()

      // Update state
      saveState({
        shouldShow: true,
        lastShown: now,
        showCount: modalState.showCount + 1
      })

      // Update session counters
      const newSessionShows = sessionShows + 1
      const newTodayShows = todayShows + 1
      setSessionShows(newSessionShows)
      setTodayShows(newTodayShows)
      saveSessionData(newSessionShows, newTodayShows)

      return true
    }
    return false
  }, [shouldShowModal, modalState.showCount, sessionShows, todayShows, saveState, saveSessionData])

  // Hide modal
  const hideModal = useCallback(() => {
    setModalState(prev => ({ ...prev, shouldShow: false }))
  }, [])

  // Dismiss modal with user preference
  const dismissModal = useCallback((preference?: 'never' | 'less' | 'normal') => {
    const now = Date.now()
    const updatedState = {
      dismissed: preference === 'never',
      userPreference: preference || modalState.userPreference,
      shouldShow: false,
      lastShown: now // Update last shown time to respect timing constraints
    }

    saveState(updatedState)

    // If preference is 'never', also clear session data
    if (preference === 'never') {
      setSessionShows(0)
      setTodayShows(0)
      sessionStorage.removeItem(SESSION_KEY)
    }
  }, [modalState.userPreference, saveState])

  // Reset modal state (for testing or admin purposes)
  const resetModal = useCallback(() => {
    const resetState: AIModalState = {
      shouldShow: false,
      lastShown: null,
      showCount: 0,
      dismissed: false,
      userPreference: null,
      engagementScore: 50, // Start with neutral engagement
      lastEngagementCheck: null
    }
    setModalState(resetState)
    setSessionShows(0)
    setTodayShows(0)
    localStorage.removeItem(STORAGE_KEY)
    sessionStorage.removeItem(SESSION_KEY)
  }, [])

  return {
    shouldShow: modalState.shouldShow,
    showModal,
    hideModal,
    dismissModal,
    resetModal,
    trackEngagement,
    modalState: {
      ...modalState,
      sessionShows,
      todayShows
    }
  }
}
