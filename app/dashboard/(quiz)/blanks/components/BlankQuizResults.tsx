"use client"

import { useState, useEffect, useRef, useMemo, useCallback } from "react"
import { useRouter } from "next/navigation"
import { levenshteinDistance } from "@/lib/utils/text-similarity"
import { Confetti } from "@/components/ui/confetti"
import { Button } from "@/components/ui/button"
import { CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, XCircle, Trophy, Target, Share2, RefreshCw, Home } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"

import { motion } from "framer-motion"
import { NoResults } from "@/components/ui/no-results"

import { useDispatch } from "react-redux"

// Using standardized similarity utilities
import { 
  calculateAnswerSimilarity,
  getSimilarityFeedback } from "@/lib/utils/similarity-scoring"
import { BestGuess } from "@/components/ui/best-guess"
import { getSimilarityLabel } from "@/lib/utils/quiz-result-helpers"
import { BlanksQuizResult } from "@/app/types/quiz-types"
import { clearQuizState } from "@/store/slices/quiz-slice"

// Move function outside component to prevent recreation
function getSimilarity(userAnswer: string, correctAnswer: string) {
  try {
    // Make sure userAnswer and correctAnswer are strings and handle the case where they might be null/undefined
    const userStr = (userAnswer || "").toString().trim().toLowerCase();
    const correctStr = (correctAnswer || "").toString().trim().toLowerCase();
    
    // Do an exact match check first for simple answers 
    if (userStr === correctStr) {
      return 1.0; // 100% match
    }
      // Special case for blanks quizzes - enhance similarity detection for minor misspellings
    // Use Levenshtein distance to give more weight to misspelled words that are structurally similar
    
    // For short answers (typical in blanks quizzes), use Levenshtein directly with higher tolerance
    if (correctStr.length < 20 && userStr.length > 0) {
      const maxLen = Math.max(userStr.length, correctStr.length);
      const distance = levenshteinDistance(userStr, correctStr);
      const levScore = 1 - (distance / maxLen);
      
      // More generous threshold for short answers with minor misspellings
      // e.g. "orchestions" vs "orchestration" should get partial credit
      if (levScore >= 0.7) {
        return levScore; // Give proportional score based on similarity
      }
    }
    
    // Fall back to standard similarity scoring for more complex answers
    return calculateAnswerSimilarity(userStr, correctStr);
  } catch (error) {
    console.error("Error in getSimilarity:", error);
    // Fall back to standard method if anything fails
    return calculateAnswerSimilarity(userAnswer || "", correctAnswer || "");
  }
}

function getPerformanceLevel(percentage: number) {
  if (percentage >= 90)
    return {
      level: "Excellent",
      message: "Outstanding! You've mastered this topic.",
      color: "text-green-500",
      bgColor: "bg-green-50",
      borderColor: "border-green-200",
      emoji: "🏆",
    }
  if (percentage >= 80)
    return {
      level: "Very Good",
      message: "Great job! You have strong understanding.",
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
      emoji: "🎯",
    }
  if (percentage >= 70)
    return {
      level: "Good",
      message: "Well done! Your knowledge is solid.",
      color: "text-green-500",
      bgColor: "bg-green-50",
      borderColor: "border-green-200",
      emoji: "✅",
    }
  if (percentage >= 60)
    return {
      level: "Fair",
      message: "Good effort! Keep studying to improve.",
      color: "text-yellow-600",
      bgColor: "bg-yellow-50",
      borderColor: "border-yellow-200",
      emoji: "📚",
    }
  if (percentage >= 50)
    return {
      level: "Needs Work",
      message: "You're making progress. More study needed.",
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      borderColor: "border-orange-200",
      emoji: "💪",
    }
  return {
    level: "Poor",
    message: "Keep learning! Review the material thoroughly.",
    color: "text-red-500",
    bgColor: "bg-red-50",
    borderColor: "border-red-200",
    emoji: "📖",
  }
}

interface BlankQuizResultsProps {
  result?: BlanksQuizResult
  onRetake?: () => void
  isAuthenticated?: boolean
  slug: string
}

export default function BlankQuizResults({ result, onRetake, isAuthenticated = true, slug }: BlankQuizResultsProps) {
  const router = useRouter()
  const [showConfetti, setShowConfetti] = useState(false)
  const hasShownConfettiRef = useRef(false)
  
  // Memoize enhanced results to prevent recalculation on every render
  const enhancedResults = useMemo(() => {    // Early validation to prevent processing invalid data
    if (!result?.questionResults) return [];return result.questionResults.map((q: any) => {
      // Normalize question ID for consistent comparison
      const questionId = String(q.questionId || q.id || "")

      // Find the actual user answer from the answers array with enhanced matching
      const actualAnswer = result.answers?.find((a: any) => String(a.questionId || a.id || "") === questionId)

      // Find the question text from the questions array with more robust matching
      const questionData = result.questions?.find((quest: any) => String(quest.id || quest.questionId || "") === questionId)

      // Extract question text with improved priority and fallbacks
      const questionText =
        q.question || q.text || questionData?.question || questionData?.text || `Question ${questionId}`

      // Extract user answer with comprehensive fallbacks for fill-in-the-blanks format
      const userAnswer =
        actualAnswer?.userAnswer || actualAnswer?.text || actualAnswer?.answer || q.userAnswer || q.answer || ""

      // Extract correct answer with comprehensive fallbacks
      const correctAnswer = q.correctAnswer || questionData?.correctAnswer || questionData?.answer || ""      // Calculate or use provided similarity with proper type checking and NaN protection
      let sim = typeof q.similarity === "number" && !isNaN(q.similarity) ? q.similarity : getSimilarity(userAnswer, correctAnswer);
      
      // Ensure similarity is never NaN - default to 0 if it somehow is
      if (isNaN(sim)) {
        console.warn(`Calculated similarity is NaN for question "${questionText}", userAnswer="${userAnswer}", correctAnswer="${correctAnswer}"`);
        sim = 0;
      }

      // Generate similarity label from calculated or existing value
      const similarityLabel = q.similarityLabel || getSimilarityLabel(sim)      // Determine correctness with explicit boolean checks and fallback to similarity
      // Use more lenient thresholds for blanks quizzes to account for minor typos
      const isCorrect =
        typeof actualAnswer?.isCorrect === "boolean"
          ? actualAnswer.isCorrect
          : typeof q.isCorrect === "boolean"
            ? q.isCorrect
            : sim >= 0.7 // Anything at 70% or higher is considered correct (matches similarity-scoring.ts logic)

      // Return a comprehensive and normalized result object
      return {
        ...q,
        questionId,
        question: questionText,
        userAnswer,
        correctAnswer,
        similarity: sim,
        similarityLabel,
        isCorrect,
        // Include debug info
        _originalData: {          questionResult: q,
          answerData: actualAnswer,
          questionData: questionData,
        }
      }
    })
  }, [result]);  // Memoize derived values to avoid recalculation
  
  const { correctCount, totalQuestions, percentage } = useMemo(() => {
    const correct = enhancedResults.filter((q: any) => q.isCorrect).length;
    const total = enhancedResults.length || 1;
    let finalPercentage = result?.percentage;

    // Calculate percentage if not provided
    if (finalPercentage === undefined || finalPercentage === null) {
      // Use existing scoring logic or provide fallback
      if (result?.score !== undefined && result?.maxScore && result.maxScore > 0) {
        finalPercentage = Math.round((result.score / result.maxScore) * 100);
      } else {
        finalPercentage = Math.round((correct / total) * 100);
      }
    }
    
    return {      correctCount: correct,
      totalQuestions: total,
      percentage: Math.max(0, Math.min(finalPercentage, 100)) // Clamp between 0-100
    };
  }, [enhancedResults, result]);
  
  const performance = useMemo(() => getPerformanceLevel(percentage), [percentage]);

  useEffect(() => {
    const resultId = result?.completedAt;
    if (result && resultId && !hasShownConfettiRef.current && percentage >= 70) {
      hasShownConfettiRef.current = true;
      setShowConfetti(true);
      const timer = setTimeout(() => setShowConfetti(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [result, percentage]);
  const dispatch = useDispatch();
  const handleRetake = useCallback(() => {
    if (onRetake) return onRetake();
    dispatch(clearQuizState());
    router.push(`/dashboard/blanks/${result?.slug || slug}`);
  }, [onRetake, dispatch, router, result?.slug, slug]);
  const handleViewAllQuizzes = () => {
    router.push("/dashboard/quizzes");
  };

  const handleShare = async () => {
    try {
      const shareData = {
        title: `${result?.title || "Quiz"} - Results`,
        text: `I scored ${percentage}% (${performance.level}) on the ${result?.title || "Quiz"} fill-in-the-blanks quiz! ${performance.emoji}`,
        url: window.location.href,
      }
      if (navigator.share) {
        await navigator.share(shareData)
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`)
      }
    } catch (error) {
      // Handle error silently
    }
  }

  if (!result) {
    return (
      <NoResults
        variant="quiz"
        title="Unable to Load Results"
        description="We couldn't load your quiz results. The session may have expired or some data might be missing."
        action={{
          label: "Retake Quiz",
          onClick: handleRetake,
          icon: <RefreshCw className="h-4 w-4" />,
        }}
        secondaryAction={{
          label: "Browse Quizzes",
          onClick: handleViewAllQuizzes,
          variant: "outline",
          icon: <Home className="h-4 w-4" />,
        }}
      />
    )
  }

  if (!Array.isArray(result.questionResults)) {
    return (
      <NoResults
        variant="quiz"
        title="Invalid Results"
        description="No valid question results found."
        action={{
          label: "Retake Quiz",
          onClick: handleRetake,
          icon: <RefreshCw className="h-4 w-4" />,
        }}
      />
    )
  }

  return (
    <>
      <motion.div
        className="space-y-8 max-w-4xl mx-auto"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeInOut" }}
      >
        {/* Header */}
        <motion.div
          className="text-center space-y-6 relative bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 rounded-2xl p-8 border-2 border-primary/20 shadow-lg"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <div className="flex items-center justify-center gap-4">
            <motion.div
              className="w-16 h-16 bg-gradient-to-br from-primary/20 to-primary/10 rounded-2xl flex items-center justify-center shadow-lg"
              whileHover={{ scale: 1.05, rotate: 5 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              <Target className="w-8 h-8 text-primary" />
            </motion.div>
            <div className="text-left">
              <motion.h1
                className="text-4xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2, duration: 0.5 }}
              >
                {result.title || "Fill in the Blanks Quiz Results"}
              </motion.h1>
              <motion.div
                className="h-1 bg-gradient-to-r from-primary via-primary/60 to-transparent rounded-full mt-2"
                initial={{ width: 0 }}
                animate={{ width: "100%" }}
                transition={{ delay: 0.4, duration: 0.8, ease: "easeOut" }}
              />
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <Badge
              variant="secondary"
              className={`mt-3 px-4 py-2 text-sm font-semibold shadow-md ${performance.color} ${performance.bgColor} ${performance.borderColor} border-2`}
            >
              <motion.span
                className="mr-2 text-lg"
                animate={{
                  rotate: [0, 10, -10, 0],
                  scale: [1, 1.1, 1],
                }}
                transition={{
                  duration: 2,
                  repeat: Number.POSITIVE_INFINITY,
                  repeatDelay: 3,
                }}
              >
                {performance.emoji}
              </motion.span>
              {performance.level}
            </Badge>
          </motion.div>

          <motion.p
            className="text-muted-foreground text-lg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
          >
            Completed on {new Date(result.completedAt || new Date()).toLocaleDateString()} at{" "}
            {new Date(result.completedAt || new Date()).toLocaleTimeString()}
          </motion.p>
        </motion.div>

        {/* Score Overview */}
        <motion.div
          className="overflow-hidden rounded-3xl shadow-2xl border-2 border-primary/10"
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          whileHover={{
            scale: 1.02,
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
          }}
        >
          <CardHeader className="bg-gradient-to-br from-primary/8 via-primary/5 to-primary/10 border-b-2 border-primary/10 p-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <motion.div whileHover={{ rotate: 360, scale: 1.1 }} transition={{ duration: 0.6, ease: "easeInOut" }}>
                  <Trophy className="w-12 h-12 text-primary drop-shadow-lg" />
                </motion.div>
                <div>
                  <CardTitle className="text-3xl font-bold text-foreground">Your Score</CardTitle>
                  <p className="text-muted-foreground text-lg">Fill-in-the-blanks performance summary</p>
                </div>
              </div>
              <div className="text-right">
                <motion.div
                  className="text-6xl font-black text-primary drop-shadow-lg"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{
                    delay: 0.3,
                    type: "spring",
                    stiffness: 200,
                    damping: 15,
                  }}
                >
                  {percentage}%
                </motion.div>
                <div className="text-lg text-muted-foreground font-medium">
                  {correctCount} of {enhancedResults.length}
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-8">
            <div className="space-y-8">
              <div className="space-y-3">
                <div className="flex justify-between text-lg font-medium">
                  <span>Progress</span>
                  <motion.span
                    key={percentage}
                    initial={{ scale: 1.2, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    {correctCount}/{enhancedResults.length} correct
                  </motion.span>
                </div>
                <div className="relative">
                  <Progress value={percentage} className="h-4 rounded-full bg-muted/50" />
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent rounded-full"
                    animate={{
                      x: ["-100%", "100%"],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Number.POSITIVE_INFINITY,
                      ease: "linear",
                      repeatDelay: 1,
                    }}
                    style={{ opacity: percentage > 0 ? 1 : 0 }}
                  />
                </div>
              </div>

              <motion.div
                className={`p-6 rounded-2xl border-3 ${performance.bgColor} ${performance.borderColor} shadow-lg`}
                whileHover={{ scale: 1.02 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                <div className="flex items-center gap-4">
                  <motion.span
                    className="text-4xl"
                    animate={{
                      rotate: [0, 10, -10, 0],
                      scale: [1, 1.1, 1],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Number.POSITIVE_INFINITY,
                      repeatDelay: 2,
                    }}
                  >
                    {performance.emoji}
                  </motion.span>
                  <p className={`font-bold text-xl ${performance.color}`}>{performance.message}</p>
                </div>
              </motion.div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <motion.div
                  className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/30 dark:to-green-900/30 border-2 border-green-200 dark:border-green-800 rounded-2xl p-6 text-center shadow-lg"
                  whileHover={{ scale: 1.05, y: -5 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                >
                  <motion.div
                    className="text-4xl font-black text-green-500"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                  >
                    {correctCount}
                  </motion.div>
                  <div className="text-sm text-green-700 dark:text-green-300 font-semibold">Correct</div>
                </motion.div>

                <motion.div
                  className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950/30 dark:to-red-900/30 border-2 border-red-200 dark:border-red-800 rounded-2xl p-6 text-center shadow-lg"
                  whileHover={{ scale: 1.05, y: -5 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                >
                  <motion.div
                    className="text-4xl font-black text-red-500"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
                  >
                    {enhancedResults.length - correctCount}
                  </motion.div>
                  <div className="text-sm text-red-700 dark:text-red-300 font-semibold">Incorrect</div>
                </motion.div>

                <motion.div
                  className="bg-gradient-to-br from-slate-50 to-gray-50 dark:from-slate-950/30 dark:to-gray-950/30 border-2 border-slate-200 dark:border-slate-800 rounded-2xl p-6 text-center shadow-lg"
                  whileHover={{ scale: 1.05, y: -5 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                >
                  <motion.div
                    className="text-4xl font-black text-slate-600 dark:text-slate-400"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.4, type: "spring", stiffness: 200 }}
                  >
                    {enhancedResults.length}
                  </motion.div>
                  <div className="text-sm text-slate-700 dark:text-slate-300 font-semibold">Total</div>
                </motion.div>
              </div>
            </div>
          </CardContent>

          <CardFooter className="bg-gradient-to-r from-muted/20 via-muted/30 to-muted/20 border-t-2 border-muted/20 flex flex-wrap gap-4 justify-between p-8">
            <div className="flex gap-3">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  onClick={handleRetake}
                  className="gap-3 px-6 py-3 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <motion.div whileHover={{ rotate: 180 }} transition={{ duration: 0.3 }}>
                    <RefreshCw className="w-5 h-5" />
                  </motion.div>
                  Retake Quiz
                </Button>
              </motion.div>

              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  variant="outline"
                  onClick={handleViewAllQuizzes}
                  className="gap-3 px-6 py-3 text-lg font-semibold rounded-xl border-2 hover:bg-muted/50 transition-all duration-300"
                >
                  <Home className="w-5 h-5" />
                  All Quizzes
                </Button>
              </motion.div>
            </div>

            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant="outline"
                onClick={handleShare}
                className="gap-3 px-6 py-3 text-lg font-semibold rounded-xl border-2 hover:bg-muted/50 transition-all duration-300"
              >
                <motion.div whileHover={{ rotate: 15, scale: 1.1 }} transition={{ duration: 0.2 }}>
                  <Share2 className="w-5 h-5" />
                </motion.div>
                Share Results
              </Button>
            </motion.div>
          </CardFooter>
        </motion.div>

        {/* Question Results */}
        <motion.div
          className="rounded-3xl shadow-2xl border-2 border-muted/20"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
        >
          <CardHeader className="p-8 bg-gradient-to-r from-muted/10 to-muted/20 border-b-2 border-muted/20">
            <CardTitle className="flex items-center gap-4 text-2xl font-bold">
              <motion.div whileHover={{ rotate: 360, scale: 1.1 }} transition={{ duration: 0.6 }}>
                <Target className="w-7 h-7 text-primary" />
              </motion.div>
              Answer Review ({enhancedResults.length} Questions)
            </CardTitle>
            <p className="text-muted-foreground text-lg">Review your answers and learn from mistakes</p>
          </CardHeader>          <CardContent className="space-y-6 p-8">            {enhancedResults.map((q: any, index: number) => (
              <motion.div
                key={q.questionId}
                className="p-6 rounded-2xl border-2 border-muted/30 bg-gradient-to-r from-background to-muted/5 shadow-lg hover:shadow-xl transition-all duration-300"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                whileHover={{ scale: 1.01, y: -2 }}
              >
                <div className="flex items-start gap-4 mb-4">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center shadow-md ${
                      q.isCorrect ? "bg-green-100 text-green-500" : "bg-red-100 text-red-500"
                    }`}
                  >
                    {q.isCorrect ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                  </div>
                  <div className="flex-1">
                    <div className="font-bold mb-3 text-lg text-foreground">
                      Question {index + 1}: {q.question}
                    </div>                    <div className="space-y-4">
                      <BestGuess 
                        userAnswer={q.userAnswer || ""} 
                        correctAnswer={q.correctAnswer || ""} 
                        similarity={isNaN(q.similarity) ? 0 : q.similarity} 
                        explanation={getSimilarityFeedback(isNaN(q.similarity) ? 0 : q.similarity)}
                        showDetailedInfo={true}
                      />
                    </div>                    <motion.div
                      className="text-sm text-muted-foreground mt-4 p-3 bg-muted/20 rounded-lg border border-muted/30"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.3 }}
                    >
                      <strong>Similarity:</strong> {Math.round((q.similarity || 0) * 100)}% ({q.similarityLabel})
                      {process.env.NODE_ENV !== 'production' && q.userAnswer !== q.correctAnswer && (
                        <div className="mt-1 text-xs text-muted-foreground italic">
                          <details>
                            <summary>Debug Info</summary>
                            <div className="pl-2 mt-1">
                              <div>User: "{q.userAnswer}"</div>
                              <div>Expected: "{q.correctAnswer}"</div>
                              <div>Raw similarity score: {(q.similarity || 0).toFixed(4)}</div>
                              <div>Levenshtein distance: {levenshteinDistance(
                                (q.userAnswer || "").toString().trim().toLowerCase(),
                                (q.correctAnswer || "").toString().trim().toLowerCase()
                              )}</div>
                            </div>
                          </details>
                        </div>
                      )}
                    </motion.div>
                  </div>
                </div>
              </motion.div>
            ))}
          </CardContent>
        </motion.div>
      </motion.div>

      {showConfetti && <Confetti isActive />}
    </>
  )
}
