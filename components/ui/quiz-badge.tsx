"use client"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { QuizType } from "@/app/types/quiz-types"
import { FileQuestion, BookOpen, Code2, PenTool, StickyNote } from "lucide-react"
import { memo } from "react"

interface QuizBadgeProps {
  quizType: QuizType | string
  className?: string
  showIcon?: boolean
  responsive?: boolean
  variant?: "default" | "outline" | "colored" | "gradient"
  size?: "sm" | "md" | "lg"
  children?: React.ReactNode
}

// Enhanced unified color schemes for quiz types with more consistent naming
const quizTypeColors = {
  mcq: {
    bg: "bg-blue-50 dark:bg-blue-900/30",
    text: "text-blue-700 dark:text-blue-400",
    border: "border-blue-200 dark:border-blue-800",
    gradient: "from-blue-400 to-sky-500",
    fullGradient: "bg-gradient-to-r from-indigo-500 to-blue-600 text-white border-0 shadow-md shadow-indigo-500/25"
  },
  openended: {
    bg: "bg-green-50 dark:bg-green-900/30",
    text: "text-green-700 dark:text-green-400",
    border: "border-green-200 dark:border-green-800",
    gradient: "from-green-400 to-emerald-500",
    fullGradient: "bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0 shadow-md shadow-purple-500/25"
  },
  code: {
    bg: "bg-purple-50 dark:bg-purple-900/30",
    text: "text-purple-700 dark:text-purple-400",
    border: "border-purple-200 dark:border-purple-800",
    gradient: "from-purple-400 to-violet-500",
    fullGradient: "bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0 shadow-md shadow-green-500/25"
  },
  blanks: {
    bg: "bg-amber-50 dark:bg-amber-900/30",
    text: "text-amber-700 dark:text-amber-400",
    border: "border-amber-200 dark:border-amber-800",
    gradient: "from-amber-400 to-yellow-500",
    fullGradient: "bg-gradient-to-r from-blue-500 to-cyan-500 text-white border-0 shadow-md shadow-blue-500/25"
  },
  "blanks": {
    bg: "bg-amber-50 dark:bg-amber-900/30",
    text: "text-amber-700 dark:text-amber-400",
    border: "border-amber-200 dark:border-amber-800",
    gradient: "from-amber-400 to-yellow-500",
    fullGradient: "bg-gradient-to-r from-blue-500 to-cyan-500 text-white border-0 shadow-md shadow-blue-500/25"
  },
  flashcard: {
    bg: "bg-orange-50 dark:bg-orange-900/30",
    text: "text-orange-700 dark:text-orange-400",
    border: "border-orange-200 dark:border-orange-800",
    gradient: "from-orange-400 to-red-500",
    fullGradient: "bg-gradient-to-r from-orange-500 to-amber-500 text-white border-0 shadow-md shadow-orange-500/25"
  },
  quiz: {
    bg: "bg-gray-50 dark:bg-gray-900/30",
    text: "text-gray-700 dark:text-gray-400",
    border: "border-gray-200 dark:border-gray-800",
    gradient: "from-gray-400 to-slate-500",
    fullGradient: "bg-gradient-to-r from-gray-500 to-gray-600 text-white border-0 shadow-md shadow-gray-500/25"
  }
}

const quizTypeLabels = {
  mcq: "Multiple Choice",
  openended: "Open Ended",
  code: "Code",
  blanks: "Fill in Blanks",
  "blanks": "Fill in Blanks",
  flashcard: "Flashcard",
  quiz: "Quiz"
}

const quizTypeIcons = {
  mcq: FileQuestion,
  openended: BookOpen,
  code: Code2,
  blanks: PenTool,
  "blanks": PenTool,
  flashcard: StickyNote,
  quiz: FileQuestion
}

const QuizBadge = ({ 
  quizType, 
  className, 
  showIcon = true, 
  responsive = false,
  variant = "default",
  size = "md",
  children
}: QuizBadgeProps) => {
  // Normalize quizType to handle string inputs
  const normalizedType = typeof quizType === 'string' ? quizType.toLowerCase() : 'quiz';
  
  // Fallback to quiz if type is not recognized
  const safeType = normalizedType in quizTypeColors ? normalizedType : "quiz";
  const colors = quizTypeColors[safeType as keyof typeof quizTypeColors];
  const label = quizTypeLabels[safeType as keyof typeof quizTypeLabels] || safeType;
  const Icon = quizTypeIcons[safeType as keyof typeof quizTypeIcons] || FileQuestion;
  
  // Allow custom content or use responsive/standard label
  const displayLabel = children ? children : responsive ? (
    <>
      <span className="hidden sm:inline">{label}</span>
      <span className="sm:hidden">{label.split(" ")[0]}</span>
    </>
  ) : label;
  
  // Size classes with more consistent spacing
  const sizeClasses = {
    sm: "text-xs px-1.5 py-0.5",
    md: "text-xs px-2 py-1",
    lg: "text-sm px-2.5 py-1.5"
  };

  // Handle different variants with unified styling
  if (variant === "gradient") {
    return (
      <Badge 
        className={cn(
          "font-medium border-0 shadow-sm transition-all duration-300",
          colors.fullGradient,
          sizeClasses[size],
          className
        )}
      >
        {showIcon && <Icon className="h-3 w-3 mr-1" />}
        {displayLabel}
      </Badge>
    );
  }
  
  if (variant === "colored") {
    return (
      <Badge 
        className={cn(
          "font-medium border shadow-sm transition-all duration-300",
          `bg-gradient-to-r ${colors.gradient} text-white border-0`,
          sizeClasses[size],
          className
        )}
      >
        {showIcon && <Icon className="h-3 w-3 mr-1" />}
        {displayLabel}
      </Badge>
    );
  }
  
  if (variant === "outline") {
    return (
      <Badge 
        variant="outline"
        className={cn(
          "font-medium border transition-all duration-300",
          colors.border,
          colors.text,
          sizeClasses[size],
          className
        )}
      >
        {showIcon && <Icon className="h-3 w-3 mr-1" />}
        {displayLabel}
      </Badge>
    );
  }

  // Default style
  return (
    <Badge 
      variant="secondary"
      className={cn(
        "font-medium border-0 transition-all duration-300",
        colors.bg,
        colors.text,
        sizeClasses[size],
        className
      )}
    >
      {showIcon && <Icon className="h-3 w-3 mr-1" />}
      {displayLabel}
    </Badge>
  );
};

export default memo(QuizBadge);