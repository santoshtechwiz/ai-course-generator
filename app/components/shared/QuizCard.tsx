"use client"

import { type FC, useState } from "react"
import Link from "next/link"
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
} from "lucide-react"
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
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
  mcq: {
    gradient: "from-blue-400 to-blue-600 dark:from-blue-600 dark:to-blue-800",
    badge: "bg-blue-500",
    text: "text-blue-600 dark:text-blue-400",
  },
  openended: {
    gradient: "from-green-400 to-green-600 dark:from-green-600 dark:to-green-800",
    badge: "bg-green-500",
    text: "text-green-600 dark:text-green-400",
  },
  "fill-blanks": {
    gradient: "from-purple-400 to-purple-600 dark:from-purple-600 dark:to-purple-800",
    badge: "bg-purple-500",
    text: "text-purple-600 dark:text-purple-400",
  },
  code: {
    gradient: "from-yellow-400 to-yellow-600 dark:from-yellow-600 dark:to-yellow-800",
    badge: "bg-yellow-500",
    text: "text-yellow-600 dark:text-yellow-400",
  },
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

export const QuizCard: FC<QuizCardProps> = ({
  title,
  questionCount,
  slug,
  quizType,
  estimatedTime = "5 min",
  description,
  isPublic = false,
}) => {
  const [isFlipped, setIsFlipped] = useState(false)
  const QuizTypeIcon = quizTypeIcons[quizType]
  const quizTypeInfo = quizTypeDescriptions[quizType]
  const TypeBenefitIcon = quizTypeInfo.icon
  const colors = quizTypeColors[quizType]

  return (
    <motion.div
      className="relative w-full max-w-xs mx-auto cursor-pointer"
      style={{ perspective: "1000px" }} // Add perspective for 3D effect
      onMouseEnter={() => setIsFlipped(true)}
      onMouseLeave={() => setIsFlipped(false)}
    >
      <motion.div
        className="relative w-full h-80" // Fixed height for consistent size
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.6, ease: "easeInOut" }}
        style={{ transformStyle: "preserve-3d" }} // Enable 3D transformations
      >
        {/* Front Card */}
        <motion.div
          className="absolute w-full h-full"
          style={{ backfaceVisibility: "hidden" }} // Hide the back of the card
        >
          <Card
            className={cn(
              "h-full overflow-hidden",
              "transition-all duration-300",
              "hover:shadow-lg hover:scale-105",
              "bg-gradient-to-br",
              colors.gradient,
            )}
          >
            <CardHeader className="relative p-4 pb-0">
              <div className="flex items-center justify-between mb-2">
                <Badge className={cn("font-medium text-white px-2 py-1 text-xs", colors.badge)}>
                  <QuizTypeIcon className="w-3 h-3 mr-1" />
                  {quizTypeLabels[quizType]}
                </Badge>
                <div className="flex items-center gap-1 text-xs text-white">
                  <Clock className="w-3 h-3" />
                  {estimatedTime}
                </div>
              </div>
              <CardTitle className="text-lg font-bold text-white">{title}</CardTitle>
            </CardHeader>

            <CardContent className="p-4 pt-2 space-y-3">
              <div className="flex flex-col items-start gap-2">
                <div className="flex items-center gap-1 px-2 py-1 rounded-md text-xs bg-white/20 text-white">
                  <HelpCircle className="w-3 h-3" />
                  <span className="font-medium">{questionCount} Questions</span>
                </div>
                <div className="flex items-center gap-1 px-2 py-1 rounded-md text-xs bg-white/20 text-white">
                  <Zap className="w-3 h-3" />
                  <span className="font-medium">Boost Knowledge</span>
                </div>
              </div>

              <p className="text-xs text-white/90 line-clamp-2">{description}</p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Back Card */}
        <motion.div
          className="absolute w-full h-full"
          style={{ rotateY: 180, backfaceVisibility: "hidden" }} // Flip and hide the front
        >
          <Card className={cn("h-full overflow-hidden bg-white dark:bg-gray-800 shadow-lg")}>
            <CardContent className="flex flex-col items-center justify-center h-full p-4 text-center space-y-3">
              <TypeBenefitIcon className={cn("w-8 h-8 mb-1", colors.text)} />
              <div>
                <h2 className={cn("text-base font-semibold mb-1", colors.text)}>{quizTypeInfo.title}</h2>
                <p className="text-xs mb-2 text-gray-600 dark:text-gray-300">{quizTypeInfo.description}</p>
              </div>

              <ul className="space-y-1 text-xs text-gray-600 dark:text-gray-300">
                {quizTypeInfo.benefits.map((benefit, index) => (
                  <li key={index} className="flex items-center gap-1">
                    <CheckSquare className={cn("w-3 h-3 flex-shrink-0", colors.text)} />
                    {benefit}
                  </li>
                ))}
              </ul>

              <Link
                href={`/dashboard/${quizType === "fill-blanks" ? "blanks" : quizType}/${slug}`}
                className={cn(
                  "inline-flex items-center px-3 py-2",
                  "text-white text-sm font-medium",
                  "rounded-md shadow-lg whitespace-nowrap",
                  "transition-colors hover:opacity-90",
                  "group/button",
                  colors.badge,
                )}
                aria-label={`Start ${title} Quiz`}
              >
                Start Quiz
                <ArrowRight className="ml-1 w-4 h-4 transition-transform group-hover/button:translate-x-1" />
              </Link>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </motion.div>
  )
}