import { Code, TextQuote, Sparkles } from "lucide-react"
import type { ReactNode, ComponentType } from "react"

interface QuizMetadata {
  title: string
  description: string
  helpText?: string
  icon?: ComponentType<{ className?: string }> // Updated type
}

export const quizConfig: Record<string, QuizMetadata> = {
  code: {
    title: "Code Quiz",
    description:
      "Create programming challenges or learn with our pre-built coding exercises.",
    helpText:
      "Build exercises where users need to write or fix code. Perfect for programming practice and technical interviews.",
    icon: Code, // Now using the component directly
  },
  openEnded: {
    title: "Open Ended Questions",
    description:
      "Create customized open-ended questions or practice with our pre-built exercises.",
    helpText:
      "Open-ended questions challenge users to write their own answers, ideal for critical thinking.",
    icon: TextQuote, // Now using the component directly
  },
  random: {
    title: "Surprise Me",
    description: "Get a randomized mix of quiz types to keep learning exciting!",
    helpText: "This quiz blends formats and topics to offer a mixed challenge.",
    icon: Sparkles, // Now using the component directly
  },
}