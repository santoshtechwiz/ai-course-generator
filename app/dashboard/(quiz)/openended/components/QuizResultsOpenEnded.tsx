"use client"

import { BaseQuizResults } from "../../components/BaseTextQuizResult"
import { NoResults } from "@/components/ui/no-results"
import { Progress } from "@/components/ui/progress"
import { RefreshCw } from "lucide-react"

interface Props {
  result: any;
  onRetake?: () => void;
  isAuthenticated?: boolean;
  slug: string;
}

export default function OpenEndedQuizResults({ result, onRetake, isAuthenticated = true, slug }: Props) {
  // Enhanced validation for results
  const isValidResult = result && (
    (result.questions && result.questions.length > 0) || 
    (result.questionResults && result.questionResults.length > 0) ||
    typeof result.percentage === 'number' ||
    typeof result.score === 'number'
  );
    // Make sure we have a valid result object
  if (!isValidResult) {
    // Redirect to quiz page after a short delay if no results found
    if (typeof window !== 'undefined' && onRetake) {
      setTimeout(() => {
        onRetake();
      }, 3000);
    }
    
    // Show a nice message while redirecting
    return (
      <div className="container max-w-4xl py-6">
        <NoResults
          variant="quiz"
          title="Preparing Your Quiz"
          description="We couldn't find your results. Redirecting to the quiz page..."
          action={{
            label: 'Go to Quiz Now',
            onClick: onRetake || (() => {}),
            icon: <RefreshCw className="h-4 w-4" />,
            variant: 'default',
          }}
        />
        <div className="w-full mt-4">
          <Progress value={100} className="h-1 animate-pulse" />
        </div>
      </div>
    );
  }
  
  return (
    <BaseQuizResults
      result={result}
      onRetake={onRetake}
      isAuthenticated={isAuthenticated}
      slug={slug}
      quizType="open-ended"
    />
  )
}
