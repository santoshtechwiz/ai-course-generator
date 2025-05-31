"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { useDispatch, useSelector } from "react-redux"
import type { AppDispatch } from "@/store"
import { toast } from "sonner"

import { selectIsAuthenticated } from "@/store/slices/authSlice"
import { 
  selectQuestions, 
  selectCurrentQuestion, 
  selectCurrentQuestionIndex, 
  selectQuizStatus, 
  selectQuizError, 
  selectIsQuizComplete, 
  selectAnswers,
  selectQuizTitle,
  fetchQuiz, 
  saveAnswer, 
  setCurrentQuestionIndex, 
  submitQuiz,
  setQuizResults,
  setPendingQuiz,
  setQuizCompleted,
} from "@/store/slices/quizSlice"

import { OpenEndedQuiz } from "./OpenEndedQuiz"
import { QuizLoadingSteps } from "../../components/QuizLoadingSteps"
import { useSessionService } from "@/hooks/useSessionService"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { CheckCircle } from "lucide-react"
import type { OpenEndedQuizAnswer } from "@/app/types/quiz-types"
import type { QuizType } from "@/types/quiz"

interface OpenEndedQuizWrapperProps {
  slug: string
  quizData?: {
    title?: string
    questions?: any[]
  }
}

export default function OpenEndedQuizWrapper({ slug, quizData }: OpenEndedQuizWrapperProps) {
  const router = useRouter()
  const dispatch = useDispatch<AppDispatch>()
  const { saveAuthRedirectState } = useSessionService()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [localResults, setLocalResults] = useState<any>(null)
  const [navigationAttempted, setNavigationAttempted] = useState(false)
  
  // Use a ref to track if navigation is in progress
  const isNavigatingRef = useRef(false)

  // Redux selectors
  const isAuthenticated = useSelector(selectIsAuthenticated)
  const questions = useSelector(selectQuestions)
  const currentQuestion = useSelector(selectCurrentQuestion)
  const currentQuestionIndex = useSelector(selectCurrentQuestionIndex)
  const quizStatus = useSelector(selectQuizStatus)
  const error = useSelector(selectQuizError)
  const isQuizComplete = useSelector(selectIsQuizComplete)
  const answers = useSelector(selectAnswers)
  const quizTitle = useSelector(selectQuizTitle)

  // Load quiz data on mount - with proper dependencies
  useEffect(() => {
    if (quizStatus === "idle") {
      const quizPayload = quizData?.questions?.length
        ? {
            slug,
            data: {
              slug,
              title: quizData.title || "Open-Ended Quiz",
              questions: quizData.questions,
              type: "openended" as QuizType,
            },
            type: "openended" as QuizType,
          }
        : { slug, type: "openended" as QuizType }

      dispatch(fetchQuiz(quizPayload))
    }
  }, [quizStatus, dispatch, slug, quizData]) // Ensure correct dependencies

  // Calculate similarity between user answer and correct answer
  const calculateSimilarity = (userAnswer: string, correctAnswer: string): number => {
    if (!userAnswer || !correctAnswer) return 0
    
    const userTokens = userAnswer.toLowerCase().split(/\s+/)
    const correctTokens = correctAnswer.toLowerCase().split(/\s+/)
    
    // Find common words
    const commonWords = userTokens.filter(word => 
      correctTokens.includes(word)
    )
    
    // Calculate Jaccard similarity
    const union = new Set([...userTokens, ...correctTokens]).size
    const similarity = union > 0 ? commonWords.length / union : 0
    
    return similarity
  }

  // Handle quiz completion - use ref to prevent multiple calls
  useEffect(() => {
    if (!isQuizComplete || navigationAttempted || isNavigatingRef.current) return

    setNavigationAttempted(true)
    isNavigatingRef.current = true
    const safeSlug = typeof slug === "string" ? slug : String(slug)
    
    // Prevent multiple submissions
    if (isSubmitting) return
    
    setIsSubmitting(true)
    
    // Generate local results first to ensure we have them
    const clientSideResults = {
      title: quizTitle || "Open-Ended Quiz",
      completedAt: new Date().toISOString(),
      percentage: calculatePercentage(),
      score: calculateCorrectAnswers(),
      maxScore: questions.length,
      questions: formatQuestionsForResults()
    }
    
    // Keep local copy
    setLocalResults(clientSideResults)
    
    if (isAuthenticated) {
      // Also dispatch to Redux for persistence
      dispatch(setQuizResults(clientSideResults))
      
      dispatch(submitQuiz())
        .then((res: any) => {
          if (res?.payload) {
            // Update with server response if available
            setLocalResults(res.payload)
            dispatch(setQuizResults(res.payload))
          }
          // Navigate with a delay to ensure state is saved
          setTimeout(() => {
            router.push(`/dashboard/openended/${safeSlug}/results`)
          }, 100)
        })
        .catch((error) => {
          console.error("Error submitting quiz:", error)
          toast.error("Failed to submit quiz. Using local results.")
          
          // Already have local results, so just navigate
          setTimeout(() => {
            router.push(`/dashboard/openended/${safeSlug}/results`)
          }, 100)
        })
        .finally(() => {
          setIsSubmitting(false)
          isNavigatingRef.current = false
        })
    } else {
      // For unauthenticated users
      dispatch(setPendingQuiz({
        slug,
        quizData: {
          title: quizTitle || "Open-Ended Quiz",
          questions,
        },
        currentState: {
          answers,
          currentQuestionIndex,
          isCompleted: true,
          showResults: true,
          results: clientSideResults
        },
      }))
      
      // Also dispatch to Redux for consistency
      dispatch(setQuizResults(clientSideResults))
      
      // Save auth redirect state
      saveAuthRedirectState({
        returnPath: `/dashboard/openended/${safeSlug}/results`,
        quizState: {
          slug,
          quizData: {
            title: quizTitle || "Open-Ended Quiz",
            questions,
          },
          currentState: {
            answers,
            isCompleted: true,
            showResults: true,
            results: clientSideResults
          },
        },
      })
      
      // Navigate with local results
      setTimeout(() => {
        router.push(`/dashboard/openended/${safeSlug}/results`)
      }, 100)
    }
  }, [isQuizComplete, isAuthenticated, dispatch, router, slug, questions, answers, 
      currentQuestionIndex, saveAuthRedirectState, quizTitle, isSubmitting, navigationAttempted])

  // Helper function to calculate percentage score
  const calculatePercentage = useCallback(() => {
    if (!questions.length || !answers) return 0
    
    const answeredQuestions = Object.values(answers) as OpenEndedQuizAnswer[]
    if (!answeredQuestions.length) return 0
    
    const correctCount = answeredQuestions.filter(a => a.isCorrect).length
    return Math.round((correctCount / questions.length) * 100)
  }, [questions.length, answers])
  
  // Helper function to count correct answers
  const calculateCorrectAnswers = useCallback(() => {
    if (!answers) return 0
    
    const answeredQuestions = Object.values(answers) as OpenEndedQuizAnswer[]
    return answeredQuestions.filter(a => a.isCorrect).length
  }, [answers])
  
  // Format questions for results
  const formatQuestionsForResults = useCallback(() => {
    return questions.map(q => {
      const userAnswer = answers[q.id]
      return {
        questionId: q.id,
        question: q.question || q.text,
        userAnswer: userAnswer?.text || '',
        correctAnswer: q.answer || '',
        isCorrect: userAnswer?.isCorrect || false,
        similarity: userAnswer?.similarity || 0
      }
    })
  }, [questions, answers])

  // Handle answer submission
  const handleAnswerSubmit = useCallback(
    async (answer: string, elapsedTime: number, hintsUsed: boolean) => {
      if (isSubmitting || !currentQuestion) {
        return
      }

      setIsSubmitting(true)
      
      try {
        // Calculate similarity with correct answer
        const similarity = calculateSimilarity(answer, currentQuestion.answer || "")
        
        // Consider it correct if similarity is above threshold
        const similarityThreshold = 0.6 // 60% similarity threshold
        const isCorrect = similarity >= similarityThreshold
        
        // Prepare the answer object
        const openEndedAnswer: OpenEndedQuizAnswer = {
          questionId: currentQuestion.id,
          text: answer,
          timestamp: Date.now(),
          type: "openended",
          similarity: similarity,
          isCorrect: isCorrect,
          hintsUsed: hintsUsed,
          timeSpent: elapsedTime
        }
        
        // Save answer to Redux
        await dispatch(
          saveAnswer({
            questionId: currentQuestion.id,
            answer: openEndedAnswer
          })
        )

        // Handle navigation automatically if needed
        handleNext()
      } catch (error) {
        console.error("Failed to process answer:", error)
        toast.error("Failed to process your answer. Please try again.")
      } finally {
        setIsSubmitting(false)
      }
    },
    [currentQuestion, dispatch, isSubmitting]
  )

  const handleNext = useCallback(() => {
    const isLastQuestion = currentQuestionIndex >= questions.length - 1
    
    if (isLastQuestion) {
      // Complete the quiz
      dispatch(setQuizCompleted())
    } else {
      // Move to next question
      dispatch(setCurrentQuestionIndex(currentQuestionIndex + 1))
      toast.success("Answer saved! Moving to next question...")
    }
  }, [currentQuestionIndex, questions.length, dispatch])

  // In the handleFinish function, modify it to explicitly set quiz completed
  const handleFinish = useCallback(() => {
    dispatch(setQuizCompleted()) // Use the imported action creator
  }, [dispatch])

  // Calculate derived values outside the render function to prevent recalculations
  const answeredQuestionsCount = Object.keys(answers).length
  const progressPercentage = questions.length > 0 ? (answeredQuestionsCount / questions.length) * 100 : 0

  if (quizStatus === "loading") {
    return <QuizLoadingSteps steps={[{ label: "Loading quiz data", status: "loading" }]} />
  }

  if (quizStatus === "failed") {
    return (
      <div className="max-w-4xl mx-auto text-center py-12">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-bold">Quiz Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-6">{error || "Unable to load quiz data."}</p>
            <div className="space-x-4">
              <Button onClick={() => window.location.reload()}>Try Again</Button>
              <Button variant="outline" onClick={() => router.push("/dashboard/quizzes")}>
                Back to Quizzes
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!Array.isArray(questions) || questions.length === 0) {
    return (
      <div className="max-w-4xl mx-auto text-center py-12">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-bold">No Questions Available</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-6">This quiz has no questions.</p>
            <Button onClick={() => router.push("/dashboard/quizzes")}>Back to Quizzes</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!currentQuestion) {
    return <QuizLoadingSteps steps={[{ label: "Initializing quiz", status: "loading" }]} />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Quiz Header */}
        <Card className="mb-8">
          <CardHeader className="pb-4">
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-2xl font-bold">{quizData?.title || "Open-Ended Quiz"}</CardTitle>
                <p className="text-muted-foreground mt-1">
                  Question {currentQuestionIndex + 1} of {questions.length}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span className="text-sm font-medium">
                    {answeredQuestionsCount}/{questions.length}
                  </span>
                </div>
              </div>
            </div>
            <div className="mt-4">
              <Progress value={progressPercentage} className="h-2" />
            </div>
          </CardHeader>
        </Card>

        {/* Question Navigation */}
        <div className="mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex justify-between items-center">
                <Button
                  variant="outline"
                  onClick={() => dispatch(setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1)))}
                  disabled={currentQuestionIndex === 0}
                >
                  Previous
                </Button>

                <div className="flex gap-2">
                  {questions.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => dispatch(setCurrentQuestionIndex(index))}
                      className={`w-8 h-8 rounded-full text-sm font-medium transition-colors ${
                        index === currentQuestionIndex
                          ? "bg-primary text-primary-foreground"
                          : answers[questions[index].id]
                            ? "bg-green-500 text-white"
                            : "bg-muted text-muted-foreground hover:bg-muted/80"
                      }`}
                    >
                      {index + 1}
                    </button>
                  ))}
                </div>

                <Button
                  variant="outline"
                  onClick={() =>
                    dispatch(setCurrentQuestionIndex(Math.min(questions.length - 1, currentQuestionIndex + 1)))
                  }
                  disabled={currentQuestionIndex === questions.length - 1}
                >
                  Next
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Current Question */}
        <OpenEndedQuiz
          question={currentQuestion}
          questionNumber={currentQuestionIndex + 1}
          totalQuestions={questions.length}
          isSubmitting={isSubmitting}
          isLastQuestion={currentQuestionIndex === questions.length - 1}
          onAnswer={handleAnswerSubmit}
        />
      </div>
    </div>
  )
}
