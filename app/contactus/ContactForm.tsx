"use client"

import { useState, useTransition } from "react"
import { useForm } from "react-hook-form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { GlobalLoader } from '@/components/ui/loader'

import { createContactSubmission } from "@/app/actions/actions"
import { Bug, CreditCard, Lightbulb, HelpCircle, MessageSquare, ChevronRight, CheckCircle, Send, AlertCircle } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { cn } from "@/lib/utils"
import Logo from "@/components/shared/Logo"
import { LoadingSpinner } from "@/components/loaders/GlobalLoader"


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
    formState: { errors },
  } = useForm<ContactFormData>({
    defaultValues: {
      issueType: "",
      priority: "medium",
    },
  })

  const [success, setSuccess] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const selectedIssueType = watch("issueType")

  const onSubmit = async (data: ContactFormData) => {
    setSubmitError(null)
    
    startTransition(async () => {
      try {
        const result = await createContactSubmission(data)

        if (result.success) {
          setSuccess(true)
          reset()
        } else {
          throw new Error(result.error || "Something went wrong")
        }
      } catch (error: any) {
        setSubmitError(error.message || "Failed to submit the form. Please try again.")
      }
    })
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
    setSubmitError(null)
    reset()
  }

  if (isPending) {
    return (
      <div className="max-w-3xl mx-auto mt-10">
        <LoadingSpinner 
         
        />
      </div>
    )
  }
  
  return (
    <Card className="max-w-3xl mx-auto mt-10 shadow-md border-muted/40 overflow-hidden transition-all duration-300 hover:shadow-lg">
      <CardHeader className="text-center space-y-4 pb-6 border-b bg-muted/20">
        <div className="w-20 h-20 mx-auto mb-2 bg-primary/5 rounded-full p-4 flex items-center justify-center animate-pulse-subtle">
          <Logo />
        </div>
        <CardTitle className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-600 dark:from-primary dark:to-blue-400 animate-fade-in">
          Contact Us
        </CardTitle>
        <CardDescription className="mt-2 text-muted-foreground text-base max-w-md mx-auto leading-relaxed">
          Have questions or need help? We're here for you. Select an issue type below to get started.
        </CardDescription>
      </CardHeader>
      
      <CardContent className="pt-6">
        {success ? (
          <div className="text-center p-8 space-y-4 animate-in fade-in-50 slide-in-from-bottom-5 duration-500">
            <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center animate-pulse-subtle">
              <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <p className="text-2xl font-semibold">Thank you for reaching out!</p>
            <p className="text-muted-foreground max-w-md mx-auto">
              We've received your message and will get back to you as soon as possible. You should receive a
              confirmation email shortly.
            </p>
            <Button onClick={resetForm} variant="outline" className="mt-4">
              <MessageSquare className="mr-2 h-4 w-4" />
              Send another message
            </Button>
          </div>
        ) : (
          <Tabs defaultValue="guided" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger
                value="guided"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <Lightbulb className="mr-2 h-4 w-4" />
                Guided Form
              </TabsTrigger>
              <TabsTrigger
                value="direct"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <MessageSquare className="mr-2 h-4 w-4" />
                Direct Message
              </TabsTrigger>
            </TabsList>

            {submitError && (
              <Alert variant="destructive" className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{submitError}</AlertDescription>
              </Alert>
            )}

            <TabsContent value="guided">
              <div className="space-y-6">
                {currentStep === 1 && (
                  <div className="space-y-4 animate-in fade-in-50 slide-in-from-bottom-5 duration-300">
                    <h3 className="text-lg font-medium flex items-center">
                      <HelpCircle className="mr-2 h-5 w-5 text-primary" />
                      What can we help you with?
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {issueTypes.map((issue) => {
                        const Icon = issue.icon
                        return (
                          <button
                            key={issue.value}
                            type="button"
                            onClick={() => handleIssueSelect(issue.value)}
                            className={cn(
                              "flex items-start p-4 rounded-lg border-2 text-left transition-all duration-300 hover:border-primary/50 hover:bg-primary/5 hover:shadow-sm",
                              selectedIssueType === issue.value ? "border-primary bg-primary/5" : "border-muted",
                              "group focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                            )}
                            aria-pressed={selectedIssueType === issue.value}
                          >
                            <div className="mr-4 mt-0.5">
                              <div className="p-2 rounded-md bg-primary/10 text-primary group-hover:bg-primary/20 transition-colors">
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
                  <form
                    onSubmit={handleSubmit(onSubmit)}
                    className="space-y-6 animate-in fade-in-50 slide-in-from-bottom-5 duration-300"
                  >
                    <div className="flex items-center mb-6 bg-muted/30 p-3 rounded-lg">
                      <button
                        type="button"
                        onClick={() => setCurrentStep(1)}
                        className="flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
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

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="name" className="text-sm font-medium">
                          Your Name *
                        </Label>
                        <Input
                          id="name"
                          {...register("name", { required: "Name is required" })}
                          placeholder="Full Name"
                          className={cn(
                            "transition-all duration-200",
                            errors.name ? "border-red-300 focus-visible:ring-red-300" : "focus-visible:ring-primary"
                          )}
                          aria-invalid={errors.name ? "true" : "false"}
                          aria-describedby={errors.name ? "name-error" : undefined}
                        />
                        {errors.name && (
                          <p className="text-sm text-red-500" id="name-error" role="alert">
                            {errors.name.message}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-sm font-medium">
                          Email Address *
                        </Label>
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
                          className={cn(
                            "transition-all duration-200",
                            errors.email ? "border-red-300 focus-visible:ring-red-300" : "focus-visible:ring-primary"
                          )}
                          aria-invalid={errors.email ? "true" : "false"}
                          aria-describedby={errors.email ? "email-error" : undefined}
                        />
                        {errors.email && (
                          <p className="text-sm text-red-500" id="email-error" role="alert">
                            {errors.email.message}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Label className="text-sm font-medium">Priority Level</Label>
                      <RadioGroup
                        defaultValue="medium"
                        className="grid grid-cols-3 gap-4 mt-2"
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
                                "flex flex-col items-center justify-between rounded-md border-2 border-muted p-4 hover:bg-primary/5 hover:border-primary/50 [&:has([data-state=checked])]:border-primary [&:has([data-state=checked])]:bg-primary/5",
                                priority.value === "high" &&
                                  "[&:has([data-state=checked])]:border-red-500 [&:has([data-state=checked])]:bg-red-50 dark:[&:has([data-state=checked])]:bg-red-950/10",
                                "transition-all cursor-pointer focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2",
                              )}
                            >
                              <span
                                className={cn(
                                  "text-sm font-medium text-center",
                                  priority.value === "high" && "text-red-600 dark:text-red-400",
                                )}
                              >
                                {priority.label}
                              </span>
                            </Label>
                          </div>
                        ))}
                      </RadioGroup>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="message" className="text-sm font-medium">
                        Message *
                      </Label>
                      <Textarea
                        id="message"
                        {...register("message", { required: "Message is required" })}
                        placeholder={getPlaceholderByIssueType(selectedIssueType)}
                        className={cn(
                          "min-h-[160px] resize-y transition-all duration-200",
                          errors.message ? "border-red-300 focus-visible:ring-red-300" : "focus-visible:ring-primary"
                        )}
                        aria-invalid={errors.message ? "true" : "false"}
                        aria-describedby={errors.message ? "message-error" : undefined}
                      />
                      {errors.message && (
                        <p className="text-sm text-red-500" id="message-error" role="alert">
                          {errors.message.message}
                        </p>
                      )}
                    </div>

                    <Button
                      type="submit"
                      disabled={isPending}
                      className="w-full h-12 text-base font-medium transition-all duration-300 hover:shadow-md active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Send className="mr-2 h-4 w-4" />
                      Submit Message
                    </Button>
                  </form>
                )}
              </div>
            </TabsContent>

            <TabsContent value="direct">
              <form
                onSubmit={handleSubmit(onSubmit)}
                className="space-y-6 animate-in fade-in-50 slide-in-from-bottom-5 duration-300"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="direct-name" className="text-sm font-medium">
                      Your Name *
                    </Label>
                    <Input
                      id="direct-name"
                      {...register("name", { required: "Name is required" })}
                      placeholder="Full Name"
                      className={cn(
                        "transition-all duration-200",
                        errors.name ? "border-red-300 focus-visible:ring-red-300" : "focus-visible:ring-primary"
                      )}
                      aria-invalid={errors.name ? "true" : "false"}
                    />
                    {errors.name && (
                      <p className="text-sm text-red-500" role="alert">
                        {errors.name.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="direct-email" className="text-sm font-medium">
                      Email Address *
                    </Label>
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
                      className={cn(
                        "transition-all duration-200",
                        errors.email ? "border-red-300 focus-visible:ring-red-300" : "focus-visible:ring-primary"
                      )}
                      aria-invalid={errors.email ? "true" : "false"}
                    />
                    {errors.email && (
                      <p className="text-sm text-red-500" role="alert">
                        {errors.email.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="direct-issue" className="text-sm font-medium">
                    Issue Type *
                  </Label>
                  <Select onValueChange={(value) => setValue("issueType", value)}>
                    <SelectTrigger 
                      id="direct-issue" 
                      className={cn(
                        "transition-all duration-200",
                        !selectedIssueType ? "text-muted-foreground" : "",
                        "focus:ring-2 focus:ring-primary focus:ring-offset-2"
                      )}
                    >
                      <SelectValue placeholder="Select an issue type" />
                    </SelectTrigger>
                    <SelectContent>
                      {issueTypes.map((issue) => {
                        const Icon = issue.icon
                        return (
                          <SelectItem key={issue.value} value={issue.value}>
                            <div className="flex items-center">
                              <Icon className="h-4 w-4 mr-2 text-primary" />
                              {issue.label}
                            </div>
                          </SelectItem>
                        )
                      })}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="direct-message" className="text-sm font-medium">
                    Message *
                  </Label>
                  <Textarea
                    id="direct-message"
                    {...register("message", { required: "Message is required" })}
                    placeholder="How can we help you today?"
                    className={cn(
                      "min-h-[160px] resize-y transition-all duration-200",
                      errors.message ? "border-red-300 focus-visible:ring-red-300" : "focus-visible:ring-primary"
                    )}
                    aria-invalid={errors.message ? "true" : "false"}
                  />
                  {errors.message && (
                    <p className="text-sm text-red-500" role="alert">
                      {errors.message.message}
                    </p>
                  )}
                </div>

                <Button 
                  type="submit" 
                  disabled={isPending} 
                  className="w-full h-12 text-base font-medium transition-all duration-300 hover:shadow-md active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="mr-2 h-4 w-4" />
                  Send Message
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  )
}