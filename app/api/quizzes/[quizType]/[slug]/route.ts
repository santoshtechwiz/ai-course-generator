import { NextRequest, NextResponse } from "next/server"
import { QuizServiceFactory } from "@/app/services/quiz-service-factory"
import { getAuthSession } from "@/lib/auth"

export async function GET(
  req: NextRequest, 
  { params }: { params: { quizType: string; slug: string } }
): Promise<NextResponse> {
  try {
    // Extract parameters
    const { quizType, slug } = params
    
    // Get the user session for authorization if needed
    const session = await getAuthSession()
    const userId = session?.user?.id || ""
    
    // Use the factory to get the appropriate quiz service
    const quizService = QuizServiceFactory.getQuizService(quizType)
    
    if (!quizService) {
      return NextResponse.json({ error: `Unsupported quiz type: ${quizType}` }, { status: 400 })
    }
    
    // Fetch the quiz using the appropriate service
    const quiz = await quizService.getQuizBySlug(slug, userId)
    
    if (!quiz) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 })
    }
    
    return NextResponse.json(quiz)
  } catch (error) {
    console.error(`Error fetching ${params.quizType} quiz:`, error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(
  req: NextRequest, 
  { params }: { params: Promise<{ quizType: string; slug: string }> }
): Promise<NextResponse> {
  try {
    // Extract parameters
    const { quizType, slug } = await params
    
    // Get the user session for authorization
    const session = await getAuthSession()
    if (!session?.user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }
    
    // Get the request body with update parameters
    const body = await req.json()
    
    // Use the factory to get the appropriate quiz service
    const quizService = QuizServiceFactory.getQuizService(quizType)
    
    if (!quizService) {
      return NextResponse.json({ error: `Unsupported quiz type: ${quizType}` }, { status: 400 })
    }
    
    // Update the quiz using the appropriate service
    const updatedQuiz = await quizService.updateQuizProperties(
      slug,
      session.user.id,
      body
    )
    
    return NextResponse.json(updatedQuiz)
  } catch (error) {
    console.error(`Error updating ${params.quizType} quiz:`, error)
    return NextResponse.json({ error: "Failed to update quiz" }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest, 
  { params }: { params: { quizType: string; slug: string } }
): Promise<NextResponse> {
  try {
    // Extract parameters
    const { quizType, slug } = params
    
    // Get the user session for authorization
    const session = await getAuthSession()
    if (!session?.user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }
    
    // Use the factory to get the appropriate quiz service
    const quizService = QuizServiceFactory.getQuizService(quizType)
    
    if (!quizService) {
      return NextResponse.json({ error: `Unsupported quiz type: ${quizType}` }, { status: 400 })
    }
    
    // Delete the quiz using the appropriate service
    await quizService.deleteQuiz(slug, session.user.id)
    
    return NextResponse.json({ message: "Quiz deleted successfully" })
  } catch (error) {
    console.error(`Error deleting ${params.quizType} quiz:`, error)
    return NextResponse.json({ error: "Failed to delete quiz" }, { status: 500 })
  }
}
