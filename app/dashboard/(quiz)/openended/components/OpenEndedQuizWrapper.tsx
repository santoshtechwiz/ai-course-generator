"use client"

import { useState, useCallback, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useDispatch, useSelector } from "react-redux"
import {
  fetchQuiz,
  setQuizId,
  setQuizType,
  submitQuiz,
  setCurrentQuestionIndex,
  saveAnswer,
  selectQuestions,
  selectCurrentQuestion,
  selectCurrentQuestionIndex,
  selectQuizStatus,
  selectQuizError,
} from "@/store/slices/quizSlice"

import { OpenEndedQuiz } from "./OpenEndedQuiz"
import { toast } from "react-hot-toast"
import { OpenEndedQuizData, OpenEndedQuizQuestion } from "../types"

interface OpenEndedQuizWrapperProps {
  slug: string;
  userId?: string | null;
  quizData?: OpenEndedQuizData;
}

export default function OpenEndedQuizWrapper({ slug, userId, quizData }: OpenEndedQuizWrapperProps) {
  const router = useRouter()
  const dispatch = useDispatch()

  // Redux selectors
  const questions = useSelector(selectQuestions)
  const currentQuestion = useSelector(selectCurrentQuestion) as OpenEndedQuizQuestion
  const currentQuestionIndex = useSelector(selectCurrentQuestionIndex)
  const quizStatus = useSelector(selectQuizStatus)
  const error = useSelector(selectQuizError)

  const [isInitializing, setIsInitializing] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const [localError, setLocalError] = useState<string | null>(null)
  const [localQuizData, setLocalQuizData] = useState<OpenEndedQuizData | null>(null)

  // Fetch quiz data if not provided
  useEffect(() => {
    const fetchQuizData = async () => {
      if (!slug) return;
      
      try {
        setIsLoading(true);
        setLocalError(null);

        const response = await fetch(`/api/quizzes/openended/${slug}`);
        
        if (!response.ok) {
          throw new Error(response.status === 404 
            ? "Quiz not found" 
            : `Failed to load quiz (${response.status})`);
        }

        const data = await response.json();
        setLocalQuizData(data);
      } catch (err: any) {
        setLocalError(err.message || "Failed to load quiz");
      } finally {
        setIsLoading(false);
      }
    };

    if (!quizData && slug) {
      fetchQuizData();
    } else if (quizData) {
      setLocalQuizData(quizData);
      setIsLoading(false);
    }
  }, [slug, quizData]);

  // Initialize Redux store with quiz data
  useEffect(() => {
    const initTimer = setTimeout(() => {
      const dataToUse = quizData || localQuizData;
      
      if (dataToUse && dataToUse.id && Array.isArray(dataToUse.questions) && dataToUse.questions.length > 0) {
        dispatch(setQuizId(dataToUse.id.toString()))
        dispatch(setQuizType("openended"))
        
        // Pass the quiz data directly to avoid API call
        dispatch(
          fetchQuiz({
            id: dataToUse.id.toString(),
            data: {
              id: dataToUse.id,
              type: "openended",
              title: dataToUse.title,
              questions: dataToUse.questions.map((q) => ({
                id: q.id,
                text: q.question,
                type: "openended" as const,
                answer: q.answer,
                hints: q.hints || [],
              })),
            },
          }),
        )
      }
      setIsInitializing(false)
    }, 500)

    return () => clearTimeout(initTimer)
  }, [dispatch, quizData, localQuizData]);

  const handleAnswerSubmit = useCallback(
    async (answer: string, elapsedTime: number, hintsUsed: boolean) => {
      if (quizStatus === "submitting" || !currentQuestion) {
        return;
      }

      try {
        // Save answer to Redux
        await dispatch(
          saveAnswer({
            questionId: currentQuestion.id,
            answer: {
              questionId: currentQuestion.id,
              text: answer,
              timestamp: Date.now(),
            },
          }),
        ).unwrap()

        // Check if we're on the last question
        const isLastQuestion = currentQuestionIndex >= questions.length - 1

        if (!isLastQuestion) {
          // Move to the next question
          dispatch(setCurrentQuestionIndex(currentQuestionIndex + 1))
          toast.success("Answer saved! Moving to next question...")
        } else {
          // This is the last question - handle quiz completion
          try {
            await dispatch(submitQuiz()).unwrap()
            toast.success("Quiz completed! Viewing your results...")
            router.push(`/dashboard/openended/${slug}/results`)
          } catch (error) {
            toast.error("Failed to submit quiz, but your answers are saved")
            // Continue to results page anyway since we have local data
            router.push(`/dashboard/openended/${slug}/results`)
          }
        }
      } catch (error) {
        toast.error("Failed to process your answer. Please try again.")
      }
    },
    [currentQuestion, questions.length, currentQuestionIndex, dispatch, slug, router, quizStatus],
  )

  if (isInitializing || isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center space-y-4">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
          <p className="text-muted-foreground">Loading your quiz...</p>
        </div>
      </div>
    )
  }

  if (localError || error || !localQuizData) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center space-y-4">
          <p className="text-destructive">Error: {localError || error || "Failed to load quiz"}</p>
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
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">{localQuizData.title}</h1>
      <OpenEndedQuiz onAnswer={handleAnswerSubmit} />
    </div>
  )
}
