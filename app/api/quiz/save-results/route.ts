import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    // Check if user is authenticated
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse request body
    const { quizType, slug, results } = await req.json();

    if (!quizType || !slug || !results) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Find the quiz
    const quiz = await prisma.userQuiz.findFirst({
      where: { 
        slug,
        type: quizType
      },
    });

    if (!quiz) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
    }

    // Create the quiz attempt record
    const quizAttempt = await prisma.userQuizAttempt.create({
      data: {
        userId: session.user.id,
        userQuizId: quiz.id,
        score: results.score || 0,
        accuracy: results.percentage || 0,
        // Store detailed results as JSON
        resultData: results,
        // Create question attempt records for each question
        attemptQuestions: {
          create: results.questions?.map((question: any) => ({
            questionId: String(question.questionId),
            userAnswer: question.userAnswer || "",
            isCorrect: question.isCorrect || false,
            timeSpent: question.timeSpent || 0,
          })) || [],
        },
      },
      include: {
        attemptQuestions: true,
      },
    });

    // Update user statistics (add a quiz completion)
    await prisma.userStatistic.upsert({
      where: { userId: session.user.id },
      update: {
        quizzesCompleted: { increment: 1 },
        score: {
          increment: results.score || 0,
        },
      },
      create: {
        userId: session.user.id,
        quizzesCompleted: 1,
        score: results.score || 0,
      },
    });

    return NextResponse.json({
      message: "Results saved successfully",
      attemptId: quizAttempt.id,
    });
  } catch (error) {
    console.error("Error saving quiz results:", error);
    return NextResponse.json(
      { error: "Failed to save quiz results" },
      { status: 500 }
    );
  }
}
