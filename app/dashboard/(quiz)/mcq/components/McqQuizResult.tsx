"use client"
import { motion } from "framer-motion"
import { CheckCircle, XCircle, HelpCircle } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { QuizResultLayout } from "../../components/QuizResultLayout"

interface McqQuizResultProps {
  result: {
    title?: string
    slug?: string
    quizId?: string
    score: number
    maxScore: number
    percentage: number
    completedAt?: string
    totalTime?: number
    questions?: Array<any>  // Original quiz questions with options
    answers?: Array<any>    // Original answer data with selectedOptionId
    questionResults: Array<{
      questionId: string
      question: string
      userAnswer: string
      correctAnswer: string
      isCorrect: boolean
      type: string
      options?: Array<{ id: string; text: string }>
      selectedOptionId?: string // Added field for selectedOptionId
    }>
  }
  onRetake?: () => void
}

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
}

export function McqQuizResult({ result, onRetake }: McqQuizResultProps) {
  // Apply defensive coding to handle potential null/undefined values
  const title = result?.title || ""
  const slug = result?.slug || ""
  const quizId = result?.quizId || ""
  const score = typeof result?.score === "number" ? result.score : 0
  const maxScore = typeof result?.maxScore === "number" ? result.maxScore : 0
  const percentage = typeof result?.percentage === "number" ? result.percentage : 0
  const questionResults = Array.isArray(result?.questionResults) ? result.questionResults : []
  const completedAt = result?.completedAt || new Date().toISOString()
  const totalTime = result?.totalTime || 0

  // Enhanced title resolution with multiple fallbacks
  const getQuizTitle = () => {
    // Priority 1: Use provided title if it's meaningful
    if (title && title.trim() && !title.match(/^[a-zA-Z0-9]{6,}$/)) {
      return title.trim()
    }

    // Priority 2: Generate from quiz metadata
    const quizIdentifier = slug || quizId || "quiz"

    // Check if it looks like a slug/ID (alphanumeric, short)
    if (quizIdentifier.match(/^[a-zA-Z0-9]{6,}$/)) {
      return "Multiple Choice Quiz"
    }

    // Priority 3: Use identifier if it looks like a proper title
    return quizIdentifier.replace(/[-_]/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())
  }

  const getQuizSubtitle = () => {
    const identifier = slug || quizId
    if (identifier && identifier !== title) {
      return `Quiz ID: ${identifier}`
    }
    return "Test your knowledge with multiple choice questions"
  }

  // Enhanced score validation with proper fallbacks
  const validatedScore = typeof score === "number" && score >= 0 ? score : 0
  const validatedMaxScore = typeof maxScore === "number" && maxScore > 0 ? maxScore : questionResults?.length || 1

  // Count correct answers from questionResults as backup
  const correctFromResults = questionResults?.filter((q) => q.isCorrect === true).length || 0
  const totalFromResults = questionResults?.length || 0

  // Use the most reliable source for final calculations
  const finalScore = validatedScore > 0 ? validatedScore : correctFromResults
  const finalMaxScore = validatedMaxScore > 1 ? validatedMaxScore : Math.max(totalFromResults, 1)

  // Calculate percentage with proper bounds checking  // Calculate percentage score
  const calculatedPercentage = finalMaxScore > 0 ? Math.round((finalScore / finalMaxScore) * 100) : 0;  
  const validatedPercentage =
    typeof percentage === "number" && percentage >= 0 ? Math.min(percentage, 100) : calculatedPercentage;
  const finalPercentage = Math.max(0, Math.min(validatedPercentage, 100));  
    // Prepare formatted questions for QuizResultLayout with enhanced answer extraction
  const formattedQuestions = Array.isArray(questionResults) ? questionResults.map(q => {    // Extract user answer from multiple possible sources with priority order
    let userAnswerText = q.userAnswer;
    let selectedOptionId = q.selectedOptionId || null;
    let actuallyCorrect = Boolean(q.isCorrect);
    
    // Step 1: Look for answers in the Redux store
    if (result.answers) {
      // Find the answer object for this question
      const answerObj = result.answers.find((ans: any) => 
        String(ans?.questionId) === String(q.questionId)
      );
      
      if (answerObj) {
        // Get the selected option ID with fallbacks
        selectedOptionId = answerObj.selectedOptionId || 
                          answerObj.optionId || 
                          selectedOptionId;
        
        // Get the user answer text with fallbacks (empty string could be intentional)
        if (!userAnswerText) {
          userAnswerText = answerObj.userAnswer || 
                          answerObj.text || 
                          userAnswerText;
        }
        
        // Determine correctness from answer object if available
        if (answerObj.isCorrect !== undefined) {
          actuallyCorrect = Boolean(answerObj.isCorrect);
        }
      }
    }
    
    // Step 2: Find the original question to get options and correct answers
    const originalQuestion = Array.isArray(result.questions) && result.questions.find((origQ: any) => 
      String(origQ.id) === String(q.questionId)
    );
    
    // Step 3: Map selected option ID to actual text if possible
    if (originalQuestion?.options && Array.isArray(originalQuestion.options)) {
      // Try to find correct answer
      const correctAnswer = originalQuestion.answer || q.correctAnswer || '';
      
      // If we have a selectedOptionId, try to extract the option text
      if (selectedOptionId) {
        const selectedOption = originalQuestion.options.find((opt: any) => {
          // Try different ways to match the option
          return String(opt.id || opt) === String(selectedOptionId) || 
                 (typeof opt === 'string' && opt === selectedOptionId);
        });
        
        if (selectedOption) {
          // Extract user answer text from the option
          userAnswerText = selectedOption.text || selectedOption;
          
          // Re-calculate correctness based on selected option and correct answer
          const correctOptionId = originalQuestion.answer || originalQuestion.correctOptionId || '';
          if (correctOptionId) {
            actuallyCorrect = String(selectedOptionId) === String(correctOptionId);
          }
        }
      }
    }
    
    return {
      id: q.questionId || String(Math.random()),
      question: q.question || "",
      type: "MCQ",
      userAnswer: userAnswerText || selectedOptionId || null,
      correctAnswer: q.correctAnswer || (originalQuestion ? originalQuestion.answer : null) || "",
      isCorrect: actuallyCorrect,
      explanation: "", // No explanation field available in MCQ questions
      options: originalQuestion?.options || q.options || []
    };
  }) : [];

  const totalQuestions = finalMaxScore;
  const correctAnswers = finalScore;
  const incorrectAnswers = totalQuestions - correctAnswers;
  // Define safe event handlers that won't be undefined
  const handleRetry = () => {
    if (onRetake) {
      onRetake();
    } else {
      // Fallback if onRetake is undefined
      window.location.href = `/dashboard/quizzes/${slug || ''}`;
    }
  };

  const handleGoHome = () => {
    window.location.href = "/dashboard";
  };
  return (    <QuizResultLayout
      title={getQuizTitle()}
      subtitle={getQuizSubtitle()}
      score={finalScore}
      totalQuestions={totalQuestions}
      correctAnswers={correctAnswers}
      incorrectAnswers={incorrectAnswers}
      timeTaken={totalTime ? `${totalTime} seconds` : undefined}
      questions={formattedQuestions}
      onRetry={handleRetry}
      onGoHome={handleGoHome}
    />
  )
}
