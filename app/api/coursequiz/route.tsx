import { prisma } from "@/lib/db"
import { getQuestionsFromTranscript } from "@/services/videoProcessor"
import YoutubeService from "@/services/youtubeService"
import { NextResponse } from "next/server"
import NodeCache from "node-cache"

// Initialize cache with 1 hour TTL and automatic key deletion
const cache = new NodeCache({
  stdTTL: 3600,
  checkperiod: 600,
  useClones: false,
  deleteOnExpire: true,
})

export const dynamic = "force-dynamic"

// Define interface for request body
interface QuizRequestBody {
  videoId: string
  chapterId: number
  chapterName: string
}

// Define interface for quiz question
interface QuizQuestion {
  question: string
  answer: string
  options: string[]
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as QuizRequestBody
    const { videoId, chapterId, chapterName } = body

    if (!videoId || !chapterId || !chapterName) {
      return NextResponse.json({ error: "Invalid request: Missing required fields" }, { status: 400 })
    }

    const cacheKey = `questions_${chapterId}_${videoId}`
    let questions = cache.get<any[]>(cacheKey)

    if (!questions || questions.length === 0) {
      // First try to get existing questions from the database
      questions = await getQuestionsFromChapter(chapterId)

      if (questions.length === 0) {
        // If no questions in database, generate new ones
        const transcriptOrSummary = await fetchTranscriptOrSummary(chapterId, videoId)

        if (transcriptOrSummary) {
          questions = await generateAndSaveQuestions(transcriptOrSummary, chapterId, chapterName)
        } else {
          return NextResponse.json({ error: "Failed to fetch transcript or summary" }, { status: 500 })
        }
      }

      if (questions.length > 0) {
        cache.set(cacheKey, questions)
      }
    }

    return NextResponse.json(questions)
  } catch (error) {
    console.error("Error in POST handler:", error)
    return NextResponse.json(
      {
        error: "An error occurred while processing your request.",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

async function fetchTranscriptOrSummary(chapterId: number, videoId: string): Promise<string | null> {
  try {
    // First, check if a summary exists for the chapter
    const chapter = await prisma.chapter.findUnique({
      where: { id: chapterId },
      select: { summary: true },
    })

    if (chapter?.summary) {
      return chapter.summary
    }

    // If no summary exists, fetch the transcript
    console.log("Fetching transcript for video:", videoId)
    const transcriptResult = await YoutubeService.getTranscript(videoId)

    if (!transcriptResult?.transcript || transcriptResult.transcript.length === 0) {
      console.error("Failed to fetch transcript")
      return null
    }

    return transcriptResult.transcript
  } catch (error) {
    console.error("Error in fetchTranscriptOrSummary:", error)
    return null
  }
}

async function generateAndSaveQuestions(
  transcriptOrSummary: string,
  chapterId: number,
  chapterName: string,
): Promise<any[]> {
  try {
    // Limit text length to avoid token limits
    const maxLength = 500
    const truncatedText = transcriptOrSummary.split(" ").slice(0, maxLength).join(" ")

    console.log("Generating questions for text")
    const questions = await getQuestionsFromTranscript(truncatedText, chapterName)

    if (questions.length > 0) {
      console.log("Saving questions to database")

      // Process questions in batches to avoid large transactions
      const batchSize = 10
      for (let i = 0; i < questions.length; i += batchSize) {
        const batch = questions.slice(i, i + batchSize)

        await prisma.courseQuiz.createMany({
          data: batch.map((question: QuizQuestion) => {
            // Ensure options is an array before processing
            const questionOptions = Array.isArray(question.options)
              ? question.options
              : typeof question.options === "string"
              ? JSON.parse(question.options)
              : []

            // Make sure answer is included in options
            const uniqueOptions = questionOptions.includes(question.answer)
              ? questionOptions
              : [...questionOptions, question.answer]

            const sortedOptions = uniqueOptions.sort(() => Math.random() - 0.5)

            return {
              question: question.question,
              answer: question.answer,
              options: JSON.stringify(sortedOptions),
              chapterId: chapterId,
            }
          }),
        })
      }
    }

    return questions
  } catch (error) {
    console.error("Error generating questions:", error)
    return []
  }
}

async function getQuestionsFromChapter(chapterId: number): Promise<any[]> {
  try {
    console.log("Fetching questions for chapter:", chapterId)
    const questions = await prisma.courseQuiz.findMany({
      where: { chapterId: chapterId },
    })

    return questions.map((q) => ({
      ...q,
      options: JSON.parse(q.options as string),
    }))
  } catch (error) {
    console.error("Error in getQuestionsFromChapter:", error)
    return []
  }
}
