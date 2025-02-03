import { type NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import type { QuizListItem } from "@/app/types/types";

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const searchTerm = searchParams.get("search") || "";
  const sort = searchParams.get("sort") || "recent";
  const difficulty = searchParams.get("difficulty") || undefined;

  try {
    // Construct the where condition dynamically
    const whereCondition = {
      isPublic: true,
      ...(searchTerm && {
        topic: {
          contains: searchTerm,
          mode: "insensitive" as const,
        },
      }),
      ...(difficulty && difficulty !== "all" && { difficulty }),
    };

    console.log("WHERE CONDITION:", JSON.stringify(whereCondition, null, 2));
    console.log("SORTING:", sort);

    // Ensure createdAt exists in your schema before sorting by it
    const quizzes = await prisma.userQuiz.findMany({
      where: whereCondition,
      select: {
        id: true,
        topic: true,
        slug: true,
        isPublic: true,
        quizType: true,
        difficulty: true,
        bestScore: true,
        lastAttempted: true,
        createdAt: true, // Ensure this exists in the database schema
        _count: { select: { questions: true } },
      },
      orderBy:
        sort === "score"
          ? { bestScore: "desc" }
          : sort === "recent"
          ? { createdAt: "desc" }
          : { topic: "asc" },
    });

    // Transform quizzes into QuizListItem format
    const quizListItems: QuizListItem[] = quizzes.map((quiz) => ({
      id: quiz.id,
      topic: quiz.topic,
      slug: quiz.slug,
      questionCount: quiz._count.questions,
      isPublic: true, // Always true since we're fetching public quizzes
      quizType: quiz.quizType,
      difficulty: quiz.difficulty || "easy",
      bestScore: quiz.bestScore,
      lastAttempted: quiz.lastAttempted,
      tags: [],
      questions: [],
    }));

    return NextResponse.json(quizListItems);
  } catch (error) {
    console.error("Failed to fetch quizzes:", error);
    return NextResponse.json({ error: "Failed to fetch quizzes" }, { status: 500 });
  }
}
