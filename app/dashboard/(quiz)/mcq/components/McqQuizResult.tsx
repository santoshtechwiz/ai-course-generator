"use client"

import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Check, X, RefreshCw, Home, Download, Share2, AlertCircle } from "lucide-react"
import { toast } from "sonner"

// Use a more compatible type definition
interface QuizAnswer {
  questionId: string | number;
  answer?: string;
  selectedOption?: string;
  selectedOptionId?: string; // Add this field to match potential structure
  isCorrect?: boolean;
  userAnswer?: string; // Add for compatibility with generated results
}

interface QuizQuestion {
  id: string | number;
  question?: string;
  text?: string; // Add text field as an alternative to question
  options: string[] | {id: string, text: string}[];
  answer?: string;
  correctAnswer?: string;
  correctOptionId?: string;
}

interface QuizResult {
  quizId: string | number;
  slug: string;
  title: string;
  questions?: QuizQuestion[] | null; // Make optional and nullable
  questionResults?: any[]; // Add for compatibility with API results
  answers?: QuizAnswer[] | null; // Make optional and nullable
  completedAt: string;
  score: number;
  maxScore: number;
  percentage: number;
}

interface McqQuizResultProps {
  result: QuizResult;
}

export default function McqQuizResult({ result }: McqQuizResultProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [normalizedResult, setNormalizedResult] = useState<QuizResult | null>(null)

  // Normalize the result data structure
  useEffect(() => {
    // Show error immediately if result is null/undefined
    if (!result) {
      setHasError(true)
      setIsLoading(false)
      return
    }
    try {
      // Prepare a normalized version of the results
      const normalized: QuizResult = {
        ...result,
        title: result.title || "Quiz Results",
        score: result.score || 0,
        maxScore: result.maxScore || 0,
        percentage: result.percentage || 0,
        completedAt: result.completedAt || new Date().toISOString(),
        slug: result.slug || "",
        questions: [],
        answers: []
      }
      
      // Handle questions from different formats
      let normalizedQuestions: QuizQuestion[] = []
      if (result.questions && Array.isArray(result.questions)) {
        normalizedQuestions = result.questions
      } else if (result.questionResults && Array.isArray(result.questionResults)) {
        normalizedQuestions = result.questionResults.map((qResult, index) => ({
          id: qResult.questionId || `q-${index}`,
          question: qResult.question || `Question ${index + 1}`,
          answer: qResult.correctAnswer || "",
          correctAnswer: qResult.correctAnswer || "",
          options: []
        }))
      }
      
      // Handle answers from different formats
      let normalizedAnswers: QuizAnswer[] = []
      if (result.answers && Array.isArray(result.answers)) {
        normalizedAnswers = result.answers
      } else if (result.questionResults && Array.isArray(result.questionResults)) {
        normalizedAnswers = result.questionResults.map((qResult, index) => ({
          questionId: qResult.questionId || `q-${index}`,
          userAnswer: qResult.userAnswer || "",
          selectedOption: qResult.userAnswer || "",
          isCorrect: qResult.isCorrect || false
        }))
      }
      normalized.questions = normalizedQuestions
      normalized.answers = normalizedAnswers
      setNormalizedResult(normalized)
      // Simulate loading time
      const timer = setTimeout(() => setIsLoading(false), 500)
      return () => clearTimeout(timer)
    } catch (error) {
      setHasError(true)
      setIsLoading(false)
    }
  }, [result])

  // Show error state immediately if result is missing/invalid
  if (hasError || !result) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] text-center">
        <AlertCircle className="h-12 w-12 text-destructive mb-4" />
        <h2 className="text-xl font-bold mb-2">Error Loading Results</h2>
        <p className="text-muted-foreground mb-6">
          We couldn't load your quiz results properly. Some data might be missing.
        </p>
        <Button onClick={() => router.push("/dashboard/quizzes")}>
          Back to Quizzes
        </Button>
      </div>
    )
  }

  // Only show loading spinner if result is defined and loading is in progress
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="animate-pulse text-center">
          <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading results...</p>
        </div>
      </div>
    )
  }

  // Access the normalized result for rendering
  const safeResult = normalizedResult;
  const hasQuestionDetails = safeResult.questions && 
                            Array.isArray(safeResult.questions) && 
                            safeResult.questions.length > 0;

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: `${safeResult.title} - Quiz Results`,
          text: `I scored ${safeResult.percentage}% on the ${safeResult.title} quiz!`,
          url: window.location.href
        })
        toast.success("Shared successfully!")
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(window.location.href)
        toast.success("Link copied to clipboard")
      }
    } catch (error) {
      console.error("Error sharing:", error)
    }
  }

  const handleDownload = () => {
    // Create a text summary of results
    const resultText = `
Quiz Results: ${safeResult.title}
Date: ${new Date(safeResult.completedAt).toLocaleString()}
Score: ${safeResult.score}/${safeResult.maxScore} (${safeResult.percentage}%)

${hasQuestionDetails ? `Question Summary:
${safeResult.questions!.map((q, i) => {
  // Find the matching answer
  const userAnswer = safeResult.answers?.find(a => 
    a?.questionId?.toString() === q?.id?.toString()
  );
  
  const isCorrect = userAnswer?.isCorrect ?? false;
  const questionText = q.question || q.text || `Question ${i + 1}`;
  const userAnswerText = userAnswer?.userAnswer || 
                        userAnswer?.selectedOption || 
                        userAnswer?.selectedOptionId ||
                        userAnswer?.answer || 
                        'Not answered';
  const correctAnswerText = q.correctAnswer || 
                          q.answer || 
                          q.correctOptionId ||
                          'Answer unavailable';
  
  return `
Q${i + 1}: ${questionText}
Your answer: ${userAnswerText}
Correct answer: ${correctAnswerText}
Result: ${isCorrect ? 'Correct' : 'Incorrect'}
`;
}).join('\n')}` : 'No question details available for this quiz.'}
    `.trim();
    
    // Create and download file
    const blob = new Blob([resultText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${safeResult.title.replace(/\s+/g, '-').toLowerCase()}-results.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-2">{safeResult.title}</h1>
        <p className="text-muted-foreground">
          Completed on {new Date(safeResult.completedAt).toLocaleDateString()}
        </p>
      </div>
      
      <div className="bg-card rounded-lg shadow-sm border p-6">
        <div className="flex flex-col items-center mb-6">
          <div className="relative w-32 h-32 mb-4">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="#eee"
                strokeWidth="10"
              />
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke={safeResult.percentage >= 70 ? "#4CAF50" : safeResult.percentage >= 40 ? "#FF9800" : "#F44336"}
                strokeWidth="10"
                strokeDasharray={`${safeResult.percentage} 100`}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-3xl font-bold">{safeResult.percentage}%</span>
            </div>
          </div>
          
          <div className="text-center">
            <p className="text-xl font-semibold mb-1">
              {safeResult.score} out of {safeResult.maxScore} correct
            </p>
            <p className="text-muted-foreground">
              {safeResult.percentage >= 90 ? "Excellent! You've mastered this topic." :
               safeResult.percentage >= 70 ? "Great job! You have a solid understanding." :
               safeResult.percentage >= 50 ? "Good effort! Keep practicing to improve." :
               "Keep learning! Review the material and try again."}
            </p>
          </div>
        </div>
      </div>
      
      {hasQuestionDetails && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold mb-4">Question Summary</h2>
          
          {safeResult.questions!.map((q, index) => {
            if (!q) return null; // Skip null/undefined questions
            
            const answer = safeResult.answers?.find(a => 
              a && q && a.questionId?.toString() === q.id?.toString()
            );
            
            const isCorrect = answer?.isCorrect || false;
            const questionText = q.question || q.text || `Question ${index + 1}`;
            
            return (
              <motion.div 
                key={q.id?.toString() || index} 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`border rounded-lg p-4 ${isCorrect ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-900/50' : 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-900/50'}`}
              >
                <div className="flex gap-3">
                  <div className="mt-0.5">
                    {isCorrect ? (
                      <Check className="h-5 w-5 text-green-600 dark:text-green-400" />
                    ) : (
                      <X className="h-5 w-5 text-red-600 dark:text-red-400" />
                    )}
                  </div>
                  
                  <div>
                    <p className="font-medium mb-1">Q{index + 1}: {questionText}</p>
                    <div className="text-sm">
                      <p className={isCorrect ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                        Your answer: {answer?.userAnswer || answer?.selectedOption || answer?.selectedOptionId || answer?.answer || 'Not answered'}
                      </p>
                      {!isCorrect && (
                        <p className="text-green-600 dark:text-green-400 mt-1">
                          Correct answer: {q.correctAnswer || q.answer || q.correctOptionId || "Answer unavailable"}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
      
      <div className="flex flex-col sm:flex-row justify-between gap-4 pt-6 border-t">
        <div className="flex flex-wrap gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleDownload}
            className="flex items-center gap-1"
          >
            <Download className="h-4 w-4" />
            <span>Download</span>
          </Button>
          
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleShare}
            className="flex items-center gap-1"
          >
            <Share2 className="h-4 w-4" />
            <span>Share</span>
          </Button>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/dashboard/quizzes")}
            className="flex items-center gap-1"
          >
            <Home className="h-4 w-4" />
            <span>Back to Quizzes</span>
          </Button>
          
          <Button
            variant="default"
            size="sm"
            onClick={() => router.push(`/dashboard/mcq/${safeResult.slug}`)}
            className="flex items-center gap-1"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Retry Quiz</span>
          </Button>
        </div>
      </div>
    </div>
  )
}
