"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

export function EmailTemplateEditor() {
  const [activeTab, setActiveTab] = useState("welcome")
  const [htmlContent, setHtmlContent] = useState<Record<string, string>>({
    welcome: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2>Welcome, {{name}}!</h2>
  <p>Thank you for joining our platform. We're excited to have you on board!</p>
  <p>Explore our courses, track your progress, and connect with other learners.</p>
  <p>Best regards,<br>The Team</p>
</div>`,
    quizPromo: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2>Test Your Knowledge, {{name}}!</h2>
  <p>We've curated some exciting quizzes based on your interests.</p>
  <p>Challenge yourself and see how much you know!</p>
  <p>Best regards,<br>The Team</p>
</div>`,
    coursePromo: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2>Courses Tailored Just for You, {{name}}!</h2>
  <p>Based on your interests and activity, we've selected these courses that we think you'll love.</p>
  <p>Best regards,<br>The Team</p>
</div>`,
    reengagement: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2>We Miss You, {{name}}!</h2>
  <p>It's been a while since we've seen you on our platform.</p>
  <p>We've added lots of new content that we think you'll love!</p>
  <p>Best regards,<br>The Team</p>
</div>`,
  })

  const [subjects, setSubjects] = useState<Record<string, string>>({
    welcome: "Welcome to Our Platform!",
    quizPromo: "Discover Our Latest Quizzes",
    coursePromo: "Courses Tailored Just for You",
    reengagement: "We Miss You! Come Back and Explore",
  })

  const handleHtmlChange = (template: string, value: string) => {
    setHtmlContent((prev) => ({
      ...prev,
      [template]: value,
    }))
  }

  const handleSubjectChange = (template: string, value: string) => {
    setSubjects((prev) => ({
      ...prev,
      [template]: value,
    }))
  }

  const handleSaveTemplate = async () => {
    // In a real app, this would save to your backend
    alert(`Template ${activeTab} saved successfully!`)
  }

  const handleSendTest = async () => {
    // In a real app, this would send a test email
    alert(`Test email for ${activeTab} template sent!`)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Email Template Editor</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="welcome" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="welcome">Welcome</TabsTrigger>
              <TabsTrigger value="quizPromo">Quiz Promo</TabsTrigger>
              <TabsTrigger value="coursePromo">Course Promo</TabsTrigger>
              <TabsTrigger value="reengagement">Re-engagement</TabsTrigger>
            </TabsList>

            {["welcome", "quizPromo", "coursePromo", "reengagement"].map((template) => (
              <TabsContent key={template} value={template}>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor={`${template}-subject`}>Subject Line</Label>
                    <Input
                      id={`${template}-subject`}
                      value={subjects[template]}
                      onChange={(e) => handleSubjectChange(template, e.target.value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor={`${template}-html`}>HTML Content</Label>
                    <Textarea
                      id={`${template}-html`}
                      value={htmlContent[template]}
                      onChange={(e) => handleHtmlChange(template, e.target.value)}
                      className="min-h-[300px] font-mono text-sm"
                    />
                  </div>

                  <div className="flex space-x-2">
                    <Button onClick={handleSaveTemplate}>Save Template</Button>
                    <Button variant="outline" onClick={handleSendTest}>
                      Send Test Email
                    </Button>
                  </div>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border rounded-md p-4">
            <div
              dangerouslySetInnerHTML={{
                __html: htmlContent[activeTab].replace(/{{name}}/g, "John Doe"),
              }}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

