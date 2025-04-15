"use client"

import { memo, useEffect } from "react"
import { QuizzesSkeleton } from "./QuizzesSkeleton"
import NProgress from "nprogress"
import { useInView } from "react-intersection-observer"
import { AlertCircle, FileQuestion } from "lucide-react"
import { CreateCard } from "@/components/CreateCard"
import { QuizCard } from "@/components/shared/QuizCard"

import type { QuizListItem } from "@/app/types/types"

NProgress.configure({
  minimum: 0.3,
  easing: "ease",
  speed: 500,
  showSpinner: false,
})

interface QuizListProps {
  quizzes: QuizListItem[]
  isLoading: boolean
  isError: boolean
  isFetchingNextPage: boolean
  hasNextPage: boolean | undefined
  isSearching: boolean
}

function QuizListComponent({
  quizzes,
  isLoading,
  isError,
  isFetchingNextPage,
  hasNextPage,
  isSearching,
}: QuizListProps) {
  useEffect(() => {
    if (isFetchingNextPage) {
      NProgress.start()
    } else {
      NProgress.done()
    }

    return () => {
      NProgress.done()
    }
  }, [isFetchingNextPage])

  const [endMessageRef, endMessageInView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  })

  // Helper functions moved from PublicQuizCardListing
  function getEstimatedTime(questionCount: number): string {
    const minutes = Math.max(Math.ceil(questionCount * 0.5), 1) // At least 1 minute
    return `${minutes} min`
  }

  const getQuestionCount = (quiz: {
    quizType: string
    questionCount: number
    openEndedCount?: number
    flashCardCount?: number
  }): number => {
    if (quiz.quizType === "mcq") {
      return quiz.questionCount
    }
    if (quiz.quizType === "openended") {
      return quiz.openEndedCount || 0
    }
    if (quiz.quizType === "fill-blanks") {
      return quiz.flashCardCount || 0
    }
    if (quiz.quizType === "code") {
      return quiz.questionCount
    }
    return 0
  }

  if (isLoading) {
    return <QuizzesSkeleton />
  }

  if (isError) {
    return (
      <div className="text-center p-6 bg-red-50 rounded-lg text-red-500 shadow-sm border border-red-100 flex flex-col items-center">
        <AlertCircle className="w-8 h-8 mb-2" />
        <h3 className="font-semibold text-lg mb-1">Error loading quizzes</h3>
        <p className="text-sm text-red-600">Please try again later or refresh the page.</p>
      </div>
    )
  }

  if (quizzes.length === 0) {
    return (
      <div className="text-center text-muted-foreground p-8 bg-muted/30 rounded-lg border border-muted">
        {isSearching ? (
          <>
            <h3 className="text-xl font-semibold mb-2">No matching quizzes found</h3>
            <p>Try adjusting your search terms or filters to find what you're looking for.</p>
          </>
        ) : (
          <>
            <h3 className="text-xl font-semibold mb-2">No quizzes available</h3>
            <p>Be the first to create a quiz and share your knowledge!</p>
          </>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Empty State - Moved from PublicQuizzes */}
      {quizzes.length === 0 && (
        <div className="text-center py-12 px-6 bg-gradient-to-b from-muted/50 to-background rounded-xl border border-muted">
          <div className="mx-auto bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mb-4">
            <FileQuestion className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-xl font-bold mb-2">No quizzes found</h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Why not create your own quiz? It's easy and fun to share your knowledge with others.
          </p>
          <CreateCard
            title="Start Fresh"
            description="Be the first to create a quiz on this topic! It's easy and fun."
            animationDuration={2.0}
          />
        </div>
      )}

      {/* Quiz Grid Layout - Merged from PublicQuizzes and PublicQuizCardListing */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {quizzes.map((quiz, index) => {
          // Use a simpler approach for card animations
          return (
            <div
              key={quiz.id}
              className="h-full opacity-0 translate-y-4"
              style={{
                animation: `fadeInUp 0.5s ease-out ${index * 0.1}s forwards`,
              }}
            >
              <QuizCard
                title={quiz.title}
                description={quiz.title}
                questionCount={getQuestionCount(quiz)}
                isPublic={quiz.isPublic}
                slug={quiz.slug}
                quizType={quiz.quizType as "mcq" | "openended" | "fill-blanks" | "code"}
                estimatedTime={getEstimatedTime(quiz.questionCount)}
                completionRate={Math.min(Math.max(quiz.bestScore || 0, 0), 100)}
              />
            </div>
          )
        })}
      </div>

      {isFetchingNextPage && <QuizzesSkeleton itemCount={3} />}

      {!hasNextPage && quizzes.length > 0 && (
        <div
          ref={endMessageRef}
          className={`text-center mt-8 p-4 text-muted-foreground bg-muted/20 rounded-lg border border-muted/50 transition-opacity duration-500 ${
            endMessageInView ? "opacity-100" : "opacity-0"
          }`}
        >
          <span className="font-medium">You've reached the end!</span> No more quizzes to load.
        </div>
      )}

      {/* Add the animation keyframes */}
      <style jsx global>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  )
}

export const QuizList = memo(QuizListComponent);
