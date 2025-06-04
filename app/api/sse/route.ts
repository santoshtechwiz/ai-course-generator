import { NextRequest } from "next/server"
import { getAuthSession } from "@/lib/auth"
import { prisma } from "@/lib/db"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const courseId = url.searchParams.get("courseId")

  if (!courseId) {
    return new Response("Course ID is required", { status: 400 })
  }

  const session = await getAuthSession()
  const userId = session?.user?.id || ""

  // Create an encoder for sending text data
  const encoder = new TextEncoder()

  // Create a ReadableStream
  const stream = new ReadableStream({
    async start(controller) {
      let stopped = false
      const sendProgress = async () => {
        if (!userId) {
          // For unauthenticated users, send empty progress and close
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                progress: {
                  id: 0,
                  userId: "",
                  courseId: Number.parseInt(courseId),
                  progress: 0,
                  completedChapters: [],
                  lastAccessedAt: new Date().toISOString(),
                  isCompleted: false,
                },
              })}\n\n`
            )
          )
          controller.close()
          return
        }

        const progress = await prisma.courseProgress.findUnique({
          where: {
            unique_user_course_progress: {
              userId,
              courseId: Number.parseInt(courseId),
            },
          },
        })

        let completedChapters = []
        if (progress && typeof progress.completedChapters === "string") {
          try {
            completedChapters = JSON.parse(progress.completedChapters)
          } catch {
            completedChapters = []
          }
        } else if (progress && Array.isArray(progress.completedChapters)) {
          completedChapters = progress.completedChapters
        }

        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({
              progress: progress
                ? { ...progress, completedChapters }
                : {
                    id: 0,
                    userId,
                    courseId: Number.parseInt(courseId),
                    progress: 0,
                    completedChapters: [],
                    lastAccessedAt: new Date().toISOString(),
                    isCompleted: false,
                  },
            })}\n\n`
          )
        )
      }

      // Send initial progress
      await sendProgress()

      // Poll every 5 seconds for updates
      const interval = setInterval(async () => {
        if (stopped) return
        await sendProgress()
      }, 5000)

      req.signal.addEventListener("abort", () => {
        stopped = true
        clearInterval(interval)
        controller.close()
      })
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  })
}
