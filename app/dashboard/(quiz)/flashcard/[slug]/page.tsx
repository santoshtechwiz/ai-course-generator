"use client"

import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import QuizPlayLayout from "../../components/layouts/QuizPlayLayout"

import { getQuizSlug } from "../../components/utils"
import FlashcardQuizWrapper from "../components/FlashcardQuizWrapper"
import { GlobalLoader } from "@/components/loaders"


export default function FlashCardPage({
  params,
}: {
  params: Promise<{ slug: string }> 
}) {
  const slug = getQuizSlug(params);
  const router = useRouter()
  // Get quiz state from Redux
  const quizState = typeof window !== "undefined" ? require("react-redux").useSelector((state: any) => state.quiz) : null;
  const quizData = quizState;
  const status = quizState?.status;
  const dispatch = (typeof window !== "undefined" ? require("react-redux").useDispatch() : () => { });
  // Fetch quiz data if not already available
  if (slug && (!quizState || !quizState.questions || quizState.questions.length === 0) && status !== "loading") {
    // Dynamically import fetchQuiz thunk and dispatch it
    console.log("Fetching quiz data for slug:", slug);
    import("@/store/slices/flashcard-slice").then(({ fetchFlashCardQuiz }) => {
      dispatch(fetchFlashCardQuiz(slug));
    });
  }

  if (status === "loading" || !quizState || !quizState.questions || quizState.questions.length === 0) {
    
      <GlobalLoader  />

  }


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
      isFavorite={false}
      quizData={quizData || null}
    >
      <FlashcardQuizWrapper slug={slug} />
    </QuizPlayLayout>
  )
}
