"use client"

import { memo, useCallback, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { ChevronDown, ChevronUp, Info, AlertCircle } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { PlanAwareButton } from "@/app/components/PlanAwareButton"

interface TopicFormProps {
  credits: number
  maxQuestions: number
  isLoggedIn: boolean
}

function FillInTheBlankQuizFormComponent({ credits, maxQuestions, isLoggedIn }: TopicFormProps) {
  const [topic, setTopic] = useState("")
  const [questionCount, setQuestionCount] = useState(5)
  const [openInfo, setOpenInfo] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

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

  const renderQuestionCount = () => (
    <div className="space-y-3">
      <label htmlFor="questionCount" className="text-sm font-medium flex justify-between items-center">
        <span>Number of Questions</span>
        <span className="text-xl font-bold text-primary tabular-nums">{questionCount}</span>
      </label>
      <div className="flex items-center space-x-4">
        <Slider
          id="questionCount"
          min={1}
          max={maxQuestions}
          step={1}
          value={[questionCount]}
          onValueChange={(values) => setQuestionCount(values[0])}
          className="flex-grow"
          aria-label="Select number of questions"
        />
      </div>
    </div>
  )

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full"
    >
      <div className="flex flex-col bg-background border border-border shadow-sm">
        <div className="px-2 sm:px-4 pb-4 border-b">
          <p className="text-base text-muted-foreground">
            Select a topic and customize your quiz with fill-in-the-blank questions.
          </p>
        </div>

        <div className="space-y-6 flex-grow px-2 sm:px-4 py-6">
          <form onSubmit={handleSubmit} className="space-y-6" onKeyDown={handleKeyDown}>
            <div className="space-y-3">
              <label htmlFor="topic" className="text-sm font-medium flex items-center gap-2">
                <Info className="h-4 w-4 text-primary" />
                Quiz Topic
              </label>
              <Input
                id="topic"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="E.g., Climate Change, AI in Education..."
                className="w-full h-12 text-lg"
                aria-label="Quiz topic"
                autoFocus
                required
                minLength={3}
              />
            </div>

            {renderQuestionCount()}

            <div className="bg-primary/5 border border-primary/20 rounded-lg">
              <div className="p-4 space-y-2">
                <h3 className="text-base font-semibold mb-2">Available Credits</h3>
                <Progress value={(credits / 10) * 100} className="h-2" />
                <p className="text-xs text-muted-foreground">
                  You have <span className="font-bold text-primary">{credits}</span> credits remaining.
                </p>
              </div>
            </div>

            <div
              className="bg-muted cursor-pointer transition-colors hover:bg-muted/80 rounded-lg"
              onClick={() => setOpenInfo(!openInfo)}
            >
              <div className="flex flex-row items-center justify-between py-2 px-4">
                <h3 className="text-sm font-semibold">About Fill-in-the-Blank Questions</h3>
                {openInfo ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
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
                        Fill-in-the-blank questions assess the ability to recall and apply knowledge in context. They
                        are useful for:
                      </p>
                      <ul className="list-disc list-inside space-y-1">
                        <li>Testing factual knowledge</li>
                        <li>Reinforcing key concepts</li>
                        <li>Promoting active recall</li>
                        <li>Measuring comprehension and retention</li>
                      </ul>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

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
        </div>

        <div className="sticky bottom-0 pt-4 px-2 sm:px-4 bg-background border-t">
          <PlanAwareButton
            label="Generate Quiz"
            onClick={generateQuiz}
            isLoggedIn={isLoggedIn}
            isEnabled={isFormValid}
            hasCredits={credits > 0}
            loadingLabel="Generating..."
            className="w-full"
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
        </div>
      </div>
    </motion.div>
  )
}

export const FillInTheBlankQuizForm = memo(FillInTheBlankQuizFormComponent)

export default FillInTheBlankQuizForm

