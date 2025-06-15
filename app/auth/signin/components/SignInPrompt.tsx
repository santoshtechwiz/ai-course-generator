import { QuizType } from "@/app/types/types"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card"
import { motion } from "framer-motion"
import { BookOpen, LogIn, RefreshCw } from "lucide-react"

// Generic Sign-In Prompt Component for Flashcards
const SignInPrompt = ({
  onSignIn,
  onRetake,
  quizType= "flashcard",
  previewData,
  
}: {
  onSignIn: () => void
  onRetake: () => void
  quizType?: QuizType
  previewData?: {
    percentage?: number
    score?: number,
    maxScore?: number
    correctAnswers: number
    totalQuestions: number
    stillLearningAnswers: number
    incorrectAnswers: number
  }
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
      className="max-w-md mx-auto"
    >
      <Card className="shadow-lg border-primary/20 bg-gradient-to-b from-background to-primary/5">
        <CardHeader className="text-center pb-4">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">Flashcard Session Complete!</CardTitle>
          {previewData && (
            <div className="mt-4 p-4 bg-muted/50 rounded-lg">
              <div className="text-3xl font-bold text-primary mb-2">
                {previewData.correctAnswers}/{previewData.totalQuestions}
              </div>
              <div className="text-sm text-muted-foreground space-y-1">
                <div className="flex justify-between">
                  <span>Mastered:</span>
                  <span className="text-green-600 font-medium">{previewData.correctAnswers}</span>
                </div>
                <div className="flex justify-between">
                  <span>Still Learning:</span>
                  <span className="text-amber-600 font-medium">{previewData.stillLearningAnswers}</span>
                </div>
                <div className="flex justify-between">
                  <span>Missed:</span>
                  <span className="text-red-600 font-medium">{previewData.incorrectAnswers}</span>
                </div>
              </div>
            </div>
          )}
        </CardHeader>
        <CardContent className="text-center pb-4">
          <p className="text-muted-foreground mb-6">
            Sign in to save your progress, view detailed results, and track your learning over time.
          </p>
          <div className="space-y-3">
            <Button onClick={onSignIn} size="lg" className="w-full gap-2">
              <LogIn className="w-4 h-4" />
              Sign In to See Full Results
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