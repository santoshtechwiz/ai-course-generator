import React from 'react'
import { QuestionResult } from './QuestionResult'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { ChevronDown, ChevronUp } from 'lucide-react'

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
  // Initialize with incorrect answers expanded by default
  const [expandedQuestionIds, setExpandedQuestionIds] = React.useState<Set<string>>(
    () => new Set(questions.filter(q => !q.isCorrect).map(q => q.id))
  )

  const correctAnswers = questions.filter(q => q.isCorrect).length
  const totalQuestions = questions.length
  const score = Math.round((correctAnswers / totalQuestions) * 100)

  const toggleQuestion = (id: string) => {
    setExpandedQuestionIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      console.log('Expanded questions:', Array.from(next))
      return next
    })
  }

  const expandAll = () => {
    setExpandedQuestionIds(new Set(questions.map(q => q.id)))
  }

  const collapseAll = () => {
    setExpandedQuestionIds(new Set())
  }

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6">
      {/* Score Summary */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-2">Quiz Results</h2>
        <div className="text-lg mb-4">
          Score: <span className="font-bold">{score}%</span> ({correctAnswers} out of {totalQuestions} correct)
        </div>
        
        {/* Expand/Collapse Controls */}
        <div className="flex justify-center gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={expandAll}
            className="flex items-center gap-1"
          >
            <ChevronDown className="h-4 w-4" />
            Expand All
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={collapseAll}
            className="flex items-center gap-1"
          >
            <ChevronUp className="h-4 w-4" />
            Collapse All
          </Button>
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
              expanded={expandedQuestionIds.has(question.id)}
              onToggleExpand={() => toggleQuestion(question.id)}
            />
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}
