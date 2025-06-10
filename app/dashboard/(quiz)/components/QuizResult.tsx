"use client";

import { useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
import { resetQuiz } from "@/store/slices/quizSlice";
import { AppDispatch } from "@/store";
import BlankQuizResults from "../blanks/components/BlankQuizResults";
import McqQuizResult from "../mcq/components/McqQuizResult";
import OpenEndedQuizResults from "../openended/components/QuizResultsOpenEnded";
import { QuizLoader } from "@/components/ui/quiz-loader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

// Import the quiz type definition
import type { QuizType } from "@/types/quiz";
import FlashCardResults from "../flashcard/components/FlashCardQuizResults";

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
    if (onRetake) {
      onRetake();
    } else {
      dispatch(resetQuiz());
      router.push(`/dashboard/${quizType}/${slug}`);
    }
  };
  
  // Show error UI if no result is provided
  if (!result) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <div className="flex justify-center mb-4">
            <AlertCircle className="h-12 w-12 text-destructive" />
          </div>
          <h2 className="text-xl font-bold mb-4">Results Not Found</h2>
          <p className="text-muted-foreground mb-6">
            We couldn't load your quiz results. The quiz may not have been completed.
          </p>
          <Button onClick={handleRetake}>Take the Quiz</Button>
        </CardContent>
      </Card>
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
      <Card>
        <CardContent className="p-6 text-center">
          <div className="flex justify-center mb-4">
            <AlertCircle className="h-12 w-12 text-yellow-500" />
          </div>
          <h2 className="text-xl font-bold mb-4">Invalid Results</h2>
          <p className="text-muted-foreground mb-6">
            Your quiz results appear to be incomplete or invalid. 
            It's recommended to retake the quiz.
          </p>
          <Button onClick={handleRetake}>Retake Quiz</Button>
        </CardContent>
      </Card>
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
    default:
      return <McqQuizResult result={result} />;
  }
}
