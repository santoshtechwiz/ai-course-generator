"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { format } from "date-fns"
import { Inbox, Search, Loader2, Mail, Archive, Trash2, Send } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { getContactSubmissions, updateContactSubmission, deleteContactSubmission } from "@/app/actions/actions"

interface ContactSubmission {
  id: number
  name: string
  email: string
  message: string
  status: string
  adminNotes?: string
  responseMessage?: string
  createdAt: string
}

const responseFormSchema = z.object({
  responseMessage: z.string().min(10, {
    message: "Response message must be at least 10 characters.",
  }),
  adminNotes: z.string().optional(),
  status: z.string(),
})

export default function ContactManagement() {
  const { toast } = useToast()
  const [submissions, setSubmissions] = useState<ContactSubmission[]>([])
  const [selectedSubmission, setSelectedSubmission] = useState<ContactSubmission | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const [activeTab, setActiveTab] = useState("new")
  const [searchQuery, setSearchQuery] = useState("")

  const form = useForm<z.infer<typeof responseFormSchema>>({
    resolver: zodResolver(responseFormSchema),
    defaultValues: {
      responseMessage: "",
      adminNotes: "",
      status: "NEW",
    },
  })

  const fetchSubmissions = async (status = "NEW") => {
    setIsLoading(true)
    try {
      const result = await getContactSubmissions(1, 100, status)
      if (result.submissions) {
        setSubmissions(result.submissions as ContactSubmission[])
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch contact submissions",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error fetching submissions:", error)
      toast({
        title: "Error",
        description: "Failed to fetch contact submissions",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchSubmissions(activeTab === "new" ? "NEW" : activeTab === "responded" ? "RESPONDED" : "ARCHIVED")
  }, [activeTab])

  const handleTabChange = (value: string) => {
    setActiveTab(value)
    setSelectedSubmission(null)
    form.reset({
      responseMessage: "",
      adminNotes: "",
      status: value === "new" ? "NEW" : value === "responded" ? "RESPONDED" : "ARCHIVED",
    })
  }

  const handleSelectSubmission = (submission: ContactSubmission) => {
    setSelectedSubmission(submission)
    form.reset({
      responseMessage: submission.responseMessage || "",
      adminNotes: submission.adminNotes || "",
      status: submission.status,
    })
  }

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value?.toLowerCase())
  }

  const filteredSubmissions = submissions.filter(
    (submission) =>
      submission.name?.toLowerCase().includes(searchQuery) ||
      submission.email?.toLowerCase().includes(searchQuery) ||
      submission.message?.toLowerCase().includes(searchQuery),
  )

  const sendEmailResponse = async (email: string, name: string, message: string, responseText: string) => {
    try {
      const response = await fetch("/api/email/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "contact-response",
          email,
          name,
          subject: "Re: Your inquiry",
          originalMessage: message,
          responseMessage: responseText,
          from: "courseai@courseai.io", // explicitly set the sender email
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to send email")
      }

      const result = await response.json()
      console.log("Email send result:", result)
      return true
    } catch (error) {
      console.error("Error sending email:", error)
      return false
    }
  }

  const onSubmit = async (data: z.infer<typeof responseFormSchema>) => {
    if (!selectedSubmission) return

    setIsSending(true)
    try {
      // Update the submission in the database
      const result = await updateContactSubmission(selectedSubmission.id, {
        status: data.status,
        adminNotes: data.adminNotes,
        responseMessage: data.responseMessage,
      })

      if (!result.success) {
        throw new Error(result.error || "Failed to update submission")
      }

      // If status is changed to RESPONDED, send an email response
      if (data.status === "RESPONDED") {
        const emailSent = await sendEmailResponse(
          selectedSubmission.email,
          selectedSubmission.name,
          selectedSubmission.message,
          data.responseMessage,
        )

        if (!emailSent) {
          toast({
            title: "Warning",
            description: "Submission updated but failed to send email response",
            variant: "destructive",
          })
        } else {
          toast({
            title: "Success",
            description: "Response sent successfully",
          })
        }
      } else {
        toast({
          title: "Success",
          description: "Submission updated successfully",
        })
      }

      // Refresh the submissions list
      fetchSubmissions(activeTab === "new" ? "NEW" : activeTab === "responded" ? "RESPONDED" : "ARCHIVED")
      setSelectedSubmission(null)
    } catch (error) {
      console.error("Error updating submission:", error)
      toast({
        title: "Error",
        description: "Failed to update submission",
        variant: "destructive",
      })
    } finally {
      setIsSending(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedSubmission) return

    if (confirm("Are you sure you want to delete this submission? This action cannot be undone.")) {
      setIsSending(true)
      try {
        const result = await deleteContactSubmission(selectedSubmission.id)

        if (result.success) {
          toast({
            title: "Success",
            description: "Submission deleted successfully",
          })
          fetchSubmissions(activeTab === "new" ? "NEW" : activeTab === "responded" ? "RESPONDED" : "ARCHIVED")
          setSelectedSubmission(null)
        } else {
          throw new Error(result.error || "Failed to delete submission")
        }
      } catch (error) {
        console.error("Error deleting submission:", error)
        toast({
          title: "Error",
          description: "Failed to delete submission",
          variant: "destructive",
        })
      } finally {
        setIsSending(false)
      }
    }
  }

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Contact Management</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Inquiries</CardTitle>
              <CardDescription>Manage user contact submissions</CardDescription>

              <div className="mt-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search inquiries..."
                    className="pl-8"
                    value={searchQuery}
                    onChange={handleSearch}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="new" value={activeTab} onValueChange={handleTabChange}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="new" className="flex items-center gap-2">
                    <Inbox className="h-4 w-4" />
                    <span className="hidden sm:inline">New</span>
                  </TabsTrigger>
                  <TabsTrigger value="responded" className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    <span className="hidden sm:inline">Responded</span>
                  </TabsTrigger>
                  <TabsTrigger value="archived" className="flex items-center gap-2">
                    <Archive className="h-4 w-4" />
                    <span className="hidden sm:inline">Archived</span>
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="new" className="mt-4">
                  {isLoading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : filteredSubmissions.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">No new inquiries found</div>
                  ) : (
                    <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
                      {filteredSubmissions.map((submission) => (
                        <div
                          key={submission.id}
                          className={`p-3 rounded-md border cursor-pointer transition-colors ${
                            selectedSubmission?.id === submission.id ? "bg-muted border-primary" : "hover:bg-muted/50"
                          }`}
                          onClick={() => handleSelectSubmission(submission)}
                        >
                          <div className="flex justify-between items-start">
                            <div className="font-medium">{submission.name || "Unnamed User"}</div>
                            <div className="text-xs text-muted-foreground">
                              {format(new Date(submission.createdAt), "MMM dd, yyyy")}
                            </div>
                          </div>
                          <div className="text-sm text-muted-foreground truncate">{submission.email}</div>
                          <div className="text-sm mt-1 line-clamp-2">{submission.message}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="responded" className="mt-4">
                  {isLoading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : filteredSubmissions.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">No responded inquiries found</div>
                  ) : (
                    <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
                      {filteredSubmissions.map((submission) => (
                        <div
                          key={submission.id}
                          className={`p-3 rounded-md border cursor-pointer transition-colors ${
                            selectedSubmission?.id === submission.id ? "bg-muted border-primary" : "hover:bg-muted/50"
                          }`}
                          onClick={() => handleSelectSubmission(submission)}
                        >
                          <div className="flex justify-between items-start">
                            <div className="font-medium">{submission.name || "Unnamed User"}</div>
                            <div className="text-xs text-muted-foreground">
                              {format(new Date(submission.createdAt), "MMM dd, yyyy")}
                            </div>
                          </div>
                          <div className="text-sm text-muted-foreground truncate">{submission.email}</div>
                          <div className="text-sm mt-1 line-clamp-2">{submission.message}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="archived" className="mt-4">
                  {isLoading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : filteredSubmissions.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">No archived inquiries found</div>
                  ) : (
                    <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
                      {filteredSubmissions.map((submission) => (
                        <div
                          key={submission.id}
                          className={`p-3 rounded-md border cursor-pointer transition-colors ${
                            selectedSubmission?.id === submission.id ? "bg-muted border-primary" : "hover:bg-muted/50"
                          }`}
                          onClick={() => handleSelectSubmission(submission)}
                        >
                          <div className="flex justify-between items-start">
                            <div className="font-medium">{submission.name || "Unnamed User"}</div>
                            <div className="text-xs text-muted-foreground">
                              {format(new Date(submission.createdAt), "MMM dd, yyyy")}
                            </div>
                          </div>
                          <div className="text-sm text-muted-foreground truncate">{submission.email}</div>
                          <div className="text-sm mt-1 line-clamp-2">{submission.message}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>{selectedSubmission ? "Respond to Inquiry" : "Select an inquiry to respond"}</CardTitle>
              {selectedSubmission && (
                <CardDescription>
                  From {selectedSubmission.name} ({selectedSubmission.email})
                </CardDescription>
              )}
            </CardHeader>
            <CardContent>
              {!selectedSubmission ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Inbox className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                  <p>Select an inquiry from the list to view and respond</p>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="p-4 bg-muted rounded-md">
                    <h3 className="font-medium mb-2">Original Message:</h3>
                    <p className="whitespace-pre-line">{selectedSubmission.message}</p>
                    <div className="mt-2 text-sm text-muted-foreground">
                      Received on {format(new Date(selectedSubmission.createdAt), "MMMM dd, yyyy 'at' h:mm a")}
                    </div>
                  </div>

                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                      <FormField
                        control={form.control}
                        name="responseMessage"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Response Message</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Enter your response to the user..."
                                className="min-h-[150px]"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="adminNotes"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Admin Notes (Internal Only)</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Add internal notes about this inquiry..."
                                className="min-h-[80px]"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="status"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Status</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="NEW">New</SelectItem>
                                <SelectItem value="RESPONDED">Responded</SelectItem>
                                <SelectItem value="ARCHIVED">Archived</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="flex justify-between pt-2">
                        <Button type="button" variant="destructive" onClick={handleDelete} disabled={isSending}>
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </Button>
                        <Button type="submit" disabled={isSending}>
                          {isSending ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Sending...
                            </>
                          ) : (
                            <>
                              <Send className="h-4 w-4 mr-2" />
                              {form.getValues("status") === "RESPONDED" ? "Send Response" : "Save Changes"}
                            </>
                          )}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
