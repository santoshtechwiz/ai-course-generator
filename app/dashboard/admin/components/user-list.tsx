"use client"

import { useState, useEffect, useCallback } from "react"
import { Search, UserPlus, Loader2, Filter, Users, UserCheck } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { UserCard } from "./user-card"
import type { User } from "@/app/types/types"
import { useToast } from "@/hooks/use-toast"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"

interface UserListProps {
  filter: "all" | "admin" | "premium"
}

export function UserList({ filter }: UserListProps) {
  const { toast } = useToast()
  const [searchQuery, setSearchQuery] = useState("")
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [activeFilter, setActiveFilter] = useState<string>(filter)
  const [sortBy, setSortBy] = useState<string>("recent")
  const [totalUsers, setTotalUsers] = useState<number>(0)

  // Memoized fetch function to avoid recreating on every render
  const fetchUsers = useCallback(
    async (filter: string, search: string, sort: string) => {
      setLoading(true)
      try {
        const params = new URLSearchParams()
        params.append("filter", filter)
        if (search) {
          params.append("search", search)
        }
        params.append("sort", sort)

        const response = await fetch(`/api/users?${params.toString()}`)
        if (!response.ok) {
          throw new Error("Failed to fetch users")
        }

        const data = await response.json()
        setUsers(data.users || [])
        setTotalUsers(data.total || 0)
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
    },
    [toast],
  )

  // Initial load and filter changes
  useEffect(() => {
    fetchUsers(activeFilter, searchQuery, sortBy)
  }, [activeFilter, sortBy, fetchUsers])

  // Handle search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUsers(activeFilter, searchQuery, sortBy)
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery, activeFilter, sortBy, fetchUsers])

  // Listen for user changes (create, update, delete)
  useEffect(() => {
    const handleUserChange = () => {
      // Refetch users when a user is changed
      fetchUsers(activeFilter, searchQuery, sortBy)
    }

    // Listen for user change events
    window.addEventListener("user-changed", handleUserChange)

    // Clean up
    return () => {
      window.removeEventListener("user-changed", handleUserChange)
    }
  }, [activeFilter, searchQuery, sortBy, fetchUsers])

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

  const handleFilterChange = (value: string) => {
    setActiveFilter(value)
  }

  const handleSortChange = (value: string) => {
    setSortBy(value)
  }

  return (
    <div className="flex flex-col h-full space-y-4">
      <div className="flex flex-col space-y-3">
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

        <div className="flex items-center justify-between gap-2 flex-wrap">
          <Tabs defaultValue={activeFilter} onValueChange={handleFilterChange} className="w-auto">
            <TabsList className="grid grid-cols-3 w-auto">
              <TabsTrigger value="all" className="px-3 relative">
                <Users className="h-4 w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">All Users</span>
                {totalUsers > 0 && (
                  <Badge
                    variant="secondary"
                    className="ml-1 text-xs py-0 h-5 min-w-5 px-1 absolute -top-2 -right-2 sm:static sm:ml-2"
                  >
                    {totalUsers}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="premium" className="px-3">
                <UserCheck className="h-4 w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Premium</span>
              </TabsTrigger>
              <TabsTrigger value="admin" className="px-3">
                <svg
                  className="h-4 w-4 mr-1 sm:mr-2"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
                <span className="hidden sm:inline">Admins</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex items-center gap-2">
            <div className="flex items-center">
              <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
              <Select value={sortBy} onValueChange={handleSortChange}>
                <SelectTrigger className="w-[140px] h-9">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Sort by</SelectLabel>
                    <SelectItem value="recent">Recently Active</SelectItem>
                    <SelectItem value="name">Name (A-Z)</SelectItem>
                    <SelectItem value="credits">Credits (High-Low)</SelectItem>
                    <SelectItem value="created">Sign-up Date</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
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
                  <p className="text-xs text-muted-foreground mt-1">Try adjusting your search or filters</p>
                </div>
              </div>
            )}
          </div>
        )}
      </ScrollArea>
    </div>
  )
}

