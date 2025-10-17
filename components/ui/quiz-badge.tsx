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

// Unified color scheme - ALL quiz types use PRIMARY color
const quizTypeColors = {
  mcq: {
    bg: "bg-primary/10",
    text: "text-primary",
    border: "border-primary/20",
    gradient: "from-primary to-primary",
    fullGradient: "bg-gradient-to-r from-primary to-primary/80 text-primary-foreground border-0 shadow-md shadow-primary/25"
  },
  openended: {
    bg: "bg-primary/10",
    text: "text-primary",
    border: "border-primary/20",
    gradient: "from-primary to-primary",
    fullGradient: "bg-gradient-to-r from-primary to-primary/80 text-primary-foreground border-0 shadow-md shadow-primary/25"
  },
  code: {
    bg: "bg-primary/10",
    text: "text-primary",
    border: "border-primary/20",
    gradient: "from-primary to-primary",
    fullGradient: "bg-gradient-to-r from-primary to-primary/80 text-primary-foreground border-0 shadow-md shadow-primary/25"
  },
  blanks: {
    bg: "bg-primary/10",
    text: "text-primary",
    border: "border-primary/20",
    gradient: "from-primary to-primary",
    fullGradient: "bg-gradient-to-r from-primary to-primary/80 text-primary-foreground border-0 shadow-md shadow-primary/25"
  },
  flashcard: {
    bg: "bg-primary/10",
    text: "text-primary",
    border: "border-primary/20",
    gradient: "from-primary to-primary",
    fullGradient: "bg-gradient-to-r from-primary to-primary/80 text-primary-foreground border-0 shadow-md shadow-primary/25"
  },
  quiz: {
    bg: "bg-muted",
    text: "text-muted-foreground",
    border: "border-border",
    gradient: "from-muted-foreground to-muted-foreground",
    fullGradient: "bg-gradient-to-r from-gray-500 to-gray-600 text-white border-0 shadow-md shadow-gray-500/25"
  }
}

const quizTypeLabels = {
  mcq: "Multiple Choice",
  openended: "Open Ended",
  code: "Code",
  blanks: "Fill in Blanks",
  flashcard: "Flashcard",
  quiz: "Quiz"
}

const quizTypeIcons = {
  mcq: FileQuestion,
  openended: BookOpen,
  code: Code2,
  blanks: PenTool,
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