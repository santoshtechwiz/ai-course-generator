import { Suspense } from "react"
import { PublicQuizzes } from "./components/PublicQuizzes"
import { getQuizzes } from "@/app/actions/getQuizes"
import { getAuthSession } from "@/lib/authOptions"

export const dynamic = "force-dynamic"

const QuizPage = async () => {
  const session = await getAuthSession();
  const userId = session?.user?.id || null; 
  const initialQuizzesData = await getQuizzes(1, 10,  userId || undefined);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8 text-center text-primary">Explore Quizzes</h1>
      <Suspense>
        <PublicQuizzes initialQuizzesData={initialQuizzesData} />
      </Suspense>
    </div>
  );
};

export default QuizPage;
