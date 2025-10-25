"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useMutation } from "@tanstack/react-query"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { api } from "@/lib/api-helper"
import { useSession } from "next-auth/react"
import {
  HelpCircle,
  Timer,
  Sparkles,
  Check,
  AlertCircle,
  Lightbulb,
} from "lucide-react"
import { motion } from "framer-motion"
import { ContextualAuthPrompt, useContextualAuth } from "@/components/auth/ContextualAuthPrompt"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

import { usePersistentState } from "@/lib/storage"
import { cn } from "@/lib/utils"
import { codeQuizSchema } from "@/schema/schema"
import { Skeleton } from "@/components/ui/skeleton"

import type { z } from "zod"
import { SubscriptionSlider } from "@/app/dashboard/subscription/components/SubscriptionSlider"
import type { QueryParams } from "@/app/types/types"
import { useUnifiedSubscription } from "@/hooks/useUnifiedSubscription"
import { ConfirmDialog } from "../../components/ConfirmDialog"
import PlanAwareButton from "@/components/quiz/PlanAwareButton"
import FormContainer from "@/app/dashboard/FormContainer"
import { useToast } from "@/components/ui/use-toast"

type CodeQuizFormData = z.infer<typeof codeQuizSchema> & {
  userType?: string
}

interface CodeQuizFormProps {
  credits: number
  isLoggedIn: boolean
  maxQuestions: number
  params?: QueryParams
}

interface Subscription {
  subscriptionPlan?: string
}

export default function CodeQuizForm({ credits, isLoggedIn, maxQuestions, params }: CodeQuizFormProps) {
  const router = useRouter()
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(false)
  const [submitError, setSubmitError] = React.useState<string | null>(null)
  const { data: session, status } = useSession()

  const { subscription: subscriptionData } = useUnifiedSubscription()

  const { toast } = useToast()
  const { requireAuth, authPrompt, closeAuthPrompt } = useContextualAuth()

  // Credit information state for consistent display
  const [creditInfo, setCreditInfo] = React.useState({
    hasCredits: false,
    remainingCredits: credits,
    totalCredits: 0,
    usedCredits: 0
  })

  // Use unified subscription as single source of truth - fixes sync issues
  // Extract stable primitive values to prevent infinite loops
  const subscriptionCredits = subscriptionData?.credits ?? 0
  const subscriptionTokensUsed = subscriptionData?.tokensUsed ?? 0
  
  React.useEffect(() => {
    const totalCredits = subscriptionCredits
    const usedCredits = subscriptionTokensUsed
    const remainingCredits = Math.max(0, totalCredits - usedCredits)
    
    setCreditInfo({
      hasCredits: remainingCredits > 0,
      remainingCredits: remainingCredits,
      totalCredits: totalCredits,
      usedCredits: usedCredits
    })
  }, [subscriptionCredits, subscriptionTokensUsed])

  const [formData, setFormData] = usePersistentState<CodeQuizFormData>("codeQuizFormData", {
    title: (typeof params?.title === "string" ? params.title : "") || "",
    amount: (typeof params?.amount === "string" ? Number.parseInt(params.amount, 10) : maxQuestions) || maxQuestions,
    difficulty: (typeof params?.difficulty === "string" && ["easy", "medium", "hard"].includes(params.difficulty)
      ? params.difficulty
      : "easy") as "easy" | "medium" | "hard",
  })

  const {
    control,
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isValid },
  } = useForm<CodeQuizFormData>({
    resolver: zodResolver(codeQuizSchema),
    defaultValues: formData,
    mode: "onChange",
  })

  React.useEffect(() => {
    if (typeof params?.title === "string") {
      setValue("title", params.title)
    }
    if (typeof params?.amount === "string") {
      const amount = Number.parseInt(params.amount, 10)
      if (amount !== maxQuestions) {
        setValue("amount", Math.min(amount, maxQuestions))
      }
    }
    if (typeof params?.difficulty === "string" && ["easy", "medium", "hard"].includes(params.difficulty)) {
      setValue("difficulty", params.difficulty as "easy" | "medium" | "hard")
    }
  }, [params?.title, params?.amount, params?.difficulty, maxQuestions, setValue])

  React.useEffect(() => {
    const subscription = watch((value: any) => setFormData(value as CodeQuizFormData))
    return () => subscription.unsubscribe()
  }, [watch, setFormData])

  const { mutateAsync: createCodeQuizMutation } = useMutation({
    mutationFn: async (data: CodeQuizFormData) => {
      data.userType = subscriptionData?.subscriptionPlan
      const response = await api.post("/api/quizzes/code/create", data)
      return response // api.post already returns the parsed JSON
    },
    onError: (error: any) => {
      console.error("Error creating code quiz:", error)
      setSubmitError(error?.response?.data?.message || "Failed to create code quiz. Please try again.")
      toast({ title: "Error", description: error?.response?.data?.message || "Failed to create code quiz.", variant: "destructive" })
    },
  })

  const onSubmit = React.useCallback(
    (data: CodeQuizFormData) => {
      // Prevent multiple submissions
      if (isLoading || isConfirmDialogOpen) return

      // Get current form values to ensure we have the latest data
      const currentValues = watch()

      // Validate required fields with current values
      if (!currentValues.title?.trim()) {
        setSubmitError("Please enter a topic/title")
        return
      }

      if (!currentValues.amount || currentValues.amount < 1 || currentValues.amount > maxQuestions) {
        setSubmitError(`Please select between 1 and ${maxQuestions} questions`)
        return
      }

      if (!currentValues.difficulty) {
        setSubmitError("Please select a difficulty level")
        return
      }

      // ✅ NEW: Use contextual auth prompt instead of redirect
      if (!isLoggedIn) {
        const hasAuth = requireAuth('create_quiz', `${currentValues.amount} coding questions on "${currentValues.title}"`)
        if (!hasAuth) return // Auth prompt will be shown
      }

      // Clear any previous errors
      setSubmitError(null)

      // Store current form values before opening dialog
      setFormData(currentValues)

      // Open confirmation dialog
      setIsConfirmDialogOpen(true)
    },
    [isLoading, isConfirmDialogOpen, maxQuestions, isLoggedIn, watch, setFormData],
  )

  const handleConfirm = React.useCallback(async () => {
    // Prevent multiple confirmations
    if (isLoading) return

    setIsLoading(true)
    setSubmitError(null)

    try {
      // Use stored form data to ensure consistency
      const formValues = formData

      // Final validation before submission
      if (!formValues.title || !formValues.amount || !formValues.difficulty) {
        throw new Error("Please complete all required fields")
      }

  const response = await createCodeQuizMutation({
        title: formValues.title.trim(),
        amount: formValues.amount,
        difficulty: formValues.difficulty,
        userType: subscriptionData?.subscriptionPlan,
  })

      if (!response?.userQuizId || !response?.slug) {
        throw new Error("Invalid response from server")
      }

      // Close dialog before navigation
      setIsConfirmDialogOpen(false)

      toast({ title: "Success!", description: "Your code quiz has been created." })

      // Navigate to the quiz
      router.push(`/dashboard/code/${response.slug}`)
    } catch (error) {
      console.error("Code quiz creation error:", error)
      const errorMessage = error instanceof Error ? error.message : "Failed to create quiz"
      setSubmitError(errorMessage)
      toast({ title: "Error", description: errorMessage, variant: "destructive" })
      // Keep dialog open to show error
    } finally {
      setIsLoading(false)
    }
  }, [createCodeQuizMutation, formData, router, subscriptionData?.subscriptionPlan, toast])

  const amount = watch("amount")
  const difficulty = watch("difficulty")
  const title = watch("title")

  const isFormValid = React.useMemo(() => {
    return !!title && !!amount && !!difficulty && isValid
  }, [title, amount, difficulty, isValid])

  const isDisabled = React.useMemo(() => credits < 1 || !isFormValid || isLoading, [credits, isFormValid, isLoading])

  const difficultyOptions = React.useMemo(() => {
    return [
      {
        value: "easy",
        label: "Easy",
        icon: "🟢",
        color: "bg-[var(--color-success)] text-[var(--color-bg)] shadow-lg",
      },
      {
        value: "medium",
        label: "Medium",
        icon: "🟡",
        color: "bg-[var(--color-warning)] text-[var(--color-bg)] shadow-lg",
      },
      {
        value: "hard",
        label: "Hard",
        icon: "🔴",
        color: "bg-[var(--color-error)] text-[var(--color-bg)] shadow-lg",
      },
    ]
  }, [])

  const creditPercentage = React.useMemo(() => {
    if (typeof credits !== "number" || isNaN(credits) || credits <= 0) {
      return 0
    }
    const maxCreditDisplay = 100
    return Math.min((credits / maxCreditDisplay) * 100, 100)
  }, [credits])

  if (isLoading && !isConfirmDialogOpen) {
    return (
      <FormContainer>
        <Skeleton className="space-y-3">
          <Skeleton className="h-6 w-36" />
          <Skeleton className="h-48 w-full" />
        </Skeleton>
      </FormContainer>
    )
  }

  return (
    <div className="w-full max-w-4xl mx-auto neuro-strong-typography">
      {submitError && !isConfirmDialogOpen && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{submitError}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Help Section */}
        <motion.div
          className="border-2 border-border bg-card p-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex items-start gap-3">
            <Lightbulb className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <div className="space-y-2 text-sm">
              <p className="font-bold text-foreground">💡 Get Maximum Value from Your Quiz</p>
              <ul className="space-y-1 text-muted-foreground">
                <li>✓ <strong>Be specific:</strong> "React Hooks (useState, useEffect)" instead of just "React"</li>
                <li>✓ <strong>Include concepts:</strong> Mention patterns, edge cases, or specific methods</li>
                <li>✓ <strong>Add context:</strong> "Python async/await for web scraping" gives better results</li>
                <li>✓ <strong>Name the language:</strong> Include it in your topic (e.g., "JavaScript closures")</li>
              </ul>
            </div>
          </div>
        </motion.div>

        {/* Topic/Title Selection */}
        <motion.div
          className="space-y-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Label htmlFor="title" className="text-base font-bold text-foreground">
            What coding topic do you want to master?
            <span className="text-destructive ml-1">*</span>
          </Label>

          <div className="relative">
            <Input
              id="title"
              placeholder="E.g., JavaScript async/await, Python decorators, React Hooks patterns"
              className="h-12 border-2 text-base focus:ring-0 focus:border-primary pr-12"
              {...register("title")}
              aria-describedby="title-hint"
              aria-invalid={errors.title ? "true" : "false"}
            />
            <Sparkles className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
          </div>

          {errors.title && (
            <motion.p
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="text-sm text-destructive"
              id="title-error"
              role="alert"
            >
              {errors.title.message}
            </motion.p>
          )}

          <p className="text-xs text-muted-foreground" id="title-hint">
            💡 Include the programming language in your topic (e.g., "Python list comprehensions", "TypeScript generics")
          </p>
        </motion.div>

        {/* Number of Questions */}
        <motion.div
          className="space-y-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Label className="text-base font-bold text-foreground">
            Number of Questions
          </Label>

          <div className="space-y-4 border-2 border-border p-4 bg-card">
            <div className="flex items-center justify-between">
              <Timer className="w-6 h-6 text-foreground" />
              <motion.span
                className="text-4xl font-bold text-primary tabular-nums"
                key={amount}
                initial={{ scale: 1.2 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 10 }}
              >
                {amount}
              </motion.span>
            </div>

            <Controller
              name="amount"
              control={control}
              render={({ field }) => (
                <SubscriptionSlider
                  value={field.value}
                  onValueChange={(value) => field.onChange(value)}
                  ariaLabel="Select number of questions"
                />
              )}
            />

            <p className="text-sm text-muted-foreground">
              Select between 1 and {maxQuestions} questions
            </p>
          </div>

          {errors.amount && (
            <motion.p
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="text-sm text-destructive"
              role="alert"
            >
              {errors.amount.message}
            </motion.p>
          )}
        </motion.div>

        {/* Difficulty */}
        <motion.div
          className="space-y-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Label className="text-base font-bold text-foreground">
            Difficulty Level
            <span className="text-destructive ml-1">*</span>
          </Label>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {difficultyOptions.map((level) => (
              <Button
                key={level.value}
                type="button"
                variant={difficulty === level.value ? "default" : "outline"}
                className={cn(
                  "h-12 font-bold border-2 transition-all text-base",
                  difficulty === level.value
                    ? "border-primary bg-primary text-primary-foreground shadow-[3px_3px_0px_0px_hsl(var(--foreground))]"
                    : "border-border bg-card hover:border-primary hover:shadow-[2px_2px_0px_0px_hsl(var(--foreground))]",
                )}
                onClick={() => setValue("difficulty", level.value as "easy" | "medium" | "hard")}
                aria-pressed={difficulty === level.value}
              >
                <span className="mr-2">{level.icon}</span>
                {level.label}
                {difficulty === level.value && <Check className="ml-2 h-4 w-4" />}
              </Button>
            ))}
          </div>

          {difficulty && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="border-2 border-border bg-muted/50 p-3 text-sm"
            >
              <p className="font-semibold text-foreground">
                {difficultyOptions.find(d => d.value === difficulty)?.label}:
              </p>
              <p className="text-muted-foreground text-xs mt-1">
                {difficulty === "easy" && "Basic syntax, variables, loops. Examples: Hello World, simple calculations. 5-10 minutes per question."}
                {difficulty === "medium" && "Functions, arrays, conditionals. Examples: Sorting algorithms, data validation. 10-15 minutes per question."}
                {difficulty === "hard" && "Advanced algorithms, data structures. Examples: Binary trees, dynamic programming. 15-20 minutes per question."}
              </p>
            </motion.div>
          )}
        </motion.div>

        {/* Available Credits */}
        <motion.div
          className="border-2 border-border bg-card p-4 space-y-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <h3 className="font-bold text-foreground flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Available Credits
          </h3>
          <Progress value={creditInfo.totalCredits > 0 ? (creditInfo.remainingCredits / creditInfo.totalCredits) * 100 : 0} className="h-3 border-2 border-border" />
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">{creditInfo.remainingCredits}</span> remaining
            <span className="mx-2">•</span>
            <span className="font-semibold text-foreground">{creditInfo.usedCredits}</span> used of{" "}
            <span className="font-semibold text-foreground">{creditInfo.totalCredits}</span> total
          </p>
        </motion.div>

        {/* Submit Button */}
        <motion.div
          className="pt-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <PlanAwareButton
            label="Generate Code Quiz"
            onClick={handleSubmit(onSubmit)}
            isLoggedIn={isLoggedIn}
            isEnabled={!isDisabled}
            isLoading={isLoading}
            loadingLabel="Generating Quiz..."
            className="w-full h-14 text-lg font-bold border-2 border-primary bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed shadow-[4px_4px_0px_0px_hsl(var(--foreground))]"
            customStates={{
              default: {
                tooltip: "Click to generate your quiz",
              },
              notEnabled: {
                label: "Complete form to generate",
                tooltip: "Please complete the form before generating the quiz",
              },
              noCredits: {
                label: "Out of credits",
                tooltip: "You need credits to generate a quiz. Consider upgrading your plan.",
              },
            }}
          />
        </motion.div>
      </form>

      {/* ✅ NEW: Contextual auth prompt - shows when user tries to create without signing in */}
      <ContextualAuthPrompt
        open={authPrompt.open}
        onOpenChange={closeAuthPrompt}
        actionType={authPrompt.actionType}
        actionContext={authPrompt.actionContext}
      />

      <ConfirmDialog
        isOpen={isConfirmDialogOpen}
        onConfirm={handleConfirm}
        onCancel={() => {
          setIsConfirmDialogOpen(false)
          setIsLoading(false)
          setSubmitError(null)
        }}
        title="Generate Code Quiz"
        description="You are about to use AI to generate a code quiz. This will use credits from your account."
        confirmText="Generate Now"
        cancelText="Cancel"
        showCreditUsage={true}
        status={isLoading ? "loading" : submitError ? "error" : undefined}
        errorMessage={submitError ?? undefined}
        creditUsage={{
          used: Math.max(0, maxQuestions - credits),
          available: maxQuestions,
          remaining: credits,
          percentage: (Math.max(0, maxQuestions - credits) / maxQuestions) * 100,
        }}
        quizInfo={{
          type: "Code Quiz",
          topic: formData.title || "Not specified",
          count: formData.amount || 1,
          difficulty: formData.difficulty || "easy",
          estimatedCredits: Math.min(formData.amount || 1, 5),
        }}
      >
        <div className="py-2">
          <p className="text-sm">
            Generating {formData.amount || 1} code questions at{" "}
            <span className="font-medium capitalize">{formData.difficulty || "easy"}</span> difficulty level on topic:{" "}
            <span className="font-medium">{formData.title || "Not specified"}</span>
          </p>
        </div>
      </ConfirmDialog>
    </div>
  )
}