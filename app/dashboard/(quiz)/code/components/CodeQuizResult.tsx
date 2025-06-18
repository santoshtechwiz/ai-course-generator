"use client"
import { useSelector } from "react-redux"
import { useRouter } from "next/navigation"
import { QuizResultLayout } from "../../components/QuizResultLayout"
import type { RootState } from "@/store"

// Helper function to determine if a string looks like a slug/ID
const isSlugLike = (str: string): boolean => {
  if (!str || str.length < 3) return true
  // Check if it's mostly random characters (common in slugs/IDs)
  const hasSpaces = str.includes(" ")
  const isShort = str.length < 10
  const hasRandomPattern = /^[a-zA-Z0-9]{6,}$/.test(str)

  return !hasSpaces && (isShort || hasRandomPattern)
}

// Smart title resolution
const getDisplayTitle = (quiz: any): string => {
  // Try different title sources in order of preference
  const possibleTitles = [
    quiz?.title,
    quiz?.name,
    quiz?.topic,
    quiz?.subject,
    quiz?.courseName,
    quiz?.quizTitle,
  ].filter(Boolean)

  // Find the first title that doesn't look like a slug
  for (const title of possibleTitles) {
    if (typeof title === "string" && !isSlugLike(title)) {
      return title
    }
  }

  // If all titles look like slugs, return a descriptive fallback
  return "Code Challenge Quiz"
}

const getDisplaySubtitle = (quiz: any): string | undefined => {
  // If we're using a fallback title, show the quiz ID as subtitle
  const mainTitle = getDisplayTitle(quiz)
  if (mainTitle === "Code Challenge Quiz") {
    return quiz?.id || quiz?.slug || quiz?.title || undefined
  }

  // Otherwise, show additional context if available
  return quiz?.description || quiz?.category || quiz?.language || undefined
}

export default function CodeQuizResult() {
  const router = useRouter()
  const quiz = useSelector((state: RootState) => state.quiz)

  // Calculate results
  const totalQuestions = Array.isArray(quiz.questions) ? quiz.questions.length : 0
  const correctAnswers = Array.isArray(quiz.questions) ? quiz.questions.filter((q: any) => q.isCorrect)?.length : 0
  const incorrectAnswers = totalQuestions - correctAnswers
  const score = correctAnswers  // Format questions for the layout with code-specific formatting and robust error handling
  const formattedQuestions =
    quiz.questions?.map((question: any, index: number) => {
      // Safely extract the answer details with fallbacks
      const questionId = String(question.id || `question-${index}`);
      const answer = quiz.answers?.[questionId] || {};
      
      // Try multiple sources for user answer with fallbacks
      let userAnswer = null;
      try {
        // First try standard properties
        userAnswer = answer.userAnswer || 
                    answer.selectedOptionId || 
                    answer.text || 
                    question.userAnswer;
        
        // Explicitly handle empty string case
        if (userAnswer === "") {
          // Check if selectedOptionId exists and use it directly
          if (answer.selectedOptionId) {
            userAnswer = answer.selectedOptionId;
          } else {
            userAnswer = null;
          }
        }
        
        // As a last resort check if we have answer values in the question options
        if (!userAnswer && question.options && Array.isArray(question.options) && answer.selectedOptionId) {
          const selectedOption = question.options.find((opt: any) => 
            String(opt.id) === String(answer.selectedOptionId)
          );
          if (selectedOption?.text) {
            userAnswer = selectedOption.text;
          }
        }
      } catch (e) {
        console.warn("Error extracting user answer:", e);
      }
      
      // Extract correct answer from all possible sources
      const correctAnswer = question.answer || 
                          question.correctCode || 
                          question.correctAnswer || 
                          "";
      
      // Determine correctness with fallbacks
      const isCorrect = answer.isCorrect === true || question.isCorrect === true || false;
      
      return {
        id: questionId,
        question: question.question || question.text || "",
        type: "CODE",
        userAnswer: userAnswer, // Will be handled by the layout as null if not available
        correctAnswer: correctAnswer,
        isCorrect: isCorrect,
        explanation: question.explanation || question.hint || "",
        // Add fields for code-specific display
        code: question.code || question.codeSnippet || "",
        language: question.language || "javascript",
      };
    }) || []

  // Get smart title and subtitle
  const displayTitle = getDisplayTitle(quiz)
  const displaySubtitle = getDisplaySubtitle(quiz)

  const handleRetry = () => {
    if (quiz.slug) {
      router.push(`/quiz/code/${quiz.slug}`)
    } else {
      router.push("/quiz/code")
    }
  }

  const handleGoHome = () => {
    router.push("/")
  }

  // Calculate time taken if available
  const timeTaken =
    (quiz as any).timeEnded && (quiz as any).timeStarted
      ? `${Math.round(((quiz as any).timeEnded - (quiz as any).timeStarted) / 1000 / 60)} minutes`
      : undefined

  return (
    <QuizResultLayout
      title={displayTitle}
      subtitle={displaySubtitle}
      score={score}
      totalQuestions={totalQuestions}
      correctAnswers={correctAnswers}
      incorrectAnswers={incorrectAnswers}
      timeTaken={timeTaken}
      questions={formattedQuestions}
      onRetry={handleRetry}
      onGoHome={handleGoHome}
    />
  )
}
