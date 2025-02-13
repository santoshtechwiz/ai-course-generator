import { Suspense } from "react"
import { QuizActions } from "../../../components/QuizActions"
import McqQuiz from "./McqQuiz"
import { QuizSkeleton } from "./QuizSkeleton"
import type { McqQuestionsResponse } from "@/app/actions/getMcqQuestions"

interface McqContainerProps {
    slug: string
    currentUserId: string
    result: McqQuestionsResponse
}

const McqQuizWrapper = ({ slug, currentUserId, result }: McqContainerProps) => {
    return (

        <div className="flex flex-col gap-8">
            <Suspense fallback={<QuizSkeleton />}>
                {result && result.result && (
                    <QuizActions
                        quizId={result.result.id?.toString() || ""}
                        userId={currentUserId}
                        ownerId={result.result.userId || ""}
                        quizSlug={result.result.slug || ""}
                        initialIsPublic={result.result.isPublic || false}
                        initialIsFavorite={result.result.isFavorite || false}
                        quizType="mcq"
                    />
                )}
            </Suspense>
            {result.result && result.questions && (
                <McqQuiz questions={result.questions} quizId={Number(result.result?.id) || 0} slug={slug} />
            )}
        </div>

    )
}

export default McqQuizWrapper

