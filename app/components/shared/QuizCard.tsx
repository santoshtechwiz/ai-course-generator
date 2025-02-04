"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  CheckSquare,
  Clock,
  HelpCircle,
  Zap,
  Brain,
  Target,
  Sparkles,
  CheckCircle2,
  PenLine,
  Puzzle,
  ArrowRight,
  Loader2,
} from "lucide-react"
import { Card, CardHeader, CardContent, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
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
  code: PenLine,
}

const quizTypeColors = {
  mcq: "text-blue-500 dark:text-blue-400",
  openended: "text-green-500 dark:text-green-400",
  "fill-blanks": "text-purple-500 dark:text-purple-400",
  code: "text-yellow-500 dark:text-yellow-400",
}

const quizTypeLabels = {
  mcq: "Multiple Choice",
  openended: "Open-Ended",
  "fill-blanks": "Fill in the Blanks",
  code: "Code",
}

const quizTypeDescriptions = {
  mcq: {
    title: "Test Your Knowledge",
    description: "Choose from carefully crafted options to demonstrate your understanding.",
    benefits: ["Quick assessment", "Immediate feedback", "Clear right/wrong answers"],
    icon: Target,
  },
  openended: {
    title: "Express Your Understanding",
    description: "Articulate your knowledge in your own words for deeper learning.",
    benefits: ["Deep understanding", "Creative thinking", "Detailed explanations"],
    icon: Brain,
  },
  "fill-blanks": {
    title: "Complete the Puzzle",
    description: "Fill in missing pieces to strengthen your recall ability.",
    benefits: ["Memory enhancement", "Context understanding", "Precise learning"],
    icon: Sparkles,
  },
  code: {
    title: "Code Challenge",
    description: "Write and test your coding skills with hands-on exercises.",
    benefits: ["Practical application", "Syntax mastery", "Problem-solving skills"],
    icon: PenLine,
  },
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
  const [isExpanded, setIsExpanded] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const QuizTypeIcon = quizTypeIcons[quizType]
  const quizTypeInfo = quizTypeDescriptions[quizType]
  const TypeBenefitIcon = quizTypeInfo.icon
  const colors = quizTypeColors[quizType]

  const handleStartQuiz = () => {
    setIsLoading(true)
    // Simulate loading for 1 second before navigating
    setTimeout(() => {
      setIsLoading(false)
      // Navigate to the quiz page
      window.location.href = `/dashboard/${quizType === "fill-blanks" ? "blanks" : quizType}/${slug}`
    }, 1000)
  }

  return (
    <Card
      className={cn(
        "w-full max-w-sm mx-auto transition-all duration-300 hover:shadow-lg",
        isExpanded ? "shadow-lg" : "shadow",
      )}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >
      <CardHeader>
        <div className="flex items-center justify-between mb-2">
          <Badge variant="secondary" className={cn("font-medium", colors)}>
            <QuizTypeIcon className="w-4 h-4 mr-1" />
            {quizTypeLabels[quizType]}
          </Badge>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  {estimatedTime}
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Estimated completion time</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium">{questionCount} Questions</span>
          </div>
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium">Boost Knowledge</span>
          </div>
        </div>
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              className="space-y-4"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div>
                <h3 className={cn("text-lg font-semibold mb-2", colors)}>{quizTypeInfo.title}</h3>
                <p className="text-sm text-muted-foreground mb-4">{quizTypeInfo.description}</p>
                <ul className="space-y-2">
                  {quizTypeInfo.benefits.map((benefit, index) => (
                    <li key={index} className="flex items-center gap-2 text-sm">
                      <CheckSquare className={cn("w-4 h-4", colors)} />
                      {benefit}
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
      <CardFooter className="flex justify-end">
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.2 }}
            >
              <Button onClick={handleStartQuiz} disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading
                  </>
                ) : (
                  <>
                    Start Quiz
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </CardFooter>
    </Card>
  )
}

