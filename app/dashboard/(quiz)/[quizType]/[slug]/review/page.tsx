"use client"

import React from 'react'
import { use } from 'react'
import { useRouter } from 'next/navigation'
import QuizResultHandler from '../../../components/QuizResultHandler'
import QuizResultLayout from '../../../components/layouts/QuizResultLayout'
import BlankQuizResults from '../../../blanks/components/BlankQuizResults'
import OpenEndedQuizResults from '../../../openended/components/QuizResultsOpenEnded'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion'
import SyntaxHighlighter from 'react-syntax-highlighter'
import atomOneDark from 'react-syntax-highlighter/dist/styles/atom-one-dark'
import { Badge } from '@/components/ui/badge'

interface Props {
  params: Promise<{ quizType: string; slug: string }> | { quizType: string; slug: string }
}

export default function ReviewPage({ params }: Props) {
  const router = useRouter()
  const { quizType, slug } = params instanceof Promise ? use(params) : params

  if (!slug) {
    return (
      <div className="container max-w-3xl py-8">
        <Card>
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-semibold">Invalid quiz</h2>
            <p className="text-sm text-muted-foreground">Quiz slug missing. Go back to quizzes.</p>
            <div className="mt-4">
              <Button onClick={() => router.push('/dashboard/quizzes')}>Back</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <QuizResultLayout title="Review Answers" quizType={quizType as any} slug={slug}>
      <QuizResultHandler slug={slug} quizType={quizType as any}>
        {(props: { result: any }) => {
          const { result } = props

          // For blanks and openended quizzes use the specialized result components
          if (quizType === 'blanks') {
            return <BlankQuizResults result={result} onRetake={() => router.push(`/dashboard/${quizType}/${slug}`)} slug={slug} />
          }

          if (quizType === 'openended' || quizType === 'open-ended') {
            return <OpenEndedQuizResults result={result} onRetake={() => router.push(`/dashboard/${quizType}/${slug}`)} slug={slug} />
          }

          // Fallback: existing accordion-based review for MCQ / code / others
          const questionResults = result?.questionResults?.length ? result.questionResults : result?.results || []
          return (
            <div className="container max-w-5xl py-8">
              <Card>
                <CardHeader className="px-6 py-4">
                  <CardTitle className="text-lg font-semibold">Review All Answers</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <Accordion type="single" collapsible>
                    {questionResults.map((q: any, idx: number) => (
                      <AccordionItem key={idx} value={`q-${idx}`}>
                        <AccordionTrigger className="flex items-center justify-between px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${q.isCorrect ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                              {q.isCorrect ? '✓' : '✕'}
                            </div>
                            <div className="text-sm font-medium">{`Q${idx + 1}: ${q.question || q.title || 'Question'}`}</div>
                          </div>
                          <div className="text-xs text-muted-foreground">{q.isCorrect ? 'Correct' : 'Incorrect'}</div>
                        </AccordionTrigger>
                        <AccordionContent className="px-4 pb-4">
                          <div className="space-y-3">
                            <div className="text-sm">
                              <div className="font-semibold">Your answer</div>
                              <div className="mt-1">
                                {q.type === 'code' || (q.codeSnippet && !q.userAnswer) ? (
                                  <div className="rounded border border-muted overflow-hidden">
                                    <SyntaxHighlighter language={q.language || 'javascript'} style={atomOneDark} customStyle={{ margin: 0, fontSize: '0.95rem', padding: '1rem' }}>
                                      {q.userAnswer || q.codeSnippet || ''}
                                    </SyntaxHighlighter>
                                  </div>
                                ) : (
                                  <div className="p-3 bg-muted/10 rounded">{q.userAnswer ?? '-'}</div>
                                )}
                              </div>
                            </div>

                            <div className="text-sm">
                              <div className="font-semibold">Correct answer</div>
                              <div className="mt-1">
                                {q.correctAnswer ? (
                                  q.type === 'code' ? (
                                    <div className="rounded border border-muted overflow-hidden">
                                      <SyntaxHighlighter language={q.language || 'javascript'} style={atomOneDark} customStyle={{ margin: 0, fontSize: '0.95rem', padding: '1rem' }}>
                                        {q.correctAnswer}
                                      </SyntaxHighlighter>
                                    </div>
                                  ) : (
                                    <div className="p-3 bg-muted/10 rounded">{q.correctAnswer}</div>
                                  )
                                ) : (
                                  <Badge variant="secondary">No correct answer provided</Badge>
                                )}
                              </div>
                            </div>

                            {q.explanation && (
                              <div className="text-sm">
                                <div className="font-semibold">Explanation</div>
                                <div className="mt-1 text-muted-foreground">{q.explanation}</div>
                              </div>
                            )}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>

                  <div className="mt-6 flex gap-3 justify-end">
                    <Button variant="outline" onClick={() => router.back()}>Back</Button>
                    <Button onClick={() => router.push(`/dashboard/${quizType}/${slug}`)}>Retake Quiz</Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )
        }}
      </QuizResultHandler>
    </QuizResultLayout>
  )
}
