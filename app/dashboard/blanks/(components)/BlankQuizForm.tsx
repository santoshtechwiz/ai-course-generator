"use client"

import { memo, useCallback, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Input } from "@/components/ui/input"
import { Info, Brain } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { PlanAwareButton } from "@/app/components/PlanAwareButton"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { SubscriptionSlider } from "@/app/components/SubscriptionSlider"
import useSubscriptionStore from "@/store/useSubscriptionStore"

const SUBSCRIPTION_PLANS = [
  // Add your subscription plan data here
  { name: "Basic", limits: { totalQuestions: 5 } },
  { name: "Premium", limits: { totalQuestions: 100 } },
  // ... more plans
]

interface TopicFormProps {
  isLoggedIn: boolean
}

function FillInTheBlankQuizFormComponent({ isLoggedIn }: TopicFormProps) {
  const [topic, setTopic] = useState("")
  const [questionCount, setQuestionCount] = useState(5)
  const [openInfo, setOpenInfo] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()
  const { subscriptionStatus } = useSubscriptionStore()

  const credits = subscriptionStatus?.credits || 0
  const maxQuestions = subscriptionStatus?.subscriptionPlan
    ? SUBSCRIPTION_PLANS.find((plan) => plan.name === subscriptionStatus.subscriptionPlan)?.limits.totalQuestions || 5
    : 5

  const generateQuiz = useCallback(async () => {
    setIsLoading(true)
    setError("")

    try {
      const response = await fetch("/api/blanks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ topic, questionCount, difficulty: "easy" }),
      })

      if (!response.ok) {
        throw new Error("Failed to generate quiz")
      }

      const { slug } = await response.json()
      router.push(`/dashboard/blanks/${slug}`)
    } catch (err) {
      console.error("Error generating quiz:", err)
      setError("Failed to generate quiz. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }, [topic, questionCount, router])

  const handleSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault()
      await generateQuiz()
    },
    [generateQuiz],
  )

  const isFormValid = useMemo(() => topic.trim().length >= 3, [topic])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && isFormValid && !isLoading) {
        handleSubmit(e as unknown as React.FormEvent<HTMLFormElement>)
      }
    },
    [handleSubmit, isFormValid, isLoading],
  )

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-2xl mx-auto"
    >
      <Card className="bg-background border border-border shadow-sm">
        <CardHeader className="bg-primary/5 border-b">
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
          <form onSubmit={handleSubmit} className="space-y-6" onKeyDown={handleKeyDown}>
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
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="E.g., Climate Change, AI in Education..."
                className="w-full h-12 text-lg transition-all duration-300 focus:ring-2 focus:ring-primary"
                aria-label="Quiz topic"
                autoFocus
                required
                minLength={3}
              />
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
              <SubscriptionSlider
                value={questionCount}
                onValueChange={setQuestionCount}
                ariaLabel="Select number of questions"
              />
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

            {/* ... (rest of the component remains the same) ... */}
          </form>

          <motion.div
            className="pt-4 border-t"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <PlanAwareButton
              label="Generate Quiz"
              onClick={generateQuiz}
              isLoggedIn={isLoggedIn}
              isEnabled={isFormValid}
              isLoading={isLoading}
              hasCredits={credits > 0}
              loadingLabel="Generating..."
              className="w-full transition-all duration-300 hover:shadow-lg"
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
        </CardContent>
      </Card>
    </motion.div>
  )
}

export const FillInTheBlankQuizForm = memo(FillInTheBlankQuizFormComponent)

export default FillInTheBlankQuizForm

