"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Clock, HelpCircle, ChevronRight, CheckCircle2, PenLine, Puzzle, Code, Lock, Unlock } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import Link from "next/link"
import { cn } from "@/lib/utils"

interface QuizCardProps {
  title: string
  questionCount: number
  slug: string
  quizType: "mcq" | "openended" | "fill-blanks" | "code"
  estimatedTime?: string
  description: string
  isPublic?: boolean
}

const quizTypeIcons = {
  mcq: CheckCircle2,
  openended: PenLine,
  "fill-blanks": Puzzle,
  code: Code,
}

const quizTypeColors = {
  mcq: "bg-blue-100 text-blue-700 dark:bg-blue-700 dark:text-blue-100",
  openended: "bg-green-100 text-green-700 dark:bg-green-700 dark:text-green-100",
  "fill-blanks": "bg-purple-100 text-purple-700 dark:bg-purple-700 dark:text-purple-100",
  code: "bg-yellow-100 text-yellow-700 dark:bg-yellow-700 dark:text-yellow-100",
}

const quizTypeLabels = {
  mcq: "Multiple Choice",
  openended: "Open-Ended",
  "fill-blanks": "Fill in the Blanks",
  code: "Code Challenge",
}

export const QuizCard: React.FC<QuizCardProps> = ({
  title,
  questionCount,
  slug,
  quizType,
  estimatedTime = "5 min",
  description,
  isPublic = false,
}) => {
  const [isHovered, setIsHovered] = useState(false)
  const QuizTypeIcon = quizTypeIcons[quizType]
  const colors = quizTypeColors[quizType]

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      transition={{ type: "spring", stiffness: 300, damping: 10 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Card className="w-full max-w-lg mx-auto overflow-hidden transition-all duration-300 hover:shadow-lg">
        <CardContent className="p-0">
          <div className={cn("p-6 transition-colors duration-300", colors)}>
            <div className="flex items-center justify-between mb-4">
              <Badge variant="secondary" className="text-xs font-semibold uppercase">
                {quizTypeLabels[quizType]}
              </Badge>
              <QuizTypeIcon className="w-6 h-6" />
            </div>
            <h3 className="text-2xl font-bold mb-2 line-clamp-2">{title}</h3>
            <p className="text-base opacity-90 mb-4 line-clamp-2">{description}</p>
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center">
                <HelpCircle className="w-4 h-4 mr-1" />
                <span>{questionCount} Questions</span>
              </div>
              <div className="flex items-center">
                <Clock className="w-4 h-4 mr-1" />
                <span>{estimatedTime}</span>
              </div>
            </div>
          </div>
          <div className="p-6">
            <div className="mb-4">
              <div className="text-sm font-medium mb-1">Completion Rate</div>
              <Progress value={33} className="h-2" />
            </div>
            <div className="flex justify-between items-center">
              <div className="text-sm text-muted-foreground">{isPublic ? <Unlock /> : <Lock />}</div>
              <Link href={`/dashboard/${quizType === "fill-blanks" ? "blanks" : quizType}/${slug}`} passHref>
                <Button variant="ghost" className="p-0 h-auto">
                  <span className="mr-2">Start Quiz</span>
                  <motion.div
                    animate={{ x: isHovered ? 5 : 0 }}
                    transition={{ type: "spring", stiffness: 400, damping: 10 }}
                  >
                    <ChevronRight className="w-5 h-5" />
                  </motion.div>
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}