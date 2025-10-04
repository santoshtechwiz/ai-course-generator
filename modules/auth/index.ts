// ============= Auth Module Exports =============

// Providers
export { AuthProvider } from './providers/AuthProvider'

// Primary Hooks (use these!)
export { useAuth, useUser, useAuthStatus } from './hooks'

// Components
export { LoginButton } from './components/LoginButton'
export { LogoutButton } from './components/LogoutButton'
export { AuthButtons } from './components/AuthButtons'

// Other hooks
export { useQuizPlan } from './hooks/useQuizPlan'

// Types
export type { User } from './providers/AuthProvider'
export type { UnifiedAuthState } from './hooks/useAuth'
export type { PlanType, QuizPlanData } from './hooks/useQuizPlan'
