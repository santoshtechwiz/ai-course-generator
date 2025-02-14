"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Clock, HelpCircle, ChevronRight, CheckCircle2, PenLine, Puzzle, Code, Lock, Unlock } from "lucide-react"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
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
  mcq: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-100",
  openended: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-100",
  "fill-blanks": "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-100",
  code: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-100",
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
  const [isHovered, setIsHovered] = useState(false)
  const QuizTypeIcon = quizTypeIcons[quizType]
  const quizColor = quizTypeColors[quizType]

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      transition={{ type: "spring", stiffness: 300, damping: 10 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Card
        className={cn(
          "flex flex-col h-full overflow-hidden transition-all duration-300 hover:shadow-lg w-full sm:max-w-md",
          quizColor,
        )}
      >
        <CardContent className="flex-grow flex flex-col p-6">
          <div className="flex items-center justify-between mb-4">
            <Badge variant="secondary" className="px-2 py-1 bg-background/80 backdrop-blur-sm">
              <QuizTypeIcon className="w-4 h-4 mr-1 inline-block" />
              <span className="font-medium">{quizTypeLabels[quizType]}</span>
            </Badge>
            {isPublic ? (
              <Badge variant="outline" className="bg-background/80 backdrop-blur-sm">
                <Unlock className="w-4 h-4 mr-1 inline-block" /> Public
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-background/80 backdrop-blur-sm">
                <Lock className="w-4 h-4 mr-1 inline-block" /> Private
              </Badge>
            )}
          </div>
          <h3 className="text-xl font-semibold mb-2 line-clamp-2">{title}</h3>
          <p className="text-sm opacity-90 mb-4 line-clamp-3 flex-grow">{description}</p>
          <div className="grid grid-cols-2 gap-2 text-sm mb-4">
            <div className="flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm rounded-md p-2">
              <HelpCircle className="w-5 h-5 mb-1" />
              <span className="font-medium">{questionCount}</span>
              <span className="text-xs opacity-75">Questions</span>
            </div>
            <div className="flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm rounded-md p-2">
              <Clock className="w-5 h-5 mb-1" />
              <span className="font-medium">{estimatedTime}</span>
              <span className="text-xs opacity-75">Est. Time</span>
            </div>
          </div>
          <div className="mb-2">
            <div className="text-sm font-medium mb-1">Completion Rate</div>
            <Progress value={completionRate} className="h-2 bg-background/60"  />
          </div>
        </CardContent>
        <CardFooter className="p-6 pt-0">
          <Link href={`/dashboard/${quizType === "fill-blanks" ? "blanks" : quizType}/${slug}`} className="w-full">
            <Button
              variant="secondary"
              size="sm"
              className="w-full group bg-background/80 backdrop-blur-sm hover:bg-background/90"
            >
              <span className="mr-2">Start Quiz</span>
              <motion.div
                animate={{ x: isHovered ? 5 : 0 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </motion.div>
            </Button>
          </Link>
        </CardFooter>
      </Card>
    </motion.div>
  )
}

