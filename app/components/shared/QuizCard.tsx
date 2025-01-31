"use client"

import type { FC } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
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
  "code": PenLine,
}

const quizTypePatterns = {
  mcq: (
    <svg
      className="absolute inset-0 w-full h-full opacity-[0.03] dark:opacity-[0.05]"
      xmlns="http://www.w3.org/2000/svg"
    >
      <pattern id="mcq-pattern" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
        <path d="M20 0L40 20L20 40L0 20L20 0Z" fill="currentColor" />
        <circle cx="20" cy="20" r="6" fill="currentColor" />
      </pattern>
      <rect x="0" y="0" width="100%" height="100%" fill="url(#mcq-pattern)" />
    </svg>
  ),
  openended: (
    <svg
      className="absolute inset-0 w-full h-full opacity-[0.03] dark:opacity-[0.05]"
      xmlns="http://www.w3.org/2000/svg"
    >
      <pattern id="openended-pattern" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
        <path d="M0 0h60v60H0z" fill="none" />
        <path d="M0 0h30v30H0z M30 30h30v30H30z" fill="currentColor" />
      </pattern>
      <rect x="0" y="0" width="100%" height="100%" fill="url(#openended-pattern)" />
    </svg>
  ),
  "fill-blanks": (
    <svg
      className="absolute inset-0 w-full h-full opacity-[0.03] dark:opacity-[0.05]"
      xmlns="http://www.w3.org/2000/svg"
    >
      <pattern id="fillblanks-pattern" x="0" y="0" width="50" height="50" patternUnits="userSpaceOnUse">
        <path d="M25,0 L50,25 L25,50 L0,25 L25,0z M25,10 L40,25 L25,40 L10,25 L25,10z" fill="currentColor" />
      </pattern>
      <rect x="0" y="0" width="100%" height="100%" fill="url(#fillblanks-pattern)" />
    </svg>
  ),
  "code": (
    <svg
      className="absolute inset-0 w-full h-full opacity-[0.03] dark:opacity-[0.05]"
      xmlns="http://www.w3.org/2000/svg"
    >
      <pattern id="fillblanks-pattern" x="0" y="0" width="50" height="50" patternUnits="userSpaceOnUse">
        <path d="M25,0 L50,25 L25,50 L0,25 L25,0z M25,10 L40,25 L25,40 L10,25 L25,10z" fill="currentColor" />
      </pattern>
      <rect x="0" y="0" width="100%" height="100%" fill="url(#fillblanks-pattern)" />
    </svg>
  ),
}

const quizTypeColors = {
  mcq: {
    gradient: ["#3b82f6", "#2563eb"],
    badge: "bg-blue-500",
    light: "bg-blue-50 dark:bg-blue-950/30",
    border: "border-blue-200 dark:border-blue-800",
    text: "text-blue-600 dark:text-blue-400",
    shadow: "shadow-blue-500/25",
  },
  openended: {
    gradient: ["#22c55e", "#16a34a"],
    badge: "bg-green-500",
    light: "bg-green-50 dark:bg-green-950/30",
    border: "border-green-200 dark:border-green-800",
    text: "text-green-600 dark:text-green-400",
    shadow: "shadow-green-500/25",
  },
  "fill-blanks": {
    gradient: ["#a78bfa", "#7c3aed"],
    badge: "bg-purple-500",
    light: "bg-purple-50 dark:bg-purple-950/30",
    border: "border-purple-200 dark:border-purple-800",
    text: "text-purple-600 dark:text-purple-400",
    shadow: "shadow-purple-500/25",
  },
  code: {
    gradient: ["#f59e0b", "#d97706"],
    badge: "bg-yellow-500",
    light: "bg-yellow-50 dark:bg-yellow-950/30",
    border: "border-yellow-200 dark:border-yellow-800",
    text: "text-yellow-600 dark:text-yellow-400",
    shadow: "shadow-yellow-500/25",
  },
}

const quizTypeLabels = {
  mcq: "Multiple Choice",
  openended: "Open-Ended",
  "fill-blanks": "Fill in the Blanks",
  "code": "Code",
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
  "code": {
    title: "Complete the Puzzle",
    description: "Fill in missing pieces to strengthen your recall ability.",
    benefits: ["Memory enhancement", "Context understanding", "Precise learning"],
    icon: Sparkles,
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
  const QuizTypeIcon = quizTypeIcons[quizType]
  const quizTypeInfo = quizTypeDescriptions[quizType]
  const TypeBenefitIcon = quizTypeInfo.icon
  const colors = quizTypeColors[quizType]

  return (
    <motion.div
      className="group relative w-full max-w-xs mx-auto [perspective:1000px]"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="relative h-[280px] w-full rounded-xl shadow-lg transition-all duration-500 [transform-style:preserve-3d] group-hover:[transform:rotateY(180deg)]">
        {/* Front Face */}
        <div className="absolute inset-0 h-full w-full rounded-xl [backface-visibility:hidden]">
          <Card
            className={cn(
              "h-full overflow-hidden",
              "transition-all duration-300",
              "hover:shadow-lg",
              colors.border,
              "relative",
              "dark:bg-card dark:text-card-foreground",
            )}
          >
            {/* Background Pattern */}
            {quizTypePatterns[quizType]}

            {/* Floating Icons */}
            <div className="absolute inset-0 overflow-hidden">
              {[...Array(3)].map((_, i) => (
                <motion.div
                  key={i}
                  className={cn("absolute", colors.text, "opacity-10")}
                  animate={{
                    y: [0, -20, 0],
                    x: Math.sin((i * Math.PI) / 3) * 10,
                    scale: [1, 1.2, 1],
                    rotate: [0, 10, 0],
                  }}
                  transition={{
                    duration: 3,
                    delay: i * 0.4,
                    repeat: Number.POSITIVE_INFINITY,
                    ease: "easeInOut",
                  }}
                  style={{
                    left: `${20 + i * 25}%`,
                    top: `${30 + i * 20}%`,
                    fontSize: `${Math.max(16, 24 + i * 8)}px`,
                  }}
                >
                  <QuizTypeIcon size={24 + i * 8} />
                </motion.div>
              ))}
            </div>

            <CardHeader className="relative p-4 pb-0">
              <div className="flex items-center justify-between mb-2">
                <Badge className={cn("font-medium text-white px-2 py-1 text-xs", colors.badge)}>
                  <QuizTypeIcon className="w-3 h-3 mr-1" />
                  {quizTypeLabels[quizType]}
                </Badge>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  {estimatedTime}
                </div>
              </div>
              <CardTitle className="text-lg font-bold relative z-10">{title}</CardTitle>
            </CardHeader>

            <CardContent className="p-4 pt-2 space-y-3 relative z-10">
              <div className="flex flex-col items-start gap-2">
                <div
                  className={cn(
                    "flex items-center gap-1 px-2 py-1 rounded-md text-xs",
                    colors.light,
                    "backdrop-blur-sm",
                  )}
                >
                  <HelpCircle className={cn("w-3 h-3", colors.text)} />
                  <span className="font-medium">{questionCount} Questions</span>
                </div>
                <div
                  className={cn(
                    "flex items-center gap-1 px-2 py-1 rounded-md text-xs",
                    colors.light,
                    "backdrop-blur-sm",
                  )}
                >
                  <Zap className={cn("w-3 h-3", colors.text)} />
                  <span className="font-medium">Boost Knowledge</span>
                </div>
              </div>

              <p className="text-xs text-muted-foreground line-clamp-2 relative z-10">{description}</p>
            </CardContent>

            {/* Gradient Overlay */}
            <div
              className={cn(
                "absolute bottom-0 left-0 right-0 h-24",
                "bg-gradient-to-t from-background via-background/80 to-transparent",
              )}
            />

            {/* Hover Effect Overlay */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-br from-primary/5 to-primary/10 rounded-xl" />
          </Card>
        </div>

        {/* Back Face */}
        <div className="absolute inset-0 h-full w-full rounded-xl p-4 [transform:rotateY(180deg)] [backface-visibility:hidden]">
          <Card
            className={cn(
              "h-full overflow-hidden border-2",
              "bg-gradient-to-br",
              "from-primary to-primary-foreground",
              "text-primary-foreground",
            )}
          >
            <CardContent className="flex flex-col items-center justify-center h-full p-4 text-center space-y-3">
              <TypeBenefitIcon className="w-8 h-8 mb-1" />
              <div>
                <h2 className="text-base font-semibold mb-1">{quizTypeInfo.title}</h2>
                <p className="text-xs mb-2 text-primary-foreground/90">{quizTypeInfo.description}</p>
              </div>

              <ul className="space-y-1 text-xs text-primary-foreground/90">
                {quizTypeInfo.benefits.map((benefit, index) => (
                  <li key={index} className="flex items-center gap-1">
                    <CheckSquare className="w-3 h-3 flex-shrink-0" />
                    {benefit}
                  </li>
                ))}
              </ul>

              <Link
                href={`/dashboard/${quizType === "fill-blanks" ? "blanks" : quizType}/${slug}`}
                className={cn(
                  "inline-flex items-center px-3 py-2",
                  "text-primary text-sm font-medium bg-background",
                  "rounded-md shadow-lg whitespace-nowrap",
                  "hover:bg-background/90 transition-colors",
                  "group/button",
                )}
                aria-label={`Start ${title} Quiz`}
              >
                Start Quiz
                <ArrowRight className="ml-1 w-4 h-4 transition-transform group-hover/button:translate-x-1" />
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </motion.div>
  )
}

