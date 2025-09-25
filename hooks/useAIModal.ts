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

    // Check user preference - respect user choice
    if (modalState.userPreference === 'never') return false
    if (modalState.dismissed && modalState.userPreference === 'less') {
      // For 'less' preference, only show after much longer intervals
      if (modalState.lastShown && (now - modalState.lastShown) < minTimeBetweenShows * 4) {
        return false
      }
    }

    // Only show modal when users are having difficulty or need assistance
    // Don't show for regular browsing/searching
    const validTriggers = ['no_results', 'repeated_search', 'low_engagement', 'first_visit']
    if (triggerType && !validTriggers.includes(triggerType)) {
      return false
    }

    // Check time constraints - much longer intervals
    if (modalState.lastShown && (now - modalState.lastShown) < minTimeBetweenShows * 7) { // 7 days minimum
      return false
    }

    // Check session limits - very restrictive
    if (sessionShows >= 1) return false // Max 1 per session

    // Check daily limits - very restrictive
    if (todayShows >= 1) return false // Max 1 per day

    // Only show for users who might actually need help
    if (modalState.engagementScore < 20) {
      // Very disengaged users - might need encouragement
      return Math.random() < 0.3
    }

    // Only show on first visit or when explicitly triggered by difficulty
    if (modalState.showCount === 0 && triggerType === 'first_visit') {
      return Math.random() < 0.4
    }

    // Don't show for regular users
    return false
  }, [modalState, sessionShows, todayShows, minTimeBetweenShows, maxShowsPerSession, maxShowsPerDay])

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
