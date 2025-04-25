"use client"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { CheckCircle, XCircle, Clock, RotateCcw } from "lucide-react"
import { useQuiz } from "@/app/context/QuizContext"


interface McqQuizResultProps {
  title: string
  onRestart: () => void
}

export default function McqQuizResult({ title, onRestart }: McqQuizResultProps) {
  const { state } = useQuiz()
  const { answers, score, isLoading } = state

  // Format time
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`
  }

  // Calculate stats
  const totalQuestions = answers.length
  const correctAnswers = answers.filter((a) => a && a.isCorrect).length
  const totalTime = answers.reduce((total, a) => total + (a ? a.timeSpent : 0), 0)
  const averageTime = totalQuestions > 0 ? totalTime / totalQuestions : 0

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardContent className="p-6 flex justify-center items-center min-h-[300px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-2xl">{title} - Results</CardTitle>
          <CardDescription>
            You scored {score}% ({correctAnswers} out of {totalQuestions} correct)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Score visualization */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Score</span>
              <span className="font-medium">{score}%</span>
            </div>
            <Progress value={score} className="h-2" />
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-muted rounded-lg p-4 flex items-center space-x-3">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Correct</p>
                <p className="font-medium">{correctAnswers}</p>
              </div>
            </div>
            <div className="bg-muted rounded-lg p-4 flex items-center space-x-3">
              <XCircle className="h-5 w-5 text-red-500" />
              <div>
                <p className="text-sm text-muted-foreground">Incorrect</p>
                <p className="font-medium">{totalQuestions - correctAnswers}</p>
              </div>
            </div>
            <div className="bg-muted rounded-lg p-4 flex items-center space-x-3">
              <Clock className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Avg. Time</p>
                <p className="font-medium">{formatTime(averageTime)} per question</p>
              </div>
            </div>
          </div>

          {/* Answer breakdown */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Answer Breakdown</h3>
            <div className="space-y-3">
              {answers.map((answer, index) => (
                <div key={index} className="flex items-center space-x-3 p-3 rounded-lg border">
                  <div
                    className={`flex-shrink-0 rounded-full p-1 ${answer?.isCorrect ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"}`}
                  >
                    {answer?.isCorrect ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                  </div>
                  <div className="flex-grow">
                    <p className="text-sm font-medium">Question {index + 1}</p>
                    <p className="text-xs text-muted-foreground">
                      {answer?.answer || "No answer"} • {formatTime(answer?.timeSpent || 0)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={onRestart} className="w-full" variant="outline">
            <RotateCcw className="mr-2 h-4 w-4" />
            Restart Quiz
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  )
}
