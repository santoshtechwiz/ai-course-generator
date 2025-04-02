"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { AgGridReact } from "ag-grid-react"
import "ag-grid-community/styles/ag-grid.css"
import "ag-grid-community/styles/ag-theme-alpine.css" // Add default theme CSS
import { Search, Plus, User, RefreshCw, Shield, MoreHorizontal, Edit, Trash, RotateCcw } from "lucide-react"
import { useQuery } from "@tanstack/react-query"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

import { UserManagementProvider } from "../components/user-management/user-management-context"
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

// Custom cell renderers
const UserCellRenderer = (props) => {
  const { value, data } = props
  return (
    <div className="flex items-center gap-3">
      <Avatar className="h-8 w-8 border">
        <AvatarImage src={data.avatarUrl || ""} alt={value} />
        <AvatarFallback>{value?.charAt(0)?.toUpperCase() || "U"}</AvatarFallback>
      </Avatar>
      <div className="flex flex-col">
        <span className="font-medium text-sm">{value}</span>
        <span className="text-xs text-muted-foreground">{data.email}</span>
      </div>
    </div>
  )
}

const TypeCellRenderer = (props) => {
  const { value } = props
  const userType = USER_TYPES.find((type) => type.value === value) || { value: "FREE", label: "Free" }

  const getBadgeVariant = () => {
    switch (value) {
      case "FREE":
        return "outline"
      case "BASIC":
        return "secondary"
      case "PRO":
        return "default"
      case "PREMIUM":
        return "destructive"
      case "ULTIMATE":
        return "default"
      default:
        return "outline"
    }
  }

  return (
    <Badge variant={getBadgeVariant()} className="font-normal">
      {userType.label}
    </Badge>
  )
}

const CreditsCellRenderer = (props) => {
  const { value } = props
  return <div className="text-center font-medium">{value?.toLocaleString() || "0"}</div>
}

const DateCellRenderer = (props) => {
  const { value } = props
  if (!value) return <div className="text-sm text-muted-foreground">-</div>

  try {
    const date = new Date(value)
    const formattedDate = new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date)

    return <div className="text-sm text-muted-foreground">{formattedDate}</div>
  } catch (error) {
    console.error("Error formatting date:", error)
    return <div className="text-sm text-muted-foreground">Invalid date</div>
  }
}

const ActionsCellRenderer = (props) => {
  const { data, context } = props

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">Open menu</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuItem onClick={() => context.onEditUser(data.id)}>
          <Edit className="mr-2 h-4 w-4" />
          Edit user
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => context.onResetSubscription(data.id)}>
          <RotateCcw className="mr-2 h-4 w-4" />
          Reset subscription
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-destructive focus:text-destructive">
          <Trash className="mr-2 h-4 w-4" />
          Delete user
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// Custom pagination component
const CustomPagination = ({ page, totalPages, onPageChange }) => {
  const pages = Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
    if (totalPages <= 5) return i + 1
    if (page <= 3) return i + 1
    if (page >= totalPages - 2) return totalPages - 4 + i
    return page - 2 + i
  })

  return (
    <div className="flex items-center justify-between px-2 py-4">
      <div className="text-sm text-muted-foreground">
        Page {page} of {totalPages || 1}
      </div>
      <div className="flex gap-1">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(1)}
          disabled={page === 1 || totalPages === 0}
          className="h-8 w-8 p-0"
        >
          <span className="sr-only">First page</span>
          <span>«</span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1 || totalPages === 0}
          className="h-8 w-8 p-0"
        >
          <span className="sr-only">Previous page</span>
          <span>‹</span>
        </Button>

        {pages.map((p) => (
          <Button
            key={p}
            variant={p === page ? "default" : "outline"}
            size="sm"
            onClick={() => onPageChange(p)}
            className="h-8 w-8 p-0"
          >
            {p}
          </Button>
        ))}

        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages || totalPages === 0}
          className="h-8 w-8 p-0"
        >
          <span className="sr-only">Next page</span>
          <span>›</span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(totalPages)}
          disabled={page === totalPages || totalPages === 0}
          className="h-8 w-8 p-0"
        >
          <span className="sr-only">Last page</span>
          <span>»</span>
        </Button>
      </div>
    </div>
  )
}

export function UserManagement() {
  // UI state
  const { toast } = useToast()
  const [searchQuery, setSearchQuery] = useState("")
  const [userTypeFilter, setUserTypeFilter] = useState<string[]>([])
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState(searchQuery)
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false)
  const [userToReset, setUserToReset] = useState<string | null>(null)
  const [gridApi, setGridApi] = useState(null)
  const [gridColumnApi, setGridColumnApi] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [sortModel, setSortModel] = useState({ colId: "createdAt", sort: "desc" })

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery)
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery])

  // Fetch users with react-query (with pagination)
  const fetchUsers = async () => {
    // Build query parameters
    const params = new URLSearchParams()
    params.append("page", currentPage.toString())
    params.append("limit", pageSize.toString())

    if (debouncedSearchQuery) {
      params.append("search", debouncedSearchQuery)
    }

    if (userTypeFilter.length > 0) {
      userTypeFilter.forEach((type) => {
        params.append("userTypes", type)
      })
    }

    if (sortModel) {
      params.append("sortField", sortModel.colId)
      params.append("sortOrder", sortModel.sort)
    }

    try {
      const response = await fetch(`/api/users?${params.toString()}`)

      if (!response.ok) {
        throw new Error(`Failed to fetch users: ${response.status}`)
      }

      const data = await response.json()

      // Ensure we have a consistent response format
      return {
        users: Array.isArray(data.users) ? data.users : [],
        totalCount: data.totalCount || 0,
        totalPages: Math.ceil((data.totalCount || 0) / pageSize),
      }
    } catch (error) {
      console.error("Error fetching users:", error)
      toast({
        title: "Error fetching users",
        description: "Please try refreshing the page",
        variant: "destructive",
      })
      return { users: [], totalCount: 0, totalPages: 0 }
    }
  }

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ["users", debouncedSearchQuery, userTypeFilter, currentPage, pageSize, sortModel],
    queryFn: fetchUsers,
  })

  const users = data?.users || []
  const totalCount = data?.totalCount || 0
  const totalPages = data?.totalPages || 0

  // Handle user selection
  const handleEditUser = useCallback((userId: string) => {
    setSelectedUserId(userId)
    setIsEditDialogOpen(true)
  }, [])

  const handleResetSubscription = useCallback((userId: string) => {
    setUserToReset(userId)
    setIsResetDialogOpen(true)
  }, [])

  // Toggle user type filter
  const toggleUserTypeFilter = useCallback((type: string) => {
    setUserTypeFilter((prev) => {
      const newFilter = prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
      setCurrentPage(1) // Reset to first page when filter changes
      return newFilter
    })
  }, [])

  // Handle page change
  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page)
  }, [])

  // Listen for user changes (from child components)
  useEffect(() => {
    const handleUserChange = () => {
      refetch()
    }

    const handleResetSubscription = (event: CustomEvent) => {
      if (event.detail && event.detail.userId) {
        handleResetSubscription(event.detail.userId)
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
  }, [refetch, handleEditUser, handleResetSubscription])

  // Handle sort change
  const onSortChanged = useCallback((params) => {
    const sortModel = params.api.getSortModel()[0]
    if (sortModel) {
      setSortModel({ colId: sortModel.colId, sort: sortModel.sort })
      setCurrentPage(1) // Reset to first page when sort changes
    }
  }, [])

  // AG Grid column definitions
  const columnDefs = useMemo(
    () => [
      {
        field: "name",
        headerName: "User",
        flex: 2,
        minWidth: 200,
        cellRenderer: UserCellRenderer,
        sortable: true,
        filter: true,
      },
      {
        field: "userType",
        headerName: "Type",
        flex: 1,
        minWidth: 120,
        cellRenderer: TypeCellRenderer,
        sortable: true,
        filter: true,
      },
      {
        field: "credits",
        headerName: "Credits",
        flex: 1,
        minWidth: 100,
        cellRenderer: CreditsCellRenderer,
        sortable: true,
        filter: "agNumberColumnFilter",
      },
      {
        field: "lastActive",
        headerName: "Last Active",
        flex: 1.5,
        minWidth: 180,
        cellRenderer: DateCellRenderer,
        sortable: true,
        filter: "agDateColumnFilter",
      },
      {
        field: "actions",
        headerName: "Actions",
        width: 100,
        cellRenderer: ActionsCellRenderer,
        sortable: false,
        filter: false,
        pinned: "right",
      },
    ],
    [],
  )

  // AG Grid default column definitions
  const defaultColDef = useMemo(
    () => ({
      sortable: true,
      filter: true,
      resizable: true,
    }),
    [],
  )

  // AG Grid context for cell renderers
  const context = useMemo(
    () => ({
      onEditUser: handleEditUser,
      onResetSubscription: handleResetSubscription,
    }),
    [handleEditUser, handleResetSubscription],
  )

  // AG Grid ready handler
  const onGridReady = useCallback((params) => {
    setGridApi(params.api)
    setGridColumnApi(params.columnApi)

    // Auto-size columns on first load
    setTimeout(() => {
      params.api.sizeColumnsToFit()
    }, 100)
  }, [])

  // For debugging - create sample data if no users are returned
  const sampleUsers = useMemo(() => {
    if (users && users.length > 0) return users

    // Create sample data for testing
    return Array.from({ length: 10 }, (_, i) => ({
      id: `user-${i}`,
      name: `Test User ${i + 1}`,
      email: `user${i + 1}@example.com`,
      userType: USER_TYPES[i % USER_TYPES.length].value,
      credits: (i + 1) * 100,
      lastActive: new Date(Date.now() - i * 86400000).toISOString(),
      avatarUrl: null,
    }))
  }, [users])

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

    if (sampleUsers.length === 0) {
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
      <div className="flex flex-col border rounded-md overflow-hidden">
        {/* Use the standard AG Grid theme class */}
        <div
          className="ag-theme-alpine"
          style={{
            width: "100%",
            height: `${Math.min(sampleUsers.length * 60 + 48, 500)}px`,
            minHeight: "400px",
          }}
        >
          <AgGridReact
            rowData={sampleUsers}
            columnDefs={columnDefs}
            defaultColDef={defaultColDef}
            context={context}
            onGridReady={onGridReady}
            rowHeight={60}
            headerHeight={48}
            animateRows={true}
            rowSelection="single"
            pagination={false}
            paginationPageSize={pageSize}
            suppressPaginationPanel={true}
            domLayout="normal"
            enableCellTextSelection={true}
            suppressRowClickSelection={true}
            onSortChanged={onSortChanged}
          />
        </div>

        {/* Custom pagination */}
        <CustomPagination page={currentPage} totalPages={totalPages || 1} onPageChange={handlePageChange} />
      </div>
    )
  }

  return (
    <UserManagementProvider>
      <div className="space-y-6">
        <Card>
          <CardHeader className="pb-3 bg-gradient-to-r from-background to-muted/30">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
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
                disabled={isFetching}
                className="transition-all duration-200 hover:bg-primary/10"
              >
                <RefreshCw className={cn("h-4 w-4 mr-2", isFetching && "animate-spin")} />
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
                    onChange={(e) => {
                      setSearchQuery(e.target.value)
                      if (e.target.value !== searchQuery) {
                        setCurrentPage(1) // Reset to first page when search changes
                      }
                    }}
                  />
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full sm:w-auto border-muted-foreground/20 transition-all duration-200 hover:bg-primary/5"
                    >
                      <Shield className="h-4 w-4 mr-2 text-muted-foreground/70" />
                      User Type
                      {userTypeFilter.length > 0 && (
                        <Badge variant="secondary" className="ml-2 bg-primary text-primary-foreground">
                          {userTypeFilter.length}
                        </Badge>
                      )}
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
                          onClick={() => {
                            setUserTypeFilter([])
                            setCurrentPage(1) // Reset to first page when clearing filters
                          }}
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

