import { getAuthSession } from "@/lib/authOptions";
import RandomQuestions from "./components/RandomQuestions";
import { getRandomQuestions } from "@/lib/db";
import { AnimatedQuizHighlight } from "@/app/components/AnimatedQuizHighlight";
import { QuizWrapper } from "@/components/QuizWrapper";

export default async function OpenEndedQuizPage() {
  const session = await getAuthSession();

  return (
    <div className="container mx-auto p-4 min-h-screen bg-background text-foreground">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <h1 className="text-3xl font-bold mb-6 text-primary">Generate AI Quiz</h1>
          {/* <TopicForm credits={credits} /> */}
          <QuizWrapper type={"openended"} />
        </div>
        <div className="hidden lg:block">
          {/* <RandomQuestions questions={randomQuestions} /> */}
          <AnimatedQuizHighlight />
        </div>
      </div>
    </div>
  )
}
