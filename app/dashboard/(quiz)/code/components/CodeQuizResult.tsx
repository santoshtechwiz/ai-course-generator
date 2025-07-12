
"use client"

import { CodeQuizResultProps } from "../../components/quiz-result-types"
import { BaseQuizResult } from "../../components/BaseQuizResult"
import { processQuizAnswers } from "../../utils/quiz-result-utils"
import { LearningInsights } from "../../mcq/components/LearningInsights"

export default function CodeQuizResult({ result, onRetake }: CodeQuizResultProps) {

  const renderCodeInsights = (performance: any, stats: any) => {
    return (
      <div className="space-y-6">
        <LearningInsights 
          performance={performance}
          stats={stats}
          extraInfo={{
            title: "Code Quiz Insights",
            tips: [
              "Practice reading code without running it to improve debugging skills",
              "Understanding code patterns is more important than memorizing syntax",
              "Try rewriting the code examples in another language to deepen understanding"
            ]
          }}
        />
      </div>
    )
  }

  // Use the base component with code-specific processing
  return (
    <BaseQuizResult
      result={result}
      onRetake={onRetake}
      processAnswers={processQuizAnswers}
      renderInsightsTab={renderCodeInsights}
    />
  )
}
