"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { CheckCircle2, XCircle, Clock, TrendingUp, Award, Book, BarChart, HelpCircle } from "lucide-react"
import type { UserQuizAttempt } from "@/app/types"
import { Progress } from "@/components/ui/progress"

interface QuizAttemptsProps {
  quizAttempts: UserQuizAttempt[]
}

export function QuizAttempts({ quizAttempts }: QuizAttemptsProps) {
  const [selectedQuestion, setSelectedQuestion] = useState<UserQuizAttempt["attemptQuestions"][0] | null>(null)

  if (!quizAttempts || quizAttempts.length === 0) {
    return (
      <Card className="w-full">
        <CardContent className="py-6 text-center text-muted-foreground">
          <Award className="mx-auto h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-4 text-lg font-semibold">No attempts yet</h3>
          <p className="mt-2 text-sm">Take your first quiz to see your progress here.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <Card className="w-full overflow-hidden">
        <CardHeader className="border-b bg-muted/50">
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5 text-primary" />
            Recent Quiz Attempts
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Accordion type="single" collapsible className="w-full">
            {quizAttempts.map((attempt, index) => (
              <AccordionItem key={attempt.id} value={`item-${index}`}>
                <AccordionTrigger className="px-4 py-2 hover:bg-muted/50">
                  <div className="flex justify-between items-center w-full">
                    <h4 className="text-lg font-semibold flex items-center">
                      <Book className="w-5 h-5 mr-2 text-primary" />
                      {attempt.userQuiz?.topic || `Quiz ${index + 1}`}
                    </h4>
                    <motion.div className="flex items-center" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <span
                        className={`text-sm font-medium px-3 py-1 rounded-full flex items-center gap-2 ${
                          (attempt.score ?? 0) >= 80
                            ? "bg-green-100 text-green-800"
                            : (attempt.score ?? 0) >= 60
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-red-100 text-red-800"
                        }`}
                      >
                        <BarChart className="w-4 h-4" />
                        {attempt.score}%
                      </span>
                    </motion.div>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="px-4 py-2 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="bg-muted/50 p-3 rounded-lg">
                        <div className="flex items-center gap-2 text-sm font-medium">
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                          Accuracy
                        </div>
                        <p className="text-2xl font-bold mt-1">{(attempt.accuracy || 0).toFixed(1)}%</p>
                      </div>
                      <div className="bg-muted/50 p-3 rounded-lg">
                        <div className="flex items-center gap-2 text-sm font-medium">
                          <Clock className="w-4 h-4 text-blue-500" />
                          Time Spent
                        </div>
                        <p className="text-2xl font-bold mt-1">{attempt.timeSpent}s</p>
                      </div>
                      <div className="bg-muted/50 p-3 rounded-lg">
                        <div className="flex items-center gap-2 text-sm font-medium">
                          <TrendingUp className="w-4 h-4 text-primary" />
                          Improvement
                        </div>
                        <p className="text-2xl font-bold mt-1">
                          {attempt.improvement ? `+${attempt.improvement.toFixed(1)}%` : "N/A"}
                        </p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {attempt.attemptQuestions.map((question, qIndex) => (
                        <motion.div
                          key={question.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: qIndex * 0.1 }}
                          className={`p-3 rounded-lg ${question.isCorrect ? "bg-green-50" : "bg-red-50"}`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">Q{qIndex + 1}</span>
                              {question.isCorrect ? (
                                <CheckCircle2 className="w-4 h-4 text-green-500" />
                              ) : (
                                <XCircle className="w-4 h-4 text-red-500" />
                              )}
                            </div>
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="ghost" size="sm" onClick={() => setSelectedQuestion(question)}>
                                  View Details
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-md">
                                <DialogHeader>
                                  <DialogTitle>Question Details</DialogTitle>
                                </DialogHeader>
                                <div className="mt-4 space-y-4">
                                  <div className="space-y-2">
                                    <p className="font-medium">Your Answer:</p>
                                    <div className="p-3 rounded-lg bg-muted">{question.userAnswer}</div>
                                  </div>
                                  <div className="space-y-2">
                                    <p className="font-medium">Correct Answer:</p>
                                    <div className="p-3 rounded-lg bg-muted">
                                      {attempt.userQuiz.questions.find((q) => q.id === question.questionId)?.answer ||
                                        "Not available"}
                                    </div>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <Clock className="w-4 h-4 text-muted-foreground" />
                                      <span className="text-sm">Time spent: {question.timeSpent}s</span>
                                    </div>
                                    {question.isCorrect ? (
                                      <span className="text-green-600 flex items-center gap-1">
                                        <CheckCircle2 className="w-4 h-4" />
                                        Correct
                                      </span>
                                    ) : (
                                      <span className="text-red-600 flex items-center gap-1">
                                        <XCircle className="w-4 h-4" />
                                        Incorrect
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>
                          </div>
                        </motion.div>
                      ))}
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

