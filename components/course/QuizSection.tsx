'use client'

import { useState } from 'react'
import { Lock, CheckCircle, XCircle, Clock, Award } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Quiz } from '@/hooks/useCourseData'

interface QuizSectionProps {
  quiz: Quiz
  isLocked: boolean
  onComplete: (score: number) => void
}

export function QuizSection({ quiz, isLocked, onComplete }: QuizSectionProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([])
  const [showResults, setShowResults] = useState(false)
  const [timeLeft, setTimeLeft] = useState(quiz.timeLimit)
  const [isStarted, setIsStarted] = useState(false)

  const currentQuestion = quiz.questions[currentQuestionIndex]
  const isLastQuestion = currentQuestionIndex === quiz.questions.length - 1
  const hasAnswered = selectedAnswers[currentQuestionIndex] !== undefined

  const handleAnswerSelect = (answerIndex: number) => {
    if (isLocked || showResults) return

    const newAnswers = [...selectedAnswers]
    newAnswers[currentQuestionIndex] = answerIndex
    setSelectedAnswers(newAnswers)
  }

  const handleNextQuestion = () => {
    if (isLastQuestion) {
      // Calculate score
      const correctAnswers = selectedAnswers.filter((answer, index) => 
        answer === quiz.questions[index].correctAnswer
      ).length
      const score = (correctAnswers / quiz.questions.length) * 100
      
      setShowResults(true)
      onComplete(score)
    } else {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
    }
  }

  const handleStartQuiz = () => {
    setIsStarted(true)
    // Start timer
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          // Auto-submit when time runs out
          const correctAnswers = selectedAnswers.filter((answer, index) => 
            answer === quiz.questions[index].correctAnswer
          ).length
          const score = (correctAnswers / quiz.questions.length) * 100
          setShowResults(true)
          onComplete(score)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (isLocked) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-xl font-semibold text-slate-900 mb-2">
            Quiz Locked
          </h3>
          <p className="text-slate-600 mb-6">
            Subscribe to access this interactive quiz and test your knowledge
          </p>
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors">
            Subscribe to Unlock
          </button>
        </div>
      </div>
    )
  }

  if (!isStarted) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Award className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-xl font-semibold text-slate-900 mb-2">
            {quiz.title}
          </h3>
          <p className="text-slate-600 mb-4">
            Test your knowledge with {quiz.questions.length} questions
          </p>
          <div className="flex items-center justify-center space-x-4 text-sm text-slate-600 mb-6">
            <div className="flex items-center space-x-1">
              <Clock className="w-4 h-4" />
              <span>{formatTime(quiz.timeLimit)}</span>
            </div>
            <div className="flex items-center space-x-1">
              <span>{quiz.questions.length} questions</span>
            </div>
          </div>
          <button
            onClick={handleStartQuiz}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            Start Quiz
          </button>
        </div>
      </div>
    )
  }

  if (showResults) {
    const correctAnswers = selectedAnswers.filter((answer, index) => 
      answer === quiz.questions[index].correctAnswer
    ).length
    const score = (correctAnswers / quiz.questions.length) * 100
    const isPassing = score >= 70

    return (
      <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
        <div className="text-center">
          <div className={cn(
            "w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4",
            isPassing 
              ? "bg-gradient-to-br from-green-500 to-green-600" 
              : "bg-gradient-to-br from-red-500 to-red-600"
          )}>
            {isPassing ? (
              <CheckCircle className="w-8 h-8 text-white" />
            ) : (
              <XCircle className="w-8 h-8 text-white" />
            )}
          </div>
          <h3 className="text-xl font-semibold text-slate-900 mb-2">
            Quiz Complete!
          </h3>
          <div className="text-3xl font-bold text-slate-900 mb-2">
            {Math.round(score)}%
          </div>
          <p className={cn(
            "text-lg font-medium mb-4",
            isPassing ? "text-green-600" : "text-red-600"
          )}>
            {isPassing ? "Great job! You passed!" : "Keep studying and try again!"}
          </p>
          <p className="text-slate-600 mb-6">
            You got {correctAnswers} out of {quiz.questions.length} questions correct
          </p>
          <button
            onClick={() => {
              setCurrentQuestionIndex(0)
              setSelectedAnswers([])
              setShowResults(false)
              setIsStarted(false)
              setTimeLeft(quiz.timeLimit)
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            Retake Quiz
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">{quiz.title}</h3>
          <p className="text-sm text-slate-600">
            Question {currentQuestionIndex + 1} of {quiz.questions.length}
          </p>
        </div>
        <div className="flex items-center space-x-2 text-sm text-slate-600">
          <Clock className="w-4 h-4" />
          <span className="font-mono">{formatTime(timeLeft)}</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between text-sm text-slate-600 mb-1">
          <span>Progress</span>
          <span>{currentQuestionIndex + 1}/{quiz.questions.length}</span>
        </div>
        <div className="w-full bg-slate-200 rounded-full h-2">
          <div 
            className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentQuestionIndex + 1) / quiz.questions.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Question */}
      <div className="mb-6">
        <h4 className="text-lg font-medium text-slate-900 mb-4">
          {currentQuestion.question}
        </h4>
        
        <div className="space-y-3">
          {currentQuestion.options.map((option, index) => {
            const isSelected = selectedAnswers[currentQuestionIndex] === index
            const isCorrect = index === currentQuestion.correctAnswer
            const showCorrectAnswer = hasAnswered

            return (
              <button
                key={index}
                onClick={() => handleAnswerSelect(index)}
                disabled={hasAnswered}
                className={cn(
                  "w-full text-left p-4 rounded-lg border-2 transition-all duration-200",
                  isSelected && !showCorrectAnswer && "border-blue-500 bg-blue-50",
                  isSelected && showCorrectAnswer && isCorrect && "border-green-500 bg-green-50",
                  isSelected && showCorrectAnswer && !isCorrect && "border-red-500 bg-red-50",
                  !isSelected && showCorrectAnswer && isCorrect && "border-green-500 bg-green-50",
                  !isSelected && !hasAnswered && "border-slate-200 hover:border-slate-300 hover:bg-slate-50",
                  hasAnswered && !isSelected && "border-slate-200 bg-slate-50"
                )}
              >
                <div className="flex items-center space-x-3">
                  <div className={cn(
                    "w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0",
                    isSelected && !showCorrectAnswer && "border-blue-500 bg-blue-500",
                    isSelected && showCorrectAnswer && isCorrect && "border-green-500 bg-green-500",
                    isSelected && showCorrectAnswer && !isCorrect && "border-red-500 bg-red-500",
                    !isSelected && showCorrectAnswer && isCorrect && "border-green-500 bg-green-500",
                    !isSelected && !hasAnswered && "border-slate-300",
                    hasAnswered && !isSelected && "border-slate-300"
                  )}>
                    {isSelected && (
                      <CheckCircle className="w-4 h-4 text-white" />
                    )}
                    {!isSelected && showCorrectAnswer && isCorrect && (
                      <CheckCircle className="w-4 h-4 text-white" />
                    )}
                  </div>
                  <span className="text-slate-900">{option}</span>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Explanation */}
      {hasAnswered && (
        <div className="mb-6 p-4 bg-slate-50 rounded-lg">
          <h5 className="font-medium text-slate-900 mb-2">Explanation</h5>
          <p className="text-sm text-slate-700">
            {currentQuestion.explanation}
          </p>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-end">
        <button
          onClick={handleNextQuestion}
          disabled={!hasAnswered}
          className={cn(
            "px-6 py-2 rounded-lg font-medium transition-colors",
            hasAnswered
              ? "bg-blue-600 text-white hover:bg-blue-700"
              : "bg-slate-200 text-slate-500 cursor-not-allowed"
          )}
        >
          {isLastQuestion ? "Finish Quiz" : "Next Question"}
        </button>
      </div>
    </div>
  )
}