"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { useDispatch, useSelector } from "react-redux"

import { toast } from "react-hot-toast"
import { Spinner } from "@/hooks/spinner"
import { selectIsAuthenticated, selectUserId } from "@/store/slices/authSlice"
import { 
  selectQuestions, 
  selectCurrentQuestion, 
  selectCurrentQuestionIndex, 
  selectQuizStatus, 
  selectQuizError, 
  selectIsQuizComplete, 
  selectQuizResults, 
  selectAnswers,
  setQuizId, 
  setQuizType, 
  fetchQuiz, 
  saveAnswer, 
  setCurrentQuestionIndex, 
  submitQuiz,
  setQuizResults
} from "@/store/slices/quizSlice"
import { NonAuthenticatedUserSignInPrompt } from "../../components/NonAuthenticatedUserSignInPrompt"
import { OpenEndedQuizQuestion, OpenEndedQuizData, OpenEndedQuizAnswer } from "@/app/types/quiz-types"
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
  const answers = useSelector(selectAnswers) // Get answers from Redux

  const [isInitializing, setIsInitializing] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)
  const [quizData, setQuizData] = useState<OpenEndedQuizData | null>(null)
  const submittingRef = useRef(false)

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

  // Calculate similarity between user answer and correct answer
  const calculateSimilarity = (userAnswer: string, correctAnswer: string): number => {
    if (!userAnswer || !correctAnswer) return 0;
    
    const userTokens = userAnswer.toLowerCase().split(/\s+/);
    const correctTokens = correctAnswer.toLowerCase().split(/\s+/);
    
    // Find common words
    const commonWords = userTokens.filter(word => 
      correctTokens.includes(word)
    );
    
    // Calculate Jaccard similarity
    const union = new Set([...userTokens, ...correctTokens]).size;
    const similarity = union > 0 ? commonWords.length / union : 0;
    
    return similarity;
  };

  // Handle quiz submission
  const handleSubmitQuiz = useCallback(async () => {
    if (submittingRef.current) return
    submittingRef.current = true
    setIsSubmitting(true)
    
    try {
      // Calculate score based on similarity
      let score = 0;
      const maxScore = questions.length;
      
      // Process each question's answer
      const processedAnswers = questions.map(question => {
        const answer = answers[question.id];
        const userAnswer = answer?.text || "";
        const correctAnswer = question.answer || "";
        
        // Calculate similarity and determine if answer is correct
        const similarity = calculateSimilarity(userAnswer, correctAnswer);
        const similarityThreshold = 0.6;
        const isCorrect = similarity >= similarityThreshold;
        
        // Increment score if correct
        if (isCorrect) {
          score++;
        }
        
        return {
          questionId: question.id,
          question: question.question,
          userAnswer,
          correctAnswer,
          isCorrect,
          similarity
        };
      });
      
      // Create results object
      const quizResults = {
        quizId: quizData?.id,
        slug: slug,
        title: quizData?.title || "Open-Ended Quiz",
        score,
        maxScore,
        percentage: Math.round((score / maxScore) * 100),
        completedAt: new Date().toISOString(),
        questions: processedAnswers
      };
      
      // Save results to Redux store
      dispatch(setQuizResults(quizResults));
      
      // Redirect to results page immediately 
      router.push(`/dashboard/openended/${slug}/results`);
    } catch (error) {
      console.error("Failed to submit quiz:", error);
      toast.error("Failed to submit quiz. Please try again.");
    } finally {
      submittingRef.current = false;
      setIsSubmitting(false);
    }
  }, [dispatch, questions, answers, quizData, router, slug]);

  const handleAnswerSubmit = useCallback(
    async (answer: string, elapsedTime: number, hintsUsed: boolean) => {
      if (quizStatus === "submitting" || !currentQuestion) {
        return;
      }

      try {
        setIsSubmitting(true);
        
        // Calculate similarity with correct answer
        const similarity = calculateSimilarity(answer, currentQuestion.answer || "");
        
        // Consider it correct if similarity is above threshold
        const similarityThreshold = 0.6; // 60% similarity threshold
        const isCorrect = similarity >= similarityThreshold;
        
        // Prepare the answer object with proper types
        const openEndedAnswer: OpenEndedQuizAnswer = {
          questionId: currentQuestion.id,
          text: answer,
          timestamp: Date.now(),
          type: "openended",
          similarity: similarity,
          isCorrect: isCorrect,
          hintsUsed: hintsUsed,
          timeSpent: elapsedTime
        };
        
        // Save answer to Redux
        await dispatch(
          saveAnswer({
            questionId: currentQuestion.id,
            answer: openEndedAnswer
          })
        ).unwrap();

        // Check if this is the last question
        const isLastQuestion = currentQuestionIndex >= questions.length - 1;
        
        // If this is the last question, submit the quiz immediately
        if (isLastQuestion) {
          setIsSubmitting(false);
          // Give a small delay to ensure the answer is saved
          setTimeout(() => {
            handleSubmitQuiz();
          }, 100);
        } else {
          // Move to next question
          dispatch(setCurrentQuestionIndex(currentQuestionIndex + 1));
          toast.success("Answer saved! Moving to next question...");
          setIsSubmitting(false);
        }
      } catch (error) {
        toast.error("Failed to process your answer. Please try again.");
        setIsSubmitting(false);
      }
    },
    [currentQuestion, currentQuestionIndex, questions.length, dispatch, handleSubmitQuiz]
  );

  // Check if all questions are answered and auto-submit
  useEffect(() => {
    if (isQuizComplete && !results && !submittingRef.current) {
      handleSubmitQuiz();
    }
  }, [isQuizComplete, results, handleSubmitQuiz]);

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
