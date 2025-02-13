import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Trophy, RefreshCcw } from "lucide-react"
import { SignInPrompt } from "@/app/components/SignInPrompt"

interface McqQuizResultProps {
  score: number
  totalQuestions: number
  timeSpent: number
  isAuthenticated: boolean
  slug: string
}

export default function McqQuizResult({ score, totalQuestions, timeSpent, isAuthenticated, slug }: McqQuizResultProps) {
  const resetQuiz = () => {
    // Implement the reset functionality here
    // This could involve resetting the state in the parent component
    // or refreshing the page
  }

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="text-center py-4 sm:py-8 space-y-4 sm:space-y-6"
    >
      <Trophy className="w-12 h-12 sm:w-16 sm:h-16 mx-auto text-yellow-500" />
      <div className="space-y-2">
        <h2 className="text-xl sm:text-2xl font-bold">Quiz Completed!</h2>
        <p className="text-muted-foreground">Time taken: {formatTime(timeSpent)}</p>
      </div>
      {isAuthenticated ? (
        <>
          <div className="bg-muted rounded-lg p-4 sm:p-6 space-y-4">
            <div className="text-3xl sm:text-4xl font-bold">{Math.round((score / totalQuestions) * 100)}%</div>
            <p className="text-muted-foreground">
              You got {score} out of {totalQuestions} questions correct
            </p>
          </div>
          <Button onClick={resetQuiz} className="w-full sm:w-auto">
            <RefreshCcw className="mr-2 h-4 w-4" />
            Retake Quiz
          </Button>
        </>
      ) : (
        <SignInPrompt callbackUrl={`/dashboard/mcq/${slug}`} />
      )}
    </motion.div>
  )
}

