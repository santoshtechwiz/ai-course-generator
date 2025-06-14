"use client";

import { useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
import { clearQuizState } from "@/store/slices/quiz-slice";
import { AppDispatch } from "@/store";
import BlankQuizResults from "../blanks/components/BlankQuizResults";
import McqQuizResult from "../mcq/components/McqQuizResult";
import OpenEndedQuizResults from "../openended/components/QuizResultsOpenEnded";
import { NoResults } from "@/components/ui/no-results";
import FlashCardResults from "../flashcard/components/FlashCardQuizResults";

// Import the quiz type definition
import type { QuizType } from "@/types/quiz";

// QuizResult props with appropriate typing
interface QuizResultProps {
  /** Quiz result data */
  result: any; 
  /** Quiz slug for retaking or other operations */
  slug: string;
  /** Type of quiz being displayed */
  quizType: QuizType;
  /** Optional callback for retaking the quiz */
  onRetake?: () => void;
}

export default function QuizResult({ 
  result,
  slug,
  quizType = "mcq",
  onRetake
}: QuizResultProps) {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();

  // Handle retake action
  const handleRetake = () => {
    dispatch(clearQuizState()); // Use clearQuizState to reset the state completely
    router.push(`/dashboard/${quizType}/${slug}`); // Redirect to the quiz start page
  };
  
  // Show error UI if no result is provided
  if (!result) {
    return (
      <NoResults 
        variant="quiz"
        title="Results Not Found"
        description="We couldn't load your quiz results. The quiz may not have been completed."
        action={{
          label: "Retake Quiz",
          onClick: handleRetake
        }}
      />
    );
  }
  
  // Verify the result has enough data to render
  const isValidResult = 
    result && 
    (result.percentage !== undefined || 
     result.score !== undefined || 
     (result.questionResults && result.questionResults.length) || 
     (result.questions && result.questions.length));
  
  if (!isValidResult) {
    return (
      <NoResults
        variant="quiz"
        title="Invalid Quiz Results"
        description="Your quiz results appear to be incomplete or invalid. It's recommended to retake the quiz."
        action={{
          label: "Retake Quiz",
          onClick: handleRetake
        }}
      />
    );
  }
  
  return renderQuizResultComponent(quizType, result, slug, handleRetake);
}

// Helper function to render the appropriate quiz result component based on quiz type
function renderQuizResultComponent(
  quizType: QuizType,
  result: any,
  slug: string,
  onRetake: () => void
) {
  if (!result) return null;
  
  // Return the appropriate result component based on quiz type
  switch (quizType) {
    case "mcq":
      return <McqQuizResult result={result} />;
    
    case "blanks":
      return (
        <BlankQuizResults
          result={result}
          isAuthenticated={true} // Always true when rendered via QuizResultHandler
          slug={slug}
          onRetake={onRetake}
        />
      );
    
    case "openended":
      return (
        <OpenEndedQuizResults
          result={result}
          isAuthenticated={true} // Always true when rendered via QuizResultHandler
          slug={slug}
          onRetake={onRetake}
        />
      );
    
    case "code":
      return <McqQuizResult result={result} />; // Fallback to MCQ for now
    case "flashcard":
      return <FlashCardResults result={result} />;
    case "openended":
      return <OpenEndedQuizResults result={result} slug={slug} onRetake={onRetake} />;
      case "blanks":
      return (
        <BlankQuizResults
          result={result}
          isAuthenticated={true} // Always true when rendered via QuizResultHandler
          slug={slug}
          onRetake={onRetake}
        />
      );
    case "flashcard":
      return <FlashCardResults result={result} slug={slug} onRetake={onRetake} />;
      default:
      return <McqQuizResult result={result} />;

  }
}
