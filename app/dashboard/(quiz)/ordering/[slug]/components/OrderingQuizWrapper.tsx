'use client'

// Quiz wrapper for ordering quiz display and interaction
import React, { useEffect, useState, useCallback, useMemo } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { loadOrderingQuiz, submitOrderingQuiz, saveAnswer, setCurrentQuestion } from '@/store/slices/ordering-quiz-slice'
import { setQuizResults } from '@/store/slices/quiz/quiz-slice'
import { UnifiedLoader } from '@/components/loaders'
import { LOADER_MESSAGES } from '@/constants/loader-messages'
import OrderingQuizSingle from '@/components/quiz/OrderingQuizSingle'
import { QuizStateProvider } from '@/components/quiz/QuizStateProvider'
import { QuizFooter } from '@/components/quiz/QuizFooter'
import QuizPlayLayout from '../../../components/layouts/QuizPlayLayout'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertCircle } from 'lucide-react'

interface OrderingQuizWrapperProps {
  slug: string
}

export default function OrderingQuizWrapper({ slug }: OrderingQuizWrapperProps) {
  const router = useRouter()
  const dispatch = useDispatch()

  // Get quiz state from Redux
  const quizData = useSelector((state: any) => state.orderingQuiz?.data || null)
  const currentQuestion = useSelector((state: any) => state.orderingQuiz?.currentQuestion || null)
  const userAnswers = useSelector((state: any) => state.orderingQuiz?.userAnswers || {})
  const isLoading = useSelector((state: any) => state.orderingQuiz?.isLoading || false)
  const error = useSelector((state: any) => state.orderingQuiz?.error || null)
  const isSubmitting = useSelector((state: any) => state.orderingQuiz?.isSubmitting || false)

  // Local state for navigation
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)

  // Parse quiz data to extract multiple questions
  // Now supports array of questions from API
  const questions = useMemo(() => {
    if (!quizData) return []

    // Check if API returned questions array (new format)
    if (quizData.questions && Array.isArray(quizData.questions)) {
      return quizData.questions.map((q: any) => ({
        id: String(q.id),
        title: q.title || 'Order the Steps',
        topic: quizData.title || 'Ordering Quiz',
        description: quizData.description || 'Arrange the steps in the correct order.',
        difficulty: quizData.difficulty || 'medium',
        steps: q.steps || [],
        correctOrder: q.correctOrder || [],
        type: 'ordering' as const,
      }))
    }

    // Fallback to old format (single question with steps at root level)
    if (quizData.steps && Array.isArray(quizData.steps)) {
      return [{
        id: String(quizData.id || '1'),
        title: quizData.title || 'Order the Steps',
        topic: quizData.topic || 'Ordering Quiz',
        description: quizData.description || 'Arrange the steps in the correct order.',
        difficulty: quizData.difficulty || 'medium',
        steps: quizData.steps.map((step: any, index: number) => ({
          id: typeof step.id === 'number' ? step.id : index,
          description: typeof step === 'string' ? step : (step.description || String(step)),
          explanation: typeof step === 'object' ? (step.explanation || '') : '',
        })),
        correctOrder: quizData.correctOrder || Array.from(Array(quizData.steps.length).keys()),
        type: 'ordering' as const,
      }]
    }

    return []
  }, [quizData])

  const totalQuestions = questions.length
  const question = questions[currentQuestionIndex]

  // Load quiz data from database on mount
  useEffect(() => {
    if (!quizData && !isLoading) {
      // @ts-ignore - async thunk dispatch type issue
      dispatch(loadOrderingQuiz(slug))
    }
  }, [slug, dispatch, quizData, isLoading])

  // Set current question in Redux only when index changes (not when question object changes)
  useEffect(() => {
    if (question && currentQuestionIndex >= 0) {
      dispatch(setCurrentQuestion(question))
    }
  }, [currentQuestionIndex, dispatch])
  // Note: Don't include 'question' in deps to avoid infinite loop

  // Handle answer submission for current question
  const handleAnswer = useCallback((answer: number[]) => {
    if (!question) return

    // Save answer to Redux
    dispatch(saveAnswer({
      questionId: question.id,
      answer,
    }))
  }, [question, dispatch])

  // Navigate to next question
  const handleNext = useCallback(() => {
    // Use functional update to avoid stale closure
    setCurrentQuestionIndex(prev => {
      if (prev < totalQuestions - 1) {
        return prev + 1
      }
      return prev
    })
  }, [totalQuestions])

  // Navigate to previous question
  const handlePrevious = useCallback(() => {
    // Use functional update to avoid stale closure
    setCurrentQuestionIndex(prev => {
      if (prev > 0) {
        return prev - 1
      }
      return prev
    })
  }, [])

  // Handle final quiz submission
  const handleSubmit = useCallback(async () => {
    if (!quizData || questions.length === 0 || Object.keys(userAnswers).length === 0) return

    // Build answers array for ALL questions
    const answers = questions.map((q: any) => {
      const userOrder = userAnswers[q.id] || []
      const correctOrder = q.correctOrder || []
      const isCorrect = userOrder.length === correctOrder.length && 
                       userOrder.every((id: number, index: number) => id === correctOrder[index])

      return {
        questionId: String(q.id),
        userAnswer: userOrder,
        answer: userOrder,
        isCorrect,
        timeSpent: 0, // We can track time per question later if needed
      }
    })

    // Calculate score
    const correctCount = answers.filter((a: any) => a.isCorrect).length
    const score = Math.round((correctCount / questions.length) * 100)

    const submitAction = submitOrderingQuiz({
      quizId: String(quizData.id),
      slug,
      answers,
      totalTime: 0,
      score,
      totalQuestions: questions.length,
    })
    
    const resultAction = await (dispatch as any)(submitAction)
    
    // Save results to quiz slice for results page
    if (resultAction.payload) {
      dispatch(setQuizResults({
        slug,
        quizType: 'ordering' as any,
        score,
        percentage: score,
        maxScore: 100,
        totalQuestions: questions.length,
        correctAnswers: correctCount,
        results: resultAction.payload.results || answers.map((a: any, i: number) => ({
          questionId: a.questionId,
          question: questions[i]?.title || `Question ${i + 1}`,
          userAnswer: a.userAnswer,
          correctAnswer: questions[i]?.correctOrder || [],
          isCorrect: a.isCorrect,
          type: 'ordering',
        })),
        submittedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
      }))
    }

    // Navigate to results page
    router.push(`/dashboard/ordering/${slug}/results`)
  }, [quizData, questions, userAnswers, slug, dispatch, router])

  // Format quiz data for QuizPlayLayout
  const formattedQuizData = useMemo(() => ({
    ...quizData,
    questions,
    currentQuestionIndex,
    totalQuestions,
  }), [quizData, questions, currentQuestionIndex, totalQuestions])

  // Loading state
  if (isLoading && !quizData) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <UnifiedLoader
          state="loading"
          variant="spinner"
          size="lg"
          message={LOADER_MESSAGES.LOADING_QUIZ}
        />
      </div>
    )
  }

  // Error state
  if (error && !quizData) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] p-6">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center space-y-4">
            <div className="flex justify-center">
              <AlertCircle className="h-12 w-12 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold">Failed to Load Quiz</h3>
            <p className="text-sm text-muted-foreground">{error}</p>
            <div className="flex gap-3 justify-center">
              <Button onClick={() => router.back()}>Go Back</Button>
              <Button onClick={() => router.push('/dashboard/ordering')}>
                Create New Quiz
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // No data state
  if (!quizData || !question) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <UnifiedLoader
          state="loading"
          variant="spinner"
          size="lg"
          message="Loading quiz..."
        />
      </div>
    )
  }

  const isLastQuestion = currentQuestionIndex === totalQuestions - 1
  const canGoNext = !!userAnswers[question.id]
  const canGoPrevious = currentQuestionIndex > 0

  // Render the quiz wrapped in QuizPlayLayout for consistent UI
  return (
    <QuizPlayLayout 
      quizSlug={slug} 
      quizType="ordering"
      quizData={formattedQuizData}
      isPublic={quizData?.isPublic || false}
      quizId={String(quizData?.id || '')}
    >
      <QuizStateProvider
        onError={(error) => console.error(error)}
        onSuccess={(message) => console.log(message)}
        globalLoading={isSubmitting}
      >
        {(stateManager) => (
          <div className="w-full h-full flex flex-col space-y-6 relative">
            {/* Loading overlay when submitting */}
            {stateManager.isSubmitting && (
              <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-10 flex items-center justify-center">
                <UnifiedLoader
                  state="loading"
                  variant="spinner"
                  size="lg"
                  message="Submitting your quiz answers..."
                  className="text-center"
                />
              </div>
            )}

            {/* Question Component */}
            <OrderingQuizSingle
              question={question}
              questionNumber={currentQuestionIndex + 1}
              totalQuestions={totalQuestions}
              existingAnswer={userAnswers[question.id]}
              onAnswer={handleAnswer}
              className="w-full"
            />

            {/* Quiz Footer for Navigation */}
            <QuizFooter
              onNext={isLastQuestion ? undefined : () => stateManager.handleNext(handleNext)}
              onPrevious={canGoPrevious ? handlePrevious : undefined}
              onSubmit={isLastQuestion ? () => stateManager.handleSubmit(handleSubmit) : undefined}
              canGoNext={canGoNext}
              canGoPrevious={canGoPrevious}
              isLastQuestion={isLastQuestion}
              isSubmitting={isSubmitting || stateManager.isSubmitting}
              hasAnswer={!!userAnswers[question.id]}
              submitState={stateManager.submitState}
              nextState={stateManager.nextState}
            />
          </div>
        )}
      </QuizStateProvider>
    </QuizPlayLayout>
  )
}
