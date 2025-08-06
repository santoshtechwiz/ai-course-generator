"use client"

import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import QuizPlayLayout from "../../components/layouts/QuizPlayLayout"
import { useSelector } from "react-redux"
import { RootState } from "@/store"

import { getQuizSlug } from "../../components/utils"
import FlashcardQuizWrapper from "../components/FlashcardQuizWrapper"
import { GlobalLoader } from "@/components/loaders"
import { useAuth } from "@/hooks"


export default function FlashCardPage({
  params,
}: {
  params: Promise<{ slug: string }> 
}) {
  const slug = getQuizSlug(params);
  const router = useRouter()
  const { user } = useAuth();
  
  // Get quiz data from Redux store
  const quizTitle = useSelector((state: RootState) => state.flashcard.title);
  const questions = useSelector((state: RootState) => state.flashcard.questions);
  const quizStatus = useSelector((state: RootState) => state.flashcard.status);
  
  // Create quiz data object for QuizPlayLayout
  const quizData = quizStatus !== "idle" ? {
    title: quizTitle || "Flashcard Quiz",
    questions: questions || [],
    currentQuestionIndex: 0,
    quizType: "flashcard" as const
  } : null;

  if (!slug) {
    return (
      <div className="container max-w-4xl py-6">
        <Card>
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-bold mb-4">Error</h2>
            <p className="text-muted-foreground mb-6">Quiz slug is missing. Please check the URL.</p>
            <Button onClick={() => router.push("/dashboard/quizzes")}>Back to Quizzes</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <QuizPlayLayout
      quizSlug={slug}
      quizType="flashcard"
      quizId={slug}
      isPublic={true}
      userId={user?.id || ""}
      isFavorite={false}
      quizData={quizData}
    >
      <FlashcardQuizWrapper slug={slug} />
    </QuizPlayLayout>
  )
}
