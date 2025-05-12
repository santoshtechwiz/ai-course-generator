"use client"

import { memo, useCallback, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Brain, Info, AlertCircle, Sparkles } from "lucide-react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"

import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

import type { QueryParams } from "@/app/types/types"
import { SubscriptionSlider } from "@/app/dashboard/subscription/components/SubscriptionSlider"
import PlanAwareButton from "../../components/PlanAwareButton"
import useSubscription from "@/hooks/use-subscription"

// Define schema with zod for consistent validation
const fillInTheBlankQuizSchema = z.object({
  title: z.string().min(3, "Topic must be at least 3 characters"),
  questionCount: z.number().int().positive().min(1, "Must have at least 1 question"),
  difficulty: z.enum(["easy", "medium", "hard"]),
})

type FillInTheBlankQuizFormData = z.infer<typeof fillInTheBlankQuizSchema>

interface FillInTheBlankQuizFormProps {
  isLoggedIn: boolean
  maxQuestions: number
  params?: QueryParams
}

function FillInTheBlankQuizFormComponent({ isLoggedIn, maxQuestions, params }: FillInTheBlankQuizFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const { data: subscriptionData } = useSubscription()

  const credits = subscriptionData?.credits || 0

  const {
    control,
    register,
    handleSubmit,
    watch,
    formState: { errors, isValid },
  } = useForm<FillInTheBlankQuizFormData>({
    resolver: zodResolver(fillInTheBlankQuizSchema),
    defaultValues: {
      title: params?.title || "",
      questionCount: params?.amount ? Number.parseInt(params.amount, 10) : maxQuestions,
      difficulty: "easy",
    },
    mode: "onChange",
  })

  const generateQuiz = useCallback(
    async (data: FillInTheBlankQuizFormData) => {
      setIsLoading(true)

      try {
        const response = await fetch("/api/blanks", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        })

        if (!response.ok) {
          throw new Error("Failed to generate quiz")
        }

        const { slug } = await response.json()
        router.push(`/dashboard/blanks/${slug}`)
      } catch (err) {
        console.error("Error generating quiz:", err)
        // Handle error (e.g., show error message to user)
      } finally {
        setIsLoading(false)
      }
    },
    [router],
  )

  const onSubmit = handleSubmit(generateQuiz)

  const title = watch("title")
  const questionCount = watch("questionCount")

  const isDisabled = useMemo(() => isLoading || credits < 1 || !isValid, [isLoading, credits, isValid])

  // Memoize the difficulty options to prevent unnecessary re-renders
  const difficultyOptions = useMemo(() => {
    return [
      { value: "easy", label: "Easy", color: "bg-emerald-100 text-emerald-800 border-emerald-200" },
      { value: "medium", label: "Medium", color: "bg-amber-100 text-amber-800 border-amber-200" },
      { value: "hard", label: "Hard", color: "bg-rose-100 text-rose-800 border-rose-200" },
    ]
  }, [])

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-2xl mx-auto"
    >
      <Card className="bg-background border border-border/60 shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
        <CardHeader className="bg-primary/5 border-b border-border/60 pb-6">
          <div className="flex justify-center mb-4">
            <motion.div
              className="p-3 bg-primary/10 rounded-xl"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Brain className="w-8 h-8 text-primary" />
            </motion.div>
          </div>
          <CardTitle className="text-2xl md:text-3xl font-bold text-center text-primary">
            Fill-in-the-Blank Quiz Generator
          </CardTitle>
          <p className="text-center text-base md:text-lg text-muted-foreground mt-2">
            Select a topic and customize your quiz with fill-in-the-blank questions.
          </p>
        </CardHeader>

        <CardContent className="space-y-6 pt-6">
          <form onSubmit={onSubmit} className="space-y-6">
            <motion.div
              className="space-y-3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Label htmlFor="title" className="text-sm font-medium flex items-center gap-2">
                <Info className="h-4 w-4 text-primary" />
                Quiz Topic
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help ml-1" />
                    </TooltipTrigger>
                    <TooltipContent side="right" className="max-w-xs">
                      <p>Enter a specific programming topic for your fill-in-the-blank quiz</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </Label>
              <div className="relative">
                <Input
                  id="title"
                  {...register("title")}
                  placeholder="E.g., JavaScript Fundamentals, React Hooks, Data Structures..."
                  className="w-full h-12 text-lg transition-all duration-300 focus:ring-2 focus:ring-primary pr-10"
                  aria-label="Quiz topic"
                  autoFocus
                />
                <Sparkles className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              </div>
              {errors.title && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="text-sm text-destructive"
                >
                  {errors.title.message}
                </motion.p>
              )}
            </motion.div>

            <motion.div
              className="space-y-3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Label htmlFor="difficulty" className="text-sm font-medium flex items-center gap-2">
                <Info className="h-4 w-4 text-primary" />
                Difficulty Level
              </Label>
              <div className="grid grid-cols-3 gap-3">
                {difficultyOptions.map((option) => (
                  <Controller
                    key={option.value}
                    name="difficulty"
                    control={control}
                    render={({ field }) => (
                      <button
                        type="button"
                        onClick={() => field.onChange(option.value)}
                        className={`px-4 py-2 rounded-md border transition-all duration-200 ${
                          field.value === option.value
                            ? `${option.color} border-current shadow-sm`
                            : "border-muted-foreground/20 hover:border-muted-foreground/40"
                        }`}
                      >
                        {option.label}
                      </button>
                    )}
                  />
                ))}
              </div>
            </motion.div>

            <motion.div
              className="space-y-3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Label htmlFor="questionCount" className="text-sm font-medium flex justify-between items-center">
                <span className="flex items-center gap-2">
                  <Info className="h-4 w-4 text-primary" />
                  Number of Questions
                </span>
                <motion.span
                  className="text-xl font-bold text-primary tabular-nums"
                  key={questionCount}
                  initial={{ scale: 1.2, color: "#00ff00" }}
                  animate={{ scale: 1, color: "var(--primary)" }}
                  transition={{ type: "spring", stiffness: 300, damping: 10 }}
                >
                  {questionCount}
                </motion.span>
              </Label>
              <Controller
                name="questionCount"
                control={control}
                render={({ field }) => (
                  <SubscriptionSlider
                    value={field.value}
                    onValueChange={field.onChange}
                    ariaLabel="Select number of questions"
                  />
                )}
              />
              {errors.questionCount && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="text-sm text-destructive"
                >
                  {errors.questionCount.message}
                </motion.p>
              )}
            </motion.div>

            <motion.div
              className="bg-primary/5 border border-primary/20 rounded-lg"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="p-4 space-y-2">
                <h3 className="text-base font-semibold mb-2 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Available Credits
                </h3>
                <Progress value={(credits / 10) * 100} className="h-2" />
                <p className="text-xs text-muted-foreground">
                  You have <span className="font-bold text-primary">{credits}</span> credits remaining.
                </p>
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
                    <AlertCircle className="h-5 w-5" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{errors.root.message}</AlertDescription>
                  </Alert>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.div
              className="pt-4 border-t border-border/60"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <PlanAwareButton
                label="Generate Quiz"
                onClick={onSubmit}
                isLoggedIn={isLoggedIn}
                isEnabled={!isDisabled}
                isLoading={isLoading}
                hasCredits={credits > 0}
                loadingLabel="Generating..."
                className="w-full h-12 transition-all duration-300 hover:shadow-lg"
                customStates={{
                  default: {
                    tooltip: "Click to generate your fill-in-the-blank quiz",
                  },
                  loading: {
                    label: "Generating Quiz...",
                    tooltip: "Please wait while we generate your quiz",
                  },
                  notLoggedIn: {
                    label: "Sign in to Generate",
                    tooltip: "You need to be signed in to create a quiz",
                  },
                  notEnabled: {
                    label: "Enter a valid topic",
                    tooltip: "Please enter a topic with at least 3 characters",
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
    </motion.div>
  )
}

export const FillInTheBlankQuizForm = memo(FillInTheBlankQuizFormComponent)

export default FillInTheBlankQuizForm
