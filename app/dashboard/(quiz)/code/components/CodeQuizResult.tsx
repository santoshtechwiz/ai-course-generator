"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Check, X, RefreshCw, Home, Download, Share2, AlertCircle } from "lucide-react"
import { toast } from "sonner"
import React from "react"
import { CodeQuestion, CodeAnswer, type CodeQuizResult } from "./types"

interface CodeQuizResultProps {
  result: CodeQuizResult;
}

export default function CodeQuizResult({ result }: CodeQuizResultProps) {
  const router = useRouter()

  if (!result) {
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

  const safeResult = result
  const hasQuestionDetails = safeResult.questions && 
                            Array.isArray(safeResult.questions) && 
                            safeResult.questions.length > 0
  const quizSlug = safeResult.slug;

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: `${safeResult.title} - Quiz Results`,
          text: `I scored ${safeResult.percentage}% on the ${safeResult.title} quiz!`,
          url: window.location.href
        })
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(window.location.href)
        toast.success("Link copied to clipboard")
      } else {
        toast.error("Sharing not supported on this device")
      }
    } catch (error) {
      console.error("Error sharing results:", error)
      toast.error("Failed to share results")
    }
  }

  const handleDownload = () => {
    try {
      const resultText = `
Code Quiz Results: ${safeResult.title}
Date: ${new Date(safeResult.completedAt).toLocaleString()}
Score: ${safeResult.score}/${safeResult.maxScore} (${safeResult.percentage}%)

${hasQuestionDetails ? `Question Summary:
${safeResult.questions!.map((q, i) => {
  if (!q) return `Q${i + 1}: Question data unavailable\n`;
  
  const userAnswer = safeResult.answers?.find(a => 
    a && q && a.questionId?.toString() === q.id?.toString()
  )
  const isCorrect = userAnswer?.isCorrect ?? false
  const questionText = q.question || q.text || `Question ${i + 1}`
  const userAnswerText = userAnswer?.selectedOptionId || 'Not answered'
  
  // Find the selected option to get its text
  const selectedOption = q.options?.find(opt => opt.id === userAnswer?.selectedOptionId);
  const selectedOptionText = selectedOption ? selectedOption.text : 'Unknown option';
  
  // Find the correct option
  const correctOption = q.options?.find(opt => opt.id === q.correctOptionId);
  const correctOptionText = correctOption ? correctOption.text : 'Unknown';
  
  return `
Q${i + 1}: ${questionText}
Your answer: ${selectedOptionText} (${userAnswerText})
Correct answer: ${correctOptionText} (${q.correctOptionId})
Result: ${isCorrect ? 'Correct' : 'Incorrect'}
`
}).join('\n')}` : 'No question details available for this quiz.'}
      `.trim()
      const blob = new Blob([resultText], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${safeResult.title.replace(/\s+/g, '-').toLowerCase()}-results.txt`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      toast.success("Results downloaded successfully")
    } catch (error) {
      console.error("Error downloading results:", error)
      toast.error("Failed to download results")
    }
  }

  // Add ref for review scroll
  const summaryRef = React.useRef<HTMLDivElement>(null)
  const handleReview = () => {
    summaryRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  return (
    <div className="space-y-8">
      {/* Score summary bar */}
      <div className="flex flex-col items-center justify-center gap-2">
        <h1 className="text-2xl font-bold">{safeResult.title}</h1>
        <div className="flex items-center gap-4 mt-2">
          <span className="text-3xl font-bold text-primary">{safeResult.score}/{safeResult.maxScore}</span>
          <span className="text-lg text-muted-foreground">({safeResult.percentage}%)</span>
        </div>
        <p className="text-muted-foreground">
          Completed on {new Date(safeResult.completedAt).toLocaleDateString()}
        </p>
        <Button
          variant="outline"
          size="sm"
          className="mt-2"
          onClick={handleReview}
        >
          Review Answers
        </Button>
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
              {safeResult.percentage >= 90 ? "Excellent! Your coding skills are outstanding." :
               safeResult.percentage >= 70 ? "Great job! You have a solid understanding of the code concepts." :
               safeResult.percentage >= 50 ? "Good effort! Keep practicing to improve your coding skills." :
               "Keep learning! Review the code concepts and try again."}
            </p>
          </div>
        </div>
      </div>
      
      {hasQuestionDetails && (
        <div className="space-y-4" ref={summaryRef}>
          <h2 className="text-xl font-semibold mb-4">Question Summary</h2>
          
          {safeResult.questions!.map((q, index) => {
            if (!q) return null; // Skip null/undefined questions
            
            const answer = safeResult.answers?.find(a => 
              a && q && a.questionId?.toString() === q.id?.toString()
            );
            
            const isCorrect = answer?.isCorrect || false;
            const questionText = q.question || q.text || `Question ${index + 1}`;
            
            // Find the selected option to get its text
            const selectedOption = q.options?.find(opt => opt.id === answer?.selectedOptionId);
            
            return (
              <div 
                key={q.id?.toString() || index} 
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
                  
                  <div className="w-full">
                    <p className="font-medium mb-1">Q{index + 1}: {questionText}</p>
                    
                    {q.codeSnippet && (
                      <div className="my-2 p-3 bg-gray-800 text-gray-100 rounded text-sm font-mono overflow-x-auto">
                        <pre>{q.codeSnippet}</pre>
                      </div>
                    )}
                    
                    <div className="text-sm">
                      <p className={isCorrect ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                        Your answer: {selectedOption?.text || answer?.selectedOptionId || 'Not answered'}
                      </p>
                      {!isCorrect && (
                        <p className="text-green-600 dark:text-green-400 mt-1">
                          Correct answer: {q.options?.find(opt => opt.id === q.correctOptionId)?.text || q.correctOptionId || "Answer unavailable"}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
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
            onClick={() => router.push(`/dashboard/code/${quizSlug}`)}
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
