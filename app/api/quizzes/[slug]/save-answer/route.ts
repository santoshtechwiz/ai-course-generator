import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(
  request: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    
    if (!userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    
    const { slug } = params;
    if (!slug) {
      return NextResponse.json({ error: "Quiz slug is required" }, { status: 400 });
    }
    
    const data = await request.json();
    const { questionId, answer, timeSpent } = data;
    
    if (!questionId || answer === undefined) {
      return NextResponse.json({ error: "Question ID and answer are required" }, { status: 400 });
    }

    // Find the quiz
    const quiz = await prisma.userQuiz.findUnique({
      where: { slug },
      select: { id: true }
    });
    
    if (!quiz) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
    }
    
    // Find the question to validate it belongs to this quiz
    const question = await prisma.userQuizQuestion.findFirst({
      where: {
        id: questionId,
        userQuizId: quiz.id
      }
    });
    
    if (!question) {
      return NextResponse.json({ error: "Question not found in this quiz" }, { status: 404 });
    }
    
    // Check if there's an existing in-progress attempt
    let userAttempt = await prisma.userQuizAttempt.findFirst({
      where: {
        userId,
        userQuizId: quiz.id,
        score: null  // Null score indicates in-progress
      },
      include: {
        attemptQuestions: {
          where: {
            questionId
          }
        }
      }
    });
    
    if (userAttempt) {
      // If there's an existing attempt question, update it
      if (userAttempt.attemptQuestions.length > 0) {
        await prisma.userQuizAttemptQuestion.update({
          where: {
            id: userAttempt.attemptQuestions[0].id
          },
          data: {
            userAnswer: answer,
            timeSpent: timeSpent || 0
          }
        });
      } else {
        // Otherwise create a new attempt question
        await prisma.userQuizAttemptQuestion.create({
          data: {
            attemptId: userAttempt.id,
            questionId,
            userAnswer: answer,
            timeSpent: timeSpent || 0
          }
        });
      }
    } else {
      // Create a new attempt with this question
      userAttempt = await prisma.userQuizAttempt.create({
        data: {
          userId,
          userQuizId: quiz.id,
          attemptQuestions: {
            create: {
              questionId,
              userAnswer: answer,
              timeSpent: timeSpent || 0
            }
          }
        }
      });
    }
    
    return NextResponse.json({
      success: true,
      message: "Answer saved successfully",
      attemptId: userAttempt?.attemptQuestions[0]?.id,
    });
  } catch (error: any) {
    console.error("Error saving answer:", error.message);
    return NextResponse.json(
      { error: "An error occurred while saving the answer", details: error.message },
      { status: 500 }
    );
  }
}
