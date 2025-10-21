'use client';

import { BaseQuizResults } from '../../components/BaseTextQuizResult';

interface BlankQuizResultsProps {
  result: Record<string, unknown>;
  onRetake?: () => void;
  slug: string;
}
export default function BlankQuizResults({
  result,
  onRetake,
  slug,
}: BlankQuizResultsProps) {
  return (
    <BaseQuizResults
      result={result}
      onRetake={onRetake}
      slug={slug}
      quizType="blanks"
    />
  );
}
