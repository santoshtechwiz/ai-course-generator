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
      className="w-full max-w-4xl mx-auto space-y-6 lg:space-y-8"
    >
      <Card className="bg-background border border-border shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">
        <CardContent className="space-y-8 lg:space-y-10 p-6 lg:p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 lg:space-y-10">
            <motion.div
              className="space-y-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Label htmlFor="title" className="text-base font-medium text-foreground flex items-center gap-2">
                Topic
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="w-4 h-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent side="right">
                      <p className="w-[200px]">Enter any topic you'd like to be quizzed on</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </Label>
              <div className="relative">
                <Input
                  id="title"
                  placeholder="Enter the quiz topic"
                  className="w-full p-3 lg:p-4 h-12 lg:h-14 text-base lg:text-lg border border-input rounded-lg focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:border-primary transition-all"
                  {...register("title")}
                  aria-describedby="topic-description"
                />
              </div>
              {errors.title && (
                <p className="text-sm text-destructive mt-1" id="topic-error">
                  {errors.title.message}
                </p>
              )}
              <p className="text-sm text-muted-foreground" id="topic-description">
                Choose a specific topic for more focused questions
              </p>
            </motion.div>

            <motion.div
              className="space-y-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
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
              {errors.amount && <p className="text-sm text-destructive mt-1">{errors.amount.message}</p>}
              <p className="text-sm text-muted-foreground mt-2">
                {isLoggedIn
                  ? "Unlimited quizzes available"
                  : `This quiz will use ${amount} credit${amount > 1 ? "s" : ""}`}
              </p>
            </motion.div>

            <motion.div
              className="space-y-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Label className="text-base font-medium text-foreground flex items-center gap-2">
                Difficulty
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
                {["easy", "medium", "hard"].map((level) => (
                  <Button
                    key={level}
                    type="button"
                    variant={difficulty === level ? "default" : "outline"}
                    className={cn(
                      "capitalize w-full h-12 lg:h-14 font-medium transition-all text-base lg:text-lg",
                      difficulty === level ? "border-primary shadow-sm" : "hover:border-primary/50",
                    )}
                    onClick={() => setValue("difficulty", level as "easy" | "medium" | "hard")}
                    aria-pressed={difficulty === level}
                  >
                    {level}
                  </Button>
                ))}
              </div>
            </motion.div>

            <motion.div
              className="bg-primary/5 border border-primary/20 rounded-lg p-4 lg:p-6 space-y-3 lg:space-y-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <h3 className="text-base lg:text-lg font-semibold mb-2">Available Credits</h3>
              <Progress value={creditPercentage} className="h-2 lg:h-3" />
              <p className="text-xs lg:text-sm text-muted-foreground">
                You have <span className="font-bold text-primary">{credits}</span> credit{credits !== 1 ? "s" : ""}{" "}
                remaining.
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
                className="w-full h-12 lg:h-14 text-base lg:text-lg font-medium transition-all duration-300 hover:shadow-lg"
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
