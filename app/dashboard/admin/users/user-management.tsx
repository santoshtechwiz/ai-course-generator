"use client"

import React, { useState, useCallback, useMemo, useRef } from "react"
import { AgGridReact } from "ag-grid-react"
import "ag-grid-community/styles/ag-grid.css"
import "ag-grid-community/styles/ag-theme-alpine.css"
import { Search, Plus, User, RefreshCw, Shield, MoreHorizontal, Edit, Trash, RotateCcw } from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ColDef } from "ag-grid-community"
import { CreateUserDialog } from "../components/user-dialog/create-user-dialog"
import { UserEditDialog } from "../components/user-dialog/user-edit-dialog"
import { ResetSubscriptionDialog } from "../components/subscription-management/reset-subscription-dialog"

// Type definitions
type UserType = "FREE" | "BASIC" | "PRO" | "PREMIUM" | "ULTIMATE"

interface User {
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

// Cell Renderers
const UserCellRenderer = ({ value, data }: { value: string, data: User }) => (
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

const TypeCellRenderer = ({ value }: { value: UserType }) => {
  const userType = USER_TYPES.find((type) => type.value === value) || USER_TYPES[0]
  return (
    <Badge variant="outline" className="font-normal">
      {userType.label}
    </Badge>
  )
}

const CreditsCellRenderer = ({ value }: { value: number }) => (
  <div className="text-center font-medium">{value?.toLocaleString() || "0"}</div>
)

const DateCellRenderer = ({ value }: { value: string }) => {
  if (!value) return <div className="text-sm text-muted-foreground">-</div>
  
  const date = new Date(value)
  const formattedDate = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date)

  return <div className="text-sm text-muted-foreground">{formattedDate}</div>
}

const ActionsCellRenderer = ({ data, onEdit, onReset }: { 
  data: User, 
  onEdit: (id: string) => void,
  onReset: (id: string) => void 
}) => (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button variant="ghost" className="h-8 w-8 p-0">
        <span className="sr-only">Open menu</span>
        <MoreHorizontal className="h-4 w-4" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end">
      <DropdownMenuLabel>Actions</DropdownMenuLabel>
      <DropdownMenuItem onClick={() => onEdit(data.id)}>
        <Edit className="mr-2 h-4 w-4" />
        Edit user
      </DropdownMenuItem>
      <DropdownMenuItem onClick={() => onReset(data.id)}>
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

// Loading and Error States
const LoadingSkeleton = () => (
  <div className="space-y-3 p-4">
    {Array(5).fill(0).map((_, i) => (
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
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
  const gridRef = useRef<AgGridReact<User>>(null)
  
  // State
  const [searchQuery, setSearchQuery] = useState("")
  const [userTypeFilter, setUserTypeFilter] = useState<UserType[]>([])
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [editingUserId, setEditingUserId] = useState<string | null>(null)
  const [resettingUserId, setResettingUserId] = useState<string | null>(null)

  // Fetch users
  const { data, isLoading, isError, refetch } = useQuery<{ users: User[], totalCount: number }>({
    queryKey: ["users"],
    queryFn: async () => {
      const response = await fetch("/api/users")
      if (!response.ok) throw new Error("Failed to fetch users")
      return response.json()
    }
  })

  const users = data?.users || []
  const totalCount = data?.totalCount || 0

  // Filter users based on search and type filters
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const matchesSearch = searchQuery === "" || 
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        user.email.toLowerCase().includes(searchQuery.toLowerCase())
      
      const matchesType = userTypeFilter.length === 0 || 
        userTypeFilter.includes(user.userType)
      
      return matchesSearch && matchesType
    })
  }, [users, searchQuery, userTypeFilter])

  // Handlers
  const handleEdit = useCallback((userId: string) => {
    setEditingUserId(userId)
  }, [])

  const handleReset = useCallback((userId: string) => {
    setResettingUserId(userId)
  }, [])

  const toggleUserTypeFilter = useCallback((type: UserType) => {
    setUserTypeFilter(prev => 
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    )
  }, [])

  const resetFilters = useCallback(() => {
    setUserTypeFilter([])
    setSearchQuery("")
  }, [])

  // AG Grid configuration
  const columnDefs = useMemo<ColDef<User>[]>(() => [
    {
      field: "name",
      headerName: "User",
      cellRenderer: UserCellRenderer,
      sortable: true,
      filter: true,
      minWidth: 200,
      flex: 2,
    },
    {
      field: "userType",
      headerName: "Type",
      cellRenderer: TypeCellRenderer,
      sortable: true,
      filter: true,
      minWidth: 120,
      flex: 1,
    },
    {
      field: "credits",
      headerName: "Credits",
      cellRenderer: CreditsCellRenderer,
      sortable: true,
      filter: "agNumberColumnFilter",
      minWidth: 100,
      flex: 1,
    },
    {
      field: "lastActive",
      headerName: "Last Active",
      cellRenderer: DateCellRenderer,
      sortable: true,
      filter: "agDateColumnFilter",
      minWidth: 150,
      flex: 1.5,
    },
    {
      headerName: "Actions",
      cellRenderer: (params: any) => (
        <ActionsCellRenderer 
          data={params.data} 
          onEdit={handleEdit}
          onReset={handleReset}
        />
      ),
      sortable: false,
      filter: false,
      width: 100,
      pinned: "right",
    },
  ], [handleEdit, handleReset])

  const defaultColDef = useMemo(() => ({
    sortable: true,
    filter: true,
    resizable: true,
    suppressMovable: true,
  }), [])

  // Render content based on state
  const renderContent = () => {
    if (isLoading) return <LoadingSkeleton />
    if (isError) return <ErrorMessage onRetry={refetch} />
    if (!filteredUsers.length) return <EmptyState onCreate={() => setIsCreateDialogOpen(true)} />
    
    return (
      <div className="ag-theme-alpine" style={{ height: '500px', width: '100%' }}>
        <AgGridReact
          ref={gridRef}
          rowData={filteredUsers}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          pagination={true}
          paginationPageSize={10}
          domLayout='autoHeight'
          suppressCellFocus={true}
          suppressMenuHide={true}
          rowHeight={60}
          headerHeight={48}
          onGridReady={() => gridRef.current?.api?.sizeColumnsToFit()}
        />
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
              <CardDescription>
                Manage user accounts and subscriptions
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetch()}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button
                size="sm"
                onClick={() => setIsCreateDialogOpen(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                New User
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
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
                    <DropdownMenuItem onClick={resetFilters}>
                      Clear filters
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {renderContent()}
        </CardContent>
      </Card>

      {/* Dialogs */}
      <CreateUserDialog 
        open={isCreateDialogOpen} 
        onOpenChange={setIsCreateDialogOpen}
        onSuccess={refetch}
      />
      
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
    </div>
  )
}