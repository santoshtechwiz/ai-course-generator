"use client"

import { createContext, useContext, useState, useCallback, type ReactNode } from "react"
import type { UserWithTransactions } from "@/app/types/types"
import { useToast } from "@/hooks/use-toast"

interface UserManagementContextType {
  selectedUser: UserWithTransactions | null
  setSelectedUser: (user: UserWithTransactions | null) => void
  isLoading: boolean
  setIsLoading: (loading: boolean) => void
  fetchUser: (userId: string) => Promise<UserWithTransactions | null>
  refreshUsers: () => void
  isSaving: boolean
  setIsSaving: (saving: boolean) => void
}

const UserManagementContext = createContext<UserManagementContextType | undefined>(undefined)

export function UserManagementProvider({ children }: { children: ReactNode }) {
  const [selectedUser, setSelectedUser] = useState<UserWithTransactions | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const { toast } = useToast()

  const fetchUser = useCallback(
    async (userId: string): Promise<UserWithTransactions | null> => {
      setIsLoading(true)
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 10000)

        const response = await fetch(`/api/users/${userId}`, {
          signal: controller.signal,
        })

        clearTimeout(timeoutId)

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: "Failed to fetch user data" }))
          throw new Error(errorData.error || `Error ${response.status}: Failed to fetch user data`)
        }

        const userData = await response.json()
        return userData
      } catch (error) {
        console.error("Error fetching user:", error)
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to load user details",
          variant: "destructive",
        })
        return null
      } finally {
        setIsLoading(false)
      }
    },
    [toast],
  )

  const refreshUsers = useCallback(() => {
    // Dispatch event to refresh user list
    const event = new CustomEvent("user-changed")
    window.dispatchEvent(event)
  }, [])

  return (
    <UserManagementContext.Provider
      value={{
        selectedUser,
        setSelectedUser,
        isLoading,
        setIsLoading,
        fetchUser,
        refreshUsers,
        isSaving,
        setIsSaving,
      }}
    >
      {children}
    </UserManagementContext.Provider>
  )
}

export function useUserManagement() {
  const context = useContext(UserManagementContext)
  if (context === undefined) {
    throw new Error("useUserManagement must be used within a UserManagementProvider")
  }
  return context
}

