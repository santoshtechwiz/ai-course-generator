"use client"

import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Check, X, RefreshCw, Home, Download, Share2 } from "lucide-react"
import { toast } from "sonner"

// Use a more compatible type definition
interface QuizAnswer {
  questionId: string | number;
  answer?: string;
  selectedOption?: string;
  isCorrect?: boolean;
}

interface QuizQuestion {
  id: string | number;
  question: string;
  options: string[];
  answer: string;
  correctAnswer?: string;
}

interface QuizResult {
  quizId: string | number;
  slug: string;
  title: string;
  questions: QuizQuestion[];
  answers: QuizAnswer[];
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

  useEffect(() => {
    // Simulate loading time
    const timer = setTimeout(() => setIsLoading(false), 500)
    return () => clearTimeout(timer)
  }, [])
  
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

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: `${result.title} - Quiz Results`,
          text: `I scored ${result.percentage}% on the ${result.title} quiz!`,
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
Quiz Results: ${result.title}
Date: ${new Date(result.completedAt).toLocaleString()}
Score: ${result.score}/${result.maxScore} (${result.percentage}%)

Question Summary:
${result.questions.map((q, i) => {
  const userAns = result.answers.find(a => a.questionId.toString() === q.id.toString());
  const isCorrect = userAns?.isCorrect || false;
  
  return `
Q${i + 1}: ${q.question}
Your answer: ${userAns?.selectedOption || userAns?.answer || 'Not answered'}
Correct answer: ${q.correctAnswer || q.answer}
Result: ${isCorrect ? 'Correct' : 'Incorrect'}
`;
}).join('\n')}
    `.trim();
    
    // Create and download file
    const blob = new Blob([resultText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${result.title.replace(/\s+/g, '-').toLowerCase()}-results.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-2">{result.title}</h1>
        <p className="text-muted-foreground">
          Completed on {new Date(result.completedAt).toLocaleDateString()}
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
                stroke={result.percentage >= 70 ? "#4CAF50" : result.percentage >= 40 ? "#FF9800" : "#F44336"}
                strokeWidth="10"
                strokeDasharray={`${result.percentage} 100`}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-3xl font-bold">{result.percentage}%</span>
            </div>
          </div>
          
          <div className="text-center">
            <p className="text-xl font-semibold mb-1">
              {result.score} out of {result.maxScore} correct
            </p>
            <p className="text-muted-foreground">
              {result.percentage >= 90 ? "Excellent! You've mastered this topic." :
               result.percentage >= 70 ? "Great job! You have a solid understanding." :
               result.percentage >= 50 ? "Good effort! Keep practicing to improve." :
               "Keep learning! Review the material and try again."}
            </p>
          </div>
        </div>
      </div>
      
      <div className="space-y-4">
        <h2 className="text-xl font-semibold mb-4">Question Summary</h2>
        
        {result.questions.map((q, index) => {
          const answer = result.answers.find(a => a.questionId.toString() === q.id.toString());
          const isCorrect = answer?.isCorrect || false;
          
          return (
            <motion.div 
              key={q.id.toString()} 
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
                  <p className="font-medium mb-1">Q{index + 1}: {q.question}</p>
                  <div className="text-sm">
                    <p className={isCorrect ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                      Your answer: {answer?.selectedOption || answer?.answer || 'Not answered'}
                    </p>
                    {!isCorrect && (
                      <p className="text-green-600 dark:text-green-400 mt-1">
                        Correct answer: {q.correctAnswer || q.answer}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
      
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
            onClick={() => router.push(`/dashboard/mcq/${result.slug}`)}
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
