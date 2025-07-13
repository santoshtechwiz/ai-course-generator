"use client";

import { BaseQuizResults } from "../../components/BaseTextQuizResult";

interface BlankQuizResultsProps {
  result: any;
  onRetake?: () => void;
  isAuthenticated?: boolean;
  slug: string;
}
export default function BlankQuizResults({
  result,
  onRetake,
  isAuthenticated = true,
  slug,
}: BlankQuizResultsProps) {
  return (
    <BaseQuizResults
      result={result}
      onRetake={onRetake}
      isAuthenticated={isAuthenticated}
      slug={slug}
      quizType="blanks"
    />
  );
}
