import React from 'react'
import { CheckCircle2, XCircle, Clock, ChevronDown, ChevronUp } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface QuestionResultProps {
  questionIndex: number
  question: string
  userAnswer: string
  correctAnswer: string
  isCorrect: boolean
  timeSpent?: number
  expanded: boolean
  onToggleExpand: () => void
}

export function QuestionResult({
  questionIndex,
  question,
  userAnswer,
  correctAnswer,
  isCorrect,
  timeSpent,
  expanded,
  onToggleExpand
}: QuestionResultProps) {
  const formatTime = (seconds?: number) => {
    if (!seconds || seconds < 0) return "0.00s"
    if (seconds < 60) {
      return `${seconds.toFixed(2)}s`
    }
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toFixed(2).padStart(5, "0")}`
  }

  return (
    <Card className={cn(
      "transition-all duration-200",
      expanded ? "ring-2 ring-primary/20" : "hover:shadow-md"
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {isCorrect ? (
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            ) : (
              <XCircle className="h-5 w-5 text-red-600" />
            )}
            <CardTitle className="text-base font-medium">
              Question {questionIndex + 1}
            </CardTitle>
          </div>
          <div className="flex items-center gap-2">
            {timeSpent && (
              <Badge variant="outline" className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatTime(timeSpent)}
              </Badge>
            )}
            <Badge variant={isCorrect ? "default" : "destructive"}>
              {isCorrect ? "Correct" : "Incorrect"}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleExpand}
              className="h-8 w-8 p-0"
            >
              {expanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </CardHeader>

      {expanded && (
        <CardContent className="pt-0">
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Question:</h4>
              <p className="text-sm text-muted-foreground">{question}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium mb-2 text-red-600">Your Answer:</h4>
                <p className="text-sm text-muted-foreground">{userAnswer || "No answer"}</p>
              </div>

              <div>
                <h4 className="font-medium mb-2 text-green-600">Correct Answer:</h4>
                <p className="text-sm text-muted-foreground">{correctAnswer}</p>
              </div>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  )
}