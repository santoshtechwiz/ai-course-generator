"use client"

import { McqQuizResultProps } from "../../components/quiz-result-types"
import { BaseQuizResult } from "../../components/BaseQuizResult"
import { LearningInsights } from "./LearningInsights"
import { processQuizAnswers } from "../../utils/quiz-result-utils"

// ============================================================================
// MAIN COMPONENT
// ============================================================================

/**
 * McqQuizResult Component - Displays MCQ quiz results
 * Extends BaseQuizResult with MCQ-specific insights
 */
export function McqQuizResult({ result, onRetake }: McqQuizResultProps) {
  // Render the insights tab content
  const renderMcqInsights = (performance: any, stats: any) => {
    return <LearningInsights performance={performance} stats={stats} />
  }
  // Use the base component with MCQ-specific processing
  return (
    <BaseQuizResult
      result={result}
      onRetake={onRetake}
      processAnswers={processQuizAnswers}
      renderInsightsTab={renderMcqInsights}
    />
  )
}


