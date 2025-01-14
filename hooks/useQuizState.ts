import { useState, useCallback } from 'react'

const useQuizState = () => {
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [quizCompleted, setQuizCompleted] = useState(false)
  const [score, setScore] = useState(0)

  const handleAnswer = useCallback((value: string) => {
    setAnswers((prev) => ({ ...prev, [currentQuestionIndex]: value }))
  }, [currentQuestionIndex])

  const checkAnswer = useCallback(() => {
    const currentAnswer = answers[currentQuestionIndex]
    // Assuming the correct answer is stored in the question object
    // You'll need to adjust this based on your actual data structure
    const isCorrect = currentAnswer === 'correct_answer'

    if (isCorrect) {
      setScore((prev) => prev + 1)
    }

    if (currentQuestionIndex < 5 - 1) {
      setCurrentQuestionIndex((prev) => prev + 1)
    } else {
      setQuizCompleted(true)
    }
  }, [answers, currentQuestionIndex])

  const retakeQuiz = useCallback(() => {
    setAnswers({})
    setCurrentQuestionIndex(0)
    setQuizCompleted(false)
    setScore(0)
  }, [])

  return {
    answers,
    currentQuestionIndex,
    quizCompleted,
    score,
    handleAnswer,
    checkAnswer,
    retakeQuiz,
    setCurrentQuestionIndex
  }
}

export default useQuizState

