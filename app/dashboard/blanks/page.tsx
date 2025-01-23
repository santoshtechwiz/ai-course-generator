import { AnimatedQuizHighlight } from "@/app/components/AnimatedQuizHighlight";
import FillInTheBlankQuizForm from "../components/BlankQuizForm";
import { getAuthSession } from "@/lib/authOptions";
import { QuizWrapper } from "@/components/QuizWrapper";

export default async function QuizPage() {
  const session = await getAuthSession();
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-4xl font-bold text-gray-800 dark:text-white mb-8 text-center">
        Welcome to QuizMaster
      </h1>
      <div className="flex flex-wrap md:flex-nowrap gap-8">
        {/* Left Column - Fill in the Blank Form */}
        <div className="flex-grow bg-white dark:bg-gray-800 p-8 shadow rounded">
         <QuizWrapper type={"fill-in-the-blanks"}>
         
         </QuizWrapper>
        </div>
        {/* Right Column - Highlight */}
        <div className="w-full md:w-96 bg-gray-200 dark:bg-gray-800 p-8 shadow rounded">
          <AnimatedQuizHighlight />
        </div>
      </div>
    </div>
  );
}
