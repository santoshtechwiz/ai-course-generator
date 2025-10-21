"use client"

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/**
 * Session Context Store
 * 
 * Tracks user journey, intended actions, and engagement signals
 * for contextual authentication and upgrade prompts
 */

export type ActionType = 
  | 'create_quiz'
  | 'create_course'
  | 'save_progress'
  | 'enroll_course'
  | 'generate_pdf'
  | 'save_bookmark'
  | 'access_analytics'
  | null

interface IntendedAction {
  type: ActionType
  context: Record<string, any>
  timestamp: number
  returnUrl: string
  description: string // Human-readable description for welcome message
}

interface EngagementSignals {
  pagesViewed: number
  timeOnSite: number // in seconds
  featuresExplored: string[]
  lastActivity: number
  sessionsCount: number
  achievementsMet: string[] // e.g., 'first_quiz_created', 'high_score'
}

interface CreditWarning {
  shown: boolean
  threshold: number // 80, 90, 100
  timestamp: number
}

interface SessionContextState {
  // Intended action before auth
  intendedAction: IntendedAction | null
  
  // Engagement tracking
  engagementSignals: EngagementSignals
  
  // Credit warnings tracking (prevent spam)
  creditWarnings: Record<number, CreditWarning>
  
  // Upgrade prompt tracking (prevent spam)
  lastUpgradePrompt: number | null
  upgradePromptsShown: number
  
  // Actions
  setIntendedAction: (action: IntendedAction | null) => void
  clearIntendedAction: () => void
  getIntendedAction: () => IntendedAction | null
  
  trackPageView: (page: string) => void
  trackFeatureExploration: (feature: string) => void
  trackAchievement: (achievement: string) => void
  updateTimeOnSite: (seconds: number) => void
  
  shouldShowCreditWarning: (threshold: number) => boolean
  markCreditWarningShown: (threshold: number) => void
  
  shouldShowUpgradePrompt: () => boolean
  markUpgradePromptShown: () => void
  
  resetSession: () => void
}

const initialEngagement: EngagementSignals = {
  pagesViewed: 0,
  timeOnSite: 0,
  featuresExplored: [],
  lastActivity: Date.now(),
  sessionsCount: 1,
  achievementsMet: []
}

export const useSessionContext = create<SessionContextState>()(
  persist(
    (set, get) => ({
      intendedAction: null,
      engagementSignals: initialEngagement,
      creditWarnings: {},
      lastUpgradePrompt: null,
      upgradePromptsShown: 0,

      setIntendedAction: (action) => {
        // Only store if within reasonable time window (10 minutes)
        if (action && Date.now() - action.timestamp > 600000) {
          return
        }
        set({ intendedAction: action })
      },

      clearIntendedAction: () => {
        set({ intendedAction: null })
      },

      getIntendedAction: () => {
        const action = get().intendedAction
        // Return only if still valid (within 10 minutes)
        if (action && Date.now() - action.timestamp < 600000) {
          return action
        }
        return null
      },

      trackPageView: (page) => {
        set((state) => ({
          engagementSignals: {
            ...state.engagementSignals,
            pagesViewed: state.engagementSignals.pagesViewed + 1,
            lastActivity: Date.now()
          }
        }))
      },

      trackFeatureExploration: (feature) => {
        set((state) => {
          const explored = new Set(state.engagementSignals.featuresExplored)
          explored.add(feature)
          return {
            engagementSignals: {
              ...state.engagementSignals,
              featuresExplored: Array.from(explored),
              lastActivity: Date.now()
            }
          }
        })
      },

      trackAchievement: (achievement) => {
        set((state) => {
          const achievements = new Set(state.engagementSignals.achievementsMet)
          achievements.add(achievement)
          return {
            engagementSignals: {
              ...state.engagementSignals,
              achievementsMet: Array.from(achievements),
              lastActivity: Date.now()
            }
          }
        })
      },

      updateTimeOnSite: (seconds) => {
        set((state) => ({
          engagementSignals: {
            ...state.engagementSignals,
            timeOnSite: state.engagementSignals.timeOnSite + seconds,
            lastActivity: Date.now()
          }
        }))
      },

      shouldShowCreditWarning: (threshold) => {
        const warning = get().creditWarnings[threshold]
        if (!warning) return true
        
        // Don't show same warning within 24 hours
        const hoursSinceLastWarning = (Date.now() - warning.timestamp) / (1000 * 60 * 60)
        return hoursSinceLastWarning > 24
      },

      markCreditWarningShown: (threshold) => {
        set((state) => ({
          creditWarnings: {
            ...state.creditWarnings,
            [threshold]: {
              shown: true,
              threshold,
              timestamp: Date.now()
            }
          }
        }))
      },

      shouldShowUpgradePrompt: () => {
        const state = get()
        
        // Max 3 upgrade prompts per session
        if (state.upgradePromptsShown >= 3) return false
        
        // Don't show within 5 minutes of last prompt
        if (state.lastUpgradePrompt) {
          const minutesSinceLastPrompt = (Date.now() - state.lastUpgradePrompt) / (1000 * 60)
          if (minutesSinceLastPrompt < 5) return false
        }
        
        return true
      },

      markUpgradePromptShown: () => {
        set((state) => ({
          lastUpgradePrompt: Date.now(),
          upgradePromptsShown: state.upgradePromptsShown + 1
        }))
      },

      resetSession: () => {
        set({
          intendedAction: null,
          engagementSignals: initialEngagement,
          creditWarnings: {},
          lastUpgradePrompt: null,
          upgradePromptsShown: 0
        })
      }
    }),
    {
      name: 'session-context-storage',
      partialize: (state) => ({
        intendedAction: state.intendedAction,
        engagementSignals: state.engagementSignals,
        creditWarnings: state.creditWarnings
      })
    }
  )
)

/**
 * Hook to track time on site automatically
 */
function useTimeTracking() {
  const updateTimeOnSite = useSessionContext((state) => state.updateTimeOnSite)
  
  // Track time every 30 seconds
  if (typeof window !== 'undefined') {
    const interval = setInterval(() => {
      updateTimeOnSite(30)
    }, 30000)
    
    return () => clearInterval(interval)
  }
}
