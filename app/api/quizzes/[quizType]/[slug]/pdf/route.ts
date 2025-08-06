import { NextRequest, NextResponse } from "next/server"
import { getAuthSession } from "@/lib/auth"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ quizType: string; slug: string }> }
) {
  try {
    const { quizType, slug } = await params
    const session = await getAuthSession()

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { quizData, includeAnswers = true, format = "A4", title } = body

    if (!quizData) {
      return NextResponse.json({ error: "Quiz data is required" }, { status: 400 })
    }

    // For now, return a simple text-based response
    // In a production environment, you would use a PDF generation library like jsPDF or Puppeteer
    const pdfContent = generateTextPDF(quizData, includeAnswers, title || "Quiz")
    
    // Create a simple text file as a placeholder
    // Replace this with actual PDF generation
    const blob = new Blob([pdfContent], { type: 'text/plain' })
    
    const headers = new Headers()
    headers.set('Content-Type', 'application/pdf')
    headers.set('Content-Disposition', `attachment; filename="${slug}-quiz.pdf"`)
    
    return new Response(blob, {
      status: 200,
      headers,
    })

  } catch (error) {
    console.error("PDF generation error:", error)
    return NextResponse.json(
      { error: "Failed to generate PDF" },
      { status: 500 }
    )
  }
}

function generateTextPDF(quizData: any, includeAnswers: boolean, title: string): string {
  let content = `${title}\n`
  content += `${'='.repeat(title.length)}\n\n`
  
  if (quizData.description) {
    content += `Description: ${quizData.description}\n\n`
  }
  
  // Add questions based on quiz type
  if (quizData.questions && Array.isArray(quizData.questions)) {
    quizData.questions.forEach((question: any, index: number) => {
      content += `Question ${index + 1}: ${question.question}\n`
      
      if (question.options && Array.isArray(question.options)) {
        question.options.forEach((option: any, optIndex: number) => {
          const letter = String.fromCharCode(65 + optIndex) // A, B, C, D
          content += `  ${letter}. ${option}\n`
        })
      }
      
      if (includeAnswers && question.answer) {
        content += `Answer: ${question.answer}\n`
      }
      
      content += `\n`
    })
  }
  
  // Add flashcards if present
  if (quizData.flashCards && Array.isArray(quizData.flashCards)) {
    content += `Flashcards:\n`
    content += `===========\n\n`
    
    quizData.flashCards.forEach((card: any, index: number) => {
      content += `Card ${index + 1}:\n`
      content += `Question: ${card.question}\n`
      if (includeAnswers) {
        content += `Answer: ${card.answer}\n`
      }
      content += `\n`
    })
  }
  
  content += `\nGenerated on: ${new Date().toLocaleString()}\n`
  content += `Quiz Type: ${quizData.quizType || 'Unknown'}\n`
  
  return content
}
