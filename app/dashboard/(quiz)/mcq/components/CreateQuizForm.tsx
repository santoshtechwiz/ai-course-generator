"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks"
import { useMutation } from "@tanstack/react-query"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import axios from "axios"
import { signIn, useSession } from "next-auth/react"
import { HelpCircle, Timer } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Card, CardContent } from "@/components/ui/card"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

import { ConfirmDialog } from "../../components/ConfirmDialog"

import { quizSchema } from "@/schema/schema"

import { usePersistentState } from "@/hooks/usePersistentState"
import { cn } from "@/lib/tailwindUtils"
import { useSubscription } from "@/modules/auth"

import type { z } from "zod"
import type { QueryParams } from "@/app/types/types"
import PlanAwareButton from "../../components/PlanAwareButton"
import { SubscriptionSlider } from "../../../subscription/components/SubscriptionSlider"

// Define proper TypeScript interfaces for better type safety
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
}: CreateQuizFormProps) {  const router = useRouter()
  const { toast } = useToast()
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(false)
  const [submissionError, setSubmissionError] = React.useState<string | null>(null);
   const [isSuccess, setIsSuccess] = React.useState(false)
  const { data: session } = useSession()
  const subscription = useSubscription()
  const subscriptionData = subscription

  const [formData, setFormData] = usePersistentState<QuizFormData>("quizFormData", {
    title: params?.title || "",
    amount: params?.amount ? Number.parseInt(params.amount, 10) : maxQuestions,
    difficulty: "medium",
    type: "mcq",
  })

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
      // Only update if the parsed amount is valid and different from maxQuestions
      if (!isNaN(amount) && amount !== maxQuestions) {
        setValue("amount", Math.min(amount, maxQuestions))
      }
    }
  }, [params?.title, params?.amount, maxQuestions, setValue])

  React.useEffect(() => {
    const subscription = watch((value) => setFormData(value as QuizFormData))
    return () => subscription.unsubscribe()
  }, [watch, setFormData])

  const { mutateAsync: createQuizMutation } = useMutation({
    mutationFn: async (data: QuizFormData) => {
      const response = await axios.post(`/api/quizzes/mcq`, data)
      return response.data
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

  // Improved validation with better type safety
  const validateQuizData = React.useCallback(
    (data: QuizFormData): string | null => {
      if (!data.title || data.title.trim().length < 3) {
        return "Quiz title must be at least 3 characters"
      }

      if (!data.amount || typeof data.amount !== "number" || data.amount < 1 || data.amount > maxQuestions) {
        return `Number of questions must be between 1 and ${maxQuestions}`
      }

      if (!data.difficulty || !["easy", "medium", "hard"].includes(data.difficulty)) {
        return "Please select a valid difficulty level"
      }

      return null // No validation errors
    },
    [maxQuestions],
  )

  // Fix onSubmit dependency array to include validateQuizData
  const onSubmit = React.useCallback(
    (data: QuizFormData) => {
      if (isLoading) return

      // Validate the form data
      const validationError = validateQuizData(data)
      if (validationError) {
        toast({
          title: "Validation Error",
          description: validationError,
          variant: "destructive",
        })
        return
      }

      if (!isLoggedIn) {
        signIn("credentials", { callbackUrl: `/dashboard/mcq'}` })
        return      }

      setIsConfirmDialogOpen(true)
    },
    [isLoading, isLoggedIn, validateQuizData, toast, quizType],
  )
  const handleConfirm = React.useCallback(async () => {
    setIsLoading(true)
    
    try {
      const formValues = watch()
      const response = await createQuizMutation(formValues)
      const userQuizId = response?.userQuizId
      const slug = response?.slug

      if (!userQuizId) throw new Error("Quiz ID not found")

      toast({
        title: "Success!",
        description: "Your quiz has been created.",
      })

      router.push(`/dashboard/mcq/${slug}`)
    } catch (error) {
      // Error is handled in the mutation's onError callback
      setIsLoading(false)
    } finally {
      setIsLoading(false)
    }
  }, [createQuizMutation, watch, toast, router, quizType])

  const amount = watch("amount")
  const difficulty = watch("difficulty")
  const title = watch("title")

  const isFormValid = React.useMemo(() => {
    return !!title && !!amount && !!difficulty && isValid
  }, [title, amount, difficulty, isValid])

  const isDisabled = React.useMemo(() => credits < 1 || !isFormValid || isLoading, [credits, isFormValid, isLoading])

  // Fix credit percentage calculation to be type-safe and display actual credits
  const creditPercentage = React.useMemo(() => {
    if (typeof credits !== "number" || isNaN(credits) || credits <= 0) {
      return 0
    }
    // Use max value as 100 to create better visual scale for progress bar
    const maxCreditDisplay = 100
    return Math.min((credits / maxCreditDisplay) * 100, 100)
  }, [credits])

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-4xl mx-auto"
    >
      <Card className="border border-border/50 shadow-lg hover:shadow-xl transition-all duration-300 bg-card/50 backdrop-blur-sm">
        <CardContent className="p-8 lg:p-12">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-10">
            {/* Topic Section */}
            <motion.div
              className="space-y-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="space-y-2">
                <Label htmlFor="title" className="text-base font-semibold text-foreground flex items-center gap-2">
                  Quiz Topic
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="w-4 h-4 text-muted-foreground hover:text-foreground transition-colors cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent side="right" className="max-w-xs">
                        <p>Enter any topic you'd like to be quizzed on. Be specific for better questions.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </Label>
                <p className="text-sm text-muted-foreground" id="topic-description">
                  Choose a specific topic for more focused questions
                </p>
              </div>
              
              <Input
                id="title"
                placeholder="e.g., JavaScript Arrays, Python Loops, Machine Learning Basics"
                className="h-14 text-base bg-background/50 border-border/50 focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:border-primary transition-all duration-200"
                {...register("title")}
                aria-describedby="topic-description"
              />
              
              {errors.title && (
                <p className="text-sm text-destructive flex items-center gap-1" id="topic-error">
                  {errors.title.message}
                </p>
              )}
            </motion.div>

            {/* Number of Questions Section */}
            <motion.div
              className="space-y-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="space-y-2">
                <Label className="text-base font-semibold text-foreground flex items-center gap-2">
                  Number of Questions
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="w-4 h-4 text-muted-foreground hover:text-foreground transition-colors cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent side="right" className="max-w-xs">
                        <p>Select how many questions you want in your quiz (1-{maxQuestions})</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </Label>
                <p className="text-sm text-muted-foreground">
                  Select between 1 and {maxQuestions} questions
                </p>
              </div>

              <div className="bg-muted/30 rounded-xl p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Timer className="w-5 h-5 text-primary" />
                    </div>
                    <span className="text-sm font-medium text-muted-foreground">Questions</span>
                  </div>
                  <motion.span
                    className="text-3xl font-bold text-primary tabular-nums"
                    key={amount}
                    initial={{ scale: 1.2, color: "#22c55e" }}
                    animate={{ scale: 1, color: "hsl(var(--primary))" }}
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
              </div>

              {errors.amount && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  {errors.amount.message}
                </p>
              )}

              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span>
                  {isLoggedIn
                    ? "Unlimited quizzes available"
                    : `This quiz will use ${amount} credit${amount > 1 ? "s" : ""}`}
                </span>
              </div>
            </motion.div>

            {/* Difficulty Section */}
            <motion.div
              className="space-y-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <div className="space-y-2">
                <Label className="text-base font-semibold text-foreground flex items-center gap-2">
                  Difficulty Level
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="w-4 h-4 text-muted-foreground hover:text-foreground transition-colors cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent side="right" className="max-w-xs">
                        <p>Choose how challenging the questions should be</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </Label>
                <p className="text-sm text-muted-foreground">
                  Select the complexity level for your quiz questions
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { level: "easy", emoji: "🟢", description: "Basic concepts" },
                  { level: "medium", emoji: "🟡", description: "Intermediate topics" },
                  { level: "hard", emoji: "🔴", description: "Advanced challenges" }
                ].map(({ level, emoji, description }) => (
                  <Button
                    key={level}
                    type="button"
                    variant={difficulty === level ? "default" : "outline"}
                    className={cn(
                      "h-16 flex-col gap-2 font-medium transition-all duration-200 group",
                      difficulty === level 
                        ? "border-primary shadow-lg scale-105" 
                        : "hover:border-primary/50 hover:scale-102 hover:shadow-md"
                    )}
                    onClick={() => setValue("difficulty", level as "easy" | "medium" | "hard")}
                    aria-pressed={difficulty === level}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{emoji}</span>
                      <span className="capitalize text-base font-semibold">{level}</span>
                    </div>
                    <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">
                      {description}
                    </span>
                  </Button>
                ))}
              </div>
            </motion.div>

            {/* Credits Section */}
            <motion.div
              className="bg-gradient-to-r from-primary/5 via-primary/3 to-transparent border border-primary/20 rounded-xl p-6 space-y-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-foreground">Available Credits</h3>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium text-primary">{credits} remaining</span>
                </div>
              </div>
              
              <div className="space-y-3">
                <Progress value={creditPercentage} className="h-3 bg-muted/30" />
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    You have <span className="font-semibold text-foreground">{credits}</span> credit{credits !== 1 ? "s" : ""} remaining
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {creditPercentage.toFixed(0)}%
                  </span>
                </div>
              </div>
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

            {/* Submit Section */}
            <motion.div
              className="pt-8 border-t border-border/30"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <PlanAwareButton
                label="Generate Quiz"
                onClick={handleSubmit(onSubmit)}
                isLoggedIn={isLoggedIn}
                isEnabled={!isDisabled}
                isLoading={isLoading}
                hasCredits={credits > 0}
                loadingLabel="Generating Quiz..."
                className="w-full h-16 text-lg font-semibold transition-all duration-300 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary"
                customStates={{
                  default: {
                    tooltip: "Click to generate your quiz",
                  },
                  notEnabled: {
                    label: "Enter a topic to generate",
                    tooltip: "Please enter a topic before generating the quiz",
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
      </Card>

      <ConfirmDialog
        isOpen={isConfirmDialogOpen}
        onConfirm={handleConfirm}
        onCancel={() => {
          setIsConfirmDialogOpen(false)
          setIsLoading(false)
        }}
        title="Generate MCQ Quiz"
        description="You are about to use AI to generate a multiple-choice quiz. This will use credits from your account."        confirmText="Generate Now"
        cancelText="Cancel"
        showTokenUsage={true}
        status={isLoading ? "loading" : submissionError ? "error" : isSuccess ? "success" : "idle"}
        errorMessage={submissionError}
        tokenUsage={{
          used: Math.max(0, maxQuestions - credits),
          available: maxQuestions,
          remaining: credits,
          percentage: (Math.max(0, maxQuestions - credits) / maxQuestions) * 100,
        }}
        quizInfo={{
          type: "Multiple Choice Questions",
          topic: watch("title"),
          count: watch("amount"),
          difficulty: watch("difficulty"),
          estimatedTokens: Math.min(watch("amount") || 1, 5) * 120, // Rough estimate
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
    </motion.div>
  )
}
