"use client"

import type React from "react"
import { motion } from "framer-motion"
import { Clock, CheckCircle2, PenLine, Puzzle, Code, ChevronRight, HelpCircle } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { Progress } from "@/components/ui/progress"

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
  mcq: "bg-green-500 text-green-50",
  openended: "bg-blue-500 text-blue-50",
  "fill-blanks": "bg-yellow-500 text-yellow-900",
  code: "bg-purple-500 text-purple-50",
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
      className="m-2"
    >
      <Card className="w-full h-full shadow-md rounded-lg border border-gray-200 dark:border-gray-700 overflow-visible">
        <Link href={`/dashboard/${quizType === "fill-blanks" ? "blanks" : quizType}/${slug}`} className="block h-full">
          <CardContent className="flex flex-col h-full p-6 pt-10 relative">
            {/* Quiz Type Icon */}
            <div className={`absolute -top-5 left-4 ${quizTypeColors[quizType]} p-2 rounded-full shadow-md`}>
              <QuizTypeIcon className="w-6 h-6" />
            </div>

            {/* Title and Description */}
            <h3 className="text-lg font-bold mb-1 text-primary">{title}</h3>
            <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{description}</p>

            {/* Info */}
            <div className="text-xs text-muted-foreground mb-3 flex items-center space-x-4">
              <div className="flex items-center">
                <Clock className="w-4 h-4 mr-1" /> {estimatedTime}
              </div>
              <div className="flex items-center">
                <HelpCircle className="w-4 h-4 mr-1" /> {questionCount} questions
              </div>
            </div>

            {/* Progress */}
            <div className="mb-3">
              <div className="text-sm font-medium mb-1 text-primary">Completion Rate</div>
              <Progress value={completionRate} className="h-2" />
            </div>

            {/* Start Quiz Button */}
            <div className="flex justify-between items-center mt-auto">
              <Badge className={`px-3 py-1 text-xs font-medium ${quizTypeColors[quizType]}`}>
                {quizTypeLabels[quizType]}
              </Badge>
              <div className="text-primary font-semibold flex items-center">
                Start Quiz <ChevronRight className="w-4 h-4 ml-1" />
              </div>
            </div>
          </CardContent>
        </Link>
      </Card>
    </motion.div>
  )
}

