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
  MAX_RESULTS: 3, // Reduced from 5 to 3
}

let vectorStore: MemoryVectorStore | null = null

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json()
    const authSession = await getAuthSession()
    const userId = authSession?.user?.id

    if (!userId) {
      return new Response("Unauthorized", { status: 401 })
    }

    const userMessage = messages[messages.length - 1]?.content || ""
    if (!userMessage.trim()) {
      return new Response("Invalid request", { status: 400 })
    }

    // Initialize memory manager with reduced maxTokens
    const memory = new MemoryManager({
      sessionId: userId,
      maxTokens: 300, // Reduced from 500
    })

    // Get conversation history (last 3 messages only)
    const chatHistory = (await memory.getMessages()).slice(-3)

    // Add current message to history
    await memory.addMessage({
      role: "user",
      content: userMessage,
      id: "",
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
      maxTokens: 100, // Reduced from 250
    })

    // Add AI response to memory
    result.text.then(async (aiResponse) => {
      await memory.addMessage({
        role: "assistant",
        content: aiResponse,
        id: "",
      })
    })

    return result.toDataStreamResponse()
  } catch (error) {
    return new Response("Internal Server Error", { status: 500 })
  }
}

async function initializeVectorStore(): Promise<MemoryVectorStore> {
  const [allCourses, allQuizzes] = await Promise.all([
    prisma.course.findMany({
      select: { title: true, slug: true, description: true },
    }),
    prisma.userQuiz.findMany({
      select: { title: true, slug: true, quizType: true },
    }),
  ])

  const documents: Document[] = [
    ...allCourses.map(
      (course) =>
        new Document({
          pageContent: `Course: ${course.title}\n${course.description || ""}`,
          metadata: { type: "course", slug: course.slug },
        }),
    ),
    ...allQuizzes.map(
      (quiz) =>
        new Document({
          pageContent: `Quiz: ${quiz.title}`,
          metadata: { type: "quiz", slug: quiz.slug, quizType: quiz.quizType },
        }),
    ),
  ]

  const embeddings = new OpenAIEmbeddings()
  return await MemoryVectorStore.fromDocuments(documents, embeddings)
}

function buildSystemMessage(similarDocs: Document[]): string {
  let message = `You are a concise AI assistant for our learning platform. Help users find courses and quizzes or suggest creating new content. Relevant items:\n\n`

  if (similarDocs.length > 0) {
    similarDocs.forEach((doc) => {
      if (doc.metadata.type === "course") {
        message += `- Course: [${doc.pageContent.split("\n")[0].replace("Course: ", "")}](${CONFIG.URL}/dashboard/course/${doc.metadata.slug})\n`
      } else if (doc.metadata.type === "quiz") {
        message += `- Quiz: [${doc.pageContent.replace("Quiz: ", "")}](${CONFIG.URL}/dashboard/${doc.metadata.quizType}/${doc.metadata.slug})\n`
      }
    })
  } else {
    message += "No directly relevant content found.\n"
  }

  message += `\nIf no suitable content, suggest:
- [Create Course](${CONFIG.URL}/dashboard/create)
- [Create Quiz](${CONFIG.URL}/dashboard/quiz)

Be helpful and brief. Don't provide external info. For specific course details, advise checking the course page.`

  return message
}

