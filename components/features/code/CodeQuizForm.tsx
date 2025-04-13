"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { useMutation } from "@tanstack/react-query"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import axios from "axios"
import { signIn, useSession } from "next-auth/react"
import { Code, HelpCircle, Timer } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

import PlanAwareButton from "@/components/PlanAwareButton"
import { SubscriptionSlider } from "@/components/SubscriptionSlider"
import { SignInBanner } from "../../../app/auth/signin/components/SignInBanner"
import { ConfirmDialog } from "../quiz/ConfirmDialog"

import useSubscriptionStore from "@/store/useSubscriptionStore"
import { usePersistentState } from "@/hooks/usePersistentState"
import { cn } from "@/lib/utils"
import { codeQuizSchema } from "@/schema/schema"

import type { z } from "zod"
import type { QueryParams } from "@/app/types/types"

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

export default function CodeQuizForm({ isLoggedIn, maxQuestions, credits, params }: CodeQuizFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(false)
  const { data: session, status } = useSession()
  const { subscriptionStatus } = useSubscriptionStore()

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
      data.userType = subscriptionStatus?.subscriptionPlan
      const response = await axios.post("/api/code-quiz", data)
      return response.data
    },
    onError: (error) => {
      console.error("Error creating code quiz:", error)
      toast({
        description: "Failed to create code quiz. Please try again.",
        variant: "destructive",
      })
    },
  })

  const onSubmit = React.useCallback(
    (data: CodeQuizFormData) => {
      if (isLoading) return

      if (!data.title || !data.amount || !data.difficulty || !data.language) {
        toast({
          description: "Please fill in all required fields",
          variant: "destructive",
        })
        return
      }

      if (!isLoggedIn) {
        signIn("credentials", { callbackUrl: "/dashboard/code" })
        return
      }

      setIsLoading(true)
      setIsConfirmDialogOpen(true)
    },
    [isLoading, isLoggedIn, toast],
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
        userType: subscriptionStatus?.subscriptionPlan,
      })
      const userQuizId = response?.userQuizId

      if (!userQuizId) throw new Error("Code Quiz ID not found")

      toast({
        title: "Success!",
        description: "Your code quiz has been created.",
      })

      router.push(`/dashboard/code/${response?.slug}`)
    } catch (error) {
      // Error is handled in the mutation's onError callback
    } finally {
      setIsLoading(false)
    }
  }, [createCodeQuizMutation, watch, toast, router, subscriptionStatus?.subscriptionPlan])

  const amount = watch("amount")
  const difficulty = watch("difficulty")
  const title = watch("title")
  const language = watch("language")

  const isFormValid = React.useMemo(() => {
    return !!title && !!amount && !!difficulty && !!language && isValid
  }, [title, amount, difficulty, language, isValid])

  const isDisabled = React.useMemo(() => credits < 1 || !isFormValid || isLoading, [credits, isFormValid, isLoading])

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-4xl mx-auto p-6 space-y-8 bg-card rounded-lg shadow-md"
    >
      <SignInBanner isAuthenticated={status === "authenticated"} />
      <Card className="bg-background border border-border shadow-sm">
        <CardHeader className="bg-primary/5 border-b border-border/60 pb-6">
          <div className="flex justify-center mb-4">
            <motion.div
              className="p-3 bg-primary/10 rounded-xl"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Code className="w-8 h-8 text-primary" />
            </motion.div>
          </div>
          <CardTitle className="text-2xl md:text-3xl font-bold text-center text-primary">Create Code Quiz</CardTitle>
          <p className="text-center text-base md:text-lg text-muted-foreground mt-2">
            Test your programming knowledge with code-specific questions
          </p>
        </CardHeader>

        <CardContent className="space-y-6 pt-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <motion.div
              className="space-y-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Label htmlFor="title" className="text-base font-medium text-foreground flex items-center gap-2">
                Title
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
                  className="w-full p-3 h-12 border border-input rounded-md focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:border-primary transition-all"
                  {...register("title")}
                  aria-describedby="title-description"
                />
              </div>
              {errors.title && (
                <p className="text-sm text-destructive mt-1" id="title-error">
                  {errors.title.message}
                </p>
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
                Programming Language
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
              <Controller
                name="language"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full p-3 h-12 border border-input rounded-md focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:border-primary transition-all">
                      <SelectValue placeholder="Select a language" />
                    </SelectTrigger>
                    <SelectContent>
                      {PROGRAMMING_LANGUAGES.map((lang) => (
                        <SelectItem key={lang} value={lang}>
                          {lang}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.language && <p className="text-sm text-destructive mt-1">{errors.language.message}</p>}
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
              transition={{ delay: 0.5 }}
            >
              <Label className="text-base font-medium text-foreground flex items-center gap-2">
                Difficulty
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
                {["easy", "medium", "hard"].map((level) => (
                  <Button
                    key={level}
                    type="button"
                    variant={difficulty === level ? "default" : "outline"}
                    className={cn(
                      "capitalize w-full h-12 font-medium transition-all",
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
              className="bg-primary/5 border border-primary/20 rounded-lg p-4 space-y-2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <h3 className="text-base font-semibold mb-2">Available Credits</h3>
              <Progress value={(credits / 10) * 100} className="h-2" />
              <p className="text-xs text-muted-foreground">
                You have <span className="font-bold text-primary">{credits}</span> credits remaining.
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
                className="w-full h-12 text-base font-medium transition-all duration-300 hover:shadow-lg"
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
        onCancel={() => setIsConfirmDialogOpen(false)}
      />
    </motion.div>
  )
}

