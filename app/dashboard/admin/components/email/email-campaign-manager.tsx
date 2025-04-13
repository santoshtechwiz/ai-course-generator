"use client"

import { useState, useEffect, useRef, useMemo, useCallback } from "react"
import { useQuery } from "@tanstack/react-query"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Loader2, Mail, Send, Users, Filter, AlertTriangle, FileText, CheckCircle2 } from "lucide-react"
import { renderToString } from "react-dom/server"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useToast } from "@/hooks/use-toast"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Progress } from "@/components/ui/progress"

// Import template components
import WelcomeEmail from "../templates/welcome-email"
import CoursePromoEmail from "../templates/course-promo-email"
import QuizPromoEmail from "../templates/quiz-promo-email"
import ReengagementEmail from "../templates/reengagement-email"

interface User {
  id: string
  name: string
  email: string
  userType: string
  credits: number
  lastActive: string
  avatarUrl: string | null
}

const campaignFormSchema = z.object({
  name: z.string().min(3, "Campaign name must be at least 3 characters"),
  templateType: z.string().min(1, "Please select a template"),
  subject: z.string().min(3, "Subject line must be at least 3 characters"),
  testEmail: z.boolean().default(false),
  scheduleForLater: z.boolean().default(false),
  scheduledDate: z.string().optional(),
  userTypeFilters: z.array(z.string()).optional(),
  lastActiveFilter: z.string().optional(),
})

type CampaignFormValues = z.infer<typeof campaignFormSchema>

export default function EmailCampaignManager() {
  const { toast } = useToast()
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([])
  const [selectedTemplateType, setSelectedTemplateType] = useState<string>("")
  const [isSending, setIsSending] = useState(false)
  const [sendProgress, setSendProgress] = useState(0)
  const [showSuccess, setShowSuccess] = useState(false)
  const [activeTab, setActiveTab] = useState("recipients")
  const TEST_EMAIL = process.env.NEXT_PUBLIC_TEST_EMAIL || "admin@example.com"

  // Use a ref to track intervals for proper cleanup
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const successTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Form for campaign settings
  const form = useForm<CampaignFormValues>({
    resolver: zodResolver(campaignFormSchema),
    defaultValues: {
      name: "",
      templateType: "",
      subject: "",
      testEmail: false,
      scheduleForLater: false,
      scheduledDate: "",
      userTypeFilters: [],
      lastActiveFilter: "all",
    },
  })

  // Watch form values
  const watchTemplateType = form.watch("templateType")
  const watchTestEmail = form.watch("testEmail")
  const watchScheduleForLater = form.watch("scheduleForLater")
  const watchUserTypeFilters = form.watch("userTypeFilters")
  const watchLastActiveFilter = form.watch("lastActiveFilter")
  const { setValue } = form

  // Fetch sample data for templates
  const { data: sampleData, isLoading: isLoadingSampleData } = useQuery({
    queryKey: ["emailSampleData"],
    queryFn: async () => {
      try {
        const response = await fetch("/api/admin/data")
        if (!response.ok) throw new Error("Failed to fetch sample data")
        return response.json()
      } catch (error) {
        console.error("Error fetching sample data:", error)
        return { courses: [] } // Return default data to prevent rendering errors
      }
    },
  })

  // Query to fetch users
  const {
    data: userData = { users: [], totalCount: 0 },
    isLoading: isLoadingUsers,
    isError: isErrorUsers,
    refetch: refetchUsers,
  } = useQuery<{ users: User[]; totalCount: number }>({
    queryKey: ["users"],
    queryFn: async () => {
      try {
        const response = await fetch("/api/users")
        if (!response.ok) throw new Error("Failed to fetch users")
        return response.json()
      } catch (error) {
        console.error("Error fetching users:", error)
        throw error
      }
    },
  })

  // Clean up any intervals/timeouts when component unmounts
  useEffect(() => {
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current)
      }
      if (successTimeoutRef.current) {
        clearTimeout(successTimeoutRef.current)
      }
    }
  }, [])

  // Update subject when template type changes
  useEffect(() => {
    if (watchTemplateType) {
      setSelectedTemplateType(watchTemplateType)

      switch (watchTemplateType) {
        case "welcome":
          setValue("subject", "Welcome to Our Platform!")
          break
        case "coursePromo":
          setValue("subject", "New Courses Just for You!")
          break
        case "quizPromo":
          setValue("subject", "Test Your Knowledge!")
          break
        case "reengagement":
          setValue("subject", "We Miss You!")
          break
        default:
          setValue("subject", "")
      }
    }
  }, [watchTemplateType, setValue])

  // Render the selected template component with data
  const renderTemplate = (name = "John Doe") => {
    if (isLoadingSampleData || !sampleData) {
      return (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )
    }

    try {
      switch (selectedTemplateType) {
        case "welcome":
          return <WelcomeEmail name={name} />
        case "coursePromo":
          return <CoursePromoEmail name={name} recommendedCourses={sampleData.courses} />
        case "quizPromo":
          return <QuizPromoEmail name={name} quizzes={sampleData.quizzes} />
        case "reengagement":
          return <ReengagementEmail name={name} />
        default:
          return <div>No template selected</div>
      }
    } catch (error) {
      console.error("Error rendering template:", error)
      return <div className="p-4 text-red-500">Error rendering template. Please check console for details.</div>
    }
  }

  // Memoize the filtered users calculation for better performance
  const filteredUsers = useMemo(() => {
    return userData.users.filter((user) => {
      // Filter by user type
      if (watchUserTypeFilters && watchUserTypeFilters.length > 0) {
        if (!watchUserTypeFilters.includes(user.userType)) {
          return false
        }
      }

      // Filter by last active
      if (watchLastActiveFilter && watchLastActiveFilter !== "all") {
        const now = new Date()
        const lastActive = new Date(user.lastActive)
        const daysDifference = Math.floor((now.getTime() - lastActive.getTime()) / (1000 * 3600 * 24))

        if (watchLastActiveFilter === "7days" && daysDifference > 7) {
          return false
        } else if (watchLastActiveFilter === "30days" && daysDifference > 30) {
          return false
        } else if (watchLastActiveFilter === "90days" && daysDifference > 90) {
          return false
        }
      }

      return true
    })
  }, [userData.users, watchUserTypeFilters, watchLastActiveFilter])

  // Improve getTemplateHtml with error handling and memoization
  const getTemplateHtml = useCallback(
    (name: string) => {
      try {
        const templateComponent = renderTemplate(name)
        return renderToString(templateComponent)
      } catch (error) {
        console.error("Error rendering template:", error)
        return `<p>Error rendering email template: ${error instanceof Error ? error.message : "Unknown error"}</p>`
      }
    },
    [selectedTemplateType, sampleData, isLoadingSampleData],
  )

  // Form submission handler
  const onSubmit = async (data: CampaignFormValues) => {
    if (selectedUserIds.length === 0 && !data.testEmail) {
      toast({
        title: "No recipients selected",
        description: "Please select at least one recipient or enable test mode",
        variant: "destructive",
      })
      return
    }

    setIsSending(true)
    setSendProgress(0)

    // Clear any existing interval
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current)
      progressIntervalRef.current = null
    }

    // Store interval reference for cleanup
    progressIntervalRef.current = setInterval(() => {
      setSendProgress((prev) => {
        const newProgress = prev + Math.random() * 10
        return newProgress > 95 ? 95 : newProgress
      })
    }, 300)

    try {
      const recipients = data.testEmail
        ? [{ email: TEST_EMAIL, name: "Test User" }]
        : userData.users
            .filter((user) => selectedUserIds.includes(user.id))
            .map((user) => ({ email: user.email, name: user.name }))

      // For each recipient, generate personalized HTML
      const emailsToSend = recipients.map((recipient) => ({
        to: recipient.email,
        subject: data.subject,
        html: getTemplateHtml(recipient.name),
        recipientName: recipient.name,
      }))

      const response = await fetch("/api/admin/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name,
          emails: emailsToSend,
          scheduledDate: data.scheduleForLater ? data.scheduledDate : null,
          type: data.templateType, // Use the actual template type instead of hardcoded value
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Failed to send campaign")
      }

      // Clear the progress interval
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current)
        progressIntervalRef.current = null
      }

      setSendProgress(100)
      setShowSuccess(true)

      // Reset after 3 seconds
      if (successTimeoutRef.current) {
        clearTimeout(successTimeoutRef.current)
      }

      successTimeoutRef.current = setTimeout(() => {
        setShowSuccess(false)
        setIsSending(false)
        setSendProgress(0)
        form.reset()
        setSelectedUserIds([])
        successTimeoutRef.current = null
      }, 3000)
    } catch (error) {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current)
        progressIntervalRef.current = null
      }

      setIsSending(false)
      setSendProgress(0)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send campaign",
        variant: "destructive",
      })
    }
  }

  // User type options for filtering
  const userTypeOptions = [
    { value: "FREE", label: "Free" },
    { value: "BASIC", label: "Basic" },
    { value: "PRO", label: "Pro" },
    { value: "PREMIUM", label: "Premium" },
    { value: "ULTIMATE", label: "Ultimate" },
  ]

  // Last active filter options
  const lastActiveOptions = [
    { value: "all", label: "All Time" },
    { value: "7days", label: "Active in last 7 days" },
    { value: "30days", label: "Active in last 30 days" },
    { value: "90days", label: "Active in last 90 days" },
  ]

  // Template options
  const templateOptions = [
    { value: "welcome", label: "Welcome Email" },
    { value: "coursePromo", label: "Course Promotion" },
    { value: "quizPromo", label: "Quiz Promotion" },
    { value: "reengagement", label: "Re-engagement" },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Email Campaign</h2>
          <p className="text-muted-foreground">Create and send targeted email campaigns to your users</p>
        </div>
      </div>

      {showSuccess ? (
        <Card className="border-green-200 dark:border-green-800">
          <CardContent className="pt-6 flex flex-col items-center justify-center py-10">
            <div className="rounded-full bg-green-100 dark:bg-green-900/30 p-3 mb-4">
              <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-xl font-medium mb-2">Campaign Sent Successfully!</h3>
            <p className="text-muted-foreground text-center max-w-md mb-6">
              {watchTestEmail
                ? `Test email has been sent to ${TEST_EMAIL}`
                : `Your campaign has been sent to ${selectedUserIds.length} recipients`}
            </p>
            <Button
              onClick={() => {
                setShowSuccess(false)
                form.reset()
                setSelectedUserIds([])
              }}
            >
              Create Another Campaign
            </Button>
          </CardContent>
        </Card>
      ) : isSending ? (
        <Card>
          <CardContent className="pt-6 flex flex-col items-center justify-center py-10">
            <h3 className="text-xl font-medium mb-6">Sending Campaign...</h3>
            <div className="w-full max-w-md mb-4">
              <Progress value={sendProgress} className="h-2" />
            </div>
            <p className="text-muted-foreground">
              {watchTestEmail ? "Sending test email..." : `Sending to ${selectedUserIds.length} recipients...`}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Create New Campaign</CardTitle>
            <CardDescription>Configure your email campaign and select recipients</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)}>
                <Tabs defaultValue="recipients" value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="mb-4 grid w-full grid-cols-3">
                    <TabsTrigger value="recipients" className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Recipients
                    </TabsTrigger>
                    <TabsTrigger value="template" className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Template
                    </TabsTrigger>
                    <TabsTrigger value="preview" className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Preview & Send
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="recipients" className="space-y-4">
                    <div className="flex flex-col md:flex-row gap-4">
                      <div className="w-full md:w-1/3 space-y-4">
                        <div className="space-y-2">
                          <h3 className="text-lg font-medium">Filters</h3>
                          <FormField
                            control={form.control}
                            name="userTypeFilters"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>User Type</FormLabel>
                                <div className="space-y-2">
                                  {userTypeOptions.map((option) => (
                                    <div key={option.value} className="flex items-center space-x-2">
                                      <Checkbox
                                        checked={field.value?.includes(option.value)}
                                        onCheckedChange={(checked) => {
                                          const updatedValue = checked
                                            ? [...(field.value || []), option.value]
                                            : (field.value || []).filter((value) => value !== option.value)
                                          field.onChange(updatedValue)
                                        }}
                                        id={`user-type-${option.value}`}
                                      />
                                      <label
                                        htmlFor={`user-type-${option.value}`}
                                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                      >
                                        {option.label}
                                      </label>
                                    </div>
                                  ))}
                                </div>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="lastActiveFilter"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Last Active</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select a filter" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {lastActiveOptions.map((option) => (
                                      <SelectItem key={option.value} value={option.value}>
                                        {option.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <div className="pt-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                form.setValue("userTypeFilters", [])
                                form.setValue("lastActiveFilter", "all")
                              }}
                              className="w-full"
                            >
                              <Filter className="h-4 w-4 mr-2" />
                              Reset Filters
                            </Button>
                          </div>
                        </div>

                        <div className="space-y-2 pt-4">
                          <FormField
                            control={form.control}
                            name="testEmail"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                                <FormControl>
                                  <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                                </FormControl>
                                <div className="space-y-1 leading-none">
                                  <FormLabel>Test Mode</FormLabel>
                                  <FormDescription>Send to {TEST_EMAIL} instead of selected users</FormDescription>
                                </div>
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>

                      <div className="w-full md:w-2/3 border rounded-md p-4">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-medium flex items-center gap-2">
                            <Users className="h-5 w-5 text-primary" />
                            Recipients
                          </h3>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{selectedUserIds.length} selected</Badge>
                            <Badge variant="secondary">{filteredUsers.length} matching filters</Badge>
                          </div>
                        </div>

                        {isLoadingUsers ? (
                          <div className="flex justify-center py-8">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                          </div>
                        ) : isErrorUsers ? (
                          <div className="flex flex-col items-center justify-center gap-2 py-8">
                            <AlertTriangle className="h-8 w-8 text-destructive" />
                            <span className="text-destructive">Failed to load users</span>
                            <Button variant="outline" size="sm" onClick={() => refetchUsers()}>
                              Retry
                            </Button>
                          </div>
                        ) : filteredUsers.length === 0 ? (
                          <div className="flex flex-col items-center justify-center py-8 text-center">
                            <Users className="h-12 w-12 text-muted-foreground/50 mb-4" />
                            <h3 className="text-lg font-medium mb-2">No users match your filters</h3>
                            <p className="text-muted-foreground mb-4">Try adjusting your filters to find recipients</p>
                            <Button
                              variant="outline"
                              onClick={() => {
                                form.setValue("userTypeFilters", [])
                                form.setValue("lastActiveFilter", "all")
                              }}
                            >
                              Reset Filters
                            </Button>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center gap-3 p-2 hover:bg-muted/50 rounded-md mb-2">
                              <Checkbox
                                checked={selectedUserIds.length === filteredUsers.length && filteredUsers.length > 0}
                                onCheckedChange={() => {
                                  if (selectedUserIds.length === filteredUsers.length) {
                                    setSelectedUserIds([])
                                  } else {
                                    const allIds = filteredUsers.map((user) => user.id)
                                    setSelectedUserIds(allIds)
                                  }
                                }}
                                id="select-all"
                              />
                              <Label htmlFor="select-all" className="text-sm font-medium">
                                Select All ({filteredUsers.length} users)
                              </Label>
                            </div>
                            <ScrollArea className="h-[400px] pr-4">
                              <div className="space-y-2">
                                {filteredUsers.map((user) => {
                                  const isSelected = selectedUserIds.includes(user.id)
                                  return (
                                    <div
                                      key={user.id}
                                      className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50"
                                    >
                                      <Checkbox
                                        checked={isSelected}
                                        onCheckedChange={() => {
                                          // Use a simple approach that doesn't cause infinite loops
                                          if (isSelected) {
                                            setSelectedUserIds(selectedUserIds.filter((id) => id !== user.id))
                                          } else {
                                            setSelectedUserIds([...selectedUserIds, user.id])
                                          }
                                        }}
                                        id={`user-${user.id}`}
                                      />
                                      <label
                                        htmlFor={`user-${user.id}`}
                                        className="flex items-center gap-3 flex-1 cursor-pointer"
                                      >
                                        <Avatar className="h-9 w-9">
                                          <AvatarImage src={user.avatarUrl || ""} />
                                          <AvatarFallback className="bg-primary/10">
                                            {user.name.charAt(0)}
                                          </AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 min-w-0">
                                          <p className="font-medium truncate">{user.name}</p>
                                          <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                                        </div>
                                      </label>
                                      <Badge variant="outline" className="ml-auto">
                                        {user.userType}
                                      </Badge>
                                    </div>
                                  )
                                })}
                              </div>
                            </ScrollArea>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex justify-end mt-6">
                      <Button type="button" onClick={() => setActiveTab("template")}>
                        Next: Select Template
                      </Button>
                    </div>
                  </TabsContent>

                  <TabsContent value="template" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <FormField
                          control={form.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Campaign Name</FormLabel>
                              <FormControl>
                                <Input placeholder="Spring Promotion 2023" {...field} />
                              </FormControl>
                              <FormDescription>
                                Internal name for this campaign (not shown to recipients)
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="templateType"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email Template</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select a template" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {templateOptions.map((template) => (
                                    <SelectItem key={template.value} value={template.value}>
                                      {template.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormDescription>Choose an email template for your campaign</FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="subject"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Subject Line</FormLabel>
                              <FormControl>
                                <Input placeholder="Your subject line here" {...field} />
                              </FormControl>
                              <FormDescription>This will appear in the recipient's inbox</FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="scheduleForLater"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                              <FormControl>
                                <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                              </FormControl>
                              <div className="space-y-1 leading-none">
                                <FormLabel>Schedule for later</FormLabel>
                                <FormDescription>Send this campaign at a scheduled time</FormDescription>
                              </div>
                            </FormItem>
                          )}
                        />

                        {watchScheduleForLater && (
                          <FormField
                            control={form.control}
                            name="scheduledDate"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Schedule Date & Time</FormLabel>
                                <FormControl>
                                  <Input type="datetime-local" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        )}
                      </div>

                      <div className="border rounded-md p-4">
                        <Label className="mb-2 block">Template Preview</Label>
                        {!selectedTemplateType ? (
                          <div className="flex flex-col items-center justify-center py-12 text-center">
                            <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" />
                            <h3 className="text-lg font-medium mb-2">No template selected</h3>
                            <p className="text-muted-foreground">Select a template to preview its content</p>
                          </div>
                        ) : (
                          <div className="border rounded-md p-4 bg-white max-h-[400px] overflow-auto">
                            {renderTemplate()}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex justify-between mt-6">
                      <Button type="button" variant="outline" onClick={() => setActiveTab("recipients")}>
                        Back: Recipients
                      </Button>
                      <Button type="button" onClick={() => setActiveTab("preview")}>
                        Next: Preview & Send
                      </Button>
                    </div>
                  </TabsContent>

                  <TabsContent value="preview" className="space-y-6">
                    <div className="border rounded-md p-6">
                      <h3 className="text-xl font-medium mb-4">Campaign Summary</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <div>
                            <h4 className="text-sm font-medium text-muted-foreground">Campaign Name</h4>
                            <p className="text-lg">{form.getValues("name") || "Unnamed Campaign"}</p>
                          </div>
                          <div>
                            <h4 className="text-sm font-medium text-muted-foreground">Subject Line</h4>
                            <p className="text-lg">{form.getValues("subject") || "No subject"}</p>
                          </div>
                          <div>
                            <h4 className="text-sm font-medium text-muted-foreground">Template</h4>
                            <p className="text-lg">
                              {templateOptions.find((t) => t.value === selectedTemplateType)?.label ||
                                "No template selected"}
                            </p>
                          </div>
                          {watchScheduleForLater && (
                            <div>
                              <h4 className="text-sm font-medium text-muted-foreground">Scheduled For</h4>
                              <p className="text-lg">
                                {form.getValues("scheduledDate")
                                  ? new Date(form.getValues("scheduledDate") || "").toLocaleString()
                                  : "Not scheduled"}
                              </p>
                            </div>
                          )}
                        </div>
                        <div className="space-y-4">
                          <div>
                            <h4 className="text-sm font-medium text-muted-foreground">Recipients</h4>
                            {watchTestEmail ? (
                              <div className="flex items-center gap-2">
                                <Badge variant="secondary">Test Mode</Badge>
                                <p>Will send to {TEST_EMAIL} only</p>
                              </div>
                            ) : (
                              <p className="text-lg">{selectedUserIds.length} users selected</p>
                            )}
                          </div>
                          {!watchTestEmail && selectedUserIds.length > 0 && (
                            <div>
                              <h4 className="text-sm font-medium text-muted-foreground">Sample Recipients</h4>
                              <div className="mt-2 space-y-2">
                                {userData.users
                                  .filter((user) => selectedUserIds.includes(user.id))
                                  .slice(0, 3)
                                  .map((user) => (
                                    <div key={user.id} className="flex items-center gap-2">
                                      <Avatar className="h-6 w-6">
                                        <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                                      </Avatar>
                                      <span className="text-sm">
                                        {user.name} ({user.email})
                                      </span>
                                    </div>
                                  ))}
                                {selectedUserIds.length > 3 && (
                                  <p className="text-sm text-muted-foreground">
                                    And {selectedUserIds.length - 3} more...
                                  </p>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="border rounded-md p-4">
                      <Label className="mb-2 block">Email Preview</Label>
                      {!selectedTemplateType ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                          <AlertTriangle className="h-12 w-12 text-amber-500 mb-4" />
                          <h3 className="text-lg font-medium mb-2">No template selected</h3>
                          <p className="text-muted-foreground mb-4">
                            You need to select a template before sending your campaign
                          </p>
                          <Button variant="outline" onClick={() => setActiveTab("template")}>
                            Select Template
                          </Button>
                        </div>
                      ) : (
                        <div className="border rounded-md p-4 bg-white max-h-[400px] overflow-auto">
                          {renderTemplate()}
                        </div>
                      )}
                    </div>

                    <div className="flex justify-between mt-6">
                      <Button type="button" variant="outline" onClick={() => setActiveTab("template")}>
                        Back: Template
                      </Button>
                      <Button
                        type="submit"
                        disabled={!selectedTemplateType || (!watchTestEmail && selectedUserIds.length === 0)}
                      >
                        <Send className="h-4 w-4 mr-2" />
                        {watchScheduleForLater ? "Schedule Campaign" : "Send Campaign"}
                      </Button>
                    </div>
                  </TabsContent>
                </Tabs>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
