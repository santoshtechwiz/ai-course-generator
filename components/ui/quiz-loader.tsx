import { ClipLoader } from "react-spinners"

export function QuizLoader() {
  return (
    <div className="flex flex-col items-center justify-center py-8 space-y-4">
      <ClipLoader color="#3B82F6" size={40} />
      <p className="text-sm text-muted-foreground">Loading Quizzes...</p>
    </div>
  )
}
