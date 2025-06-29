
import { CardLoader } from "@/components/ui/loader"

export function QuizLoader() {
  return <CardLoader context="quiz" message="Loading Quizzes..." subMessage="Fetching your personalized content" />
}
