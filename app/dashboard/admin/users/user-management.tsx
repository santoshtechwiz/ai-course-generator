"use client"

import { useState, useEffect, useRef, useCallback, useMemo } from "react"
import {
  Search,
  Plus,
  Loader2,
  User,
  ArrowUpDown,
  ChevronDown,
  Filter,
  RefreshCw,
  UserCog,
  CreditCard,
  Shield,
  Clock,
} from "lucide-react"
import { useInfiniteQuery } from "@tanstack/react-query"
import { useVirtualizer } from "@tanstack/react-virtual"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"

import { UserManagementProvider } from "../components/user-management/user-management-context"
import { UserCard } from "../components/user-card"
import { CreateUserDialog } from "../components/user-dialog/create-user-dialog"
import { UserEditDialog } from "../components/user-dialog/user-edit-dialog"
import { ResetSubscriptionDialog } from "../components/subscription-management/reset-subscription-dialog"

// Define available user types (shared across components)
export const USER_TYPES = [
  { value: "FREE", label: "Free" },
  { value: "BASIC", label: "Basic" },
  { value: "PRO", label: "Pro" },
  { value: "PREMIUM", label: "Premium" },
  { value: "ULTIMATE", label: "Ultimate" },
]

export function UserManagement() {
  // UI state
  const { toast } = useToast()
  const [searchQuery, setSearchQuery] = useState("")
  const [userTypeFilter, setUserTypeFilter] = useState<string[]>([])
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [sortField, setSortField] = useState<"name" | "createdAt" | "userType" | "credits">("createdAt")
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState(searchQuery)
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false)
  const [userToReset, setUserToReset] = useState<string | null>(null)

  // Virtualization container ref
  const parentRef = useRef<HTMLDivElement>(null)

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery)
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery])

  // Fetch users with react-query (infinite pagination)
  const fetchUsers = async ({ pageParam = 1 }) => {
    // Build query parameters
    const params = new URLSearchParams()
    params.append("page", pageParam.toString())
    params.append("limit", "50")

    if (debouncedSearchQuery) {
      params.append("search", debouncedSearchQuery)
    }

    if (userTypeFilter.length > 0) {
      userTypeFilter.forEach((type) => {
        params.append("userTypes", type)
      })
    }

    params.append("sortField", sortField)
    params.append("sortOrder", sortOrder)

    try {
      const response = await fetch(`/api/users?${params.toString()}`)

      if (!response.ok) {
        throw new Error(`Failed to fetch users: ${response.status}`)
      }

      const data = await response.json()

      // Ensure we have a consistent response format
      return {
        users: Array.isArray(data.users) ? data.users : [],
        nextPage: data.hasMore ? pageParam + 1 : undefined,
        totalCount: data.totalCount || 0,
      }
    } catch (error) {
      console.error("Error fetching users:", error)
      toast({
        title: "Error fetching users",
        description: "Please try refreshing the page",
        variant: "destructive",
      })
      return { users: [], nextPage: undefined, totalCount: 0 }
    }
  }

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isError, refetch, isFetching } =
    useInfiniteQuery({
      queryKey: ["users", debouncedSearchQuery, userTypeFilter, sortField, sortOrder],
      queryFn: fetchUsers,
      getNextPageParam: (lastPage) => lastPage.nextPage,
      initialPageParam: 1,
    })

  // Flatten users from all pages for virtualization
  const users = useMemo(() => {
    return data?.pages.flatMap((page) => page.users) || []
  }, [data])

  const totalCount = data?.pages[0]?.totalCount || 0

  // Setup virtualized list
  const rowVirtualizer = useVirtualizer({
    count: users.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 72,
    overscan: 10,
  })

  // Intersection observer for infinite scroll
  const lastItemRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries
        if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage()
        }
      },
      { threshold: 0.5 },
    )

    if (lastItemRef.current) {
      observer.observe(lastItemRef.current)
    }

    return () => {
      if (lastItemRef.current) {
        observer.unobserve(lastItemRef.current)
      }
    }
  }, [fetchNextPage, hasNextPage, isFetchingNextPage])

  // Handle user selection
  const handleEditUser = useCallback((userId: string) => {
    setSelectedUserId(userId)
    setIsEditDialogOpen(true)
  }, [])

  // Toggle user type filter
  const toggleUserTypeFilter = useCallback((type: string) => {
    setUserTypeFilter((prev) => (prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]))
  }, [])

  // Listen for user changes (from child components)
  useEffect(() => {
    const handleUserChange = () => {
      refetch()
    }

    const handleResetSubscription = (event: CustomEvent) => {
      if (event.detail && event.detail.userId) {
        setUserToReset(event.detail.userId)
        setIsResetDialogOpen(true)
      }
    }

    const handleEditUser = (event: CustomEvent) => {
      if (event.detail && event.detail.userId) {
        handleEditUser(event.detail.userId)
      }
    }

    window.addEventListener("user-changed", handleUserChange)
    window.addEventListener("reset-subscription", handleResetSubscription as EventListener)
    window.addEventListener("edit-user", handleEditUser as EventListener)

    return () => {
      window.removeEventListener("user-changed", handleUserChange)
      window.removeEventListener("reset-subscription", handleResetSubscription as EventListener)
      window.removeEventListener("edit-user", handleEditUser as EventListener)
    }
  }, [refetch, handleEditUser])

  // Sort handler
  const handleSort = (field: "name" | "createdAt" | "userType" | "credits") => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"))
    } else {
      setSortField(field)
      setSortOrder("desc") // Default to desc when changing fields
    }
  }

  // Render content based on loading and error states
  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="space-y-3 p-4">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="flex items-center space-x-4">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-[250px]" />
                <Skeleton className="h-4 w-[200px]" />
              </div>
            </div>
          ))}
        </div>
      )
    }

    if (isError) {
      return (
        <div className="flex flex-col items-center justify-center py-12 px-4">
          <div className="text-destructive rounded-full bg-destructive/10 p-3 mb-4 shadow-sm">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-destructive"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <h3 className="text-xl font-medium text-foreground">Failed to load users</h3>
          <p className="text-muted-foreground mt-2 text-center max-w-md">
            There was an error loading the user list. Please try again or contact support if the problem persists.
          </p>
          <Button
            onClick={() => refetch()}
            variant="outline"
            className="mt-4 border-muted-foreground/20 hover:bg-primary/5 transition-all duration-200"
          >
            Try Again
          </Button>
        </div>
      )
    }

    if (users.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-12 px-4">
          <User className="h-12 w-12 text-primary/20 mb-4" />
          <h3 className="text-xl font-medium text-foreground">No users found</h3>
          <p className="text-muted-foreground mt-2 text-center max-w-md">
            {debouncedSearchQuery || userTypeFilter.length > 0
              ? "Try adjusting your search or filters to find what you're looking for."
              : "Get started by creating a new user."}
          </p>
          <Button
            onClick={() => setIsCreateDialogOpen(true)}
            className="mt-4 shadow-sm hover:shadow-md transition-all duration-200"
          >
            <Plus className="h-4 w-4 mr-2" />
            New User
          </Button>
        </div>
      )
    }

    return (
      <div ref={parentRef} className="h-[calc(100vh-320px)] min-h-[400px] overflow-auto border rounded-md bg-card">
        {/* Table header */}
        <div className="sticky top-0 z-10 border-b bg-gradient-to-r from-card to-muted/10 px-4 py-3 grid grid-cols-12 gap-2 shadow-sm">
          <div className="col-span-4 flex items-center">
            <Button
              variant="ghost"
              className="p-1 h-8 hover:bg-primary/5 transition-all duration-200"
              onClick={() => handleSort("name")}
            >
              <UserCog className="mr-2 h-4 w-4 text-primary/70" />
              <span className="font-medium">User</span>
              <ArrowUpDown
                className={cn("ml-1 h-4 w-4", sortField === "name" ? "text-primary" : "text-muted-foreground/30")}
              />
            </Button>
          </div>
          <div className="col-span-2 flex items-center justify-center">
            <Button
              variant="ghost"
              className="p-1 h-8 hover:bg-primary/5 transition-all duration-200"
              onClick={() => handleSort("userType")}
            >
              <Shield className="mr-2 h-4 w-4 text-primary/70" />
              <span className="font-medium">Type</span>
              <ArrowUpDown
                className={cn("ml-1 h-4 w-4", sortField === "userType" ? "text-primary" : "text-muted-foreground/30")}
              />
            </Button>
          </div>
          <div className="col-span-2 flex items-center justify-center">
            <Button
              variant="ghost"
              className="p-1 h-8 hover:bg-primary/5 transition-all duration-200"
              onClick={() => handleSort("credits")}
            >
              <CreditCard className="mr-2 h-4 w-4 text-primary/70" />
              <span className="font-medium">Credits</span>
              <ArrowUpDown
                className={cn("ml-1 h-4 w-4", sortField === "credits" ? "text-primary" : "text-muted-foreground/30")}
              />
            </Button>
          </div>
          <div className="col-span-4 flex items-center justify-end">
            <Clock className="mr-2 h-4 w-4 text-primary/70" />
            <span className="text-xs font-medium text-muted-foreground">Last Active</span>
          </div>
        </div>

        {/* Virtualized user list */}
        <div
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
            width: "100%",
            position: "relative",
          }}
        >
          {rowVirtualizer.getVirtualItems().map((virtualRow) => {
            const user = users[virtualRow.index]
            return (
              <div
                key={user.id}
                className="absolute top-0 left-0 w-full"
                style={{
                  height: `${virtualRow.size}px`,
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              >
                <UserCard user={user} onEdit={() => handleEditUser(user.id)} />
              </div>
            )
          })}
        </div>

        {/* Infinite scroll loading indicator */}
        <div ref={lastItemRef} className="py-4 flex justify-center">
          {isFetchingNextPage && (
            <div className="flex items-center gap-2 bg-muted/30 px-3 py-1.5 rounded-full shadow-sm">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              <span className="text-sm text-muted-foreground">Loading more users...</span>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <UserManagementProvider>
      <div className="space-y-6">
        <Card>
          <CardHeader className="pb-3 bg-gradient-to-r from-background to-muted/30">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl font-bold text-foreground">User Management</CardTitle>
                <CardDescription className="text-muted-foreground/80">
                  Manage user accounts, subscriptions, and credits
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetch()}
                disabled={isFetching && !isFetchingNextPage}
                className="transition-all duration-200 hover:bg-primary/10"
              >
                <RefreshCw className={cn("h-4 w-4 mr-2", isFetching && !isFetchingNextPage && "animate-spin")} />
                Refresh
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                <div className="relative w-full sm:w-[300px]">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground/70" />
                  <Input
                    type="search"
                    placeholder="Search users..."
                    className="pl-8 border-muted-foreground/20 focus-visible:ring-primary/30 transition-all duration-200"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full sm:w-auto border-muted-foreground/20 transition-all duration-200 hover:bg-primary/5"
                    >
                      <Filter className="h-4 w-4 mr-2 text-muted-foreground/70" />
                      Filter
                      {userTypeFilter.length > 0 && (
                        <Badge variant="secondary" className="ml-2 bg-primary text-primary-foreground">
                          {userTypeFilter.length}
                        </Badge>
                      )}
                      <ChevronDown className="h-4 w-4 ml-2 text-muted-foreground/70" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-56">
                    <DropdownMenuLabel>User Type</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {USER_TYPES.map((type) => (
                      <DropdownMenuCheckboxItem
                        key={type.value}
                        checked={userTypeFilter.includes(type.value)}
                        onCheckedChange={() => toggleUserTypeFilter(type.value)}
                      >
                        {type.label}
                      </DropdownMenuCheckboxItem>
                    ))}
                    {userTypeFilter.length > 0 && (
                      <>
                        <DropdownMenuSeparator />
                        <Button
                          variant="ghost"
                          className="w-full h-8 justify-center text-xs"
                          onClick={() => setUserTypeFilter([])}
                        >
                          Clear Filters
                        </Button>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <span className="text-xs text-muted-foreground">
                  {totalCount} user{totalCount !== 1 ? "s" : ""}
                </span>
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  New User
                </Button>
              </div>
            </div>

            {renderContent()}
          </CardContent>
        </Card>
      </div>

      {/* Create user dialog */}
      <CreateUserDialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen} />

      {/* Edit user dialog */}
      {selectedUserId && (
        <UserEditDialog
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          userId={selectedUserId}
          onSuccess={() => {
            refetch()
          }}
        />
      )}

      {/* Reset subscription dialog */}
      {userToReset && (
        <ResetSubscriptionDialog
          open={isResetDialogOpen}
          onOpenChange={setIsResetDialogOpen}
          userId={userToReset}
          onSuccess={() => {
            setUserToReset(null)
            refetch()
          }}
        />
      )}
    </UserManagementProvider>
  )
}

