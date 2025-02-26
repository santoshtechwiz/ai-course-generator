import { openai } from "@ai-sdk/openai"
import { streamText } from "ai"
import { getAuthSession } from "@/lib/authOptions"
import prisma from "@/lib/db"
import type { NextRequest } from "next/server"

const CONFIG = {
  MIN_CREDITS_REQUIRED: 0,
  MAX_RESULTS: 5,
  TEMPERATURE: 0.5,
  MAX_TOKENS: 150,
  URL: process.env.NEXT_PUBLIC_URL,
}

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json()
    const authSession = await getAuthSession()
    const userId = authSession?.user?.id

    if (!userId) {
      console.error("Unauthorized: No user ID found")
      return new Response("Unauthorized", { status: 401 })
    }

    const userMessage = messages[messages.length - 1]?.content || ""
    if (!userMessage.trim()) {
      return new Response("Invalid request", { status: 400 })
    }

    console.log(`Processing request for user ${userId}: ${userMessage}`)

    // Extract keywords, intent, and requirements
    const analysisResult = await streamText({
      model: openai("gpt-3.5-turbo"),
      messages: [
        {
          role: "system",
          content:
            "Extract key topics, user intent, and specific requirements. Format response as JSON: {topics: [], intent: '', requirements: []}. Be specific and include any mentioned difficulty levels or advanced concepts.",
        },
        { role: "user", content: userMessage },
      ],
      temperature: 0.3,
      maxTokens: 100, // Increased to allow for more detailed analysis
    })

    let analysisText = ""
    for await (const chunk of analysisResult.textStream) {
      analysisText += chunk
    }

    console.log("Analysis result:", analysisText)

    const analysis = safeParseAnalysis(analysisText)
    if (!analysis) {
      console.error("Failed to parse AI analysis")
      return new Response("AI failed to analyze the query", { status: 500 })
    }

    // Fetch all courses and quizzes
    const [allCourses, allQuizzes] = await Promise.all([
      prisma.course.findMany({
        select: { name: true, slug: true, description: true },
      }),
      prisma.userQuiz.findMany({
        select: { topic: true, slug: true, quizType: true },
      }),
    ])

    // Filter and rank courses and quizzes based on relevance
    const courses = rankContentByRelevance(allCourses, analysis, "course")
    const quizzes = rankContentByRelevance(allQuizzes, analysis, "quiz")

    console.log(`Found ${courses.length} relevant courses and ${quizzes.length} relevant quizzes`)

    // Build AI response message
    const systemMessage = buildSystemMessage(userMessage, courses, quizzes, analysis)

    const result = await streamText({
      model: openai("gpt-3.5-turbo"),
      messages: [{ role: "system", content: systemMessage }, ...messages],
      temperature: CONFIG.TEMPERATURE,
      maxTokens: CONFIG.MAX_TOKENS,
    })

    return result.toDataStreamResponse()
  } catch (error) {
    console.error("Error in API:", error)
    return new Response("Internal Server Error", { status: 500 })
  }
}

// Helper: Safe JSON Parsing
function safeParseAnalysis(text: string) {
  try {
    // Try to extract JSON if it's wrapped in markdown code blocks
    if (text.includes("```json")) {
      const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/)
      if (jsonMatch && jsonMatch[1]) {
        return JSON.parse(jsonMatch[1])
      }
    }

    // Try to extract JSON if it's wrapped in regular code blocks
    if (text.includes("```")) {
      const codeMatch = text.match(/```\s*([\s\S]*?)\s*```/)
      if (codeMatch && codeMatch[1]) {
        return JSON.parse(codeMatch[1])
      }
    }

    // Direct parse attempt
    return JSON.parse(text)
  } catch (error) {
    console.error("Error parsing AI response:", error)

    // Fallback: Try to extract anything that looks like JSON
    try {
      const jsonPattern = /\{[\s\S]*\}/
      const match = text.match(jsonPattern)
      if (match) {
        return JSON.parse(match[0])
      }
    } catch (e) {
      console.error("Fallback parsing also failed:", e)
    }

    // Last resort: Return a minimal valid structure
    return {
      topics: [],
      intent: "",
      requirements: [],
    }
  }
}

function rankContentByRelevance(content: any[], analysis: any, type: "course" | "quiz") {
  const { topics = [], intent = "", requirements = [] } = analysis

  // Handle potential missing properties in analysis
  const intentWords = typeof intent === "string" ? intent.split(" ") : []
  const reqWords = Array.isArray(requirements)
    ? requirements.flatMap((r) => (typeof r === "string" ? r.split(" ") : []))
    : []

  const allKeywords = [...(Array.isArray(topics) ? topics : []), ...intentWords, ...reqWords]

  return content
    .map((item) => {
      const title = type === "course" ? item.name : item.topic
      const description = item.description || ""
      const contentText = `${title} ${description}`.toLowerCase()

      const relevanceScore = allKeywords.reduce((score, keyword) => {
        if (!keyword) return score
        const keywordLower = keyword.toLowerCase()
        if (contentText.includes(keywordLower)) {
          score += contentText.split(keywordLower).length - 1
        }
        return score
      }, 0)

      return { ...item, relevanceScore }
    })
    .filter((item) => item.relevanceScore > 0)
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, CONFIG.MAX_RESULTS)
}

function buildSystemMessage(userMessage: string, courses: any[], quizzes: any[], analysis: any): string {
  const { topics = [], intent = "", requirements = [] } = analysis

  let message = `You are an AI assistant for our learning platform. Your task is to help users find relevant courses and quizzes or suggest creating new content if nothing suitable exists. The user's message is: "${userMessage}".\n\n`

  if (intent) {
    message += `Based on your intent to "${intent}", here are some recommendations:\n\n`
  }

  if (courses.length > 0 || quizzes.length > 0) {
    if (courses.length > 0) {
      message += "## Relevant Courses\n\n"
      courses.forEach((course) => {
        message += `- [${course.name}](${CONFIG.URL}/dashboard/course/${course.slug})\n`
        if (course.description) {
          message += `  ${course.description}\n`
        }
      })
      message += "\n"
    }

    if (quizzes.length > 0) {
      message += "## Related Quizzes\n\n"
      quizzes.forEach((quiz) => {
        message += `- [${quiz.topic}](${CONFIG.URL}/dashboard/${quiz.quizType}/${quiz.slug})\n`
        if (quiz.description) {
          message += `  ${quiz.description}\n`
        }
      })
      message += "\n"
    }

    message += "Would you like to access any of these resources?\n\n"
  } else {
    message += `I couldn't find any specific content related to your query. However, based on your intent and requirements, I can suggest creating new content on the following topics:\n\n`

    const mainTopic = Array.isArray(topics) && topics.length > 0 ? topics[0] : intent
    const relatedTopics = generateRelatedTopics(analysis)

    message += `## Suggested Course Topics\n\n`
    message += `1. [${mainTopic}](${CONFIG.URL}/dashboard/create?topic=${encodeURIComponent(mainTopic)})\n`
    relatedTopics.forEach((topic, index) => {
      message += `${index + 2}. [${topic}](${CONFIG.URL}/dashboard/create?topic=${encodeURIComponent(topic)})\n`
    })

    message += "\n## Create New Content\n\n"
    message += `- [Create a Course](${CONFIG.URL}/dashboard/create?topic=${encodeURIComponent(mainTopic)})\n`
    message += `- [Create a Quiz](${CONFIG.URL}/dashboard/quiz?topic=${encodeURIComponent(mainTopic)})\n\n`

    message +=
      "Would you like to create content on any of these topics? Or do you have a specific aspect you'd like to focus on?\n\n"
  }

  message += "## Additional Information\n\n"
  message += "Based on your intent, here are some key areas you might want to cover:\n\n"

  if (Array.isArray(requirements)) {
    requirements.forEach((req: string) => {
      if (req) message += `- ${req}\n`
    })
  }

  message +=
    "\nAlways maintain a helpful and encouraging tone. Provide guidance on how to get started with creating content if the user shows interest. Do not provide information about courses, quizzes, or content outside our platform."

  return message
}

function generateRelatedTopics(analysis: any): string[] {
  const topics: string[] = []

  const { topics: analysisTopic = [], intent = "", requirements = [] } = analysis
  const mainTopic = Array.isArray(analysisTopic) && analysisTopic.length > 0 ? analysisTopic[0] : intent

  if (!mainTopic) return ["General Topic", "Learning Basics", "Education Fundamentals", "Study Guide", "Knowledge Base"]

  const difficultyLevels = ["Beginner", "Intermediate", "Advanced"]

  // Generate topics based on requirements and difficulty levels
  if (Array.isArray(requirements)) {
    requirements.forEach((req: string) => {
      if (req) topics.push(`${mainTopic}: ${req}`)
    })
  }

  difficultyLevels.forEach((level) => {
    topics.push(`${level} ${mainTopic}`)
  })

  topics.push(`${mainTopic} in Practice`)
  topics.push(`${mainTopic} Case Studies`)

  // Ensure we have at least 5 topics
  while (topics.length < 5) {
    topics.push(`Exploring ${mainTopic} - Part ${topics.length + 1}`)
  }

  return topics.slice(0, 5) // Return at most 5 topics
}

