"use client"

import { useState, useCallback, useMemo, useEffect } from "react"
import { Search, Plus, User, RefreshCw, Shield, MoreHorizontal, Edit, Trash, RotateCcw, Mail } from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Checkbox } from "@/components/ui/checkbox"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CreateUserDialog } from "../components/user-dialog/create-user-dialog"
import { UserEditDialog } from "../components/user-dialog/user-edit-dialog"
import { ResetSubscriptionDialog } from "../components/subscription-management/reset-subscription-dialog"

import type { UserType } from "@/app/types/types"
import { useRouter } from "next/navigation"

interface UserInterface {
  id: string
  name: string
  email: string
  userType: UserType
  credits: number
  lastActive: string
  avatarUrl: string | null
}

const USER_TYPES = [
  { value: "FREE", label: "Free" },
  { value: "BASIC", label: "Basic" },
  { value: "PRO", label: "Pro" },
  { value: "PREMIUM", label: "Premium" },
  { value: "ULTIMATE", label: "Ultimate" },
] as const

// Loading and Error States
const LoadingSkeleton = () => (
  <div className="space-y-3 p-4">
    {Array(5)
      .fill(0)
      .map((_, i) => (
        <div key={i} className="flex items-center space-x-4">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-[250px]" />
            <Skeleton className="h-4 w-[200px]" />
          </div>
        </div>
      ))}
  </div>
)

const ErrorMessage = ({ onRetry }: { onRetry: () => void }) => (
  <div className="flex flex-col items-center justify-center py-12 px-4">
    <div className="text-destructive rounded-full bg-destructive/10 p-3 mb-4">
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
      >
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
    </div>
    <h3 className="text-xl font-medium">Failed to load users</h3>
    <Button onClick={onRetry} variant="outline" className="mt-4">
      Try Again
    </Button>
  </div>
)

const EmptyState = ({ onCreate }: { onCreate: () => void }) => (
  <div className="flex flex-col items-center justify-center py-12 px-4">
    <User className="h-12 w-12 text-muted-foreground mb-4" />
    <h3 className="text-xl font-medium">No users found</h3>
    <Button onClick={onCreate} className="mt-4">
      <Plus className="h-4 w-4 mr-2" />
      New User
    </Button>
  </div>
)

export const UserManagement = () => {
  const { toast } = useToast()

  // State
  const [searchQuery, setSearchQuery] = useState("")
  const [userTypeFilter, setUserTypeFilter] = useState<UserType[]>([])
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [editingUserId, setEditingUserId] = useState<string | null>(null)
  const [resettingUserId, setResettingUserId] = useState<string | null>(null)
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [activeTab, setActiveTab] = useState("all")
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null)

  // Fetch users
  const { data, isLoading, isError, refetch } = useQuery<{ users: UserInterface[]; totalCount: number }>({
    queryKey: ["users"],
    queryFn: async () => {
      const response = await fetch("/api/users")
      if (!response.ok) throw new Error("Failed to fetch users")
      return response.json()
    },
  })

  const users = data?.users || []
  const totalCount = data?.totalCount || 0

  // Reset selected users when users change
  useEffect(() => {
    setSelectedUsers([])
  }, [userTypeFilter, activeTab])

  // Filter users based on search, type filters, and active tab
  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const matchesSearch =
        searchQuery === "" ||
        user.name?.toLowerCase().includes(searchQuery?.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchQuery?.toLowerCase())

      const matchesType = userTypeFilter.length === 0 || userTypeFilter.includes(user.userType)

      // Filter by tab
      const matchesTab =
        activeTab === "all" ||
        (activeTab === "free" && user.userType === "FREE") ||
        (activeTab === "paid" && user.userType !== "FREE")

      return matchesSearch && matchesType && matchesTab
    })
  }, [users, searchQuery, userTypeFilter, activeTab])

  // Pagination
  const paginatedUsers = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    return filteredUsers.slice(startIndex, startIndex + itemsPerPage)
  }, [filteredUsers, currentPage, itemsPerPage])

  const totalPages = useMemo(() => Math.ceil(filteredUsers.length / itemsPerPage), [filteredUsers.length, itemsPerPage])

  // Handlers
  const handleEdit = useCallback((userId: string) => {
    setEditingUserId(userId)
  }, [])

  const handleReset = useCallback((userId: string) => {
    setResettingUserId(userId)
  }, [])

  const toggleUserTypeFilter = useCallback((type: UserType) => {
    setUserTypeFilter((prev) => (prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]))
  }, [])

  const resetFilters = useCallback(() => {
    setUserTypeFilter([])
    setSearchQuery("")
  }, [])

  const toggleSelectUser = useCallback((userId: string) => {
    setSelectedUsers((prev) => (prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]))
  }, [])

  const toggleSelectAll = useCallback(() => {
    if (selectedUsers.length === paginatedUsers.length) {
      setSelectedUsers([])
    } else {
      setSelectedUsers(paginatedUsers.map((user) => user.id))
    }
  }, [paginatedUsers, selectedUsers.length])

  const router = useRouter()
  const handleSendEmail = useCallback(() => {
    router.push("/admin/email")
  }, [router])

  const getSelectedUsers = useCallback(() => {
    return users.filter((user) => selectedUsers.includes(user.id))
  }, [users, selectedUsers])

  const handleDeleteUser = useCallback(
    async (userId: string) => {
      try {
        const response = await fetch(`/api/admin/delete`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ userId }),
        })

        if (!response.ok) throw new Error("Failed to delete user")

        toast({
          title: "User deleted",
          description: "The user has been successfully deleted.",
        })

        refetch()
        setDeletingUserId(null)
      } catch (error) {
        console.error("Error deleting user:", error)
        toast({
          title: "Error",
          description: "Failed to delete user. Please try again.",
          variant: "destructive",
        })
      }
    },
    [refetch, toast],
  )

  // Add a function to handle bulk deletion
  const handleBulkDelete = useCallback(async () => {
    if (!selectedUsers.length) return

    try {
      const promises = selectedUsers.map((userId) =>
        fetch(`/api/admin/deleteAttachment`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ userId }),
        }),
      )

      await Promise.all(promises)

      toast({
        title: "Users deleted",
        description: `${selectedUsers.length} users have been successfully deleted.`,
      })

      refetch()
      setSelectedUsers([])
    } catch (error) {
      console.error("Error deleting users:", error)
      toast({
        title: "Error",
        description: "Failed to delete some users. Please try again.",
        variant: "destructive",
      })
    }
  }, [selectedUsers, refetch, toast])

  // Render user list
  const renderUserList = () => {
    if (isLoading) return <LoadingSkeleton />
    if (isError) return <ErrorMessage onRetry={refetch} />
    if (!filteredUsers.length) return <EmptyState onCreate={() => setIsCreateDialogOpen(true)} />

    return (
      <div className="space-y-4">
        <div className="border rounded-md overflow-hidden">
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-2 p-3 bg-muted/30 border-b text-sm font-medium">
            <div className="col-span-1 flex items-center justify-center">
              <Checkbox
                checked={selectedUsers.length > 0 && selectedUsers.length === paginatedUsers.length}
                onCheckedChange={toggleSelectAll}
                aria-label="Select all users"
              />
            </div>
            <div className="col-span-5 sm:col-span-4">User</div>
            <div className="col-span-3 sm:col-span-2 hidden sm:block">Type</div>
            <div className="col-span-2 hidden md:block">Credits</div>
            <div className="col-span-2 hidden lg:block">Last Active</div>
            <div className="col-span-3 sm:col-span-1 text-right">Actions</div>
          </div>

          {/* Table Rows */}
          <div className="divide-y">
            {paginatedUsers.map((user) => (
              <div
                key={user.id}
                className="grid grid-cols-12 gap-2 p-3 items-center hover:bg-muted/20 transition-colors"
              >
                <div className="col-span-1 flex items-center justify-center">
                  <Checkbox
                    checked={selectedUsers.includes(user.id)}
                    onCheckedChange={() => toggleSelectUser(user.id)}
                    aria-label={`Select ${user.name}`}
                  />
                </div>
                <div className="col-span-5 sm:col-span-4 flex items-center gap-2">
                  <Avatar className="h-8 w-8 border">
                    <AvatarImage src={user.avatarUrl || ""} alt={user.name} />
                    <AvatarFallback>{user.name?.charAt(0)?.toUpperCase() || "U"}</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col truncate">
                    <span className="font-medium text-sm truncate">{user.name}</span>
                    <span className="text-xs text-muted-foreground truncate">{user.email}</span>
                  </div>
                </div>
                <div className="col-span-3 sm:col-span-2 hidden sm:block">
                  <Badge variant="outline" className="font-normal">
                    {USER_TYPES.find((type) => type.value === user.userType)?.label || "Free"}
                  </Badge>
                </div>
                <div className="col-span-2 hidden md:block text-center font-medium">
                  {user.credits?.toLocaleString() || "0"}
                </div>
                <div className="col-span-2 hidden lg:block text-sm text-muted-foreground">
                  {user.lastActive ? new Date(user.lastActive).toLocaleDateString() : "-"}
                </div>
                <div className="col-span-3 sm:col-span-1 flex justify-end">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => handleEdit(user.id)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit user
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleReset(user.id)}>
                        <RotateCcw className="mr-2 h-4 w-4" />
                        Reset subscription
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => {
                          setSelectedUsers([user.id])
                          setIsEmailDialogOpen(true)
                        }}
                      >
                        <Mail className="mr-2 h-4 w-4" />
                        Send email
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => setDeletingUserId(user.id)}
                      >
                        <Trash className="mr-2 h-4 w-4" />
                        Delete user
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between p-3 border-t">
            <div className="text-sm text-muted-foreground">
              Showing {Math.min(filteredUsers.length, (currentPage - 1) * itemsPerPage + 1)} to{" "}
              {Math.min(filteredUsers.length, currentPage * itemsPerPage)} of {filteredUsers.length} users
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="h-8 w-8 p-0"
              >
                <span className="sr-only">Previous page</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="m15 18-6-6 6-6" />
                </svg>
              </Button>
              <span className="text-sm mx-2">
                Page {currentPage} of {totalPages || 1}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages || totalPages === 0}
                className="h-8 w-8 p-0"
              >
                <span className="sr-only">Next page</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="m9 18 6-6-6-6" />
                </svg>
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row justify-between gap-4">
            <div>
              <CardTitle className="text-2xl">User Management</CardTitle>
              <CardDescription>Manage user accounts and subscriptions</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button size="sm" onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                New User
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="mb-4">
            <TabsList>
              <TabsTrigger value="all">All Users</TabsTrigger>
              <TabsTrigger value="free">Free Users</TabsTrigger>
              <TabsTrigger value="paid">Paid Users</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="mb-4 flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <Shield className="h-4 w-4 mr-2" />
                  User Type
                  {userTypeFilter.length > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {userTypeFilter.length}
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuLabel>Filter by type</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {USER_TYPES.map((type) => (
                  <DropdownMenuCheckboxItem
                    key={type.value}
                    checked={userTypeFilter.includes(type.value as UserType)}
                    onCheckedChange={() => toggleUserTypeFilter(type.value as UserType)}
                  >
                    {type.label}
                  </DropdownMenuCheckboxItem>
                ))}
                {userTypeFilter.length > 0 && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={resetFilters}>Clear filters</DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
            <Select
              value={itemsPerPage.toString()}
              onValueChange={(value) => {
                setItemsPerPage(Number.parseInt(value))
                setCurrentPage(1)
              }}
            >
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="10 per page" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5 per page</SelectItem>
                <SelectItem value="10">10 per page</SelectItem>
                <SelectItem value="20">20 per page</SelectItem>
                <SelectItem value="50">50 per page</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {renderUserList()}
        </CardContent>
        {selectedUsers.length > 0 && (
          <CardFooter className="border-t pt-4 flex justify-between">
            <div className="text-sm">
              <span className="font-medium">{selectedUsers.length}</span> users selected
            </div>
            <div className="flex gap-2">
              <Button variant="destructive" onClick={handleBulkDelete}>
                <Trash className="h-4 w-4 mr-2" />
                Delete Selected
              </Button>
            </div>
          </CardFooter>
        )}
      </Card>

      {/* Dialogs */}
      <CreateUserDialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen} onSuccess={refetch} />

      <UserEditDialog
        open={!!editingUserId}
        onOpenChange={(open) => !open && setEditingUserId(null)}
        userId={editingUserId || ""}
        onSuccess={refetch}
      />

      <ResetSubscriptionDialog
        open={!!resettingUserId}
        onOpenChange={(open) => !open && setResettingUserId(null)}
        userId={resettingUserId || ""}
        onSuccess={refetch}
      />

      {/* Delete Confirmation Dialog */}
      {deletingUserId && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-background border rounded-lg shadow-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-semibold mb-4">Confirm Deletion</h2>
            <p className="mb-6">Are you sure you want to delete this user? This action cannot be undone.</p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDeletingUserId(null)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={() => handleDeleteUser(deletingUserId)}>
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
