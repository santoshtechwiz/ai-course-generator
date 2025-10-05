/**
 * Shared Components - Centralized Exports
 * 
 * This file provides a single import point for commonly used shared components.
 * Use these components throughout the app for consistent UX and access control.
 */

// Subscription & Access Control Components
export { default as SubscriptionUpgrade } from './SubscriptionUpgrade'
export { 
  SubscriptionUpgradeModal,
  SubscriptionUpgradePage,
  SubscriptionUpgradeCard 
} from './SubscriptionUpgrade'

export { default as SignInPrompt } from './SignInPrompt'
export {
  SignInPromptModal,
  SignInPromptPage,
  SignInPromptCard
} from './SignInPrompt'

export { default as FeatureGate, useFeatureGate } from './FeatureGate'

// Re-export types for convenience
export type {
  FeatureType,
  AccessDenialReason,
  FeatureAccess
} from '@/hooks/useFeatureAccess'
