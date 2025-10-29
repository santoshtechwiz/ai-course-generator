"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks"
import { useMutation } from "@tanstack/react-query"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { api } from "@/lib/api-helper"
import { useSession } from "next-auth/react"
import { HelpCircle, Timer, Sparkles, Check, Lightbulb } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { ContextualAuthPrompt, useContextualAuth } from "@/components/auth/ContextualAuthPrompt"
// Removed redux subscription sync imports

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

import { ConfirmDialog } from "../../components/ConfirmDialog"
import { quizSchema } from "@/schema/schema"
import { usePersistentState } from "@/lib/storage"
import { cn } from "@/lib/utils"
import { useUnifiedSubscription } from "@/hooks/useUnifiedSubscription"

import type { z } from "zod"
import type { QueryParams } from "@/app/types/types"
import PlanAwareButton from "@/components/quiz/PlanAwareButton"
import { SubscriptionSlider } from "../../../subscription/components/SubscriptionSlider"
import FormContainer from "@/app/dashboard/FormContainer"


interface Subscription {
  subscriptionPlan?: string
}

type QuizFormData = z.infer<typeof quizSchema> & {}

interface CreateQuizFormProps {
  credits: number
  isLoggedIn: boolean
  maxQuestions: number
  params?: QueryParams
  quizType?: string
}

export default function CreateQuizForm({
  isLoggedIn,
  maxQuestions,
  credits,
  params,
  quizType = "mcq",
}: CreateQuizFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(false)
  const [submissionError, setSubmissionError] = React.useState<string | null>(null)
  const [isSuccess, setIsSuccess] = React.useState(false)
  const [selectedCategory, setSelectedCategory] = React.useState<string | null>(null)
  const { data: session } = useSession()
  const subscription = useUnifiedSubscription()
  const subscriptionData = subscription
  const { requireAuth, authPrompt, closeAuthPrompt } = useContextualAuth()

  const [formData, setFormData] = usePersistentState<QuizFormData>("quizFormData", {
    title: params?.title && typeof params.title === 'string' ? params.title : "",
    amount: params?.amount && typeof params.amount === 'string' ? Number.parseInt(params.amount, 10) : maxQuestions,
    difficulty: "medium",
    type: "mcq",
  })

  // Credit information state for consistent display
  const [creditInfo, setCreditInfo] = React.useState({
    hasCredits: false,
    remainingCredits: credits,
    totalCredits: 0,
    usedCredits: 0
  })

  // Use unified subscription as single source of truth - fixes sync issues
  // Extract stable primitive values to prevent infinite loops
  const subscriptionCredits = subscription?.subscription?.credits ?? 0
  const subscriptionTokensUsed = subscription?.subscription?.tokensUsed ?? 0
  
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

  const {
    control,
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isValid },
  } = useForm<QuizFormData>({
    resolver: zodResolver(quizSchema),
    defaultValues: formData,
    mode: "onChange",
  })

  React.useEffect(() => {
    if (params?.title) {
      setValue("title", params.title)
    }
    if (params?.amount) {
      const amount = Number.parseInt(params.amount, 10)
      if (!isNaN(amount) && amount !== maxQuestions) {
        setValue("amount", Math.min(amount, maxQuestions))
      }
    }
    if (params?.difficulty && typeof params.difficulty === 'string') {
      setValue("difficulty", params.difficulty as "easy" | "medium" | "hard")
    }
    if (params?.topic) {
      setValue("topic", params.topic)
    }
    if (params?.suggestedPrompt) {
      const prompt = Array.isArray(params.suggestedPrompt) ? params.suggestedPrompt[0] : params.suggestedPrompt
      setValue("prompt", prompt)
    }
  }, [params?.title, params?.amount, params?.difficulty, params?.topic, params?.suggestedPrompt, maxQuestions, setValue])

  React.useEffect(() => {
    const subscription = watch((value: any) => setFormData(value as QuizFormData))
    return () => subscription.unsubscribe()
  }, [watch, setFormData])

  const { mutateAsync: createQuizMutation } = useMutation({
    mutationFn: async (data: QuizFormData) => {
      const response = await api.post(`/api/quizzes/mcq/create`, data)
      return response // api.post already returns the parsed JSON, not a wrapper object
    },
    onError: (error: any) => {
      console.error("Error creating quiz:", error)
      toast({
        title: "Error",
        description: error?.response?.data?.message || "Failed to create quiz. Please try again.",
        variant: "destructive",
      })
    },
  })

  const validateQuizData = React.useCallback(
    (data: QuizFormData): string | null => {
      if (!data.title || data.title.trim().length < 3) {
        return "Quiz title must be at least 3 characters. Try something like 'JavaScript basics' or 'World War 2 history'."
      }

      if (!data.amount || typeof data.amount !== "number" || data.amount < 1 || data.amount > maxQuestions) {
        return `Number of questions must be between 1 and ${maxQuestions}. Start with 5-10 questions for better results.`
      }

      if (!data.difficulty || ["easy", "medium", "hard"].includes(data.difficulty) === false) {
        return "Please select a difficulty level. Choose 'Easy' for basic concepts, 'Medium' for standard knowledge, or 'Hard' for advanced topics."
      }

      return null
    },
    [maxQuestions],
  )

  const onSubmit = React.useCallback(
    (data: QuizFormData) => {
      if (isLoading) return

      const validationError = validateQuizData(data)
      if (validationError) {
        toast({
          title: "Validation Error",
          description: validationError,
          variant: "destructive",
        })
        return
      }

      // ✅ NEW: Use contextual auth prompt instead of redirect
      if (!isLoggedIn) {
        const hasAuth = requireAuth('create_quiz', `${data.amount} MCQ questions on "${data.title}"`)
        if (!hasAuth) return // Auth prompt will be shown
      }

      // Reset states when opening dialog
      setSubmissionError(null)
      setIsSuccess(false)
      setIsConfirmDialogOpen(true)
    },
    [isLoading, isLoggedIn, validateQuizData, toast, quizType, setSubmissionError, setIsSuccess],
  )

  const handleConfirm = React.useCallback(async () => {
    setIsLoading(true)
    setSubmissionError(null) // Clear previous errors
    setIsSuccess(false) // Reset success state

    try {
      const formValues = watch()
      const response = await createQuizMutation({ ...formValues, type: "mcq" })
      
      console.log("API Response:", response)
      
      const userQuizId = response?.userQuizId || response?.quizId
      const slug = response?.slug

      console.log("Extracted values:", { userQuizId, slug })

      if (!userQuizId || !slug) throw new Error("Quiz creation failed: missing identifiers")

      // Set success state
      setIsSuccess(true)
      
      // Close dialog on success after a brief delay to show success state
      setTimeout(() => {
        setIsConfirmDialogOpen(false)
        setIsSuccess(false) // Reset for next time
      }, 1000)
      
      toast({
        title: "Success!",
        description: "Your quiz has been created.",
      })
  try { await subscription.forceRefresh?.() } catch {/* ignore */}
      router.push(`/dashboard/mcq/${slug}`)
    } catch (error: any) {
      console.error("Quiz creation error:", error)
      
      // Provide more specific error messages based on error type
      let message = "Failed to create quiz. Please try again."
      
      if (error?.response?.status === 403) {
        message = "Insufficient credits. Please upgrade your plan or purchase more credits."
      } else if (error?.response?.status === 429) {
        message = "Too many requests. Please wait a moment and try again."
      } else if (error?.response?.status === 400) {
        message = "Invalid quiz configuration. Please check your inputs and try again."
      } else if (error?.message?.includes("network") || error?.message?.includes("fetch")) {
        message = "Network error. Please check your connection and try again."
      } else if (error?.response?.data?.message) {
        message = error.response.data.message
      } else if (error?.message) {
        message = error.message
      }
      
      setSubmissionError(message)
      
      toast({ 
        title: "Quiz Creation Failed", 
        description: message, 
        variant: "destructive" 
      })
    } finally {
      setIsLoading(false)
    }
  }, [createQuizMutation, watch, toast, router, setIsConfirmDialogOpen, setSubmissionError, setIsSuccess])

  const amount = watch("amount")
  const difficulty = watch("difficulty")
  const title = watch("title")

  const isFormValid = React.useMemo(() => {
    return !!title && !!amount && !!difficulty && isValid
  }, [title, amount, difficulty, isValid])

  const isDisabled = React.useMemo(() => credits < 1 || !isFormValid || isLoading, [credits, isFormValid, isLoading])

  const creditPercentage = React.useMemo(() => {
    if (typeof credits !== "number" || isNaN(credits) || credits <= 0) {
      return 0
    }
    const maxCreditDisplay = 100
    return Math.min((credits / maxCreditDisplay) * 100, 100)
  }, [credits])

  const difficultyOptions = React.useMemo(() => {
    return [
      {
        value: "easy",
        label: "Easy",
        icon: "🟢",
      },
      {
        value: "medium",
        label: "Medium",
        icon: "🟡",
      },
      {
        value: "hard",
        label: "Hard",
        icon: "🔴",
      },
    ]
  }, [])

  return (
    <div className="w-full max-w-4xl mx-auto neuro-strong-typography">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 md:space-y-8">
        {/* Topic Selection */}
        <motion.div
          className="space-y-4 md:space-y-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex items-center gap-2">
            <Label htmlFor="title" className="text-base md:text-lg font-semibold text-foreground">
              Topic
            </Label>
            <span className="text-rose-500">*</span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="w-4 h-4 text-muted-foreground cursor-help flex-shrink-0" />
                </TooltipTrigger>
                <TooltipContent side="right" className="max-w-xs text-xs md:text-sm">
                  <p>Enter any topic you'd like to be quizzed on. Use multiple words like "calculus derivatives" or "world history renaissance"</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          <div className="space-y-3 md:space-y-4">
            <div className="relative">
              <Input
                id="title"
                placeholder="Enter the quiz topic (e.g., 'math algebra basics', 'javascript functions')"
                className="w-full h-12 text-base bg-background border-border focus:border-primary focus:ring-primary/20 pr-12"
                {...register("title")}
                aria-describedby="topic-description"
              />
              <Lightbulb className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            </div>

            {errors.title && (
              <p className="text-sm text-red-600 dark:text-red-400" id="topic-error">
                {errors.title.message}
              </p>
            )}

            <p className="text-sm text-muted-foreground" id="topic-description">
              Be specific for more focused questions. Multi-word topics work great!
            </p>
          </div>
        </motion.div>

        {/* Number of Questions */}
        <motion.div
          className="space-y-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Label className="text-lg font-semibold text-foreground flex items-center gap-2">
            Number of Questions
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="w-4 h-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent side="right" className="max-w-xs">
                  <p>Select how many questions you want in your quiz</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </Label>

          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <Timer className="w-6 h-6 text-muted-foreground" />
              <motion.span
                className="text-3xl font-black text-[var(--color-text)] tabular-nums"
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

            <p className="text-sm text-muted-foreground text-center">
              Select between 1 and {maxQuestions} questions
            </p>
          </div>

          {errors.amount && <p className="text-sm text-red-600 dark:text-red-400">{errors.amount.message}</p>}

          <p className="text-sm text-muted-foreground">
            {isLoggedIn ? "Unlimited quizzes available" : `This quiz will use ${amount} credit${amount > 1 ? "s" : ""}`}
          </p>
        </motion.div>

        {/* Difficulty */}
        <motion.div
          className="space-y-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Label className="text-lg font-semibold text-foreground flex items-center gap-2">
            Difficulty
            <span className="text-rose-500">*</span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="w-4 h-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent side="right" className="max-w-xs">
                  <p>Choose how challenging the questions should be</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </Label>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {difficultyOptions.map((level) => (
              <Button
                key={level.value}
                type="button"
                variant={difficulty === level.value ? "default" : "outline"}
                className={cn(
                  "capitalize w-full h-14 font-black transition-all duration-200 text-base border-4",
                  difficulty === level.value
                    ? level.value === "easy"
                      ? "bg-[var(--color-success)]/20 text-[var(--color-success)] border-[var(--color-success)]/40 shadow-[4px_4px_0px_0px_hsl(var(--border))] hover:shadow-[6px_6px_0px_0px_hsl(var(--border))]"
                      : level.value === "medium"
                        ? "bg-[var(--color-warning)]/20 text-[var(--color-warning)] border-[var(--color-warning)]/40 shadow-[4px_4px_0px_0px_hsl(var(--border))] hover:shadow-[6px_6px_0px_0px_hsl(var(--border))]"
                        : "bg-[var(--color-error)]/20 text-[var(--color-error)] border-[var(--color-error)]/40 shadow-[4px_4px_0px_0px_hsl(var(--border))] hover:shadow-[6px_6px_0px_0px_hsl(var(--border))]"
                    : "bg-[var(--color-card)] text-[var(--color-text)] border-[var(--color-border)] hover:bg-[var(--color-muted)] shadow-[2px_2px_0px_0px_hsl(var(--border))] hover:shadow-[4px_4px_0px_0px_hsl(var(--border))]",
                )}
                onClick={() => setValue("difficulty", level.value as "easy" | "medium" | "hard")}
                aria-pressed={difficulty === level.value}
              >
                <span className="mr-2">{level.icon}</span>
                {level.label}
                {difficulty === level.value && <Check className="ml-2 h-5 w-5 text-[var(--color-text)]" />}
              </Button>
            ))}
          </div>

          {difficulty && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="border-4 border-[var(--color-border)] bg-[var(--color-muted)]/50 p-4 text-sm rounded-xl"
            >
              <p className="font-black text-[var(--color-foreground)]">
                {difficultyOptions.find(d => d.value === difficulty)?.label} Multiple Choice:
              </p>
              <p className="text-[var(--color-muted-foreground)] text-xs mt-2">
                {difficulty === "easy" && "Basic facts, definitions, simple concepts. Examples: What is a variable? Choose the correct syntax. 2-3 minutes per question."}
                {difficulty === "medium" && "Application of concepts, comparisons. Examples: Which method is most efficient? What does this code output? 3-5 minutes per question."}
                {difficulty === "hard" && "Complex scenarios, analysis, edge cases. Examples: Debug this algorithm. Optimize this solution. 5-8 minutes per question."}
              </p>
            </motion.div>
          )}
        </motion.div>

        {/* Available Credits */}
        <motion.div
          className="bg-[var(--color-card)] border-4 border-[var(--color-border)] rounded-xl p-6 space-y-4 shadow-[4px_4px_0px_0px_hsl(var(--border))]"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h3 className="text-lg font-black mb-2 flex items-center gap-2 text-[var(--color-text)]">
            <Sparkles className="h-5 w-5 text-[var(--color-primary)]" />
            Available Credits
          </h3>
          <Progress value={creditInfo.totalCredits > 0 ? (creditInfo.remainingCredits / creditInfo.totalCredits) * 100 : 0} className="h-3 border-2 border-[var(--color-border)] bg-[var(--color-card)]" />
          <p className="text-sm text-[var(--color-text)] font-bold">
            {creditInfo.usedCredits} used of {creditInfo.totalCredits} total credits. <span className="font-black text-[var(--color-text)]">{creditInfo.remainingCredits} remaining</span>.
          </p>
        </motion.div>

        <AnimatePresence>
          {errors.root && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <Alert variant="error">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{errors.root.message}</AlertDescription>
              </Alert>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Submit Button */}
        <motion.div
          className="pt-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <PlanAwareButton
            label="Generate Quiz"
            onClick={handleSubmit(onSubmit)}
            isLoggedIn={isLoggedIn}
            isEnabled={!isDisabled}
            isLoading={isLoading}
            loadingLabel="Generating Quiz..."
            className="w-full h-14 text-lg font-black transition-all duration-300 bg-[var(--color-primary)] text-[var(--color-bg)] border-4 border-[var(--color-border)] shadow-[4px_4px_0px_0px_hsl(var(--border))] hover:shadow-[6px_6px_0px_0px_hsl(var(--border))] hover:bg-[var(--color-accent)] disabled:opacity-50 disabled:cursor-not-allowed"
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
        }}
        title="Generate MCQ Quiz"
        description="You are about to use AI to generate a multiple-choice quiz. This will use credits from your account."
        confirmText="Generate Now"
        cancelText="Cancel"
        showCreditUsage={true}
        status={isLoading ? "loading" : submissionError ? "error" : isSuccess ? "success" : undefined}
        errorMessage={submissionError || undefined}
        creditUsage={{
          used: creditInfo.usedCredits,
          available: creditInfo.totalCredits,
          remaining: creditInfo.remainingCredits,
          percentage: creditInfo.totalCredits > 0 ? (creditInfo.usedCredits / creditInfo.totalCredits) * 100 : 0,
        }}
        quizInfo={{
          type: "Multiple Choice Questions",
          topic: watch("title"),
          count: watch("amount"),
          difficulty: watch("difficulty"),
          estimatedCredits: 1, // Quiz creation costs 1 credit
        }}
      >
        <div className="py-2">
          <p className="text-sm">
            Generating {watch("amount")} multiple-choice questions at{" "}
            <span className="font-medium capitalize">{watch("difficulty")}</span> difficulty level for topic:{" "}
            <span className="font-medium">{watch("title")}</span>
          </p>
        </div>
      </ConfirmDialog>
    </div>
  )
}
