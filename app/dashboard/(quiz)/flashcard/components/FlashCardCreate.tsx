"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks"
import { useMutation } from "@tanstack/react-query"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { api } from "@/lib/api-helper"
import { signIn } from "next-auth/react"
import { Layers, HelpCircle, Timer, Sparkles, BookOpen, Brain, Target, AlertCircle } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Badge } from "@/components/ui/badge"

import { usePersistentState } from "@/lib/storage"
import { cn } from "@/lib/utils"

import { z } from "zod"
import type { QueryParams } from "@/app/types/types"
import { SubscriptionSlider } from "@/app/dashboard/subscription/components/SubscriptionSlider"
import { ConfirmDialog } from "../../components/ConfirmDialog"
import { useSubscription } from "@/modules/auth"
import PlanAwareButton from "../../components/PlanAwareButton"
import { calculateCreditInfo } from "@/utils/credit-utils"

const flashcardSchema = z.object({
  title: z.string().nonempty("Topic is required"),
  count: z.number().int().min(1, "Amount must be at least 1").max(100, "Amount must be at most 100"),
  difficulty: z.enum(["easy", "medium", "hard"]),
})

type FlashCardFormData = z.infer<typeof flashcardSchema> & {
  userType?: string
}

interface FlashCardCreateProps {
  credits: number
  isLoggedIn: boolean
  maxCards: number
  params?: QueryParams
}

export default function FlashCardCreate({ isLoggedIn, maxCards, credits, params }: FlashCardCreateProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(false)
  const [submissionError, setSubmissionError] = React.useState<string | null>(null)
  const [isSuccess, setIsSuccess] = React.useState(false)

  // Get subscription data from the unified auth system
  const { subscription: subscriptionData, user } = useSubscription()

  // Calculate accurate credit information
  const creditInfo = calculateCreditInfo(
    user?.credits,
    user?.creditsUsed,
    subscriptionData?.credits,
    subscriptionData?.tokensUsed,
  )

  // Use a ref to track if component is mounted
  const isMounted = React.useRef(false)
  React.useEffect(() => {
    isMounted.current = true
    return () => {
      isMounted.current = false
    }
  }, [])

  const [formData, setFormData] = usePersistentState<FlashCardFormData>("flashcardFormData", {
    title: params?.title || "",
    count: params?.amount ? Number.parseInt(params.amount, 10) : maxCards,
    difficulty: "medium",
  })

  const {
    control,
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isValid },
  } = useForm<FlashCardFormData>({
    resolver: zodResolver(flashcardSchema),
    defaultValues: formData,
    mode: "onChange",
  })

  // Optimize params effect to only run once on mount
  React.useEffect(() => {
    if (params?.title) {
      setValue("title", params.title)
    }
    if (params?.amount) {
      const amount = Number.parseInt(params.amount, 10)
      if (amount !== maxCards) {
        setValue("count", Math.min(amount, maxCards))
      }
    }
  }, [params?.title, params?.amount, maxCards, setValue])

  // Use debounce for form data updates to improve performance
  React.useEffect(() => {
    const subscription = watch((value: any) => {
      const timeoutId = setTimeout(() => {
        setFormData(value as FlashCardFormData)
      }, 500) // 500ms debounce

      return () => clearTimeout(timeoutId)
    })
    return () => subscription.unsubscribe()
  }, [watch, setFormData])

  const { mutateAsync: createFlashCardsMutation } = useMutation({
    mutationFn: async (data: FlashCardFormData) => {
      data.userType = subscriptionData?.plan || "FREE"
      const response = await api.post("/api/quizzes/flashcard/create", data)
      return response // api.post already returns the parsed JSON
    },
    onError: (error) => {
      console.error("Error creating flashcards:", error)
      toast({
        title: "Error",
        description: "Failed to create flashcards. Please try again.",
        variant: "destructive",
      })
    },
  })

  const onSubmit = React.useCallback(
    (data: FlashCardFormData) => {
      if (isLoading) return

      // Reset states when starting a new submission
      setSubmissionError(null)
      setIsSuccess(false)

      // Check if user is authenticated using the user object
      if (!user?.id) {
        signIn("credentials", { callbackUrl: "/dashboard/flashcard" })
        return
      }

      // Validate token balance
      if (credits <= 0) {
        toast({
          title: "Insufficient Credits",
          description: "You don't have enough credits to generate flashcards. Please upgrade your plan.",
          variant: "destructive",
        })
        return
      }

      // Update form data in persistent state
      setFormData({
        ...data,
        userType: "student",
      })

      // Only open the dialog, don't set loading state yet
      setIsConfirmDialogOpen(true)
    },
    [isLoading, user?.id, credits, toast, setFormData],
  )

  const handleConfirm = React.useCallback(async () => {
    // Set loading state when confirmation is explicitly confirmed
    setIsLoading(true)

    // Reset states
    setSubmissionError(null)
    setIsSuccess(false)

    try {
      const formData = watch()
      const response = await createFlashCardsMutation(formData)

      if (response?.success) {
        // Set success state
        setIsSuccess(true)

        toast({
          title: "Success!",
          description: response.message || "Your flashcards have been created.",
        })

        // Make sure to extract the slug from the response
        const slug = response.slug

        if (slug && isMounted.current) {
          // Add a slight delay to ensure the toast is shown before redirecting
          setTimeout(() => {
            router.push(`/dashboard/flashcard/${slug}`)
          }, 1000) // Increased delay for better UX
        } else {
          console.error("Missing slug in response:", response)
          setSubmissionError("Missing quiz ID in response. Please try again.")
        }
      } else {
        setSubmissionError(response?.message || "Failed to create flashcards. Please try again.")
      }
    } catch (error: any) {
      // Error handling with user-friendly message
      console.error("Error in handleConfirm:", error)
      setSubmissionError(error?.message || "An unexpected error occurred. Please try again.")

      toast({
        title: "Error",
        description: error?.message || "Failed to create flashcards. Please try again.",
        variant: "destructive",
      })
    } finally {
      if (isMounted.current) {
        setIsLoading(false)
      }
    }
  }, [createFlashCardsMutation, watch, toast, router])

  const count = watch("count")
  const difficulty = watch("difficulty")
  const title = watch("title")

  // Memoize form validation to reduce rerenders
  const isFormValid = React.useMemo(() => {
    return !!title && !!count && !!difficulty && isValid
  }, [title, count, difficulty, isValid])

  const isDisabled = React.useMemo(() => credits < 1 || !isFormValid || isLoading, [credits, isFormValid, isLoading])

  // Precompute difficulty colors for better UX
  const getDifficultyColor = React.useCallback(
    (level: string) => {
      if (difficulty !== level) return ""

      switch (level) {
        case "easy":
          return "bg-green-50 border-green-200 text-green-700 dark:bg-green-950 dark:border-green-800 dark:text-green-300"
        case "medium":
          return "bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-950 dark:border-blue-800 dark:text-blue-300"
        case "hard":
          return "bg-red-50 border-red-200 text-red-700 dark:bg-red-950 dark:border-red-800 dark:text-red-300"
        default:
          return ""
      }
    },
    [difficulty],
  )

  return (
    <div className="w-full max-w-4xl mx-auto p-6 space-y-8">
      <Card className="border-0 shadow-lg bg-gradient-to-br from-background to-muted/20">
        <CardHeader className="text-center space-y-4 pb-8">
          <motion.div
            className="mx-auto w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Layers className="w-8 h-8 text-primary" />
          </motion.div>

          <div className="space-y-2">
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Create Flashcards
            </CardTitle>
            <p className="text-muted-foreground text-lg">Generate AI-powered flashcards to enhance your learning</p>
          </div>

          <div className="flex items-center justify-center gap-2">
            <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
              <Brain className="w-3 h-3 mr-1" />
              AI-Powered
            </Badge>
            <Badge
              variant="secondary"
              className="bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800"
            >
              <Target className="w-3 h-3 mr-1" />
              Personalized
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            {/* Topic Input */}
            <motion.div
              className="space-y-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Label htmlFor="title" className="text-base font-semibold flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                Topic
                <span className="text-destructive">*</span>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="w-4 h-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent side="right">
                      <p className="w-[200px]">Enter any topic you'd like to create flashcards for</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </Label>

              <div className="relative">
                <Input
                  id="title"
                  placeholder="e.g., JavaScript Fundamentals, World History, Biology..."
                  className="h-12 text-base pr-12 border-2 focus:border-primary transition-colors"
                  {...register("title")}
                  aria-describedby="topic-description"
                  autoComplete="off"
                />
                <Sparkles className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              </div>

              {errors.title && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.title.message}
                </p>
              )}

              <p className="text-sm text-muted-foreground">Choose a specific topic for more focused flashcards</p>
            </motion.div>

            {/* Number of Cards */}
            <motion.div
              className="space-y-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Label className="text-base font-semibold flex items-center gap-2">
                <Timer className="w-4 h-4" />
                Number of Flashcards
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="w-4 h-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent side="right">
                      <p className="w-[200px]">Select how many flashcards you want in your set</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </Label>

              <div className="bg-muted/30 rounded-xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Cards</span>
                  <motion.span
                    className="text-3xl font-bold text-primary tabular-nums"
                    key={count}
                    initial={{ scale: 1.2 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 10 }}
                  >
                    {count}
                  </motion.span>
                </div>

                <Controller
                  name="count"
                  control={control}
                  render={({ field }) => (
                    <SubscriptionSlider
                      value={field.value}
                      onValueChange={(value) => field.onChange(value)}
                      ariaLabel="Select number of flashcards"
                    />
                  )}
                />

                <p className="text-sm text-muted-foreground text-center">Select between 1 and {maxCards} flashcards</p>
              </div>

              {errors.count && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.count.message}
                </p>
              )}
            </motion.div>

            {/* Difficulty Selection */}
            <motion.div
              className="space-y-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Label className="text-base font-semibold flex items-center gap-2">
                <Target className="w-4 h-4" />
                Difficulty Level
                <span className="text-destructive">*</span>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="w-4 h-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent side="right">
                      <p className="w-[200px]">Choose how challenging the flashcards should be</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </Label>

              <div className="grid grid-cols-3 gap-4">
                {["easy", "medium", "hard"].map((level) => (
                  <Button
                    key={level}
                    type="button"
                    variant={difficulty === level ? "default" : "outline"}
                    size="lg"
                    className={cn(
                      "capitalize h-14 font-semibold transition-all duration-200",
                      difficulty === level && "shadow-lg",
                      getDifficultyColor(level),
                    )}
                    onClick={() => setValue("difficulty", level as "easy" | "medium" | "hard")}
                    aria-pressed={difficulty === level}
                  >
                    {level}
                  </Button>
                ))}
              </div>
            </motion.div>

            {/* Credits Display */}
            <motion.div
              className="bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/20 rounded-xl p-6 space-y-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold">Available Credits</h3>
              </div>

              <Progress
                value={creditInfo.totalCredits > 0 ? (creditInfo.remainingCredits / creditInfo.totalCredits) * 100 : 0}
                className="h-3"
              />

              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {creditInfo.usedCredits} used • {creditInfo.remainingCredits} remaining
                </span>
                <Badge variant="secondary" className="bg-primary/10 text-primary">
                  {creditInfo.totalCredits} total
                </Badge>
              </div>
            </motion.div>

            {/* Error Display */}
            <AnimatePresence>
              {errors.root && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
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
                label="Generate Flashcards"
                onClick={handleSubmit(onSubmit)}
                isLoggedIn={!!user?.id}
                isEnabled={isFormValid}
                isLoading={isLoading}
                hasCredits={creditInfo.remainingCredits > 0}
                creditsRequired={1}
                loadingLabel="Creating Flashcards..."
                className="w-full h-14 text-lg font-semibold"
                customStates={{
                  default: {
                    tooltip: "Click to generate your flashcards",
                  },
                  notEnabled: {
                    label: "Complete form to generate",
                    tooltip: "Please fill in all required fields before generating flashcards",
                  },
                  noCredits: {
                    label: "Insufficient Credits",
                    tooltip: "You need credits to generate flashcards. Consider upgrading your plan.",
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
          // Reset both dialog and loading states when cancelling
          setIsConfirmDialogOpen(false)
          setIsLoading(false)
          setSubmissionError(null)
        }}
        title="Generate Flashcards"
        description="You are about to use AI to generate flashcards. This will use credits from your account."
        confirmText="Generate Now"
        cancelText="Cancel"
        showCreditUsage={true}
        status={isLoading ? "loading" : submissionError ? "error" : isSuccess ? "success" : undefined}
        errorMessage={submissionError || undefined}
        creditUsage={{
          used: Math.max(0, maxCards - credits),
          available: maxCards,
          remaining: credits,
          percentage: (Math.max(0, maxCards - credits) / maxCards) * 100,
        }}
        quizInfo={{
          type: "Flashcards",
          topic: watch("title"),
          count: watch("count"),
          difficulty: watch("difficulty"),
         
        }}
      >
        <div className="py-2">
          <p className="text-sm">
            Generating <span className="font-medium capitalize">{watch("count")}</span> flashcards at{" "}
            <span className="font-medium capitalize">{watch("difficulty")}</span> difficulty level for topic:{" "}
            <span className="font-medium">{watch("title")}</span>
          </p>
          {subscriptionData && subscriptionData.tokensUsed >= 1000 && (
            <Alert variant="destructive" className="mt-4">
              <AlertTitle>Token limit exceeded</AlertTitle>
              <AlertDescription>
                You have used all your available tokens. Consider upgrading your plan for more credits.
              </AlertDescription>
            </Alert>
          )}
        </div>
      </ConfirmDialog>
    </div>
  )
}
