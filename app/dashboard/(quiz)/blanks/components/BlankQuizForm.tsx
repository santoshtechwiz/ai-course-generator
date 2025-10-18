"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useMutation } from "@tanstack/react-query"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { api } from "@/lib/api-helper"

import { HelpCircle, Timer, Sparkles, Check, AlertCircle } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Card, CardContent } from "@/components/ui/card"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Badge } from "@/components/ui/badge"

import { usePersistentState } from "@/lib/storage"
import { cn } from "@/lib/utils"
import { blanksQuizSchema } from "@/schema/schema"
import { Skeleton } from "@/components/ui/skeleton"

import type { z } from "zod"
import type { QueryParams } from "@/app/types/types"
import { SubscriptionSlider } from "@/app/dashboard/subscription/components/SubscriptionSlider"
import { ConfirmDialog } from "../../components/ConfirmDialog"
import PlanAwareButton from "@/components/quiz/PlanAwareButton"
import FormContainer from "@/app/dashboard/FormContainer"
import { useToast } from "@/components/ui/use-toast"
import { useUnifiedSubscription } from "@/hooks/useUnifiedSubscription"
import { ContextualAuthPrompt, useContextualAuth } from "@/components/auth/ContextualAuthPrompt"


type BlankQuizFormData = z.infer<typeof blanksQuizSchema> & {}

interface BlankQuizFormProps {
  credits: number
  isLoggedIn: boolean
  maxQuestions: number
  params?: QueryParams
}

export default function BlankQuizForm({ isLoggedIn, maxQuestions, credits, params }: BlankQuizFormProps) {
  const router = useRouter()
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(false)
  const [submitError, setSubmitError] = React.useState<string | null>(null)
  const { toast } = useToast()
  const { subscription } = useUnifiedSubscription()
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
  const subscriptionCredits = subscription?.credits ?? 0
  const subscriptionTokensUsed = subscription?.tokensUsed ?? 0
  
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

  const [formData, setFormData] = usePersistentState<BlankQuizFormData>("blankQuizFormData", {
    title: params?.title || "",
    amount: params?.amount ? Number.parseInt(params.amount, 10) : maxQuestions,
    difficulty: (typeof params?.difficulty === "string" && ["easy", "medium", "hard"].includes(params.difficulty)
      ? params.difficulty
      : "easy") as "easy" | "medium" | "hard",
    type: "blanks",
  })

  const {
    control,
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isValid },
  } = useForm<BlankQuizFormData>({
    resolver: zodResolver(blanksQuizSchema),
    defaultValues: formData,
    mode: "all",
  })

  React.useEffect(() => {
    if (params?.title) {
      setValue("title", params.title)
    }
    if (params?.amount) {
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
    const subscription = watch((value: Record<string, unknown>) => setFormData(value as BlankQuizFormData))
    return () => subscription.unsubscribe()
  }, [watch, setFormData])

  const { mutateAsync: createBlankQuizMutation } = useMutation({
    mutationFn: async (data: BlankQuizFormData) => {
      const response = await api.post("/api/quizzes/blanks/create", data)
      return response // api.post already returns the parsed JSON
    },
    onError: (error: any) => {
      console.error("Error creating blanks quiz:", error)
      setSubmitError(error?.response?.data?.message || "Failed to create fill-in-the-blanks quiz. Please try again.")
      toast({ title: "Error", description: error?.response?.data?.message || "Failed to create blanks quiz.", variant: "destructive" })
    },
  })
  const onSubmit = React.useCallback(
    (data: BlankQuizFormData) => {
      if (isLoading) return

      // 1. Check authentication with contextual message
      if (!requireAuth('create_quiz', `${data.amount} fill-in-the-blank questions on "${data.title}"`)) {
        return // Auth modal shown, user stays on page
      }

      // 2. Validate form data
      if (!data.title || !data.amount || !data.difficulty) {
        setSubmitError("Please fill in all required fields")
        return
      }

      // 3. Check credits
      if (creditInfo.remainingCredits <= 0) {
        toast({
          title: "No Credits Available",
          description: "You've used all your credits. Upgrade to continue creating quizzes.",
          variant: "destructive"
        })
        return
      }

      setSubmitError(null)
      setIsConfirmDialogOpen(true)
    },
    [isLoading, requireAuth, creditInfo.remainingCredits, toast],
  )

  const handleConfirm = React.useCallback(async () => {
    setIsLoading(true)

    try {
      const formValues = watch()
  const response = await createBlankQuizMutation({
        title: formValues.title,
        amount: formValues.amount,
        difficulty: formValues.difficulty,
        type: "blanks",
  })
      const userQuizId = response?.quizId || response?.userQuizId

      if (!userQuizId) throw new Error("Blanks Quiz ID not found")

      toast({ title: "Success!", description: "Your blanks quiz has been created." })

      router.push(`/dashboard/blanks/${response?.slug}`)
    } catch (error: any) {
      const message = error?.response?.data?.message || error?.message || "Failed to create blanks quiz. Please try again."
      setSubmitError(message)
      toast({ title: "Error", description: message, variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }, [createBlankQuizMutation, watch, router, toast])

  const amount = watch("amount")
  const difficulty = watch("difficulty")
  const title = watch("title")

  const isFormValid = React.useMemo(() => {
    return !!title && !!amount && !!difficulty && isValid
  }, [title, amount, difficulty, isValid])

  const isDisabled = React.useMemo(() => credits < 1 || !isFormValid || isLoading, [credits, isFormValid, isLoading])

  // Memoize the difficulty options to prevent unnecessary re-renders
  const difficultyOptions = React.useMemo(() => {
    return [
      { value: "easy", label: "Easy", color: "bg-emerald-100 text-emerald-800 border-emerald-200" },
      { value: "medium", label: "Medium", color: "bg-amber-100 text-amber-800 border-amber-200" },
      { value: "hard", label: "Hard", color: "bg-rose-100 text-rose-800 border-rose-200" },
    ]
  }, [])

  
  // Fix credit percentage calculation to be type-safe and display actual credits
  const creditPercentage = React.useMemo(() => {
    if (typeof credits !== "number" || isNaN(credits) || credits <= 0) {
      return 0
    }
    // Use max value as 100 to create better visual scale for progress bar
    const maxCreditDisplay = 100
    return Math.min((credits / maxCreditDisplay) * 100, 100)
  }, [credits])

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-6 w-36" />
        <Skeleton className="h-48 w-full" />
      </div>
    )
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      {submitError && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{submitError}</AlertDescription>
        </Alert>
      )}
      <Card className="bg-background border border-border shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">
        <CardContent className="space-y-6 md:space-y-8 p-4 md:p-6 lg:p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 md:space-y-8">
            <motion.div
              className="space-y-4 lg:space-y-5"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Label htmlFor="title" className="text-base font-medium text-foreground flex items-center gap-2">
                <div className="p-1.5 bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--accent))] rounded-lg">
                  <Sparkles className="w-3.5 h-3.5 text-white" />
                </div>
                Title *
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="w-4 h-4 text-muted-foreground cursor-help hover:text-blue-500 transition-colors" />
                    </TooltipTrigger>
                    <TooltipContent
                      side="right"
                      className="max-w-xs bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-blue-200/50 dark:border-blue-800/50"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="w-4 h-4 text-blue-500" />
                        <span className="font-medium text-blue-900 dark:text-blue-100">AI Tip</span>
                      </div>
                      <p className="text-sm">
                        Enter a descriptive title or topic for your fill-in-the-blanks quiz. You can use complete 
                        sentences or phrases. Our AI will generate relevant questions based on this content.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </Label>
              <div className="relative group">
                <Input
                  id="title"
                  placeholder="Enter your quiz topic or a complete sentence (e.g., The benefits of renewable energy sources, How photosynthesis works in plants)"
                  className={cn(
                    "w-full p-3 lg:p-4 h-12 lg:h-14 text-base lg:text-lg rounded-xl transition-all duration-300 pr-12",
                    "border-2 border-slate-200 dark:border-slate-700",
                    "focus:border-blue-500 dark:focus:border-blue-400 focus:ring-4 focus:ring-blue-500/20 dark:focus:ring-blue-400/20",
                    "bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm",
                    "hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-lg hover:shadow-blue-500/10",
                    errors.title ? "border-red-300 focus:border-red-500 focus:ring-red-500/20" : "",
                  )}
                  {...register("title")}
                  aria-describedby="title-description"
                  aria-invalid={errors.title ? "true" : "false"}
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="p-1.5 bg-gradient-to-r from-[hsl(var(--primary))]/10 to-[hsl(var(--accent))]/10 rounded-lg group-focus-within:from-[hsl(var(--primary))]/20 group-focus-within:to-[hsl(var(--accent))]/20 transition-all duration-300">
                    <Sparkles className="h-4 w-4 text-blue-500 group-focus-within:text-blue-600" />
                  </div>
                </div>
              </div>
              {errors.title && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="text-sm text-red-600 dark:text-red-400 mt-1 flex items-center gap-2"
                  id="title-error"
                  role="alert"
                >
                  <span className="inline-block w-1 h-1 bg-red-500 rounded-full" />
                  {errors.title.message}
                </motion.p>
              )}
              <div className="bg-gradient-to-r from-[hsl(var(--muted))] to-[hsl(var(--muted))] dark:from-[hsl(var(--muted))]/50 dark:to-[hsl(var(--muted))]/50 rounded-xl p-4 border border-[hsl(var(--border))]">
                <p className="text-sm text-slate-700 dark:text-slate-300" id="title-description">
                  <span className="font-medium text-blue-700 dark:text-blue-300">💡 Examples:</span> "The process of photosynthesis in green plants", "Key principles of quantum mechanics", "Benefits of renewable energy sources", or simply "World War II Events"
                </p>
              </div>
            </motion.div>

           
          


            
           

            <motion.div
              className="space-y-4 lg:space-y-5"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Label className="text-base font-medium text-foreground flex items-center gap-2">
                Number of Questions
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="w-4 h-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent side="right">
                      <p className="w-[200px]">Select how many questions you want in your quiz</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </Label>
              <div className="space-y-4 lg:space-y-5 px-2 lg:px-4">
                <div className="flex items-center justify-between px-2 lg:px-4">
                  <Timer className="w-5 h-5 lg:w-6 lg:h-6 text-muted-foreground" />
                  <motion.span
                    className="text-2xl lg:text-3xl font-bold text-primary tabular-nums"
                    key={amount}
                    initial={{ scale: 1.2, color: "#00ff00" }}
                    animate={{ scale: 1, color: "var(--primary)" }}
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
              {errors.amount && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="text-sm text-destructive mt-1"
                  role="alert"
                >
                  {errors.amount.message}
                </motion.p>
              )}
              <p className="text-sm text-muted-foreground mt-2">
                {isLoggedIn
                  ? "Unlimited quizzes available"
                  : `This quiz will use ${amount} credit${amount > 1 ? "s" : ""}`}
              </p>
            </motion.div>

            <motion.div
              className="space-y-4 lg:space-y-5"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Label className="text-base font-medium text-foreground flex items-center gap-2">
                Difficulty *
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="w-4 h-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent side="right">
                      <p className="w-[200px]">Choose how challenging the questions should be</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </Label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 lg:gap-4">
                {difficultyOptions.map((level) => (
                  <Button
                    key={level.value}
                    type="button"
                    variant={difficulty === level.value ? "default" : "outline"}
                    className={cn(
                      "capitalize w-full h-12 lg:h-14 font-medium transition-all duration-200 text-base lg:text-lg",
                      difficulty === level.value ? "border-primary shadow-sm" : "hover:border-primary/50",
                      "focus:ring-2 focus:ring-primary focus:ring-offset-2",
                    )}
                    onClick={() => setValue("difficulty", level.value as "easy" | "medium" | "hard")}
                    aria-pressed={difficulty === level.value}
                  >
                    {level.label}
                    {difficulty === level.value && <Check className="ml-2 h-4 w-4 lg:h-5 lg:w-5" />}
                  </Button>
                ))}
              </div>
            </motion.div>

            <motion.div
              className="bg-primary/5 border border-primary/20 rounded-lg p-4 lg:p-6 space-y-3 lg:space-y-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <h3 className="text-base lg:text-lg font-semibold mb-2 flex items-center gap-2">
                <Sparkles className="h-4 w-4 lg:h-5 lg:w-5 text-primary" />
                Available Credits
              </h3>
              <Progress value={creditInfo.totalCredits > 0 ? (creditInfo.remainingCredits / creditInfo.totalCredits) * 100 : 0} className="h-2 lg:h-3" />
              <p className="text-xs lg:text-sm text-muted-foreground">
                {creditInfo.usedCredits} used of {creditInfo.totalCredits} total credits. <span className="font-bold text-primary">{creditInfo.remainingCredits} remaining</span>.
              </p>
            </motion.div>

            <AnimatePresence>
              {errors.root && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <Alert variant="destructive">
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{errors.root.message}</AlertDescription>
                  </Alert>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.div
              className="pt-6 lg:pt-8 border-t border-border/60"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
            >
              <PlanAwareButton
                label="Generate Quiz"
                onClick={handleSubmit(onSubmit)}
                isLoggedIn={isLoggedIn}
                isEnabled={!isDisabled}
                isLoading={isLoading}
                loadingLabel="Generating Quiz..."
                className="w-full h-14 text-lg font-semibold transition-all duration-300 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white border-0 shadow-lg hover:shadow-xl disabled:bg-gradient-to-r disabled:from-sky-300 disabled:to-cyan-300 disabled:text-white disabled:opacity-100 disabled:cursor-not-allowed"
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
        </CardContent>
      </Card>{" "}
      <ConfirmDialog
        isOpen={isConfirmDialogOpen}
        onConfirm={handleConfirm}
        onCancel={() => {
          setIsConfirmDialogOpen(false)
          setIsLoading(false)
        }}
        title="Generate Fill-in-the-Blanks Quiz"
        description="You are about to use AI to generate a fill-in-the-blanks quiz. This will use credits from your account."
        confirmText="Generate Now"
        cancelText="Cancel"
        showCreditUsage={true}
        status={isLoading ? "loading" : submitError ? "error" : undefined}
        errorMessage={submitError ?? undefined}
        creditUsage={{
          used: Math.max(0, 100 - credits), // Assuming 100 total credits for calculation  
          available: 100,
          remaining: credits,
          percentage: credits > 0 ? ((100 - credits) / 100) * 100 : 100,
        }}
        quizInfo={{
          type: "Fill-in-the-Blanks Quiz",
          topic: watch("title"),
          count: watch("amount"),
          difficulty: watch("difficulty"),
          estimatedCredits: 1, // Quiz creation costs 1 credit
        }}
      >
        <div className="py-2">
          <p className="text-sm">
            Generating {watch("amount")} fill-in-the-blanks questions at{" "}
            <span className="font-medium capitalize">{watch("difficulty")}</span> difficulty level for topic:{" "}
            <span className="font-medium">{watch("title")}</span>
          </p>
        </div>
      </ConfirmDialog>

      {/* ✅ Contextual Auth Prompt Modal */}
      <ContextualAuthPrompt
        {...authPrompt}
        onOpenChange={closeAuthPrompt}
      />
    </div>
  )
}
