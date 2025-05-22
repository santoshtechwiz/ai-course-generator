"use client"

import { useEffect, useCallback, useMemo, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { useAppDispatch, useAppSelector } from "@/store"
import { initializeQuiz, completeQuiz, setCurrentQuestion, submitAnswerLocally } from "@/app/store/slices/textQuizSlice"
import type { OpenEndedQuizData } from "@/types/quiz"
import OpenEndedQuizQuestion from "./OpenEndedQuizQuestion"

import { toast } from "react-hot-toast"
import { saveQuizAnswer } from "@/lib/utils/quiz-answer-utils"

interface OpenEndedQuizWrapperProps {
  quizData: OpenEndedQuizData
  slug: string
}

export default function OpenEndedQuizWrapper({ quizData, slug }: OpenEndedQuizWrapperProps) {
  const router = useRouter()
  const dispatch = useAppDispatch()
  const quizState = useAppSelector((state) => state.textQuiz)
  const [isInitializing, setIsInitializing] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [userAnswers, setUserAnswers] = useState<any[]>([])
  const navigatingRef = useRef(false)
  const quizCompletedRef = useRef(false)

  const isValidQuizData = useMemo(() => {
    return Boolean(
      quizData?.id &&
      Array.isArray(quizData.questions) &&
      quizData.questions.length > 0 &&
      quizData.questions.every((q) => q.question && q.answer)
    )
  }, [quizData])

  const quizInfo = useMemo(() => ({
    id: quizData?.id,
    questionCount: quizData?.questions?.length || 0,
    hasQuestions: Boolean(quizData?.questions?.length),
    isValid: isValidQuizData,
  }), [quizData?.id, quizData?.questions?.length, isValidQuizData])

  useEffect(() => {
    const initTimer = setTimeout(() => {
      if (quizInfo.id && quizInfo.hasQuestions && slug) {
        dispatch(
          initializeQuiz({
            ...quizData,
            type: "openended",
            slug,
          })
        )
      }
      setIsInitializing(false)
    }, 500)

    return () => clearTimeout(initTimer)
  }, [dispatch, quizInfo.id, quizInfo.hasQuestions, slug, quizData])

  const handleQuestionComplete = useCallback(() => {
    if (navigatingRef.current || quizCompletedRef.current) return

    const currentIndex = quizState?.currentQuestionIndex ?? 0

    if (currentIndex === quizInfo.questionCount - 1) {
      navigatingRef.current = true
      quizCompletedRef.current = true

      const completionTimestamp = new Date().toISOString()
      const currentAnswers = quizState?.answers ?? []

      dispatch(
        completeQuiz({
          answers: currentAnswers,
          completedAt: completionTimestamp,
          quizId: quizData?.id || quizState?.quizData?.id,
          title: quizData?.title || quizState?.quizData?.title || "Open Ended Quiz",
          score: 0, // Will be calculated on results page
          questions: quizData.questions, // Include questions for result page
          slug: slug // Include slug for validation
        })
      )

      // Small delay to ensure state is updated before navigation
      setTimeout(() => {
        router.replace(`/dashboard/openended/${slug}/results`)
      }, 200)
    } else {
      dispatch(setCurrentQuestion(currentIndex + 1))
    }
  }, [quizState, quizInfo.questionCount, router, slug, dispatch, quizData])

  const handleAnswerSubmit = useCallback(
    async (answer: string, elapsedTime: number, hintsUsed: boolean) => {
      // Don't process answers if we're already submitting
      if (isSubmitting || !currentQuestion) return

      // Create user answer object
      const userAnswer = {
        questionId: currentQuestion.id,
        answer,
        timeSpent: elapsedTime,
        hintsUsed,
        index: currentQuestionIdx,
        // Use the isCorrect field for consistency with other quiz types
        // This might come from the API verification or be left undefined for server-side evaluation
        isCorrect: undefined
      };

      // Save the answer in local state
      setUserAnswers((prev) => {
        // Check if this answer already exists and update it
        const exists = prev.some(a => a.questionId === currentQuestion.id);
        if (exists) {
          return prev.map(a => a.questionId === currentQuestion.id ? userAnswer : a);
        }
        // Otherwise add as new answer
        return [...prev, userAnswer];
      });

      // Dispatch to Redux store
      dispatch(submitAnswerLocally(userAnswer));

      // For text-based quizzes, we can also save each answer to the database
      // But use the saveQuizAnswer utility for consistent handling
      try {
        await saveQuizAnswer({
          slug,
          questionId: currentQuestion.id,
          answer,
          type: "openended",
          timeSpent: elapsedTime,
          showToast: true
        });
      } catch (error) {
        console.warn("Failed to save answer to database:", error);
        // We continue with local storage, no need to block progression
      }

      // Check if we're on the last question
      const isLastQuestion = currentQuestionIdx >= quizData.questions.length - 1;

      if (!isLastQuestion) {
        // Move to the next question with a short delay for state updates
        setTimeout(() => {
          setCurrentQuestionIdx((prevIdx) => prevIdx + 1);
        }, 50);
      } else {
        // This is the last question - handle quiz completion
        setQuizCompleted(true);
        setIsSubmitting(true);

        try {
          // First dispatch action to Redux
          dispatch(completeQuiz({
            quizId: quizData.id,
            title: quizData.title,
            completedAt: new Date().toISOString(),
            score: score
          }));

          // Calculate total time spent
          const totalTime = userAnswers.reduce((total, a) => total + (a.timeSpent || 0), 0) + elapsedTime;
          
          // Use the shared utility for submission
          await submitCompletedQuiz({
            slug,
            type: "openended",
            answers: [...userAnswers, userAnswer],
            score: score || 0,  // Text quizzes may not have immediate scoring
            totalQuestions: quizData.questions.length,
            totalTime
          });
          
          // Show success message
          toast.success("Quiz completed! Viewing your results...", {
            duration: 3000
          });

          // Navigate to results page
          setTimeout(() => {
            router.push(`/dashboard/openended/${slug}/results`);
          }, 800);
        } catch (error) {
          console.error("Failed to handle quiz completion:", error);
          setIsSubmitting(false);
          setSubmitError("Failed to process quiz results");
          
          // Continue to results page anyway since we have local data
          setTimeout(() => {
            router.push(`/dashboard/openended/${slug}/results`);
          }, 1500);
        }
      }
    },
    [
      isSubmitting,
      currentQuestion,
      dispatch,
      slug,
      quizData.id,
      quizData.title,
      userAnswers,
      router,
      score,
      currentQuestionIdx,
      elapsedTime
    ]
  );
  
  if (isInitializing) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center space-y-4">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
          <p className="text-muted-foreground">Initializing your quiz...</p>
        </div>
      </div>
    )
  }

  if (!quizInfo.isValid) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center space-y-4">
          <p className="text-destructive">Invalid quiz data. Please try again later.</p>
          <button
            onClick={() => router.push("/dashboard/quizzes")}
            className="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary/90"
          >
            Return to Quizzes
          </button>
        </div>
      </div>
    )
  }

  const currentQuestionIndex = quizState?.currentQuestionIndex ?? 0
  const currentQuestion = quizData.questions[currentQuestionIndex]

  if (!currentQuestion) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center space-y-4">
          <p className="text-destructive">Failed to load quiz question.</p>
          <button
            onClick={() => router.push("/dashboard/quizzes")}
            className="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary/90"
          >
            Return to Quizzes
          </button>
        </div>
      </div>
    )
  }

  return (
    <OpenEndedQuizQuestion
      question={currentQuestion}
      questionNumber={currentQuestionIndex + 1}
      totalQuestions={quizInfo.questionCount}
      isLastQuestion={currentQuestionIndex === quizInfo.questionCount - 1}
      onQuestionComplete={handleQuestionComplete}
    />
  )
}
