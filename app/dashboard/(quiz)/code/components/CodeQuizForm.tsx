"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useMutation } from "@tanstack/react-query"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import axios from "axios"
import { signIn, useSession } from "next-auth/react"
import {
  HelpCircle,
  Timer,
  Sparkles,
  Check,
  AlertCircle,
  Star,
  Globe,
  Smartphone,
  Cpu,
  Database,
  Zap,
  Terminal,
  Code,
  Plus,
} from "lucide-react"
import { motion } from "framer-motion"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

import { usePersistentState } from "@/hooks/usePersistentState"
import { cn } from "@/lib/tailwindUtils"
import { codeQuizSchema } from "@/schema/schema"
import { GlobalLoader } from "@/components/ui/loader"

import type { z } from "zod"
import { SubscriptionSlider } from "@/app/dashboard/subscription/components/SubscriptionSlider"
import type { QueryParams } from "@/app/types/types"
import { useSubscription } from "@/modules/auth"
import { ConfirmDialog } from "../../components/ConfirmDialog"
import PlanAwareButton from "../../components/PlanAwareButton"
import FormContainer from "@/app/dashboard/FormContainer"

type CodeQuizFormData = z.infer<typeof codeQuizSchema> & {
  userType?: string
}

interface CodeQuizFormProps {
  credits: number
  isLoggedIn: boolean
  maxQuestions: number
  params?: QueryParams
}

const PROGRAMMING_LANGUAGES = [
  "JavaScript",
  "TypeScript",
  "Python",
  "Java",
  "C#",
  "C++",
  "Go",
  "Rust",
  "Swift",
  "Kotlin",
  "PHP",
  "Ruby",
  "HTML/CSS",
  "SQL",
  "Bash/Shell",
  "PowerShell",
  "R",
  "Scala",
  "Dart",
  "Lua",
  "Perl",
  "Haskell",
  "Clojure",
  "F#",
  "VB.NET",
  "Objective-C",
  "Assembly",
  "MATLAB",
  "Groovy",
  "Elixir",
  "Erlang",
  "Crystal",
  "Nim",
  "Zig",
  "Other/Custom",
]

const LANGUAGE_GROUPS = {
  Popular: ["JavaScript", "Python", "Java", "TypeScript"],
  Web: ["JavaScript", "TypeScript", "HTML/CSS", "PHP", "Go"],
  Mobile: ["Swift", "Kotlin", "Java", "Dart", "Objective-C"],
  Systems: ["C++", "Rust", "Go", "C#", "Assembly"],
  Data: ["Python", "R", "SQL", "MATLAB", "Scala"],
  Functional: ["Haskell", "Clojure", "F#", "Elixir", "Erlang"],
  Scripts: ["Bash/Shell", "PowerShell", "Perl", "Lua"],
  Other: ["Ruby", "Crystal", "Nim", "Zig", "Groovy"],
}

const LANGUAGE_GROUP_CONFIG = {
  Popular: {
    icon: Star,
    color:
      "bg-gradient-to-r from-amber-400 to-yellow-500 text-white shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 border-0",
    hoverScale: "hover:scale-105",
  },
  Web: {
    icon: Globe,
    color:
      "bg-gradient-to-r from-blue-400 to-cyan-500 text-white shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 border-0",
    hoverScale: "hover:scale-105",
  },
  Mobile: {
    icon: Smartphone,
    color:
      "bg-gradient-to-r from-green-400 to-emerald-500 text-white shadow-lg shadow-green-500/25 hover:shadow-green-500/40 border-0",
    hoverScale: "hover:scale-105",
  },
  Systems: {
    icon: Cpu,
    color:
      "bg-gradient-to-r from-red-400 to-rose-500 text-white shadow-lg shadow-red-500/25 hover:shadow-red-500/40 border-0",
    hoverScale: "hover:scale-105",
  },
  Data: {
    icon: Database,
    color:
      "bg-gradient-to-r from-purple-400 to-violet-500 text-white shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 border-0",
    hoverScale: "hover:scale-105",
  },
  Functional: {
    icon: Zap,
    color:
      "bg-gradient-to-r from-orange-400 to-amber-500 text-white shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 border-0",
    hoverScale: "hover:scale-105",
  },
  Scripts: {
    icon: Terminal,
    color:
      "bg-gradient-to-r from-slate-400 to-gray-500 text-white shadow-lg shadow-slate-500/25 hover:shadow-slate-500/40 border-0",
    hoverScale: "hover:scale-105",
  },
  Other: {
    icon: Code,
    color:
      "bg-gradient-to-r from-teal-400 to-cyan-500 text-white shadow-lg shadow-teal-500/25 hover:shadow-teal-500/40 border-0",
    hoverScale: "hover:scale-105",
  },
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

  const { data: subscriptionData } = useSubscription() as {
    data?: Subscription
    status?: string
  }

  const [selectedLanguageGroup, setSelectedLanguageGroup] = React.useState<string>("Popular")
  const [showCustomLanguage, setShowCustomLanguage] = React.useState(false)
  const [customLanguage, setCustomLanguage] = React.useState("")
  const [formData, setFormData] = usePersistentState<CodeQuizFormData>("codeQuizFormData", {
    title: (typeof params?.title === "string" ? params.title : "") || "",
    amount: (typeof params?.amount === "string" ? Number.parseInt(params.amount, 10) : maxQuestions) || maxQuestions,
    difficulty: (typeof params?.difficulty === "string" && ["easy", "medium", "hard"].includes(params.difficulty)
      ? params.difficulty
      : "easy") as "easy" | "medium" | "hard",
    language: (typeof params?.language === "string" ? params.language : "JavaScript") || "JavaScript",
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
    if (typeof params?.language === "string" && PROGRAMMING_LANGUAGES.includes(params.language)) {
      setValue("language", params.language)
    }
  }, [params?.title, params?.amount, params?.difficulty, params?.language, maxQuestions, setValue])

  React.useEffect(() => {
    const subscription = watch((value) => setFormData(value as CodeQuizFormData))
    return () => subscription.unsubscribe()
  }, [watch, setFormData])

  const { mutateAsync: createCodeQuizMutation } = useMutation({
    mutationFn: async (data: CodeQuizFormData) => {
      data.userType = subscriptionData?.subscriptionPlan
      const response = await axios.post("/api/quizzes/code", data)
      return response.data
    },
    onError: (error: any) => {
      console.error("Error creating code quiz:", error)
      setSubmitError(error?.response?.data?.message || "Failed to create code quiz. Please try again.")
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

      if (!currentValues.language?.trim()) {
        setSubmitError("Please select a programming language")
        return
      }

      // Check authentication
      if (!isLoggedIn) {
        signIn("credentials", { callbackUrl: "/dashboard/code" })
        return
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
      if (!formValues.title || !formValues.amount || !formValues.difficulty || !formValues.language) {
        throw new Error("Please complete all required fields")
      }

      const response = await createCodeQuizMutation({
        title: formValues.title.trim(),
        amount: formValues.amount,
        difficulty: formValues.difficulty,
        language: formValues.language.trim(),
        userType: subscriptionData?.subscriptionPlan,
      })

      if (!response?.userQuizId || !response?.slug) {
        throw new Error("Invalid response from server")
      }

      // Close dialog before navigation
      setIsConfirmDialogOpen(false)

      // Navigate to the quiz
      router.push(`/dashboard/code/${response.slug}`)
    } catch (error) {
      console.error("Code quiz creation error:", error)
      const errorMessage = error instanceof Error ? error.message : "Failed to create quiz"
      setSubmitError(errorMessage)
      // Keep dialog open to show error
    } finally {
      setIsLoading(false)
    }
  }, [createCodeQuizMutation, formData, router, subscriptionData?.subscriptionPlan])

  const amount = watch("amount")
  const difficulty = watch("difficulty")
  const title = watch("title")
  const language = watch("language")

  const isFormValid = React.useMemo(() => {
    return !!title && !!amount && !!difficulty && !!language && isValid
  }, [title, amount, difficulty, language, isValid])

  const isDisabled = React.useMemo(() => credits < 1 || !isFormValid || isLoading, [credits, isFormValid, isLoading])

  const difficultyOptions = React.useMemo(() => {
    return [
      {
        value: "easy",
        label: "Easy",
        color: "bg-gradient-to-r from-emerald-500 to-green-500 text-white shadow-lg shadow-emerald-500/25",
      },
      {
        value: "medium",
        label: "Medium",
        color: "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/25",
      },
      {
        value: "hard",
        label: "Hard",
        color: "bg-gradient-to-r from-rose-500 to-red-500 text-white shadow-lg shadow-rose-500/25",
      },
    ]
  }, [])

  const filteredLanguages = React.useMemo(() => {
    if (selectedLanguageGroup === "All") {
      return PROGRAMMING_LANGUAGES
    }
    return LANGUAGE_GROUPS[selectedLanguageGroup as keyof typeof LANGUAGE_GROUPS] || PROGRAMMING_LANGUAGES
  }, [selectedLanguageGroup])

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
        <GlobalLoader />
      </FormContainer>
    )
  }

  return (
    <FormContainer>
      {submitError && !isConfirmDialogOpen && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{submitError}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Programming Language Selection */}
        <motion.div
          className="space-y-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex items-center gap-2">
            <Label htmlFor="language" className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Programming Language
            </Label>
            <span className="text-rose-500">*</span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="w-4 h-4 text-slate-400 cursor-help" />
                </TooltipTrigger>
                <TooltipContent side="right" className="max-w-xs">
                  <p>Select the programming language for your quiz</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          <div className="space-y-4">
            <p className="text-sm text-slate-600 dark:text-slate-400">Choose a category:</p>

            <div className="flex flex-wrap gap-3">
              {Object.keys(LANGUAGE_GROUPS).map((group) => {
                const config = LANGUAGE_GROUP_CONFIG[group as keyof typeof LANGUAGE_GROUP_CONFIG]
                const IconComponent = config.icon
                const isSelected = selectedLanguageGroup === group

                return (
                  <motion.button
                    key={group}
                    type="button"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-full font-medium text-sm transition-all duration-200",
                      isSelected
                        ? config.color
                        : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700",
                    )}
                    onClick={() => setSelectedLanguageGroup(group)}
                  >
                    <IconComponent className="w-4 h-4" />
                    {group}
                  </motion.button>
                )
              })}

              <motion.button
                type="button"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-full font-medium text-sm transition-all duration-200",
                  selectedLanguageGroup === "All"
                    ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 border-0"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700",
                )}
                onClick={() => setSelectedLanguageGroup("All")}
              >
                <Code className="w-4 h-4" />
                All Languages
              </motion.button>
            </div>

            {!showCustomLanguage ? (
              <div className="space-y-3">
                <Controller
                  name="language"
                  control={control}
                  render={({ field }) => (
                    <Select
                      value={field.value}
                      onValueChange={(value) => {
                        if (value === "Other/Custom") {
                          setShowCustomLanguage(true)
                          field.onChange("")
                        } else {
                          field.onChange(value)
                        }
                      }}
                    >
                      <SelectTrigger className="w-full h-12 text-base bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-500/20 dark:focus:ring-blue-400/20">
                        <SelectValue placeholder="Select a language" />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredLanguages.map((lang) => (
                          <SelectItem key={lang} value={lang}>
                            {lang}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCustomLanguage(true)}
                  className="text-sm border-dashed border-2 hover:border-solid transition-all duration-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Enter custom language
                </Button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Input
                  placeholder="Enter custom programming language"
                  value={customLanguage}
                  onChange={(e) => {
                    setCustomLanguage(e.target.value)
                    setValue("language", e.target.value)
                  }}
                  className="flex-1 h-12 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-500/20 dark:focus:ring-blue-400/20"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowCustomLanguage(false)
                    setValue("language", "JavaScript")
                    setCustomLanguage("")
                  }}
                  className="h-12"
                >
                  Cancel
                </Button>
              </div>
            )}
          </div>

          {errors.language && (
            <motion.p
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="text-sm text-red-600 dark:text-red-400"
              role="alert"
            >
              {errors.language.message}
            </motion.p>
          )}
        </motion.div>

        {/* Topic/Title Selection */}
        <motion.div
          className="space-y-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center gap-2">
            <Label htmlFor="title" className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Topic/Title
            </Label>
            <span className="text-rose-500">*</span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="w-4 h-4 text-slate-400 cursor-help" />
                </TooltipTrigger>
                <TooltipContent side="right" className="max-w-xs">
                  <p>Enter any programming topic you'd like to be quizzed on</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          <div className="relative">
            <Input
              id="title"
              placeholder="Enter the programming topic (e.g., React Hooks, Data Structures, Async/Await)"
              className="w-full h-12 text-base bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-500/20 dark:focus:ring-blue-400/20 pr-12"
              {...register("title")}
              aria-describedby="title-description"
              aria-invalid={errors.title ? "true" : "false"}
            />
            <Sparkles className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
          </div>

          {errors.title && (
            <motion.p
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="text-sm text-red-600 dark:text-red-400"
              id="title-error"
              role="alert"
            >
              {errors.title.message}
            </motion.p>
          )}

          <p className="text-sm text-slate-600 dark:text-slate-400" id="title-description">
            Examples: React Hooks, Data Structures, Async/Await, OOP Concepts, etc.
          </p>
        </motion.div>

        {/* Number of Questions */}
        <motion.div
          className="space-y-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Label className="text-lg font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            Number of Questions
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="w-4 h-4 text-slate-400 cursor-help" />
                </TooltipTrigger>
                <TooltipContent side="right" className="max-w-xs">
                  <p>Select how many code questions you want in your quiz</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </Label>

          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <Timer className="w-6 h-6 text-slate-400" />
              <motion.span
                className="text-3xl font-bold text-blue-600 dark:text-blue-400 tabular-nums"
                key={amount}
                initial={{ scale: 1.2, color: "#00ff00" }}
                animate={{ scale: 1, color: "rgb(37 99 235)" }}
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

          {errors.amount && (
            <motion.p
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="text-sm text-red-600 dark:text-red-400"
              role="alert"
            >
              {errors.amount.message}
            </motion.p>
          )}
        </motion.div>

        {/* Difficulty */}
        <motion.div
          className="space-y-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
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
                  <p>Choose how challenging the code questions should be</p>
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
                  "capitalize w-full h-14 font-semibold transition-all duration-200 text-base",
                  difficulty === level.value
                    ? level.color + " border-0 hover:scale-105"
                    : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600",
                )}
                onClick={() => setValue("difficulty", level.value as "easy" | "medium" | "hard")}
                aria-pressed={difficulty === level.value}
              >
                {level.label}
                {difficulty === level.value && <Check className="ml-2 h-5 w-5" />}
              </Button>
            ))}
          </div>
        </motion.div>

        {/* Available Credits */}
        <motion.div
          className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-xl p-6 space-y-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <h3 className="text-lg font-semibold mb-2 flex items-center gap-2 text-slate-900 dark:text-slate-100">
            <Sparkles className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            Available Credits
          </h3>
          <Progress value={creditPercentage} className="h-3" />
          <p className="text-sm text-slate-600 dark:text-slate-400">
            You have <span className="font-bold text-blue-600 dark:text-blue-400">{credits}</span> credit
            {credits !== 1 ? "s" : ""} remaining.
          </p>
        </motion.div>

        {/* Submit Button */}
        <motion.div
          className="pt-6"
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
            hasCredits={credits > 0}
            loadingLabel="Generating Code Quiz..."
            className="w-full h-14 text-lg font-semibold transition-all duration-300 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white border-0 shadow-lg hover:shadow-xl hover:shadow-blue-500/25 disabled:bg-gradient-to-r disabled:from-sky-300 disabled:to-cyan-300 disabled:text-white disabled:opacity-100 disabled:cursor-not-allowed focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            customStates={{
              default: {
                tooltip: "Click to generate your code quiz",
              },
              notEnabled: {
                label: "Enter a topic to generate",
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
        showTokenUsage={true}
        status={isLoading ? "loading" : submitError ? "error" : undefined}
        errorMessage={submitError ?? undefined}
        tokenUsage={{
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
          estimatedTokens: Math.min(formData.amount || 1, 5) * 150,
        }}
      >
        <div className="py-2">
          <p className="text-sm">
            Generating {formData.amount || 1} code questions at{" "}
            <span className="font-medium capitalize">{formData.difficulty || "easy"}</span> difficulty level for{" "}
            <span className="font-medium">{formData.language || "JavaScript"}</span> programming on topic:{" "}
            <span className="font-medium">{formData.title || "Not specified"}</span>
          </p>
        </div>
      </ConfirmDialog>
    </FormContainer>
  )
}