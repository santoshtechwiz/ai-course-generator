"use client"

import type React from "react"
import { motion } from "framer-motion"
import { Clock, HelpCircle, ChevronRight, CheckCircle2, PenLine, Puzzle, Code, Lock, Unlock } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { cn } from "@/lib/utils"
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
  mcq: "from-blue-500 to-blue-600",
  openended: "from-green-500 to-green-600",
  "fill-blanks": "from-purple-500 to-purple-600",
  code: "from-yellow-500 to-yellow-600",
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
  const quizColor = quizTypeColors[quizType]

  return (
    <motion.div whileHover={{ scale: 1.02 }} transition={{ type: "spring", stiffness: 400, damping: 17 }}>
      <Card className={cn("overflow-hidden w-full h-full bg-gradient-to-br", quizColor)}>
        <Link href={`/dashboard/${quizType === "fill-blanks" ? "blanks" : quizType}/${slug}`} className="block h-full">
          <CardContent className="flex flex-col h-full p-6 text-white relative">
            {/* Public/Private Badge */}
            <Badge
              variant="outline"
              className="absolute top-4 right-4 bg-white/20 backdrop-blur-sm border-white/40 text-white whitespace-nowrap"
            >
              {isPublic ? (
                <Unlock className="w-4 h-4 mr-1 flex-shrink-0" />
              ) : (
                <Lock className="w-4 h-4 mr-1 flex-shrink-0" />
              )}
              {isPublic ? "Public" : "Private"}
            </Badge>

            {/* Quiz Type Badge */}
            <div className="mb-4">
              <Badge
                variant="secondary"
                className="px-3 py-1 text-sm font-medium bg-white/20 backdrop-blur-sm text-white whitespace-nowrap"
              >
                <QuizTypeIcon className="w-4 h-4 mr-2 flex-shrink-0" />
                <span className="truncate">{quizTypeLabels[quizType]}</span>
              </Badge>
            </div>

            {/* Title and Description */}
            <h3 className="text-xl font-bold mb-2 line-clamp-2">{title}</h3>
            <p className="text-sm opacity-90 mb-4 line-clamp-3 flex-grow">{description}</p>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4 text-sm mb-6">
              <div className="flex items-center justify-center bg-white/20 backdrop-blur-sm rounded-lg p-2">
                <HelpCircle className="w-5 h-5 mr-2 flex-shrink-0" />
                <div className="text-center">
                  <span className="font-bold text-lg">{questionCount}</span>
                  <span className="block text-xs opacity-75">Questions</span>
                </div>
              </div>
              <div className="flex items-center justify-center bg-white/20 backdrop-blur-sm rounded-lg p-2">
                <Clock className="w-5 h-5 mr-2 flex-shrink-0" />
                <div className="text-center">
                  <span className="font-bold text-lg">{estimatedTime}</span>
                  <span className="block text-xs opacity-75">Est. Time</span>
                </div>
              </div>
            </div>

            {/* Completion Rate */}
            <div className="mb-4">
              <div className="text-sm font-medium mb-1">Completion Rate</div>
              <Progress value={completionRate} className="h-2 bg-white/20" />
            </div>

            {/* Start Quiz Button */}
            <div
              className={cn(
                "py-3 px-4 bg-white text-black font-semibold rounded-lg",
                "flex items-center justify-center",
                "transition-all duration-300 hover:bg-opacity-90",
                "focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50",
                "shadow-md hover:shadow-lg",
              )}
            >
              <span className="mr-2">Start Quiz</span>
              <ChevronRight className="w-5 h-5 flex-shrink-0" />
            </div>
          </CardContent>
        </Link>
      </Card>
    </motion.div>
  )
}