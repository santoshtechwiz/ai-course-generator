// Types for users API route
export interface UserQueryParams {
  page?: string
  limit?: string
  search?: string
  userTypes?: string[]
  sortField?: string
  sortOrder?: string
}

export interface UserResponse {
  id: string
  name: string
  email: string
  userType: string
  credits: number
  lastActive: string
  avatarUrl?: string | null
}

export interface UsersListResponse {
  users: UserResponse[]
  totalCount: number
  hasMore: boolean
  page: number
  limit: number
}

export interface CreateUserRequest {
  name: string
  email: string
  credits?: number
  isAdmin?: boolean
  userType?: string
}

export interface CreateUserResponse {
  id: string
  name: string | null
  email: string | null
  credits: number
  isAdmin: boolean
  userType: string
}