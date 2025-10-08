/**
 * Auth Components - Centralized Exports
 * 
 * Authentication-related components for contextual prompts and flows
 */

export { ContextualAuthPrompt, useContextualAuth } from './ContextualAuthPrompt'
export { BreadcrumbWelcome } from './BreadcrumbWelcome'

// Re-export types
export type { ActionType } from '@/hooks/useSessionContext'
