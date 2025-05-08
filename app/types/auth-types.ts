export interface AuthState {
    isAuthenticated: boolean
    user: User | null
    nonAuthenticatedUser: NonAuthenticatedUser | null
    isLoading: boolean
    error: string | null
    token: string | null
  }
  
  export interface User {
    id: string
    name: string
    email: string
    role: UserRole
    profileImage?: string
    createdAt: string
    updatedAt: string
  }
  
  export interface NonAuthenticatedUser {
    id: string
    sessionId: string
    createdAt: string
  }
  
  export type UserRole = "user" | "admin" | "premium"
  
  export interface LoginCredentials {
    email: string
    password: string
  }
  
  export interface RegisterCredentials {
    name: string
    email: string
    password: string
  }
  
  export interface AuthResponse {
    user: User
    token: string
  }
  
  export interface NonAuthenticatedUserResponse {
    nonAuthenticatedUser: NonAuthenticatedUser
    sessionId: string
  }
  