"use client"

import { useState, useEffect } from "react"
import { Search, UserPlus, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { UserCard } from "./user-card"
import { User } from "@/app/types/types"
import { useToast } from "@/hooks/use-toast"


interface UserListProps {
  filter: "all" | "admin" | "premium"
}

export function UserList({ filter }: UserListProps) {
  const { toast } = useToast()
  const [searchQuery, setSearchQuery] = useState("")
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)

  // Fetch users based on filter and search
  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true)
      try {
        const params = new URLSearchParams()
        params.append("filter", filter)
        if (searchQuery) {
          params.append("search", searchQuery)
        }

        const response = await fetch(`/api/users?${params.toString()}`)
        if (!response.ok) {
          throw new Error("Failed to fetch users")
        }

        const data = await response.json()
        setUsers(data.users)
      } catch (error) {
        console.error("Error fetching users:", error)
        toast({
          title: "Error",
          description: "Failed to load users. Please try again.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    // Debounce search
    const timer = setTimeout(() => {
      fetchUsers()
    }, 300)

    return () => clearTimeout(timer)
  }, [filter, searchQuery, toast])

  // Listen for user changes (create, update, delete)
  useEffect(() => {
    const handleUserChange = () => {
      // Refetch users when a user is changed
      const fetchUsers = async () => {
        try {
          const params = new URLSearchParams()
          params.append("filter", filter)
          if (searchQuery) {
            params.append("search", searchQuery)
          }

          const response = await fetch(`/api/users?${params.toString()}`)
          if (!response.ok) {
            throw new Error("Failed to fetch users")
          }

          const data = await response.json()
          setUsers(data.users)
        } catch (error) {
          console.error("Error fetching users:", error)
        }
      }

      fetchUsers()
    }

    // Listen for user change events
    window.addEventListener("user-changed", handleUserChange)

    // Clean up
    return () => {
      window.removeEventListener("user-changed", handleUserChange)
    }
  }, [filter, searchQuery])

  const handleCreateUser = () => {
    setSelectedUserId(null)
    // Signal to the form that we want to create a new user
    const event = new CustomEvent("create-user")
    window.dispatchEvent(event)
  }

  const handleSelectUser = (userId: string) => {
    setSelectedUserId(userId)
    // Signal to the form that we want to edit this user
    const event = new CustomEvent("edit-user", { detail: { userId } })
    window.dispatchEvent(event)
  }

  return (
    <div className="flex flex-col h-full space-y-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search users..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button size="sm" className="flex items-center gap-1" onClick={handleCreateUser}>
          <UserPlus className="h-4 w-4" />
          <span className="hidden sm:inline">Add User</span>
        </Button>
      </div>

      <ScrollArea className="h-[calc(100vh-280px)]">
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-2 pr-3">
            {users.length > 0 ? (
              users.map((user) => (
                <UserCard
                  key={user.id}
                  user={user}
                  isSelected={user.id === selectedUserId}
                  onSelect={() => handleSelectUser(user.id)}
                />
              ))
            ) : (
              <div className="flex h-[150px] items-center justify-center rounded-md border border-dashed">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">No users found</p>
                </div>
              </div>
            )}
          </div>
        )}
      </ScrollArea>
    </div>
  )
}

