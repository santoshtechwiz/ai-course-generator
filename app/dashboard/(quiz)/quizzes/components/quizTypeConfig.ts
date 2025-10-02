// Centralized quiz type configuration used across quiz list & cards
// Not a component – simple config object for colors, labels, and icons.
import { Target, Code2, Brain, FileText, PenTool, Flashlight } from "lucide-react"

export interface QuizTypeMeta {
  label: string
  icon: any
  color: string
  pill: string
  overlay?: string
  description: string
}

export const QUIZ_TYPE_CONFIG: Record<string, QuizTypeMeta> = {
  mcq: {
    label: "Multiple Choice",
    icon: Target,
    color: "text-blue-600 dark:text-blue-300",
    pill: "bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800",
    overlay: "from-blue-500/10 to-blue-500/0",
    description: "Test your knowledge with multiple choice questions"
  },
  code: {
    label: "Code Challenge",
    icon: Code2,
    color: "text-purple-600 dark:text-purple-300",
    pill: "bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800",
    overlay: "from-purple-500/10 to-purple-500/0",
    description: "Solve coding problems and write functional code"
  },
  flashcard: {
    label: "Flash Cards",
    icon: Brain,
    color: "text-green-600 dark:text-green-300",
    pill: "bg-green-50 dark:bg-green-950/40 border-green-200 dark:border-green-800",
    overlay: "from-green-500/10 to-green-500/0",
    description: "Memorize key concepts with interactive flashcards"
  },
  openended: {
    label: "Open Ended",
    icon: FileText,
    color: "text-orange-600 dark:text-orange-300",
    pill: "bg-orange-50 dark:bg-orange-950/40 border-orange-200 dark:border-orange-800",
    overlay: "from-orange-500/10 to-orange-500/0",
    description: "Express your understanding in written responses"
  },
  blanks: {
    label: "Fill Blanks",
    icon: PenTool,
    color: "text-teal-600 dark:text-teal-300",
    pill: "bg-teal-50 dark:bg-teal-950/40 border-teal-200 dark:border-teal-800",
    overlay: "from-teal-500/10 to-teal-500/0",
    description: "Complete sentences and fill in missing information"
  }
}

export type QuizTypeConfigKey = keyof typeof QUIZ_TYPE_CONFIG
