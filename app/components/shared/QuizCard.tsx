"use client"

import type React from "react"
import { motion } from "framer-motion"
import { Clock, CheckCircle2, PenLine, Puzzle, Code, ChevronRight, HelpCircle } from "lucide-react"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"

interface QuizCardProps {
  title: string
  questionCount: number
  slug: string
  quizType: "mcq" | "openended" | "fill-blanks" | "code"
  estimatedTime?: string
  description: string
  isPublic?: boolean
  completionRate: number
}

const quizTypeIcons = {
  mcq: CheckCircle2,
  openended: PenLine,
  "fill-blanks": Puzzle,
  code: Code,
}

const quizTypeLabels = {
  mcq: "Multiple Choice",
  openended: "Open-Ended",
  "fill-blanks": "Fill in the Blanks",
  code: "Code Challenge",
}

const quizTypeColors = {
  mcq: "bg-green-500 text-green-50 dark:bg-green-700 dark:text-green-100",
  openended: "bg-blue-500 text-blue-50 dark:bg-blue-700 dark:text-blue-100",
  "fill-blanks": "bg-yellow-500 text-yellow-900 dark:bg-yellow-600 dark:text-yellow-100",
  code: "bg-purple-500 text-purple-50 dark:bg-purple-700 dark:text-purple-100",
}

export const QuizCard: React.FC<QuizCardProps> = ({
  title,
  questionCount,
  slug,
  quizType,
  estimatedTime = "5 min",
  description,
  isPublic = false,
  completionRate,
}) => {
  const QuizTypeIcon = quizTypeIcons[quizType]

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
      className="h-full"
    >
      <Card className="flex flex-col h-full shadow-md">
        <Link
          href={`/dashboard/${quizType === "fill-blanks" ? "blanks" : quizType}/${slug}`}
          className="flex flex-col h-full"
        >
          <CardHeader className="relative pb-2">
            <div className={cn("absolute -top-3 left-4 p-2 rounded-full shadow-md", quizTypeColors[quizType])}>
              <QuizTypeIcon className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-semibold mt-4">{title}</h3>
          </CardHeader>
          <CardContent className="flex-grow">
            <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{description}</p>
            <div className="text-xs text-muted-foreground mb-3 flex items-center space-x-4">
              <div className="flex items-center">
                <Clock className="w-4 h-4 mr-1" /> {estimatedTime}
              </div>
              <div className="flex items-center">
                <HelpCircle className="w-4 h-4 mr-1" /> {questionCount} questions
              </div>
            </div>
            <div className="mb-3">
              <div className="text-sm font-medium mb-1">Completion Rate</div>
              <Progress value={completionRate} className="h-2" />
            </div>
          </CardContent>
          <CardFooter className="flex justify-between items-center pt-2">
            <Badge variant="secondary" className={cn("px-2 py-1 text-xs font-medium", quizTypeColors[quizType])}>
              {quizTypeLabels[quizType]}
            </Badge>
            <div className="text-primary font-semibold flex items-center text-sm">
              Start Quiz <ChevronRight className="w-4 h-4 ml-1" />
            </div>
          </CardFooter>
        </Link>
      </Card>
    </motion.div>
  )
}

