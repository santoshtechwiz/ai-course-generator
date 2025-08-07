"use client"

import { use } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import QuizPlayLayout from "../../components/layouts/QuizPlayLayout"
import { QuizGlobalLoader } from "../../components/QuizGlobalLoader"
import { useSelector } from "react-redux"
import { RootState } from "@/store"

import FlashcardQuizWrapper from "../components/FlashcardQuizWrapper"
import { useAuth } from "@/hooks"

interface FlashcardQuizClientProps {
  params: Promise<{ slug: string }>
}

export default function FlashcardQuizClient({ params }: FlashcardQuizClientProps) {
  // Properly unwrap the params Promise once at the top level
  const { slug } = use(params);
  const router = useRouter()
  const { user } = useAuth();
  
  // Get quiz data from Redux store
  const quizTitle = useSelector((state: RootState) => state.flashcard.title);
  const questions = useSelector((state: RootState) => state.flashcard.questions);
  const quizStatus = useSelector((state: RootState) => state.flashcard.status);
  
  // Create quiz data object for QuizPlayLayout
  const quizData = {
    title: quizTitle,
    questions: questions,
    status: quizStatus
  };

  if (quizStatus === "loading") {
    return (
      <>
        <QuizGlobalLoader quizType="Flashcard Quiz" />
      </>
    )
  }

  if (!slug) {
    return (
      <div className="flex items-center justify-center min-h-screen w-full bg-background">
        <Card className="w-full max-w-md shadow-lg">
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-bold mb-3">Error</h2>
            <p className="text-muted-foreground mb-4">Quiz slug is missing. Please check the URL.</p>
            <Button size="lg" onClick={() => router.push("/dashboard/quizzes")}>Back to Quizzes</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <>
      <QuizGlobalLoader quizType="Flashcard Quiz" />
      <QuizPlayLayout
        quizSlug={slug}
        quizType="flashcard"
        quizId={slug}
        isPublic={true}
        isFavorite={false}
        quizData={quizData}
      >
        <FlashcardQuizWrapper
          slug={slug}
          title={quizTitle}
        />
      </QuizPlayLayout>
    </>
  )
}
