"use client"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { CheckCircle, XCircle, Clock, AlertCircle, BarChart3 } from "lucide-react"
import type { UserQuizAttempt } from "@/app/types/types"

interface QuestionListProps {
  questions: UserQuizAttempt["attemptQuestions"]
  attempt: UserQuizAttempt
  type: string
}
interface QuizResultsDialogProps {
  attempt: UserQuizAttempt
  open: boolean
  onClose: () => void
}

export default function QuizResultsDialog({ attempt, open, onClose }: QuizResultsDialogProps) {
  // Group questions by type for better organization
  const mcqQuestions = attempt.attemptQuestions.filter((q) => attempt.userQuiz?.quizType === "mcq")

  const openEndedQuestions = attempt.attemptQuestions.filter((q) => attempt.userQuiz?.quizType === "openended")

  const fillBlanksQuestions = attempt.attemptQuestions.filter((q) => attempt.userQuiz?.quizType === "fill-blanks")

  const codeQuestions = attempt.attemptQuestions.filter((q) => attempt.userQuiz?.quizType === "code")

  // Default to showing all questions if type is unknown
  const allQuestions = attempt.attemptQuestions

  // Determine which tab to show based on quiz type
  const defaultTab = attempt.userQuiz?.quizType || "all"

  return (
    <>
      <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-xl">Quiz Results: {attempt.userQuiz?.title}</DialogTitle>
            <DialogDescription>Completed on {new Date(attempt.createdAt).toLocaleString()}</DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 my-4">
            <div className="bg-muted/50 rounded-lg p-3 flex items-center gap-3">
              <div className="p-2 rounded-full bg-primary/10">
                <BarChart3 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Score</p>
                <p className="text-xl font-bold">{attempt.score || 0}%</p>
              </div>
            </div>

            <div className="bg-muted/50 rounded-lg p-3 flex items-center gap-3">
              <div className="p-2 rounded-full bg-primary/10">
                <CheckCircle className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Accuracy</p>
                <p className="text-xl font-bold">{attempt.accuracy || 0}%</p>
              </div>
            </div>

            <div className="bg-muted/50 rounded-lg p-3 flex items-center gap-3">
              <div className="p-2 rounded-full bg-primary/10">
                <Clock className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Time Spent</p>
                <p className="text-xl font-bold">{attempt.timeSpent}s</p>
              </div>
            </div>
          </div>

          <Tabs defaultValue={defaultTab} className="flex-1 flex flex-col overflow-hidden">
            <TabsList className="mb-4">
              {mcqQuestions.length > 0 && <TabsTrigger value="mcq">Multiple Choice</TabsTrigger>}
              {openEndedQuestions.length > 0 && <TabsTrigger value="openended">Open Ended</TabsTrigger>}
              {fillBlanksQuestions.length > 0 && <TabsTrigger value="fill-blanks">Fill in Blanks</TabsTrigger>}
              {codeQuestions.length > 0 && <TabsTrigger value="code">Code</TabsTrigger>}
              {mcqQuestions.length === 0 &&
                openEndedQuestions.length === 0 &&
                fillBlanksQuestions.length === 0 &&
                codeQuestions.length === 0 && <TabsTrigger value="all">All Questions</TabsTrigger>}
            </TabsList>

            <ScrollArea className="flex-1 w-full max-h-[60vh] overflow-auto">
              <div className="space-y-6 p-1">
                {mcqQuestions.length > 0 && (
                  <TabsContent value="mcq" className="mt-0">
                    <QuestionList questions={mcqQuestions} attempt={attempt} type="mcq" />
                  </TabsContent>
                )}

                {openEndedQuestions.length > 0 && (
                  <TabsContent value="openended" className="mt-0">
                    <QuestionList questions={openEndedQuestions} attempt={attempt} type="openended" />
                  </TabsContent>
                )}

                {fillBlanksQuestions.length > 0 && (
                  <TabsContent value="fill-blanks" className="mt-0">
                    <QuestionList questions={fillBlanksQuestions} attempt={attempt} type="fill-blanks" />
                  </TabsContent>
                )}

                {codeQuestions.length > 0 && (
                  <TabsContent value="code" className="mt-0">
                    <QuestionList questions={codeQuestions} attempt={attempt} type="code" />
                  </TabsContent>
                )}

                {mcqQuestions.length === 0 &&
                  openEndedQuestions.length === 0 &&
                  fillBlanksQuestions.length === 0 &&
                  codeQuestions.length === 0 && (
                    <TabsContent value="all" className="mt-0">
                      <QuestionList questions={allQuestions} attempt={attempt} type="all" />
                    </TabsContent>
                  )}
              </div>
            </ScrollArea>
          </Tabs>

          <DialogFooter className="mt-4">
            <Button onClick={onClose}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

function QuestionList({ questions, attempt, type }: QuestionListProps) {
  if (questions.length === 0) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="mx-auto h-10 w-10 text-muted-foreground/50" />
        <h3 className="mt-2 font-medium">No questions found</h3>
        <p className="text-sm text-muted-foreground mt-1">There are no questions of this type in this quiz attempt.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-4">
      {questions.map((question, index) => {
        const questionData = attempt.userQuiz.questions.find((q) => q.id === question.questionId)
        const isCorrect =
          question.isCorrect || questionData?.answer?.toLowerCase().trim() === question.userAnswer?.toLowerCase().trim()

        return (
          <div
            key={question.id}
            className={`p-4 rounded-lg border ${
              isCorrect
                ? "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-900"
                : "bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-900"
            }`}
          >
            <div className="flex items-center gap-2 mb-3">
              <div
                className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium ${
                  isCorrect
                    ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
                    : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100"
                }`}
              >
                {index + 1}
              </div>
              {isCorrect ? (
                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
              )}
              <Badge variant="outline" className="ml-auto">
                <Clock className="mr-1 h-3 w-3" />
                {question.timeSpent}s
              </Badge>
            </div>

            <div className="space-y-3">
              <div>
                <h4 className="font-medium mb-1">Question:</h4>
                <p className="p-2 bg-background rounded">{questionData?.question || "Question not available"}</p>
              </div>

              <div>
                <h4 className="font-medium mb-1">Your Answer:</h4>
                <p className="p-2 bg-background rounded">{question.userAnswer || "No answer provided"}</p>
              </div>

              <div>
                <h4 className="font-medium mb-1">Correct Answer:</h4>
                <p className="p-2 bg-background rounded">{questionData?.answer || "Not available"}</p>
              </div>

              {type === "openended" && questionData && (
                <div>
                  <h4 className="font-medium mb-1">Hints:</h4>
                  <div className="p-2 bg-background rounded">
                    <ul className="list-disc list-inside">
                      {questionData.openEndedQuestion?.hints?.map((hint: string, i: number) => (
                        <li key={i}>{hint}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
