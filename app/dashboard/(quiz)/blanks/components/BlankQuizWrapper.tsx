"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useDispatch, useSelector } from "react-redux"
import { BlankQuizData } from "@/app/types/quiz-types";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/hooks/spinner";
import { selectQuestions, selectAnswers, selectQuizStatus, selectQuizError, selectIsQuizComplete, selectQuizResults, setQuizId, setQuizType, fetchQuiz, submitQuiz } from "@/store/slices/quizSlice";
import { BlanksQuiz } from "./BlanksQuiz";
import { QuizLoadingSteps } from "../../components/QuizLoadingSteps"


interface BlankQuizWrapperProps {
  slug: string;
}

export default function BlankQuizWrapper({ slug }: BlankQuizWrapperProps) {
  const dispatch = useDispatch();
  const router = useRouter();
  
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
        // Always go to results page, let results page handle auth
        router.push(`/dashboard/blanks/${slug}/results`);
      } catch (error) {
        setError("Failed to submit quiz. Please try again.");
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  // Show loading state
  if (isLoading || status === "loading") {
    return (
      <QuizLoadingSteps
        steps={[
          { label: "Fetching quiz data", status: isLoading ? "loading" : "done" },
          { label: "Preparing questions", status: isLoading ? "pending" : "loading" },
        ]}
      />
    );
  }

  // Show error state
  if (error || status === "error" || !quizData) {
    return (
      <QuizLoadingSteps
        steps={[
          { label: "Fetching quiz data", status: "error", errorMsg: error || storeError || "Failed to load quiz" },
        ]}
      />
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
