import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

/**
 * Retrieves quiz results by quiz ID or user ID
 * GET /api/quizzes/results?quizId=123
 * GET /api/quizzes/results?userId=user_123
 * GET /api/quizzes/results?slug=quiz-slug
 */
export async function GET(request: Request) {
  try {
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const quizId = searchParams.get("quizId");
    const userId = searchParams.get("userId");
    const slug = searchParams.get("slug");
    
    // Get current user from session
    const session = await getServerSession(authOptions);
    const currentUserId = session?.user?.id;
    
    if (!currentUserId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Construct the query based on provided parameters
    const query: any = {};
    
    if (quizId) {
      query.userQuizId = parseInt(quizId, 10);
    } else if (slug) {
      // If slug is provided, first find the quiz ID
      const quiz = await prisma.userQuiz.findUnique({
        where: { slug },
        select: { id: true }
      });
      
      if (!quiz) {
        return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
      }
      
      query.userQuizId = quiz.id;
    }
    
    // If userId is provided and current user is admin or the same user
    if (userId) {
      // Check if current user is admin or the requested user
      const user = await prisma.user.findUnique({
        where: { id: currentUserId },
        select: { isAdmin: true }
      });
      
      // Only allow if current user is admin or viewing their own results
      if (userId === currentUserId || user?.isAdmin) {
        query.userId = userId;
      } else {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
      }
    } else {
      // Default to current user's results if no userId specified
      query.userId = currentUserId;
    }
    
    // Check if any filter was provided
    if (Object.keys(query).length === 0) {
      return NextResponse.json({ error: "No valid search criteria provided" }, { status: 400 });
    }
    
    // Get quiz attempts with related questions
    const attempts = await prisma.userQuizAttempt.findMany({
      where: query,
      include: {
        userQuiz: {
          select: {
            title: true,
            slug: true,
            quizType: true,
            questions: {
              select: {
                id: true,
                question: true,
                answer: true,
                options: true,
                questionType: true,
                codeSnippet: true,
              }
            }
          }
        },
        attemptQuestions: {
          include: {
            question: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    // Format the response
    const formattedResults = attempts.map(attempt => ({
      id: attempt.id,
      slug: attempt.userQuiz?.slug || "",
      quizId: attempt.userQuizId,
      quizTitle: attempt.userQuiz?.title || "Untitled Quiz",
      quizType: attempt.userQuiz?.quizType,
      quizSlug: attempt.userQuiz?.slug,
      score: attempt.score || 0,
      accuracy: attempt.accuracy || 0,
      timeSpent: attempt.timeSpent || 0,
      completionSpeed: attempt.completionSpeed,
      attemptedAt: attempt.createdAt,
      answers: attempt.attemptQuestions.map(aq => ({
        questionId: aq.questionId,
        question: aq.question.question,
        correctAnswer: aq.question.answer,
        userAnswer: aq.userAnswer || "",
        isCorrect: aq.isCorrect,
        timeSpent: aq.timeSpent,
      })),
      questions: attempt.attemptQuestions.map(aq => ({
        questionId: aq.questionId,
        question: aq.question.question,
        correctAnswer: aq.question.answer,
        userAnswer: aq.userAnswer || "",
        isCorrect: aq.isCorrect,
        timeSpent: aq.timeSpent,
        options: aq.question.options ? JSON.parse(aq.question.options) : [],
        codeSnippet: aq.question.codeSnippet,
        questionType: aq.question.questionType
      }))
    }));
    console.log("Formatted results:", JSON.stringify(formattedResults, null, 2));
    return NextResponse.json({result:formattedResults});
  } catch (error) {
    console.error("Error fetching quiz results:", error);
    return NextResponse.json(
      { error: "An error occurred while fetching quiz results" }, 
      { status: 500 }
    );
  }
}

