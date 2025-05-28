"use client"

import { useEffect, useCallback, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useDispatch, useSelector } from "react-redux"
import { useSession } from "next-auth/react"

import McqQuiz from "./McqQuiz"
import { AppDispatch, RootState } from "@/store"
import {
  selectQuestions,
  selectAnswers,
  selectQuizStatus,
  selectQuizError,
  selectIsQuizComplete,
  selectQuizResults,
  setCurrentQuestionIndex,
  fetchQuiz,
  saveAnswer,
  submitQuiz,
  resetQuiz
} from "@/store/slices/quizSlice"
import { QuizLoadingSteps } from "../../components/QuizLoadingSteps"
import { Button } from "@/components/ui/button"
import { McqQuestion } from "@/app/types/quiz-types"
import { stateTracker } from "@/utils/stateTracker"


interface McqQuizWrapperProps {
  slug: string
  userId?: string | null
  quizData?: any
}

interface MCQAnswer {
  questionId: string | number
  selectedOptionId: string
  timestamp: number
  type: "mcq"
  isCorrect?: boolean
}

// Helper function to safely interact with sessionStorage
const safeSessionStorage = {
  getItem: (key: string): string | null => {
    if (typeof window === 'undefined') return null;
    try {
      return sessionStorage.getItem(key);
    } catch (e) {
      console.error('Failed to get from sessionStorage:', e);
      return null;
    }
  },
  setItem: (key: string, value: string): void => {
    if (typeof window === 'undefined') return;
    try {
      sessionStorage.setItem(key, value);
    } catch (e) {
      console.error('Failed to set to sessionStorage:', e);
    }
  },
  removeItem: (key: string): void => {
    if (typeof window === 'undefined') return;
    try {
      sessionStorage.removeItem(key);
    } catch (e) {
      console.error('Failed to remove from sessionStorage:', e);
    }
  }
};

// Key for storing quiz state
const QUIZ_STATE_KEY = 'quizState';

export default function McqQuizWrapper({ slug, quizData }: McqQuizWrapperProps) {
  const dispatch = useDispatch<AppDispatch>()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { status: authStatus } = useSession()

  const questions = useSelector(selectQuestions) as McqQuestion[]
  const answers = useSelector(selectAnswers) as Record<string | number, MCQAnswer>
  const status = useSelector(selectQuizStatus)
  const error = useSelector(selectQuizError)
  const isQuizComplete = useSelector(selectIsQuizComplete)
  const results = useSelector(selectQuizResults)
  const currentQuestionIndex = useSelector((state: RootState) => state.quiz.currentQuestionIndex) 
  const quizId = useSelector((state: RootState) => state.quiz.quizId)
  const currentQuestion: McqQuestion | undefined = questions[currentQuestionIndex]

  const submittingRef = useRef(false)
  const isLoading = status === "loading"
  const isSubmitting = status === "submitting" || submittingRef.current
  const isLastQuestion = currentQuestionIndex === questions.length - 1
  const hasValidQuestions = Array.isArray(questions) && questions.length > 0

  // Reset quiz state on mount for this slug
  useEffect(() => {
    dispatch(resetQuiz())
  }, [dispatch])

  // Save current quiz state to sessionStorage
  const saveQuizState = useCallback(() => {
    if (typeof window === 'undefined' || !slug) return;
    
    const quizState = {
      slug,
      quizData,
      answers,
      currentQuestionIndex,
      isQuizComplete
    };
    
    safeSessionStorage.setItem(QUIZ_STATE_KEY, JSON.stringify(quizState));
  }, [slug, quizData, answers, currentQuestionIndex, isQuizComplete]);

  // Save state before unload
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // Save state when component updates
    if (slug && (Object.keys(answers).length > 0 || currentQuestionIndex > 0)) {
      saveQuizState();
    }
    
    // Also save state before page unload
    const handleBeforeUnload = () => {
      saveQuizState();
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [slug, answers, currentQuestionIndex, saveQuizState]);

  // Initialize quiz
  useEffect(() => {
    if (
      slug &&
      !quizId &&
      questions.length === 0 &&
      status === "idle"
    ) {
      dispatch(fetchQuiz({ id: slug, data: quizData, type: "mcq" }));
    }
  }, [dispatch, slug, quizId, questions.length, status, quizData]);

  // Handle reset parameter
  useEffect(() => {
    if (searchParams && typeof searchParams.get === "function" && searchParams.get("reset") === "true") {
      dispatch(resetQuiz());
      router.replace(`/dashboard/mcq/${slug}`);
    }
  }, [searchParams, dispatch, router, slug]);

  // Handle answer submission
  const handleAnswer = useCallback(
    (selectedOption: string) => {
      if (!currentQuestion) return;
      const isCorrect = selectedOption === currentQuestion.correctOptionId ||
                        selectedOption === currentQuestion.answer;
      const answer: MCQAnswer = {
        questionId: currentQuestion.id,
        selectedOptionId: selectedOption,
        timestamp: Date.now(),
        type: "mcq",
        isCorrect
      };
      dispatch(saveAnswer({
        questionId: currentQuestion.id,
        answer
      }));
      
      // Save state after answer submission
      setTimeout(saveQuizState, 0);
    },
    [currentQuestion, dispatch, saveQuizState],
  );

  // Handle navigation to next/previous question
  const handleNavigation = useCallback((direction: 'next' | 'prev') => {
    if (direction === 'next' && currentQuestionIndex < questions.length - 1) {
      requestAnimationFrame(() => {
        dispatch(setCurrentQuestionIndex(currentQuestionIndex + 1));
        setTimeout(saveQuizState, 0);
      });
    } else if (direction === 'prev' && currentQuestionIndex > 0) {
      requestAnimationFrame(() => {
        dispatch(setCurrentQuestionIndex(currentQuestionIndex - 1));
        setTimeout(saveQuizState, 0);
      });
    }
  }, [currentQuestionIndex, questions.length, dispatch, saveQuizState]);

  // Handle quiz submission
  const handleSubmitQuiz = useCallback(async () => {
    if (submittingRef.current) return;
    submittingRef.current = true;
    try {
      await dispatch(submitQuiz()).unwrap();
      
      // Clear quiz state from sessionStorage after successful submission
      safeSessionStorage.removeItem(QUIZ_STATE_KEY);
      
      router.push(`/dashboard/mcq/${slug}/results`);
    } catch {}
    finally {
      submittingRef.current = false;
    }
  }, [dispatch, router, slug]);

  // Auto-submit when quiz is complete
  useEffect(() => {
    if (isQuizComplete && status === "idle" && !results && !submittingRef.current) {
      handleSubmitQuiz();
    }
  }, [isQuizComplete, status, results, handleSubmitQuiz]);

  // Loading state
  if (isLoading || authStatus === "loading") {
    return (
      <QuizLoadingSteps
        steps={[
          { label: "Fetching quiz data", status: "loading" },
          { label: "Preparing questions", status: "pending" },
        ]}
      />
    );
  }

  // Error state
  if (status === "error") {
    return (
      <QuizLoadingSteps
        steps={[
          { label: "Fetching quiz data", status: "error", errorMsg: error || "Failed to load quiz" }
        ]}
      />
    );
  }

  // Empty questions state
  if (!hasValidQuestions) {
    return (
      <QuizLoadingSteps
        steps={[
          { label: "No questions available for this quiz", status: "error", errorMsg: "This quiz doesn't contain any questions. Please try another quiz." }
        ]}
      />
    );
  }

  // Show current question
  if (currentQuestion) {
    const currentAnswer = answers[currentQuestion.id];
    const currentAnswerId = currentAnswer?.selectedOptionId;

    return (
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">{currentQuestion.title || "Multiple Choice Quiz"}</h1>
        <div className="mb-6">
          <div className="bg-gray-100 rounded-full h-2 mb-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-in-out"
              style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
            ></div>
          </div>
          <div className="text-sm text-gray-600 text-right">
            Question {currentQuestionIndex + 1} of {questions.length}
          </div>
        </div>
        <McqQuiz
          question={currentQuestion}
          onAnswer={handleAnswer}
          questionNumber={currentQuestionIndex + 1}
          totalQuestions={questions.length}
          isLastQuestion={isLastQuestion}
          isSubmitting={isSubmitting}
          existingAnswer={currentAnswerId}
          onNavigate={handleNavigation}
        />
        <div className="flex justify-between mt-6">
          <Button
            variant="outline"
            onClick={() => handleNavigation('prev')}
            disabled={currentQuestionIndex === 0 || isSubmitting}
            className="min-w-[100px]"
          >
            Previous
          </Button>
          {!isLastQuestion ? (
            <Button
              onClick={() => handleNavigation('next')}
              disabled={isSubmitting}
              className="min-w-[100px]"
            >
              Next
            </Button>
          ) : (
            <Button
              onClick={handleSubmitQuiz}
              disabled={isSubmitting}
              className="min-w-[100px]"
            >
              {isSubmitting ? "Submitting..." : "Submit Quiz"}
            </Button>
          )}
        </div>
        {isQuizComplete && !isLastQuestion && (
          <div className="mt-8 text-center">
            <Button
              onClick={handleSubmitQuiz}
              disabled={isSubmitting}
              className="px-6 py-3 transition-all duration-300"
            >
              {isSubmitting ? (
                <>
                  <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></span>
                  <span>Submitting...</span>
                </>
              ) : (
                "Submit Quiz"
              )}
            </Button>
          </div>
        )}
      </div>
    )
  }

  // Fallback
  return (
    <QuizLoadingSteps
      steps={[
        { label: "Initializing quiz", status: "loading" }
      ]}
    />
  )
}
