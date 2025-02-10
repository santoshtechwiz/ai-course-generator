"use client"

import { memo, useCallback, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { ChevronDown, Info, AlertCircle, Brain } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { PlanAwareButton } from "@/app/components/PlanAwareButton"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { SubscriptionSlider } from "@/app/components/SubscriptionSlider"

export const fetchCache = "force-no-store"

interface TopicFormProps {
  credits: number
  maxQuestions: number
  subscriptionPlan: any
  isLoggedIn: boolean
}

function TopicFormComponent({ credits, maxQuestions, isLoggedIn, subscriptionPlan }: TopicFormProps) {
  const [topic, setTopic] = useState("")
  const [questionCount, setQuestionCount] = useState(maxQuestions)
  const [openInfo, setOpenInfo] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  const generateQuiz = useCallback(async () => {
    setIsLoading(true)
    setError("")

    try {
      const response = await fetch("/api/generate-quiz", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ topic, questionCount }),
      })

      if (!response.ok) {
        throw new Error("Failed to generate quiz")
      }

      const { slug } = await response.json()
      router.push(`/dashboard/openended/${slug}`)
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

  const isDisabled = useMemo(() => isLoading || credits < 1 || !topic.trim(), [isLoading, credits, topic])
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !isDisabled) {
        handleSubmit(e as unknown as React.FormEvent<HTMLFormElement>)
      }
    },
    [handleSubmit, isDisabled],
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
            Open-Ended Quiz Generator
          </CardTitle>
          <p className="text-center text-base md:text-lg text-muted-foreground mt-2">
            Choose a topic and customize your quiz settings below.
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
              <div className="flex items-center space-x-4">
                {/* <Slider
                  id="questionCount"
                  min={1}
                  max={maxQuestions}
                  step={1}
                  value={[questionCount]}
                  onValueChange={(values: number[]) => setQuestionCount(values[0])}
                  className="flex-grow"
                  aria-label="Select number of questions"
                /> */}
                <SubscriptionSlider
                  value={questionCount}
                  onValueChange={setQuestionCount}
                  ariaLabel="Select number of questions"
                />
              </div>
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
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <Alert variant="destructive">
                    <AlertCircle className="h-5 w-5" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                </motion.div>
              )}
            </AnimatePresence>
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
              isLoading={isLoading}
              isEnabled={!isDisabled}
              hasCredits={credits > 0}
              loadingLabel="Generating..."
              className="w-full transition-all duration-300 hover:shadow-lg"
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
        </CardContent>
      </Card>
    </motion.div>
  )
}

export const TopicForm = memo(TopicFormComponent)

export default TopicForm

