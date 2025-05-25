"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useDispatch, useSelector } from "react-redux"
import { BlankQuizData } from "@/app/types/quiz-types";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/hooks/spinner";
import { selectIsAuthenticated, selectUserId } from "@/store/slices/authSlice";
import { selectQuestions, selectAnswers, selectQuizStatus, selectQuizError, selectIsQuizComplete, selectQuizResults, setQuizId, setQuizType, fetchQuiz, submitQuiz } from "@/store/slices/quizSlice";
import { NonAuthenticatedUserSignInPrompt } from "../../components/NonAuthenticatedUserSignInPrompt";
import { BlanksQuiz } from "./BlanksQuiz";


interface BlankQuizWrapperProps {
  slug: string;
}

export default function BlankQuizWrapper({ slug }: BlankQuizWrapperProps) {
  const dispatch = useDispatch();
  const router = useRouter();
  
  // Authentication state
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const userId = useSelector(selectUserId);
  
  // Quiz state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quizData, setQuizData] = useState<BlankQuizData | null>(null);

  // Get data from Redux store
  const questions = useSelector(selectQuestions);
  const answers = useSelector(selectAnswers);
  const status = useSelector(selectQuizStatus);
  const storeError = useSelector(selectQuizError);
  const isQuizComplete = useSelector(selectIsQuizComplete);
  const results = useSelector(selectQuizResults);

  // Fetch quiz data from API
  useEffect(() => {
    const fetchQuizData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch(`/api/quizzes/blanks/${slug}`);
        
        if (!response.ok) {
          throw new Error(response.status === 404 
            ? "Quiz not found" 
            : `Failed to load quiz (${response.status})`);
        }

        const data = await response.json();
        setQuizData(data);

        // Initialize Redux store with quiz data
        dispatch(setQuizId(data.id));
        dispatch(setQuizType("blanks"));
        dispatch(fetchQuiz({
          id: data.id,
          data: data,
          type: "blanks"
        }));
      } catch (err: any) {
        setError(err.message || "Failed to load quiz");
      } finally {
        setIsLoading(false);
      }
    };

    if (slug) {
      fetchQuizData();
    }
  }, [slug, dispatch]);

  // Handle quiz submission
  const handleSubmitQuiz = async () => {
    if (isQuizComplete) {
      setIsSubmitting(true);
      try {
        await dispatch(submitQuiz()).unwrap();
        
        // If authenticated, go directly to results
        if (isAuthenticated) {
          router.push(`/dashboard/blanks/${slug}/results`);
        }
        // Otherwise, show auth prompt (handled in render)
      } catch (error) {
        setError("Failed to submit quiz. Please try again.");
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  // Handle sign in
  const handleSignIn = () => {
    // In a real app, this would redirect to your auth provider
    router.push(`/api/auth/signin?callbackUrl=/dashboard/blanks/${slug}/results`);
  };

  // Show loading state
  if (isLoading || status === "loading") {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center space-y-4">
          <Spinner size="lg" />
          <p className="text-muted-foreground">Loading quiz...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error || status === "error" || !quizData) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center space-y-4">
          <p className="text-destructive">{error || storeError || "Failed to load quiz"}</p>
          <Button
            onClick={() => window.location.reload()}
            variant="outline"
            className="mr-2"
          >
            Try Again
          </Button>
          <Button
            onClick={() => router.push("/dashboard/quizzes")}
            variant="default"
          >
            Return to Quizzes
          </Button>
        </div>
      </div>
    );
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

  const progressPercentage = Math.round((Object.keys(answers).length / questions.length) * 100) || 0;

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">{quizData.title}</h1>

      <div className="mb-6">
        <div className="bg-gray-100 rounded-full h-2 mb-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-in-out"
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>
        <div className="text-sm text-gray-600 text-right">
          {Object.keys(answers).length}/{questions.length} questions answered
        </div>
      </div>

      <BlanksQuiz />

      <div className="mt-8 text-center">
        <Button
          onClick={handleSubmitQuiz}
          disabled={!isQuizComplete || isSubmitting}
          className="px-6 py-3 transition-all duration-300"
          variant={isQuizComplete ? "default" : "outline"}
        >
          {isSubmitting ? (
            <>
              <Spinner className="mr-2" size="sm" />
              <span>Submitting...</span>
            </>
          ) : (
            "Submit Quiz"
          )}
        </Button>
      </div>
    </div>
  );
}
