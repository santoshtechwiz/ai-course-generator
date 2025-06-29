"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useMutation } from "@tanstack/react-query"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import axios from "axios"
import { signIn, useSession } from "next-auth/react"
import { Code, HelpCircle, Timer, Sparkles, Check, AlertCircle } from 'lucide-react'
import { motion, AnimatePresence } from "framer-motion"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"

import { usePersistentState } from "@/hooks/usePersistentState"
import { cn } from "@/lib/tailwindUtils"
import { codeQuizSchema } from "@/schema/schema"
import CourseAILoader from "@/components/ui/loader"

import type { z } from "zod"
import type { QueryParams } from "@/app/types/types"
import { SubscriptionSlider } from "@/app/dashboard/subscription/components/SubscriptionSlider"
import { ConfirmDialog } from "../../components/ConfirmDialog"
import PlanAwareButton from "../../components/PlanAwareButton"
import useSubscription from "@/hooks/use-subscription"

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
]

// Group languages by popularity/category for better UX
const LANGUAGE_GROUPS = {
  Popular: ["JavaScript", "Python", "Java"],
  Web: ["TypeScript", "JavaScript", "PHP"],
  Mobile: ["Swift", "Kotlin", "Java"],
  Systems: ["C++", "Rust", "Go", "C#"],
  Other: ["Ruby", "PHP"],
}

// Define proper type for subscription data
interface Subscription {
  subscriptionPlan?: string;
}

export default function CodeQuizForm({ isLoggedIn, maxQuestions, credits, params }: CodeQuizFormProps) {
  const router = useRouter()
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(false)
  const [submitError, setSubmitError] = React.useState<string | null>(null)
  const { data: session, status } = useSession()

  // Type the status
  const { data: subscriptionData } = useSubscription() as { 
    data?: Subscription;
    status?: string;
  }

  const [selectedLanguageGroup, setSelectedLanguageGroup] = React.useState<string>("Popular")

  const [formData, setFormData] = usePersistentState<CodeQuizFormData>("codeQuizFormData", {
    title: params?.title || "",
    amount: params?.amount ? Number.parseInt(params.amount, 10) : maxQuestions,
    difficulty: (["easy", "medium", "hard"].includes(params?.difficulty || "") ? params?.difficulty : "easy") as
      | "easy"
      | "medium"
      | "hard",
    language: params?.language || "JavaScript",
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
    if (params?.title) {
      setValue("title", params.title)
    }
    if (params?.amount) {
      const amount = Number.parseInt(params.amount, 10)
      if (amount !== maxQuestions) {
        setValue("amount", Math.min(amount, maxQuestions))
      }
    }
    if (params?.difficulty && ["easy", "medium", "hard"].includes(params.difficulty)) {
      setValue("difficulty", params.difficulty as "easy" | "medium" | "hard")
    }
    if (params?.language && PROGRAMMING_LANGUAGES.includes(params.language)) {
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
      const response = await axios.post("/api/code-quiz", data)
      return response.data
    },
    onError: (error: any) => {
      console.error("Error creating code quiz:", error)
      setSubmitError(error?.response?.data?.message || "Failed to create code quiz. Please try again.")
    },
  })

  const onSubmit = React.useCallback(
    (data: CodeQuizFormData) => {
      if (isLoading) return

      if (!data.title || !data.amount || !data.difficulty || !data.language) {
        setSubmitError("Please fill in all required fields")
        return
      }

      if (!isLoggedIn) {
        signIn("credentials", { callbackUrl: "/dashboard/code" })
        return
      }

      setSubmitError(null)
      setIsLoading(true)
      setIsConfirmDialogOpen(true)
    },
    [isLoading, isLoggedIn],
  )

  const handleConfirm = React.useCallback(async () => {
    setIsConfirmDialogOpen(false)

    try {
      const formValues = watch()
      const response = await createCodeQuizMutation({
        title: formValues.title,
        amount: formValues.amount,
        difficulty: formValues.difficulty,
        language: formValues.language,
        userType: subscriptionData?.subscriptionPlan,
      })
      const userQuizId = response?.userQuizId

      if (!userQuizId) throw new Error("Code Quiz ID not found")

      router.push(`/dashboard/code/${response?.slug}`)
    } catch (error) {
      // Error is handled in the mutation's onError callback
    } finally {
      setIsLoading(false)
    }
  }, [createCodeQuizMutation, watch, router, subscriptionData?.subscriptionPlan])

  const amount = watch("amount")
  const difficulty = watch("difficulty")
  const title = watch("title")
  const language = watch("language")

  const isFormValid = React.useMemo(() => {
    return !!title && !!amount && !!difficulty && !!language && isValid
  }, [title, amount, difficulty, language, isValid])

  const isDisabled = React.useMemo(() => credits < 1 || !isFormValid || isLoading, [credits, isFormValid, isLoading])

  // Memoize the difficulty options to prevent unnecessary re-renders
  const difficultyOptions = React.useMemo(() => {
    return [
      { value: "easy", label: "Easy", color: "bg-emerald-100 text-emerald-800 border-emerald-200" },
      { value: "medium", label: "Medium", color: "bg-amber-100 text-amber-800 border-amber-200" },
      { value: "hard", label: "Hard", color: "bg-rose-100 text-rose-800 border-rose-200" },
    ]
  }, [])

  // Filter languages based on selected group
  const filteredLanguages = React.useMemo(() => {
    if (selectedLanguageGroup === "All") {
      return PROGRAMMING_LANGUAGES
    }
    return LANGUAGE_GROUPS[selectedLanguageGroup as keyof typeof LANGUAGE_GROUPS] || PROGRAMMING_LANGUAGES
  }, [selectedLanguageGroup])

  // Fix credit percentage calculation to be type-safe and display actual credits
  const creditPercentage = React.useMemo(() => {
    if (typeof credits !== 'number' || isNaN(credits) || credits <= 0) {
      return 0;
    }
    // Use max value as 100 to create better visual scale for progress bar
    const maxCreditDisplay = 100;
    return Math.min((credits / maxCreditDisplay) * 100, 100);
  }, [credits]);

  if (isLoading) {
    return (
      <div className="w-full max-w-4xl mx-auto p-6">
        <CourseAILoader 
          isLoading={true} 
          message="Creating your code quiz..." 
        />
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-4xl mx-auto p-6 space-y-8"
    >
      <Card className="bg-background border border-border shadow-sm hover:shadow-md transition-all duration-300">
       

        <CardContent className="space-y-6 pt-6">
          {submitError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{submitError}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <motion.div
              className="space-y-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Label htmlFor="title" className="text-base font-medium text-foreground flex items-center gap-2">
                Title *
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="w-4 h-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent side="right">
                      <p className="w-[200px]">Enter any programming title you'd like to be quizzed on</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </Label>
              <div className="relative">
                <Input
                  id="title"
                  placeholder="Enter the programming title"
                  className={cn(
                    "w-full p-3 h-12 border border-input rounded-md transition-all pr-10",
                    "focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:border-primary",
                    errors.title ? "border-red-300 focus-visible:ring-red-300" : ""
                  )}
                  {...register("title")}
                  aria-describedby="title-description"
                  aria-invalid={errors.title ? "true" : "false"}
                />
                <Sparkles className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              </div>
              {errors.title && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="text-sm text-destructive mt-1"
                  id="title-error"
                  role="alert"
                >
                  {errors.title.message}
                </motion.p>
              )}
              <p className="text-sm text-muted-foreground" id="title-description">
                Examples: React Hooks, Data Structures, Async/Await, etc.
              </p>
            </motion.div>

            <motion.div
              className="space-y-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Label htmlFor="language" className="text-base font-medium text-foreground flex items-center gap-2">
                Programming Language *
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="w-4 h-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent side="right">
                      <p className="w-[200px]">Select the programming language for your quiz</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </Label>

              <div className="space-y-3">
                <div className="flex flex-wrap gap-2 mb-2">
                  {Object.keys(LANGUAGE_GROUPS).map((group) => (
                    <Badge
                      key={group}
                      variant={selectedLanguageGroup === group ? "default" : "outline"}
                      className="cursor-pointer transition-all duration-200 hover:shadow-sm"
                      onClick={() => setSelectedLanguageGroup(group)}
                    >
                      {group}
                    </Badge>
                  ))}
                  <Badge
                    variant={selectedLanguageGroup === "All" ? "default" : "outline"}
                    className="cursor-pointer transition-all duration-200 hover:shadow-sm"
                    onClick={() => setSelectedLanguageGroup("All")}
                  >
                    All
                  </Badge>
                </div>

                <Controller
                  name="language"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className={cn(
                        "w-full p-3 h-12 border border-input rounded-md transition-all",
                        "focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:border-primary"
                      )}>
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
              </div>

              {errors.language && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="text-sm text-destructive mt-1"
                  role="alert"
                >
                  {errors.language.message}
                </motion.p>
              )}
            </motion.div>

            <motion.div
              className="space-y-4"
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
                      <p className="w-[200px]">Select how many code questions you want in your quiz</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </Label>
              <div className="space-y-3 px-2">
                <div className="flex items-center justify-between px-2">
                  <Timer className="w-5 h-5 text-muted-foreground" />
                  <motion.span
                    className="text-2xl font-bold text-primary"
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
              className="space-y-4"
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
                      <p className="w-[200px]">Choose how challenging the code questions should be</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </Label>
              <div className="grid grid-cols-3 gap-4">
                {difficultyOptions.map((level) => (
                  <Button
                    key={level.value}
                    type="button"
                    variant={difficulty === level.value ? "default" : "outline"}
                    className={cn(
                      "capitalize w-full h-12 font-medium transition-all duration-200",
                      difficulty === level.value ? "border-primary shadow-sm" : "hover:border-primary/50",
                      "focus:ring-2 focus:ring-primary focus:ring-offset-2"
                    )}
                    onClick={() => setValue("difficulty", level.value as "easy" | "medium" | "hard")}
                    aria-pressed={difficulty === level.value}
                  >
                    {level.label}
                    {difficulty === level.value && <Check className="ml-2 h-4 w-4" />}
                  </Button>
                ))}
              </div>
            </motion.div>

            <motion.div
              className="bg-primary/5 border border-primary/20 rounded-lg p-4 space-y-2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <h3 className="text-base font-semibold mb-2 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                Available Credits
              </h3>
              <Progress value={creditPercentage} className="h-2" />
              <p className="text-xs text-muted-foreground">
                You have <span className="font-bold text-primary">{credits}</span> credit{credits !== 1 ? 's' : ''} remaining.
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
              className="pt-4 border-t border-border/60"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
            >
              <PlanAwareButton
                label="Generate Code Quiz"
                onClick={handleSubmit(onSubmit)}
                isLoggedIn={isLoggedIn}
                isEnabled={!isDisabled}
                isLoading={isLoading}
                hasCredits={credits > 0}
                loadingLabel="Generating Code Quiz..."
                className="w-full h-12 text-base font-medium transition-all duration-300 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed focus:ring-2 focus:ring-primary focus:ring-offset-2"
                customStates={{
                  default: {
                    tooltip: "Click to generate your code quiz",
                  },
                  notEnabled: {
                    label: "Enter a title to generate",
                    tooltip: "Please enter a title before generating the quiz",
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
      />
    </motion.div>
  )
}