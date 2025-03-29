"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { format } from "date-fns"
import { Search, Plus, Loader2, CreditCard, User, Calendar, Edit, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"

// Define user form schema
const userFormSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  credits: z.coerce.number().int().min(0),
  isAdmin: z.boolean().default(false),
  userType: z.string(),
  creditNote: z.string().optional(),
  sendWelcomeEmail: z.boolean().default(false),
})

type UserFormValues = z.infer<typeof userFormSchema>

// Define user type
interface UserType {
  id: string
  name: string
  email: string
  credits: number
  isAdmin: boolean
  userType: string
  createdAt: string
  updatedAt: string
  image?: string
  subscription?: {
    id: string
    status: string
    plan: string
    currentPeriodEnd: string
  } | null
  TokenTransaction?: {
    id: string
    amount: number
    type: string
    description: string
    createdAt: string
  }[]
}

export function UserManagement() {
  const { toast } = useToast()
  const [users, setUsers] = useState<UserType[]>([])
  const [filteredUsers, setFilteredUsers] = useState<UserType[]>([])
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [userTypeFilter, setUserTypeFilter] = useState("all")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("details")

  // Initialize form
  const form = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      name: "",
      email: "",
      credits: 3,
      isAdmin: false,
      userType: "Free",
      creditNote: "",
      sendWelcomeEmail: true,
    },
  })

  // Fetch users on component mount
  useEffect(() => {
    fetchUsers()
  }, [])

  // Filter users when search query or filter changes
  useEffect(() => {
    filterUsers()
  }, [users, searchQuery, userTypeFilter])

  // Fetch users from API
  const fetchUsers = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/users")
      if (!response.ok) {
        throw new Error("Failed to fetch users")
      }
      const data = await response.json()
      setUsers(data)
    } catch (error) {
      console.error("Error fetching users:", error)
      toast({
        title: "Error",
        description: "Failed to fetch users. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Filter users based on search query and user type
  const filterUsers = () => {
    let filtered = [...users]

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (user) => user.name?.toLowerCase().includes(query) || user.email?.toLowerCase().includes(query),
      )
    }

    // Apply user type filter
    if (userTypeFilter !== "all") {
      filtered = filtered.filter((user) => user.userType === userTypeFilter)
    }

    setFilteredUsers(filtered)
  }

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
  }

  // Handle user type filter change
  const handleUserTypeFilterChange = (value: string) => {
    setUserTypeFilter(value)
  }

  // Open create user dialog
  const handleCreateUser = () => {
    form.reset({
      name: "",
      email: "",
      credits: 3,
      isAdmin: false,
      userType: "Free",
      creditNote: "",
      sendWelcomeEmail: true,
    })
    setIsCreateDialogOpen(true)
  }

  // Open edit user dialog
  const handleEditUser = async (userId: string) => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/users/${userId}`)
      if (!response.ok) {
        throw new Error("Failed to fetch user")
      }

      const userData = await response.json()
      setSelectedUser(userData)

      form.reset({
        name: userData.name || "",
        email: userData.email || "",
        credits: userData.credits || 0,
        isAdmin: userData.isAdmin || false,
        userType: userData.userType || "Free",
        creditNote: "",
        sendWelcomeEmail: false,
      })

      setActiveTab("details")
      setIsEditDialogOpen(true)
    } catch (error) {
      console.error("Error fetching user:", error)
      toast({
        title: "Error",
        description: "Failed to fetch user details. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Open delete user dialog
  const handleDeleteClick = (user: UserType) => {
    setSelectedUser(user)
    setIsDeleteDialogOpen(true)
  }

  // Create new user
  const handleCreateSubmit = async (data: UserFormValues) => {
    setIsSubmitting(true)
    try {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to create user")
      }

      // Send welcome email if selected
      if (data.sendWelcomeEmail) {
        await fetch("/api/email/send", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            type: "welcome",
            email: data.email,
            name: data.name,
          }),
        })
      }

      toast({
        title: "Success",
        description: "User created successfully.",
      })

      setIsCreateDialogOpen(false)
      fetchUsers()
    } catch (error) {
      console.error("Error creating user:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create user. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Update existing user
  const handleUpdateSubmit = async (data: UserFormValues) => {
    if (!selectedUser) return

    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/users/${selectedUser.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          previousCredits: selectedUser.credits,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to update user")
      }

      toast({
        title: "Success",
        description: "User updated successfully.",
      })

      setIsEditDialogOpen(false)
      fetchUsers()
    } catch (error) {
      console.error("Error updating user:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update user. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Delete user
  const handleDeleteConfirm = async () => {
    if (!selectedUser) return

    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/users/${selectedUser.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to delete user")
      }

      toast({
        title: "Success",
        description: "User deleted successfully.",
      })

      setIsDeleteDialogOpen(false)
      fetchUsers()
    } catch (error) {
      console.error("Error deleting user:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete user. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Filters and actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <div className="relative w-full sm:w-[300px]">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search users..."
              className="pl-8"
              value={searchQuery}
              onChange={handleSearchChange}
            />
          </div>

          <Select value={userTypeFilter} onValueChange={handleUserTypeFilterChange}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Users</SelectItem>
              <SelectItem value="Free">Free</SelectItem>
              <SelectItem value="Premium">Premium</SelectItem>
              <SelectItem value="Pro">Pro</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button onClick={handleCreateUser}>
          <Plus className="h-4 w-4 mr-2" />
          New User
        </Button>
      </div>

      {/* User list */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="text-center py-12 border rounded-lg">
          <User className="h-12 w-12 mx-auto text-muted-foreground/50" />
          <h3 className="mt-4 text-lg font-medium">No users found</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            {searchQuery || userTypeFilter !== "all"
              ? "Try adjusting your search or filters"
              : "Create a new user to get started"}
          </p>
          <Button className="mt-4" onClick={handleCreateUser}>
            <Plus className="h-4 w-4 mr-2" />
            New User
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredUsers.map((user) => (
            <Card key={user.id} className="overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="truncate">{user.name || "Unnamed User"}</CardTitle>
                    <CardDescription className="truncate">{user.email}</CardDescription>
                  </div>
                  <Badge variant={user.isAdmin ? "default" : "outline"}>{user.isAdmin ? "Admin" : user.userType}</Badge>
                </div>
              </CardHeader>

              <CardContent className="pb-2">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center">
                    <CreditCard className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span>{user.credits} credits</span>
                  </div>

                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span>{format(new Date(user.createdAt), "MMM d, yyyy")}</span>
                  </div>

                  {user.subscription && (
                    <>
                      <div className="flex items-center col-span-2">
                        <Badge variant="outline" className="mr-2">
                          {user.subscription.plan}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          Expires: {format(new Date(user.subscription.currentPeriodEnd), "MMM d, yyyy")}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>

              <CardFooter className="flex justify-between pt-2">
                <Button variant="outline" size="sm" onClick={() => handleEditUser(user.id)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
                <Button variant="destructive" size="sm" onClick={() => handleDeleteClick(user)}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Create user dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create New User</DialogTitle>
            <DialogDescription>
              Add a new user to the system. They will be able to log in with these credentials.
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleCreateSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="john@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="userType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>User Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select user type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Free">Free</SelectItem>
                        <SelectItem value="Premium">Premium</SelectItem>
                        <SelectItem value="Pro">Pro</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="credits"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Credits</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isAdmin"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                    <div className="space-y-0.5">
                      <FormLabel>Administrator</FormLabel>
                      <FormDescription>Grant admin privileges to this user</FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="sendWelcomeEmail"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                    <div className="space-y-0.5">
                      <FormLabel>Send Welcome Email</FormLabel>
                      <FormDescription>Send an automated welcome email to the new user</FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create User"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit user dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>Update user information and settings</DialogDescription>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="details">User Details</TabsTrigger>
              <TabsTrigger value="credits">Credits</TabsTrigger>
            </TabsList>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleUpdateSubmit)} className="space-y-4 mt-4">
                <TabsContent value="details" className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input placeholder="John Doe" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input placeholder="john@example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="userType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>User Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select user type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Free">Free</SelectItem>
                            <SelectItem value="Premium">Premium</SelectItem>
                            <SelectItem value="Pro">Pro</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="isAdmin"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                        <div className="space-y-0.5">
                          <FormLabel>Administrator</FormLabel>
                          <FormDescription>Grant admin privileges to this user</FormDescription>
                        </div>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </TabsContent>

                <TabsContent value="credits" className="space-y-4">
                  <FormField
                    control={form.control}
                    name="credits"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Credits</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="creditNote"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Credit Adjustment Note</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Reason for credit adjustment" {...field} />
                        </FormControl>
                        <FormDescription>Add a note explaining why credits were adjusted</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {selectedUser?.TokenTransaction && selectedUser.TokenTransaction.length > 0 && (
                    <div className="border rounded-md p-3 mt-4">
                      <h4 className="font-medium mb-2">Credit History</h4>
                      <div className="space-y-2 max-h-[200px] overflow-y-auto">
                        {selectedUser.TokenTransaction.map((transaction) => (
                          <div key={transaction.id} className="flex justify-between text-sm">
                            <div>
                              <span>{transaction.description || transaction.type}</span>
                              <span className="text-xs text-muted-foreground ml-2">
                                {format(new Date(transaction.createdAt), "MMM dd, yyyy")}
                              </span>
                            </div>
                            <span className={transaction.amount > 0 ? "text-green-600" : "text-red-600"}>
                              {transaction.amount > 0 ? `+${transaction.amount}` : transaction.amount}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </TabsContent>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Save Changes"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Delete user dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this user? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          {selectedUser && (
            <div className="border rounded-md p-4 my-4">
              <div className="font-medium">{selectedUser.name}</div>
              <div className="text-sm text-muted-foreground">{selectedUser.email}</div>
              <div className="mt-2 text-sm">
                <span className="text-muted-foreground">User Type:</span> {selectedUser.userType}
                {selectedUser.isAdmin && <Badge className="ml-2">Admin</Badge>}
              </div>
              <div className="mt-1 text-sm">
                <span className="text-muted-foreground">Credits:</span> {selectedUser.credits}
              </div>
              {selectedUser.subscription && (
                <div className="mt-1 text-sm">
                  <span className="text-muted-foreground">Subscription:</span> {selectedUser.subscription.plan}
                </div>
              )}
            </div>
          )}

          <div className="bg-destructive/10 text-destructive rounded-md p-3 text-sm">
            <p>This will permanently delete the user and all associated data:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>User account and profile</li>
              <li>Subscription information</li>
              <li>Credit history</li>
              <li>Course progress and quiz attempts</li>
              <li>All other user-related data</li>
            </ul>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete User"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

