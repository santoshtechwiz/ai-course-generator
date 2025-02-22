import { openai } from "@ai-sdk/openai"
import { streamText } from "ai"
import { getAuthSession } from "@/lib/authOptions"
import prisma from "@/lib/db"
import { type NextRequest, NextResponse } from "next/server"

const MIN_CREDITS_REQUIRED = 3
const MAX_RESULTS = 5
const TEMPERATURE = 0.7
const MAX_TOKENS = 150

const URL = process.env.NEXT_PUBLIC_URL

enum QuizType {
  MCQ = "mcq",
  OPEN_ENDED = "openended",
  FILL_BLANKS = "fill-blanks",
  CODE = "code"
}

enum SearchType {
  COURSE = "course",
  QUIZ = "quiz",
  BOTH = "both"
}

const URL_PATHS = {
  [QuizType.MCQ]: "/mcq/",
  [QuizType.OPEN_ENDED]: "/openended/",
  [QuizType.FILL_BLANKS]: "/blanks/",
  [QuizType.CODE]: "/code/"
}

const buildLinks = (quizType: QuizType, slug: string): string => {
  return `${URL_PATHS[quizType]}${slug}`
}

function extractKeywords(userMessage: string): { type: SearchType; topic: string } {
  const lowerCaseMessage = userMessage.toLowerCase()
  const isCourseQuery = lowerCaseMessage.includes("course")
  const isQuizQuery = lowerCaseMessage.includes("quiz")

  const stopWords = ["course", "quiz", "do you have", "any", "on", "about", "related to", "regarding"]
  const stopWordsRegex = new RegExp(stopWords.join("|"), "gi")
  const topic = lowerCaseMessage.replace(stopWordsRegex, "").trim()

  return {
    type: isCourseQuery && isQuizQuery ? SearchType.BOTH : 
          isCourseQuery ? SearchType.COURSE : 
          isQuizQuery ? SearchType.QUIZ : SearchType.BOTH,
    topic,
  }
}

function createQuery(topic: string, field: string) {
  return {
    where: {
      [field]: {
        contains: topic,
        mode: "insensitive" as const,
      },
    },
    take: MAX_RESULTS,
  }
}

function suggestRelatedTopics(topic: string, existingTopics: string[]): string[] {
  const suggestions = [
    "fundamentals",
    "Advanced",
    "best practices",
    "for beginners",
    "interview questions",
  ]
  return suggestions
    .map(suggestion => 
      suggestion.includes("Advanced") ? `${suggestion} ${topic}` : `${topic} ${suggestion}`
    )
    .filter(suggestion => !existingTopics.includes(suggestion.toLowerCase()))
}

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json()
    const authSession = await getAuthSession()
    const userId = authSession?.user?.id

    if (!userId || (authSession?.user?.credits ?? 0) < MIN_CREDITS_REQUIRED) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const userMessage = messages[messages.length - 1].content
    const { type, topic } = extractKeywords(userMessage)

    const [courses, quizzes] = await Promise.all([
      type !== SearchType.QUIZ ? prisma.course.findMany(createQuery(topic, "name")) : [],
      type !== SearchType.COURSE ? prisma.userQuiz.findMany(createQuery(topic, "topic")) : [],
    ])

    let systemMessage: string
    if (courses.length || quizzes.length) {
      systemMessage = `Here are relevant resources for "${topic}":\n\n`

      if (courses.length) {
        systemMessage += "**Courses**:\n"
        courses.forEach((course) => {
          systemMessage += `- [${course.name}](${URL}/dashboard/course/${course.slug})\n`
        })
        systemMessage += "\n"
      }

      if (quizzes.length) {
        systemMessage += "**Quizzes**:\n"
        quizzes.forEach((quiz) => {
          systemMessage += `- [${quiz.topic}](${URL}/dashboard/${buildLinks(quiz.quizType as QuizType, quiz.slug)})\n`
        })
        systemMessage += "\n"
      }

      systemMessage += "Would you like to access any of these resources?"
    } else {
      const existingTopics = [...courses.map(c => c.name.toLowerCase()), ...quizzes.map(q => q.topic.toLowerCase())]
      const suggestedTopics = suggestRelatedTopics(topic, existingTopics)
      systemMessage = `I couldn't find any specific content on "${topic}". However, here are some related topics you might be interested in creating:\n\n`
      suggestedTopics.forEach((suggestedTopic) => {
        systemMessage += `- ${suggestedTopic}\n`
      })
      systemMessage += `\nWould you like to create new content on any of these topics?
- [Create a Course](${URL}/dashboard/create?topic=${encodeURIComponent(topic)})
- [Create a Quiz](${URL}/dashboard/quiz?topic=${encodeURIComponent(topic)})`
    }

    const result = streamText({
      model: openai("gpt-3.5-turbo"),
      messages: [
        {
          role: "system",
          content:
            "You are a helpful assistant for our learning platform. Your task is to guide users to relevant courses and quizzes within our platform or suggest creating new content if none exists. Do not suggest or provide information about courses, quizzes, or AI content from outside our platform.",
        },
        { role: "system", content: systemMessage },
        ...messages,
      ],
      temperature: TEMPERATURE,
      maxTokens: MAX_TOKENS,
    })

    return result.toDataStreamResponse()
  } catch (error) {
    console.error("Error in POST function:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}