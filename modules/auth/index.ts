// ============= Auth Module Exports =============

// Providers
export { AuthProvider } from './providers/AuthProvider'

// Primary Hooks (use these!)
export { useAuth, useUser, useAuthStatus } from './hooks'

// Components
export { LoginButton } from './components/LoginButton'
export { LogoutButton } from './components/LogoutButton'
export { AuthButtons } from './components/AuthButtons'


// Types
export type { User } from './providers/AuthProvider'
export type { UnifiedAuthState } from './hooks/useAuth'
