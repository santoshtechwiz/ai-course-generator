"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { format } from "date-fns"
import {
  Loader2,
  CreditCard,
  Save,
  Trash2,
  UserCog,
  History,
  RefreshCw,
  AlertTriangle,
  Shield,
  Mail,
  User,
  ListFilter,
  BookOpen,
  ShieldAlert,
  PlusCircle,
  MinusCircle,
  UserPlus,
} from "lucide-react"

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
  sendNotification: z.boolean().default(false),
  notificationMessage: z.string().optional().nullable(),
})

type UserFormValues = z.infer<typeof userFormSchema>

interface UserEditDialogProps {
  userId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

const USER_TYPES = [
  { value: "FREE", label: "Free" },
  { value: "BASIC", label: "Basic" },
  { value: "PRO", label: "Pro" },
  { value: "PREMIUM", label: "Premium" },
  { value: "ULTIMATE", label: "Ultimate" },
] as const

export function UserEditDialog({ userId, open, onOpenChange, onSuccess }: UserEditDialogProps) {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [activeTab, setActiveTab] = useState("details")
  const [user, setUser] = useState<any>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [auditLogs, setAuditLogs] = useState<any[]>([])
  const [isLoadingAuditLogs, setIsLoadingAuditLogs] = useState(false)

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
      sendNotification: false,
      notificationMessage: null,
    },
  })

  // Watch credit field to determine if notification is needed
  const watchCredits = form.watch("credits")
  const watchUserType = form.watch("userType")
  const sendNotification = form.watch("sendNotification")

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
          sendNotification: false,
          notificationMessage: null,
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

  // Fetch audit logs when tab changes to "activity"
  useEffect(() => {
    const fetchAuditLogs = async () => {
      if (activeTab !== "activity" || !userId) return

      setIsLoadingAuditLogs(true)
      try {
        const response = await fetch(`/api/users/${userId}/audit-logs`)
        if (!response.ok) {
          throw new Error("Failed to fetch audit logs")
        }

        const data = await response.json()
        setAuditLogs(data.logs || [])
      } catch (error) {
        console.error("Error fetching audit logs:", error)
        toast({
          title: "Error",
          description: "Failed to load user activity logs.",
          variant: "destructive",
        })
      } finally {
        setIsLoadingAuditLogs(false)
      }
    }

    fetchAuditLogs()
  }, [activeTab, userId, toast])

  // Update notification message when credits change
  useEffect(() => {
    if (user?.credits !== undefined && watchCredits !== undefined) {
      const creditsChange = watchCredits - user.credits
      if (creditsChange !== 0) {
        form.setValue(
          "notificationMessage",
          `Your account has been ${creditsChange > 0 ? "credited with" : "debited"} ${Math.abs(creditsChange)} tokens by an administrator.`,
        )
      }
    }
  }, [watchCredits, user?.credits, form])

  // Handle form submission
  const onSubmit = async (data: UserFormValues) => {
    setIsSaving(true)
    try {
      // Calculate credits difference for audit log
      const creditsDifference = user ? data.credits - user.credits : data.credits
      const planChange = user ? data.userType !== user.userType : false

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
          sendNotification: data.sendNotification,
          notificationMessage: data.notificationMessage,
          auditInfo: {
            creditsDifference,
            planChange,
            previousType: user?.userType,
            newType: data.userType,
          },
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

  // Function to render activity log badges
  const getActivityBadge = (activity: string) => {
    switch (activity) {
      case "SIGN_IN":
        return (
          <Badge
            variant="outline"
            className="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800"
          >
            Sign In
          </Badge>
        )
      case "CREDITS_ADDED":
        return (
          <Badge
            variant="outline"
            className="bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border-green-200 dark:border-green-800"
          >
            Credits Added
          </Badge>
        )
      case "CREDITS_REMOVED":
        return (
          <Badge
            variant="outline"
            className="bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800"
          >
            Credits Removed
          </Badge>
        )
      case "SUBSCRIPTION_CHANGED":
        return (
          <Badge
            variant="outline"
            className="bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800"
          >
            Plan Changed
          </Badge>
        )
      case "USER_CREATED":
        return (
          <Badge
            variant="outline"
            className="bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800"
          >
            Account Created
          </Badge>
        )
      case "ACCOUNT_LINKED":
        return (
          <Badge
            variant="outline"
            className="bg-teal-50 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400 border-teal-200 dark:border-teal-800"
          >
            Account Linked
          </Badge>
        )
      default:
        return <Badge variant="outline">{activity}</Badge>
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2 text-foreground">
              <UserCog className="h-5 w-5 text-primary" />
              Edit User
            </DialogTitle>
            <DialogDescription className="text-muted-foreground/80">
              Update user information, manage subscription, and adjust credits
            </DialogDescription>
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
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-primary text-lg font-semibold shadow-sm">
                        {user.name ? user.name.charAt(0).toUpperCase() : "U"}
                      </div>
                      <div>
                        <h3 className="font-medium text-foreground">{user.name || "Unnamed User"}</h3>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                        <div className="flex items-center gap-2 mt-1">
                          {user.isAdmin && (
                            <Badge
                              variant="outline"
                              className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800"
                            >
                              Admin
                            </Badge>
                          )}
                          <Badge
                            variant="outline"
                            className={
                              user.userType === "FREE"
                                ? "bg-slate-50 dark:bg-slate-900/20 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800"
                                : "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800"
                            }
                          >
                            {user.userType}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    {user.subscription && (
                      <div className="p-3 bg-muted/50 rounded-md w-full md:w-auto border border-border/50 shadow-sm">
                        <div className="flex justify-between items-center gap-4">
                          <div>
                            <span className="text-sm font-medium text-foreground">Subscription</span>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge
                                variant={user.subscription.status === "ACTIVE" ? "default" : "outline"}
                                className="shadow-sm"
                              >
                                {user.subscription.status}
                              </Badge>
                              <span className="text-xs text-muted-foreground">Plan: {user.subscription.planId}</span>
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 border-muted-foreground/20 hover:bg-primary/5 transition-all duration-200"
                            onClick={handleResetSubscription}
                          >
                            <CreditCard className="h-4 w-4 mr-2 text-primary/70" />
                            Reset
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>

                  <Separator />

                  <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="grid w-full grid-cols-3 p-1 bg-muted/50">
                      <TabsTrigger
                        value="details"
                        className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm transition-all duration-200"
                      >
                        <User className="h-4 w-4 text-primary/70" />
                        User Details
                      </TabsTrigger>
                      <TabsTrigger
                        value="credits"
                        className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm transition-all duration-200"
                      >
                        <CreditCard className="h-4 w-4 text-primary/70" />
                        Credits & Billing
                      </TabsTrigger>
                      <TabsTrigger
                        value="activity"
                        className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm transition-all duration-200"
                      >
                        <History className="h-4 w-4 text-primary/70" />
                        Activity Log
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
                                  <FormLabel className="text-foreground flex items-center gap-2">
                                    <User className="h-4 w-4 text-muted-foreground" />
                                    Name
                                  </FormLabel>
                                  <FormControl>
                                    <Input
                                      placeholder="User name"
                                      {...field}
                                      className="border-muted-foreground/20 focus-visible:ring-primary/30 transition-all duration-200"
                                    />
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
                                  <FormLabel className="flex items-center gap-2">
                                    <Mail className="h-4 w-4 text-muted-foreground" />
                                    Email
                                  </FormLabel>
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
                                  <FormLabel className="flex items-center gap-2">
                                    <ListFilter className="h-4 w-4 text-muted-foreground" />
                                    User Type
                                  </FormLabel>
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
                                    <FormLabel className="flex items-center gap-2">
                                      <Shield className="h-4 w-4 text-muted-foreground" />
                                      Administrator
                                    </FormLabel>
                                    <FormDescription>Grant admin privileges</FormDescription>
                                  </div>
                                  <FormControl>
                                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                          </div>

                          <div className="p-4 border border-dashed border-amber-200 dark:border-amber-800 rounded-md bg-amber-50/50 dark:bg-amber-900/10">
                            <div className="flex items-start">
                              <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-500 mr-2 mt-0.5" />
                              <div>
                                <h4 className="text-sm font-medium text-amber-800 dark:text-amber-600">
                                  Important Note
                                </h4>
                                <p className="text-sm text-amber-700 dark:text-amber-500 mt-1">
                                  Changes to user type or admin status may affect subscription billing and system
                                  access. These changes are logged and audited.
                                </p>
                              </div>
                            </div>
                          </div>

                          <FormField
                            control={form.control}
                            name="sendNotification"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                                <div className="space-y-0.5">
                                  <FormLabel>Notify User</FormLabel>
                                  <FormDescription>Send an email notification about changes</FormDescription>
                                </div>
                                <FormControl>
                                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                                </FormControl>
                              </FormItem>
                            )}
                          />

                          {sendNotification && (
                            <FormField
                              control={form.control}
                              name="notificationMessage"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Notification Message</FormLabel>
                                  <FormControl>
                                    <Textarea
                                      placeholder="Custom message to send to the user"
                                      className="resize-none"
                                      {...field}
                                      value={field.value || ""}
                                    />
                                  </FormControl>
                                  <FormDescription>
                                    This message will be included in the email notification. Leave blank to use the
                                    default message.
                                  </FormDescription>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          )}
                        </TabsContent>

                        <TabsContent value="credits" className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                              control={form.control}
                              name="credits"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="flex items-center gap-2">
                                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                                    Credits
                                  </FormLabel>
                                  <div className="flex gap-2">
                                    <FormControl>
                                      <Input type="number" {...field} className="flex-grow" />
                                    </FormControl>
                                    <div className="flex gap-1">
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="icon"
                                        onClick={() => {
                                          const currentCredits = form.getValues("credits")
                                          form.setValue("credits", currentCredits + 10)
                                        }}
                                        className="text-green-600 border-green-200 hover:bg-green-50 dark:border-green-800 dark:hover:bg-green-900/20"
                                      >
                                        <span className="sr-only">Add 10 credits</span>
                                        <PlusCircle className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="icon"
                                        onClick={() => {
                                          const currentCredits = form.getValues("credits")
                                          form.setValue("credits", Math.max(0, currentCredits - 10))
                                        }}
                                        className="text-red-600 border-red-200 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-900/20"
                                      >
                                        <span className="sr-only">Remove 10 credits</span>
                                        <MinusCircle className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </div>
                                  <FormDescription className="flex items-center justify-between">
                                    <span>Current credits: {user?.credits || 0}</span>
                                    {watchCredits !== user?.credits && (
                                      <Badge
                                        variant="outline"
                                        className={
                                          watchCredits > user?.credits
                                            ? "bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border-green-200 dark:border-green-800"
                                            : "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800"
                                        }
                                      >
                                        {watchCredits > user?.credits ? "+" : ""}
                                        {watchCredits - user?.credits} change
                                      </Badge>
                                    )}
                                  </FormDescription>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name="creditNote"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="flex items-center gap-2">
                                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                                    Credit Adjustment Note
                                  </FormLabel>
                                  <FormControl>
                                    <Textarea
                                      placeholder="Reason for credit adjustment"
                                      className="resize-none"
                                      {...field}
                                    />
                                  </FormControl>
                                  <FormDescription>
                                    Add a note explaining why credits were adjusted. This will be included in the audit
                                    logs.
                                  </FormDescription>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          {user?.TokenTransaction && user.TokenTransaction.length > 0 ? (
                            <div className="border rounded-md p-3 mt-4 border-border/50 bg-muted/30">
                              <h4 className="text-sm font-medium mb-2 flex items-center gap-2 text-foreground">
                                <History className="h-4 w-4 text-primary/70" />
                                Credit History
                              </h4>
                              <div className="space-y-2 max-h-[200px] overflow-y-auto scrollbar-thin scrollbar-thumb-muted-foreground/10 scrollbar-track-transparent pr-2">
                                {user.TokenTransaction.map((transaction: any) => (
                                  <div
                                    key={transaction.id}
                                    className="flex justify-between text-sm p-2 rounded-md hover:bg-muted/50 transition-colors duration-200"
                                  >
                                    <div>
                                      <span className="text-foreground">
                                        {transaction.description || transaction.type}
                                      </span>
                                      <span className="text-xs text-muted-foreground ml-2">
                                        {format(new Date(transaction.createdAt), "MMM dd, yyyy")}
                                      </span>
                                    </div>
                                    <span
                                      className={
                                        transaction.amount > 0
                                          ? "text-green-600 font-medium"
                                          : "text-red-600 font-medium"
                                      }
                                    >
                                      {transaction.amount > 0 ? `+${transaction.amount}` : transaction.amount}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <div className="border rounded-md p-4 text-center text-muted-foreground border-border/50 bg-muted/30">
                              <History className="h-8 w-8 mx-auto mb-2 opacity-50 text-primary/30" />
                              <p>No credit history available</p>
                            </div>
                          )}

                          {user.subscription && (
                            <div className="border rounded-md p-4 mt-4 border-border/50 bg-muted/30">
                              <h4 className="text-sm font-medium mb-3 flex items-center gap-2 text-foreground">
                                <CreditCard className="h-4 w-4 text-primary/70" />
                                Subscription Details
                              </h4>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="p-3 bg-white dark:bg-slate-800 rounded-md border border-slate-200 dark:border-slate-700">
                                  <p className="text-xs text-muted-foreground">Plan</p>
                                  <p className="font-medium">{user.subscription.planId || "FREE"}</p>
                                </div>
                                <div className="p-3 bg-white dark:bg-slate-800 rounded-md border border-slate-200 dark:border-slate-700">
                                  <p className="text-xs text-muted-foreground">Status</p>
                                  <div className="flex items-center gap-2">
                                    <Badge
                                      variant={user.subscription.status === "ACTIVE" ? "default" : "outline"}
                                      className="shadow-sm"
                                    >
                                      {user.subscription.status}
                                    </Badge>
                                  </div>
                                </div>
                                <div className="p-3 bg-white dark:bg-slate-800 rounded-md border border-slate-200 dark:border-slate-700">
                                  <p className="text-xs text-muted-foreground">Start Date</p>
                                  <p className="font-medium">
                                    {user.subscription.currentPeriodStart
                                      ? format(new Date(user.subscription.currentPeriodStart), "MMM dd, yyyy")
                                      : "N/A"}
                                  </p>
                                </div>
                                <div className="p-3 bg-white dark:bg-slate-800 rounded-md border border-slate-200 dark:border-slate-700">
                                  <p className="text-xs text-muted-foreground">Expiry Date</p>
                                  <p className="font-medium">
                                    {user.subscription.currentPeriodEnd
                                      ? format(new Date(user.subscription.currentPeriodEnd), "MMM dd, yyyy")
                                      : "N/A"}
                                  </p>
                                </div>
                              </div>

                              {user.subscription.stripeCustomerId && (
                                <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                                  <p className="text-xs text-muted-foreground mb-1">Payment Provider</p>
                                  <div className="flex items-center gap-2">
                                    <svg className="h-4" viewBox="0 0 60 25" xmlns="http://www.w3.org/2000/svg">
                                      <path
                                        d="M60 10.4167C60 4.66667 55.3333 0 49.5833 0H10.4167C4.66667 0 0 4.66667 0 10.4167V14.5833C0 20.3333 4.66667 25 10.4167 25H49.5833C55.3333 25 60 20.3333 60 14.5833V10.4167Z"
                                        fill="#6772E5"
                                      />
                                      <path
                                        d="M18.3333 15.8333C18.3333 16.75 17.5833 17.5 16.6667 17.5H11.6667C10.75 17.5 10 16.75 10 15.8333V9.16667C10 8.25 10.75 7.5 11.6667 7.5H16.6667C17.5833 7.5 18.3333 8.25 18.3333 9.16667V15.8333Z"
                                        fill="white"
                                      />
                                      <path
                                        d="M31.6667 15.8333C31.6667 16.75 30.9167 17.5 30 17.5H25C24.0833 17.5 23.3333 16.75 23.3333 15.8333V9.16667C23.3333 8.25 24.0833 7.5 25 7.5H30C30.9167 7.5 31.6667 8.25 31.6667 9.16667V15.8333Z"
                                        fill="white"
                                      />
                                      <path
                                        d="M45 15.8333C45 16.75 44.25 17.5 43.3333 17.5H38.3333C37.4167 17.5 36.6667 15.8333V9.16667C36.6667 8.25 37.4167 7.5 38.3333 7.5H43.3333C44.25 7.5 45 8.25 45 9.16667V15.8333Z"
                                        fill="white"
                                      />
                                    </svg>
                                    <span className="text-sm">
                                      Stripe Customer ID: {user.subscription.stripeCustomerId.substring(0, 6)}...
                                    </span>
                                  </div>
                                </div>
                              )}

                              <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-700">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="w-full border-muted-foreground/20 hover:bg-primary/5 transition-all duration-200"
                                  onClick={handleResetSubscription}
                                >
                                  <RefreshCw className="h-4 w-4 mr-2 text-primary/70" />
                                  Reset Subscription Status
                                </Button>
                              </div>
                            </div>
                          )}
                        </TabsContent>

                        <TabsContent value="activity" className="space-y-4">
                          <div className="border rounded-md border-border/50 bg-muted/30 overflow-hidden">
                            <div className="p-3 bg-muted/50 border-b border-border/50">
                              <h4 className="text-sm font-medium flex items-center gap-2 text-foreground">
                                <History className="h-4 w-4 text-primary/70" />
                                User Activity Log
                              </h4>
                              <p className="text-xs text-muted-foreground mt-1">
                                Recent user activities and system events
                              </p>
                            </div>

                            {isLoadingAuditLogs ? (
                              <div className="flex justify-center items-center py-8">
                                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                              </div>
                            ) : auditLogs && auditLogs.length > 0 ? (
                              <div className="divide-y divide-border/50 max-h-[300px] overflow-y-auto">
                                {auditLogs.map((log: any, index) => (
                                  <div key={index} className="p-3 hover:bg-muted/50 transition-colors duration-100">
                                    <div className="flex justify-between items-start">
                                      <div className="flex items-start gap-3">
                                        <div className="mt-1">
                                          {log.action === "SIGN_IN" && <User className="h-4 w-4 text-blue-500" />}
                                          {log.action === "CREDITS_ADDED" && (
                                            <PlusCircle className="h-4 w-4 text-green-500" />
                                          )}
                                          {log.action === "CREDITS_REMOVED" && (
                                            <MinusCircle className="h-4 w-4 text-amber-500" />
                                          )}
                                          {log.action === "SUBSCRIPTION_CHANGED" && (
                                            <RefreshCw className="h-4 w-4 text-purple-500" />
                                          )}
                                          {log.action === "USER_CREATED" && (
                                            <UserPlus className="h-4 w-4 text-indigo-500" />
                                          )}
                                          {log.action === "ADMIN_ACTION" && (
                                            <ShieldAlert className="h-4 w-4 text-red-500" />
                                          )}
                                          {![
                                            "SIGN_IN",
                                            "CREDITS_ADDED",
                                            "CREDITS_REMOVED",
                                            "SUBSCRIPTION_CHANGED",
                                            "USER_CREATED",
                                            "ADMIN_ACTION",
                                          ].includes(log.action) && (
                                            <History className="h-4 w-4 text-muted-foreground" />
                                          )}
                                        </div>
                                        <div>
                                          <div className="flex items-center gap-2">
                                            {getActivityBadge(log.action)}
                                            <span className="text-xs text-muted-foreground">
                                              {format(new Date(log.timestamp || log.createdAt), "MMM dd, yyyy HH:mm")}
                                            </span>
                                          </div>
                                          <p className="text-sm mt-1">
                                            {log.description ||
                                              `User performed ${log.action.toLowerCase().replace("_", " ")}`}
                                          </p>
                                          {log.metadata && (
                                            <div className="mt-1 text-xs text-muted-foreground">
                                              {typeof log.metadata === "string" ? (
                                                <div className="font-mono bg-slate-100 dark:bg-slate-800 p-1 rounded mt-1 text-xs overflow-x-auto">
                                                  {JSON.parse(log.metadata).details ||
                                                    JSON.parse(log.metadata).message ||
                                                    JSON.stringify(JSON.parse(log.metadata), null, 2)}
                                                </div>
                                              ) : (
                                                <div className="font-mono bg-slate-100 dark:bg-slate-800 p-1 rounded mt-1 text-xs overflow-x-auto">
                                                  {log.metadata.details ||
                                                    log.metadata.message ||
                                                    JSON.stringify(log.metadata, null, 2)}
                                                </div>
                                              )}
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="py-8 text-center">
                                <History className="h-8 w-8 mx-auto mb-2 opacity-50 text-primary/30" />
                                <p className="text-muted-foreground">No activity logs available</p>
                              </div>
                            )}
                          </div>

                          <div className="p-4 border border-dashed border-amber-200 dark:border-amber-800 rounded-md bg-amber-50/50 dark:bg-amber-900/10">
                            <div className="flex items-start">
                              <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-500 mr-2 mt-0.5" />
                              <div>
                                <h4 className="text-sm font-medium text-amber-800 dark:text-amber-600">
                                  Security Information
                                </h4>
                                <p className="text-sm text-amber-700 dark:text-amber-500 mt-1">
                                  User activity logs are stored for audit purposes and compliance. These logs cannot be
                                  modified or deleted.
                                </p>
                              </div>
                            </div>
                          </div>
                        </TabsContent>

                        <DialogFooter className="flex justify-between items-center pt-4 border-t border-border/50 mt-4">
                          <Button
                            type="button"
                            variant="destructive"
                            onClick={() => setIsDeleteDialogOpen(true)}
                            className="mr-auto hover:bg-destructive/90 transition-colors duration-200"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete User
                          </Button>

                          <div className="flex gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => onOpenChange(false)}
                              className="border-muted-foreground/20 hover:bg-primary/5 transition-all duration-200"
                            >
                              Cancel
                            </Button>
                            <Button
                              type="submit"
                              disabled={isSaving}
                              className="shadow-sm hover:shadow-md transition-all duration-200"
                            >
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

