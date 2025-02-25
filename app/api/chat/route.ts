import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';
import { getAuthSession } from "@/lib/authOptions"
import prisma from "@/lib/db"
import { type NextRequest, NextResponse } from "next/server"

const CONFIG = {
  MIN_CREDITS_REQUIRED: 1,
  MAX_RESULTS: 5,
  TEMPERATURE: 0.7,
  MAX_TOKENS: 150,
  URL: process.env.NEXT_PUBLIC_URL,
}

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json()
    const authSession = await getAuthSession()
    const userId = authSession?.user?.id

    if (!userId || (authSession?.user?.credits ?? 0) < CONFIG.MIN_CREDITS_REQUIRED) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const userMessage = messages[messages.length - 1].content

    // Extract potential keywords from the user message
    const keywords = userMessage.toLowerCase().split(/\s+/).filter((word: string | any[]) => word.length > 3)

    // Fetch relevant courses and quizzes based on the keywords
    const [courses, quizzes] = await Promise.all([
      prisma.course.findMany({
        where: {
          OR: keywords.map((keyword: any) => ({
            name: {
              contains: keyword,
              mode: 'insensitive',
            },
          })),
        },
        take: CONFIG.MAX_RESULTS,
      }),
      prisma.userQuiz.findMany({
        where: {
          OR: keywords.map((keyword: any) => ({
            topic: {
              contains: keyword,
              mode: 'insensitive',
            },
          })),
        },
        take: CONFIG.MAX_RESULTS,
      }),
    ])

    const systemMessage = buildSystemMessage(userMessage, courses, quizzes)

    const result = streamText({
      model: openai('gpt-3.5-turbo'),
      messages: [
        {
          role: "system",
          content: systemMessage,
        },
        ...messages,
      ],
      temperature: CONFIG.TEMPERATURE,
      maxTokens: CONFIG.MAX_TOKENS,
    })

    return result.toDataStreamResponse()
  } catch (error) {
    console.error("Error in POST function:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}

function buildSystemMessage(userMessage: string, courses: any[], quizzes: any[]): string {
  let message = `You are an AI assistant for our learning platform. Your task is to help users find relevant courses and quizzes or suggest creating new content if nothing suitable exists. The user's message is: "${userMessage}". `

  if (courses.length > 0 || quizzes.length > 0) {
    message += "Here are the relevant resources:\n\n"

    if (courses.length > 0) {
      message += "Courses:\n"
      courses.forEach(course => {
        message += `- ${course.name} (${CONFIG.URL}/dashboard/course/${course.slug})\n`
      })
      message += "\n"
    }

    if (quizzes.length > 0) {
      message += "Quizzes:\n"
      quizzes.forEach(quiz => {
        message += `- ${quiz.topic} (${CONFIG.URL}/dashboard/${quiz.quizType}/${quiz.slug})\n`
      })
      message += "\n"
    }

    message += "Suggest these resources to the user and ask if they would like to access any of them."
  } else {
    message += `I couldn't find any specific content related to the user's query. Suggest creating new content using these URLs:
- Create a Course: ${CONFIG.URL}/dashboard/create?topic=[TOPIC]
- Create a Quiz: ${CONFIG.URL}/dashboard/quiz?topic=[TOPIC]

Replace [TOPIC] with a relevant topic based on the user's message. Ask the user if they would like to create new content on this topic.`
  }

  message += "\n\nAlways maintain a helpful and encouraging tone. Do not provide information about courses, quizzes, or content outside our platform."

  return message
}