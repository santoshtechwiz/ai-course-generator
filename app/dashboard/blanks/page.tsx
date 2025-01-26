
import { QuizContentRoot } from "./(components)/QuizContentRoot"

export default function QuizPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-4xl font-bold text-gray-800 dark:text-white mb-8 text-center">Fill in the Blanks Quiz</h1>
      
        <QuizContentRoot />
    
    </div>
  )
}

