"use client"

import { useState, useCallback, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useDispatch, useSelector } from "react-redux"

import { toast } from "react-hot-toast"
import { Spinner } from "@/hooks/spinner"
import { selectIsAuthenticated, selectUserId } from "@/store/slices/authSlice"
import { selectQuestions, selectCurrentQuestion, selectCurrentQuestionIndex, selectQuizStatus, selectQuizError, selectIsQuizComplete, selectQuizResults, setQuizId, setQuizType, fetchQuiz, saveAnswer, setCurrentQuestionIndex, submitQuiz } from "@/store/slices/quizSlice"
import { NonAuthenticatedUserSignInPrompt } from "../../components/NonAuthenticatedUserSignInPrompt"
import { OpenEndedQuizQuestion, OpenEndedQuizData } from "../types"
import { OpenEndedQuiz } from "./OpenEndedQuiz"
import { QuizLoadingSteps } from "../../components/QuizLoadingSteps"

interface OpenEndedQuizWrapperProps {
  slug: string;
}

export default function OpenEndedQuizWrapper({ slug }: OpenEndedQuizWrapperProps) {
  const router = useRouter()
  const dispatch = useDispatch()

  // Authentication state
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const userId = useSelector(selectUserId);

  // Redux selectors
  const questions = useSelector(selectQuestions)
  const currentQuestion = useSelector(selectCurrentQuestion) as OpenEndedQuizQuestion
  const currentQuestionIndex = useSelector(selectCurrentQuestionIndex)
  const quizStatus = useSelector(selectQuizStatus)
  const error = useSelector(selectQuizError)
  const isQuizComplete = useSelector(selectIsQuizComplete)
  const results = useSelector(selectQuizResults)

  const [isInitializing, setIsInitializing] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)
  const [quizData, setQuizData] = useState<OpenEndedQuizData | null>(null)

  // Fetch quiz data
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
        setQuizData(data);
        
        // Initialize Redux store with quiz data
        dispatch(setQuizId(data.id));
        dispatch(setQuizType("openended"));
        dispatch(fetchQuiz({
          id: data.id,
          data: data,
          type: "openended"
        }));
      } catch (err: any) {
        setLocalError(err.message || "Failed to load quiz");
      } finally {
        setIsLoading(false);
        setIsInitializing(false);
      }
    };

    if (slug) {
      fetchQuizData();
    }
  }, [slug, dispatch]);

  // Handle sign in
  const handleSignIn = () => {
    // In a real app, this would redirect to your auth provider
    router.push(`/api/auth/signin?callbackUrl=/dashboard/openended/${slug}/results`);
  };

  const handleAnswerSubmit = useCallback(
    async (answer: string, elapsedTime: number, hintsUsed: boolean) => {
      if (quizStatus === "submitting" || !currentQuestion) {
        return;
      }

      try {
        setIsSubmitting(true);
        
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
          setIsSubmitting(false);
        } else {
          // This is the last question - handle quiz completion
          try {
            await dispatch(submitQuiz()).unwrap()
            
            // If authenticated, go directly to results
            if (isAuthenticated) {
              toast.success("Quiz completed! Viewing your results...")
              router.push(`/dashboard/openended/${slug}/results`)
            }
            // Otherwise, show auth prompt (handled in render)
            setIsSubmitting(false);
          } catch (error) {
            toast.error("Failed to submit quiz, but your answers are saved")
            setIsSubmitting(false);
          }
        }
      } catch (error) {
        toast.error("Failed to process your answer. Please try again.")
        setIsSubmitting(false);
      }
    },
    [currentQuestion, questions.length, currentQuestionIndex, dispatch, slug, router, quizStatus, isAuthenticated],
  )

  if (isInitializing || isLoading) {
    return (
      <QuizLoadingSteps
        steps={[
          { label: "Fetching quiz data", status: isLoading ? "loading" : "done" },
          { label: "Preparing questions", status: isLoading ? "pending" : "loading" },
        ]}
      />
    )
  }

  if (localError || error || !quizData) {
    return (
      <QuizLoadingSteps
        steps={[
          { label: "Fetching quiz data", status: "error", errorMsg: localError || error || "Failed to load quiz" },
        ]}
      />
    )
  }

  // If quiz is complete and user is not authenticated, show sign in prompt
  if (isQuizComplete && !isAuthenticated && !isSubmitting) {
    return (
      <div className="max-w-md mx-auto my-8">
        <NonAuthenticatedUserSignInPrompt 
          onSignIn={handleSignIn}
          title="Sign In to See Results"
          message="Your quiz is complete! Sign in to view your results and save your progress."
        />
      </div>
    );
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
      <h1 className="text-2xl font-bold mb-6">{quizData.title}</h1>
      <OpenEndedQuiz onAnswer={handleAnswerSubmit} />
    </div>
  )
}
