import { PageWrapper } from "@/components/layout/PageWrapper"
import { QuizLoader } from "@/components/quiz/QuizLoader"
import { LOADER_MESSAGES } from "@/constants/loader-messages"

export default function QuizzesLoading() {
  return (
    <PageWrapper>
      <QuizLoader
        state="loading"
        context="page"
        variant="skeleton"
        size="lg"
        message={LOADER_MESSAGES.LOADING_QUIZ_DATA}
        className="min-h-[60vh]"
      />
    </PageWrapper>
  )
}
