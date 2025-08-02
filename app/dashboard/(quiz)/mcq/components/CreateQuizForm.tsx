"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks"
import { useMutation } from "@tanstack/react-query"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import axios from "axios"
import { signIn, useSession } from "next-auth/react"
import { HelpCircle, Timer, Sparkles, Check, Brain, BookOpen, GraduationCap, Target, Lightbulb } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

import { ConfirmDialog } from "../../components/ConfirmDialog"
import { quizSchema } from "@/schema/schema"
import { usePersistentState } from "@/hooks/usePersistentState"
import { cn } from "@/lib/utils"
import { useSubscription } from "@/modules/auth"

import type { z } from "zod"
import type { QueryParams } from "@/app/types/types"
import PlanAwareButton from "../../components/PlanAwareButton"
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

const SUBJECT_CATEGORIES = {
  Academic: {
    icon: GraduationCap,
    color:
      "bg-gradient-to-r from-blue-400 to-cyan-500 text-white shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 border-0",
    subjects: [
      "Mathematics",
      "Physics",
      "Chemistry",
      "Biology",
      "Computer Science",
      "History",
      "Geography",
      "Literature",
      "Philosophy",
      "Psychology",
      "Economics",
      "Political Science",
      "Sociology",
      "Anthropology",
    ],
  },
  Professional: {
    icon: Target,
    color:
      "bg-gradient-to-r from-green-400 to-emerald-500 text-white shadow-lg shadow-green-500/25 hover:shadow-green-500/40 border-0",
    subjects: [
      "Project Management",
      "Marketing",
      "Finance",
      "Human Resources",
      "Business Strategy",
      "Data Analysis",
      "Digital Marketing",
      "Sales",
      "Leadership",
      "Operations Management",
      "Quality Assurance",
    ],
  },
  Technology: {
    icon: Brain,
    color:
      "bg-gradient-to-r from-purple-400 to-violet-500 text-white shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 border-0",
    subjects: [
      "Web Development",
      "Mobile Development",
      "Data Science",
      "Machine Learning",
      "Cybersecurity",
      "Cloud Computing",
      "DevOps",
      "UI/UX Design",
      "Database Management",
      "Network Administration",
      "Software Testing",
    ],
  },
  General: {
    icon: BookOpen,
    color:
      "bg-gradient-to-r from-slate-400 to-gray-500 text-white shadow-lg shadow-slate-500/25 hover:shadow-slate-500/40 border-0",
    subjects: [
      "General Knowledge",
      "Current Affairs",
      "Sports",
      "Entertainment",
      "Science & Nature",
      "Art & Culture",
      "Food & Cooking",
      "Travel",
      "Health & Fitness",
      "Personal Development",
    ],
  },
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

      if (!isLoggedIn) {
        signIn("credentials", { callbackUrl: `/dashboard/mcq` })
        return
      }

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

  const creditPercentage = React.useMemo(() => {
    if (typeof credits !== "number" || isNaN(credits) || credits <= 0) {
      return 0
    }
    const maxCreditDisplay = 100
    return Math.min((credits / maxCreditDisplay) * 100, 100)
  }, [credits])

  return (
    <FormContainer variant="glass">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Topic Selection */}
        <motion.div
          className="space-y-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex items-center gap-2">
            <Label htmlFor="title" className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Topic
            </Label>
            <span className="text-rose-500">*</span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="w-4 h-4 text-slate-400 cursor-help" />
                </TooltipTrigger>
                <TooltipContent side="right" className="max-w-xs">
                  <p>Enter any topic you'd like to be quizzed on</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          <div className="space-y-4">
            <p className="text-sm text-slate-600 dark:text-slate-400">Choose a category:</p>

            <div className="flex flex-wrap gap-3">
              {Object.entries(SUBJECT_CATEGORIES).map(([categoryName, category]) => {
                const Icon = category.icon
                const isSelected = selectedCategory === categoryName

                return (
                  <motion.button
                    key={categoryName}
                    type="button"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-full font-medium text-sm transition-all duration-200",
                      isSelected
                        ? category.color
                        : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700",
                    )}
                    onClick={() => setSelectedCategory(selectedCategory === categoryName ? null : categoryName)}
                  >
                    <Icon className="w-4 h-4" />
                    {categoryName}
                  </motion.button>
                )
              })}
            </div>

            {selectedCategory && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl"
              >
                {SUBJECT_CATEGORIES[selectedCategory as keyof typeof SUBJECT_CATEGORIES].subjects.map((subject) => (
                  <motion.button
                    key={subject}
                    type="button"
                    onClick={() => setValue("title", subject)}
                    className={cn(
                      "p-3 rounded-lg text-sm font-medium transition-all duration-300 text-left",
                      title === subject
                        ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg shadow-indigo-500/25"
                        : "bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600 hover:shadow-md",
                    )}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {subject}
                  </motion.button>
                ))}
              </motion.div>
            )}

            <div className="relative">
              <Input
                id="title"
                placeholder="Enter the quiz topic"
                className="w-full h-12 text-base bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-500/20 dark:focus:ring-blue-400/20 pr-12"
                {...register("title")}
                aria-describedby="topic-description"
              />
              <Lightbulb className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
            </div>

            {errors.title && (
              <p className="text-sm text-red-600 dark:text-red-400" id="topic-error">
                {errors.title.message}
              </p>
            )}

            <p className="text-sm text-slate-600 dark:text-slate-400" id="topic-description">
              Choose a specific topic for more focused questions
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
          <Label className="text-lg font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            Number of Questions
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="w-4 h-4 text-slate-400 cursor-help" />
                </TooltipTrigger>
                <TooltipContent side="right" className="max-w-xs">
                  <p>Select how many questions you want in your quiz</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </Label>

          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <Timer className="w-6 h-6 text-slate-400" />
              <motion.span
                className="text-3xl font-bold text-indigo-600 dark:text-indigo-400 tabular-nums"
                key={amount}
                initial={{ scale: 1.2, color: "#00ff00" }}
                animate={{ scale: 1, color: "rgb(99 102 241)" }}
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

            <p className="text-sm text-slate-600 dark:text-slate-400 text-center">
              Select between 1 and {maxQuestions} questions
            </p>
          </div>

          {errors.amount && <p className="text-sm text-red-600 dark:text-red-400">{errors.amount.message}</p>}

          <p className="text-sm text-slate-600 dark:text-slate-400">
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
          <Label className="text-lg font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            Difficulty
            <span className="text-rose-500">*</span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="w-4 h-4 text-slate-400 cursor-help" />
                </TooltipTrigger>
                <TooltipContent side="right" className="max-w-xs">
                  <p>Choose how challenging the questions should be</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </Label>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {["easy", "medium", "hard"].map((level) => (
              <Button
                key={level}
                type="button"
                variant={difficulty === level ? "default" : "outline"}
                className={cn(
                  "capitalize w-full h-14 font-semibold transition-all duration-200 text-base",
                  difficulty === level
                    ? level === "easy"
                      ? "bg-gradient-to-r from-emerald-500 to-green-500 text-white shadow-lg shadow-emerald-500/25 border-0 hover:scale-105"
                      : level === "medium"
                        ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/25 border-0 hover:scale-105"
                        : "bg-gradient-to-r from-rose-500 to-red-500 text-white shadow-lg shadow-rose-500/25 border-0 hover:scale-105"
                    : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600",
                )}
                onClick={() => setValue("difficulty", level as "easy" | "medium" | "hard")}
                aria-pressed={difficulty === level}
              >
                {level}
                {difficulty === level && <Check className="ml-2 h-5 w-5" />}
              </Button>
            ))}
          </div>
        </motion.div>

        {/* Available Credits */}
        <motion.div
          className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 rounded-xl p-6 space-y-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h3 className="text-lg font-semibold mb-2 flex items-center gap-2 text-slate-900 dark:text-slate-100">
            <Sparkles className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            Available Credits
          </h3>
          <Progress value={creditPercentage} className="h-3" />
          <p className="text-sm text-slate-600 dark:text-slate-400">
            You have <span className="font-bold text-indigo-600 dark:text-indigo-400">{credits}</span> credit
            {credits !== 1 ? "s" : ""} remaining.
          </p>
        </motion.div>

        <AnimatePresence>
          {errors.root && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <Alert variant="destructive">
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
            hasCredits={credits > 0}
            loadingLabel="Generating Quiz..."
            className="w-full h-14 text-lg font-semibold transition-all duration-300 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white border-0 shadow-lg hover:shadow-xl hover:shadow-indigo-500/25 disabled:bg-gradient-to-r disabled:from-sky-300 disabled:to-cyan-300 disabled:text-white disabled:opacity-100 disabled:cursor-not-allowed"
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
          estimatedTokens: Math.min(watch("amount") || 1, 5) * 120,
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
    </FormContainer>
  )
}
