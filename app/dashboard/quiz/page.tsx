import { getPublicQuizzes } from "@/lib/db";
import { Metadata } from "next";
import { getAuthSession } from "@/lib/auth";
import RandomQuiz from "../mcq/components/RandomQuiz";
import CreateQuizForm from "./components/CreateQuizForm";


const Page = async () => {
  const session = await getAuthSession();
  const isLoggedIn = !!session?.user;

  const publicQuizzes = await getPublicQuizzes();

  return (
 
      <div className="flex flex-col lg:flex-row w-full min-h-[calc(100vh-4rem)]">
        <div className="lg:w-3/4 p-4 overflow-auto">
          <CreateQuizForm isLoggedIn={isLoggedIn} />
        </div>
        <div className="lg:w-1/4 lg:min-w-[300px] p-4 border-t lg:border-t-0 lg:border-l">
          <RandomQuiz games={publicQuizzes} />
        </div>
      </div>
 
  );
};

export default Page;

export const metadata: Metadata = {
  title: "Create & Play Quizzes",
  description: "A platform to create and play quizzes.",
};
