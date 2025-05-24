import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getQuiz } from "@/app/actions/getQuiz";

export async function POST(
  request: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    // Require authentication
    if (!userId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { slug } = params;
    const { answers, timeTaken } = await request.json();

    // Get quiz
    const quizData = await getQuiz(slug);
    if (!quizData) {
      return NextResponse.json(
        { error: "Quiz not found" },
        { status: 404 }
      );
    }

    // Calculate score
    let totalCorrect = 0;
    const questions = quizData.questions || [];
    const maxScore = questions.length;

    // Process each question and calculate score
    const processedAnswers = Object.entries(answers).map(([questionId, answerData]: [string, any]) => {
      const question = questions.find((q: any) => q.id === questionId);
      let isCorrect = false;
      
      if (question && question.type === "blanks") {
        const blanks = question.blanks || [];
        const filledBlanks = answerData.filledBlanks || {};
        
        // Check if all blanks are filled correctly
        isCorrect = blanks.every((blank: any) => {
          const userAnswer = filledBlanks[blank.id]?.toLowerCase().trim();
          const correctAnswer = blank.correctAnswer.toLowerCase().trim();
          return userAnswer === correctAnswer;
        });
        
        if (isCorrect) {
          totalCorrect++;
        }
      }
      
      return {
        questionId,
        isCorrect,
        userAnswer: JSON.stringify(answerData)
      };
    });

    // Calculate percentage
    const percentage = maxScore > 0 ? Math.round((totalCorrect / maxScore) * 100) : 0;
    
    // Save result to database
    const result = await prisma.quizResult.create({
      data: {
        userId,
        quizId: quizData.id || slug,
        quizType: "blanks",
        score: totalCorrect,
        maxScore,
        percentage,
        timeTaken: timeTaken || 0,
        completedAt: new Date(),
        answers: {
          create: processedAnswers
        }
      }
    });

    return NextResponse.json({
      success: true,
      result: {
        id: result.id,
        score: totalCorrect,
        maxScore,
        percentage,
        completedAt: result.completedAt
      }
    });
  } catch (error) {
    console.error("Error submitting quiz:", error);
    return NextResponse.json(
      { error: "Failed to submit quiz" },
      { status: 500 }
    );
  }
}
