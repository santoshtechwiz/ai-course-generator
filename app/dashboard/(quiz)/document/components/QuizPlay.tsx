"use client"

import { useEffect, useState, useCallback, useMemo } from "react"
import { useRouter } from "next/navigation"
import { AnimatePresence, motion } from "framer-motion"
import { ArrowLeft, ArrowRight, RotateCcw, Save, Pause, Play, BookOpen, Timer, Target } from "lucide-react"
import { memo } from "react"

import { quizStore, type Quiz } from "@/lib/quiz-store"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { GlobalLoader } from "@/components/ui/loader"
import { toast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"

interface QuizState {
  currentIndex: number
  selectedAnswers: number[]
  startTime: number
  lastSaved?: number
}

const QuizStats = memo(function QuizStats({
  currentIndex,
  totalQuestions,
  answeredCount,
  timeElapsed,
}: {
  currentIndex: number
  totalQuestions: number
  answeredCount: number
  timeElapsed: string
}) {
  return (
    <div className="flex items-center justify-between">
      <Badge variant="outline" className="text-sm">
        Question {currentIndex + 1} of {totalQuestions}
      </Badge>
      <div className="flex items-center space-x-2">
        <Badge variant={answeredCount === totalQuestions ? "default" : "secondary"} className="text-xs">
          <Target className="h-3 w-3 mr-1" />
          {answeredCount}/{totalQuestions}
        </Badge>
        <Badge variant="outline" className="text-xs">
          <Timer className="h-3 w-3 mr-1" />
          {timeElapsed}
        </Badge>
      </div>
    </div>
  )
})

const QuestionOption = memo(function QuestionOption({
  option,
  index,
  isSelected,
  onSelect,
  isPaused,
}: {
  option: string
  index: number
  isSelected: boolean
  onSelect: () => void
  isPaused: boolean
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 + 0.2 }}
      whileHover={{ scale: isPaused ? 1 : 1.02, transition: { duration: 0.2 } }}
      whileTap={{ scale: isPaused ? 1 : 0.98 }}
      className={`group relative overflow-hidden rounded-xl border-2 transition-all duration-300 ${
        isSelected
          ? "border-primary bg-primary/10 shadow-lg shadow-primary/20"
          : "border-border hover:border-primary/50 hover:bg-muted/50"
      } ${isPaused ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
    >
      <div className="flex items-center gap-4 p-6">
        <RadioGroupItem id={`opt-${index}`} value={index.toString()} className="shrink-0" disabled={isPaused} />
        <Label htmlFor={`opt-${index}`} className="flex-1 text-base leading-relaxed cursor-pointer">
          <span className="font-medium text-primary mr-2">{String.fromCharCode(65 + index)}.</span>
          {option}
        </Label>
        <div className="text-xs text-muted-foreground font-mono">{index + 1}</div>
      </div>

      {isSelected && (
        <motion.div
          layoutId="selected-indicator"
          className="absolute inset-0 border-2 border-primary rounded-xl pointer-events-none"
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        />
      )}
    </motion.div>
  )
})

export function QuizPlayer({ quizId }: { quizId: string }) {
  const [quiz, setQuiz] = useState<Quiz | null>(null)
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [attemptId, setAttemptId] = useState<string | null>(null)
  const [score, setScore] = useState(0)
  const [finished, setFinished] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [startTime] = useState(Date.now())
  const [lastSaved, setLastSaved] = useState<number | null>(null)
  const [isPaused, setIsPaused] = useState(false)
  const [currentTime, setCurrentTime] = useState(Date.now())
  const router = useRouter()

  // Update time every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now())
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  const timeElapsed = useMemo(() => {
    const elapsed = Math.floor((currentTime - startTime) / 1000)
    const minutes = Math.floor(elapsed / 60)
    const seconds = elapsed % 60
    return `${minutes}:${seconds.toString().padStart(2, "0")}`
  }, [currentTime, startTime])

  const answeredCount = useMemo(() => selectedAnswers.filter((a) => a !== -1).length, [selectedAnswers])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (finished || isPaused) return

      switch (e.key) {
        case "ArrowLeft":
          e.preventDefault()
          handleBack()
          break
        case "ArrowRight":
          e.preventDefault()
          handleNext()
          break
        case "1":
        case "2":
        case "3":
        case "4":
          e.preventDefault()
          const optionIndex = Number.parseInt(e.key) - 1
          if (quiz && optionIndex < quiz.questions[currentIndex].options.length) {
            handleAnswer(optionIndex)
          }
          break
        case "s":
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault()
            handleSaveProgress()
          }
          break
      }
    }

    window.addEventListener("keydown", handleKeyPress)
    return () => window.removeEventListener("keydown", handleKeyPress)
  }, [currentIndex, quiz, finished, isPaused])

  useEffect(() => {
    async function loadQuiz() {
      try {
        setLoading(true)
        const q = await quizStore.getQuiz(quizId)
        if (!q) {
          toast({
            title: "Quiz not found",
            description: "The requested quiz could not be found.",
            variant: "destructive",
          })
          router.push("/dashboard/document")
          return
        }

        setQuiz(q)
        setSelectedAnswers(new Array(q.questions.length).fill(-1))
        const aid = await quizStore.startQuizAttempt(q.id)
        setAttemptId(aid)

        toast({
          title: "Quiz loaded",
          description: `Ready to start "${q.title}" with ${q.questions.length} questions.`,
        })
      } catch (error) {
        console.error("Error loading quiz:", error)
        toast({
          title: "Error loading quiz",
          description: "There was a problem loading the quiz. Please try again.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    loadQuiz()
  }, [quizId, router])

  const handleAnswer = useCallback(
    (index: number) => {
      const updated = [...selectedAnswers]
      updated[currentIndex] = index
      setSelectedAnswers(updated)
      if (attemptId) {
        quizStore.saveQuizAnswer(attemptId, currentIndex, index)
      }
    },
    [selectedAnswers, currentIndex, attemptId],
  )

  const handleNext = useCallback(() => {
    if (currentIndex < (quiz?.questions.length ?? 0) - 1) {
      setCurrentIndex((prev) => prev + 1)
    } else {
      handleComplete()
    }
  }, [currentIndex, quiz])

  const handleBack = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1)
    }
  }, [currentIndex])

  const handleComplete = async () => {
    if (!attemptId) return

    try {
      const result = await quizStore.completeQuizAttempt(attemptId)
      if (result) {
        setScore(result.score)
        setFinished(true)
        toast({
          title: "Quiz completed!",
          description: `You scored ${result.score} out of ${quiz?.questions.length} questions.`,
        })
      }
    } catch (error) {
      console.error("Error completing quiz:", error)
      toast({
        title: "Error completing quiz",
        description: "There was a problem saving your results.",
        variant: "destructive",
      })
    }
  }

  const handleSaveProgress = async () => {
    if (!quiz || !attemptId) return

    setSaving(true)
    try {
      await Promise.all(
        selectedAnswers.map((answer, index) =>
          answer !== -1 ? quizStore.saveQuizAnswer(attemptId, index, answer) : Promise.resolve(),
        ),
      )

      setLastSaved(Date.now())

      toast({
        title: "Progress saved",
        description: `Quiz progress saved successfully. ${answeredCount}/${quiz.questions.length} questions answered.`,
      })
    } catch (error) {
      console.error("Error saving progress:", error)
      toast({
        title: "Save failed",
        description: "Could not save your progress. Please try again.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const togglePause = () => {
    setIsPaused(!isPaused)
    toast({
      title: isPaused ? "Quiz resumed" : "Quiz paused",
      description: isPaused ? "You can continue answering questions." : "Take a break. Your progress is saved.",
    })
  }

  if (loading) return <GlobalLoader />

  if (!quiz) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-6">
            <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">Quiz Not Found</h2>
            <p className="text-muted-foreground mb-4">The requested quiz could not be loaded.</p>
            <Button onClick={() => router.push("/dashboard/document")}>Return to Dashboard</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (finished) {
    const percentage = (score / quiz.questions.length) * 100
    const isPassed = percentage >= 60

    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4 py-8">
        <motion.div
          key="results-content"
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="w-full max-w-2xl"
        >
          <Card className="p-8 shadow-2xl rounded-3xl border-0 bg-gradient-to-br from-background to-muted/20">
            <CardHeader className="pb-6">
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              >
                <div className="text-6xl mb-4">{isPassed ? "🎉" : "📚"}</div>
                <CardTitle className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                  {isPassed ? "Excellent Work!" : "Keep Learning!"}
                </CardTitle>
              </motion.div>
            </CardHeader>
            <CardContent className="space-y-6">
              <motion.div
                key="score-display"
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.4, type: "spring", stiffness: 180 }}
                className="space-y-4"
              >
                <div className="text-6xl font-extrabold text-primary">
                  {score} / {quiz.questions.length}
                </div>
                <Progress value={percentage} className="h-4 rounded-full" />
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Score: {percentage.toFixed(1)}%</span>
                  <span>Time: {timeElapsed}</span>
                </div>
              </motion.div>

              <motion.div
                key="stats-grid"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="grid grid-cols-2 gap-4 text-sm"
              >
                <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="font-semibold text-green-700 dark:text-green-300">Correct</div>
                  <div className="text-2xl font-bold text-green-600">{score}</div>
                </div>
                <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                  <div className="font-semibold text-red-700 dark:text-red-300">Incorrect</div>
                  <div className="text-2xl font-bold text-red-600">{quiz.questions.length - score}</div>
                </div>
              </motion.div>
            </CardContent>
            <CardFooter className="justify-center mt-8 space-x-4">
              <Button onClick={() => router.push("/dashboard/document")} variant="outline" size="lg">
                <BookOpen className="mr-2 h-5 w-5" />
                Browse Quizzes
              </Button>
              <Button onClick={() => window.location.reload()} size="lg">
                <RotateCcw className="mr-2 h-5 w-5" />
                Retake Quiz
              </Button>
            </CardFooter>
          </Card>
        </motion.div>
      </div>
    )
  }

  const question = quiz.questions[currentIndex]
  const progress = ((currentIndex + 1) / quiz.questions.length) * 100

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/30 flex items-center justify-center px-4 py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-4xl">
        <Card className="shadow-2xl border-0 bg-background/95 backdrop-blur-sm">
          <CardHeader className="text-center space-y-4 pb-6">
            <QuizStats
              currentIndex={currentIndex}
              totalQuestions={quiz.questions.length}
              answeredCount={answeredCount}
              timeElapsed={timeElapsed}
            />

            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              {quiz.title}
            </CardTitle>

            <div className="space-y-2">
              <Progress value={progress} className="h-3 rounded-full" />
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>{answeredCount} answered</span>
                <span>{quiz.questions.length - answeredCount} remaining</span>
              </div>
            </div>
          </CardHeader>

          <AnimatePresence mode="wait">
            <motion.div
              key={`question-${quiz?.id}-${currentIndex}`}
              initial={{ opacity: 0, x: 50, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: -50, scale: 0.95 }}
              transition={{
                duration: 0.4,
                ease: [0.4, 0, 0.2, 1],
                scale: { duration: 0.3 },
              }}
            >
              <CardContent className="space-y-8 px-8">
                <div className="text-center">
                  <h2 className="text-xl sm:text-2xl font-semibold leading-relaxed mb-6">{question.question}</h2>
                </div>

                <RadioGroup
                  value={selectedAnswers[currentIndex]?.toString()}
                  onValueChange={(v) => handleAnswer(Number.parseInt(v))}
                  className="space-y-4"
                  disabled={isPaused}
                >
                  {question.options.map((opt, i) => (
                    <QuestionOption
                      key={`option-${currentIndex}-${i}`}
                      option={opt}
                      index={i}
                      isSelected={selectedAnswers[currentIndex] === i}
                      onSelect={() => handleAnswer(i)}
                      isPaused={isPaused}
                    />
                  ))}
                </RadioGroup>

                {isPaused && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center p-4 bg-muted/50 rounded-lg"
                  >
                    <Pause className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-muted-foreground">Quiz is paused. Click resume to continue.</p>
                  </motion.div>
                )}
              </CardContent>
            </motion.div>
          </AnimatePresence>

          <CardFooter className="flex flex-col space-y-4 pt-8">
            <div className="flex flex-wrap justify-center gap-3 w-full">
              <Button
                variant="outline"
                onClick={handleSaveProgress}
                disabled={saving || isPaused}
                className="flex items-center gap-2 bg-transparent"
              >
                <Save className="h-4 w-4" />
                {saving ? "Saving..." : "Save Progress"}
              </Button>

              <Button variant="outline" onClick={togglePause} className="flex items-center gap-2 bg-transparent">
                {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                {isPaused ? "Resume" : "Pause"}
              </Button>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-between w-full">
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={currentIndex === 0 || isPaused}
                className="flex items-center gap-2 sm:w-auto w-full bg-transparent"
              >
                <ArrowLeft className="h-4 w-4" />
                Previous
              </Button>

              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <kbd className="px-2 py-1 bg-muted rounded text-xs">←→</kbd>
                <span>Navigate</span>
                <kbd className="px-2 py-1 bg-muted rounded text-xs">1-4</kbd>
                <span>Select</span>
                <kbd className="px-2 py-1 bg-muted rounded text-xs">Ctrl+S</kbd>
                <span>Save</span>
              </div>

              <Button
                onClick={handleNext}
                disabled={selectedAnswers[currentIndex] === -1 || isPaused}
                className="flex items-center gap-2 sm:w-auto w-full"
              >
                {currentIndex === quiz.questions.length - 1 ? "Finish Quiz" : "Next"}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  )
}
