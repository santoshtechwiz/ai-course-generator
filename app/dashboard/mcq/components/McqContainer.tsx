import { Suspense } from "react"
import { QuizActions } from "./QuizActions"
import PlayQuiz from "./PlayQuiz"
import { QuizSkeleton } from "./QuizSkeleton"
import type { McqQuestionsResponse } from "@/app/actions/getMcqQuestions"

interface McqContainerProps {
    slug: string
    currentUserId: string
    result: McqQuestionsResponse
}

const McqContainer = ({ slug, currentUserId, result }: McqContainerProps) => {
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
                <PlayQuiz questions={result.questions} quizId={Number(result.result?.id) || 0} slug={slug} />
            )}
        </div>

    )
}

export default McqContainer

