"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { CheckCircle2, XCircle, Clock, TrendingUp, Award, Book, BarChart } from "lucide-react"
import type { UserQuizAttempt } from "@/app/types/types"

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Badge } from "@/components/ui/badge"

interface QuizAttemptsProps {
  quizAttempts: UserQuizAttempt[]
}

export function QuizAttempts({ quizAttempts }: QuizAttemptsProps) {
  console.log(quizAttempts)
  const [selectedQuestion, setSelectedQuestion] = useState<UserQuizAttempt["attemptQuestions"][0] | null>(null)

  if (!quizAttempts || quizAttempts.length === 0) {
    return (
      <Card className="w-full bg-card">
        <CardContent className="py-6 text-center">
          <Award className="mx-auto h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-4 text-lg font-semibold">No attempts yet</h3>
          <p className="mt-2 text-sm text-muted-foreground">Take your first quiz to see your progress here.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <Card className="w-full overflow-hidden bg-card">
        <CardHeader className="border-b border-border bg-muted">
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Award className="h-5 w-5" />
            Recent Quiz Attempts
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Accordion type="single" collapsible className="w-full">
            {quizAttempts.map((attempt, index) => (
              <AccordionItem key={attempt.id} value={`item-${index}`}>
                <AccordionTrigger className="px-4 py-2 hover:bg-muted/50">
                  <div className="flex justify-between items-center w-full">
                    <h4 className="text-lg font-semibold flex items-center text-foreground">
                      <Book className="w-5 h-5 mr-2 text-primary" />
                      {attempt.userQuiz?.topic || `Quiz ${index + 1}`}
                    </h4>
                    <motion.div className="flex items-center" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Badge
                        variant={(attempt.score ?? 0) >= 80 ? "success" : (attempt.score ?? 0) >= 60 ? "warning" : "destructive"}
                      >
                        <BarChart className="w-4 h-4 mr-1" />
                        {attempt.score}%
                      </Badge>
                    </motion.div>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="px-4 py-2 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="bg-muted p-3 rounded-lg">
                        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                          <CheckCircle2 className="w-4 h-4 text-primary" />
                          Accuracy
                        </div>
                        <p className="text-2xl font-bold mt-1 text-foreground">{(attempt.accuracy || 0).toFixed(1)}%</p>
                      </div>
                      <div className="bg-muted p-3 rounded-lg">
                        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                          <Clock className="w-4 h-4 text-primary" />
                          Time Spent
                        </div>
                        <p className="text-2xl font-bold mt-1 text-foreground">{attempt.timeSpent}s</p>
                      </div>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="bg-muted p-3 rounded-lg cursor-help">
                              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                                <TrendingUp className="w-4 h-4 text-primary" />
                                Improvement
                              </div>
                              <p className="text-2xl font-bold mt-1 text-foreground">
                                {attempt.improvement ? `+${attempt.improvement.toFixed(1)}%` : "N/A"}
                              </p>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Improvement from your last attempt</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <div className="space-y-2">
                      {attempt.attemptQuestions.map((question, qIndex) => {
                        const correctAnswer = attempt.userQuiz.questions.find(
                          (q) => q.id === question.questionId,
                        )?.answer
                        const isCorrect =
                          question.userAnswer?.toLowerCase().trim() === correctAnswer?.toLowerCase().trim()
                        return (
                          <motion.div
                            key={question.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: qIndex * 0.1 }}
                            className={`p-3 rounded-lg ${isCorrect ? "bg-green-500/20 dark:bg-green-950/50" : "bg-red-500/20 dark:bg-red-950/50"}`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-foreground">Q{qIndex + 1}</span>
                                {isCorrect ? (
                                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                                ) : (
                                  <XCircle className="w-4 h-4 text-red-500" />
                                )}
                              </div>
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button variant="secondary" size="sm" onClick={() => setSelectedQuestion(question)}>
                                    View Details
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-md">
                                  <DialogHeader>
                                    <DialogTitle>Question Details</DialogTitle>
                                  </DialogHeader>
                                  <div className="mt-4 space-y-4">
                                    <div className="space-y-2">
                                      <p className="font-medium text-foreground">Your Answer:</p>
                                      <div className="p-3 rounded-lg bg-muted text-foreground">
                                        {question.userAnswer}
                                      </div>
                                    </div>
                                    <div className="space-y-2">
                                      <p className="font-medium text-foreground">Correct Answer:</p>
                                      <div className="p-3 rounded-lg bg-muted text-foreground">
                                        {correctAnswer || "Not available"}
                                      </div>
                                    </div>
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-2">
                                        <Clock className="w-4 h-4 text-muted-foreground" />
                                        <span className="text-sm text-muted-foreground">
                                          Time spent: {question.timeSpent}s
                                        </span>
                                      </div>
                                      {isCorrect ? (
                                        <Badge variant="success">
                                          <CheckCircle2 className="w-4 h-4 mr-1" />
                                          Correct
                                        </Badge>
                                      ) : (
                                        <Badge variant="destructive">
                                          <XCircle className="w-4 h-4 mr-1" />
                                          Incorrect
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                </DialogContent>
                              </Dialog>
                            </div>
                          </motion.div>
                        )
                      })}
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>
    </motion.div>
  )
}

