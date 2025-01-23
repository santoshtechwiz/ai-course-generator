"use client"

import React, { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { CheckCircle2, XCircle, Clock, TrendingUp, Award, Book, BarChart, HelpCircle } from "lucide-react"
import { UserQuizAttempt } from "@/app/types"


interface QuizAttemptsProps {
  quizAttempts: UserQuizAttempt[]
}

export function QuizAttempts({ quizAttempts }: QuizAttemptsProps) {
  const [selectedQuestion, setSelectedQuestion] = useState<UserQuizAttempt["attemptQuestions"][0] | null>(null)

  if (!quizAttempts || quizAttempts.length === 0) {
    return (
      <Card className="w-full max-w-3xl mx-auto">
        <CardContent className="py-6 text-center text-muted-foreground">No quiz attempts available.</CardContent>
      </Card>
    )
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      <Card className="w-full max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl font-bold flex items-center">
            <Award className="w-6 h-6 mr-2 text-yellow-500" />
            Recent Quiz Attempts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            {quizAttempts.map((attempt, index) => (
              <AccordionItem key={attempt.id} value={`item-${index}`}>
                <AccordionTrigger>
                  <div className="flex justify-between items-center w-full">
                    <h4 className="text-lg font-semibold flex items-center">
                      <Book className="w-5 h-5 mr-2 text-blue-500" />
                      {attempt.userQuiz?.topic || `Quiz ${index + 1}`}
                    </h4>
                    <motion.div className="flex items-center" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <span
                        className={`text-sm font-medium px-2 py-1 rounded flex items-center ${
                          (attempt.score ?? 0) >= 80
                            ? "bg-green-100 text-green-800"
                            : (attempt.score ?? 0) >= 60
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-red-100 text-red-800"
                        }`}
                      >
                        <BarChart className="w-4 h-4 mr-1" />
                        Score: {attempt.score}%
                      </span>
                    </motion.div>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm mb-3">
                    <div className="flex items-center">
                      <CheckCircle2 className="w-4 h-4 mr-2 text-green-500" />
                      <span>Accuracy: {(attempt.accuracy || 0).toFixed(2)}%</span>
                    </div>
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 mr-2 text-blue-500" />
                      <span>Time: {attempt.timeSpent} seconds</span>
                    </div>
                    <div className="flex items-center">
                      <TrendingUp className="w-4 h-4 mr-2 text-purple-500" />
                      <span>Improvement: {attempt.improvement ? `${attempt.improvement.toFixed(2)}%` : "N/A"}</span>
                    </div>
                  </div>
                  <ul className="space-y-2">
                    {attempt.attemptQuestions.map((question, qIndex) => (
                      <li key={question.id} className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                        <span className="text-sm flex items-center">
                          <HelpCircle className="w-4 h-4 mr-2 text-blue-500" />
                          <span className="font-semibold mr-2">Q{qIndex + 1}:</span>
                          <span className="truncate flex-grow mr-2">{question.questionId}</span>
                        </span>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" onClick={() => setSelectedQuestion(question)}>
                              View Details
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-md">
                            <DialogHeader>
                              <DialogTitle>Question {qIndex + 1} Details</DialogTitle>
                            </DialogHeader>
                            <div className="mt-4">
                              <p className="font-medium mb-2">{question.questionId}</p>
                              <div className="grid grid-cols-1 gap-2">
                                <div className="bg-blue-50 p-2 rounded">
                                  <p className="font-semibold text-blue-700">Your Answer:</p>
                                  <p>{question.userAnswer}</p>
                                </div>
                                <div className="bg-green-50 p-2 rounded">
                                  <p className="font-semibold text-green-700">Correct Answer:</p>
                                  <p>
                                    {attempt.userQuiz.questions.find((q) => q.id === question.questionId)?.answer ||
                                      "Not available"}
                                  </p>
                                </div>
                                <p className="flex items-center">
                                  {question.isCorrect ? (
                                    <CheckCircle2 className="w-4 h-4 mr-1 text-green-500" />
                                  ) : (
                                    <XCircle className="w-4 h-4 mr-1 text-red-500" />
                                  )}
                                  {question.isCorrect ? "Correct" : "Incorrect"}
                                </p>
                                <p className="flex items-center">
                                  <Clock className="w-4 h-4 mr-1 text-blue-500" />
                                  Time Spent: {question.timeSpent}s
                                </p>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </li>
                    ))}
                  </ul>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>
    </motion.div>
  )
}

