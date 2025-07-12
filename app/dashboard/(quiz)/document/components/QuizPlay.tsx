"use client"

import { useEffect, useState } from "react"
import { quizStore } from "@/lib/quiz-store"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
  CardTitle,
} from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { ArrowLeft, ArrowRight, RotateCcw } from "lucide-react"
import { useRouter } from "next/navigation"
import {
  RadioGroup,
  RadioGroupItem,
} from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import type { Quiz } from "@/lib/quiz-store"
import { motion, AnimatePresence } from "framer-motion"
import { useGlobalLoader } from '@/store/global-loader'
import { GlobalLoader } from '@/components/ui/loader'


export function QuizPlayer({ quizId }: { quizId: string }) {
  const [quiz, setQuiz] = useState<Quiz | null>(null)
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [attemptId, setAttemptId] = useState<string | null>(null)
  const [score, setScore] = useState(0)
  const [finished, setFinished] = useState(false)
  const router = useRouter()

  useEffect(() => {
    async function loadQuiz() {
      const q = await quizStore.getQuiz(quizId)
      if (!q) return
      setQuiz(q)
      setSelectedAnswers(new Array(q.questions.length).fill(-1))
      const aid = await quizStore.startQuizAttempt(q.id)
      setAttemptId(aid)
    }

    loadQuiz()
  }, [quizId])

  const answer = (index: number) => {
    const a = [...selectedAnswers]
    a[currentIndex] = index
    setSelectedAnswers(a)
    if (attemptId) quizStore.saveQuizAnswer(attemptId, currentIndex, index)
  }

  const next = () => {
    if (currentIndex < (quiz?.questions.length ?? 0) - 1) {
      setCurrentIndex((prev) => prev + 1)
    } else {
      complete()
    }
  }

  const back = () => {
    if (currentIndex > 0) setCurrentIndex((prev) => prev - 1)
  }

  const complete = async () => {
    if (!attemptId) return
    const result = await quizStore.completeQuizAttempt(attemptId)
    if (result) {
      setScore(result.score)
      setFinished(true)
    }
  }

  if (!quiz)
    return <GlobalLoader/>

  if (finished) {
    const percentage = (score / quiz.questions.length) * 100
    const isPassed = percentage >= 60

    return (
      <motion.div
        className="max-w-xl mx-auto my-10 p-6 text-center"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Card className="p-6 rounded-2xl shadow-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold">
              {isPassed ? "🎉 Great job!" : "😢 Better luck next time"}
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200 }}
              className="text-4xl font-extrabold text-primary"
            >
              {score} / {quiz.questions.length}
            </motion.div>
            <p className="text-muted-foreground text-sm">
              Your Score
            </p>

            <Progress
              value={percentage}
              className="h-3 rounded-full"
            />
            <p className="text-sm mt-2">
              You got <span className="font-medium">{score}</span> correct out of{" "}
              <span className="font-medium">{quiz.questions.length}</span> questions.
            </p>
          </CardContent>

          <CardFooter className="justify-center mt-6">
            <Button onClick={() => router.push("/dashboard/document")}>
              <RotateCcw className="mr-2 h-4 w-4" />
              Try Another Quiz
            </Button>
          </CardFooter>
        </Card>
      </motion.div>
    )
  }

  const q = quiz.questions[currentIndex]

  return (
    <Card className="max-w-xl w-full mx-auto my-10 p-4 sm:p-6 shadow-md rounded-2xl transition-all">
      <CardHeader className="text-center space-y-2">
        <CardTitle className="text-xl sm:text-2xl">{quiz.title}</CardTitle>
        <Progress value={((currentIndex + 1) / quiz.questions.length) * 100} />
      </CardHeader>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -40 }}
          transition={{ duration: 0.3 }}
        >
          <CardContent className="space-y-4">
            <p className="text-base sm:text-lg font-medium">
              {q.question}
            </p>
            <RadioGroup
              value={selectedAnswers[currentIndex]?.toString()}
              onValueChange={(v) => answer(parseInt(v))}
              className="space-y-2"
            >
              {q.options.map((o, i) => (
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  key={i}
                  className={`flex items-center gap-2 p-3 border rounded-xl cursor-pointer ${
                    selectedAnswers[currentIndex] === i
                      ? "border-primary bg-primary/10"
                      : "hover:border-muted"
                  }`}
                >
                  <RadioGroupItem id={`opt-${i}`} value={i.toString()} />
                  <Label htmlFor={`opt-${i}`} className="w-full">
                    {o}
                  </Label>
                </motion.div>
              ))}
            </RadioGroup>
          </CardContent>
        </motion.div>
      </AnimatePresence>

      <CardFooter className="flex justify-between mt-6 gap-4 flex-wrap">
        <Button
          variant="outline"
          onClick={back}
          disabled={currentIndex === 0}
          className="w-full sm:w-auto"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Button
          onClick={next}
          disabled={selectedAnswers[currentIndex] === -1}
          className="w-full sm:w-auto"
        >
          {currentIndex === quiz.questions.length - 1 ? "Finish" : "Next"}
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  )
}
