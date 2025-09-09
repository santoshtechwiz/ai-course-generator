import React from 'react'
import { QuestionResult } from './QuestionResult'
import { ScrollArea } from '@/components/ui/scroll-area'

interface QuizResultsSummaryProps {
  questions: Array<{
    id: string
    question: string
    userAnswer: string
    correctAnswer: string
    isCorrect: boolean
    timeSpent: number
  }>
}

export function QuizResultsSummary({ questions }: QuizResultsSummaryProps) {
  const [expandedQuestionId, setExpandedQuestionId] = React.useState<string | null>(null)

  const correctAnswers = questions.filter(q => q.isCorrect).length
  const totalQuestions = questions.length
  const score = Math.round((correctAnswers / totalQuestions) * 100)

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6">
      {/* Score Summary */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-2">Quiz Results</h2>
        <div className="text-lg">
          Score: <span className="font-bold">{score}%</span> ({correctAnswers} out of {totalQuestions} correct)
        </div>
      </div>

      {/* Questions List */}
      <ScrollArea className="h-[calc(100vh-300px)] pr-4">
        <div className="space-y-4">
          {questions.map((question, index) => (
            <QuestionResult
              key={question.id}
              questionIndex={index}
              question={question.question}
              userAnswer={question.userAnswer}
              correctAnswer={question.correctAnswer}
              isCorrect={question.isCorrect}
              timeSpent={question.timeSpent}
              expanded={expandedQuestionId === question.id}
              onToggleExpand={() => setExpandedQuestionId(
                expandedQuestionId === question.id ? null : question.id
              )}
            />
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}
