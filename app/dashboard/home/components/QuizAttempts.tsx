"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { CheckCircle2, XCircle, Clock, TrendingUp, Award, Book, BarChart, Info } from "lucide-react"
import type { UserQuizAttempt } from "@/app/types/types"

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useMediaQuery } from "@/hooks"


interface QuizAttemptsProps {
  quizAttempts: UserQuizAttempt[]
}

export function QuizAttempts({ quizAttempts }: QuizAttemptsProps) {
  const [selectedQuestion, setSelectedQuestion] = useState<UserQuizAttempt["attemptQuestions"][0] | null>(null)
  const [selectedAttempt, setSelectedAttempt] = useState<string>("")
  const isMobile = useMediaQuery("(max-width: 640px)")

  // Helper function to calculate score with fallback
  const calculateScore = (attempt: UserQuizAttempt): number => {
    // If score is already calculated and valid, use it
    if (attempt.score != null && attempt.score >= 0) {
      return attempt.score
    }
    
    // Fallback: calculate from attempt questions
    const questions = attempt.attemptQuestions || []
    const totalQuestions = questions.length
    const correctAnswers = questions.filter(q => q.isCorrect).length
    
    if (totalQuestions === 0) return 0
    
    return Math.round((correctAnswers / totalQuestions) * 100)
  }

  // Helper function to calculate accuracy with fallback
  const calculateAccuracy = (attempt: UserQuizAttempt): number => {
    // If accuracy is already calculated and valid, use it  
    if (attempt.accuracy != null && attempt.accuracy >= 0) {
      return attempt.accuracy
    }
    
    // Fallback: accuracy is the same as score for most cases
    return calculateScore(attempt)
  }

  if (!quizAttempts || quizAttempts.length === 0) {
    return (
      <Card className="w-full bg-card">
        <CardContent className="flex flex-col items-center justify-center py-12 px-4">
          <div className="rounded-full bg-primary/10 p-4 mb-4">
            <Award className="h-10 w-10 text-primary" />
          </div>
          <h3 className="text-xl font-semibold text-center">No quiz attempts yet</h3>
          <p className="mt-2 text-sm text-muted-foreground text-center max-w-md">
            Take your first quiz to track your progress and see your performance statistics here.
          </p>
          <Button className="mt-6" variant="outline">
            Browse Quizzes
          </Button>
        </CardContent>
      </Card>
    )
  }

  const getScoreVariant = (score: number): "success" | "destructive" | "secondary" => {
    if (score >= 80) return "success"
    if (score >= 60) return "secondary" // Changed from "warning" to "secondary"
    return "destructive"
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-500 dark:text-green-400"
    if (score >= 60) return "text-amber-500 dark:text-amber-400"
    return "text-red-500 dark:text-red-400"
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="w-full"
    >
      <Card className="w-full overflow-hidden bg-card border border-border">
        <CardHeader className="border-b border-border bg-muted/50 px-4 py-3 sm:px-6">
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl text-foreground">
            <Award className="h-5 w-5 text-primary" />
            Recent Quiz Attempts
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Accordion
            type="single"
            collapsible
            className="w-full"
            value={selectedAttempt}
            onValueChange={setSelectedAttempt}
          >
            {quizAttempts.map((attempt, index) => {
              const displayScore = calculateScore(attempt)
              const displayAccuracy = calculateAccuracy(attempt)
              
              return (
              <AccordionItem key={attempt.id} value={`item-${index}`} className="border-b last:border-0 border-border">
                <AccordionTrigger className="px-4 py-3 sm:px-6 hover:bg-muted/50 transition-colors">
                  <div className="flex justify-between items-center w-full gap-2">
                    <div className="flex items-center text-left">
                      <div className="bg-primary/10 rounded-full p-1 sm:p-1.5 mr-2 sm:mr-3 flex">
                        <Book className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <h4 className="text-base font-medium text-foreground line-clamp-1">
                          {attempt.userQuiz?.title || `Quiz ${index + 1}`}
                        </h4>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {new Date(attempt.createdAt || Date.now()).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <motion.div className="flex items-center" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Badge variant={getScoreVariant(displayScore)} className="text-xs px-2 py-1">
                        <BarChart className="w-3 h-3 mr-1" />
                        {displayScore}%
                      </Badge>
                    </motion.div>
                  </div>
                </AccordionTrigger>
                <AnimatePresence>
                  {selectedAttempt === `item-${index}` && (
                    <AccordionContent forceMount>
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="px-4 py-4 sm:px-6 space-y-4"
                      >
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <Card className="bg-muted/50 border-border overflow-hidden">
                            <CardContent className="p-3">
                              <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground mb-1">
                                <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                                Accuracy
                              </div>
                              <p className="text-xl font-bold text-foreground">{displayAccuracy.toFixed(1)}%</p>
                            </CardContent>
                          </Card>
                          <Card className="bg-muted/50 border-border overflow-hidden">
                            <CardContent className="p-3">
                              <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground mb-1">
                                <Clock className="w-3.5 h-3.5 text-primary" />
                                Time Spent
                              </div>
                              <p className="text-xl font-bold text-foreground">{attempt.timeSpent}s</p>
                            </CardContent>
                          </Card>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Card className="bg-muted/50 border-border overflow-hidden cursor-help">
                                  <CardContent className="p-3">
                                    <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground mb-1">
                                      <TrendingUp className="w-3.5 h-3.5 text-primary" />
                                      Improvement
                                      <Info className="w-3 h-3 text-muted-foreground" />
                                    </div>
                                    <p className="text-xl font-bold text-foreground">
                                      {attempt.improvement ? `+${attempt.improvement.toFixed(1)}%` : "N/A"}
                                    </p>
                                  </CardContent>
                                </Card>
                              </TooltipTrigger>
                              <TooltipContent side="top">
                                <p className="text-xs">Improvement from your last attempt</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>

                        <div className="space-y-2.5">
                          <h5 className="text-sm font-medium text-foreground flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4 text-primary" />
                            Question Results
                          </h5>
                          <ScrollArea className="max-h-[300px] pr-4 -mr-4">
                            <div className="space-y-2">
                              {attempt.attemptQuestions.map((question, qIndex) => {
                                const correctAnswer = attempt.userQuiz.questions?.find(
                                  (q) => q.id === question.questionId,
                                )?.answer || null
                                const isCorrect =
                                  question.userAnswer?.toLowerCase().trim() === correctAnswer?.toLowerCase().trim()
                                return (
                                  <motion.div
                                    key={question.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: qIndex * 0.05 }}
                                    className={`p-3 rounded-lg border ${
                                      isCorrect
                                        ? "bg-green-500/10 dark:bg-green-950/30 border-green-200 dark:border-green-900"
                                        : "bg-red-500/10 dark:bg-red-950/30 border-red-200 dark:border-red-900"
                                    }`}
                                  >
                                    <div className="flex items-center justify-between flex-wrap gap-2">
                                      <div className="flex items-center gap-2">
                                        <div
                                          className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium ${
                                            isCorrect
                                              ? "bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300"
                                              : "bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300"
                                          }`}
                                        >
                                          {qIndex + 1}
                                        </div>
                                        {isCorrect ? (
                                          <CheckCircle2 className="w-4 h-4 text-green-500 dark:text-green-400" />
                                        ) : (
                                          <XCircle className="w-4 h-4 text-red-500 dark:text-red-400" />
                                        )}
                                        <span className="text-sm font-medium text-foreground line-clamp-1 max-w-[150px] sm:max-w-[250px]">
                                          {attempt.userQuiz.questions?.find((q) => q.id === question.questionId)?.text ||
                                            `Question ${qIndex + 1}`}
                                        </span>
                                      </div>
                                      <Dialog>
                                        <DialogTrigger asChild>
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            className="h-8 text-xs"
                                            onClick={() => setSelectedQuestion(question)}
                                          >
                                            View Details
                                          </Button>
                                        </DialogTrigger>
                                        <DialogContent className="sm:max-w-md">
                                          <DialogHeader>
                                            <DialogTitle>Question Details</DialogTitle>
                                          </DialogHeader>
                                          <Separator />
                                          <ScrollArea className="max-h-[60vh] mt-4 -mr-4 pr-4">
                                            <div className="space-y-4">
                                              <div>
                                                <h3 className="font-medium text-foreground mb-2">Question:</h3>
                                                <div className="p-3 rounded-lg bg-muted text-foreground text-sm">
                                                  {attempt.userQuiz.questions?.find((q) => q.id === question.questionId)
                                                    ?.question || "Question not available"}
                                                </div>
                                              </div>
                                              <div className="space-y-2">
                                                <h3 className="font-medium text-foreground">Your Answer:</h3>
                                                <div className="p-3 rounded-lg bg-muted text-foreground text-sm">
                                                  {question.userAnswer || "No answer provided"}
                                                </div>
                                              </div>
                                              <div className="space-y-2">
                                                <h3 className="font-medium text-foreground">Correct Answer:</h3>
                                                <div className="p-3 rounded-lg bg-muted text-foreground text-sm">
                                                  {correctAnswer || "Not available"}
                                                </div>
                                              </div>
                                              <div className="flex items-center justify-between flex-wrap gap-2 pt-2">
                                                <div className="flex items-center gap-2">
                                                  <Clock className="w-4 h-4 text-muted-foreground" />
                                                  <span className="text-sm text-muted-foreground">
                                                    Time spent: {question.timeSpent}s
                                                  </span>
                                                </div>
                                                {isCorrect ? (
                                                  <Badge variant="default" className="px-2 py-1">
                                                    <CheckCircle2 className="w-3 h-3 mr-1" />
                                                    Correct
                                                  </Badge>
                                                ) : (
                                                  <Badge variant="destructive" className="px-2 py-1">
                                                    <XCircle className="w-3 h-3 mr-1" />
                                                    Incorrect
                                                  </Badge>
                                                )}
                                              </div>
                                            </div>
                                          </ScrollArea>
                                        </DialogContent>
                                      </Dialog>
                                    </div>
                                  </motion.div>
                                )
                              })}
                            </div>
                          </ScrollArea>
                        </div>
                      </motion.div>
                    </AccordionContent>
                  )}
                </AnimatePresence>
              </AccordionItem>
            )})}
          </Accordion>
        </CardContent>
      </Card>
    </motion.div>
  )
}
