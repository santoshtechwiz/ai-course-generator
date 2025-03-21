import { Suspense } from "react"
import { QuizActions } from "../../../components/QuizActions"
import McqQuiz from "./McqQuiz"
import { QuizSkeleton } from "./QuizSkeleton"
import type { McqQuestionsResponse } from "@/app/actions/getMcqQuestions"

interface McqContainerProps {
  slug: string
  currentUserId: string
  result: McqQuestionsResponse
  title:string
}

const McqQuizWrapper = ({ slug, currentUserId, result,title }: McqContainerProps) => {
  // Early return if no result data is available
  if (!result?.result) {
    return <QuizSkeleton />
  }

  const { result: quizData, questions } = result

  return (
    <div className="flex flex-col gap-8">
      {/* QuizActions doesn't need its own Suspense boundary unless it's loading async data internally */}
      <QuizActions
        quizId={quizData.id?.toString() || ""}
        userId={currentUserId}
        ownerId={quizData.userId || ""}
        quizSlug={quizData.slug || ""}
        initialIsPublic={quizData.isPublic || false}
        initialIsFavorite={quizData.isFavorite || false}
        quizType="mcq"
           position="left-center"
      />

      {/* Wrap the actual quiz content in Suspense since it's likely to be the heavier component */}
      <Suspense fallback={<QuizSkeleton />}>
        {questions && <McqQuiz questions={questions} topic={title} quizId={Number(quizData.id) || 0} slug={slug} />}
      </Suspense>
    </div>
  )
}

export default McqQuizWrapper

