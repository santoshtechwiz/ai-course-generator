"use client"

import { memo, useCallback, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Brain, ChevronDown, Info, AlertCircle } from "lucide-react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

import { SubscriptionSlider } from "@/app/dashboard/subscription/components/SubscriptionSlider"

import type { QueryParams } from "@/app/types/types"
import PlanAwareButton from "../../components/PlanAwareButton"

// Define schema with zod for consistent validation
const openEndedQuizSchema = z.object({
  topic: z
    .string()
    .min(3, "Topic must be at least 3 characters long")
    .max(100, "Topic must be at most 100 characters long"),
  questionCount: z.number().min(1, "At least 1 question is required").max(15, "Maximum 20 questions allowed"),
})

type OpenEndedQuizFormData = z.infer<typeof openEndedQuizSchema>

interface TopicFormProps {
  credits: number
  maxQuestions: number
  isLoggedIn: boolean
  params?: QueryParams
}

function TopicFormComponent({ credits, maxQuestions, isLoggedIn, params }: TopicFormProps) {
  const router = useRouter()
  const [openInfo, setOpenInfo] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const {
    control,
    register,
    handleSubmit,
    watch,
    formState: { errors, isValid },
  } = useForm<OpenEndedQuizFormData>({
    resolver: zodResolver(openEndedQuizSchema),
    defaultValues: {
      topic: params?.topic || "",
      questionCount: params?.amount ? Number.parseInt(params.amount, 10) : maxQuestions,
    },
    mode: "onChange",
  })

  const generateQuiz = useCallback(
    async (data: OpenEndedQuizFormData) => {
      let isMounted = true
      setIsLoading(true)

      try {
        const response = await fetch("/api/generate-quiz", {
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
        if (isMounted) router.push(`/dashboard/openended/${slug}`)
      } catch (err) {
        if (isMounted) {
          console.error("Error generating quiz:", err)
        }
      } finally {
        if (isMounted) setIsLoading(false)
      }
      return () => { isMounted = false }
    },
    [router],
  )

  const onSubmit = handleSubmit(generateQuiz)

  const topic = watch("topic")
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
            Open-Ended Quiz Generator
          </CardTitle>
          <p className="text-center text-base md:text-lg text-muted-foreground mt-2">
            Choose a topic and customize your quiz settings below.
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
              <Label htmlFor="topic" className="text-sm font-medium flex items-center gap-2">
                <Info className="h-4 w-4 text-primary" />
                Quiz Topic
              </Label>
              <Input
                id="topic"
                {...register("topic")}
                placeholder="E.g., Climate Change, AI in Education..."
                className="w-full h-12 text-lg transition-all duration-300 focus:ring-2 focus:ring-primary"
                aria-label="Quiz topic"
                autoFocus
              />
              {errors.topic && <p className="text-sm text-destructive">{errors.topic.message}</p>}
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

            <motion.div
              className="bg-muted cursor-pointer transition-colors hover:bg-muted/80 rounded-lg"
              onClick={() => setOpenInfo(!openInfo)}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <div className="flex flex-row items-center justify-between py-2 px-4">
                <h3 className="text-sm font-semibold">About Open-ended Questions</h3>
                <motion.div animate={{ rotate: openInfo ? 180 : 0 }} transition={{ duration: 0.3 }}>
                  <ChevronDown className="h-4 w-4" />
                </motion.div>
              </div>
              <AnimatePresence>
                {openInfo && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="text-sm px-4 pb-4 space-y-2">
                      <p>
                        Open-ended questions encourage critical thinking and detailed responses. They are perfect for:
                      </p>
                      <ul className="list-disc list-inside space-y-1">
                        <li>Assessing deep understanding</li>
                        <li>Promoting thoughtful discussion</li>
                        <li>Developing analytical skills</li>
                        <li>Encouraging creative thinking</li>
                      </ul>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
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
                isLoading={isLoading}
                isEnabled={!isDisabled}
                hasCredits={credits > 0}
                loadingLabel="Generating..."
                className="w-full h-12 transition-all duration-300 hover:shadow-lg"
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
    </motion.div>
  )
}

export const OpenEndedQuizForm = memo(TopicFormComponent)

export default OpenEndedQuizForm
