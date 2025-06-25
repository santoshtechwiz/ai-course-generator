import { QuizType } from "@/app/types/quiz-types"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card"
import { motion } from "framer-motion"
import { BookOpen, LogIn, RefreshCw, ListChecks, Code2, FileText } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

// Quiz type icon and message map
const quizTypeMeta: Record<QuizType, { icon: typeof ListChecks; title: string; feedback: string }> = {
  mcq: {
    icon: ListChecks,
    title: "Quiz Complete!",
    feedback: "See which questions you got right.",
  },
  code: {
    icon: Code2,
    title: "Code Challenge Complete!",
    feedback: "Review your code performance.",
  },
  blanks: {
    icon: FileText,
    title: "Blanks Quiz Complete!",
    feedback: "See correct blanks and explanations.",
  },
  openended: {
    icon: BookOpen,
    title: "Open-Ended Quiz Complete!",
    feedback: "Check AI feedback on your response.",
  },
  flashcard: {
    icon: BookOpen,
    title: "Flashcard Session Complete!",
    feedback: "Sign in to save your results and track progress.",
  },
}

const getQuizMeta = (quizType: QuizType = "flashcard") => quizTypeMeta[quizType] || quizTypeMeta.flashcard

// Sign-In Prompt Component
const SignInPrompt = ({
  onSignIn,
  onRetake,
  quizType = "flashcard",
  previewData,
  isLoading = false,
}: {
  onSignIn: () => void
  onRetake: () => void
  quizType?: QuizType
  previewData?: {
    percentage?: number
    score?: number
    maxScore?: number
    correctAnswers?: number
    totalQuestions?: number
    stillLearningAnswers?: number
    incorrectAnswers?: number
  }
  isLoading?: boolean
}) => {
  const meta = getQuizMeta(quizType)
  const Icon = meta.icon

  const showScore = previewData && (previewData.score !== undefined || previewData.correctAnswers !== undefined)
  const correct = previewData?.correctAnswers ?? previewData?.score ?? 0
  const total = previewData?.totalQuestions ?? previewData?.maxScore ?? 0
  const percentage = previewData?.percentage ?? (total > 0 ? Math.round((correct / total) * 100) : 0)

  // Skeleton loading UI
  if (isLoading) {
    return (
      <div className="max-w-md mx-auto w-full">
        <Card className="shadow-lg border-primary/20">
          <CardHeader className="text-center pb-4">
            <div className="w-16 h-16 bg-muted/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <Skeleton className="h-8 w-8 rounded-full" />
            </div>
            <Skeleton className="h-8 w-2/3 mx-auto mb-2" />
            <div className="mt-4 p-4 bg-muted/30 rounded-lg">
              <Skeleton className="h-6 w-1/3 mx-auto mb-2" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="text-center">
            <Skeleton className="h-4 w-5/6 mx-auto mb-2" />
            <Skeleton className="h-4 w-4/6 mx-auto mb-6" />
            <div className="space-y-3">
              <Skeleton className="h-10 w-full rounded-md" />
              <Skeleton className="h-10 w-full rounded-md" />
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4 }}
      className="max-w-md mx-auto w-full px-4 sm:px-0"
    >
      <Card className="shadow-lg border-primary/20 bg-gradient-to-b from-background to-primary/5">
        <CardHeader className="text-center pb-4">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Icon className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">{meta.title}</CardTitle>

          {showScore && (
            <div className="mt-4 p-4 bg-muted/50 rounded-lg">
              <div className="text-3xl font-bold text-primary mb-2">
                {correct}/{total}
              </div>
              <div className="text-sm text-muted-foreground space-y-1">
                {quizType === "flashcard" ? (
                  <>
                    <div className="flex justify-between">
                      <span>Mastered:</span>
                      <span className="text-green-600 font-medium">{previewData?.correctAnswers || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Still Learning:</span>
                      <span className="text-amber-600 font-medium">{previewData?.stillLearningAnswers || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Missed:</span>
                      <span className="text-red-600 font-medium">{previewData?.incorrectAnswers || 0}</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex justify-between">
                      <span>Score:</span>
                      <span className="font-medium">
                        {previewData?.score || 0} / {previewData?.maxScore || 0}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Percentage:</span>
                      <span className="font-medium">{percentage}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Status:</span>
                      <span
                        className={`font-medium ${
                          percentage >= 70
                            ? "text-green-600"
                            : percentage >= 40
                            ? "text-amber-600"
                            : "text-red-600"
                        }`}
                      >
                        {percentage >= 70 ? "Passed" : "Not Passed"}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </CardHeader>

        <CardContent className="text-center pb-4">
          <p className="text-muted-foreground mb-2 font-medium">{meta.feedback}</p>
          <p className="text-muted-foreground mb-6">
            Sign in to save your progress, view detailed results, and track your learning over time.
          </p>
          <div className="space-y-3">
            <Button onClick={onSignIn} size="lg" className="w-full gap-2 transition-all hover:gap-3">
              <LogIn className="w-4 h-4" />
              Sign in to view full feedback
            </Button>
            <Button onClick={onRetake} variant="outline" size="lg" className="w-full gap-2">
              <RefreshCw className="w-4 h-4" />
              Retake Quiz
            </Button>
          </div>
        </CardContent>

        <CardFooter className="bg-muted/20 text-center text-sm text-muted-foreground">
          Create a free account to track your progress across sessions
        </CardFooter>
      </Card>
    </motion.div>
  )
}

export default SignInPrompt
