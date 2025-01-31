import React from "react"
import { motion } from "framer-motion"
import { CheckCircle, XCircle } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useSession } from "next-auth/react"
import { SignInPrompt } from "@/app/components/SignInPrompt"

interface QuizResultProps {
  correctCount: number
  totalQuestions: number
  onRestartQuiz: () => void
}

const QuizResult: React.FC<QuizResultProps> = ({ correctCount, totalQuestions, onRestartQuiz }) => {
  const percentage = Math.round((correctCount / totalQuestions) * 100)
  const session = useSession();
  if(session.status !== "authenticated"){
    return <SignInPrompt />
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-md mx-auto"
    >
      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">Quiz Results</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center space-y-4">
            {percentage >= 70 ? (
              <CheckCircle className="w-16 h-16 text-green-500" />
            ) : (
              <XCircle className="w-16 h-16 text-red-500" />
            )}
            <p className="text-3xl font-bold">{percentage}%</p>
            <p className="text-xl">
              You got {correctCount} out of {totalQuestions} questions correct
            </p>
            <p className="text-lg text-gray-600">
              {percentage >= 70
                ? "Great job! You've mastered this quiz."
                : "Keep practicing! You'll improve with time."}
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button onClick={onRestartQuiz} className="w-full max-w-xs">
            Start New Quiz
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  )
}

export default QuizResult
