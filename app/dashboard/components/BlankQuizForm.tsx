"use client"

import { memo, useCallback, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { ChevronDown, ChevronUp, Info, AlertCircle } from "lucide-react"

import { Progress } from "@/components/ui/progress"
import { PlanAwareButton } from "@/app/components/PlanAwareButton"

interface TopicFormProps {
  credits: number,
  maxQuestions: number
}

function FillInTheBlankQuizFormComponent({ credits ,maxQuestions}: TopicFormProps) {
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
        body: JSON.stringify({ topic, questionCount,difficulty: "easy" }),
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

  const isDisabled = useMemo(() => isLoading || credits < 1 || !topic.trim(), [isLoading, credits, topic])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !isDisabled) {
        handleSubmit(e as unknown as React.FormEvent<HTMLFormElement>)
      }
    },
    [handleSubmit, isDisabled],
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
        <Input
          type="number"
          value={questionCount}
          onChange={(e) => setQuestionCount(Number(e.target.value))}
          min={1}
          max={10}
          className="w-20 h-10 text-center"
          aria-label="Number of questions"
        />
      </div>
    </div>
  )

  const renderCreditsCard = () => (
    <Card className="bg-primary/5 border-primary/20">
      <CardContent className="p-4 space-y-2">
        <CardTitle className="text-base mb-2">Available Credits</CardTitle>
        <Progress value={(credits / 10) * 100} className="h-2" />
        <p className="text-xs text-muted-foreground">
          You have <span className="font-bold text-primary">{credits}</span> credits remaining.
        </p>
        
      </CardContent>
    </Card>
  )

  const renderInfoCard = () => (
    <Card
      className="bg-muted cursor-pointer transition-colors hover:bg-muted/80"
      onClick={() => setOpenInfo(!openInfo)}
    >
      <CardHeader className="flex flex-row items-center justify-between py-2 px-4">
        <CardTitle className="text-sm">About Fill-in-the-Blank Questions</CardTitle>
        {openInfo ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </CardHeader>
      <AnimatePresence>
        {openInfo && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <CardContent className="text-sm px-4 pb-4 space-y-2">
              <p>Fill-in-the-blank questions assess the ability to recall and apply knowledge in context. They are useful for:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Testing factual knowledge</li>
                <li>Reinforcing key concepts</li>
                <li>Promoting active recall</li>
                <li>Measuring comprehension and retention</li>
              </ul>
            </CardContent>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  )

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="h-full"
    >
      <Card className="h-full flex flex-col bg-card text-card-foreground shadow-lg">
        <CardHeader className="pb-4">
          <CardTitle className="text-2xl font-bold text-primary">Create Fill-in-the-Blank Quiz</CardTitle>
          <CardDescription className="text-base">
            Select a topic and customize your quiz with fill-in-the-blank questions.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6 flex-grow">
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
            {renderCreditsCard()}
            {renderInfoCard()}

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
        </CardContent>

        <CardFooter className="sticky bottom-0 pt-4 px-4 bg-card border-t">
          <PlanAwareButton
            type="submit"
            label="Generate Quiz"
            onClick={(e) => {
              e.preventDefault()
              handleSubmit(e as unknown as React.FormEvent<HTMLFormElement>)
            }}
            
        
            loadingLabel="Generating Quiz..."
            disabled={isDisabled}
            actionType="fillInTheBlanks"
            className="w-full h-14 text-lg font-medium rounded-lg transition-all
              hover:scale-[1.02] active:scale-[0.98]
              disabled:opacity-50 disabled:cursor-not-allowed
              focus:ring-2 focus:ring-primary focus:ring-offset-2"
          />
        </CardFooter>
      </Card>
    </motion.div>
  )
}

export const FillInTheBlankQuizForm = memo(FillInTheBlankQuizFormComponent)

export default FillInTheBlankQuizForm
