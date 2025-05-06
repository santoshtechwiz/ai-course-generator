"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, XCircle, Clock, Award, ArrowRight, Share2, Printer } from "lucide-react"
import { calculatePerformanceLevel, formatQuizTime } from "@/lib/utils/quiz-performance"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { motion } from "framer-motion"
import { useAppDispatch } from "@/store"
import { resetQuiz } from "@/store/slices/quizSlice"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { vscDarkPlus } from "react-syntax-highlighter/dist/cjs/styles/prism"

interface CodeQuizResultProps {
  result: {
    quizId: string
    slug: string
    score: number
    totalQuestions: number
    correctAnswers: number
    totalTimeSpent: number
    formattedTimeSpent?: string
    completedAt: string
    answers: Array<{
      questionId: string | number
      question: string
      selectedOption?: string
      answer?: string
      correctOption?: string
      correctAnswer?: string
      isCorrect: boolean
      timeSpent: number
      codeSnippet?: string
      language?: string
    }>
  }
}

// Helper function to determine difficulty color
const getDifficultyColor = (difficulty: string): string => {
  switch (difficulty) {
    case "easy":
      return "text-green-500"
    case "medium":
      return "text-yellow-500"
    case "hard":
      return "text-red-500"
    default:
      return "text-gray-500"
  }
}

export default function CodeQuizResult({ result }: CodeQuizResultProps) {
  const [activeTab, setActiveTab] = useState("summary")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  const dispatch = useAppDispatch()

  // Validate result data and provide defaults
  const safeResult = {
    quizId: result?.quizId || "",
    slug: result?.slug || "",
    score: result?.score || 0,
    totalQuestions: result?.totalQuestions || 0,
    correctAnswers: result?.correctAnswers || 0,
    totalTimeSpent: result?.totalTimeSpent || 0,
    formattedTimeSpent: result?.formattedTimeSpent || formatQuizTime(result?.totalTimeSpent || 0),
    completedAt: result?.completedAt || new Date().toISOString(),
    answers: result?.answers || [],
  }

  // Get performance level based on score
  const performanceLevel = calculatePerformanceLevel(safeResult.score)

  // Get color for performance level
  const performanceColor = getDifficultyColor(
    safeResult.score >= 90 ? "easy" : safeResult.score >= 60 ? "medium" : "hard",
  )

  // Handle sharing results
  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: "My Quiz Results",
          text: `I scored ${safeResult.score}% on the ${safeResult.slug} quiz!`,
          url: window.location.href,
        })
      } else {
        await navigator.clipboard.writeText(window.location.href)
        toast({
          title: "Link copied!",
          description: "Share your results with friends",
        })
      }
    } catch (error) {
      console.error("Error sharing:", error)
    }
  }

  // Handle printing results
  const handlePrint = () => {
    window.print()
  }

  // Handle try again
  const handleTryAgain = () => {
    setIsLoading(true)

    // Reset the quiz state in Redux
    dispatch(resetQuiz())

    // Add a timestamp parameter to force a fresh load
    const timestamp = new Date().getTime()

    // Navigate to the quiz page with reset=true parameter to ensure it reloads
    router.push(`/dashboard/code/${safeResult.slug}?reset=true&t=${timestamp}`)
  }

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 },
  }

  return (
    <motion.div
      data-testid="quiz-results"
      className="space-y-6"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <Card className="w-full print:shadow-none">
        <CardHeader className="text-center">
          <motion.div variants={itemVariants}>
            <CardTitle className="text-2xl">Code Quiz Results</CardTitle>
            <CardDescription>Completed on {new Date(safeResult.completedAt).toLocaleDateString()}</CardDescription>
          </motion.div>
        </CardHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="summary">Summary</TabsTrigger>
            <TabsTrigger value="details">Code Solutions</TabsTrigger>
          </TabsList>

          <TabsContent value="summary" className="pt-4">
            <CardContent>
              <motion.div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4" variants={containerVariants}>
                <motion.div variants={itemVariants} className="flex flex-col items-center p-4 border rounded-lg">
                  <Award className="h-8 w-8 text-primary mb-2" />
                  <p className="text-sm text-muted-foreground">Score</p>
                  <p data-testid="quiz-score" className={`text-2xl font-bold ${performanceColor}`}>
                    {safeResult.score}%
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">{performanceLevel}</p>
                </motion.div>

                <motion.div variants={itemVariants} className="flex flex-col items-center p-4 border rounded-lg">
                  <CheckCircle className="h-8 w-8 text-green-600 mb-2" />
                  <p className="text-sm text-muted-foreground">Correct Answers</p>
                  <p className="text-2xl font-bold">
                    {safeResult.correctAnswers}/{safeResult.totalQuestions}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {Math.round((safeResult.correctAnswers / (safeResult.totalQuestions || 1)) * 100)}% accuracy
                  </p>
                </motion.div>

                <motion.div variants={itemVariants} className="flex flex-col items-center p-4 border rounded-lg">
                  <XCircle className="h-8 w-8 text-red-600 mb-2" />
                  <p className="text-sm text-muted-foreground">Incorrect Answers</p>
                  <p className="text-2xl font-bold">
                    {safeResult.totalQuestions - safeResult.correctAnswers}/{safeResult.totalQuestions}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {Math.round(
                      ((safeResult.totalQuestions - safeResult.correctAnswers) / safeResult.totalQuestions) * 100,
                    )}
                    % error rate
                  </p>
                </motion.div>

                <motion.div variants={itemVariants} className="flex flex-col items-center p-4 border rounded-lg">
                  <Clock className="h-8 w-8 text-blue-600 mb-2" />
                  <p className="text-sm text-muted-foreground">Time Spent</p>
                  <p className="text-2xl font-bold">
                    {safeResult.formattedTimeSpent || formatQuizTime(safeResult.totalTimeSpent)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {Math.round(safeResult.totalTimeSpent / safeResult.totalQuestions)} sec/question
                  </p>
                </motion.div>
              </motion.div>

              <motion.div variants={itemVariants} className="mt-8">
                <h3 className="text-lg font-medium mb-3">Performance Overview</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">Overall Score</span>
                      <span className="text-sm font-medium">{safeResult.score}%</span>
                    </div>
                    <Progress value={safeResult.score} className="h-2" />
                  </div>

                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">Accuracy</span>
                      <span className="text-sm font-medium">
                        {Math.round((safeResult.correctAnswers / (safeResult.totalQuestions || 1)) * 100)}%
                      </span>
                    </div>
                    <Progress
                      value={Math.round((safeResult.correctAnswers / (safeResult.totalQuestions || 1)) * 100)}
                      className="h-2 bg-gray-200"
                    />
                  </div>
                </div>
              </motion.div>
            </CardContent>
          </TabsContent>

          <TabsContent value="details">
            <CardContent>
              <motion.div variants={containerVariants} className="mt-6 space-y-4">
                <h3 className="text-lg font-medium">Code Solutions</h3>
                {safeResult.answers && safeResult.answers.length > 0 ? (
                  safeResult.answers.map(
                    (answer, index) =>
                      answer && (
                        <motion.div key={index} variants={itemVariants}>
                          <Card className={answer.isCorrect ? "border-green-200" : "border-red-200"}>
                            <CardContent className="pt-6">
                              <div className="flex items-start gap-2">
                                {answer.isCorrect ? (
                                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                                ) : (
                                  <XCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                                )}
                                <div className="w-full">
                                  <p className="font-medium">
                                    Question {index + 1}: {answer.question}
                                  </p>
                                  <div className="mt-3">
                                    <p className="text-sm font-medium mb-2">Your solution:</p>
                                    <SyntaxHighlighter
                                      language={answer.language || "javascript"}
                                      style={vscDarkPlus}
                                      customStyle={{
                                        margin: 0,
                                        padding: "1rem",
                                        fontSize: "0.85rem",
                                        borderRadius: "0.375rem",
                                      }}
                                    >
                                      {answer.codeSnippet || answer.answer || "// No solution provided"}
                                    </SyntaxHighlighter>
                                  </div>
                                  {!answer.isCorrect && answer.correctAnswer && (
                                    <div className="mt-3">
                                      <p className="text-sm font-medium mb-2">Correct solution:</p>
                                      <SyntaxHighlighter
                                        language={answer.language || "javascript"}
                                        style={vscDarkPlus}
                                        customStyle={{
                                          margin: 0,
                                          padding: "1rem",
                                          fontSize: "0.85rem",
                                          borderRadius: "0.375rem",
                                        }}
                                      >
                                        {answer.correctAnswer}
                                      </SyntaxHighlighter>
                                    </div>
                                  )}
                                  <p className="text-xs text-muted-foreground mt-3">
                                    Time spent: {formatQuizTime(answer.timeSpent)}
                                  </p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      ),
                  )
                ) : (
                  <p className="text-muted-foreground">No answer details available.</p>
                )}
              </motion.div>
            </CardContent>
          </TabsContent>
        </Tabs>

        <CardFooter className="flex flex-wrap justify-between gap-2">
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.push("/dashboard/quizzes")}>
              Return to Quizzes
            </Button>
            <Button onClick={handleTryAgain} disabled={isLoading}>
              {isLoading ? (
                <>
                  <span className="animate-spin mr-2">⟳</span> Loading...
                </>
              ) : (
                <>
                  Try Again <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={handleShare} title="Share Results">
              <Share2 className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={handlePrint} title="Print Results">
              <Printer className="h-4 w-4" />
            </Button>
          </div>
        </CardFooter>
      </Card>
    </motion.div>
  )
}
