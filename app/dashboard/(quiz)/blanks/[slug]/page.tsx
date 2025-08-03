"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import BlanksQuizWrapper from "../components/BlanksQuizWrapper"
import QuizPlayLayout from "../../components/layouts/QuizPlayLayout"
import QuizSEO from "../../components/QuizSEO"
import { getQuizSlug } from "../../components/utils"
import { useSelector } from "react-redux"
import { GlobalLoader } from "@/components/loaders"

export default function BlanksQuizPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const slug = getQuizSlug(params);
  const router = useRouter();

  // Get quiz state from Redux
  const quizState = useSelector((state: any) => state.quiz);
  const quizData = quizState;
  const status = quizState?.status;
  const dispatch = (typeof window !== "undefined" ? require("react-redux").useDispatch() : () => { });

  useEffect(() => {
    if (slug && (!quizState || !quizState.questions || quizState.questions.length === 0) && status !== "loading") {
      // Dynamically import fetchQuiz thunk and dispatch it
      console.log("Fetching quiz data for slug:", slug);
      import("@/store/slices/quiz/quiz-slice").then(({ fetchQuiz }) => {
        dispatch(fetchQuiz({ slug, quizType: "blanks" }));
      });
    }
  }, [slug, quizState, status, dispatch]);

  if (status === "loading" || !quizState || !quizState.questions || quizState.questions.length === 0) {
    
      <GlobalLoader  />

  }



  if (!slug) {
    return (
      <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
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
      quizType="blanks"
      quizId={slug}
      isPublic={true} 
      isFavorite={false}
      quizData={quizData || null}
    >
      <QuizSEO 
        slug={slug}
        quizType="blanks"
        quizData={quizData}
        description="Complete fill-in-the-blank exercises to reinforce your learning. Practice key concepts by filling in missing words and phrases with instant feedback."
      />
      <BlanksQuizWrapper
      slug={slug}
      title="Fill in the Blanks Quiz"
      />
    </QuizPlayLayout>
  )
}
