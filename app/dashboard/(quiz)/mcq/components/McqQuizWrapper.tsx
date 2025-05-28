'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useDispatch, useSelector } from 'react-redux'
import type { AppDispatch } from '@/store'
import {
  selectQuestions,
  selectAnswers,
  selectQuizStatus,
  selectQuizError,
  selectCurrentQuestionIndex,
  selectCurrentQuestion,
  selectQuizTitle,
  selectIsQuizComplete,
  setCurrentQuestionIndex,
  saveAnswer,
  fetchQuiz,
  submitQuiz,
  setQuizResults,
  setPendingQuiz,
} from '@/store/slices/quizSlice'
import { selectIsAuthenticated } from '@/store/slices/authSlice'

import { Button } from '@/components/ui/button'
import McqQuiz from './McqQuiz'
import { QuizLoadingSteps } from '../../components/QuizLoadingSteps'

interface McqQuizWrapperProps {
  slug: string
  quizData?: {
    title?: string
    questions?: any[]
  }
}

export default function McqQuizWrapper({ slug, quizData }: McqQuizWrapperProps) {
  const dispatch = useDispatch<AppDispatch>()
  const router = useRouter()

  const questions = useSelector(selectQuestions)
  const answers = useSelector(selectAnswers)
  const quizStatus = useSelector(selectQuizStatus)
  const error = useSelector(selectQuizError)
  const currentQuestionIndex = useSelector(selectCurrentQuestionIndex)
  const currentQuestion = useSelector(selectCurrentQuestion)
  const quizTitle = useSelector(selectQuizTitle)
  const isQuizComplete = useSelector(selectIsQuizComplete)
  const isAuthenticated = useSelector(selectIsAuthenticated)

  const feedbackTimeout = useRef<NodeJS.Timeout | null>(null)
  const [showFeedback, setShowFeedback] = useState(false)
  const [feedbackType, setFeedbackType] = useState<'correct' | 'incorrect' | null>(null)

  // Load quiz data on mount
  useEffect(() => {
    if (quizStatus === 'idle') {
      // Always fetch from API if quizData is not provided (even if quizData is null)
      if (quizData && quizData.questions && quizData.questions.length > 0) {
        dispatch(fetchQuiz({
          id: slug,
          data: {
            id: slug,
            title: quizData.title || 'MCQ Quiz',
            questions: quizData.questions || [],
            type: 'mcq',
          },
          type: 'mcq',
        }))
      } else {
        // Always fetch from API if quizData is missing or empty
        dispatch(fetchQuiz({ id: slug, type: 'mcq' }))
      }
    }
  }, [quizStatus, dispatch, slug, quizData])

  // Handle quiz completion
  useEffect(() => {
    if (!isQuizComplete) return

    if (isAuthenticated) {
      dispatch(submitQuiz()).then((res: any) => {
        if (res?.payload) {
          dispatch(setQuizResults(res.payload))
          // Always use slug in URL, not numeric ID
          const safeSlug = typeof slug === 'string' ? slug : String(slug);
          router.push(`/dashboard/mcq/${safeSlug}/results`)
        }
      })
    } else {
      dispatch(setPendingQuiz({
        slug, // This will be saved properly in sessionStorage
        quizData: {
          title: quizTitle,
          questions,
        },
        currentState: {
          answers,
          currentQuestionIndex,
          isCompleted: true,
          showResults: true,
        },
      }))
      // Always use slug in URL, not numeric ID
      const safeSlug = typeof slug === 'string' ? slug : String(slug);
      router.push(`/dashboard/mcq/${safeSlug}/results`)
    }
  }, [
    isQuizComplete,
    isAuthenticated,
    dispatch,
    router,
    slug,
    quizTitle,
    questions,
    answers,
    currentQuestionIndex,
  ])

  const handleAnswerQuestion = (selectedOption: string) => {
    if (!currentQuestion || answers[currentQuestion.id]?.selectedOptionId) return

    const isCorrect =
      selectedOption === currentQuestion.correctOptionId ||
      selectedOption === currentQuestion.answer

    dispatch(saveAnswer({
      questionId: currentQuestion.id,
      answer: {
        questionId: currentQuestion.id,
        selectedOptionId: selectedOption,
        timestamp: Date.now(),
        type: 'mcq',
        isCorrect,
      },
    }))

    setShowFeedback(true)
    setFeedbackType(isCorrect ? 'correct' : 'incorrect')

    if (feedbackTimeout.current) clearTimeout(feedbackTimeout.current)
    feedbackTimeout.current = setTimeout(() => {
      setShowFeedback(false)
      setFeedbackType(null)
      if (currentQuestionIndex < questions.length - 1) {
        dispatch(setCurrentQuestionIndex(currentQuestionIndex + 1))
      }
    }, 900)
  }

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      dispatch(setCurrentQuestionIndex(currentQuestionIndex + 1))
    }
  }

  // === RENDER STATES ===

  if (quizStatus === 'loading') {
    return <QuizLoadingSteps steps={[{ label: 'Loading quiz data', status: 'loading' }]} />
  }

  if (quizStatus === 'failed') {
    return (
      <div className="max-w-4xl mx-auto text-center py-12">
        <h2 className="text-xl font-bold mb-4">Quiz Not Found</h2>
        <p className="text-muted-foreground mb-6">{error || 'Unable to load quiz data.'}</p>
        <div className="space-x-4">
          <Button variant="outline" onClick={() => window.location.reload()}>
            Try Again
          </Button>
          <Button onClick={() => router.push('/dashboard/quizzes')}>Back to Quizzes</Button>
        </div>
      </div>
    )
  }

  if (!Array.isArray(questions) || questions.length === 0) {
    return (
      <div className="max-w-4xl mx-auto text-center py-12">
        <h2 className="text-xl font-bold mb-4">No Questions Available</h2>
        <p className="text-muted-foreground mb-6">This quiz has no questions.</p>
        <Button onClick={() => router.push('/dashboard/quizzes')}>Back to Quizzes</Button>
      </div>
    )
  }

  if (!currentQuestion) {
    return <QuizLoadingSteps steps={[{ label: 'Initializing quiz', status: 'loading' }]} />
  }

  const currentAnswer = answers[currentQuestion.id]
  const existingAnswer = currentAnswer?.selectedOptionId

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">{quizTitle || 'Multiple Choice Quiz'}</h1>
        <p className="text-muted-foreground">Select an answer and click Next to continue</p>
      </div>
      <div className="mb-8">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium">
            Question {currentQuestionIndex + 1} of {questions.length}
          </span>
          <span className="text-sm text-muted-foreground">
            {Math.round(((currentQuestionIndex + 1) / questions.length) * 100)}% complete
          </span>
        </div>
        <div className="bg-gray-200 rounded-full h-2">
          <div
            className="bg-primary h-2 rounded-full transition-all duration-300 ease-in-out"
            style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
          />
        </div>
      </div>
      <div className="mb-8">
        <McqQuiz
          question={currentQuestion}
          onAnswer={handleAnswerQuestion}
          questionNumber={currentQuestionIndex + 1}
          totalQuestions={questions.length}
          isSubmitting={quizStatus === 'submitting'}
          existingAnswer={existingAnswer}
          feedbackType={showFeedback ? feedbackType : null}
        />
      </div>
      <div className="flex justify-end">
        <Button
          onClick={handleNextQuestion}
          disabled={
            quizStatus === 'submitting' ||
            !answers[currentQuestion.id]?.selectedOptionId ||
            showFeedback
          }
          className="min-w-[120px]"
        >
          {currentQuestionIndex === questions.length - 1 ? 'Finish Quiz' : 'Next Question'}
        </Button>
      </div>
      <div className="mt-6 text-center">
        <p className="text-sm text-muted-foreground">
          {Object.keys(answers).length} of {questions.length} questions answered
        </p>
      </div>
    </div>
  )
}
