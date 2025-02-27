import { openai } from "@ai-sdk/openai"
import { streamText } from "ai"
import { getAuthSession } from "@/lib/authOptions"
import prisma from "@/lib/db"
import type { NextRequest } from "next/server"
import { MemoryManager } from "@/lib/memory"
import { OpenAIEmbeddings } from "@langchain/openai"
import { MemoryVectorStore } from "langchain/vectorstores/memory"
import { Document } from "langchain/document"

const CONFIG = {
  URL: process.env.NEXT_PUBLIC_URL,
  MAX_RESULTS: 5,
}

let vectorStore: MemoryVectorStore | null = null

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

    // Initialize memory manager to store and retrieve conversation history
    const memory = new MemoryManager({
      sessionId: userId,
      maxTokens: 500,
    })

    // Get conversation history
    const chatHistory = await memory.getMessages()

    // Add current message to history
    await memory.addMessage({
      role: "user",
      content: userMessage,
      id: ""
    })

    // Initialize or retrieve vector store
    if (!vectorStore) {
      vectorStore = await initializeVectorStore()
    }

    // Perform similarity search
    const similarDocs = await vectorStore.similaritySearch(userMessage, CONFIG.MAX_RESULTS)

    // Build system message
    const systemMessage = buildSystemMessage(similarDocs)

    // Generate the final response with memory context
    const result = await streamText({
      model: openai("gpt-3.5-turbo"),
      messages: [{ role: "system", content: systemMessage }, ...chatHistory, ...messages],
      temperature: 0.7,
      maxTokens: 150,
    })

    // Add AI response to memory
    result.text.then(async (aiResponse) => {
      await memory.addMessage({
        role: "assistant",
        content: aiResponse,
        id: ""
      })
    })

    return result.toDataStreamResponse()
  } catch (error) {
    console.error("Error in API:", error)
    return new Response("Internal Server Error", { status: 500 })
  }
}

async function initializeVectorStore(): Promise<MemoryVectorStore> {
  const [allCourses, allQuizzes] = await Promise.all([
    prisma.course.findMany({
      select: { name: true, slug: true, description: true },
    }),
    prisma.userQuiz.findMany({
      select: { topic: true, slug: true, quizType: true },
    }),
  ])

  const documents: Document[] = [
    ...allCourses.map(
      (course) =>
        new Document({
          pageContent: `Course: ${course.name}\nDescription: ${course.description || "No description available."}`,
          metadata: { type: "course", slug: course.slug },
        }),
    ),
    ...allQuizzes.map(
      (quiz) =>
        new Document({
          pageContent: `Quiz: ${quiz.topic}`,
          metadata: { type: "quiz", slug: quiz.slug, quizType: quiz.quizType },
        }),
    ),
  ]

  const embeddings = new OpenAIEmbeddings()
  return await MemoryVectorStore.fromDocuments(documents, embeddings)
}

function buildSystemMessage(similarDocs: Document[]): string {
  let message = `You are an AI assistant for our learning platform. Your task is to help users find relevant courses and quizzes or suggest creating new content if nothing suitable exists. Based on the user's query, here are the most relevant items from our platform:\n\n`

  if (similarDocs.length > 0) {
    similarDocs.forEach((doc) => {
      if (doc.metadata.type === "course") {
        message += `- Course: [${doc.pageContent.split("\n")[0].replace("Course: ", "")}](${CONFIG.URL}/dashboard/course/${doc.metadata.slug})\n`
        message += `  ${doc.pageContent.split("\n")[1]}\n\n`
      } else if (doc.metadata.type === "quiz") {
        message += `- Quiz: [${doc.pageContent.replace("Quiz: ", "")}](${CONFIG.URL}/dashboard/${doc.metadata.quizType}/${doc.metadata.slug})\n\n`
      }
    })
  } else {
    message += "I couldn't find any directly relevant content for this query.\n\n"
  }

  message += `If you can't find a suitable course or quiz for the user's query, suggest creating new content. You can use these links:
- [Create a Course](${CONFIG.URL}/dashboard/create)
- [Create a Quiz](${CONFIG.URL}/dashboard/quiz)

Always maintain a helpful and encouraging tone. Provide guidance on how to get started with creating content if the user shows interest. Do not provide information about courses, quizzes, or content outside our platform.`

  return message
}

