"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "@/hooks/use-toast"
import Logo from "@/components/shared/Logo"
import { createContactSubmission } from "@/app/actions/actions"
import { Loader2, Bug, CreditCard, Lightbulb, HelpCircle, MessageSquare, ChevronRight, CheckCircle } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"

interface ContactFormData {
  name: string
  email: string
  issueType: string
  priority: string
  message: string
}

const issueTypes = [
  { value: "bug", label: "Bug Report", icon: Bug, description: "Report a technical issue or error" },
  { value: "payment", label: "Payment Issue", icon: CreditCard, description: "Problems with billing or payments" },
  { value: "suggestion", label: "Suggestion", icon: Lightbulb, description: "Ideas for new features or improvements" },
  {
    value: "question",
    label: "General Question",
    icon: HelpCircle,
    description: "Any other questions about our services",
  },
  { value: "other", label: "Other", icon: MessageSquare, description: "Something else we didn't cover" },
]

const priorityLevels = [
  { value: "low", label: "Low - Not urgent" },
  { value: "medium", label: "Medium - Needs attention" },
  { value: "high", label: "High - Urgent issue" },
]

export default function ImprovedContactForm() {
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ContactFormData>({
    defaultValues: {
      issueType: "",
      priority: "medium",
    },
  })

  const [success, setSuccess] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  const selectedIssueType = watch("issueType")

  const onSubmit = async (data: ContactFormData) => {
    try {
      // Save to database using server action
      const result = await createContactSubmission(data)

      if (result.success) {
        setSuccess(true)
        reset()
        toast({ title: "Success!", description: "Your message has been sent. We'll get back to you soon." })
      } else {
        throw new Error(result.error || "Something went wrong")
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to submit the form. Please try again.", variant: "destructive" })
    }
  }

  const handleIssueSelect = (value: string) => {
    setValue("issueType", value)
    setCurrentStep(2)
  }

  const getIssueIcon = (type: string) => {
    const issue = issueTypes.find((i) => i.value === type)
    if (!issue) return <MessageSquare className="h-5 w-5" />

    const IssueIcon = issue.icon
    return <IssueIcon className="h-5 w-5" />
  }

  const getPlaceholderByIssueType = (type: string) => {
    switch (type) {
      case "bug":
        return "Please describe the bug in detail. What happened? What were you expecting to happen? Steps to reproduce?"
      case "payment":
        return "Please describe your payment issue. Include order/transaction ID if available."
      case "suggestion":
        return "We'd love to hear your ideas! Please describe your suggestion in detail."
      case "question":
        return "What would you like to know about our services?"
      default:
        return "How can we help you today?"
    }
  }

  const resetForm = () => {
    setSuccess(false)
    setCurrentStep(1)
    reset()
  }

  return (
    <Card className="max-w-3xl mx-auto mt-10 shadow-md border-muted/40">
      <CardHeader className="text-center space-y-4 pb-6 border-b">
        <div className="w-20 h-20 mx-auto mb-2">
          <Logo />
        </div>
        <CardTitle className="text-3xl font-bold tracking-tight">Contact Us</CardTitle>
        <CardDescription className="mt-2 text-muted-foreground text-base max-w-md mx-auto leading-relaxed">
          Have questions or need help? We're here for you. Select an issue type below to get started.
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        {success ? (
          <div className="text-center p-8 space-y-4">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-primary" />
            </div>
            <p className="text-2xl font-semibold">Thank you for reaching out!</p>
            <p className="text-muted-foreground">
              We've received your message and will get back to you as soon as possible.
            </p>
            <Button onClick={resetForm} variant="outline" className="mt-4">
              Send another message
            </Button>
          </div>
        ) : (
          <Tabs defaultValue="guided" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="guided">Guided Form</TabsTrigger>
              <TabsTrigger value="direct">Direct Message</TabsTrigger>
            </TabsList>

            <TabsContent value="guided">
              <div className="space-y-6">
                {currentStep === 1 && (
                  <div className="space-y-4 animate-in fade-in-50">
                    <h3 className="text-lg font-medium">What can we help you with?</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {issueTypes.map((issue) => {
                        const Icon = issue.icon
                        return (
                          <button
                            key={issue.value}
                            type="button"
                            onClick={() => handleIssueSelect(issue.value)}
                            className={cn(
                              "flex items-start p-4 rounded-lg border-2 text-left transition-all hover:border-primary/50 hover:bg-primary/5",
                              selectedIssueType === issue.value ? "border-primary bg-primary/5" : "border-muted",
                            )}
                          >
                            <div className="mr-4 mt-0.5">
                              <div className="p-2 rounded-md bg-primary/10 text-primary">
                                <Icon className="h-5 w-5" />
                              </div>
                            </div>
                            <div>
                              <h4 className="font-medium">{issue.label}</h4>
                              <p className="text-sm text-muted-foreground">{issue.description}</p>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}

                {currentStep === 2 && (
                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 animate-in fade-in-50">
                    <div className="flex items-center mb-6">
                      <button
                        type="button"
                        onClick={() => setCurrentStep(1)}
                        className="flex items-center text-sm text-muted-foreground hover:text-foreground"
                      >
                        <ChevronRight className="h-4 w-4 rotate-180 mr-1" />
                        Back to issue types
                      </button>
                      <div className="ml-auto flex items-center gap-2 bg-primary/10 px-3 py-1.5 rounded-full">
                        {getIssueIcon(selectedIssueType)}
                        <span className="text-sm font-medium">
                          {issueTypes.find((i) => i.value === selectedIssueType)?.label || "Contact"}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="name">Your Name</Label>
                        <Input
                          id="name"
                          {...register("name", { required: "Name is required" })}
                          placeholder="Full Name"
                          className="mt-1.5"
                        />
                        {errors.name && <p className="mt-1.5 text-sm text-destructive">{errors.name.message}</p>}
                      </div>

                      <div>
                        <Label htmlFor="email">Email Address</Label>
                        <Input
                          id="email"
                          type="email"
                          {...register("email", {
                            required: "Email is required",
                            pattern: {
                              value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                              message: "Invalid email address",
                            },
                          })}
                          placeholder="you@example.com"
                          className="mt-1.5"
                        />
                        {errors.email && <p className="mt-1.5 text-sm text-destructive">{errors.email.message}</p>}
                      </div>
                    </div>

                    <div>
                      <Label>Priority Level</Label>
                      <RadioGroup
                        defaultValue="medium"
                        className="grid grid-cols-3 gap-4 mt-1.5"
                        onValueChange={(value) => setValue("priority", value)}
                      >
                        {priorityLevels.map((priority) => (
                          <div key={priority.value}>
                            <RadioGroupItem
                              value={priority.value}
                              id={`priority-${priority.value}`}
                              className="peer sr-only"
                            />
                            <Label
                              htmlFor={`priority-${priority.value}`}
                              className={cn(
                                "flex flex-col items-center justify-between rounded-md border-2 border-muted p-3 hover:bg-primary/5 hover:border-primary/50 [&:has([data-state=checked])]:border-primary [&:has([data-state=checked])]:bg-primary/5",
                                priority.value === "high" &&
                                  "[&:has([data-state=checked])]:border-red-500 [&:has([data-state=checked])]:bg-red-50",
                              )}
                            >
                              <span className={cn("text-sm font-medium", priority.value === "high" && "text-red-600")}>
                                {priority.label}
                              </span>
                            </Label>
                          </div>
                        ))}
                      </RadioGroup>
                    </div>

                    <div>
                      <Label htmlFor="message">Message</Label>
                      <Textarea
                        id="message"
                        {...register("message", { required: "Message is required" })}
                        placeholder={getPlaceholderByIssueType(selectedIssueType)}
                        className="mt-1.5 min-h-[160px] resize-y"
                      />
                      {errors.message && <p className="mt-1.5 text-sm text-destructive">{errors.message.message}</p>}
                    </div>

                    <Button type="submit" disabled={isSubmitting} className="w-full h-11 text-base font-medium">
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        "Submit"
                      )}
                    </Button>
                  </form>
                )}
              </div>
            </TabsContent>

            <TabsContent value="direct">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="direct-name">Your Name</Label>
                    <Input
                      id="direct-name"
                      {...register("name", { required: "Name is required" })}
                      placeholder="Full Name"
                      className="mt-1.5"
                    />
                    {errors.name && <p className="mt-1.5 text-sm text-destructive">{errors.name.message}</p>}
                  </div>

                  <div>
                    <Label htmlFor="direct-email">Email Address</Label>
                    <Input
                      id="direct-email"
                      type="email"
                      {...register("email", {
                        required: "Email is required",
                        pattern: {
                          value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                          message: "Invalid email address",
                        },
                      })}
                      placeholder="you@example.com"
                      className="mt-1.5"
                    />
                    {errors.email && <p className="mt-1.5 text-sm text-destructive">{errors.email.message}</p>}
                  </div>
                </div>

                <div>
                  <Label htmlFor="direct-issue">Issue Type</Label>
                  <Select onValueChange={(value) => setValue("issueType", value)}>
                    <SelectTrigger id="direct-issue" className="mt-1.5">
                      <SelectValue placeholder="Select an issue type" />
                    </SelectTrigger>
                    <SelectContent>
                      {issueTypes.map((issue) => {
                        const Icon = issue.icon
                        return (
                          <SelectItem key={issue.value} value={issue.value}>
                            <div className="flex items-center">
                              <Icon className="h-4 w-4 mr-2 text-muted-foreground" />
                              {issue.label}
                            </div>
                          </SelectItem>
                        )
                      })}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="direct-message">Message</Label>
                  <Textarea
                    id="direct-message"
                    {...register("message", { required: "Message is required" })}
                    placeholder="How can we help you today?"
                    className="mt-1.5 min-h-[160px] resize-y"
                  />
                  {errors.message && <p className="mt-1.5 text-sm text-destructive">{errors.message.message}</p>}
                </div>

                <Button type="submit" disabled={isSubmitting} className="w-full h-11 text-base font-medium">
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    "Send Message"
                  )}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  )
}
