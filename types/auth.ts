export interface User {
  id: string
  name?: string | null
  email?: string | null
  image?: string | null
}

interface AuthState {
  isAuthenticated: boolean
  user: User | null
  loading: boolean
  error: string | null
}
