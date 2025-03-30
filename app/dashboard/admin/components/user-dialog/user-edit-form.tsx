"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { format } from "date-fns"
import { Loader2, CreditCard, Save, Trash2, UserCog, History, RefreshCw, AlertTriangle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast"
import { USER_TYPES } from "../../users/user-management"

// Define form schema
const userFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  userType: z.string(),
  isAdmin: z.boolean().default(false),
  credits: z.coerce.number().int().min(0, "Credits must be a positive number"),
  creditNote: z.string().optional(),
})

type UserFormValues = z.infer<typeof userFormSchema>

interface UserEditDialogProps {
  userId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function UserEditDialog({ userId, open, onOpenChange, onSuccess }: UserEditDialogProps) {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [activeTab, setActiveTab] = useState("details")
  const [user, setUser] = useState<any>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  // Initialize form
  const form = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      name: "",
      email: "",
      userType: "FREE",
      isAdmin: false,
      credits: 0,
      creditNote: "",
    },
  })

  // Fetch user data
  useEffect(() => {
    const fetchUser = async () => {
      if (!open) return

      setIsLoading(true)
      try {
        const response = await fetch(`/api/users/${userId}`)

        if (!response.ok) {
          throw new Error("Failed to fetch user")
        }

        const userData = await response.json()
        setUser(userData)

        // Reset form with user data
        form.reset({
          name: userData.name || "",
          email: userData.email || "",
          userType: userData.userType || "FREE",
          isAdmin: userData.isAdmin || false,
          credits: userData.credits || 0,
          creditNote: "",
        })
      } catch (error) {
        console.error("Error fetching user:", error)
        toast({
          title: "Error",
          description: "Failed to fetch user details. Please try again.",
          variant: "destructive",
        })
        onOpenChange(false)
      } finally {
        setIsLoading(false)
      }
    }

    fetchUser()
  }, [userId, form, toast, onOpenChange, open])

  // Handle form submission
  const onSubmit = async (data: UserFormValues) => {
    setIsSaving(true)
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          userType: data.userType,
          isAdmin: data.isAdmin,
          credits: data.credits,
          creditNote: data.creditNote,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to update user")
      }

      toast({
        title: "User updated",
        description: "User details have been successfully updated.",
      })

      // Dispatch event to refresh user list
      const event = new CustomEvent("user-changed")
      window.dispatchEvent(event)

      if (onSuccess) {
        onSuccess()
      }

      onOpenChange(false)
    } catch (error) {
      console.error("Error updating user:", error)
      toast({
        title: "Error",
        description: "Failed to update user. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  // Handle user deletion
  const handleDeleteUser = async () => {
    setIsDeleting(true)
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete user")
      }

      toast({
        title: "User deleted",
        description: "The user has been permanently deleted.",
      })

      // Dispatch event to refresh user list
      const event = new CustomEvent("user-changed")
      window.dispatchEvent(event)

      setIsDeleteDialogOpen(false)
      onOpenChange(false)

      if (onSuccess) {
        onSuccess()
      }
    } catch (error) {
      console.error("Error deleting user:", error)
      toast({
        title: "Error",
        description: "Failed to delete user. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  // Handle reset subscription
  const handleResetSubscription = () => {
    // Dispatch reset-subscription event
    const event = new CustomEvent("reset-subscription", {
      detail: { userId },
    })
    window.dispatchEvent(event)
    onOpenChange(false)
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              <UserCog className="h-5 w-5" />
              Edit User
            </DialogTitle>
            <DialogDescription>Update user information, manage subscription, and adjust credits</DialogDescription>
          </DialogHeader>

          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              {user && (
                <div className="space-y-6">
                  <div className="flex flex-col md:flex-row gap-4 items-start">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary text-lg font-semibold">
                        {user.name ? user.name.charAt(0).toUpperCase() : "U"}
                      </div>
                      <div>
                        <h3 className="font-medium">{user.name || "Unnamed User"}</h3>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                    </div>

                    {user.subscription && (
                      <div className="p-3 bg-muted rounded-md w-full md:w-auto">
                        <div className="flex justify-between items-center gap-4">
                          <div>
                            <span className="text-sm font-medium">Subscription</span>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant={user.subscription.status === "active" ? "default" : "outline"}>
                                {user.subscription.status}
                              </Badge>
                              <span className="text-xs text-muted-foreground">Plan: {user.subscription.planId}</span>
                            </div>
                          </div>
                          <Button variant="outline" size="sm" className="h-8" onClick={handleResetSubscription}>
                            <CreditCard className="h-4 w-4 mr-2" />
                            Reset
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>

                  <Separator />

                  <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="details" className="flex items-center gap-2">
                        <UserCog className="h-4 w-4" />
                        User Details
                      </TabsTrigger>
                      <TabsTrigger value="credits" className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4" />
                        Credits & History
                      </TabsTrigger>
                    </TabsList>

                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
                        <TabsContent value="details" className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                              control={form.control}
                              name="name"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Name</FormLabel>
                                  <FormControl>
                                    <Input placeholder="User name" {...field} />
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
                                    <Input placeholder="Email address" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                                      {USER_TYPES.map((type) => (
                                        <SelectItem key={type.value} value={type.value}>
                                          {type.label}
                                        </SelectItem>
                                      ))}
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
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 h-[72px]">
                                  <div className="space-y-0.5">
                                    <FormLabel>Administrator</FormLabel>
                                    <FormDescription>Grant admin privileges</FormDescription>
                                  </div>
                                  <FormControl>
                                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                          </div>
                        </TabsContent>

                        <TabsContent value="credits" className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                              control={form.control}
                              name="credits"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Credits</FormLabel>
                                  <div className="flex gap-2">
                                    <FormControl>
                                      <Input type="number" {...field} />
                                    </FormControl>
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="icon"
                                      onClick={() => {
                                        const currentCredits = form.getValues("credits")
                                        form.setValue("credits", currentCredits + 10)
                                      }}
                                      className="text-green-600 border-green-200 hover:bg-green-50"
                                    >
                                      <span className="sr-only">Add 10 credits</span>
                                      <RefreshCw className="h-4 w-4" />
                                    </Button>
                                  </div>
                                  <FormDescription>Current credits: {user?.credits || 0}</FormDescription>
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
                                    <Textarea
                                      placeholder="Reason for credit adjustment"
                                      className="resize-none"
                                      {...field}
                                    />
                                  </FormControl>
                                  <FormDescription>Add a note explaining why credits were adjusted</FormDescription>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          {user?.TokenTransaction && user.TokenTransaction.length > 0 ? (
                            <div className="border rounded-md p-3 mt-4">
                              <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                                <History className="h-4 w-4" />
                                Credit History
                              </h4>
                              <div className="space-y-2 max-h-[200px] overflow-y-auto">
                                {user.TokenTransaction.map((transaction: any) => (
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
                          ) : (
                            <div className="border rounded-md p-4 text-center text-muted-foreground">
                              <History className="h-8 w-8 mx-auto mb-2 opacity-50" />
                              <p>No credit history available</p>
                            </div>
                          )}
                        </TabsContent>

                        <DialogFooter className="flex justify-between items-center pt-4">
                          <Button
                            type="button"
                            variant="destructive"
                            onClick={() => setIsDeleteDialogOpen(true)}
                            className="mr-auto"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete User
                          </Button>

                          <div className="flex gap-2">
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                              Cancel
                            </Button>
                            <Button type="submit" disabled={isSaving}>
                              {isSaving ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Saving...
                                </>
                              ) : (
                                <>
                                  <Save className="mr-2 h-4 w-4" />
                                  Save Changes
                                </>
                              )}
                            </Button>
                          </div>
                        </DialogFooter>
                      </form>
                    </Form>
                  </Tabs>
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete User Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Delete User
            </AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the user account and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="bg-destructive/10 p-4 rounded-md my-4">
            <p className="text-sm text-destructive font-medium">The following data will be deleted:</p>
            <ul className="text-sm text-destructive/80 mt-2 list-disc list-inside space-y-1">
              <li>User profile and authentication data</li>
              <li>All subscription information</li>
              <li>Course progress and quiz attempts</li>
              <li>Token transaction history</li>
              <li>Any content created by this user</li>
            </ul>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUser}
              disabled={isDeleting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete User"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

