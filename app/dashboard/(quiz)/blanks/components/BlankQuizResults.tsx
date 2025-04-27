// "use client"

// import { useEffect, useMemo, useState } from "react"
// import React from "react"
// import { useRouter } from "next/navigation"

// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
// import { Button } from "@/components/ui/button"
// import { Progress } from "@/components/ui/progress"
// import { CheckCircle, XCircle, AlertTriangle } from "lucide-react"
// import { useSession } from "next-auth/react"
// import { motion } from "framer-motion"
// import { useQuiz } from "@/app/context/QuizContext"

// import { getPerformanceLevel, getAnswerClassName } from "@/utils/quiz-utils"
// import { calculateSimilarity } from "@/hooks/use-similarty"

// interface BlankQuizResultsProps {
//   answers?: { answer: string; timeSpent: number; hintsUsed?: boolean; similarity?: number }[]
//   questions?: { id: number; question: string; answer: string }[]
//   onRestart?: () => void
//   onComplete?: (score: number) => void
//   quizId?: string
//   title?: string
//   slug?: string
//   clearGuestData?: () => void
//   startTime?: number
// }

// export default function BlankQuizResults(props: BlankQuizResultsProps) {
//   // Get quiz state from context
//   const { state, restartQuiz } = useQuiz()
//   const { quizId, slug, answers: contextAnswers, score, quizData } = state

//   // If no props are provided, use the state from context
//   const {
//     answers: initialAnswers = contextAnswers || [],
//     questions = quizData?.questions || [],
//     onRestart = restartQuiz,
//     onComplete = (score) => console.log("Quiz completed with score:", score),
//     quizId: propQuizId = quizId || "",
//     title = quizData?.title || "",
//     slug: propSlug = slug || "",
//     clearGuestData,
//     startTime,
//   } = props

//   const { data: session } = useSession()
//   const router = useRouter()
//   const [userAnswers, setAnswers] = useState(initialAnswers || [])
//   const [isRecovering, setIsRecovering] = useState(false)
//   const [isLoading, setIsLoading] = useState(false)
//   const [isSaving, setIsSaving] = useState(false)
//   const [totalTime, setTotalTime] = useState<number>(0)
//   const [hasCalledComplete, setHasCalledComplete] = useState(false)
//   const [error, setError] = useState<string | null>(null)

//   const isRedirecting = state.animationState === "redirecting"

//   // Calculate total time on mount
//   useEffect(() => {
//     const calculatedTotalTime = startTime ? (Date.now() - startTime) / 1000 : 0
//     setTotalTime(calculatedTotalTime > 0 ? calculatedTotalTime : 300) // Default to 5 minutes if invalid
//   }, [startTime])

//   // Process answers and calculate score
//   const { score: calculatedScore, results } = useMemo(() => {
//     // Add defensive check for empty answers
//     if (!userAnswers || userAnswers.length === 0) {
//       console.warn("No answers provided to BlankQuizResults")
//       // Create empty results with default values
//       const emptyResults = questions.map((question) => ({
//         ...question,
//         userAnswer: "",
//         correctAnswer: question.answer,
//         similarity: 0,
//         timeSpent: 0,
//         isCorrect: false,
//       }))
//       return { score: 0, results: emptyResults }
//     }

//     const calculatedResults = questions.map((question, index) => {
//       // If we don't have an answer for this question, provide a default
//       if (!userAnswers[index]) {
//         console.warn(`No answer found for question ${index}`)
//         return {
//           ...question,
//           userAnswer: "",
//           correctAnswer: question.answer,
//           similarity: 0,
//           timeSpent: 0,
//           isCorrect: false,
//         }
//       }

//       // If similarity is already calculated, use it
//       if (userAnswers[index]?.similarity !== undefined) {
//         return {
//           ...question,
//           userAnswer: userAnswers[index]?.answer?.trim() || "",
//           correctAnswer: question.answer,
//           similarity: userAnswers[index].similarity!,
//           timeSpent: userAnswers[index]?.timeSpent || 0,
//           isCorrect: (userAnswers[index].similarity || 0) > 80,
//           hintsUsed: userAnswers[index]?.hintsUsed || false, // Provide a default value for hintsUsed
//         }
//       }

//       // Otherwise calculate it
//       const userAnswer = userAnswers[index]?.answer?.trim()?.toLowerCase() || ""
//       const correctAnswer = question.answer?.trim()?.toLowerCase() || ""
//       const similarity = calculateSimilarity(correctAnswer, userAnswer)

//       return {
//         ...question,
//         userAnswer: userAnswers[index]?.answer?.trim() || "",
//         correctAnswer: question.answer,
//         similarity,
//         timeSpent: userAnswers[index]?.timeSpent || 0,
//         isCorrect: similarity > 80,
//         hintsUsed: userAnswers[index]?.hintsUsed || false, // Provide a default value for hintsUsed
//       }
//     })

//     const totalScore = calculatedResults.reduce((acc, result) => acc + result.similarity, 0)
//     const averageScore = Math.min(100, totalScore / Math.max(1, calculatedResults.length))

//     return { score: averageScore, results: calculatedResults }
//   }, [userAnswers, questions])

//   // Call onComplete when score is calculated
//   useEffect(() => {
//     if (!hasCalledComplete && !isRecovering && calculatedScore > 0) {
//       setHasCalledComplete(true)
//       onComplete(Math.round(calculatedScore))
//     }
//   }, [calculatedScore, onComplete, hasCalledComplete, isRecovering])

//   // Handle restart
//   const handleRestart = () => {
//     // Reset all state before restarting
//     setHasCalledComplete(false)

//     // Call the provided onRestart function
//     onRestart()

//     // Force a page refresh to ensure all state is reset
//     router.refresh()

//     // Navigate back to the quiz page
//     router.push(`/dashboard/blanks/${propSlug}`)
//   }

//   // Retry fetching results
//   const handleRetryFetch = () => {
//     // This would be implemented if needed
//     console.log("Retrying to fetch results")
//   }

//   // Show a loading state while recovering answers
//   if (isRecovering || isLoading) {
//     return (
//       <div className="max-w-4xl mx-auto p-4">
//         <Card className="mb-8">
//           <CardHeader>
//             <CardTitle className="text-2xl font-bold">Loading Quiz Results...</CardTitle>
//           </CardHeader>
//           <CardContent className="flex flex-col items-center justify-center p-8">
//             <motion.div
//               animate={{
//                 rotate: 360,
//                 transition: { duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" },
//               }}
//               className="h-12 w-12 rounded-full border-b-2 border-primary mb-4"
//             ></motion.div>
//             <p className="text-muted-foreground">Recovering your quiz answers...</p>
//           </CardContent>
//         </Card>
//       </div>
//     )
//   }

//   const performance = getPerformanceLevel(calculatedScore)

//   return (
//     <motion.div
//       initial={{ opacity: 0 }}
//       animate={{
//         opacity: isRedirecting ? 0 : 1,
//         y: isRedirecting ? -20 : 0,
//       }}
//       transition={{ duration: 0.5 }}
//     >
//       <Card className="mb-8">
//         <CardHeader>
//           <CardTitle className="text-2xl font-bold flex items-center gap-2">
//             Quiz Results
//             {isSaving && <span className="text-sm text-muted-foreground">(Saving...)</span>}
//           </CardTitle>
//         </CardHeader>
//         <CardContent>
//           <div className="text-center mb-6">
//             <motion.div
//               initial={{ scale: 0.8, opacity: 0 }}
//               animate={{ scale: 1, opacity: 1 }}
//               transition={{ delay: 0.3, duration: 0.5 }}
//             >
//               <p className="text-3xl font-bold mb-2">{calculatedScore.toFixed(1)}%</p>
//               <Progress value={calculatedScore} className="w-full h-2" indicatorClassName={performance.bgColor} />
//               <p className="mt-2 text-sm text-muted-foreground">{performance.message}</p>
//             </motion.div>
//           </div>

//           {/* No answers warning */}
//           {userAnswers.length === 0 && (
//             <div className="p-4 mb-4 bg-amber-50 border border-amber-200 rounded-md">
//               <p className="text-amber-800 font-medium">No answers found to display.</p>
//               <p className="text-sm text-amber-700">
//                 This may happen if you signed out and back in, or if there was an issue loading your answers.
//               </p>
//               <div className="flex justify-between">
//                 <Button
//                   variant="outline"
//                   size="sm"
//                   className="mt-2"
//                   onClick={() => router.push(`/dashboard/blanks/${propSlug}`)}
//                 >
//                   Return to Quiz
//                 </Button>
//                 <Button variant="outline" size="sm" className="mt-2" onClick={handleRetryFetch}>
//                   Retry Loading Results
//                 </Button>
//               </div>
//             </div>
//           )}

//           {/* Question results */}
//           {results.map((result, index) => (
//             <motion.div
//               key={result.id || index}
//               initial={{ opacity: 0, y: 20 }}
//               animate={{ opacity: 1, y: 0 }}
//               transition={{ delay: 0.1 * index, duration: 0.3 }}
//             >
//               <Card key={result.id || index} className="mb-4">
//                 <CardHeader>
//                   <CardTitle className="text-lg font-semibold">Question {index + 1}</CardTitle>
//                 </CardHeader>
//                 <CardContent>
//                   <div className="mb-4 p-3 bg-muted/30 rounded-lg border border-border/50">
//                     <p className="font-medium mb-2">Question:</p>
//                     {result.question.split("_____").map((part, i, arr) => (
//                       <React.Fragment key={i}>
//                         {part}
//                         {i < arr.length - 1 && (
//                           <span className={getAnswerClassName(result.similarity)}>{result.userAnswer || "_____"}</span>
//                         )}
//                       </React.Fragment>
//                     ))}
//                   </div>
//                   <div className="flex flex-col gap-2 mb-4">
//                     <div className="flex items-center gap-2">
//                       <strong className="min-w-[120px]">Your Answer:</strong>
//                       <span className={getAnswerClassName(result.similarity)}>
//                         {result.userAnswer || "(No answer provided)"}
//                       </span>
//                     </div>
//                     {session?.user && (
//                       <div className="flex items-center gap-2">
//                         <strong className="min-w-[120px]">Correct Answer:</strong>
//                         <span className="font-bold text-green-600 dark:text-green-400">{result.correctAnswer}</span>
//                       </div>
//                     )}
//                     <div className="flex items-center gap-2">
//                       <strong className="min-w-[120px]">Accuracy:</strong>
//                       <span>{result.similarity.toFixed(1)}%</span>
//                     </div>
//                   </div>
//                   <div className="flex items-center gap-2">
//                     {result.similarity === 100 ? (
//                       <CheckCircle className="text-green-500" />
//                     ) : result.similarity > 80 ? (
//                       <AlertTriangle className="text-yellow-500" />
//                     ) : (
//                       <XCircle className="text-red-500" />
//                     )}
//                     <span>
//                       {result.similarity === 100
//                         ? "Perfect match!"
//                         : result.similarity > 80
//                           ? "Close enough!"
//                           : "Needs improvement"}
//                     </span>
//                   </div>
//                   <p className="text-sm text-gray-500 mt-2">
//                     Time spent: {Math.floor(result.timeSpent / 60)}m {Math.round(result.timeSpent % 60)}s
//                   </p>
//                 </CardContent>
//               </Card>
//             </motion.div>
//           ))}

//           <div className="flex justify-center mt-6">
//             <motion.button
//               whileHover={{ scale: 1.05 }}
//               whileTap={{ scale: 0.95 }}
//               initial={{ opacity: 0, y: 20 }}
//               animate={{ opacity: 1, y: 0 }}
//               transition={{ delay: 0.5, duration: 0.3 }}
//               onClick={handleRestart}
//             >
//               Restart Quiz
//             </motion.button>
//           </div>

//           {error && (
//             <p className="text-red-500 text-center mt-4">
//               Error saving results: {error}. Your progress is still displayed here.
//             </p>
//           )}
//         </CardContent>
//       </Card>
//     </motion.div>
//   )
// }

"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { ArrowLeft, CheckCircle, XCircle, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { QuizAnswer } from "@/lib/quiz-service"


interface BlankQuizResultsProps {
  answers: QuizAnswer[]
  questions: any[]
  onRestart: () => void
  quizId: string
  title: string
  slug: string
  onComplete?: (score: number) => void
  onRetryLoading?: () => Promise<void>
}

export default function BlankQuizResults({
  answers,
  questions,
  onRestart,
  quizId,
  title,
  slug,
  onComplete,
  onRetryLoading,
}: BlankQuizResultsProps) {
  const [isRetrying, setIsRetrying] = useState(false)

  // Calculate score
  const score =
    answers.length > 0
      ? Math.round(answers.reduce((sum, answer) => sum + (answer.similarity || 0), 0) / answers.length)
      : 0

  // Calculate correct answers (similarity > 80%)
  const correctAnswers = answers.filter((a) => (a.similarity || 0) > 80).length

  // Call onComplete if provided
  if (onComplete && answers.length > 0) {
    onComplete(score)
  }

  const handleRetryLoading = async () => {
    if (!onRetryLoading) return

    setIsRetrying(true)
    try {
      await onRetryLoading()
    } finally {
      setIsRetrying(false)
    }
  }

  // No answers found state
  if (!answers.length) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-2xl">Quiz Results</CardTitle>
          <CardDescription>
            No answers found. This may happen if you signed out and back in, or if there was an issue loading your
            answers.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8">
            <XCircle className="h-16 w-16 text-muted-foreground mb-4" />
            <p className="text-lg font-medium mb-2">No answers available</p>
            <p className="text-sm text-muted-foreground text-center max-w-md mb-6">
              We couldn't find your quiz answers. You can try reloading your results or start a new quiz.
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row gap-3">
          <Button onClick={handleRetryLoading} className="w-full sm:w-auto" disabled={isRetrying || !onRetryLoading}>
            {isRetrying ? (
              <>
                <span className="animate-spin mr-2 h-4 w-4 border-2 border-background border-t-transparent rounded-full" />
                Retrying...
              </>
            ) : (
              <>
                <RotateCcw className="mr-2 h-4 w-4" />
                Retry Loading Results
              </>
            )}
          </Button>
          <Button onClick={onRestart} variant="outline" className="w-full sm:w-auto">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Start New Quiz
          </Button>
        </CardFooter>
      </Card>
    )
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-2xl">Quiz Results</CardTitle>
        <CardDescription>{title}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Score summary */}
        <div className="flex flex-col items-center justify-center py-4">
          <div className="text-5xl font-bold mb-2">{score}%</div>
          <p className="text-muted-foreground">
            You got {correctAnswers} out of {questions.length} questions correct
          </p>
          <div className="w-full max-w-md mt-4">
            <Progress value={score} className="h-3" />
          </div>
        </div>

        <Separator />

        {/* Question breakdown */}
        <div className="space-y-6">
          <h3 className="text-lg font-medium">Question Breakdown</h3>
          {answers.map((answer, index) => {
            const question = questions[index]
            const isCorrect = (answer.similarity || 0) > 80

            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="border rounded-lg p-4"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center">
                    <Badge variant="outline" className="mr-2">
                      Question {index + 1}
                    </Badge>
                    {isCorrect ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500" />
                    )}
                  </div>
                  <Badge variant={isCorrect ? "default" : "secondary"} className={isCorrect ? "bg-green-500" : ""}>
                    {answer.similarity?.toFixed(0)}% match
                  </Badge>
                </div>

                <div className="mb-3">
                  <p className="font-medium">{question.question}</p>
                </div>

                <div className="space-y-2">
                  <div>
                    <p className="text-sm text-muted-foreground">Your answer:</p>
                    <p className={`font-medium ${isCorrect ? "text-green-600" : "text-red-600"}`}>
                      {answer.answer || "No answer provided"}
                    </p>
                  </div>

                  {!isCorrect && (
                    <div>
                      <p className="text-sm text-muted-foreground">Correct answer:</p>
                      <p className="font-medium text-green-600">{question.answer}</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )
          })}
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={onRestart} className="w-full">
          Restart Quiz
        </Button>
      </CardFooter>
    </Card>
  )
}
