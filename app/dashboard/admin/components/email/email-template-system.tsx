"use client"

import { useState, useEffect } from "react"
import { useQuery } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks"
import { Loader2, Send, RefreshCw } from "lucide-react"
import { renderToString } from "react-dom/server"

// Import template components
import WelcomeEmail from "../templates/welcome-email"
import CoursePromoEmail from "../templates/course-promo-email"
import QuizPromoEmail from "../templates/quiz-promo-email"
import ReengagementEmail from "../templates/reengagement-email"

// Template types
const TEMPLATE_TYPES = [
  { id: "welcome", name: "Welcome Email", description: "Sent to new users when they sign up" },
  { id: "coursePromo", name: "Course Promotion", description: "Promotes new or featured courses" },
  { id: "quizPromo", name: "Quiz Promotion", description: "Encourages users to take quizzes" },
  { id: "reengagement", name: "Re-engagement", description: "Brings back inactive users" },
]

export default function EmailTemplateSystem() {
  const { toast } = useToast()
  const [activeTemplate, setActiveTemplate] = useState("welcome")
  const [subject, setSubject] = useState("")
  const [previewData, setPreviewData] = useState({
    name: "John Doe",
    email: "john@example.com",
  })
  const [isSending, setIsSending] = useState(false)

  // Fetch sample data for templates
  const { data: sampleData, isLoading } = useQuery({
    queryKey: ["emailSampleData"],
    queryFn: async () => {
      const response = await fetch("/api/admin/data")
      if (!response.ok) throw new Error("Failed to fetch sample data")
      return response.json()
    },
  })

  // Set default subject based on template type
  useEffect(() => {
    switch (activeTemplate) {
      case "welcome":
        setSubject("Welcome to Our Platform!")
        break
      case "coursePromo":
        setSubject("New Courses Just for You!")
        break
      case "quizPromo":
        setSubject("Test Your Knowledge!")
        break
      case "reengagement":
        setSubject("We Miss You!")
        break
      default:
        setSubject("")
    }
  }, [activeTemplate])

  // Render the selected template component with data
  const renderTemplate = () => {
    if (isLoading || !sampleData) {
      return (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 text-primary" />
        </div>
      )
    }

    try {
      switch (activeTemplate) {
        case "welcome":
          return <WelcomeEmail name={previewData.name} />
        case "coursePromo":
          return <CoursePromoEmail name={previewData.name} recommendedCourses={sampleData.courses} />
        case "quizPromo":
          return <QuizPromoEmail name={previewData.name} quizzes={sampleData.quizzes} />
        case "reengagement":
          return <ReengagementEmail name={previewData.name} />
        default:
          return <div>No template selected</div>
      }
    } catch (error) {
      console.error("Error rendering template:", error)
      return <div className="p-4 text-red-500">Error rendering template. Please check console for details.</div>
    }
  }

  // Get HTML string from template component
  const getTemplateHtml = () => {
    try {
      const templateComponent = renderTemplate()
      return renderToString(templateComponent)
    } catch (error) {
      console.error("Error rendering template to string:", error)
      return `<p>Error rendering email template: ${error instanceof Error ? error.message : "Unknown error"}</p>`
    }
  }

  // Handle send test email
  const handleSendTest = async () => {
    setIsSending(true)
    try {
      const html = getTemplateHtml()

      const response = await fetch("/api/admin/email/send-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject,
          html,
          recipient: {
            email: "test@example.com",
            name: "Test User",
          },
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Failed to send test email")
      }

      toast({
        title: "Test Email Sent",
        description: "Check your inbox for the test email",
      })
    } catch (error) {
      console.error("Error sending test email:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send test email",
        variant: "destructive",
      })
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Email Template System</CardTitle>
          <CardDescription>Preview and test email templates</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="welcome" value={activeTemplate} onValueChange={setActiveTemplate}>
            <div className="flex justify-between items-center mb-4">
              <TabsList>
                <TabsTrigger value="welcome">Welcome</TabsTrigger>
                <TabsTrigger value="coursePromo">Course Promo</TabsTrigger>
                <TabsTrigger value="quizPromo">Quiz Promo</TabsTrigger>
                <TabsTrigger value="reengagement">Re-engagement</TabsTrigger>
              </TabsList>

              <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="subject">Subject Line</Label>
                <Input
                  id="subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Enter subject line"
                />
              </div>

              <div className="flex space-x-2">
                <Button onClick={handleSendTest} disabled={isSending}>
                  {isSending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Send Test Email
                    </>
                  )}
                </Button>
              </div>
            </div>
          </Tabs>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Preview</CardTitle>
          <CardDescription>See how your email will look to recipients</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-4">
              <div>
                <Label htmlFor="preview-name">Recipient Name</Label>
                <Input
                  id="preview-name"
                  value={previewData.name}
                  onChange={(e) => setPreviewData({ ...previewData, name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="preview-email">Recipient Email</Label>
                <Input
                  id="preview-email"
                  value={previewData.email}
                  onChange={(e) => setPreviewData({ ...previewData, email: e.target.value })}
                />
              </div>
            </div>

            <div className="border rounded-md p-4 bg-white">
              <div className="border-b pb-2 mb-4">
                <div className="text-sm text-muted-foreground">From: Your Company &lt;noreply@yourcompany.com&gt;</div>
                <div className="text-sm text-muted-foreground">
                  To: {previewData.name} &lt;{previewData.email}&gt;
                </div>
                <div className="text-sm font-medium">Subject: {subject}</div>
              </div>
              <div className="prose prose-sm max-w-none dark:prose-invert">{renderTemplate()}</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
