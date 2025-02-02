import prisma from "@/lib/db"

export async function GET(req: Request) {
  const searchParams = req.url ? new URL(req.url).searchParams : new URLSearchParams()
  const search = searchParams.get('search')
  const sort = searchParams.get('sort')
  const difficulty = searchParams.get('difficulty')

  try {
    const quizzes = await prisma.userQuiz.findMany({
      where: {
        AND: [
          { isPublic: true },
          search
            ? {
                topic: { contains: search as string, mode: "insensitive" },
              }
            : {},
          difficulty && difficulty !== "all" ? { difficulty: difficulty as string } : {},
        ],
      },
      orderBy: sort === "score" ? { bestScore: "desc" } : { topic: "asc" },
      select: {
        id: true,
        topic: true,
        difficulty: true,
        bestScore: true,
        lastAttempted: true,
      },
    })

    return new Response(JSON.stringify(quizzes), { status: 200 })
  } catch (error) {
    console.error("Error fetching quizzes:", error)
    return new Response(JSON.stringify({ error: "Error fetching quizzes" }), { status: 500 })
  }
}
