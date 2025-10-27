'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, XCircle, ArrowUpDown, Trophy, RotateCcw } from 'lucide-react'
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion'

interface OrderingQuizResultsProps {
  result: any
  onRetake: () => void
  isAuthenticated: boolean
  slug: string
}

export default function OrderingQuizResults({
  result,
  onRetake,
  isAuthenticated,
  slug,
}: OrderingQuizResultsProps) {
  // Parse result data
  const results = result?.results || []
  const totalQuestions = results.length || 0
  const correctAnswers = results.filter((r: any) => r?.isCorrect).length || 0
  const percentage = result?.percentage || result?.score || 0
  const timeSpent = result?.timeSpent || result?.totalTime || 0

  // Performance level
  const getPerformanceLevel = (pct: number) => {
    if (pct >= 90) return { level: 'excellent', color: 'text-[var(--color-success)]', bg: 'bg-[var(--color-success)]', border: 'border-[var(--color-success)]' }
    if (pct >= 75) return { level: 'good', color: 'text-[var(--color-primary)]', bg: 'bg-[var(--color-primary)]', border: 'border-[var(--color-primary)]' }
    if (pct >= 60) return { level: 'average', color: 'text-[var(--color-warning)]', bg: 'bg-[var(--color-warning)]', border: 'border-[var(--color-warning)]' }
    return { level: 'needs-improvement', color: 'text-[var(--color-error)]', bg: 'bg-[var(--color-error)]', border: 'border-[var(--color-error)]' }
  }

  const performance = getPerformanceLevel(percentage)

  // Helper to get step text from ID
  const getStepText = (question: any, stepId: number | string): string => {
    const steps = question?.steps || []
    const step = steps.find((s: any) => s.id === stepId)
    return step?.description || `Step ${stepId}`
  }

  // Helper to format order as text
  const formatOrder = (question: any, orderArray: any[]): string => {
    if (!Array.isArray(orderArray) || orderArray.length === 0) return 'No answer provided'
    return orderArray.map((id, idx) => `${idx + 1}. ${getStepText(question, id)}`).join('\n')
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 p-4">
      {/* Header Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className={`border-2 ${performance.border} ${performance.bg}`}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-full ${performance.bg} ${performance.color}`}>
                  <Trophy className="h-6 w-6" />
                </div>
                <div>
                  <CardTitle className="text-2xl font-bold">Quiz Complete!</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    Ordering Quiz Results
                  </p>
                </div>
              </div>
              <div className={`${performance.color} ${performance.bg} border-2 rounded-none text-lg px-4 py-2 font-semibold`}>
                {percentage}%
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{correctAnswers}/{totalQuestions}</div>
                <div className="text-sm text-muted-foreground">Correct</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{totalQuestions - correctAnswers}</div>
                <div className="text-sm text-muted-foreground">Incorrect</div>
              </div>
              {timeSpent > 0 && (
                <div className="text-center">
                  <div className="text-2xl font-bold">{Math.round(timeSpent / 60)}m</div>
                  <div className="text-sm text-muted-foreground">Time Spent</div>
                </div>
              )}
            </div>
            <div className="mt-6 flex gap-3">
              <Button onClick={onRetake} className="flex-1" variant="default">
                <RotateCcw className="h-4 w-4 mr-2" />
                Retake Quiz
              </Button>
              <Button onClick={() => window.location.href = '/dashboard/quizzes'} variant="neutral" className="flex-1">
                Browse Quizzes
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Question Details */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowUpDown className="h-5 w-5" />
              Question Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              {results.map((q: any, idx: number) => {
                const isCorrect = q?.isCorrect || false
                const userOrder = q?.userAnswer || q?.answer || []
                const correctOrder = q?.correctAnswer || []
                const question = q?.question || {}

                return (
                  <AccordionItem value={`q-${idx}`} key={idx}>
                    <AccordionTrigger className="w-full flex items-center justify-between px-3 py-3 hover:no-underline">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                          isCorrect 
                            ? 'bg-green-100 text-green-600 ring-2 ring-green-200' 
                            : 'bg-red-100 text-red-600 ring-2 ring-red-200'
                        }`}>
                          {isCorrect ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                        </div>
                        <div className="text-sm font-medium text-left truncate">
                          Q{idx + 1}: {question?.title || q?.questionId || 'Ordering Question'}
                        </div>
                      </div>
                      <div className={`ml-2 text-xs px-2 py-1 rounded-none font-semibold ${
                        isCorrect ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {isCorrect ? 'Correct' : 'Incorrect'}
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="p-4 space-y-4">
                        {/* Question Description */}
                        {question?.description && (
                          <div>
                            <div className="font-medium text-sm mb-1">Description</div>
                            <div className="text-sm text-muted-foreground">{question.description}</div>
                          </div>
                        )}

                        {/* Your Order */}
                        <div>
                          <div className="font-medium text-sm mb-2 flex items-center gap-2">
                            <span>Your Order</span>
                            {!isCorrect && <span className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded-none font-semibold">Incorrect</span>}
                          </div>
                          <div className={`p-3 rounded-none border-2 ${
                            isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                          }`}>
                            <div className="space-y-2 text-sm">
                              {Array.isArray(userOrder) && userOrder.length > 0 ? (
                                userOrder.map((stepId: any, stepIdx: number) => (
                                  <div key={stepIdx} className="flex items-start gap-2">
                                    <span className="font-semibold min-w-[1.5rem]">{stepIdx + 1}.</span>
                                    <span>{getStepText(question, stepId)}</span>
                                  </div>
                                ))
                              ) : (
                                <div className="text-muted-foreground">No answer provided</div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Correct Order */}
                        <div>
                          <div className="font-medium text-sm mb-2 flex items-center gap-2">
                            <span>Correct Order</span>
                            <span className="text-xs px-2 py-1 bg-green-50 text-green-600 border border-green-200 rounded-none font-semibold">
                              Reference
                            </span>
                          </div>
                          <div className="p-3 bg-green-50 border-2 border-green-200 rounded-none">
                            <div className="space-y-2 text-sm">
                              {Array.isArray(correctOrder) && correctOrder.length > 0 ? (
                                correctOrder.map((stepId: any, stepIdx: number) => (
                                  <div key={stepIdx} className="flex items-start gap-2">
                                    <span className="font-semibold min-w-[1.5rem]">{stepIdx + 1}.</span>
                                    <span>{getStepText(question, stepId)}</span>
                                  </div>
                                ))
                              ) : (
                                <div className="text-muted-foreground">No correct order available</div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Explanation if available */}
                        {question?.explanation && (
                          <div>
                            <div className="font-medium text-sm mb-1">Explanation</div>
                            <div className="text-sm text-muted-foreground p-3 bg-muted/10 rounded">
                              {question.explanation}
                            </div>
                          </div>
                        )}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                )
              })}
            </Accordion>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
