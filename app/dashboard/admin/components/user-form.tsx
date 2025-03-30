"use client"

import { useState, useEffect } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Save, Trash2, UserCog, CreditCard, Loader2, History } from "lucide-react"
import { format } from "date-fns"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import type { TokenTransaction, UserWithTransactions } from "@/app/types/types"
import { createUser, deleteUser, updateUser } from "@/app/actions/actions"
import { SubscriptionHistory } from "./subscription-management/subscription-history"

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
})

type UserFormValues = z.infer<typeof userFormSchema>

export function UserForm() {
  const { toast } = useToast()
  const [selectedUser, setSelectedUser] = useState<UserWithTransactions | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("details")
  const [transactions, setTransactions] = useState<TokenTransaction[]>([])

  // Initialize form with selected user data or default values
  const form = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      name: "",
      email: "",
      credits: 3,
      isAdmin: false,
      userType: "Free",
      creditNote: "",
    },
  })

  // Listen for user selection events
  useEffect(() => {
    const handleEditUser = async (event: CustomEvent<{ userId: string }>) => {
      const userId = event.detail.userId
      setIsLoading(true)

      try {
        const response = await fetch(`/api/users/${userId}`)
        if (!response.ok) {
          throw new Error("Failed to fetch user")
        }

        const userData = await response.json()
        setSelectedUser(userData)
        setTransactions(userData.TokenTransaction || [])

        // Reset form with user data
        form.reset({
          name: userData.name || "",
          email: userData.email || "",
          credits: userData.credits,
          isAdmin: userData.isAdmin,
          userType: userData.userType,
          creditNote: "",
        })

        setActiveTab("details")
      } catch (error) {
        console.error("Error fetching user:", error)
        toast({
          title: "Error",
          description: "Failed to load user details. Please try again.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    const handleAdjustCredits = async (event: CustomEvent<{ userId: string }>) => {
      const userId = event.detail.userId
      setIsLoading(true)

      try {
        const response = await fetch(`/api/users/${userId}`)
        if (!response.ok) {
          throw new Error("Failed to fetch user")
        }

        const userData = await response.json()
        setSelectedUser(userData)
        setTransactions(userData.TokenTransaction || [])

        // Reset form with user data
        form.reset({
          name: userData.name || "",
          email: userData.email || "",
          credits: userData.credits,
          isAdmin: userData.isAdmin,
          userType: userData.userType,
          creditNote: "",
        })

        setActiveTab("credits")
      } catch (error) {
        console.error("Error fetching user:", error)
        toast({
          title: "Error",
          description: "Failed to load user details. Please try again.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    const handleCreateUser = () => {
      setSelectedUser(null)
      form.reset({
        name: "",
        email: "",
        credits: 3,
        isAdmin: false,
        userType: "Free",
        creditNote: "",
      })
      setTransactions([])
      setActiveTab("details")
    }

    // Add event listeners
    window.addEventListener("edit-user", handleEditUser as unknown as EventListener)
    window.addEventListener("adjust-credits", handleAdjustCredits as unknown as EventListener)
    window.addEventListener("create-user", handleCreateUser)

    // Clean up
    return () => {
      window.removeEventListener("edit-user", handleEditUser as unknown as EventListener)
      window.removeEventListener("adjust-credits", handleAdjustCredits as unknown as EventListener)
      window.removeEventListener("create-user", handleCreateUser)
    }
  }, [form, toast])

  async function onSubmit(data: UserFormValues) {
    setIsLoading(true)

    try {
      if (selectedUser) {
        // Update existing user using server action
        const result = await updateUser(selectedUser.id, {
          ...data,
          previousCredits: selectedUser.credits,
        })

        if (result.success) {
          toast({
            title: "Success",
            description: "User updated successfully.",
          })

          // Refresh user data
          const response = await fetch(`/api/users/${selectedUser.id}`)
          if (response.ok) {
            const userData = await response.json()
            setSelectedUser(userData)
            setTransactions(userData.TokenTransaction || [])

            // Dispatch event to refresh user list
            const event = new CustomEvent("user-changed")
            window.dispatchEvent(event)
          }
        } else {
          throw new Error(result.error || "Failed to update user")
        }
      } else {
        // Create new user using server action
        const formData = new FormData()
        formData.append("name", data.name)
        formData.append("email", data.email)
        formData.append("credits", data.credits.toString())
        formData.append("isAdmin", data.isAdmin.toString())
        formData.append("userType", data.userType)

        const result = await createUser(formData)

        if (result.success) {
          toast({
            title: "Success",
            description: "User created successfully.",
          })
          form.reset()

          // Dispatch event to refresh user list
          const event = new CustomEvent("user-changed")
          window.dispatchEvent(event)
        } else {
          throw new Error(result.error || "Failed to create user")
        }
      }
    } catch (error) {
      console.error("Error saving user:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save user. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  async function handleDelete() {
    if (!selectedUser) return

    if (
      confirm(
        `Are you sure you want to delete ${selectedUser.name || "this user"}? This will remove all their data including subscriptions, quizzes, and course progress.`,
      )
    ) {
      setIsLoading(true)

      try {
        // Call the server action to delete the user
        const result = await deleteUser(selectedUser.id)

        if (result.success) {
          toast({
            title: "User deleted",
            description: `${selectedUser.name || "User"} has been deleted successfully.`,
          })

          // Reset form
          setSelectedUser(null)
          form.reset({
            name: "",
            email: "",
            credits: 3,
            isAdmin: false,
            userType: "Free",
            creditNote: "",
          })
          setTransactions([])

          // Dispatch event to refresh user list
          const event = new CustomEvent("user-changed")
          window.dispatchEvent(event)
        } else {
          throw new Error(result.error || "Failed to delete user")
        }
      } catch (error) {
        console.error("Error deleting user:", error)
        toast({
          title: "Error",
          description: "Failed to delete user. Please try again.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">{selectedUser ? "Edit User" : "Create New User"}</h3>

        {selectedUser && (
          <Button variant="destructive" size="sm" onClick={handleDelete} disabled={isLoading}>
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="details" className="flex items-center gap-2">
            <UserCog className="h-4 w-4" />
            User Details
          </TabsTrigger>
          <TabsTrigger value="credits" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Credits
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            History
          </TabsTrigger>
        </TabsList>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
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
                    <FormDescription>Credits are used for premium features and content access</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {selectedUser && (
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
              )}

              <div className="rounded-lg border p-3">
                <h4 className="font-medium mb-2">Credit History</h4>
                {selectedUser && transactions.length > 0 ? (
                  <div className="space-y-2 text-sm">
                    {transactions.map((transaction) => (
                      <div key={transaction.id} className="flex justify-between">
                        <span>
                          {transaction.description || transaction.type}
                          <span className="text-xs text-muted-foreground ml-2">
                            {format(new Date(transaction.createdAt), "MMM dd, yyyy")}
                          </span>
                        </span>
                        <span className={transaction.amount > 0 ? "text-green-600" : "text-red-600"}>
                          {transaction.amount > 0 ? `+${transaction.amount}` : transaction.amount}
                        </span>
                      </div>
                    ))}
                    <div className="flex justify-between font-medium pt-2 border-t">
                      <span>Current balance</span>
                      <span>{selectedUser.credits}</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No credit history available</p>
                )}
              </div>
            </TabsContent>
            <TabsContent value="history" className="space-y-4">
              {selectedUser && <SubscriptionHistory userId={selectedUser.id} />}
            </TabsContent>

            <div className="flex justify-end">
              <Button type="submit" disabled={isLoading}>
                <Save className="h-4 w-4 mr-2" />
                {selectedUser ? "Save Changes" : "Create User"}
              </Button>
            </div>
          </form>
        </Form>
      </Tabs>
    </div>
  )
}

