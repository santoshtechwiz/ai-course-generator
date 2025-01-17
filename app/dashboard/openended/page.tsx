import { getAuthSession } from "@/lib/authOptions";
import TopicForm from "./components/TopicForm";
import RandomQuestions from "./components/RandomQuestions";
import { getRandomQuestions } from "@/lib/db";

export default async function OpenEndedQuizPage() {
  const session = await getAuthSession();
  const credits = session?.user.credits ?? 0;
  const randomQuestions = await getRandomQuestions();

  return (
    <div className="container mx-auto p-4 min-h-screen bg-background text-foreground">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <h1 className="text-3xl font-bold mb-6 text-primary">Generate AI Quiz</h1>
          <TopicForm credits={credits} />
        </div>
        <div className="hidden lg:block">
          <RandomQuestions questions={randomQuestions} />
        </div>
      </div>
    </div>
  )
}

