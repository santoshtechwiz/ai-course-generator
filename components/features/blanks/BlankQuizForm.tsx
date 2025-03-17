"use client"

import { memo, useCallback, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Brain, Info, AlertCircle } from "lucide-react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"

import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

import useSubscriptionStore from "@/store/useSubscriptionStore"
import PlanAwareButton from "@/components/PlanAwareButton"
import { SubscriptionSlider } from "@/components/SubscriptionSlider"

import type { QueryParams } from "@/app/types/types"

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
  const { subscriptionStatus } = useSubscriptionStore()

  const credits = subscriptionStatus?.credits || 0

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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-2xl mx-auto"
    >
      <Card className="bg-background border border-border/60 shadow-md overflow-hidden">
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
              </Label>
              <Input
                id="title"
                {...register("title")}
                placeholder="E.g., JavaScript Fundamentals, React Hooks, Data Structures..."
                className="w-full h-12 text-lg transition-all duration-300 focus:ring-2 focus:ring-primary"
                aria-label="Quiz topic"
                autoFocus
              />
              {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
            </motion.div>

            <motion.div
              className="space-y-3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Label htmlFor="questionCount" className="text-sm font-medium flex justify-between items-center">
                <span>Number of Questions</span>
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
              {errors.questionCount && <p className="text-sm text-destructive">{errors.questionCount.message}</p>}
            </motion.div>

            <motion.div
              className="bg-primary/5 border border-primary/20 rounded-lg"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="p-4 space-y-2">
                <h3 className="text-base font-semibold mb-2">Available Credits</h3>
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

