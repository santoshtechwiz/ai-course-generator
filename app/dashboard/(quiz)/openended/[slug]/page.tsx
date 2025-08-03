"use client"

import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import OpenEndedQuizWrapper from "../components/OpenEndedQuizWrapper"
import { useSelector } from "react-redux"
import QuizPlayLayout from "../../components/layouts/QuizPlayLayout"
import QuizSEO from "../../components/QuizSEO"
import { GlobalLoader } from "@/components/ui/loader"
import { getQuizSlug } from "../../components/utils"
import { useEffect } from "react"
export default function OpenEndedQuizPage({
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
        dispatch(fetchQuiz({ slug, quizType: "openended" }));
      });
    }
  }, [slug, quizState, status, dispatch]);

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
      quizType="openended"
      quizData={quizData || null}
      quizId={slug}
      isPublic={true} 
      isFavorite={false}
    >
      <QuizSEO 
        slug={slug}
        quizType="openended"
        quizData={quizData}
        description="Practice with open-ended questions that test your understanding and critical thinking skills. Write detailed answers and get comprehensive feedback on your responses."
      />
      <OpenEndedQuizWrapper slug={slug} />
    </QuizPlayLayout>
  );
}
