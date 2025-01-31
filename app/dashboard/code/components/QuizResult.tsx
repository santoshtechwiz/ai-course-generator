import type React from "react"
import { motion } from "framer-motion"
import { CheckCircle, XCircle } from "lucide-react"

interface QuizResultProps {
  isCorrect: boolean
  correctAnswer: string
}

const QuizResult: React.FC<QuizResultProps> = ({ isCorrect, correctAnswer }) => {
  return (
    <motion.div
      className={`mt-4 p-4 rounded-lg ${isCorrect ? "bg-green-100" : "bg-red-100"}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex items-center mb-2">
        {isCorrect ? <CheckCircle className="text-green-500 mr-2" /> : <XCircle className="text-red-500 mr-2" />}
        <p className={`text-lg font-semibold ${isCorrect ? "text-green-700" : "text-red-700"}`}>
          {isCorrect ? "Correct! 🎉" : "Incorrect. Try again!"}
        </p>
      </div>
      {!isCorrect && (
        <p className="mt-2 text-gray-700">
          The correct answer is: <span className="font-semibold">{correctAnswer}</span>
        </p>
      )}
    </motion.div>
  )
}

export default QuizResult

