
import { getQuizData } from "@/lib/api/quiz"
import { Metadata } from "next"
import McqQuizClient from "../components/McqQuizClient"


// This makes the component a server component
export async function generateMetadata({ params }: { params: Promise< { slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  
  try {
    const quizData = await getQuizData('mcq', slug)
    return {
      title: `${quizData.title || 'MCQ Quiz'} | AI Learning Platform`,
      description: quizData.description || 'Test your knowledge with our multiple-choice quiz',
    }
  } catch (error) {
    return {
      title: 'Quiz | AI Learning Platform',
      description: 'Test your knowledge with our interactive quiz',
    }
  }
}

export default async function McqQuizPage({ params }: { params: { slug: string } }) {
  const { slug } = params
  
  
  

  return (
    <div className="container max-w-4xl py-6">
      <McqQuizClient 
        slug={slug}
        initialQuizData={null}
        initialError={null}
      />
    </div>
  )
}
