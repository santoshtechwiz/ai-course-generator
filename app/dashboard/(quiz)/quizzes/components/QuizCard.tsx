"use client"

import { useState, memo } from "react"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { FileQuestion, AlignJustify, Code, PenTool, Clock, CheckCircle2, Flashlight } from "lucide-react"
import Link from "next/link"
import { LoadingCard } from "./LoadingCard"

interface QuizCardProps {
  title: string
  description: string
  questionCount: number
  isPublic?: boolean
  slug: string
  quizType: "mcq" | "openended" | "fill-blanks" | "code" | "flashcard"
  estimatedTime: string
  completionRate?: number
}

function QuizCardComponent({
  title,
  description,
  questionCount,
  isPublic = false,
  slug,
  quizType,
  estimatedTime,
  completionRate = 0,
}: QuizCardProps) {
  const [isLoading, setIsLoading] = useState(false)

  // Update the quizTypeInfo object to ensure it properly handles all quiz types
  const quizTypeInfo = {
    mcq: {
      label: "Multiple Choice",
      icon: FileQuestion,
      color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
    },
    openended: {
      label: "Open Ended",
      icon: AlignJustify,
      color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
    },
    code: {
      label: "Code",
      icon: Code,
      color: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
    },
    "fill-blanks": {
      label: "Fill in the Blanks",
      icon: PenTool,
      color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
    },
    flashcard: {
      label: "Flash Card",
      icon: Flashlight,
      color: "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300",
    },
  }

  // Update the destructuring to use a fallback for unknown quiz types
  const {
    label,
    icon: Icon,
    color,
  } = quizTypeInfo[quizType] || {
    label: "Quiz",
    icon: FileQuestion,
    color: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300",
  }

  const handleClick = () => {
    setIsLoading(true)
    // The actual navigation will be handled by Next.js Link
  }

  if (isLoading) {
    return (
      <Card className="h-full overflow-hidden">
        <LoadingCard message="Loading quiz..." />
      </Card>
    )
  }

  return (
    <Card className="h-full overflow-hidden flex flex-col">
      <CardHeader className="p-4 pb-0">
        <div className="flex justify-between items-start">
          <Badge variant="outline" className={`${color} font-normal`}>
            <Icon className="mr-1 h-3 w-3" />
            {label}
          </Badge>
          {isPublic && (
            <Badge variant="secondary" className="font-normal">
              Public
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-4 flex-grow">
        <h3 className="font-semibold text-lg mb-2 line-clamp-2">{title}</h3>
        <p className="text-muted-foreground text-sm mb-4 line-clamp-3">{description}</p>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-muted/50 p-3 rounded-lg flex flex-col items-center justify-center">
            <span className="text-2xl font-bold">{questionCount}</span>
            <span className="text-xs text-muted-foreground">Questions</span>
          </div>
          <div className="bg-muted/50 p-3 rounded-lg flex flex-col items-center justify-center">
            <div className="flex items-center">
              <Clock className="h-4 w-4 mr-1 text-muted-foreground" />
              <span className="text-lg font-semibold">{estimatedTime}</span>
            </div>
            <span className="text-xs text-muted-foreground">Estimated</span>
          </div>
        </div>

        {completionRate > 0 && (
          <div className="space-y-1 mb-4">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Completion</span>
              <span className="font-medium">{Math.round(completionRate)}%</span>
            </div>
            <Progress value={completionRate} className="h-2" />
          </div>
        )}
      </CardContent>
      <CardFooter className="p-4 pt-0 mt-auto">
        <Link href={`/dashboard/${quizType}/${slug}`} className="w-full" onClick={handleClick}>
          <Button variant="default" className="w-full">
            {completionRate >= 100 ? (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Review Quiz
              </>
            ) : completionRate > 0 ? (
              "Continue Quiz"
            ) : (
              "Start Quiz"
            )}
          </Button>
        </Link>
      </CardFooter>
    </Card>
  )
}

// Memoize the component to prevent unnecessary re-renders
export const QuizCard = memo(QuizCardComponent)
